import "server-only";
import type { ImageResponse } from "next/og";
import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/types";
import { webtoonOgImage } from "@/lib/webtoon/og-image";

/**
 * One share image per editorial page (1200 x 630): its own headline over a still
 * from the series, instead of the same site-wide image on every link preview.
 */
const SHARE_PAGES = {
  "/vision": { cover: "/images/underground-cavern.png", headline: (d: Dictionary) => d.vision.headline },
  "/process": { cover: "/images/pelerins.png", headline: (d: Dictionary) => d.process.headline },
  "/blog": { cover: "/images/hero-cavern.jpg", headline: (d: Dictionary) => d.meta.blog.title.split(" | ")[0] },
  "/best-ai-anime": { cover: "/images/blue-forest.png", headline: (d: Dictionary) => d.bestAiAnime.headline },
  "/how-to-make-ai-anime": { cover: "/images/forest-reference.png", headline: (d: Dictionary) => d.guides.howToMakeAiAnime.headline },
  "/ai-character-consistency": { cover: "/images/sol.png", headline: (d: Dictionary) => d.guides.aiCharacterConsistency.headline },
  "/is-ai-anime-real-anime": { cover: "/images/rose.png", headline: (d: Dictionary) => d.guides.isAiAnimeRealAnime.headline },
  "/ai-anime-vs-traditional-animation": { cover: "/images/sleeping-machines.png", headline: (d: Dictionary) => d.guides.aiAnimeVsTraditional.headline },
} as const;

export type SharePage = keyof typeof SHARE_PAGES;

export async function articleShareImage(params: Promise<{ locale: string }>, page: SharePage): Promise<ImageResponse> {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const dict = await getDictionary(locale);
  const { cover, headline } = SHARE_PAGES[page];
  const heading = headline(dict);
  // CJK headlines are denser: fewer, wider glyphs per line.
  const long = heading.length > (locale === "ja" || locale === "ko" ? 14 : 34);
  return webtoonOgImage({ kicker: "Lost Garden", heading, cover, footer: "lostgarden.world", headingSize: long ? 60 : 72 });
}
