export const SOCIAL_LINKS = {
  youtube: "https://www.youtube.com/@lostgardenanime",
  instagram: "https://www.instagram.com/lostgarden.world",
  tiktok: "https://www.tiktok.com/@lostgarden.world",
} as const;

/**
 * Reference database entries for the series. Used in the TVSeries `sameAs`
 * so Google and answer engines resolve the site and those entries to the
 * same work. Add AniList, MyAnimeList and ANN here once their entries exist.
 */
export const DATABASE_LINKS = {
  imdb: "https://www.imdb.com/title/tt43459291/",
  tmdb: "https://www.themoviedb.org/tv/325287",
  wikidata: "https://www.wikidata.org/wiki/Q140266760",
} as const;

/** Wikidata item for the creator, used in the Person markup. */
export const CREATOR_WIKIDATA = "https://www.wikidata.org/wiki/Q139094807";
