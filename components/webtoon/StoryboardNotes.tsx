"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { fill, formatSeconds } from "@/lib/webtoon/text";
import type { WebtoonScript } from "@/lib/webtoon/types";

/** Why each panel exists: the engine's notes, readable under the strip. */
export function StoryboardNotes({ script }: { script: WebtoonScript }) {
  const { dict } = useLocale();
  const w = dict.webtoon;
  const fidelity = {
    direct: w.fidelityDirect,
    reframe: w.fidelityReframe,
    bridge: w.fidelityBridge,
  } as const;

  return (
    <section className="mt-14">
      <h2 className="anime-heading font-display text-2xl text-lily">{w.storyboardTitle}</h2>
      <p className="mt-2 max-w-2xl text-sm text-ivory/75">{w.storyboardLead}</p>
      <p className="mt-2 text-xs text-ivory/55">
        {fill(w.source, {
          episode: script.episode,
          start: formatSeconds(script.source.time_start),
          end: formatSeconds(script.source.time_end),
        })}
        {" · "}
        {script.source.origin.method}
      </p>
      <div className="mt-6 space-y-8">
        {script.beats.map((beat) => {
          const panels = script.panels.filter((p) => p.beat_id === beat.beat_id);
          return (
            <div key={beat.beat_id}>
              <h3 className="anime-label text-xs text-cyan-pale">
                {w.beat} {beat.beat_id} · {beat.title} · {formatSeconds(beat.source_time_start)} → {formatSeconds(beat.source_time_end)}
              </h3>
              <p className="mt-1 text-sm text-ivory/80">{beat.intent}</p>
              {panels.length === 0 ? (
                <p className="mt-2 text-xs text-ivory/50">·</p>
              ) : (
                <ol className="mt-3 space-y-3">
                  {panels.map((panel) => (
                    <li key={panel.panel_id} className="webtoon-note">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-display text-sm text-lily">{w.panel} {panel.order} · {panel.panel_id}</span>
                        <span className="text-xs text-ivory/55">
                          {w.shot} {panel.source_shots.join(", ")} · {formatSeconds(panel.source_time_start)} → {formatSeconds(panel.source_time_end)} · {panel.shot_type} · {panel.aspect_ratio} · {panel.panel_height}px · {fidelity[panel.fidelity]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ivory/85">{panel.purpose}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
