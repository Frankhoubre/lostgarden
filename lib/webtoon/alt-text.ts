/**
 * Short alt text for a panel image, from its generation description. The
 * description is written for the image model: long, and often followed by
 * directives ("STATE TO KEEP EXACTLY...", "MOTION:", "EFFECTS...", "SCALE:")
 * that mean nothing to a reader. Deterministic: no model call.
 */

/** Everything from the first of these markers on is a directive for the model. */
const DIRECTIVES = /\s*(?:STATE TO KEEP\b|MOTION:|EFFECTS\b|SCALE:)/;

export const PANEL_ALT_MAX = 140;

export function panelAlt(description: string | undefined | null, max = PANEL_ALT_MAX): string {
  if (!description) return "";
  const cut = description.search(DIRECTIVES);
  const text = (cut >= 0 ? description.slice(0, cut) : description).replace(/\s+/g, " ").trim().replace(/[\s,;:]+$/, "");
  if (text.length <= max) return text;
  // Whole sentences while they fit, so the alt reads as a sentence.
  let kept = "";
  for (const sentence of text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? []) {
    const next = `${kept}${sentence}`.trim();
    if (next.length > max) break;
    kept = `${next} `;
  }
  if (kept.trim()) return kept.trim();
  // A single long sentence: end it at its last clause that fits, else cut at a word and mark the cut.
  const slice = text.slice(0, max - 1);
  // The strongest break first: a semicolon ends a clause more cleanly than a comma.
  for (const mark of ["; ", ": ", ", "]) {
    const clause = slice.lastIndexOf(mark);
    if (clause > max * 0.4) return `${slice.slice(0, clause)}.`;
  }
  const space = slice.lastIndexOf(" ");
  return `${(space > max * 0.5 ? slice.slice(0, space) : slice).replace(/[\s,;:.]+$/, "")}…`;
}
