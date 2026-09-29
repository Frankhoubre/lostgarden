"use client";

import { Fragment, useMemo } from "react";
import type { PanelBusy } from "@/components/studio/PanelCanvas";
import type { FilmGuide } from "@/lib/webtoon/film-guide";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type Frame = { src: string; seconds: number; label: string };

type StudioReviewProps = {
  panels: WebtoonPanel[];
  /** The film, one frame per second. */
  frames: Frame[];
  guide: FilmGuide | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** A new panel drawn from the film at this second, after this panel, with this description. */
  onAdd: (input: { seconds: number; afterId: string; description: string }) => void;
  busyIds?: ReadonlyMap<string, PanelBusy>;
  /** Seconds without a panel from which a stretch counts as a hole. */
  holeSeconds: number;
};

const tc = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;

/**
 * The strip read against the film: each panel next to the frame of its
 * second and the line the film guide wrote for it; between two panels, the
 * gestures the close re-reading noted and no panel draws, and the stretches
 * of film without a panel. A missing moment becomes a panel in one click,
 * drawn from that very frame.
 */
export function StudioReview({ panels, frames, guide, selectedId, onSelect, onAdd, busyIds, holeSeconds }: StudioReviewProps) {
  const bySecond = useMemo(() => new Map(frames.map((f) => [f.seconds, f])), [frames]);
  const beats = useMemo(() => new Map((guide?.beats ?? []).map((b) => [b.seconds, b])), [guide]);
  const starts = useMemo(() => panels.map((p) => p.source_time_start).filter((s): s is number => s !== null), [panels]);
  const drawn = (seconds: number) => starts.some((s) => Math.abs(s - seconds) <= 1);
  const frameAt = (seconds: number) => bySecond.get(Math.round(seconds)) ?? frames.reduce<Frame | undefined>((best, f) => (!best || Math.abs(f.seconds - seconds) < Math.abs(best.seconds - seconds) ? f : best), undefined);

  return (
    <div className="studio-review">
      <div className="studio-review-head">
        <span>Film</span>
        <span>Case</span>
        <span>Ce que montre le film</span>
      </div>
      {panels.map((panel, index) => {
        const next = panels.slice(index + 1).find((p) => p.source_time_start !== null);
        const start = panel.source_time_start;
        const film = start !== null ? frameAt(start) : undefined;
        const beat = start !== null ? beats.get(Math.round(start)) : undefined;
        const until = next?.source_time_start ?? (start !== null ? start + 6 : null);
        // Gestures noted between this panel and the next that no panel draws.
        const missed = start !== null && until !== null ? (guide?.gestures ?? []).filter((g) => g.seconds > start && g.seconds < until && !drawn(g.seconds)) : [];
        const hole = start !== null && until !== null && until - start >= holeSeconds && !(next?.gap_ignored ?? false) ? { from: start + 1, to: until - 1 } : null;
        const busy = busyIds?.get(panel.panel_id);
        return (
          <Fragment key={panel.panel_id}>
            <button type="button" className={`studio-review-row ${panel.panel_id === selectedId ? "is-active" : ""}`} onClick={() => onSelect(panel.panel_id)}>
              <span className="studio-review-film">
                {film ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={film.src} alt="" loading="lazy" />
                ) : (
                  <span className="studio-review-none">pas de seconde du film</span>
                )}
                {start !== null ? <b>{tc(start)}</b> : null}
              </span>
              <span className="studio-review-panel">
                {panel.image.src && panel.image.status !== "missing" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={panel.image.src} alt="" loading="lazy" />
                ) : (
                  <span className="studio-review-none">{panel.caption.some((c) => c.style === "title") ? "carte-titre" : "pas d'image"}</span>
                )}
                <b>
                  {panel.order}
                  {busy ? ` · ${busy.label}` : ""}
                </b>
              </span>
              <span className="studio-review-text">
                {beat ? <span className="studio-review-beat">{beat.what}</span> : <span className="studio-review-beat is-empty">Pas de ligne du guide à cette seconde.</span>}
                <small>{panel.description.split("STATE TO KEEP")[0].slice(0, 160)}</small>
              </span>
            </button>
            {missed.map((g) => {
              const f = frameAt(g.seconds);
              return (
                <div key={`g-${panel.panel_id}-${g.seconds}-${g.gesture}`} className="studio-review-gap is-gesture">
                  <span className="studio-review-film">
                    {f ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.src} alt="" loading="lazy" />
                    ) : null}
                    <b>{tc(g.seconds)}</b>
                  </span>
                  <span className="studio-review-text">
                    <span className="studio-review-beat">Geste non dessiné, à vérifier : {g.gesture}</span>
                    <small>Repéré par la relecture fine du film. Regardez l&apos;image avant d&apos;ajouter la case.</small>
                  </span>
                  <button type="button" className="webtoon-mini studio-primary" onClick={() => onAdd({ seconds: g.seconds, afterId: panel.panel_id, description: g.gesture })}>
                    Ajouter une case
                  </button>
                </div>
              );
            })}
            {hole ? (
              <div className="studio-review-gap is-hole">
                <span className="studio-review-text">
                  <span className="studio-review-beat">
                    Passage sans case : {tc(hole.from)} → {tc(hole.to)}
                  </span>
                  <small>Cliquez une image pour en faire une case à cet endroit.</small>
                </span>
                <span className="studio-review-strip">
                  {frames
                    .filter((f) => f.seconds >= hole.from && f.seconds <= hole.to && (f.seconds - hole.from) % 2 === 0)
                    .slice(0, 12)
                    .map((f) => (
                      <button
                        key={f.src}
                        type="button"
                        title={`${f.label}${beats.get(f.seconds) ? ` · ${beats.get(f.seconds)!.what}` : ""} · ajouter une case`}
                        onClick={() => onAdd({ seconds: f.seconds, afterId: panel.panel_id, description: beats.get(f.seconds)?.what ?? "" })}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.src} alt="" loading="lazy" />
                        <span>{f.label}</span>
                      </button>
                    ))}
                </span>
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
