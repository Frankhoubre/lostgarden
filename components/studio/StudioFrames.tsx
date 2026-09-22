"use client";

import { useMemo, useState } from "react";
import { StudioLightbox } from "@/components/studio/StudioLightbox";
import { STUDIO_ANALYSIS, studioFilmFrames, studioFilmFramesDense } from "@/lib/webtoon/studio-assets";
import { coveredUntil } from "@/lib/webtoon/continuity";
import { sparseFrames } from "@/lib/webtoon/project";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type StudioFramesProps = {
  panels: WebtoonPanel[];
  /** Continue the strip: a new panel drawn from this frame, appended after the last one. */
  onCreatePanel: (frame: { src: string; seconds: number }) => void;
  /** The film of a project, one frame per second; Lost Garden episode 1 when unset. */
  frames?: { src: string; seconds: number; label: string }[];
};

/**
 * The film as images: the exact frames the analysis picked for each shot,
 * then one frame every five seconds over the whole episode, with the part
 * already adapted marked, so the next segment is easy to pick.
 */
export function StudioFrames({ panels, onCreatePanel, frames: projectFrames }: StudioFramesProps) {
  const [open, setOpen] = useState<{ src: string; label: string; seconds: number } | null>(null);
  /** One frame per second (what the writer reads) or one every five seconds (lighter to scan). */
  const [dense, setDense] = useState(true);
  const frames = projectFrames ? (dense ? projectFrames : sparseFrames(projectFrames)) : dense ? studioFilmFramesDense() : studioFilmFrames();
  const adaptedUntil = useMemo(() => coveredUntil(panels), [panels]);
  const shotFrames = projectFrames ? [] : STUDIO_ANALYSIS.shots.filter((shot) => shot.frames.length);

  return (
    <div className="space-y-6">
      {shotFrames.length ? <section className="studio-card">
        <p className="anime-label text-xs text-cyan-pale">Images de référence des plans adaptés</p>
        <h2 className="font-display text-lg text-lily">{shotFrames.length} plans, une image chacun</h2>
        <p className="text-xs text-ivory/60">Ce sont les images jointes en dernier dans chaque prompt, pour le cadrage et la lumière.</p>
        <div className="studio-frames">
          {shotFrames.map((shot) => (
            <button key={shot.shot_id} type="button" className="studio-frame" onClick={() => setOpen({ src: shot.frames[0], label: `${shot.shot_id} · ${shot.time_start} s à ${shot.time_end} s`, seconds: shot.time_start })}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.frames[0]} alt={shot.description} loading="lazy" />
              <span>{shot.shot_id} · {shot.time_start.toFixed(1)} s</span>
            </button>
          ))}
        </div>
      </section> : null}

      <section className="studio-card">
        <div className="studio-section-head">
          <div>
            <p className="anime-label text-xs text-cyan-pale">L&apos;épisode entier</p>
            <h2 className="font-display text-lg text-lily">{frames.length} images, une toutes les {dense ? "secondes" : "5 secondes"}</h2>
          </div>
          <div className="studio-viewswitch" role="group" aria-label="Densité des images">
            <button type="button" className={`webtoon-mini ${dense ? "is-active" : ""}`} onClick={() => setDense(true)} title="Ce que l'écrivain lit : chaque seconde du film">1 s</button>
            <button type="button" className={`webtoon-mini ${!dense ? "is-active" : ""}`} onClick={() => setDense(false)} title="Une image toutes les cinq secondes, plus léger à parcourir">5 s</button>
          </div>
        </div>
        <p className="text-xs text-ivory/60">
          Adapté jusqu&apos;à {adaptedUntil.toFixed(1)} s. Les images grisées sont encore à adapter : ouvre une image et « Nouvelle case » l&apos;ajoute à la fin de la bande, avec l&apos;image jointe au prompt. Ces images sont extraites du proxy vidéo (12_Episodes/episode-1-proxy.mp4).
        </p>
        <div className="studio-frames studio-frames-dense">
          {frames.map((frame) => (
            <button
              key={frame.src}
              type="button"
              className={`studio-frame ${frame.seconds > adaptedUntil ? "is-todo" : ""}`}
              onClick={() => setOpen({ src: frame.src, label: `Épisode 1 · ${frame.label}`, seconds: frame.seconds })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame.src} alt={`Épisode 1 à ${frame.label}`} loading="lazy" />
              <span>{frame.label}</span>
            </button>
          ))}
        </div>
      </section>
      <StudioLightbox
        src={open?.src ?? null}
        label={open?.label}
        onClose={() => setOpen(null)}
        action={open ? { label: "Nouvelle case depuis cette image", onClick: () => { onCreatePanel({ src: open.src, seconds: open.seconds }); setOpen(null); } } : undefined}
      />
    </div>
  );
}
