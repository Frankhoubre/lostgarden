import { adaptScript } from "./adaptation";
import { EP1_OPENING_ANALYSIS } from "./sources/ep1-opening.analysis";
import { EP1_OPENING_IMAGES } from "./sources/ep1-opening.images";
import {
  EP1_OPENING_BEATS,
  EP1_OPENING_INTENTS,
  EP1_OPENING_PALETTES,
} from "./sources/ep1-opening.plan";
import type { WebtoonScript } from "./types";

/**
 * Registry of webtoon scripts. Each entry runs the adaptation engine on a
 * source analysis and a plan; the result is the single source of truth the
 * reader, the editor, the JSON export and the API all render.
 */
const builders: Record<string, () => WebtoonScript> = {
  "ep1-opening": () =>
    adaptScript({
      slug: "ep1-opening",
      title: {
        en: "The Awakening of the Lantern Knight",
        fr: "The Awakening of the Lantern Knight",
        ja: "The Awakening of the Lantern Knight",
        ko: "The Awakening of the Lantern Knight",
      },
      subtitle: {
        en: "Episode 1 · opening, 0:00 to 0:30",
        fr: "Épisode 1 · ouverture, 0:00 à 0:30",
        ja: "第1話 · 冒頭 0:00〜0:30",
        ko: "1화 · 오프닝 0:00~0:30",
      },
      series: "Lost Garden",
      episode: 1,
      analysis: EP1_OPENING_ANALYSIS,
      beats: EP1_OPENING_BEATS,
      intents: EP1_OPENING_INTENTS,
      palettes: EP1_OPENING_PALETTES,
      images: EP1_OPENING_IMAGES,
      generated_at: "2026-09-19T00:00:00.000Z",
    }),
};

export const WEBTOON_SLUGS = Object.keys(builders);

export function getWebtoonScript(slug: string): WebtoonScript | null {
  const build = builders[slug];
  return build ? build() : null;
}

export function listWebtoonScripts(): WebtoonScript[] {
  return WEBTOON_SLUGS.map((slug) => builders[slug]());
}
