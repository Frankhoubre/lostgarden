"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StudioLightbox } from "@/components/studio/StudioLightbox";
import { useAuth } from "@/components/providers/AuthProvider";
import { assetStep, BIBLE_STEPS, candidateAsset, slugId, type BibleCandidate, type BibleStep } from "@/lib/webtoon/bible";
import { removeAsset, upsertAsset } from "@/lib/webtoon/library";
import { frameLabel, type StudioProject } from "@/lib/webtoon/project";
import { uploadReference } from "@/lib/webtoon/projects-client";
import { importedAsset, loadPreviousCast, type PreviousEntry } from "@/lib/webtoon/cross-project";
import { libraryWith } from "@/lib/webtoon/references";
import { sheetKind, sheetPrompt, SHEET_KIND_LABEL } from "@/lib/webtoon/sheet-prompt";
import { ProgressBar } from "@/components/studio/ProgressBar";
import { studioHeaders } from "@/lib/webtoon/studio-headers";
import { bibleFor } from "@/lib/webtoon/style-bible";
import type { LibraryOverlay, ReferenceAsset } from "@/lib/webtoon/types";

type Frame = { src: string; seconds: number; label: string };

type Props = {
  step: BibleStep;
  project: StudioProject;
  /** Updates run on the latest project: a detection and an edit may overlap. */
  updateProject: (change: (current: StudioProject) => StudioProject) => void;
  frames: Frame[];
  library: LibraryOverlay;
  /** Updates run on the latest library: several sheets are drawn while the author keeps editing. */
  updateLibrary: (change: (current: LibraryOverlay) => LibraryOverlay) => void;
  notify: (message: string) => void;
};

const MAX_SOURCES = 6;
const isFilm = (src: string) => /\/film\/|%2Ffilm%2F/.test(src);

/**
 * One step of the bible (characters, objects, locations). Top: what the
 * detection proposes, each with the frames where it was seen best already
 * chosen as references; the author keeps it (it enters the bible), rejects
 * it, or corrects it first. Below: what the bible holds for this step, each
 * with its references (frames of the film, images of the author), the
 * prepared prompt of its sheet (shown, editable, restorable), and the sheet
 * itself, generated on demand.
 */
