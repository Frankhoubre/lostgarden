"use client";

import type { Locale } from "@/lib/i18n/config";
import { localizedText } from "@/lib/webtoon/text";
import type { Caption, Dialogue, Sfx } from "@/lib/webtoon/types";

/**
 * Lettering layer: bubbles, captions and SFX are HTML on top of the art, so
 * they stay editable and localisable and never get baked into an image.
 * Sizes use container query units, so text scales with the strip width.
 */

type LetteringProps = {
  dialogue: Dialogue[];
  caption: Caption[];
  sfx: Sfx[];
  locale: Locale;
};

function Tail({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  // A webtoon tail: a short curved wedge. Its base sits under the bubble, the
  // tip stops a little short of the speaker, and the two sides bow the same
  // way so the tail reads as one brush stroke rather than a triangle.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const base = 3.6;
  const b1 = { x: from.x + nx * base, y: from.y + ny * base };
  const b2 = { x: from.x - nx * base, y: from.y - ny * base };
  const tip = { x: from.x + dx * 0.9, y: from.y + dy * 0.9 };
  const bow = 1.6;
  const c1 = { x: from.x + dx * 0.5 + nx * (base * 0.6 + bow), y: from.y + dy * 0.5 + ny * (base * 0.6 + bow) };
  const c2 = { x: from.x + dx * 0.5 - nx * (base * 0.6 - bow), y: from.y + dy * 0.5 - ny * (base * 0.6 - bow) };
  const d = `M ${b1.x} ${b1.y} Q ${c1.x} ${c1.y} ${tip.x} ${tip.y} Q ${c2.x} ${c2.y} ${b2.x} ${b2.y} Z`;
  return (
    <svg className="webtoon-tail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function PanelLettering({ dialogue, caption, sfx, locale }: LetteringProps) {
  return (
    <>
      {dialogue.map((line, index) => (
        <div key={`d${index}`} className="webtoon-lettering">
          {line.tail && line.style !== "off" ? (
            <Tail from={line.anchor} to={line.tail} />
          ) : null}
          <div
            className={`webtoon-bubble webtoon-bubble-${line.style}`}
            style={{ left: `${line.anchor.x}%`, top: `${line.anchor.y}%` }}
          >
            <span className="sr-only">{line.speaker}: </span>
            {localizedText(line.text, locale)}
          </div>
        </div>
      ))}
      {caption.map((box, index) => (
        <div
          key={`c${index}`}
          className={`webtoon-caption webtoon-caption-${box.style}`}
          style={{ left: `${box.anchor.x}%`, top: `${box.anchor.y}%` }}
        >
          {localizedText(box.text, locale)}
        </div>
      ))}
      {sfx.map((effect, index) => (
        <div
          key={`s${index}`}
          className={`webtoon-sfx webtoon-sfx-${effect.style}`}
          style={{
            left: `${effect.anchor.x}%`,
            top: `${effect.anchor.y}%`,
            transform: `translate(-50%, -50%) rotate(${effect.rotate ?? 0}deg)`,
            fontSize: `${((effect.size ?? 96) / 1080) * 100}cqw`,
          }}
          aria-hidden="true"
        >
          {localizedText(effect.text, locale)}
        </div>
      ))}
    </>
  );
}
