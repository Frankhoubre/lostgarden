import { GUIDES } from "@/lib/article-media";
import type { Dictionary } from "@/lib/i18n/types";
import type { IndexablePathSuffix } from "@/lib/seo";

export type ArticleEntry = {
  path: IndexablePathSuffix;
  /** Dictionary key under `meta` holding the title and description. */
  meta: keyof Dictionary["meta"];
  published: string;
};

/** Editorial pages listed on the blog index and in the feed, newest intent first. */
export const ARTICLES: readonly ArticleEntry[] = [
  { path: "/making-of-episode-1", meta: "makingOfEpisodeOne", published: GUIDES["/making-of-episode-1"].published },
  { path: "/best-ai-anime", meta: "bestAiAnime", published: "2026-09-04" },
  { path: "/how-to-make-ai-anime", meta: "howToMakeAiAnime", published: GUIDES["/how-to-make-ai-anime"].published },
  { path: "/ai-anime-generator", meta: "aiAnimeGenerator", published: GUIDES["/ai-anime-generator"].published },
  { path: "/can-one-person-make-an-anime", meta: "canOnePersonMakeAnAnime", published: GUIDES["/can-one-person-make-an-anime"].published },
  { path: "/ai-manga", meta: "aiManga", published: GUIDES["/ai-manga"].published },
  { path: "/ai-anime-voice-and-sound", meta: "aiAnimeVoiceAndSound", published: GUIDES["/ai-anime-voice-and-sound"].published },
  { path: "/how-to-tell-if-anime-is-ai", meta: "howToTellIfAnimeIsAi", published: GUIDES["/how-to-tell-if-anime-is-ai"].published },
  { path: "/lost-garden-story-and-characters", meta: "lostGardenStoryAndCharacters", published: GUIDES["/lost-garden-story-and-characters"].published },
  { path: "/history-of-ai-anime", meta: "historyOfAiAnime", published: GUIDES["/history-of-ai-anime"].published },
  { path: "/why-ai-anime-looks-bad", meta: "whyAiAnimeLooksBad", published: GUIDES["/why-ai-anime-looks-bad"].published },
  { path: "/anime-style-prompts", meta: "animeStylePrompts", published: GUIDES["/anime-style-prompts"].published },
  { path: "/ai-anime-script", meta: "aiAnimeScript", published: GUIDES["/ai-anime-script"].published },
  { path: "/ai-anime-storyboard", meta: "aiAnimeStoryboard", published: GUIDES["/ai-anime-storyboard"].published },
  { path: "/ai-anime-backgrounds", meta: "aiAnimeBackgrounds", published: GUIDES["/ai-anime-backgrounds"].published },
  { path: "/editing-ai-anime", meta: "editingAiAnime", published: GUIDES["/editing-ai-anime"].published },
  { path: "/ai-anime-copyright", meta: "aiAnimeCopyright", published: GUIDES["/ai-anime-copyright"].published },
  { path: "/ai-film-festivals-animation", meta: "aiFilmFestivalsAnimation", published: GUIDES["/ai-film-festivals-animation"].published },
  { path: "/ai-character-consistency", meta: "aiCharacterConsistency", published: GUIDES["/ai-character-consistency"].published },
  { path: "/is-ai-anime-real-anime", meta: "isAiAnimeRealAnime", published: GUIDES["/is-ai-anime-real-anime"].published },
  { path: "/ai-anime-vs-traditional-animation", meta: "aiAnimeVsTraditional", published: GUIDES["/ai-anime-vs-traditional-animation"].published },
  { path: "/process", meta: "process", published: "2026-09-04" },
  { path: "/vision", meta: "vision", published: "2026-09-04" },
];

/** The four entries shown on the home page. */
export const HOME_ARTICLES: readonly IndexablePathSuffix[] = [
  "/making-of-episode-1",
  "/lost-garden-story-and-characters",
  "/how-to-make-ai-anime",
  "/best-ai-anime",
];
