"use client";

import { useMemo, useState } from "react";
import { StudioLightbox } from "@/components/studio/StudioLightbox";
import { STUDIO_ANALYSIS, studioFilmFrames } from "@/lib/webtoon/studio-assets";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type StudioFramesProps = { panels: WebtoonPanel[] };

/**
 * The film as images: the exact frames the analysis picked for each shot,
 * then one frame every five seconds over the whole episode, with the part
 * already adapted marked, so the next segment is easy to pick.
 */
export function StudioFrames({ panels }: StudioFramesProps) {
  const [open, setOpen] = useState<{ src: string; label: string } | null>(null);
  const frames = studioFilmFrames();
  const adaptedUntil = useMemo(() => Math.max(0, ...panels.map((p) => p.source_time_end ?? 0)), [panels]);
  const shotFrames = STUDIO_ANALYSIS.shots.filter((shot) => shot.frames.length);

  return (
    <div className="space-y-6">
      <section className="studio-card">
        <p className="anime-label text-xs text-cyan-pale">Images de référence des plans adaptés</p>
        <h2 className="font-display text-lg text-lily">{shotFrames.length} plans, une image chacun</h2>
        <p className="text-xs text-ivory/60">Ce sont les images jointes en dernier dans chaque prompt, pour le cadrage et la lumière.</p>
        <div className="studio-frames">
          {shotFrames.map((shot) => (
            <button key={shot.shot_id} type="button" className="studio-frame" onClick={() => setOpen({ src: shot.frames[0], label: `${shot.shot_id} · ${shot.time_start} s à ${shot.time_end} s` })}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.frames[0]} alt={shot.description} loading="lazy" />
              <span>{shot.shot_id} · {shot.time_start.toFixed(1)} s</span>
            </button>
          ))}
        </div>
      </section>

      <section className="studio-card">
        <p className="anime-label text-xs text-cyan-pale">L&apos;épisode entier</p>
        <h2 className="font-display text-lg text-lily">{frames.length} images, une toutes les 5 secondes</h2>
        <p className="text-xs text-ivory/60">
          Adapté jusqu&apos;à {adaptedUntil.toFixed(1)} s. Les images grisées sont encore à adapter. Le proxy vidéo complet est dans le dépôt de production (12_Episodes/episode-1-proxy.mp4).
        </p>
        <div className="studio-frames studio-frames-dense">
          {frames.map((frame) => (
            <button
              key={frame.src}
              type="button"
              className={`studio-frame ${frame.seconds > adaptedUntil ? "is-todo" : ""}`}
              onClick={() => setOpen({ src: frame.src, label: `Épisode 1 · ${frame.label}` })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame.src} alt={`Épisode 1 à ${frame.label}`} loading="lazy" />
              <span>{frame.label}</span>
            </button>
          ))}
        </div>
      </section>
      <StudioLightbox src={open?.src ?? null} label={open?.label} onClose={() => setOpen(null)} />
    </div>
  );
}
