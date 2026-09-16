import type { Dictionary } from "@/lib/i18n/types";

export type EpisodeNumber = 1 | 2;

export type Episode = {
  readonly number: EpisodeNumber;
  /** Locale-neutral path segment for the public episode page. */
  readonly pathSuffix: "/episode-1" | "/episode-2";
  readonly youtubeId: string;
  readonly watchUrl: string;
  readonly embedUrl: string;
  /** Actual YouTube upload date, matching IMDb, TMDB and Wikidata. */
  readonly publishedAt: string;
  /** Runtime rounded to the minute, as listed on IMDb and in the press kit. */
  readonly durationMinutes: number;
};

export const EPISODE_ONE: Episode = {
  number: 1,
  pathSuffix: "/episode-1",
  youtubeId: "eZ_JlaLDJ-8",
  watchUrl: "https://youtu.be/eZ_JlaLDJ-8",
  embedUrl: "https://www.youtube.com/embed/eZ_JlaLDJ-8",
  publishedAt: "2026-05-29",
  durationMinutes: 17,
};

export const EPISODE_TWO: Episode = {
  number: 2,
  pathSuffix: "/episode-2",
  youtubeId: "z-YRrutXaFE",
  watchUrl: "https://youtu.be/z-YRrutXaFE",
  embedUrl: "https://www.youtube.com/embed/z-YRrutXaFE",
  publishedAt: "2026-09-15",
  durationMinutes: 21,
};

/** Oldest first. Add new episodes at the end. */
export const EPISODES: readonly Episode[] = [EPISODE_ONE, EPISODE_TWO];

/** Newest first, for surfaces that lead with the latest release. */
export const EPISODES_NEWEST_FIRST: readonly Episode[] = [...EPISODES].reverse();

export const LATEST_EPISODE: Episode = EPISODES[EPISODES.length - 1];

/** Written and produced, not released yet. Bump when it goes live. */
export const UPCOMING_EPISODE_NUMBER = 3;

/** First publication of the series, used for TVSeries structured data. */
export const SERIES_PUBLISHED_AT = EPISODE_ONE.publishedAt;

/** Per-episode copy from the dictionary, keyed by episode number. */
export function episodeCopy(dict: Dictionary, episode: Episode) {
  return episode.number === 1 ? dict.episode.one : dict.episode.two;
}

/** Copy for the public episode page, keyed by episode number. */
export function episodePageCopy(dict: Dictionary, episode: Episode) {
  return episode.number === 1
    ? dict.episodeOnePublic
    : dict.episodeTwoPublic;
}

/** Page title and description for the public episode page. */
export function episodeMetaCopy(dict: Dictionary, episode: Episode) {
  return episode.number === 1
    ? dict.meta.episodeOnePublic
    : dict.meta.episodeTwoPublic;
}

/** The episode a given episode page links to next, for cross navigation. */
export function otherEpisode(episode: Episode): Episode {
  return episode.number === 1 ? EPISODE_TWO : EPISODE_ONE;
}
