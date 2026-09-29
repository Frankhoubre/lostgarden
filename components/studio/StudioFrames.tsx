"use client";

import { useMemo, useState } from "react";
import { ProgressBar } from "@/components/studio/ProgressBar";
import { StudioLightbox } from "@/components/studio/StudioLightbox";
import type { GuideRun } from "@/components/studio/useFilmGuide";
import { coveredUntil } from "@/lib/webtoon/continuity";
import { SEQUENCE_COLOR, SEQUENCE_KINDS, SEQUENCE_LABEL, paceOfKind, type FilmGuide, type GuideSequence } from "@/lib/webtoon/film-guide";
import { sparseFrames } from "@/lib/webtoon/project";
import { studioFilmFrames, studioFilmFramesDense } from "@/lib/webtoon/studio-assets";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type StudioFramesProps = {
  panels: WebtoonPanel[];
  /** Continue the strip: a new panel drawn from this frame, appended after the last one (not offered before the strip exists). */
  onCreatePanel?: (frame: { src: string; seconds: number }) => void;
  /** The film of a project, one frame per second; Lost Garden episode 1 when unset. */
  frames?: { src: string; seconds: number; label: string }[];
  guide: FilmGuide | null;
  run: GuideRun;
  onRead: (fromScratch: boolean) => void;
  onStop: () => void;
  /** The close re-reading of the action and of the busy stretches (gestures, to check). */
  onRefine?: () => void;
};

const tc = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;

const PACE_WORD = { action: "beaucoup de cases dynamiques", normal: "rythme normal", calm: "peu de cases, grandes" } as const;

/**
 * The film as the guide of the adaptation. The film guide (read by the AI
 * window after window) cuts it into sequences of one kind, shown as a
 * coloured timeline and a list; every frame carries the line of what
 * happens in it. Below, the frames themselves, grouped by sequence, the part
 * already adapted marked; a frame opens large and becomes a new panel.
 */
