import type { Locale } from "@/lib/i18n/config";

/** One subtitle cue. Times in seconds from the start of the episode. */
export type TranscriptCue = {
  start: number;
  end: number;
  text: string;
};

export type Transcript = readonly TranscriptCue[];

/**
 * Cues grouped into paragraphs: a new paragraph starts when the gap
 * between two cues exceeds `gapSeconds`, which follows the scene cuts
 * closely enough for reading.
 */
export function groupCues(cues: Transcript, gapSeconds = 4): TranscriptCue[][] {
  const groups: TranscriptCue[][] = [];
  for (const cue of cues) {
    const current = groups[groups.length - 1];
    if (current && cue.start - current[current.length - 1].end <= gapSeconds) current.push(cue);
    else groups.push([cue]);
  }
  return groups;
}

export function formatTimestamp(seconds: number): string {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export type TranscriptByLocale = Record<Locale, Transcript>;
