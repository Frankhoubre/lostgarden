"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/studio/Avatar";
import { ProgressBar } from "@/components/studio/ProgressBar";
import { StudioLightbox } from "@/components/studio/StudioLightbox";
import { useAuth } from "@/components/providers/AuthProvider";
import { getFirebaseAuth } from "@/lib/firebase";
import { removeAsset, restoreAsset, slugify, uploadLibraryImage, upsertAsset } from "@/lib/webtoon/library";
import { libraryWith, REFERENCE_LIBRARY } from "@/lib/webtoon/references";
import { readFileAsDataUrl } from "@/lib/webtoon/studio";
import { mergeInPanels } from "@/lib/webtoon/editor-ops";
import type { LibraryOverlay, ReferenceAsset, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

type Kind = "character" | "location" | "object";

type StudioLibraryProps = {
  kind: Kind;
  script: WebtoonScript;
  panels: WebtoonPanel[];
  /** To merge two entries: the panels that name one are switched to the other. */
  setPanels?: (next: WebtoonPanel[]) => void;
  library: LibraryOverlay;
  setLibrary: (next: LibraryOverlay) => void;
  notify: (message: string) => void;
};

/** A sheet takes about a minute (drawing, text check, sometimes a second drawing). */
const SHEET_ESTIMATE_MS = 75_000;

type Entry = {
  id: string;
  name: string;
  assets: ReferenceAsset[];
  builtIn: boolean;
  hidden: boolean;
};

const BUILT_IN_IDS = new Set(REFERENCE_LIBRARY.map((a) => a.id));

async function studioHeaders(): Promise<Record<string, string>> {
  const token = (await getFirebaseAuth().currentUser?.getIdToken().catch(() => "")) ?? "";
  if (token) return { Authorization: `Bearer ${token}` };
  if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("dev")) return { "x-studio-dev": "1" };
  return {};
}

/**
 * The editable library of one kind: characters (grouped by subject, several
 * sheets each) or locations (one sheet each). Add, describe, replace or
 * generate the images, remove; the engine attaches what is here to every
 * prompt that names the character or the place.
 */
