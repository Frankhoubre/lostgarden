"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { SEQUENCE_COLOR, SEQUENCE_LABEL, type FilmGuide, type GuideSequence } from "@/lib/webtoon/film-guide";
import { studioHeaders } from "@/lib/webtoon/studio-headers";
import { saveFilmRead, saveStory } from "@/lib/webtoon/story-client";
import { FILM_READ_WINDOW, missingLines, panelAt, presence, sceneHasSubtitles, similarity, sourceLines, tc, unsourcedBubbles, type FilmRead, type MissingLine, type ScriptScene, type StoryDoc } from "@/lib/webtoon/story";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type View = "scenario" | "lines" | "sequences" | "cast" | "text";

type StudioStoryProps = {
  slug: string;
  user: User | null;
  panels: WebtoonPanel[];
  setPanels: (update: (current: WebtoonPanel[]) => WebtoonPanel[]) => void;
  guide: FilmGuide | null;
  onGuideChange: (guide: FilmGuide) => void;
  story: StoryDoc | null;
  setStory: (story: StoryDoc) => void;
  read: FilmRead | null;
  setRead: (read: FilmRead) => void;
  /** The film, one frame per second. */
  frames: { src: string; seconds: number }[];
  cast: { id: string; name: string; looks?: string }[];
  /** Characters who never speak: a line of the film is not given to them. */
  mute: string[];
  hasScreenplay: boolean;
  scene: number | null;
  onScene: (index: number | null) => void;
  onOpenPanel: (id: string) => void;
  notify: (message: string) => void;
  /** The raw screenplay view of before (pages, shot list, the project's text). */
  raw: ReactNode;
};

const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: "scenario", label: "Scénario et film", hint: "Chaque scène du scénario en face de son passage du film et de ses cases" },
  { id: "lines", label: "Répliques", hint: "Les répliques qu'aucune bulle ne porte, et les bulles sans source" },
  { id: "sequences", label: "Séquences", hint: "La fiche de chaque séquence du film : ce qui s'y passe, l'émotion, l'intention" },
  { id: "cast", label: "Personnages", hint: "Où chaque personnage est dans le film, et où la bande le dessine" },
  { id: "text", label: "Texte brut", hint: "Les pages du scénario telles quelles" },
];

const thumb = (panel: WebtoonPanel) => (panel.image.web?.of === panel.image.src ? panel.image.web.src : panel.image.src);
const parseTc = (value: string): number | null => {
  const m = /^(\d+):(\d{1,2})$/.exec(value.trim());
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = Number(value);
  return value.trim() && Number.isFinite(n) ? n : null;
};

/**
 * "Scénario": the story behind the strip (lib/webtoon/story.ts). The
 * screenplay scene by scene against the film and the panels, the lines the
 * strip forgot and the bubbles nothing explains, the card of each sequence
 * of the film (its emotion, the author's direction, read by the writer), and
 * each character's presence in the film against the panels that draw him.
 */
