import type { Guide, GuideSlug } from "@/lib/guide-article";
import type { Locale } from "@/lib/i18n/config";
import { guidesEn } from "./en";
import { guidesFr } from "./fr";
import { guidesJa } from "./ja";
import { guidesKo } from "./ko";

const guides: Record<Locale, Record<GuideSlug, Guide>> = {
  en: guidesEn,
  fr: guidesFr,
  ja: guidesJa,
  ko: guidesKo,
};

export function getGuide(locale: Locale, slug: GuideSlug): Guide {
  return guides[locale][slug];
}
