/**
 * THE SERIES: the published episodes, in order, readable by anyone. The
 * studio adds or updates an episode each time it publishes one (Lost Garden
 * episode 1 from the code, the others from studio projects), in the public
 * document `webtoon_published/~series` (`episodes_json`). The series page
 * lists them, and each episode links to the one before and after.
 */

export type SeriesEpisode = {
  slug: string;
  series: string;
  episode: number;
  title: string;
  /** A light image of the episode for its card. */
  cover?: string;
  panels: number;
  published_at: string;
};

export const SERIES_DOC = "~series";

/** "Lost Garden · Épisode 2" → series "Lost Garden", episode 2. */
export function seriesOfTitle(title: string, fallbackEpisode = 1): { series: string; episode: number } {
  const episode = Number(/[ée]pisode\s*(\d+)|episode\s*(\d+)|ep\.?\s*(\d+)/i.exec(title)?.slice(1).find(Boolean) ?? fallbackEpisode);
  const series = title.split(/\s[·:\-]\s/)[0]?.trim() || title;
  return { series, episode: Number.isFinite(episode) ? episode : fallbackEpisode };
}

/** The episode before and after this one in the same series. */
export function neighbours(episodes: SeriesEpisode[], slug: string): { previous?: SeriesEpisode; next?: SeriesEpisode } {
  const current = episodes.find((e) => e.slug === slug);
  if (!current) return {};
  const same = episodes.filter((e) => e.series === current.series).sort((a, b) => a.episode - b.episode);
  const at = same.findIndex((e) => e.slug === slug);
  return { previous: same[at - 1], next: same[at + 1] };
}

export function sortEpisodes(episodes: SeriesEpisode[]): SeriesEpisode[] {
  return [...episodes].sort((a, b) => a.series.localeCompare(b.series) || a.episode - b.episode);
}
