"use client";

import { useState } from "react";
import { STUDIO_ANALYSIS, STUDIO_SCREENPLAY, tc } from "@/lib/webtoon/studio-assets";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type StudioScreenplayProps = { panels: WebtoonPanel[] };

/**
 * The screenplay of episode 1 page by page, and next to it the shot list of
 * the analysed segment with the panels each shot became. What the film did
 * with the script, and what the strip did with the film, side by side.
 */
export function StudioScreenplay({ panels }: StudioScreenplayProps) {
  const [page, setPage] = useState(1);
  const current = STUDIO_SCREENPLAY.pages.find((p) => p.page === page) ?? STUDIO_SCREENPLAY.pages[0];
  const byShot = new Map<string, WebtoonPanel[]>();
  for (const panel of panels) {
    for (const shot of panel.source_shots) byShot.set(shot, [...(byShot.get(shot) ?? []), panel]);
  }

  return (
    <div className="studio-two">
      <section className="studio-card">
        <div className="studio-card-head">
          <div>
            <p className="anime-label text-xs text-cyan-pale">Scénario</p>
            <h2 className="font-display text-lg text-lily">{STUDIO_SCREENPLAY.title}</h2>
            <p className="text-xs text-ivory/60">{STUDIO_SCREENPLAY.source} · {STUDIO_SCREENPLAY.pages.length} pages · les pages 2 et 3 couvrent la première minute</p>
          </div>
          <a href={STUDIO_SCREENPLAY.pdf} target="_blank" rel="noreferrer" className="webtoon-mini">Ouvrir le PDF</a>
        </div>
        <div className="studio-pager">
          {STUDIO_SCREENPLAY.pages.map((p) => (
            <button key={p.page} type="button" className={`webtoon-mini ${p.page === page ? "is-active" : ""}`} onClick={() => setPage(p.page)}>{p.page}</button>
          ))}
        </div>
        <pre className="studio-screenplay">{current.text}</pre>
      </section>

      <section className="studio-card">
        <p className="anime-label text-xs text-cyan-pale">Découpage du film</p>
        <h2 className="font-display text-lg text-lily">{STUDIO_ANALYSIS.title}</h2>
        <p className="text-xs text-ivory/60">{STUDIO_ANALYSIS.origin.method}</p>
        <ol className="studio-shots">
          {STUDIO_ANALYSIS.shots.map((shot) => {
            const adapted = byShot.get(shot.shot_id) ?? [];
            return (
              <li key={shot.shot_id} className={adapted.length ? "" : "is-gap"}>
                <div className="studio-shot-head">
                  <b>{shot.shot_id}</b>
                  <span>{tc(shot.time_start)} à {tc(shot.time_end)} · {(shot.time_end - shot.time_start).toFixed(1)} s · {shot.shot_type}</span>
                  <span className="studio-shot-panels">{adapted.length ? adapted.map((p) => p.panel_id).join(", ") : "pas de case (espace)"}</span>
                </div>
                {shot.frames[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shot.frames[0]} alt="" loading="lazy" />
                ) : null}
                <p>{shot.description}</p>
                {shot.dialogue.length ? <p className="studio-shot-line">{shot.dialogue.map((d) => `${d.speaker} : « ${d.text} »`).join(" ")}</p> : null}
                {shot.notes ? <p className="studio-shot-note">{shot.notes}</p> : null}
              </li>
            );
          })}
        </ol>
        <div className="studio-subcard">
          <p className="webtoon-field-label">Continuité</p>
          <ul className="studio-bullets">
            {STUDIO_ANALYSIS.continuity.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}
