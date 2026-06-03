import type { Locale } from "@/lib/i18n/config";
import type { VisionArticle } from "@/lib/vision-article";
import { processArticleEn, processFaqEn } from "./en";
import { processArticleFr, processFaqFr } from "./fr";
import { processArticleJa, processFaqJa } from "./ja";
import { processArticleKo, processFaqKo } from "./ko";

const processArticles: Record<Locale, VisionArticle> = {
  en: processArticleEn,
  fr: processArticleFr,
  ja: processArticleJa,
  ko: processArticleKo,
};

const processFaqs: Record<
  Locale,
  ReadonlyArray<{ question: string; answer: string }>
> = {
  en: processFaqEn,
  fr: processFaqFr,
  ja: processFaqJa,
  ko: processFaqKo,
};

export function getProcessArticle(locale: Locale): VisionArticle {
  return processArticles[locale];
}

export function getProcessFaq(
  locale: Locale,
): ReadonlyArray<{ question: string; answer: string }> {
  return processFaqs[locale];
}
