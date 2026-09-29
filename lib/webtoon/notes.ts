import type { WebtoonPanel, WebtoonScript } from "./types";

/** What the notes read of a panel: its place in the film and why it exists, nothing of its making. */
type NotePanel = Pick<WebtoonPanel, "panel_id" | "beat_id" | "order" | "source_shots" | "source_time_start" | "source_time_end" | "shot_type" | "aspect_ratio" | "panel_height" | "fidelity" | "purpose">;
export type NotesScript = Pick<WebtoonScript, "episode" | "beats"> & { source: Pick<WebtoonScript["source"], "time_start" | "time_end"> & { origin: Pick<WebtoonScript["source"]["origin"], "method"> }; panels: NotePanel[] };

/**
 * The script as the notes need it. The whole script, prompts included, went
 * to every reader's browser with the notes (1 MB of the page for episode 1).
 */
export function notesOf(script: WebtoonScript): NotesScript {
  return {
    episode: script.episode,
    beats: script.beats,
    source: { time_start: script.source.time_start, time_end: script.source.time_end, origin: { method: script.source.origin.method } },
    panels: script.panels.map(({ panel_id, beat_id, order, source_shots, source_time_start, source_time_end, shot_type, aspect_ratio, panel_height, fidelity, purpose }) => ({ panel_id, beat_id, order, source_shots, source_time_start, source_time_end, shot_type, aspect_ratio, panel_height, fidelity, purpose })),
  };
}
