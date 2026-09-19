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
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  // The tail is a slim triangle: its base sits under the bubble (hidden by
  // it), its tip stops a little short of the target so it points at the
  // speaker without touching the mouth.
  const px = (-dy / length) * 3.4;
  const py = (dx / length) * 3.4;
  const tipX = from.x + dx * 0.92;
  const tipY = from.y + dy * 0.92;
  const points = `${from.x + px},${from.y + py} ${from.x - px},${from.y - py} ${tipX},${tipY}`;
  return (
    <svg
      className="webtoon-tail"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polygon points={points} />
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