export function StudioStory(props: StudioStoryProps) {
  const { slug, user, panels, setPanels, guide, story, setStory, read, setRead, frames, cast, mute, notify, onOpenPanel } = props;
  const [view, setView] = useState<View>(props.hasScreenplay ? "scenario" : "lines");
  const [working, setWorking] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const stop = useRef(false);
  const duration = frames.length ? frames[frames.length - 1].seconds : guide?.duration ?? 0;

  const sources = useMemo(() => sourceLines(story, read), [story, read]);
  const ignored = useMemo(() => new Set(story?.ignored ?? []), [story]);
  const missing = useMemo(() => missingLines(sources, panels).filter((m) => !ignored.has(m.text)), [sources, panels, ignored]);
  const unsourced = useMemo(() => unsourcedBubbles(sources, panels), [sources, panels]);
  const who = useMemo(() => presence(read, panels, cast), [read, panels, cast]);

  const align = async () => {
    if (!guide?.sequences.length) {
      notify("Lisez d'abord le film dans « Images du film » : l'alignement s'appuie sur ses séquences");
      return;
    }
    if (story?.scenes.length && !window.confirm("Aligner de nouveau le scénario ? Les scènes placées à la main gardent leurs secondes.")) return;
    setWorking("align");
    try {
      const response = await fetch(`/api/webtoon/${slug}/story`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ action: "scenes", sequences: guide.sequences, cast: cast.map((c) => ({ id: c.id, name: c.name })) }),
      });
      const payload = (await response.json().catch(() => ({}))) as { scenes?: ScriptScene[]; error?: string };
      if (!response.ok || !payload.scenes) throw new Error(payload.error ?? `erreur ${response.status}`);
      // What the author placed by hand stays where he put it.
      const manual = new Map((story?.scenes ?? []).filter((s) => s.manual).map((s) => [s.heading, s]));
      const scenes = payload.scenes.map((s) => (manual.has(s.heading) ? { ...s, from: manual.get(s.heading)!.from, to: manual.get(s.heading)!.to, manual: true, reordered: false } : s));
      const next: StoryDoc = { scenes, ignored: story?.ignored, updated_at: new Date().toISOString() };
      setStory(next);
      if (user) await saveStory(slug, next, user);
      notify(`Scénario aligné : ${scenes.length} scènes, ${scenes.filter((s) => s.from === null).length} absentes du film`);
    } catch (error) {
      notify(`Alignement impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  };

  /** The film read second by second, twenty seconds per call, three calls at a time, saved as it goes. */
  const readFilm = async (fromScratch: boolean) => {
    const start = fromScratch ? 0 : (read?.until ?? -1) + 1;
    const todo = frames.filter((f) => f.seconds >= start);
    if (!todo.length) {
      notify("Le film est déjà lu jusqu'au bout");
      return;
    }
    const windows: { seconds: number; src: string }[][] = [];
    for (let i = 0; i < todo.length; i += FILM_READ_WINDOW) windows.push(todo.slice(i, i + FILM_READ_WINDOW));
    if (!window.confirm(`Lire ${todo.length} secondes du film (sous-titres et personnages) ? ${windows.length} appels, environ ${(windows.length * 0.022).toFixed(2)} $ et ${Math.max(1, Math.round((windows.length * 12) / 60 / 3))} min.`)) return;
    setWorking("read");
    stop.current = false;
    let current: FilmRead = fromScratch || !read ? { frames: [], until: -1, updated_at: new Date().toISOString() } : read;
    let done = 0;
    setProgress({ done, total: windows.length });
    const queue = [...windows];
    const results = new Map<number, FilmRead["frames"]>();
    // Saved in order: the "read until" second only moves past windows that are all back.
    const commit = async () => {
      const ordered = windows.filter((w) => results.has(w[0].seconds));
      let until = current.until;
      const merged = new Map(current.frames.map((f) => [f.s, f]));
      for (const w of windows) {
        const got = results.get(w[0].seconds);
        if (!got) break;
        for (const f of got) merged.set(f.s, f);
        until = w[w.length - 1].seconds;
      }
      void ordered;
      current = { frames: [...merged.values()].sort((a, b) => a.s - b.s), until, updated_at: new Date().toISOString() };
      setRead(current);
      if (user) await saveFilmRead(slug, current, user).catch(() => undefined);
    };
    const worker = async () => {
      for (let w = queue.shift(); w && !stop.current; w = queue.shift()) {
        try {
          const response = await fetch(`/api/webtoon/${slug}/story`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
            body: JSON.stringify({ action: "read", frames: w, cast }),
          });
          const payload = (await response.json().catch(() => ({}))) as { frames?: FilmRead["frames"]; error?: string };
          if (response.ok && payload.frames) results.set(w[0].seconds, payload.frames);
          else notify(`${tc(w[0].seconds)} non lu : ${payload.error ?? response.status}`);
        } catch (error) {
          notify(`${tc(w[0].seconds)} non lu : ${error instanceof Error ? error.message : "erreur"}`);
        }
        done += 1;
        setProgress({ done, total: windows.length });
        await commit();
      }
    };
    try {
      await Promise.all([worker(), worker(), worker()]);
      notify(stop.current ? `Lecture arrêtée à ${tc(current.until)}` : `Film lu jusqu'à ${tc(current.until)}`);
    } finally {
      setWorking(null);
      setProgress(null);
    }
  };

  const addBubble = (line: MissingLine) => {
    const target = line.panel;
    if (!target) return;
    let speaker = line.speaker ?? "";
    if (!speaker && line.seconds !== null) {
      const seen = read?.frames.find((f) => f.s === line.seconds)?.who ?? [];
      speaker = seen.find((id) => !mute.includes(id)) ?? "voice";
    }
    setPanels((current) => current.map((p) => (p.panel_id === target.panel_id ? { ...p, dialogue: [...p.dialogue, { speaker: speaker || "voice", text: { en: "", fr: line.text.replace(/\s*\n\s*/g, " ") }, style: speaker === "voice" ? "off" : "speech", anchor: { x: 50, y: 14 + p.dialogue.length * 16 } }] } : p)));
    notify(`Bulle ajoutée à la case ${target.order} : « Traduire » puis « Replacer les bulles » la mettent en place`);
  };

  const ignore = async (text: string) => {
    const next: StoryDoc = { scenes: story?.scenes ?? [], ignored: [...(story?.ignored ?? []), text], updated_at: new Date().toISOString() };
    setStory(next);
    if (user) await saveStory(slug, next, user).catch(() => undefined);
  };

  const placeScene = async (index: number, from: number | null, to: number | null) => {
    if (!story) return;
    const next: StoryDoc = { ...story, scenes: story.scenes.map((s) => (s.index === index ? { ...s, from, to: to ?? from, manual: true, reordered: false } : s)), updated_at: new Date().toISOString() };
    setStory(next);
    if (user) await saveStory(slug, next, user).catch(() => undefined);
  };

  const panelsIn = (from: number | null, to: number | null) => (from === null ? [] : panels.filter((p) => p.source_time_start !== null && p.source_time_start >= from - 1 && p.source_time_start <= (to ?? from) + 1));
  const lineStatus = (scene: ScriptScene, text: string) => {
    const near = scene.from === null ? panels : panelsIn(scene.from - 30, (scene.to ?? scene.from) + 30);
    for (const p of near) for (const d of p.dialogue) if (Math.max(similarity(text, d.text.fr ?? ""), similarity(text, d.text.en ?? "")) >= 0.55) return p;
    return null;
  };

  return (
    <section className="studio-card studio-story">
      <div className="studio-story-head">
        <nav className="studio-viewswitch" aria-label="Vues du scénario">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" className={`webtoon-mini ${view === v.id ? "is-active" : ""}`} onClick={() => setView(v.id)} title={v.hint}>
              {v.label}
              {v.id === "lines" && missing.length ? <b className="studio-story-count">{missing.length}</b> : null}
              {v.id === "cast" && who.some((w) => w.panels.some((p) => p.odd)) ? <b className="studio-story-count">{who.reduce((n, w) => n + w.panels.filter((p) => p.odd).length, 0)}</b> : null}
            </button>
          ))}
        </nav>
        <span className="studio-story-status">
          {story?.scenes.length ? `${story.scenes.length} scènes alignées` : props.hasScreenplay ? "Scénario pas encore aligné" : "Pas de scénario"}
          {" · "}
          {read && read.until >= 0 ? `film lu jusqu'à ${tc(read.until)} sur ${tc(duration)}` : "film pas encore lu"}
        </span>
      </div>

      {progress ? (
        <div className="studio-story-progress" role="status">
          <span>Lecture du film : {progress.done}/{progress.total}</span>
          <div className="studio-bgjob-bar"><span style={{ width: `${Math.max(3, (progress.done / progress.total) * 100)}%` }} /></div>
          <button type="button" className="webtoon-mini" onClick={() => (stop.current = true)}>Arrêter</button>
        </div>
      ) : null}

      {view === "scenario" ? (
        !props.hasScreenplay ? (
          <p className="studio-publish-muted">Ce projet n&apos;a pas de scénario : ajoutez-le dans « Texte brut ».</p>
        ) : (
          <div className="studio-story-split">
            <div className="studio-story-scenes">
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void align()} disabled={working !== null}>
                {working === "align" ? "Alignement… (environ 1 min)" : story?.scenes.length ? "Aligner de nouveau" : "Aligner le scénario sur le film"}
              </button>
              <ol>
                {(story?.scenes ?? []).map((s) => {
                  const lost = sceneHasSubtitles(s, read) ? 0 : s.lines.filter((l) => !lineStatus(s, l.text)).length;
                  return (
                    <li key={s.index}>
                      <button type="button" className={`studio-story-scene ${props.scene === s.index ? "is-on" : ""}`} onClick={() => props.onScene(s.index)}>
                        <b>{s.heading}</b>
                        <small>
                          p. {s.page} · {s.from === null ? "absente du film" : `${tc(s.from)} à ${tc(s.to)}`}
                          {s.reordered ? " · autre ordre que le scénario" : ""}
                          {s.manual ? " · placée à la main" : ""}
                          {lost ? ` · ${lost} réplique${lost > 1 ? "s" : ""} sans bulle` : ""}
                        </small>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="studio-story-detail">
              {(() => {
                const s = story?.scenes.find((x) => x.index === props.scene) ?? story?.scenes[0];
                if (!s) return <p className="studio-publish-muted">L&apos;alignement découpe le scénario en scènes, place chacune sur le film d&apos;après les séquences du guide, et relève ses répliques.</p>;
                const inScene = panelsIn(s.from, s.to);
                const shots = s.from === null ? [] : frames.filter((f) => f.seconds >= s.from! && f.seconds <= (s.to ?? s.from!)).filter((_, i, all) => i % Math.max(1, Math.ceil(all.length / 10)) === 0);
                return (
                  <>
                    <h3>{s.heading}</h3>
                    <p className="studio-publish-muted">Page {s.page} · {s.summary}</p>
                    <div className="studio-story-place">
                      <label>Dans le film de <input key={`f${s.index}-${s.from}`} defaultValue={s.from === null ? "" : tc(s.from)} placeholder="m:ss" onBlur={(e) => { const v = parseTc(e.target.value); if (v !== s.from) void placeScene(s.index, v, s.to); }} /></label>
                      <label>à <input key={`t${s.index}-${s.to}`} defaultValue={s.to === null ? "" : tc(s.to)} placeholder="m:ss" onBlur={(e) => { const v = parseTc(e.target.value); if (v !== s.to) void placeScene(s.index, s.from, v); }} /></label>
                      {s.reordered ? <span className="studio-thumb-warn">Le film la place plus tôt que la scène d&apos;avant du scénario : autre ordre, ou erreur à corriger ici.</span> : null}
                    </div>
                    {shots.length ? (
                      <div className="studio-story-frames">
                        {shots.map((f) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={f.seconds} src={f.src} alt="" loading="lazy" title={tc(f.seconds)} />
                        ))}
                      </div>
                    ) : null}
                    <h4>{inScene.length} case{inScene.length > 1 ? "s" : ""}</h4>
                    <div className="studio-story-panels">
                      {inScene.slice(0, 40).map((p) => (
                        <button key={p.panel_id} type="button" onClick={() => onOpenPanel(p.panel_id)} title={`Case ${p.order}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.image.src ? <img src={thumb(p)} alt="" loading="lazy" /> : <span>{p.order}</span>}
                        </button>
                      ))}
                    </div>
                    {s.lines.length ? (
                      <>
                        <h4>Répliques</h4>
                        <ul className="studio-story-lines">
                          {s.lines.map((l, i) => {
                            const at = lineStatus(s, l.text);
                            const spoken = !at && sceneHasSubtitles(s, read);
                            return (
                              <li key={i} className={at ? "is-ok" : spoken ? "is-film" : "is-missing"}>
                                <span>{l.speaker} : « {l.text} »</span>
                                {at ? (
                                  <button type="button" className="studio-publish-link" onClick={() => onOpenPanel(at.panel_id)}>case {at.order}</button>
                                ) : spoken ? (
                                  <small title="Les sous-titres du film font foi : ils sont vérifiés dans la vue Répliques">dit autrement dans le film</small>
                                ) : (
                                  <button type="button" className="webtoon-mini" onClick={() => addBubble({ kind: "script", speaker: l.speaker, text: l.text, seconds: s.from, scene: s.index, panel: panelAt(panels, s.from) })} disabled={s.from === null}>Ajouter la bulle</button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    ) : null}
                    <details className="studio-story-text">
                      <summary>Texte de la scène</summary>
                      <pre>{s.text}</pre>
                    </details>
                  </>
                );
              })()}
            </div>
          </div>
        )
      ) : null}

      {view === "lines" ? (
        <div className="studio-story-block">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void readFilm(false)} disabled={working !== null || !frames.length}>
              {read && read.until >= 0 ? (read.until < duration ? `Continuer la lecture du film (${tc(read.until)})` : "Film lu") : "Lire le film (sous-titres et personnages)"}
            </button>
            {read && read.until >= 0 ? <button type="button" className="webtoon-mini" onClick={() => void readFilm(true)} disabled={working !== null}>Relire depuis le début</button> : null}
            <span className="studio-publish-muted">Sources : {sources.filter((s) => s.kind === "film").length} sous-titres du film, {sources.filter((s) => s.kind === "script").length} répliques du scénario que le film ne montre pas.</span>
          </div>
          <h3>{missing.length ? `${missing.length} réplique${missing.length > 1 ? "s" : ""} sans bulle` : "Aucune réplique oubliée"}</h3>
          <ul className="studio-story-missing">
            {missing.slice(0, 150).map((m, i) => (
              <li key={`${m.text}-${i}`}>
                <span className={`studio-story-kind is-${m.kind}`}>{m.kind === "film" ? "Film" : "Scénario"}</span>
                <span className="studio-story-when">{tc(m.seconds)}</span>
                <span className="studio-story-say">{m.speaker ? `${m.speaker} : ` : ""}« {m.text.replace(/\s*\n\s*/g, " ")} »</span>
                <span className="studio-story-actions">
                  {m.panel ? <button type="button" className="webtoon-mini" onClick={() => addBubble(m)} title={`Dans la case ${m.panel.order}, la case de cette seconde`}>Ajouter à la case {m.panel.order}</button> : null}
                  {m.panel ? <button type="button" className="webtoon-mini" onClick={() => onOpenPanel(m.panel!.panel_id)}>Ouvrir</button> : null}
                  <button type="button" className="webtoon-mini" onClick={() => void ignore(m.text)} title="Cette réplique reste hors de la bande, volontairement">Ignorer</button>
                </span>
              </li>
            ))}
          </ul>
          {unsourced.length ? (
            <>
              <h3>{unsourced.length} bulle{unsourced.length > 1 ? "s" : ""} sans source</h3>
              <p className="studio-publish-muted">Ni dans les sous-titres ni dans le scénario : inventée, ou reformulée au point de ne plus se reconnaître. Rien d&apos;inventé dans Lost Garden : vérifiez-les.</p>
              <ul className="studio-story-missing">
                {unsourced.slice(0, 100).map((u) => (
                  <li key={`${u.panel.panel_id}-${u.index}`}>
                    <span className="studio-story-when">case {u.panel.order}</span>
                    <span className="studio-story-say">{u.speaker} : « {u.text} »</span>
                    <span className="studio-story-actions"><button type="button" className="webtoon-mini" onClick={() => onOpenPanel(u.panel.panel_id)}>Ouvrir</button></span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {view === "sequences" ? <SequenceCards guide={guide} panels={panels} frames={frames} onSave={props.onGuideChange} onOpenPanel={onOpenPanel} /> : null}

      {view === "cast" ? (
        <div className="studio-story-block">
          {!read || read.until < 0 ? (
            <p className="studio-publish-muted">La présence dans le film vient de la lecture du film (vue « Répliques »). Sans elle, seules les cases sont montrées.</p>
          ) : null}
          <CastTimeline rows={who} duration={duration} readUntil={read?.until ?? -1} onOpenPanel={onOpenPanel} />
          {who.some((w) => w.panels.some((p) => p.odd)) ? (
            <>
              <h3>Dessinés là où le film ne les montre pas</h3>
              <ul className="studio-story-missing">
                {who.flatMap((w) => w.panels.filter((p) => p.odd).map((p) => ({ w, p }))).slice(0, 120).map(({ w, p }) => (
                  <li key={`${w.id}-${p.panel.panel_id}`}>
                    <span className="studio-story-when">{tc(p.seconds)}</span>
                    <span className="studio-story-say">{w.name} dans la case {p.panel.order}, absent du film à ce moment</span>
                    <span className="studio-story-actions"><button type="button" className="webtoon-mini" onClick={() => onOpenPanel(p.panel.panel_id)}>Ouvrir</button></span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {view === "text" ? props.raw : null}
    </section>
  );
}

/** One row per character: the film spans where he is seen (pale), the panels that draw him (ticks, red when the film does not show him). */
function CastTimeline({ rows, duration, readUntil, onOpenPanel }: { rows: ReturnType<typeof presence>; duration: number; readUntil: number; onOpenPanel: (id: string) => void }) {
  if (!rows.length || !duration) return <p className="studio-publish-muted">Aucun personnage repéré pour l&apos;instant.</p>;
  const W = 1000;
  const label = 110;
  const row = 34;
  const x = (s: number) => label + ((W - label - 10) * s) / duration;
  const minutes = Array.from({ length: Math.floor(duration / 60) + 1 }, (_, m) => m);
  return (
    <svg className="studio-cast-timeline" viewBox={`0 0 ${W} ${rows.length * row + 26}`} role="img" aria-label="Présence des personnages dans le film et dans la bande">
      {minutes.map((m) => (
        <g key={m}>
          <line x1={x(m * 60)} x2={x(m * 60)} y1={0} y2={rows.length * row} className="studio-cast-grid" />
          <text x={x(m * 60)} y={rows.length * row + 16} className="studio-cast-axis">{m}:00</text>
        </g>
      ))}
      {readUntil >= 0 && readUntil < duration ? <rect x={x(readUntil)} y={0} width={Math.max(0, x(duration) - x(readUntil))} height={rows.length * row} className="studio-cast-unread" /> : null}
      {rows.map((r, i) => (
        <g key={r.id} transform={`translate(0 ${i * row})`}>
          <text x={4} y={row / 2 + 4} className="studio-cast-name">{r.name}</text>
          {r.film.map((span) => (
            <rect key={span.from} x={x(span.from)} y={6} width={Math.max(2, x(span.to + 1) - x(span.from))} height={row / 2 - 6} rx={2} className="studio-cast-film">
              <title>{`${r.name} dans le film, ${tc(span.from)} à ${tc(span.to)}`}</title>
            </rect>
          ))}
          {r.panels.map((p) => (
            <rect key={p.panel.panel_id} x={x(p.seconds) - 1} y={row / 2 + 1} width={3} height={row / 2 - 6} className={`studio-cast-panel ${p.odd ? "is-odd" : ""}`} onClick={() => onOpenPanel(p.panel.panel_id)}>
              <title>{`Case ${p.panel.order} (${tc(p.seconds)})${p.odd ? " : absent du film à ce moment" : ""}`}</title>
            </rect>
          ))}
        </g>
      ))}
    </svg>
  );
}

/** The card of each sequence of the film guide, with the author's emotion and direction the writer reads. */
function SequenceCards({ guide, panels, frames, onSave, onOpenPanel }: { guide: FilmGuide | null; panels: WebtoonPanel[]; frames: { src: string; seconds: number }[]; onSave: (guide: FilmGuide) => void; onOpenPanel: (id: string) => void }) {
  const [draft, setDraft] = useState<GuideSequence[] | null>(null);
  const [filter, setFilter] = useState("");
  if (!guide?.sequences.length) return <p className="studio-publish-muted">Les séquences viennent du guide du film : lancez la lecture dans « Images du film ».</p>;
  const list = draft ?? guide.sequences;
  const dirty = draft !== null;
  const edit = (index: number, patch: Partial<GuideSequence>) => setDraft((list === guide.sequences ? guide.sequences : list).map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const frameAt = (s: number) => frames.find((f) => f.seconds >= s)?.src;
  return (
    <div className="studio-story-block">
      <div className="flex flex-wrap items-center gap-2">
        <input className="studio-story-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Chercher une séquence (titre, lieu, résumé)" />
        <button type="button" className="webtoon-mini studio-primary" onClick={() => { onSave({ ...guide, sequences: list, updated_at: new Date().toISOString() }); setDraft(null); }} disabled={!dirty}>
          {dirty ? "Enregistrer les fiches" : "Fiches enregistrées"}
        </button>
        <span className="studio-publish-muted">L&apos;émotion et l&apos;intention de chaque séquence vont à l&apos;écrivain quand il écrit ses cases.</span>
      </div>
      <div className="studio-seq-cards">
        {list.map((s, i) => {
          if (filter && !`${s.title} ${s.summary} ${s.place ?? ""}`.toLowerCase().includes(filter.toLowerCase())) return null;
          const inside = panels.filter((p) => p.source_time_start !== null && p.source_time_start >= s.from && p.source_time_start <= s.to);
          const still = frameAt(s.from + (s.to - s.from) / 2);
          return (
            <article key={`${s.from}-${i}`} className="studio-seq-card" style={{ borderLeftColor: SEQUENCE_COLOR[s.kind] }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {still ? <img src={still} alt="" loading="lazy" /> : null}
              <div>
                <input className="studio-seq-title" value={s.title} onChange={(e) => edit(i, { title: e.target.value })} aria-label="Titre de la séquence" />
                <small>
                  {tc(s.from)} à {tc(s.to)} · {SEQUENCE_LABEL[s.kind]} {s.intensity}/5{s.place ? ` · ${s.place}` : ""}
                  {" · "}
                  {inside.length ? <button type="button" className="studio-publish-link" onClick={() => onOpenPanel(inside[0].panel_id)}>{inside.length} case{inside.length > 1 ? "s" : ""}</button> : "aucune case"}
                </small>
                <textarea rows={2} value={s.summary} onChange={(e) => edit(i, { summary: e.target.value })} aria-label="Ce qui se passe" />
                <input value={s.emotion ?? ""} onChange={(e) => edit(i, { emotion: e.target.value })} placeholder="Émotion à laisser (la peur qui monte, un soulagement…)" aria-label="Émotion" />
                <input value={s.intent ?? ""} onChange={(e) => edit(i, { intent: e.target.value })} placeholder="Intention de réalisation (du silence, des cases larges, un gros plan sur la main…)" aria-label="Intention" />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
