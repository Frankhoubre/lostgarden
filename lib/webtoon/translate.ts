import type { Locale } from "@/lib/i18n/config";
import type { LocalizedText, WebtoonPanel } from "./types";

/**
 * TRANSLATION OF THE LETTERING: every text of a panel (bubbles, captions,
 * sound effects) in the four languages of the site. Written in whichever
 * language the author typed; the studio asks the model for the others,
 * with the scene and the speaker as context so the result reads like
 * spoken language, not like a dictionary.
 */

export const LETTERING_LOCALES: Locale[] = ["fr", "en", "ja", "ko"];

export type LetteringItem = {
  /** `dialogue.0`, `caption.1`, `sfx.0` */
  key: string;
  kind: "dialogue" | "caption" | "sfx";
  speaker?: string;
  style?: string;
  text: LocalizedText;
};

export function letteringOf(panel: WebtoonPanel): LetteringItem[] {
  return [
    ...panel.dialogue.map((line, i) => ({ key: `dialogue.${i}`, kind: "dialogue" as const, speaker: line.speaker, style: line.style, text: line.text })),
    ...panel.caption.map((box, i) => ({ key: `caption.${i}`, kind: "caption" as const, style: box.style, text: box.text })),
    ...panel.sfx.map((effect, i) => ({ key: `sfx.${i}`, kind: "sfx" as const, style: effect.style, text: effect.text })),
  ];
}

/** The language the author wrote in: the first locale with text, French first. */
export function sourceLocale(text: LocalizedText): Locale | null {
  for (const locale of LETTERING_LOCALES) {
    if (text[locale]?.trim()) return locale;
  }
  return null;
}

/** Locales still empty for a text. */
export function missingLocales(text: LocalizedText): Locale[] {
  return LETTERING_LOCALES.filter((locale) => !text[locale]?.trim());
}

/** Items that have a source text and at least one empty locale (or every locale when `all`). */
export function itemsToTranslate(panel: WebtoonPanel, all = false): LetteringItem[] {
  return letteringOf(panel).filter((item) => sourceLocale(item.text) && (all || missingLocales(item.text).length));
}

/** Write translated texts back into the panel's bubbles, captions and sounds. */
export function applyTranslations(
  panel: WebtoonPanel,
  translations: Record<string, Partial<Record<Locale, string>>>,
  overwrite: boolean,
): WebtoonPanel {
  const merge = (key: string, text: LocalizedText): LocalizedText => {
    const incoming = translations[key];
    if (!incoming) return text;
    const next: LocalizedText = { ...text };
    for (const locale of LETTERING_LOCALES) {
      const value = incoming[locale]?.trim();
      if (!value) continue;
      if (overwrite || !next[locale]?.trim()) next[locale] = value;
    }
    if (!next.en?.trim()) next.en = incoming.en?.trim() || text.en;
    return next;
  };
  return {
    ...panel,
    dialogue: panel.dialogue.map((line, i) => ({ ...line, text: merge(`dialogue.${i}`, line.text) })),
    caption: panel.caption.map((box, i) => ({ ...box, text: merge(`caption.${i}`, box.text) })),
    sfx: panel.sfx.map((effect, i) => ({ ...effect, text: merge(`sfx.${i}`, effect.text) })),
  };
}
