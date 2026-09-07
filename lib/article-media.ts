import type { GuideSlug } from "@/lib/guide-article";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import type { IndexablePathSuffix } from "@/lib/seo";

/**
 * Stills from the episode and the press kit, all 16:9, used as the hero
 * image of an article, its Open Graph card and its entry in the sitemap.
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

/** Size of the generated Open Graph card served by `app/og/route.tsx`. */
export const OG_CARD_SIZE = { width: 1200, height: 630 } as const;

/** Dictionary keys that exist under both `meta` and `guides`: one per guide page. */
export type GuideDictKey = Extract<keyof Dictionary["guides"], keyof Dictionary["meta"]>;

/** Per-guide routing data: dictionary key and publication date, one entry per slug. */
export const GUIDES: Record<GuideSlug, { key: GuideDictKey; published: string }> = {
  "/how-to-make-ai-anime": { key: "howToMakeAiAnime", published: "2026-09-04" },
  "/ai-character-consistency": { key: "aiCharacterConsistency", published: "2026-09-04" },
  "/is-ai-anime-real-anime": { key: "isAiAnimeRealAnime", published: "2026-09-04" },
  "/ai-anime-vs-traditional-animation": { key: "aiAnimeVsTraditional", published: "2026-09-04" },
  "/ai-manga": { key: "aiManga", published: "2026-09-05" },
  "/ai-anime-generator": { key: "aiAnimeGenerator", published: "2026-09-05" },
  "/ai-anime-voice-and-sound": { key: "aiAnimeVoiceAndSound", published: "2026-09-05" },
  "/how-to-tell-if-anime-is-ai": { key: "howToTellIfAnimeIsAi", published: "2026-09-05" },
  "/making-of-episode-1": { key: "makingOfEpisodeOne", published: "2026-09-05" },
  "/can-one-person-make-an-anime": { key: "canOnePersonMakeAnAnime", published: "2026-09-05" },
  "/ai-anime-storyboard": { key: "aiAnimeStoryboard", published: "2026-09-05" },
  "/ai-anime-backgrounds": { key: "aiAnimeBackgrounds", published: "2026-09-05" },
  "/ai-anime-script": { key: "aiAnimeScript", published: "2026-09-05" },
  "/ai-anime-copyright": { key: "aiAnimeCopyright", published: "2026-09-05" },
  "/history-of-ai-anime": { key: "historyOfAiAnime", published: "2026-09-05" },
  "/anime-style-prompts": { key: "animeStylePrompts", published: "2026-09-05" },
  "/editing-ai-anime": { key: "editingAiAnime", published: "2026-09-05" },
  "/why-ai-anime-looks-bad": { key: "whyAiAnimeLooksBad", published: "2026-09-05" },
  "/ai-film-festivals-animation": { key: "aiFilmFestivalsAnimation", published: "2026-09-05" },
  "/lost-garden-story-and-characters": { key: "lostGardenStoryAndCharacters", published: "2026-09-05" },
};

export function isGuideSlug(value: string): value is GuideSlug {
  return Object.prototype.hasOwnProperty.call(GUIDES, value);
}

type ArticleMedia = {
  image: ArticleImageKey;
  /** Headline printed on the Open Graph card, in the page's language. */
  headline: (dict: Dictionary) => string;
  /** Embed the Episode One player after the article body. */
  episode?: boolean;
};

const guideHeadline = (key: GuideDictKey) => (dict: Dictionary) => dict.guides[key].headline;

export const ARTICLE_MEDIA: Partial<Record<IndexablePathSuffix, ArticleMedia>> = {
  "/process": { image: "sleepingMachines", headline: (d) => d.process.headline },
  "/vision": { image: "blueForest", headline: (d) => d.vision.headline },
  "/episode-1": { image: "heroBanner", headline: (d) => d.episodeOnePublic.headline },
  "/blog": { image: "rose", headline: (d) => d.blog.headline },
  "/best-ai-anime": { image: "rose", headline: (d) => d.bestAiAnime.headline },
  "/how-to-make-ai-anime": { image: "undergroundCavern", headline: guideHeadline("howToMakeAiAnime") },
  "/ai-character-consistency": { image: "sol", headline: guideHeadline("aiCharacterConsistency") },
  "/is-ai-anime-real-anime": { image: "tavernKnights", headline: guideHeadline("isAiAnimeRealAnime") },
  "/ai-anime-vs-traditional-animation": { image: "forestReference", headline: guideHeadline("aiAnimeVsTraditional") },
  "/ai-manga": { image: "serrure", headline: guideHeadline("aiManga") },
  "/ai-anime-generator": { image: "blueForest", headline: guideHeadline("aiAnimeGenerator") },
  "/ai-anime-voice-and-sound": { image: "sleepingMachines", headline: guideHeadline("aiAnimeVoiceAndSound"), episode: true },
  "/how-to-tell-if-anime-is-ai": { image: "pelerins", headline: guideHeadline("howToTellIfAnimeIsAi") },
  "/making-of-episode-1": { image: "heroBanner", headline: guideHeadline("makingOfEpisodeOne"), episode: true },
  "/can-one-person-make-an-anime": { image: "heroCavern", headline: guideHeadline("canOnePersonMakeAnAnime"), episode: true },
  "/ai-anime-storyboard": { image: "tavernKnights", headline: guideHeadline("aiAnimeStoryboard") },
  "/ai-anime-backgrounds": { image: "undergroundCavern", headline: guideHeadline("aiAnimeBackgrounds") },
  "/ai-anime-script": { image: "roseCapsule", headline: guideHeadline("aiAnimeScript") },
  "/ai-anime-copyright": { image: "serrure", headline: guideHeadline("aiAnimeCopyright") },
  "/history-of-ai-anime": { image: "heroBanner", headline: guideHeadline("historyOfAiAnime") },
  "/anime-style-prompts": { image: "forestReference", headline: guideHeadline("animeStylePrompts") },
  "/editing-ai-anime": { image: "pelerins", headline: guideHeadline("editingAiAnime"), episode: true },
  "/why-ai-anime-looks-bad": { image: "sleepingMachines", headline: guideHeadline("whyAiAnimeLooksBad") },
  "/ai-film-festivals-animation": { image: "tavernKnights", headline: guideHeadline("aiFilmFestivalsAnimation") },
  "/lost-garden-story-and-characters": { image: "rose", headline: guideHeadline("lostGardenStoryAndCharacters"), episode: true },
};

export function getArticleMedia(slug: IndexablePathSuffix) {
  const media = ARTICLE_MEDIA[slug];
  if (!media) return null;
  return { ...media, imageData: ARTICLE_IMAGES[media.image] };
}

/** Path of the generated Open Graph card for an article, in one language. */
export function ogCardPath(locale: Locale, slug: IndexablePathSuffix): string {
  return `/og?locale=${locale}&path=${encodeURIComponent(slug)}`;
}

/** Open Graph image fields for `buildPageMetadata`, empty when the page has no media. */
export function articleOgMetadata(locale: Locale, slug: IndexablePathSuffix, dict: Dictionary) {
  const media = getArticleMedia(slug);
  if (!media) return {};
  return {
    ogImage: ogCardPath(locale, slug),
    ogImageWidth: OG_CARD_SIZE.width,
    ogImageHeight: OG_CARD_SIZE.height,
    ogImageAlt: dict.media.alt[media.imageData.altKey],
  };
}
