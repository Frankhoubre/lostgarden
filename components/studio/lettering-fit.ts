"use client";

import type { Locale } from "@/lib/i18n/config";
import { bubbleFont, sfxFont } from "@/components/webtoon/fonts";
import { localizedText } from "@/lib/webtoon/text";
import { LETTERING_LOCALES } from "@/lib/webtoon/translate";
import { WEBTOON_WIDTH, type WebtoonPanel } from "@/lib/webtoon/types";

/**
 * BUBBLES THAT NO LONGER FIT, language by language. A line placed for its
 * French text can be half as long again in English, and a Japanese or Korean
 * line takes a full em per sign: the bubble grows past the edge of the panel
 * or over its neighbour, and nobody sees it until the export. Each bubble and
 * caption is measured in the real lettering CSS, in a hidden panel 1080 px
 * wide (the canvas, where 1cqw is 10.8 px), for every language it has.
 * Percent of the panel, like the anchors.
 */

export type LetteringIssue = {
  panel_id: string;
  order: number;
  locale: Locale;
  kind: "bubble" | "caption";
  index: number;
  /** `out`: past the edge of the panel; `overlap`: over another bubble; `tall`: taller than the panel. */
  reason: "out" | "overlap" | "tall";
  text: string;
};

type Box = { x: number; y: number; w: number; h: number };

/** Sizes of each line per language, percent of the panel. */
export type LetteringSizes = Map<string, { bubbles: Partial<Record<Locale, { w: number; h: number }>>[]; captions: Partial<Record<Locale, { w: number; h: number }>>[] }>;

const TOLERANCE = 1;

function hiddenPanel(): { host: HTMLDivElement; bubble: HTMLDivElement; caption: HTMLDivElement } {
  const host = document.createElement("div");
  host.className = `webtoon-strip ${bubbleFont.variable} ${sfxFont.variable}`;
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, { position: "fixed", left: "-20000px", top: "0", width: `${WEBTOON_WIDTH}px`, maxWidth: "none", visibility: "hidden", pointerEvents: "none" });
  const panel = document.createElement("div");
  panel.className = "webtoon-panel";
  Object.assign(panel.style, { width: `${WEBTOON_WIDTH}px`, height: "4000px" });
  const layer = document.createElement("div");
  layer.className = "webtoon-lettering";
  const bubble = document.createElement("div");
  const caption = document.createElement("div");
  layer.append(bubble, caption);
  panel.append(layer);
  host.append(panel);
  document.body.append(host);
  return { host, bubble, caption };
}

/** Measures every bubble and caption of these panels in every language of the lettering. */
export async function measureLettering(panels: WebtoonPanel[], locales: Locale[] = LETTERING_LOCALES): Promise<LetteringSizes> {
  try {
    await document.fonts.load(`800 36px ${bubbleFont.style.fontFamily}`);
    await document.fonts.ready;
  } catch {
    // Measured with the fallback face: close enough to flag the bubbles that overflow by much.
  }
  const { host, bubble, caption } = hiddenPanel();
  const sizes: LetteringSizes = new Map();
  try {
    for (const panel of panels) {
      const height = panel.panel_height || WEBTOON_WIDTH;
      const toPct = (el: HTMLElement) => ({ w: (el.offsetWidth / WEBTOON_WIDTH) * 100, h: (el.offsetHeight / height) * 100 });
      const bubbles = panel.dialogue.map((line) => {
        const out: Partial<Record<Locale, { w: number; h: number }>> = {};
        bubble.className = `webtoon-bubble webtoon-bubble-${line.style}`;
        bubble.style.left = "50%";
        bubble.style.top = "50%";
        for (const locale of locales) {
          if (!line.text[locale]) continue;
          bubble.textContent = localizedText(line.text, locale);
          out[locale] = toPct(bubble);
        }
        return out;
      });
      const captions = panel.caption.map((box) => {
        const out: Partial<Record<Locale, { w: number; h: number }>> = {};
        caption.className = `webtoon-caption webtoon-caption-${box.style}`;
        for (const locale of locales) {
          if (!box.text[locale]) continue;
          caption.textContent = localizedText(box.text, locale);
          out[locale] = toPct(caption);
        }
        return out;
      });
      sizes.set(panel.panel_id, { bubbles, captions });
    }
  } finally {
    host.remove();
  }
  return sizes;
}

