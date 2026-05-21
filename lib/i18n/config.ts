export const locales = ["en", "fr", "ja", "ko"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "lostgarden-locale";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ja: "日本語",
  ko: "한국어",
};

export const openGraphLocales: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
  ja: "ja_JP",
  ko: "ko_KR",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export async function getLocaleFromHeaders(): Promise<Locale> {
  const { headers } = await import("next/headers");
  const headerLocale = (await headers()).get("x-locale");
  if (headerLocale && isLocale(headerLocale)) {
    return headerLocale;
  }
  return defaultLocale;
}
