import type { Anchor, Dialogue, Sfx } from "./types";

/**
 * LETTERING LAYOUT, after the image is drawn. The writer places bubbles
 * before any image exists, so they landed in the void, pointed at the centre
 * of the panel, sat on top of each other or of a sound effect, or ran off the
 * bottom edge (Frank's notes on panels 469, 484, 567, 568, 609). Here the
 * bubbles are placed from where the characters actually are in the drawing:
 * next to the head of the one who speaks, the tail on him, inside the panel,
 * never over another bubble or a sound effect. Everything is in percent of
 * the panel.
 */

export type Figure = {
  /** Library id of the character, or "unknown". */
  who: string;
  /** Head (or helmet) centre, percent of the panel. */
  head: Anchor;
};

type Box = { x: number; y: number; w: number; h: number };

const MARGIN = 3;

/** The size a bubble takes, from its text, in percent of the panel (the CSS: 24 to 48cqw wide, 3.4cqw text, 1.25 line height). */
export function bubbleBox(line: Pick<Dialogue, "text" | "style">, panel: { width: number; height: number }): { w: number; h: number } {
  const text = line.text.fr ?? line.text.en ?? "";
  const shout = line.style === "shout";
  const font = shout ? 5 : 3.4;
  // Words wrap before the edge: count a fifth fewer characters per line than fit.
  const perLine = Math.max(8, Math.floor(((48 - 10.4) / (font * 0.56)) * 0.8));
  const lines = Math.max(1, Math.ceil(text.length / perLine));
  const widthCqw = Math.min(48, Math.max(24, Math.min(text.length, perLine) * font * 0.52 + 10.4));
  const heightCqw = lines * font * 1.25 + 7.2;
  const cqwToY = panel.width / panel.height;
  return { w: widthCqw, h: heightCqw * cqwToY };
}

function sfxBox(effect: Sfx, panel: { width: number; height: number }): Box {
  const text = effect.text.fr ?? effect.text.en ?? "";
  const size = ((effect.size ?? 96) / 1080) * 100;
  const w = Math.min(95, text.length * size * 0.7 + 4);
  const h = size * 1.3 * (panel.width / panel.height);
  return { x: effect.anchor.x - w / 2, y: effect.anchor.y - h / 2, w, h };
}

const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * The height a panel needs, in canvas px at 1080 wide, for its bubbles to fit
 * inside it: the tallest bubble plus room for the art (a wide 3:1 strip with
 * a three-line line cut the text at the bottom, panel 469).
 */
export function heightForLettering(dialogue: Pick<Dialogue, "text" | "style">[]): number {
  if (!dialogue.length) return 0;
  const unit = { width: 100, height: 100 };
  const tallest = Math.max(...dialogue.map((line) => bubbleBox(line, unit).h));
  const stacked = dialogue.reduce((sum, line) => sum + bubbleBox(line, unit).h, 0);
  // In cqw (percent of the width): the bubbles side by side need the tallest, stacked need their sum; keep 40% for the art.
  const needed = Math.max(tallest / 0.55, (dialogue.length > 1 ? stacked * 0.75 : tallest) / 0.6);
  return Math.round((needed / 100) * 1080);
}

/**
 * Places every bubble of a panel. `figures` are the characters found in the
 * image. A speaker who is visible gets his bubble near his head (above it
 * when there is room, else beside it) and his tail; a speaker who is not in
 * the image speaks off-panel (a square box without tail, the only use of that
 * style). Candidates are tried until one stays inside the panel and touches
 * no other bubble, no sound effect and no face.
 */