export function StudioLibrary({ kind, script, panels, setPanels, library, setLibrary, notify }: StudioLibraryProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState<{ src: string; label: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyStart, setBusyStart] = useState(0);
  const [busyKind, setBusyKind] = useState<"sheet" | "webtonize">("sheet");
  // The latest library, for what lands after a minute of drawing: the author kept editing meanwhile.
  const libraryRef = useRef(library);
  useEffect(() => {
    libraryRef.current = library;
  }, [library]);
  const [draft, setDraft] = useState<{ name: string; must_keep: string } | null>(null);
  const fileTarget = useRef<{ id: string; entryId: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const all = libraryWith(library);
    const hidden = new Set(library.hidden);
    const map = new Map<string, Entry>();
    const push = (id: string, name: string, asset: ReferenceAsset, isHidden: boolean) => {
      const entry = map.get(id) ?? { id, name, assets: [], builtIn: false, hidden: isHidden };
      entry.assets.push(asset);
      entry.builtIn = entry.builtIn || BUILT_IN_IDS.has(asset.id);
      entry.hidden = entry.hidden && isHidden;
      map.set(id, entry);
    };
    const consider = (asset: ReferenceAsset, isHidden: boolean) => {
      if (kind === "character" && asset.kind === "character" && asset.subject) push(asset.subject, asset.name.split(",")[0], asset, isHidden);
      if (kind === "location" && (asset.kind === "location" || asset.kind === "style")) push(asset.id, asset.name, asset, isHidden);
      if (kind === "object" && asset.kind === "object") push(asset.id, asset.name.split(",")[0], asset, isHidden);
    };
    for (const asset of all) consider(asset, false);
    for (const asset of REFERENCE_LIBRARY) if (hidden.has(asset.id)) consider(asset, true);
    for (const entry of map.values()) entry.assets.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    return [...map.values()];
  }, [kind, library]);

  const inStrip = (entry: Entry) =>
    kind === "character" ? panels.some((p) => p.characters.includes(entry.id)) : kind === "object" ? panels.some((p) => (p.objects ?? []).some((o) => `obj.${o}` === entry.id)) : panels.some((p) => `loc.${p.location}` === entry.id);

  const persist = (next: LibraryOverlay) => setLibrary(next);

  const updateLock = (entry: Entry, must_keep: string) => {
    let next = library;
    for (const asset of entry.assets) next = upsertAsset(next, { ...asset, must_keep });
    persist(next);
  };

  const rename = (entry: Entry, name: string) => {
    let next = library;
    for (const asset of entry.assets) {
      const suffix = asset.name.includes(",") ? asset.name.slice(asset.name.indexOf(",")) : "";
      next = upsertAsset(next, { ...asset, name: kind === "location" ? name : `${name}${suffix}` });
    }
    persist(next);
  };

  /** Stores the image and sets it on the entry; `imported` also keeps it as the author's imported image. */
  const storeImage = async (asset: ReferenceAsset, dataUrl: string, extra: Partial<ReferenceAsset> = {}, imported = false) => {
    let src = dataUrl;
    if (user && dataUrl.startsWith("data:")) {
      try {
        src = await uploadLibraryImage(script.slug, asset.id, dataUrl);
      } catch (error) {
        notify(`Image gardée dans la session seulement : ${error instanceof Error ? error.message : "envoi impossible"}`);
      }
    }
    const latest = libraryWith(libraryRef.current).find((a) => a.id === asset.id) ?? asset;
    persist(upsertAsset(libraryRef.current, { ...latest, image: src, ...extra, ...(imported ? { imported_image: src } : {}) }));
    return src;
  };

  /**
   * Draw the sheet. With `webtonize`, the author's imported image is the design to copy exactly,
   * redrawn in the webtoon style as the sheet (front, side, back on white); the imported image stays
   * on the entry, to redraw it again or bring it back.
   */
  const generate = async (entry: Entry, asset: ReferenceAsset, webtonize?: string) => {
    if (busyId) return;
    if (!asset.must_keep.trim() && !webtonize) {
      notify("Écris d'abord le verrou de design (ce que le modèle doit copier)");
      return;
    }
    setBusyId(asset.id);
    setBusyStart(Date.now());
    setBusyKind(webtonize ? "webtonize" : "sheet");
    try {
      const response = await fetch(`/api/webtoon/${script.slug}/asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ asset, library, ...(webtonize ? { webtonize } : {}) }),
      });
      const payload = (await response.json().catch(() => ({}))) as { src?: string; data_url?: string; error?: string };
      const received = payload.src ?? payload.data_url;
      if (!response.ok || !received) {
        notify(payload.error ?? `Erreur ${response.status}`);
        return;
      }
      await storeImage(asset, received, webtonize ? { imported_image: webtonize } : {});
      notify(webtonize ? `${entry.name} webtonisé : l'image importée est gardée` : `Fiche générée pour ${entry.name}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur de génération");
    } finally {
      setBusyId(null);
    }
  };

  const onFile = async (file: File) => {
    const target = fileTarget.current;
    fileTarget.current = null;
    if (!target) return;
    const asset = libraryWith(library).find((a) => a.id === target.id);
    if (!asset) return;
    setBusyId(asset.id);
    try {
      // The imported image is remembered: "Webtoniser" redraws it in the style of the webtoon.
      await storeImage(asset, await readFileAsDataUrl(file), {}, true);
      notify("Image importée : « Webtoniser » la redessine dans le style du webtoon");
    } finally {
      setBusyId(null);
    }
  };

  const create = () => {
    if (!draft?.name.trim()) return;
    const id = slugify(draft.name);
    if (!id) return;
    if (entries.some((e) => e.id === id || e.id === `loc.${id}` || e.id === `obj.${id}`)) {
      notify("Cet identifiant existe déjà");
      return;
    }
    const asset: ReferenceAsset =
      kind === "character"
        ? { id: `char.${id}.webtoon`, kind: "character", subject: id, priority: 1, name: `${draft.name.trim()}, webtoon model sheet`, image: "", must_keep: draft.must_keep.trim(), description: "Personnage ajouté dans le studio.", tags: [id, "studio"] }
        : kind === "object"
          ? { id: `obj.${id}`, kind: "object", name: draft.name.trim(), image: "", must_keep: draft.must_keep.trim(), description: "Objet ajouté dans le studio.", tags: ["studio"] }
          : { id: `loc.${id}`, kind: "location", name: draft.name.trim(), image: "", must_keep: draft.must_keep.trim(), description: "Décor ajouté dans le studio.", tags: ["studio"] };
    persist(upsertAsset(library, asset));
    setDraft(null);
    notify(`${kind === "character" ? "Personnage" : kind === "object" ? "Objet" : "Décor"} ajouté : génère sa fiche ou ajoute une image`);
  };

  const remove = (entry: Entry) => {
    if (!window.confirm(`Retirer ${entry.name} de la bibliothèque ? Ses fiches ne seront plus jointes aux prompts.`)) return;
    let next = library;
    for (const asset of entry.assets) next = removeAsset(next, asset.id, BUILT_IN_IDS.has(asset.id));
    persist(next);
  };

  /** The id panels use for an entry: the subject for a character, the id without prefix for an object or a place. */
  const panelId = (entry: Entry) => (kind === "location" ? entry.id.replace(/^loc\./, "") : kind === "object" ? entry.id.replace(/^obj\./, "") : entry.id);

  const merge = (entry: Entry, targetId: string) => {
    const target = entries.find((e) => e.id === targetId);
    if (!target || !setPanels) return;
    const from = panelId(entry);
    const to = panelId(target);
    const named = mergeInPanels(panels, kind, from, to);
    const keep = kind === "character" && entry.assets.some((a) => a.image);
    if (!window.confirm(`Fusionner « ${entry.name} » dans « ${target.name} » ? ${named.changed} case${named.changed > 1 ? "s" : ""} qui le nomment nommeront ${target.name} (leur image reste ; « Regénérer » une case si son dessin est faux) ; ${keep ? `ses fiches passent chez ${target.name}, après les siennes (le × les retire)` : `les fiches de ${entry.name} sont retirées`}.`)) return;
    let next = library;
    const last = Math.max(0, ...target.assets.map((a) => a.priority ?? 1));
    entry.assets.forEach((asset, i) => {
      // A character's other sheets are views of the same being (the Source: its face, its hands, the whole tree): they move, after the target's own.
      if (keep && asset.image && !BUILT_IN_IDS.has(asset.id)) next = upsertAsset(next, { ...asset, subject: target.id, priority: last + 1 + i, name: `${target.name}, ${asset.name.split(",")[0]}`, tags: [...new Set([target.id, ...(asset.tags ?? []).filter((t) => t !== entry.id)])] });
      else next = removeAsset(next, asset.id, BUILT_IN_IDS.has(asset.id));
    });
    persist(next);
    setPanels(named.panels);
    notify(`${entry.name} fusionné dans ${target.name} : ${named.changed} case${named.changed > 1 ? "s" : ""} le nomment désormais`);
  };

  const restore = (entry: Entry) => {
    let next = library;
    for (const asset of entry.assets) next = restoreAsset(next, asset.id);
    persist(next);
  };

  const noun = kind === "character" ? "personnage" : kind === "object" ? "objet" : "décor";
  const newNoun = kind === "object" ? "Nouvel objet" : `Nouveau ${noun}`;
  const thisNoun = kind === "object" ? "cet objet" : `ce ${noun}`;

  return (
    <div className="space-y-4">
      <section className="studio-card studio-library-head">
        <div>
          <p className="anime-label text-xs text-cyan-pale">Bibliothèque de références</p>
          <h2 className="font-display text-lg text-lily">{entries.filter((e) => !e.hidden).length} {noun}{entries.length > 1 ? "s" : ""}</h2>
          <p className="text-xs text-ivory/60">
            Tout ce qui est ici est joint aux prompts des cases qui le nomment : les fiches d&apos;un personnage coché, la fiche du lieu choisi, la fiche d&apos;un objet coché. Le verrou de design est le texte injecté dans chaque prompt.
            {kind !== "location" ? " La suite de l'histoire ajoute d'elle-même une fiche, dessinée depuis les images du film, à chaque objet, créature ou machine qu'elle rencontre sans fiche." : ""}
            {user ? "" : " Sans compte, les changements restent dans la session."}
          </p>
        </div>
        {draft ? (
          <div className="studio-library-form">
            <input placeholder={kind === "character" ? "Nom du personnage" : kind === "object" ? "Nom de l'objet" : "Nom du décor"} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
            <textarea rows={4} placeholder="Verrou de design : ce que le modèle doit copier exactement (silhouette, couleurs, matières, détails qui ne changent jamais)." value={draft.must_keep} onChange={(e) => setDraft({ ...draft, must_keep: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" className="webtoon-mini studio-primary" onClick={create} disabled={!draft.name.trim()}>Créer</button>
              <button type="button" className="webtoon-mini" onClick={() => setDraft(null)}>Annuler</button>
            </div>
          </div>
        ) : (
          <button type="button" className="webtoon-mini studio-primary" onClick={() => setDraft({ name: "", must_keep: "" })}>+ {newNoun}</button>
        )}
      </section>

      <div className="studio-grid">
        {entries.map((entry) => {
          const primary = entry.assets[0];
          // One sheet per entry: the first one with an image, the first one otherwise. The others stay out of the prompts.
          const sheet = entry.assets.find((a) => a.image) ?? primary;
          return (
            <article key={entry.id} className={`studio-card studio-character ${inStrip(entry) ? "is-in-strip" : ""} ${entry.hidden ? "is-hidden" : ""}`}>
              <header className="studio-card-head">
                {kind === "character" ? <Avatar image={entry.assets.find((a) => a.image)?.image} name={entry.name} crop={entry.assets.find((a) => a.image)?.avatar} size={56} /> : kind === "object" ? <Avatar image={entry.assets.find((a) => a.image)?.image} name={entry.name} mode="cover" size={56} /> : null}
                <div className="min-w-0 flex-1">
                  <p className="anime-label text-xs text-cyan-pale">
                    {entry.hidden ? "Retiré" : inStrip(entry) ? "Dans la bande" : entry.builtIn ? "Bibliothèque du moteur" : "Ajouté dans le studio"}
                    {" · "}
                    <code>{entry.id}</code>
                  </p>
                  <input className="studio-library-name font-display text-xl text-lily" value={entry.name} onChange={(e) => rename(entry, e.target.value)} disabled={entry.hidden} aria-label="Nom" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.hidden ? (
                    <button type="button" className="webtoon-mini" onClick={() => restore(entry)}>Restaurer</button>
                  ) : (
                    <>
                      {setPanels && entries.filter((e) => e.id !== entry.id && !e.hidden).length ? (
                        <select
                          className="webtoon-mini"
                          value=""
                          onChange={(e) => e.target.value && merge(entry, e.target.value)}
                          title={`${entry.name} est la même chose qu'une autre entrée : ses cases passent à l'autre, ses fiches sont retirées`}
                          aria-label="Fusionner avec"
                        >
                          <option value="">Fusionner avec…</option>
                          {entries
                            .filter((e) => e.id !== entry.id && !e.hidden)
                            .map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                      ) : null}
                      <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => remove(entry)}>Retirer</button>
                    </>
                  )}
                </div>
              </header>

              {!entry.hidden ? (
                <>
                  {sheet ? (
                    <div className="studio-sheet">
                      {sheet.image ? (
                        <button type="button" className="studio-sheet-image" onClick={() => setOpen({ src: sheet.image, label: entry.name })}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sheet.image} alt={entry.name} loading="lazy" />
                        </button>
                      ) : (
                        <div className="studio-sheet-image studio-sheet-empty">
                          {busyId === sheet.id ? <span className="studio-spinner studio-spinner-lg" aria-hidden /> : <span>Pas encore de {kind === "location" ? "vue du décor" : "fiche"}</span>}
                        </div>
                      )}
                      {busyId === sheet.id ? <ProgressBar startedAt={busyStart} estimateMs={SHEET_ESTIMATE_MS} label={busyKind === "webtonize" ? "Webtonisation en cours" : kind === "location" ? "Vue aérienne en cours" : "Fiche en cours"} /> : null}
                      <div className="studio-sheet-actions">
                        <span className="studio-sheet-caption">{kind === "location" ? "Vue aérienne du décor" : "Fiche · face, profil, dos · fond blanc"}</span>
                        {sheet.kind !== "style" ? (
                          <button type="button" className="webtoon-mini studio-primary" onClick={() => generate(entry, sheet)} disabled={busyId !== null} title={kind === "location" ? "Dessine une vue aérienne du lieu, son ambiance et ce qui l'entoure" : "Dessine la fiche : trois vues en pied (face, profil, dos) sur fond blanc, sans texte"}>
                            {busyId === sheet.id ? "…" : sheet.image ? "Regénérer" : "Générer"}
                          </button>
                        ) : null}
                        {sheet.image || sheet.imported_image ? (
                          <button
                            type="button"
                            className="webtoon-mini"
                            onClick={() => void generate(entry, sheet, sheet.imported_image ?? sheet.image)}
                            disabled={busyId !== null}
                            title={sheet.imported_image ? "Redessine l'image importée dans le style du webtoon, en fiche (face, profil, dos, fond blanc), sans rien changer au design" : "Redessine cette image dans le style du webtoon, en fiche (face, profil, dos, fond blanc), sans rien changer au design"}
                          >
                            {busyId === sheet.id && busyKind === "webtonize" ? "…" : "Webtoniser"}
                          </button>
                        ) : null}
                        {sheet.imported_image && sheet.image !== sheet.imported_image ? (
                          <button type="button" className="webtoon-mini" onClick={() => persist(upsertAsset(library, { ...sheet, image: sheet.imported_image! }))} disabled={busyId !== null} title="Remet l'image importée telle quelle">
                            Image importée
                          </button>
                        ) : null}
                        <button type="button" className="webtoon-mini" onClick={() => { fileTarget.current = { id: sheet.id, entryId: entry.id }; fileInput.current?.click(); }} disabled={busyId !== null} title="Importer une image de votre ordinateur (photo, dessin, autre style)">Importer</button>
                      </div>
                    </div>
                  ) : null}
                  <label className="webtoon-field">
                    <span>Verrou de design (injecté dans chaque prompt qui nomme {thisNoun})</span>
                    <textarea rows={4} value={primary?.must_keep ?? ""} onChange={(e) => updateLock(entry, e.target.value)} />
                  </label>
                </>
              ) : null}
            </article>
          );
        })}
      </div>
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
      <StudioLightbox src={open?.src ?? null} label={open?.label} onClose={() => setOpen(null)} />
    </div>
  );
}