export function StudioBibleStep({ step, project, updateProject, frames, library, updateLibrary, notify }: Props) {
  const { user } = useAuth();
  const meta = BIBLE_STEPS.find((s) => s.id === step) ?? BIBLE_STEPS[0];
  const bible = bibleFor(project.style);
  const bySecond = useMemo(() => new Map(frames.map((f) => [f.seconds, f.src])), [frames]);
  const all = useMemo(() => libraryWith(library), [library]);
  const kept = all.filter((a) => assetStep(a) === step && (a.kind !== "character" || (a.priority ?? 1) === 1));
  const candidates = project.candidates?.[step] ?? [];
  const [detecting, setDetecting] = useState(false);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  /** When each sheet started drawing, for its progress bar. */
  const [busySince, setBusySince] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<{ src: string; label: string } | null>(null);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [manual, setManual] = useState<{ name: string; must_keep: string } | null>(null);
  const uploadTarget = useRef<string | null>(null);
  /** Who and what the author's other projects hold: recognised by the detection, or added by hand. */
  const [previousCast, setPreviousCast] = useState<PreviousEntry[]>([]);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadPreviousCast(project.id)
      .then((list) => {
        if (!cancelled) setPreviousCast(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, project.id]);
  const stepKind = step === "characters" ? "character" : step === "objects" ? "object" : "location";
  const previousForStep = previousCast.filter((p) => p.kind === stepKind);
  const inBible = new Set(all.map((a) => a.id));
  const previousAvailable = previousForStep.filter((p) => !inBible.has(p.asset.id));
  const [showPrevious, setShowPrevious] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const frameOf = (seconds: number) => bySecond.get(seconds);
  const chosen = (c: BibleCandidate) => picked[c.id] ?? c.best_seconds.map(frameOf).filter((src): src is string => Boolean(src)).slice(0, 3);
  const changeCandidates = (change: (list: BibleCandidate[]) => BibleCandidate[]) =>
    updateProject((current) => ({ ...current, candidates: { ...current.candidates, [step]: change(current.candidates?.[step] ?? []) } }));
  const updateCandidate = (id: string, changes: Partial<BibleCandidate>) => changeCandidates((list) => list.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  const updateAsset = (asset: ReferenceAsset, changes: Partial<ReferenceAsset> | ((latest: ReferenceAsset) => Partial<ReferenceAsset>)) =>
    updateLibrary((current) => {
      const latest = libraryWith(current).find((a) => a.id === asset.id) ?? asset;
      return upsertAsset(current, { ...latest, ...(typeof changes === "function" ? changes(latest) : changes) });
    });

  const detect = async () => {
    setDetecting(true);
    try {
      const known = all.filter((a) => ["character", "object", "location"].includes(a.kind)).map((a) => ({ id: a.id, name: a.name.split(",")[0], kind: a.kind, must_keep: a.must_keep }));
      const response = await fetch(`/api/webtoon/${project.id}/bible`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({
          step,
          known,
          previous: previousAvailable.map((p) => ({ id: p.asset.id, name: p.name, kind: p.kind, must_keep: p.asset.must_keep, project: p.project_title, image: p.asset.image || undefined })),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { candidates?: BibleCandidate[]; error?: string; note?: string };
      if (!response.ok) return notify(payload.error ?? `Détection impossible (${response.status})`);
      const found = payload.candidates ?? [];
      changeCandidates((list) => [...list, ...found.filter((c) => !list.some((x) => x.id === c.id))]);
      const known2 = found.filter((c) => c.same_as).length;
      notify(found.length ? `${found.length} proposition${found.length > 1 ? "s" : ""} à valider${known2 ? `, dont ${known2} déjà dans vos projets précédents` : ""}` : (payload.note ?? `Aucun ${meta.noun} de plus trouvé`));
    } catch (error) {
      notify(error instanceof Error ? error.message : "Détection impossible");
    } finally {
      setDetecting(false);
    }
  };

  const keep = (candidate: BibleCandidate) => {
    const asset = { ...candidateAsset(candidate), sources: chosen(candidate), seen_seconds: candidate.seconds };
    updateLibrary((current) => upsertAsset(current, asset));
    changeCandidates((list) => list.filter((c) => c.id !== candidate.id));
  };
  const reject = (candidate: BibleCandidate) => changeCandidates((list) => list.filter((c) => c.id !== candidate.id));
  const matchOf = (candidate: BibleCandidate) => (candidate.same_as ? previousCast.find((p) => p.asset.id === candidate.same_as) : undefined);
  /** The candidate is someone of an earlier project: its sheet, id and design lock come along, the frames of this film are added. */
  const takeOver = (candidate: BibleCandidate, entry: PreviousEntry) => {
    const sources = [...new Set([...(entry.asset.sources ?? []), ...chosen(candidate)])].slice(-MAX_SOURCES);
    updateLibrary((current) => upsertAsset(current, importedAsset(entry, { sources, seen_seconds: candidate.seconds })));
    changeCandidates((list) => list.filter((c) => c.id !== candidate.id));
    notify(`${entry.name} repris de « ${entry.project_title} », avec sa fiche`);
  };
  const [matching, setMatching] = useState(false);
  /** Candidates detected before the earlier projects were known: which of them are someone of those projects. */
  const matchWithPrevious = async () => {
    const open = candidates.filter((c) => !c.same_as);
    if (!open.length || !previousAvailable.length) return;
    setMatching(true);
    try {
      const response = await fetch(`/api/webtoon/${project.id}/bible`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({
          step,
          match: open.map((c) => ({ id: c.id, name: c.name, kind: c.kind, must_keep: c.must_keep, description: c.description, frames: chosen(c).slice(0, 1) })),
          previous: previousAvailable.map((p) => ({ id: p.asset.id, name: p.name, kind: p.kind, must_keep: p.asset.must_keep, project: p.project_title, image: p.asset.image || undefined })),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { matches?: Record<string, string>; error?: string };
      if (!response.ok) return notify(payload.error ?? `Rapprochement impossible (${response.status})`);
      const matches = payload.matches ?? {};
      changeCandidates((list) => list.map((c) => (matches[c.id] ? { ...c, same_as: matches[c.id] } : c)));
      const n = Object.keys(matches).length;
      notify(n ? `${n} déjà connu${n > 1 ? "s" : ""} dans vos projets précédents : « Reprendre sa fiche »` : "Aucun de ces candidats n'est dans vos projets précédents");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Rapprochement impossible");
    } finally {
      setMatching(false);
    }
  };

  const addPrevious = (entry: PreviousEntry) => {
    updateLibrary((current) => upsertAsset(current, importedAsset(entry)));
    notify(`${entry.name} ajouté depuis « ${entry.project_title} », avec sa fiche`);
  };

  const addManual = () => {
    if (!manual?.name.trim()) return;
    const id = slugId(manual.name);
    if (!id) return;
    const kind: BibleCandidate["kind"] = step === "objects" ? "object" : step === "locations" ? "location" : "character";
    const asset = candidateAsset({ id, name: manual.name.trim(), kind, must_keep: manual.must_keep.trim() || manual.name.trim(), description: "", seconds: [], best_seconds: [], importance: "secondary" });
    updateLibrary((current) => upsertAsset(current, { ...asset, sources: [] }));
    setManual(null);
    notify(`${manual.name.trim()} ajouté : ajoutez des images de référence puis générez la fiche`);
  };

  /** Draws the sheet; with `webtonize`, the author's image is the design, redrawn in the style of the webtoon. */
  const generate = async (asset: ReferenceAsset, webtonize?: string) => {
    if (!asset.must_keep.trim() && !webtonize) return notify("Écrivez d'abord ce que la fiche doit respecter (verrou de design)");
    setBusy((b) => new Set(b).add(asset.id));
    setBusySince((m) => ({ ...m, [asset.id]: Date.now() }));
    try {
      const sources = asset.sources ?? [];
      const response = await fetch(`/api/webtoon/${project.id}/asset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({
          asset,
          library,
          frames: webtonize ? [] : sources.filter(isFilm),
          references: sources.filter((s) => !isFilm(s) && s !== webtonize),
          prompt: asset.sheet_prompt || undefined,
          ...(webtonize ? { webtonize } : {}),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { src?: string; data_url?: string; error?: string; attempts?: number; check?: { has_text?: boolean } };
      const received = payload.src ?? payload.data_url;
      if (!response.ok || !received) return notify(`${asset.name.split(",")[0]} : ${payload.error ?? `erreur ${response.status}`}`);
      // The library changed while the sheet was drawn (other sheets, edits): only the image is set, on the latest entry.
      updateAsset(asset, webtonize ? { image: received, imported_image: webtonize } : { image: received });
      notify(`${webtonize ? `${asset.name.split(",")[0]} webtonisé` : `Fiche de ${asset.name.split(",")[0]} prête`}${payload.attempts && payload.attempts > 1 ? " (redessinée une fois : texte ou fond à corriger)" : ""}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Génération impossible");
    } finally {
      setBusy((b) => {
        const next = new Set(b);
        next.delete(asset.id);
        return next;
      });
    }
  };

  const generateMissing = async () => {
    // Two at a time: each sheet waits most of its minute on the image model.
    const queue = kept.filter((a) => !a.image);
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) await generate(next);
    };
    await Promise.all([worker(), worker()]);
  };

  const onUpload = async (file: File) => {
    const id = uploadTarget.current;
    uploadTarget.current = null;
    if (!id) return;
    const asset = all.find((a) => a.id === id);
    if (!asset) return;
    if (!user) return notify("Connectez-vous pour envoyer une image");
    setBusy((b) => new Set(b).add(id));
    try {
      const src = await uploadReference(project.id, id, file);
      updateAsset(asset, (latest) => ({ sources: [...(latest.sources ?? []), src].slice(-MAX_SOURCES) }));
    } catch (error) {
      notify(`Envoi impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setBusy((b) => {
        const next = new Set(b);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleSource = (asset: ReferenceAsset, src: string) =>
    updateAsset(asset, (latest) => {
      const sources = latest.sources ?? [];
      return { sources: sources.includes(src) ? sources.filter((x) => x !== src) : [...sources, src].slice(-MAX_SOURCES) };
    });

  return (
    <div className="space-y-5">
      <section className="studio-card studio-bible-head">
        <div>
          <p className="anime-label text-xs text-cyan-pale">{meta.label}</p>
          <p className="text-sm text-ivory/80">{meta.hint}</p>
          <p className="mt-1 text-xs text-ivory/55">
            {frames.length ? "La détection lit des images réparties sur tout le film, puis regroupe ce qu'elle a vu." : "Pas de film : la détection lit le synopsis et le scénario."} Rien n&apos;entre dans la bible sans votre accord.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="webtoon-mini studio-primary" onClick={() => void detect()} disabled={detecting}>
            {detecting ? <><span className="studio-spinner" aria-hidden /> Détection…</> : frames.length ? "Détecter dans le film" : "Détecter dans le scénario"}
          </button>
          <button type="button" className="webtoon-mini" onClick={() => setManual({ name: "", must_keep: "" })}>+ Ajouter à la main</button>
        </div>
      </section>

      {manual ? (
        <section className="studio-card space-y-2">
          <p className="anime-label text-xs text-cyan-pale">Nouveau {meta.noun}</p>
          <input className="studio-input" placeholder="Nom" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} autoFocus />
          <textarea className="studio-textarea" rows={3} placeholder="À quoi il ressemble, précisément : forme, couleurs, matières, détails qui ne changent jamais (en anglais de préférence)." value={manual.must_keep} onChange={(e) => setManual({ ...manual, must_keep: e.target.value })} />
          <div className="flex gap-2">
            <button type="button" className="webtoon-mini studio-primary" onClick={addManual} disabled={!manual.name.trim()}>Ajouter à la bible</button>
            <button type="button" className="webtoon-mini" onClick={() => setManual(null)}>Annuler</button>
          </div>
        </section>
      ) : null}

      {candidates.length ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base text-lily">À valider · {candidates.length}</h3>
            {previousAvailable.length && candidates.some((c) => !c.same_as) ? (
              <button type="button" className="webtoon-mini" onClick={() => void matchWithPrevious()} disabled={matching} title="Cherche parmi ces candidats ceux qui sont déjà dans vos projets précédents, pour reprendre leur fiche">
                {matching ? <><span className="studio-spinner" aria-hidden /> Rapprochement…</> : "Rapprocher avec vos projets précédents"}
              </button>
            ) : null}
            <button
              type="button"
              className="webtoon-mini"
              onClick={() =>
                candidates.forEach((c) => {
                  const match = matchOf(c);
                  if (match) takeOver(c, match);
                  else keep(c);
                })
              }
              title="Garde tout ; ce qui est déjà dans un projet précédent reprend sa fiche"
            >
              Tout garder
            </button>
          </div>
          <div className="studio-bible-grid">
            {candidates.map((c) => {
              const sel = chosen(c);
              const offer = [...new Set([...c.best_seconds, ...c.seconds])].map((s) => ({ s, src: frameOf(s) })).filter((f): f is { s: number; src: string } => Boolean(f.src)).slice(0, 10);
              return (
                <article key={c.id} className={`studio-card studio-bible-card is-${c.importance} ${matchOf(c) ? "is-known" : ""}`}>
                  {(() => {
                    const match = matchOf(c);
                    if (!match) return null;
                    return (
                      <div className="studio-bible-known">
                        {match.asset.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={match.asset.image} alt="" loading="lazy" />
                        ) : null}
                        <div>
                          <b>Déjà connu : {match.name}</b>
                          <span>dans « {match.project_title} »{match.asset.image ? ", avec sa fiche" : ""}</span>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className="webtoon-mini studio-primary" onClick={() => takeOver(c, match)} title="Reprend l'identifiant, le verrou de design et la fiche du projet précédent ; les images de ce film s'ajoutent à ses références">
                              Reprendre sa fiche
                            </button>
                            <button type="button" className="webtoon-mini" onClick={() => updateCandidate(c.id, { same_as: undefined })} title="Ce n'est pas le même : en faire un nouveau">
                              Ce n&apos;est pas lui
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="studio-bible-frames">
                    {offer.map((f) => (
                      <button
                        key={f.src}
                        type="button"
                        className={`studio-bible-frame ${sel.includes(f.src) ? "is-on" : ""}`}
                        onClick={() => setPicked({ ...picked, [c.id]: sel.includes(f.src) ? sel.filter((x) => x !== f.src) : [...sel, f.src].slice(-MAX_SOURCES) })}
                        onDoubleClick={() => setOpen({ src: f.src, label: `${c.name} · ${frameLabel(f.s)}` })}
                        title={`${frameLabel(f.s)} · clic : référence de la fiche · double clic : agrandir`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.src} alt="" loading="lazy" />
                        <span>{frameLabel(f.s)}</span>
                      </button>
                    ))}
                    {!offer.length ? <p className="text-xs text-ivory/50">Aucune image : vous pourrez en ajouter après l&apos;avoir gardé.</p> : null}
                  </div>
                  <div className="grid gap-2">
                    <div className="flex gap-2">
                      <input className="studio-input flex-1" value={c.name} onChange={(e) => updateCandidate(c.id, { name: e.target.value })} aria-label="Nom" />
                      {step === "characters" ? (
                        <select className="studio-input" value={c.kind} onChange={(e) => updateCandidate(c.id, { kind: e.target.value as BibleCandidate["kind"] })} aria-label="Type">
                          <option value="character">Personnage</option>
                          <option value="creature">Créature ou machine</option>
                        </select>
                      ) : null}
                    </div>
                    {c.description ? <p className="text-xs text-ivory/70">{c.description}</p> : null}
                    <details className="studio-details">
                      <summary>Verrou de design</summary>
                      <textarea className="studio-textarea" rows={4} value={c.must_keep} onChange={(e) => updateCandidate(c.id, { must_keep: e.target.value })} />
                    </details>
                    <p className="text-xs text-ivory/50">
                      Vu {c.seconds.length} fois{c.scale ? ` · échelle : ${c.scale}` : ""} · {sel.length} image{sel.length > 1 ? "s" : ""} de référence
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={`webtoon-mini ${matchOf(c) ? "" : "studio-primary"}`} onClick={() => keep(c)}>{matchOf(c) ? "Garder comme nouveau" : "Garder"}</button>
                    <button type="button" className="webtoon-mini" onClick={() => reject(c)}>Écarter</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {previousAvailable.length ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base text-lily">Depuis vos projets précédents · {previousAvailable.length}</h3>
            <button type="button" className="webtoon-mini" onClick={() => setShowPrevious((v) => !v)}>{showPrevious ? "Replier" : "Afficher"}</button>
          </div>
          {showPrevious ? (
            <div className="studio-previous-grid">
              {previousAvailable.map((entry) => (
                <div key={`${entry.project_id}:${entry.asset.id}`} className="studio-previous-card">
                  <div className="studio-previous-image">
                    {entry.asset.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.asset.image} alt={entry.name} loading="lazy" />
                    ) : (
                      <span>pas de fiche</span>
                    )}
                  </div>
                  <b>{entry.name}</b>
                  <small>{entry.project_title}</small>
                  <button type="button" className="webtoon-mini" onClick={() => addPrevious(entry)} title="Ajoute cette entrée à la bible du projet, avec sa fiche et son verrou de design">
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ivory/55">La détection les reconnaît d&apos;elle-même dans le film ; vous pouvez aussi en ajouter un à la main.</p>
          )}
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base text-lily">Dans la bible · {kept.length}</h3>
          {kept.some((a) => !a.image) ? (
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void generateMissing()} disabled={busy.size > 0}>
              Générer les fiches manquantes ({kept.filter((a) => !a.image).length})
            </button>
          ) : null}
        </div>
        {!kept.length ? <p className="text-sm text-ivory/55">Rien encore. Détectez, ou ajoutez à la main.</p> : null}
        <div className="studio-bible-grid">
          {kept.map((asset) => {
            const kind = sheetKind(asset);
            const sources = asset.sources ?? [];
            const seen = [...new Set(asset.seen_seconds ?? [])].map((s) => ({ s, src: frameOf(s) })).filter((f): f is { s: number; src: string } => Boolean(f.src) && !sources.includes(f.src as string)).slice(0, 8);
            const scale = /scale:\s*([^.]+)\./i.exec(asset.description ?? "")?.[1]?.trim();
            const prepared = sheetPrompt({ asset, bible, scale });
            const working = busy.has(asset.id);
            return (
              <article key={asset.id} className="studio-card studio-bible-card is-kept">
                <div className="studio-bible-sheet">
                  {asset.image ? (
                    <button type="button" onClick={() => setOpen({ src: asset.image, label: asset.name.split(",")[0] })}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.image} alt={asset.name} />
                    </button>
                  ) : (
                    <div className="studio-bible-empty">{working ? <><span className="studio-spinner studio-spinner-lg" aria-hidden /> Dessin de la fiche…</> : "Pas encore de fiche"}</div>
                  )}
                  {working && busySince[asset.id] ? <ProgressBar key={busySince[asset.id]} startedAt={busySince[asset.id]} estimateMs={75_000} label="Fiche en cours" className="studio-bible-pbar" /> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="studio-input flex-1"
                    value={asset.name.split(",")[0]}
                    onChange={(e) => updateAsset(asset, { name: asset.kind === "character" ? `${e.target.value}, webtoon model sheet` : e.target.value })}
                    aria-label="Nom"
                  />
                  {asset.kind === "character" ? (
                    <select
                      className="studio-input"
                      value={kind}
                      onChange={(e) => updateAsset(asset, { tags: e.target.value === "creature" ? [...new Set([...(asset.tags ?? []), "creature"])] : (asset.tags ?? []).filter((t) => t !== "creature") })}
                      aria-label="Type"
                    >
                      <option value="character">Personnage</option>
                      <option value="creature">Créature ou machine</option>
                    </select>
                  ) : (
                    <span className="studio-chip is-on">{SHEET_KIND_LABEL[kind]}</span>
                  )}
                </div>
                <label className="webtoon-field">
                  <span>Verrou de design (repris dans chaque case qui le montre)</span>
                  <textarea rows={3} value={asset.must_keep} onChange={(e) => updateAsset(asset, { must_keep: e.target.value })} />
                </label>
                <div>
                  <span className="webtoon-field-label">Références de la fiche ({sources.length})</span>
                  <div className="studio-bible-frames">
                    {sources.map((src) => (
                      <button key={src} type="button" className="studio-bible-frame is-on" onClick={() => toggleSource(asset, src)} onDoubleClick={() => setOpen({ src, label: asset.name.split(",")[0] })} title="Clic : retirer · double clic : agrandir">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" loading="lazy" />
                        <span>{isFilm(src) ? "film" : "vous"}</span>
                      </button>
                    ))}
                    <button type="button" className="studio-bible-add" onClick={() => { uploadTarget.current = asset.id; fileInput.current?.click(); }} disabled={working}>+ Vos images</button>
                  </div>
                  {seen.length ? (
                    <>
                      <span className="webtoon-field-label mt-2">Autres images du film où il apparaît</span>
                      <div className="studio-bible-frames">
                        {seen.map((f) => (
                          <button key={f.src} type="button" className="studio-bible-frame" onClick={() => toggleSource(asset, f.src)} title={`${frameLabel(f.s)} · clic : ajouter aux références`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.src} alt="" loading="lazy" />
                            <span>{frameLabel(f.s)}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                <details className="studio-details">
                  <summary>Prompt de la fiche{asset.sheet_prompt ? " (modifié)" : " (préparé)"}</summary>
                  <textarea className="studio-textarea studio-textarea-mono" rows={10} value={asset.sheet_prompt ?? prepared} onChange={(e) => updateAsset(asset, { sheet_prompt: e.target.value })} />
                  {asset.sheet_prompt ? (
                    <button type="button" className="webtoon-mini mt-1" onClick={() => updateAsset(asset, { sheet_prompt: undefined })}>Remettre le prompt préparé</button>
                  ) : null}
                </details>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="webtoon-mini studio-primary" onClick={() => void generate(asset)} disabled={working}>
                    {working ? "…" : asset.image ? "Regénérer la fiche" : "Générer la fiche"}
                  </button>
                  {(() => {
                    // The author's own image (the last one imported with "+ Vos images"), redrawn in the style of the webtoon.
                    const own = (asset.sources ?? []).filter((s) => !isFilm(s));
                    const source = asset.imported_image ?? own[own.length - 1];
                    return source ? (
                      <button type="button" className="webtoon-mini" onClick={() => void generate(asset, source)} disabled={working} title="Redessine votre image dans le style du webtoon, en fiche (face, profil, dos, fond blanc), sans rien changer au design">
                        Webtoniser mon image
                      </button>
                    ) : null;
                  })()}
                  <button
                    type="button"
                    className="webtoon-mini webtoon-mini-danger"
                    onClick={() => {
                      if (window.confirm(`Retirer ${asset.name.split(",")[0]} de la bible ?`)) updateLibrary((current) => removeAsset(current, asset.id, false));
                    }}
                    disabled={working}
                  >
                    Retirer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onUpload(f); }} />
      <StudioLightbox src={open?.src ?? null} label={open?.label} onClose={() => setOpen(null)} />
    </div>
  );
}
