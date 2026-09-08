import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import type { Transcript } from "@/lib/transcript";
import { transcriptEn } from "./en";
import { transcriptFr } from "./fr";
import { transcriptJa } from "./ja";
import { transcriptKo } from "./ko";

const transcripts: Record<Locale, Transcript> = {
  en: transcriptEn,
  fr: transcriptFr,
  ja: transcriptJa,
  ko: transcriptKo,
};

export function getTranscript(locale: Locale): Transcript {
  return transcripts[locale];
}

/**
 * The transcript page is published only when every language has cues, so
 * hreflang never points at a missing translation and the sitemap never
 * lists a 404.
 */
export const TRANSCRIPT_PUBLISHED = locales.every((locale) => transcripts[locale].length > 0);
