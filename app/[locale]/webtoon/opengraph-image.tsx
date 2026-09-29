import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { episodeNumber, listEpisodes } from "@/lib/webtoon/episode-seo";
import { webtoonOgImage } from "@/lib/webtoon/og-image";

/** The shared image of the series page: the cover of the latest episode. Episodes have their own. */
export const alt = "Lost Garden · Webtoon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const dict = await getDictionary(locale);
  const episodes = await listEpisodes(locale);
  const latest = [...episodes].sort((a, b) => b.episode - a.episode)[0];
  return webtoonOgImage({
    kicker: "Lost Garden",
    heading: dict.webtoon.headline,
    title: latest ? `${episodeNumber(dict, latest.episode)} · ${latest.title}` : undefined,
    cover: latest?.cover,
    footer: "lostgarden.world",
  });
}
