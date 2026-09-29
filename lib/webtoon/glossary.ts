import type { Locale } from "@/lib/i18n/config";
import { seriesOfTitle } from "./series";
import type { WebtoonPanel } from "./types";

/**
 * THE GLOSSARY OF A SERIES AND THE VOICES OF ITS CHARACTERS. Names, places
 * and key words are fixed once per language (Lanterne, la Voûte, le
 * médaillon), and each speaking character has a voice in a line (Serrure
 * calm and worried, his jokes a shield; Rose small and simple). Every
 * translation follows them, and the lettering can be checked against them.
 * One per series, shared by its episodes: `webtoon_library/~glossary-<series>`.
 */

export type GlossaryTerm = { fr: string; en?: string; ja?: string; ko?: string; note?: string };
export type CharacterVoice = { id: string; name: string; voice: string };
export type Glossary = { terms: GlossaryTerm[]; voices: CharacterVoice[]; updated_at?: string };

export const EMPTY_GLOSSARY: Glossary = { terms: [], voices: [] };

/** The document of a series' glossary, from a script's series or a project's title ("Lost Garden · Épisode 2"). */
export function glossaryDocId(series: string): string {
  const name = seriesOfTitle(series).series || series || "series";
  const key = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `~glossary-${key || "series"}`;
}

/** The glossary and voices as lines of a prompt; empty when there is nothing. */
export function glossaryBrief(glossary: Glossary | null | undefined, locales: Locale[]): string {
  if (!glossary) return "";
  const terms = glossary.terms.filter((t) => t.fr.trim());
  const voices = glossary.voices.filter((v) => v.voice.trim());
  const out: string[] = [];
  if (terms.length) {
    out.push("GLOSSARY of the series, mandatory: always render these terms exactly like this in each language, never another word or spelling.");
    for (const t of terms) out.push(`- ${locales.map((l) => `${l}: ${t[l] || (l === "fr" ? t.fr : "(keep the French)")}`).join(" | ")}${t.note ? ` (${t.note})` : ""}`);
  }
  if (voices.length) {
    out.push("VOICES of the characters, keep them in every language:");
    for (const v of voices) out.push(`- ${v.name} (${v.id}): ${v.voice}`);
  }
  return out.join("\n");
}

export type GlossaryMiss = { panel_id: string; order: number; locale: Locale; term: string; expected: string; text: string };

const LOCALES: Locale[] = ["en", "ja", "ko"];
const has = (text: string, word: string) => text.toLocaleLowerCase().includes(word.toLocaleLowerCase());

/**
 * Lines whose French names a glossary term while another language does not
 * use the term's rendering there: the places where a translation drifted.
 */
export function glossaryMisses(panels: readonly WebtoonPanel[], glossary: Glossary): GlossaryMiss[] {
  const misses: GlossaryMiss[] = [];
  const terms = glossary.terms.filter((t) => t.fr.trim());
  if (!terms.length) return misses;
  for (const panel of panels) {
    const texts = [...panel.dialogue.map((d) => d.text), ...panel.caption.map((c) => c.text)];
    for (const text of texts) {
      const fr = text.fr ?? "";
      if (!fr) continue;
      for (const term of terms) {
        if (!has(fr, term.fr)) continue;
        for (const locale of LOCALES) {
          const expected = term[locale]?.trim();
          const line = text[locale];
          if (!expected || !line) continue;
          if (!has(line, expected)) misses.push({ panel_id: panel.panel_id, order: panel.order, locale, term: term.fr, expected, text: line });
        }
      }
    }
  }
  return misses;
}