const bubbleBoxAt = (anchor: { x: number; y: number }, size: { w: number; h: number }): Box => ({ x: anchor.x - size.w / 2, y: anchor.y - size.h / 2, w: size.w, h: size.h });
// A caption is placed by its top left corner, a title card by its centre.
const captionBoxAt = (anchor: { x: number; y: number }, size: { w: number; h: number }, centred: boolean): Box => (centred ? bubbleBoxAt(anchor, size) : { x: anchor.x, y: anchor.y, w: size.w, h: size.h });
const outside = (b: Box) => b.x < -TOLERANCE || b.y < -TOLERANCE || b.x + b.w > 100 + TOLERANCE || b.y + b.h > 100 + TOLERANCE;
const overlapping = (a: Box, b: Box) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 2 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 2;

/** What overflows, panel by panel and language by language. */
export function letteringIssues(panels: WebtoonPanel[], sizes: LetteringSizes): LetteringIssue[] {
  const issues: LetteringIssue[] = [];
  for (const panel of panels) {
    const measured = sizes.get(panel.panel_id);
    if (!measured) continue;
    const locales = new Set<Locale>(measured.bubbles.flatMap((b) => Object.keys(b) as Locale[]).concat(measured.captions.flatMap((c) => Object.keys(c) as Locale[])));
    for (const locale of locales) {
      const boxes: Box[] = [];
      panel.dialogue.forEach((line, index) => {
        const size = measured.bubbles[index]?.[locale];
        if (!size) return;
        const box = bubbleBoxAt(line.anchor, size);
        const text = localizedText(line.text, locale);
        if (size.h > 100) issues.push({ panel_id: panel.panel_id, order: panel.order, locale, kind: "bubble", index, reason: "tall", text });
        else if (outside(box)) issues.push({ panel_id: panel.panel_id, order: panel.order, locale, kind: "bubble", index, reason: "out", text });
        else if (boxes.some((other) => overlapping(other, box))) issues.push({ panel_id: panel.panel_id, order: panel.order, locale, kind: "bubble", index, reason: "overlap", text });
        boxes.push(box);
      });
      panel.caption.forEach((box, index) => {
        const size = measured.captions[index]?.[locale];
        if (!size) return;
        const placed = captionBoxAt(box.anchor, size, box.style === "title");
        const text = localizedText(box.text, locale);
        if (size.h > 100) issues.push({ panel_id: panel.panel_id, order: panel.order, locale, kind: "caption", index, reason: "tall", text });
        else if (outside(placed)) issues.push({ panel_id: panel.panel_id, order: panel.order, locale, kind: "caption", index, reason: "out", text });
      });
    }
  }
  return issues;
}

/**
 * Brings the lettering of a panel back inside it for every language at once:
 * each bubble and caption is moved just enough to fit with its largest
 * version, and a panel too short for its tallest line grows. Overlaps are
 * left to "Replacer les bulles", which knows where the faces are.
 */
export function fitLettering(panel: WebtoonPanel, sizes: LetteringSizes): WebtoonPanel {
  const measured = sizes.get(panel.panel_id);
  if (!measured) return panel;
  const margin = 1.5;
  const largest = (per: Partial<Record<Locale, { w: number; h: number }>> | undefined) =>
    Object.values(per ?? {}).reduce((m, s) => ({ w: Math.max(m.w, s?.w ?? 0), h: Math.max(m.h, s?.h ?? 0) }), { w: 0, h: 0 });
  let tallest = 0;
  const clampCentre = (value: number, half: number) => (half * 2 >= 100 - margin * 2 ? 50 : Math.min(100 - margin - half, Math.max(margin + half, value)));
  const round = (v: number) => Math.round(v * 10) / 10;
  const dialogue = panel.dialogue.map((line, index) => {
    const size = largest(measured.bubbles[index]);
    tallest = Math.max(tallest, size.h);
    if (!size.w) return line;
    return { ...line, anchor: { x: round(clampCentre(line.anchor.x, size.w / 2)), y: round(clampCentre(line.anchor.y, size.h / 2)) } };
  });
  const caption = panel.caption.map((box, index) => {
    const size = largest(measured.captions[index]);
    tallest = Math.max(tallest, size.h);
    if (!size.w) return box;
    if (box.style === "title") return { ...box, anchor: { x: round(clampCentre(box.anchor.x, size.w / 2)), y: round(clampCentre(box.anchor.y, size.h / 2)) } };
    const x = Math.min(100 - margin - size.w, Math.max(margin, box.anchor.x));
    const y = Math.min(100 - margin - size.h, Math.max(margin, box.anchor.y));
    return { ...box, anchor: { x: round(Math.max(margin, x)), y: round(Math.max(margin, y)) } };
  });
  // Percent of the current height: a line taller than 90% of the panel makes the panel grow to hold it.
  const panel_height = tallest > 90 ? Math.ceil((panel.panel_height * tallest) / 90) : panel.panel_height;
  return { ...panel, dialogue, caption, panel_height };
}
