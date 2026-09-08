export const EPISODE_ONE = {
  youtubeId: "eZ_JlaLDJ-8",
  watchUrl: "https://youtu.be/eZ_JlaLDJ-8",
  embedUrl: "https://www.youtube.com/embed/eZ_JlaLDJ-8",
  /** Actual YouTube upload date, matching IMDb, TMDB and Wikidata. */
  publishedAt: "2026-05-29",
  /** ISO 8601 runtime, matching IMDb and the press kit. */
  duration: "PT17M",
} as const;

/**
 * Start time in seconds of each chapter of Episode One, in the order of
 * `experience.timeline` in the dictionaries (The Oath, The Awakening, The
 * Blue Forest, The Eye in the Dark, The Child in the Lilies). Fill it from
 * the YouTube chapter markers; while it is empty no Clip markup is emitted.
 */
export const EPISODE_ONE_CHAPTER_STARTS: readonly number[] = [];

/** Total runtime in seconds, used as the end of the last chapter. */
export const EPISODE_ONE_RUNTIME_SECONDS = 17 * 60;