export function StudioFrames({ panels, onCreatePanel, frames: projectFrames, guide, run, onRead, onStop, onRefine }: StudioFramesProps) {
  const [open, setOpen] = useState<{ src: string; label: string; seconds: number } | null>(null);
  /** One frame per second (what the writer reads) or one every five seconds (lighter to scan). */
  const [dense, setDense] = useState(false);
  // Before the strip exists (the project's welcome), nothing is "to adapt": no greyed frames, no adapted mark.
  const adapting = Boolean(onCreatePanel);
  const [only, setOnly] = useState<number | null>(null);
  const all = projectFrames ?? studioFilmFramesDense();
  const frames = projectFrames ? (dense ? projectFrames : sparseFrames(projectFrames)) : dense ? studioFilmFramesDense() : studioFilmFrames();
  const duration = all.length ? all[all.length - 1].seconds : 0;
  const adaptedUntil = useMemo(() => coveredUntil(panels), [panels]);
  const beats = useMemo(() => new Map((guide?.beats ?? []).map((b) => [b.seconds, b])), [guide]);
  const gestures = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const g of guide?.gestures ?? []) map.set(g.seconds, [...(map.get(g.seconds) ?? []), g.gesture]);
    return map;
  }, [guide]);
  const sequences = useMemo(() => guide?.sequences ?? [], [guide]);
  const counts = SEQUENCE_KINDS.map((kind) => ({ kind, n: sequences.filter((s) => s.kind === kind).length, seconds: sequences.filter((s) => s.kind === kind).reduce((sum, s) => sum + s.to - s.from + 1, 0) })).filter((c) => c.n);
  const read = guide?.analyzed_until ?? 0;
  const complete = Boolean(guide) && read > duration;

  const groups = useMemo(() => {
    if (!sequences.length) return [{ sequence: null as GuideSequence | null, frames }];
    const list = sequences.map((sequence) => ({ sequence: sequence as GuideSequence | null, frames: frames.filter((f) => f.seconds >= sequence.from && f.seconds <= sequence.to) }));
    const rest = frames.filter((f) => f.seconds > (sequences[sequences.length - 1]?.to ?? -1));
    if (rest.length) list.push({ sequence: null, frames: rest });
    return list.filter((g) => g.frames.length);
  }, [sequences, frames]);

  return (
    <div className="space-y-6">
      <section className="studio-card studio-guide">
        <div className="studio-section-head">
          <div>
            <p className="anime-label text-xs">Guide du film</p>
            <h2 className="font-display text-lg text-lily">
              {!guide || !sequences.length ? "Le film n'est pas encore lu" : complete ? `${sequences.length} séquences sur ${tc(duration)}` : `${sequences.length} séquences, lu jusqu'à ${tc(Math.min(read, duration))} sur ${tc(duration)}`}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {run ? (
              <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={onStop}>Arrêter</button>
            ) : (
              <>
                {!complete ? (
                  <button type="button" className="webtoon-mini studio-primary" onClick={() => onRead(false)} disabled={!duration}>
                    {read > 0 ? "Reprendre la lecture" : "Lire le film"}
                  </button>
                ) : null}
                {complete && onRefine ? (
                  <button type="button" className="webtoon-mini" onClick={onRefine} title="Relit de près les passages d'action et les passages agités (quatre images par seconde quand elles ont été extraites) pour repérer les gestes : un jet, un coup, une chute. Les gestes repérés sont des indications à vérifier.">
                    Relire les passages d&apos;action{guide?.gestures?.length ? ` · ${guide.gestures.length} gestes` : ""}
                  </button>
                ) : null}
                {read > 0 ? (
                  <button type="button" className="webtoon-mini" onClick={() => window.confirm("Relire tout le film ? Le guide actuel est remplacé.") && onRead(true)}>Relire depuis le début</button>
                ) : null}
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-ivory/60">
          L&apos;IA lit le film par fenêtres de vingt images consécutives : pour chaque seconde, ce qu&apos;on voit et ce qui a changé ; sur la durée, des séquences d&apos;action, de tension, de dialogue, de calme ou de contemplation. En rythme « Auto », la suite de l&apos;histoire s&apos;en sert : beaucoup de cases dynamiques dans une scène d&apos;action, peu de grandes cases dans une contemplation, jamais une fournée à cheval sur deux séquences.
        </p>
        {run ? <ProgressBar startedAt={run.started} estimateMs={run.estimate} label="Lecture du film" done={run.done} total={run.total} /> : null}

        {sequences.length ? (
          <>
            <div className="studio-guide-timeline" role="img" aria-label="Séquences du film">
              {sequences.map((s, i) => (
                <button
                  key={`${s.from}-${i}`}
                  type="button"
                  className={`studio-guide-seg ${only === i ? "is-on" : ""}`}
                  style={{ flexGrow: s.to - s.from + 1, background: SEQUENCE_COLOR[s.kind], opacity: 0.35 + s.intensity * 0.13 }}
                  title={`${tc(s.from)} à ${tc(s.to)} · ${SEQUENCE_LABEL[s.kind]} · intensité ${s.intensity}/5\n${s.title}\n${s.summary}`}
                  onClick={() => setOnly(only === i ? null : i)}
                />
              ))}
              {read <= duration ? <span className="studio-guide-unread" style={{ flexGrow: Math.max(0, duration - read) }} /> : null}
              {adapting ? <span className="studio-guide-adapted" style={{ left: `${Math.min(100, (adaptedUntil / Math.max(1, duration)) * 100)}%` }} title={`Adapté jusqu'à ${tc(adaptedUntil)}`} /> : null}
            </div>
            <div className="studio-guide-legend">
              {counts.map((c) => (
                <span key={c.kind}>
                  <i style={{ background: SEQUENCE_COLOR[c.kind] }} />
                  {SEQUENCE_LABEL[c.kind]} · {c.n} ({tc(c.seconds)})
                </span>
              ))}
              {adapting ? <span className="studio-guide-legend-adapted">▲ adapté jusqu&apos;à {tc(adaptedUntil)}</span> : null}
            </div>
            <ol className="studio-guide-list">
              {sequences.map((s, i) => (
                <li key={`${s.from}-${i}`}>
                  <button type="button" className={`studio-guide-item ${only === i ? "is-on" : ""} ${s.to <= adaptedUntil ? "is-adapted" : ""}`} onClick={() => setOnly(only === i ? null : i)}>
                    <span className="studio-guide-time">{tc(s.from)}<small>{tc(s.to)}</small></span>
                    <span className="studio-guide-kind" style={{ color: SEQUENCE_COLOR[s.kind], borderColor: SEQUENCE_COLOR[s.kind] }}>{SEQUENCE_LABEL[s.kind]}</span>
                    <span className="studio-guide-body">
                      <b>{s.title}</b>
                      <span>{s.summary}</span>
                      <small>
                        {"●".repeat(s.intensity)}
                        <em>{"●".repeat(5 - s.intensity)}</em> · {PACE_WORD[paceOfKind(s.kind, s.intensity)]}
                        {s.place ? ` · ${s.place}` : ""}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </section>

      <section className="studio-card">
        <div className="studio-section-head">
          <div>
            <p className="anime-label text-xs">Les images</p>
            <h2 className="font-display text-lg text-lily">
              {only !== null && sequences[only] ? `${sequences[only].title} · ${tc(sequences[only].from)} à ${tc(sequences[only].to)}` : `${frames.length} images, une toutes les ${dense ? "secondes" : "5 secondes"}`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {only !== null ? <button type="button" className="webtoon-mini" onClick={() => setOnly(null)}>Tout le film</button> : null}
            <div className="studio-viewswitch" role="group" aria-label="Densité des images">
              <button type="button" className={`webtoon-mini ${dense ? "is-active" : ""}`} onClick={() => setDense(true)} title="Ce que l'écrivain lit : chaque seconde du film">1 s</button>
              <button type="button" className={`webtoon-mini ${!dense ? "is-active" : ""}`} onClick={() => setDense(false)} title="Une image toutes les cinq secondes, plus léger à parcourir">5 s</button>
            </div>
          </div>
        </div>
        {adapting ? (
          <p className="text-xs text-ivory/60">Adapté jusqu&apos;à {adaptedUntil.toFixed(0)} s : les images grisées restent à adapter. Une image ouverte en grand devient une nouvelle case à la fin de la bande.</p>
        ) : (
          <p className="text-xs text-ivory/60">Toutes les images extraites du film. « 1 s » les montre toutes, « 5 s » une sur cinq ; une image s&apos;ouvre en grand au clic.</p>
        )}
        {groups
          .filter((g) => only === null || g.sequence === sequences[only])
          .map((group, gi) => (
            <div key={gi} className="studio-guide-group">
              {group.sequence ? (
                <p className="studio-guide-group-head">
                  <i style={{ background: SEQUENCE_COLOR[group.sequence.kind] }} />
                  <b>{group.sequence.title}</b> · {SEQUENCE_LABEL[group.sequence.kind]} · {tc(group.sequence.from)} à {tc(group.sequence.to)}
                </p>
              ) : sequences.length ? (
                <p className="studio-guide-group-head"><i /> Pas encore lu</p>
              ) : null}
              <div className="studio-frames studio-frames-dense">
                {group.frames.map((frame) => {
                  const beat = beats.get(frame.seconds);
                  return (
                    <button
                      key={frame.src}
                      type="button"
                      className={`studio-frame ${adapting && frame.seconds > adaptedUntil ? "is-todo" : ""}`}
                      onClick={() => setOpen({ src: frame.src, label: `${frame.label}${beat ? ` · ${beat.what}` : ""}`, seconds: frame.seconds })}
                      title={beat ? `${beat.what}${beat.change && beat.change !== "rien" ? `\nChangement : ${beat.change}` : ""}` : frame.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={frame.src} alt={beat?.what ?? `Image à ${frame.label}`} loading="lazy" />
                      <span>{frame.label}</span>
                      {gestures.get(frame.seconds) ? <small className="studio-frame-gesture" title="Geste repéré par la relecture fine, à vérifier">{gestures.get(frame.seconds)!.join(" · ")}</small> : null}
                      {beat ? <small className={`studio-frame-beat ${beat.change && beat.change !== "rien" ? "is-change" : ""}`}>{beat.what}</small> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </section>
      <StudioLightbox
        src={open?.src ?? null}
        label={open?.label}
        onClose={() => setOpen(null)}
        action={open && onCreatePanel ? { label: "Nouvelle case depuis cette image", onClick: () => { onCreatePanel({ src: open.src, seconds: open.seconds }); setOpen(null); } } : undefined}
      />
    </div>
  );
}