export function layoutBubbles(input: { dialogue: Dialogue[]; sfx: Sfx[]; figures: Figure[]; panel: { width: number; height: number }; /** The characters of the series: their lines are never a voice-over box. */ cast?: string[] }): Dialogue[] {
  const { panel, figures } = input;
  const taken: Box[] = input.sfx.map((effect) => sfxBox(effect, panel));
  // Faces stay visible: a small box around each head.
  const faces: Box[] = figures.map((f) => ({ x: f.head.x - 9, y: f.head.y - 7, w: 18, h: 14 }));
  return input.dialogue.map((line, index) => {
    const size = bubbleBox(line, panel);
    const speaker = figures.find((f) => f.who === line.speaker);
    // The square box is for a real voice-over only (Frank, panel 567). A speaker of the scene who is out of this
    // panel keeps a round bubble whose tail points out of the panel, towards the edge; one who is drawn gets his tail.
    const known = Boolean(speaker) || (input.cast ?? []).includes(line.speaker);
    const style = known && line.style === "off" ? "speech" : line.style;
    const fits = (cx: number, cy: number) => {
      const box = { x: cx - size.w / 2, y: cy - size.h / 2, w: size.w, h: size.h };
      if (box.x < MARGIN || box.y < MARGIN || box.x + box.w > 100 - MARGIN || box.y + box.h > 100 - MARGIN) return null;
      if (taken.some((t) => overlap(t, box))) return null;
      if (faces.some((f) => overlap(f, box))) return null;
      return box;
    };
    const candidates: Anchor[] = [];
    if (speaker) {
      const { x, y } = speaker.head;
      const up = y - 10 - size.h / 2;
      const side = x < 50 ? 1 : -1;
      candidates.push(
        { x, y: up },
        { x: x + side * (size.w / 2 + 6), y: up },
        { x: x + side * (size.w / 2 + 10), y },
        { x: x - side * (size.w / 2 + 10), y },
        { x: x + side * (size.w / 2 + 6), y: y + 10 + size.h / 2 },
      );
    }
    // Reading order: top of the panel first, left then right, then lower.
    for (const cy of [8, 22, 36, 50, 64, 78]) for (const cx of [28, 72, 50]) candidates.push({ x: cx, y: cy + size.h / 2 - 4 });
    let placed: Box | null = null;
    let anchor: Anchor = line.anchor;
    for (const c of candidates) {
      const cx = clamp(c.x, MARGIN + size.w / 2, 100 - MARGIN - size.w / 2);
      const cy = clamp(c.y, MARGIN + size.h / 2, 100 - MARGIN - size.h / 2);
      const box = fits(cx, cy);
      if (box) {
        placed = box;
        anchor = { x: Math.round(cx * 10) / 10, y: Math.round(cy * 10) / 10 };
        break;
      }
    }
    if (!placed) {
      // Nowhere free: keep it inside the panel at least, stacked in reading order.
      anchor = { x: clamp(index % 2 ? 70 : 30, MARGIN + size.w / 2, 100 - MARGIN - size.w / 2), y: clamp(10 + index * (size.h + 3) + size.h / 2, MARGIN + size.h / 2, 100 - MARGIN - size.h / 2) };
      placed = { x: anchor.x - size.w / 2, y: anchor.y - size.h / 2, w: size.w, h: size.h };
    }
    taken.push(placed);
    return {
      ...line,
      style,
      anchor,
      ...(speaker
        ? { tail: { x: speaker.head.x, y: Math.min(98, speaker.head.y + 3) } }
        : style === "off"
          ? { tail: undefined }
          : { tail: { x: anchor.x < 50 ? 0 : 100, y: clamp(anchor.y + size.h / 2 + 6, 0, 100) } }),
    };
  });
}

/** Image coordinates (percent of the drawn image) to panel coordinates, for an image shown with object-fit cover around a focal point; null when the crop hides the point. */
export function imageToPanel(point: Anchor, image: { width: number; height: number }, panel: { width: number; height: number }, focal: Anchor): Anchor | null {
  const scale = Math.max(panel.width / image.width, panel.height / image.height);
  const shownW = image.width * scale;
  const shownH = image.height * scale;
  const offX = clamp((focal.x / 100) * shownW - panel.width / 2, 0, shownW - panel.width);
  const offY = clamp((focal.y / 100) * shownH - panel.height / 2, 0, shownH - panel.height);
  const x = (((point.x / 100) * shownW - offX) / panel.width) * 100;
  const y = (((point.y / 100) * shownH - offY) / panel.height) * 100;
  return x < 0 || x > 100 || y < 0 || y > 100 ? null : { x, y };
}

/** True when nobody placed these bubbles by hand: the writer's defaults (tail on the centre of the panel). */
export function autoPlaced(dialogue: Dialogue[]): boolean {
  return dialogue.every((line) => !line.tail || (line.tail.x === 50 && line.tail.y === 50));
}

/**
 * The lettering rules that need no image: a line given to a character who
 * never speaks (Lanterne) goes to the other character of the panel, or to the
 * last one who spoke, or becomes a voice-over; a panel too short for its
 * bubbles grows to hold them.
 */
export function fixLettering<P extends { characters: string[]; dialogue: Dialogue[]; panel_height: number }>(panel: P, rules: { mute?: string[]; lastSpeaker?: string }): P {
  const mute = new Set(rules.mute ?? []);
  const dialogue = panel.dialogue.map((line) => {
    if (!mute.has(line.speaker)) return line;
    const other = panel.characters.find((c) => !mute.has(c)) ?? (rules.lastSpeaker && !mute.has(rules.lastSpeaker) ? rules.lastSpeaker : "");
    return other ? { ...line, speaker: other } : { ...line, speaker: "voice", style: "off" as const };
  });
  const height = heightForLettering(dialogue);
  return { ...panel, dialogue, panel_height: Math.max(panel.panel_height || 0, height) };
}
