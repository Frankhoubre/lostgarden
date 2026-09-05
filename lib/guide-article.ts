import type { ArticleLink } from "@/lib/ai-anime-article";
import type { VisionArticle } from "@/lib/vision-article";

/**
 * Long-form guide page: same body as the vision/process articles, plus a FAQ
 * and a related-links block. One entry per guide slug, per locale.
 */
export type Guide = {
  article: VisionArticle;
  faq: readonly { question: string; answer: string }[];
  related: readonly ArticleLink[];
};

export type GuideSlug =
  | "/how-to-make-ai-anime"
  | "/ai-character-consistency"
  | "/is-ai-anime-real-anime"
  | "/ai-anime-vs-traditional-animation"
  | "/ai-manga"
  | "/ai-anime-generator"
  | "/ai-anime-voice-and-sound"
  | "/how-to-tell-if-anime-is-ai"
  | "/making-of-episode-1"
  | "/can-one-person-make-an-anime";
