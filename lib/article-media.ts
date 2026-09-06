import type { IndexablePathSuffix } from "@/lib/seo";

/**
 * Stills from the episode and the press kit, all 16:9, used as the hero
 * image of an article, its Open Graph image and its entry in the sitemap.
 * Alt text lives in the dictionary under `media.alt`, keyed by `altKey`.
 */
export const ARTICLE_IMAGES = {
  sol: { src: "/images/sol.png", width: 1024, height: 576, altKey: "sol" },
  rose: { src: "/images/rose.png", width: 1024, height: 576, altKey: "rose" },
  serrure: { src: "/images/serrure.png", width: 1024, height: 576, altKey: "serrure" },
  blueForest: { src: "/images/blue-forest.png", width: 1024, height: 576, altKey: "blueForest" },
  forestReference: { src: "/images/forest-reference.png", width: 1024, height: 576, altKey: "forestReference" },
  heroBanner: { src: "/images/hero-banner.png", width: 1024, height: 576, altKey: "heroBanner" },
  heroCavern: { src: "/images/hero-cavern.jpg", width: 1024, height: 576, altKey: "heroCavern" },
  pelerins: { src: "/images/pelerins.png", width: 1024, height: 576, altKey: "pelerins" },
  sleepingMachines: { src: "/images/sleeping-machines.png", width: 1024, height: 576, altKey: "sleepingMachines" },
  undergroundCavern: { src: "/images/underground-cavern.png", width: 1024, height: 576, altKey: "undergroundCavern" },
  tavernKnights: { src: "/press/tavern-knights.png", width: 1024, height: 576, altKey: "tavernKnights" },
  roseCapsule: { src: "/press/rose-capsule.png", width: 1024, height: 576, altKey: "roseCapsule" },
} as const;

export type ArticleImageKey = keyof typeof ARTICLE_IMAGES;
export type ArticleImage = (typeof ARTICLE_IMAGES)[ArticleImageKey];

type ArticleMedia = {
  image: ArticleImageKey;
  /** Dictionary key under `guides` (or `bestAiAnime`) holding the headline used on the OG card. */
  headlineKey: string;
  /** Embed the Episode One player after the article body. */
  episode?: boolean;
};

export const ARTICLE_MEDIA: Partial<Record<IndexablePathSuffix, ArticleMedia>> = {
  "/best-ai-anime": { image: "rose", headlineKey: "bestAiAnime" },
  "/how-to-make-ai-anime": { image: "undergroundCavern", headlineKey: "howToMakeAiAnime" },
  "/ai-character-consistency": { image: "sol", headlineKey: "aiCharacterConsistency" },
  "/is-ai-anime-real-anime": { image: "tavernKnights", headlineKey: "isAiAnimeRealAnime" },
  "/ai-anime-vs-traditional-animation": { image: "forestReference", headlineKey: "aiAnimeVsTraditional" },
  "/ai-manga": { image: "serrure", headlineKey: "aiManga" },
  "/ai-anime-generator": { image: "blueForest", headlineKey: "aiAnimeGenerator" },
  "/ai-anime-voice-and-sound": { image: "sleepingMachines", headlineKey: "aiAnimeVoiceAndSound", episode: true },
  "/how-to-tell-if-anime-is-ai": { image: "pelerins", headlineKey: "howToTellIfAnimeIsAi" },
  "/making-of-episode-1": { image: "heroBanner", headlineKey: "makingOfEpisodeOne", episode: true },
  "/can-one-person-make-an-anime": { image: "heroCavern", headlineKey: "canOnePersonMakeAnAnime", episode: true },
  "/ai-anime-storyboard": { image: "tavernKnights", headlineKey: "aiAnimeStoryboard" },
  "/ai-anime-backgrounds": { image: "undergroundCavern", headlineKey: "aiAnimeBackgrounds" },
  "/ai-anime-script": { image: "roseCapsule", headlineKey: "aiAnimeScript" },
  "/ai-anime-copyright": { image: "serrure", headlineKey: "aiAnimeCopyright" },
  "/history-of-ai-anime": { image: "heroBanner", headlineKey: "historyOfAiAnime" },
  "/anime-style-prompts": { image: "forestReference", headlineKey: "animeStylePrompts" },
  "/editing-ai-anime": { image: "pelerins", headlineKey: "editingAiAnime", episode: true },
  "/why-ai-anime-looks-bad": { image: "sleepingMachines", headlineKey: "whyAiAnimeLooksBad" },
  "/ai-film-festivals-animation": { image: "tavernKnights", headlineKey: "aiFilmFestivalsAnimation" },
  "/lost-garden-story-and-characters": { image: "rose", headlineKey: "lostGardenStoryAndCharacters", episode: true },
};

export function getArticleMedia(slug: IndexablePathSuffix) {
  const media = ARTICLE_MEDIA[slug];
  if (!media) return null;
  return { ...media, imageData: ARTICLE_IMAGES[media.image] };
}

/** Locale-independent path of the generated Open Graph card for an article. */
export function ogCardPath(locale: string, slug: IndexablePathSuffix): string {
  return `/og?locale=${locale}&path=${encodeURIComponent(slug)}`;
}

/**
 * Official uploads only, verified through YouTube's oEmbed endpoint against
 * the uploading channel. Entries without an official embeddable video get a
 * link instead of a player.
 */
export const RANKING_VIDEOS: Record<string, { youtubeId: string; channel: string }> = {
  "Lost Garden": { youtubeId: "eZ_JlaLDJ-8", channel: "LostGarden Anime" },
  "Twins Hinahima": { youtubeId: "CjUa9RladYQ", channel: "ツインズひなひま" },
  "The Dog & the Boy": { youtubeId: "J9DpusAZV_0", channel: "Netflix Japan" },
  "Anime Rock, Paper, Scissors": { youtubeId: "GVT3WUa-48Y", channel: "Corridor Digital" },
};
