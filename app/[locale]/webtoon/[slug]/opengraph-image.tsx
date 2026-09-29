import { defaultLocale, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { episodeNumber, findEpisode } from "@/lib/webtoon/episode-seo";
import { webtoonOgImage } from "@/lib/webtoon/og-image";

/** The shared image of an episode: its cover, the series, "Épisode N" and the title. */
export const alt = "Lost Garden · Webtoon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: localeParam, slug } = await params;
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;
  const dict = await getDictionary(locale);
  const episode = await findEpisode(slug, locale);
  return webtoonOgImage({
    kicker: episode?.series ?? "Lost Garden",
    heading: episode ? episodeNumber(dict, episode.episode) : dict.webtoon.headline,
    title: episode?.title,
    cover: episode?.cover,
    footer: `${dict.webtoon.headline} · lostgarden.world`,
  });
}
