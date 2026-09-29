import { SPACING_BY_TRANSITION } from "./adaptation";
import { sequenceAt, type FilmGuide, type GuideSequence, type SequenceKind } from "./film-guide";
import type { WebtoonPanel } from "./types";

/**
 * READING RHYTHM: the white between two panels is the time the reader takes
 * to go from one to the next. In an action sequence the panels follow each
 * other closely, the eye falls from one blow to the next; in a contemplation
 * the reader scrolls through empty space before the next image, the way the
 * film holds a shot. The film guide knows the kind of every second, so the
 * gap before each panel follows the sequence it belongs to, with a wide
 * break where a new sequence starts. Canvas px at 1080 wide.
 */

const GAP_BY_KIND: Record<SequenceKind, number> = {
  action: 50,
  tension: 100,
  dialogue: 120,
  calm: 260,
  contemplation: 440,
  transition: 320,
  flashback: 300,
  title: 520,
};

/** The gap where the film moves on to another sequence: a scene break the reader feels. */
const SEQUENCE_BREAK = 560;

/** Transitions the writer chose for their own sake (a fall, a fade): their gap is kept when it is wider. */
const DRAMATIC = new Set<WebtoonPanel["transition_type"]>(["fall", "fade_to_black", "fade_to_white", "time_skip"]);

function gapFor(sequence: GuideSequence): number {
  const base = GAP_BY_KIND[sequence.kind];
  if (sequence.kind === "action") return sequence.intensity >= 5 ? 24 : sequence.intensity >= 4 ? 40 : base;
  if (sequence.kind === "tension" && sequence.intensity >= 4) return 70;
  if (sequence.kind === "contemplation" && sequence.intensity <= 1) return 560;
  return base;
}

/**
 * The gap before a panel from the guide, or null when the guide says nothing
 * of its moment (no film time, a film not read yet) or the panel is laid over
 * the previous one (its overlap is the author's layout, not a gap).
 */
export function rhythmGap(panel: WebtoonPanel, previous: WebtoonPanel | null, guide: Pick<FilmGuide, "sequences"> | null | undefined): number | null {
  if (!guide?.sequences.length || panel.source_time_start === null || panel.frame?.overlap) return null;
  const sequence = sequenceAt(guide, panel.source_time_start);
  if (!sequence) return null;
  let gap = gapFor(sequence);
  if (previous && previous.source_time_start !== null) {
    const before = sequenceAt(guide, previous.source_time_start);
    if (before && before !== sequence) gap = Math.max(gap, SEQUENCE_BREAK);
  }
  if (DRAMATIC.has(panel.transition_type)) gap = Math.max(gap, SPACING_BY_TRANSITION[panel.transition_type]);
  return gap;
}

/**
 * Sets the gap before the panels of `ids` (every panel when omitted) from the
 * guide. The first panel of the strip keeps its gap. Returns the new list and
 * how many panels changed.
 */
export function applyRhythm(panels: WebtoonPanel[], guide: Pick<FilmGuide, "sequences"> | null | undefined, ids?: Set<string>): { panels: WebtoonPanel[]; changed: number } {
  let changed = 0;
  const next = panels.map((panel, index) => {
    if (index === 0 || (ids && !ids.has(panel.panel_id))) return panel;
    const gap = rhythmGap(panel, panels[index - 1], guide);
    if (gap === null || gap === panel.spacing_before) return panel;
    changed += 1;
    return { ...panel, spacing_before: gap };
  });
  return { panels: changed ? next : panels, changed };
}
