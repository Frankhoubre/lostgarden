import type { Locale } from "@/lib/i18n/config";
import type { LocalizedText } from "./types";

/** Pick a locale's text, falling back to the English original. */
export function localizedText(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}

/** Simple `{name}` interpolation for dictionary strings. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}

/** Seconds → m:ss.s for source time ranges. */
export function formatSeconds(value: number | null): string {
  if (value === null) return "·";
  const minutes = Math.floor(value / 60);
  const seconds = value - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}
