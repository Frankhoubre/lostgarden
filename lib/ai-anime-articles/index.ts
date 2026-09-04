import type { AiAnimeArticle } from "@/lib/ai-anime-article";
import type { Locale } from "@/lib/i18n/config";
import { aiAnimeArticleEn } from "./en";
import { aiAnimeArticleFr } from "./fr";
import { aiAnimeArticleJa } from "./ja";
import { aiAnimeArticleKo } from "./ko";

const aiAnimeArticles: Record<Locale, AiAnimeArticle> = {
  en: aiAnimeArticleEn,
  fr: aiAnimeArticleFr,
  ja: aiAnimeArticleJa,
  ko: aiAnimeArticleKo,
};

export function getAiAnimeArticle(locale: Locale): AiAnimeArticle {
  return aiAnimeArticles[locale];
}
