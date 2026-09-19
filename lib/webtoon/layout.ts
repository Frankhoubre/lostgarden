import { WEBTOON_WIDTH, type WebtoonLayout, type WebtoonPanel } from "./types";

/** Height at canvas width for an aspect ratio written "w:h". */
export function heightForAspect(aspect: string, width = WEBTOON_WIDTH): number {
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h) throw new Error(`Bad aspect ratio: ${aspect}`);
  return Math.round((width * h) / w);
}

/**
 * LAYOUT: stack panels top to bottom. The gap before a panel takes that
 * panel's background, so a change of world (white memory to black cavern)
 * happens at the start of the gap, which is where the reader falls.
 */
export function computeLayout(
  panels: readonly WebtoonPanel[],
  width = WEBTOON_WIDTH,
): WebtoonLayout {
  let cursor = 0;
  const placements = panels.map((panel) => {
    const top = cursor + panel.spacing_before;
    cursor = top + panel.panel_height + panel.spacing_after;
    return {
      panel_id: panel.panel_id,
      top,
      height: panel.panel_height,
      gap_before: panel.spacing_before,
      gap_after: panel.spacing_after,
      background: panel.background,
    };
  });
  return { width, total_height: cursor, placements };
}
