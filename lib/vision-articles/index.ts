import type { Locale } from "@/lib/i18n/config";
import type { VisionArticle } from "@/lib/vision-article";
import { visionArticleEn } from "./en";
import { visionArticleFr } from "./fr";
import { visionArticleJa } from "./ja";
import { visionArticleKo } from "./ko";

const visionArticles: Record<Locale, VisionArticle> = {
  en: visionArticleEn,
  fr: visionArticleFr,
  ja: visionArticleJa,
  ko: visionArticleKo,
};

export function getVisionArticle(locale: Locale): VisionArticle {
  return visionArticles[locale];
}
