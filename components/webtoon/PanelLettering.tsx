"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { localizedText } from "@/lib/webtoon/text";
import type { Anchor, Caption, Dialogue, Sfx } from "@/lib/webtoon/types";

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

/**
 * Tail geometry, computed from the bubble's real box: it starts just inside
 * the oval's edge, along the direction of the speaker, and stops a little
 * short of the target. Coordinates are percent of the panel. `null` when the
 * target sits inside the bubble.
 */
export function tailPath(
  bubble: { cx: number; cy: number; rx: number; ry: number },
  target: { x: number; y: number },
  panel: { w: number; h: number },
): string | null {
  const dx = target.x - bubble.cx;
  const dy = target.y - bubble.cy;
  if (!dx && !dy) return null;
  const t = 1 / Math.sqrt((dx / bubble.rx) ** 2 + (dy / bubble.ry) ** 2);
  if (t >= 0.98) return null;
  const length = Math.hypot(dx, dy);
  const nx = -dy / length;
  const ny = dx / length;
  const half = Math.min(panel.w * 0.032, bubble.rx * 0.45);
  const base = { x: bubble.cx + dx * t * 0.82, y: bubble.cy + dy * t * 0.82 };
  const tip = { x: bubble.cx + dx * 0.9, y: bubble.cy + dy * 0.9 };
  const bow = panel.w * 0.014;
  const mid = { x: (base.x + tip.x) / 2, y: (base.y + tip.y) / 2 };
  const p = (x: number, y: number) => `${((x / panel.w) * 100).toFixed(2)} ${((y / panel.h) * 100).toFixed(2)}`;
  const b1 = p(base.x + nx * half, base.y + ny * half);
  const b2 = p(base.x - nx * half, base.y - ny * half);
  const c1 = p(mid.x + nx * (half * 0.55 + bow), mid.y + ny * (half * 0.55 + bow));
  const c2 = p(mid.x - nx * (half * 0.55 - bow), mid.y - ny * (half * 0.55 - bow));
  return `M ${b1} Q ${c1} ${p(tip.x, tip.y)} Q ${c2} ${b2} Z`;
}

function Bubble({ line, locale }: { line: Dialogue; locale: Locale }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tail, setTail] = useState<string | null>(null);
  const target: Anchor | undefined = line.style === "off" ? undefined : line.tail;

  useEffect(() => {
    const el = ref.current;
    const panel = el?.closest<HTMLElement>(".webtoon-panel");
    if (!el || !panel || !target) return;
    const measure = () => {
      const pr = panel.getBoundingClientRect();
      const br = el.getBoundingClientRect();
      if (!pr.width || !br.width) return;
      setTail(
        tailPath(
          {
            cx: br.left - pr.left + br.width / 2,
            cy: br.top - pr.top + br.height / 2,
            rx: br.width / 2,
            ry: br.height / 2,
          },
          { x: (target.x / 100) * pr.width, y: (target.y / 100) * pr.height },
          { w: pr.width, h: pr.height },
        ),
      );
    };
    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(panel);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [target, locale, line.text, line.style]);

  return (
    <div className="webtoon-lettering">
      {tail ? (
        <svg className="webtoon-tail webtoon-tail-under" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={tail} />
        </svg>
      ) : null}
      <div
        ref={ref}
        className={`webtoon-bubble webtoon-bubble-${line.style}`}
        style={{ left: `${line.anchor.x}%`, top: `${line.anchor.y}%` }}
      >
        <span className="sr-only">{line.speaker}: </span>
        {localizedText(line.text, locale)}
      </div>
      {tail ? (
        <svg className="webtoon-tail webtoon-tail-over" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={tail} />
        </svg>
      ) : null}
    </div>
  );
}

export function PanelLettering({ dialogue, caption, sfx, locale }: LetteringProps) {
  return (
    <>
      {dialogue.map((line, index) => (
        <Bubble key={`d${index}`} line={line} locale={locale} />
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
