"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { letterJitter } from "@/lib/webtoon/sfx-library";
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
  // Both corners of the base stay inside the oval: a corner past the edge left the outline of the base
  // visible outside the bubble, a small dark notch where the tail met it (the "cassure" of 28 September).
  // The base narrows until it fits; when that leaves a thread, it sits a little deeper in the bubble.
  const inside = (x: number, y: number) => ((x - bubble.cx) / bubble.rx) ** 2 + ((y - bubble.cy) / bubble.ry) ** 2 <= 0.94;
  const wanted = Math.min(panel.w * 0.032, bubble.rx * 0.45);
  let base = { x: bubble.cx, y: bubble.cy };
  let half = wanted;
  for (const depth of [0.82, 0.76, 0.7]) {
    base = { x: bubble.cx + dx * t * depth, y: bubble.cy + dy * t * depth };
    half = wanted;
    while (half > 1 && !(inside(base.x + nx * half, base.y + ny * half) && inside(base.x - nx * half, base.y - ny * half))) half *= 0.88;
    if (half >= wanted * 0.6) break;
  }
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
  /** The bubble's own border, in px: the tail's outline is drawn exactly as thick. */
  const [border, setBorder] = useState<number | null>(null);
  const target: Anchor | undefined = line.style === "off" ? undefined : line.tail;

  // Measured in the panel's own layout, never on screen: a tilted panel (frame.tilt) is rotated, and its
  // screen box is larger than the panel, which put the tail beside the bubble instead of under it. The
  // bubble's centre is its anchor (it is translated by -50%, -50%); its size is its layout size.
  const ax = line.anchor.x;
  const ay = line.anchor.y;
  const tx = target?.x;
  const ty = target?.y;
  useEffect(() => {
    const el = ref.current;
    const layer = el?.parentElement;
    if (!el || !layer || tx === undefined || ty === undefined) {
      setTail(null);
      return;
    }
    const measure = () => {
      const w = layer.clientWidth;
      const h = layer.clientHeight;
      if (!w || !h || !el.offsetWidth) return;
      const width = parseFloat(getComputedStyle(el).borderTopWidth);
      setBorder(Number.isFinite(width) && width > 0 ? width : null);
      setTail(
        tailPath(
          { cx: (ax / 100) * w, cy: (ay / 100) * h, rx: el.offsetWidth / 2, ry: el.offsetHeight / 2 },
          { x: (tx / 100) * w, y: (ty / 100) * h },
          { w, h },
        ),
      );
    };
    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(layer);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ax, ay, tx, ty, locale, line.text, line.style]);

  return (
    <div className="webtoon-lettering">
      {tail ? (
        <svg className="webtoon-tail webtoon-tail-under" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {/* Twice the bubble's border: the fill drawn over the bubble hides the inner half of the stroke. */}
          <path d={tail} style={border ? { strokeWidth: `${border * 2}px` } : undefined} />
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

/** How much a style's letters wobble: none on the smooth ones, a little on a blow, a lot on a crack. */
const WOBBLE: Partial<Record<Sfx["style"], number>> = { hard: 0.6, impact: 1, metal: 0.45, crack: 1.5 };

/**
 * A sound drawn letter by letter: each letter turned, scaled and lifted a
 * little, seeded on the text so it keeps its shape. Smooth styles (a breath,
 * a hum, a rush of air) stay one piece of text.
 */
function SfxLetters({ text, style }: { text: string; style: Sfx["style"] }) {
  const strength = WOBBLE[style];
  if (!strength) return <>{text}</>;
  return (
    <>
      {Array.from(text).map((char, index) => {
        if (char === " ") return <span key={index}> </span>;
        const j = letterJitter(text, index, strength);
        return (
          <span key={index} className="webtoon-sfx-letter" style={{ transform: `translateY(${j.lift}em) rotate(${j.rotate.toFixed(1)}deg) scale(${j.scale.toFixed(3)})` }}>
            {char}
          </span>
        );
      })}
    </>
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
          <SfxLetters text={localizedText(effect.text, locale)} style={effect.style} />
        </div>
      ))}
    </>
  );
}
