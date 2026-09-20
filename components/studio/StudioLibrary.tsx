"use client";

import { useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/studio/Avatar";
import { StudioLightbox } from "@/components/studio/StudioLightbox";
import { useAuth } from "@/components/providers/AuthProvider";
import { getFirebaseAuth } from "@/lib/firebase";
import { removeAsset, restoreAsset, slugify, uploadLibraryImage, upsertAsset } from "@/lib/webtoon/library";
import { libraryWith, REFERENCE_LIBRARY } from "@/lib/webtoon/references";
import { readFileAsDataUrl } from "@/lib/webtoon/studio";
import type { StudioTextBlock } from "@/lib/webtoon/studio-assets";
import type { LibraryOverlay, ReferenceAsset, WebtoonScript } from "@/lib/webtoon/types";

type Kind = "character" | "location";

type StudioLibraryProps = {
  kind: Kind;
  script: WebtoonScript;
  panels: { characters: string[]; location: string }[];
  library: LibraryOverlay;
  setLibrary: (next: LibraryOverlay) => void;
  notify: (message: string) => void;
  /** Production documentation shown under a built-in entry, by subject or location id. */
  docs: Record<string, { role?: string; blocks: StudioTextBlock[]; extra?: { src: string; label: string; note?: string }[] }>;
};

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
export function StudioLibrary({ kind, script, panels, library, setLibrary, notify, docs }: StudioLibraryProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState<{ src: string; label: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
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
    };
    for (const asset of all) consider(asset, false);
    for (const asset of REFERENCE_LIBRARY) if (hidden.has(asset.id)) consider(asset, true);
    for (const entry of map.values()) entry.assets.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    return [...map.values()];
  }, [kind, library]);

  const inStrip = (entry: Entry) =>
    kind === "character" ? panels.some((p) => p.characters.includes(entry.id)) : panels.some((p) => `loc.${p.location}` === entry.id);

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
      next = upsertAsset(next, { ...asset, name: kind === "character" ? `${name}${suffix}` : name });
    }
    persist(next);
  };

  const storeImage = async (asset: ReferenceAsset, dataUrl: string) => {
    let src = dataUrl;
    if (user && dataUrl.startsWith("data:")) {
      try {
        src = await uploadLibraryImage(script.slug, asset.id, dataUrl);
      } catch (error) {
        notify(`Image gardée dans la session seulement : ${error instanceof Error ? error.message : "envoi impossible"}`);
      }
    }
    persist(upsertAsset(library, { ...asset, image: src }));
  };

  const generate = async (entry: Entry, asset: ReferenceAsset) => {
    if (busyId) return;
    if (!asset.must_keep.trim()) {
      notify("Écris d'abord le verrou de design (ce que le modèle doit copier)");
      return;
    }
    setBusyId(asset.id);
    try {
      const response = await fetch(`/api/webtoon/${script.slug}/asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ asset, library }),
      });
      const payload = (await response.json().catch(() => ({}))) as { src?: string; data_url?: string; error?: string };
      const received = payload.src ?? payload.data_url;
      if (!response.ok || !received) {
        notify(payload.error ?? `Erreur ${response.status}`);
        return;
      }
      await storeImage(asset, received);
      notify(`Fiche générée pour ${entry.name}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur de génération");
    } finally {
      setBusyId(null);
    }
  };

  const addImage = (entry: Entry) => {
    const n = entry.assets.length + 1;
    const first = entry.assets[0];
    const asset: ReferenceAsset =
      kind === "character"
        ? { id: `char.${entry.id}.studio-${Date.now().toString(36)}`, kind: "character", subject: entry.id, priority: n, name: `${entry.name}, image ${n}`, image: "", must_keep: first?.must_keep ?? "", description: "Image ajoutée dans le studio.", tags: [entry.id, "studio"] }
        : { id: `loc.${entry.id.replace(/^loc\./, "")}.studio-${Date.now().toString(36)}`, kind: "location", name: `${entry.name}, image ${n}`, image: "", must_keep: first?.must_keep ?? "", description: "Image ajoutée dans le studio.", tags: ["studio"] };
    fileTarget.current = { id: asset.id, entryId: entry.id };
    persist(upsertAsset(library, asset));
    fileInput.current?.click();
  };

  const onFile = async (file: File) => {
    const target = fileTarget.current;
    fileTarget.current = null;
    if (!target) return;
    const asset = libraryWith(library).find((a) => a.id === target.id);
    if (!asset) return;
    setBusyId(asset.id);
    try {
      await storeImage(asset, await readFileAsDataUrl(file));
      notify("Image enregistrée dans la bibliothèque");
    } finally {
      setBusyId(null);
    }
  };

  const create = () => {
    if (!draft?.name.trim()) return;
    const id = slugify(draft.name);
    if (!id) return;
    if (entries.some((e) => e.id === id || e.id === `loc.${id}`)) {
      notify("Cet identifiant existe déjà");
      return;
    }
    const asset: ReferenceAsset =
      kind === "character"
        ? { id: `char.${id}.webtoon`, kind: "character", subject: id, priority: 1, name: `${draft.name.trim()}, webtoon model sheet`, image: "", must_keep: draft.must_keep.trim(), description: "Personnage ajouté dans le studio.", tags: [id, "studio"] }
        : { id: `loc.${id}`, kind: "location", name: draft.name.trim(), image: "", must_keep: draft.must_keep.trim(), description: "Décor ajouté dans le studio.", tags: ["studio"] };
    persist(upsertAsset(library, asset));
    setDraft(null);
    notify(`${kind === "character" ? "Personnage" : "Décor"} ajouté : génère sa fiche ou ajoute une image`);
  };

  const remove = (entry: Entry) => {
    if (!window.confirm(`Retirer ${entry.name} de la bibliothèque ? Ses fiches ne seront plus jointes aux prompts.`)) return;
    let next = library;
    for (const asset of entry.assets) next = removeAsset(next, asset.id, BUILT_IN_IDS.has(asset.id));
    persist(next);
  };

  const restore = (entry: Entry) => {
    let next = library;
    for (const asset of entry.assets) next = restoreAsset(next, asset.id);
    persist(next);
  };

  const noun = kind === "character" ? "personnage" : "décor";

  return (
    <div className="space-y-4">
      <section className="studio-card studio-library-head">
        <div>
          <p className="anime-label text-xs text-cyan-pale">Bibliothèque de références</p>
          <h2 className="font-display text-lg text-lily">{entries.filter((e) => !e.hidden).length} {noun}{entries.length > 1 ? "s" : ""}</h2>
          <p className="text-xs text-ivory/60">
            Tout ce qui est ici est joint aux prompts des cases qui le nomment : les fiches d&apos;un personnage coché, la fiche du lieu choisi. Le verrou de design est le texte injecté dans chaque prompt.
            {user ? "" : " Sans compte, les changements restent dans la session."}
          </p>
        </div>
        {draft ? (
          <div className="studio-library-form">
            <input placeholder={kind === "character" ? "Nom du personnage" : "Nom du décor"} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
            <textarea rows={4} placeholder="Verrou de design : ce que le modèle doit copier exactement (silhouette, couleurs, matières, détails qui ne changent jamais)." value={draft.must_keep} onChange={(e) => setDraft({ ...draft, must_keep: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" className="webtoon-mini studio-primary" onClick={create} disabled={!draft.name.trim()}>Créer</button>
              <button type="button" className="webtoon-mini" onClick={() => setDraft(null)}>Annuler</button>
            </div>
          </div>
        ) : (
          <button type="button" className="webtoon-mini studio-primary" onClick={() => setDraft({ name: "", must_keep: "" })}>+ Nouveau {noun}</button>
        )}
      </section>

      <div className="studio-grid">
        {entries.map((entry) => {
          const doc = docs[entry.id.replace(/^loc\./, "")];
          const primary = entry.assets[0];
          return (
            <article key={entry.id} className={`studio-card studio-character ${inStrip(entry) ? "is-in-strip" : ""} ${entry.hidden ? "is-hidden" : ""}`}>
              <header className="studio-card-head">
                {kind === "character" ? <Avatar image={entry.assets.find((a) => a.image)?.image} name={entry.name} crop={entry.assets.find((a) => a.image)?.avatar} size={56} /> : null}
                <div className="min-w-0 flex-1">
                  <p className="anime-label text-xs text-cyan-pale">
                    {entry.hidden ? "Retiré" : inStrip(entry) ? "Dans la bande" : entry.builtIn ? "Bibliothèque du moteur" : "Ajouté dans le studio"}
                    {" · "}
                    <code>{entry.id}</code>
                  </p>
                  <input className="studio-library-name font-display text-xl text-lily" value={entry.name} onChange={(e) => rename(entry, e.target.value)} disabled={entry.hidden} aria-label="Nom" />
                  {doc?.role ? <p className="text-sm text-ivory/80">{doc.role}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.hidden ? (
                    <button type="button" className="webtoon-mini" onClick={() => restore(entry)}>Restaurer</button>
                  ) : (
                    <>
                      <button type="button" className="webtoon-mini" onClick={() => addImage(entry)} disabled={busyId !== null}>+ Image</button>
                      <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => remove(entry)}>Retirer</button>
                    </>
                  )}
                </div>
              </header>

              {!entry.hidden ? (
                <>
                  <div className="studio-images">
                    {entry.assets.map((asset) => (
                      <div key={asset.id} className="studio-image studio-library-image">
                        {asset.image ? (
                          <button type="button" onClick={() => setOpen({ src: asset.image, label: asset.name })}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={asset.image} alt={asset.name} loading="lazy" />
                          </button>
                        ) : (
                          <div className="studio-library-empty">{busyId === asset.id ? <span className="studio-spinner studio-spinner-lg" aria-hidden /> : "pas d'image"}</div>
                        )}
                        <span>{asset.name.includes(",") ? asset.name.slice(asset.name.indexOf(",") + 1).trim() : asset.kind === "style" ? "Ancre de style" : "Fiche"}</span>
                        <div className="flex flex-wrap gap-1">
                          {asset.kind !== "style" ? (
                            <button type="button" className="webtoon-mini" onClick={() => generate(entry, asset)} disabled={busyId !== null} title="Dessine la fiche avec GPT Image 2.5 à partir du verrou de design et des autres images">
                              {busyId === asset.id ? "…" : asset.image ? "Regénérer (IA)" : "Générer (IA)"}
                            </button>
                          ) : null}
                          <button type="button" className="webtoon-mini" onClick={() => { fileTarget.current = { id: asset.id, entryId: entry.id }; fileInput.current?.click(); }} disabled={busyId !== null}>Remplacer</button>
                          {entry.assets.length > 1 ? (
                            <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => persist(removeAsset(library, asset.id, BUILT_IN_IDS.has(asset.id)))} disabled={busyId !== null}>×</button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {doc?.extra?.map((image) => (
                      <button key={image.src} type="button" className="studio-image" onClick={() => setOpen({ src: image.src, label: `${entry.name} · ${image.label}` })}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.src} alt={`${entry.name}, ${image.label}`} loading="lazy" />
                        <span>{image.label}</span>
                        {image.note ? <small>{image.note}</small> : null}
                      </button>
                    ))}
                  </div>
                  <label className="webtoon-field">
                    <span>Verrou de design (injecté dans chaque prompt qui nomme ce {noun})</span>
                    <textarea rows={5} value={primary?.must_keep ?? ""} onChange={(e) => updateLock(entry, e.target.value)} />
                  </label>
                  {doc?.blocks.map((block) => (
                    <details key={block.title} className="studio-details">
                      <summary>{block.title}</summary>
                      <pre className="studio-text">{block.text}</pre>
                    </details>
                  ))}
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
