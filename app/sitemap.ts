import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { absoluteUrl, getSitemapEntries, localeHreflangAlternates } from "@/lib/seo";
import { listEpisodes } from "@/lib/webtoon/episode-seo";

// The published webtoon episodes change with the studio: re-read them hourly.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Every readable episode (the published series, then the built-in ones), with its last publication.
  const episodes = await listEpisodes(defaultLocale).catch(() => []);
  const latest = episodes
    .map((e) => e.publishedAt)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);
  const seriesPaths = new Set(locales.map((locale) => absoluteUrl(localePath(locale, "/webtoon"))));

  const pages: MetadataRoute.Sitemap = getSitemapEntries().map((entry) => ({
    url: entry.url,
    // The series page changes when an episode is published.
    lastModified: seriesPaths.has(entry.url) && latest ? new Date(latest) : entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    alternates: entry.alternates,
  }));

  const episodePages: MetadataRoute.Sitemap = episodes.flatMap((episode) => {
    const suffix = `/webtoon/${episode.slug}` as const;
    const cover = episode.cover ? (/^https?:\/\//.test(episode.cover) ? episode.cover : absoluteUrl(episode.cover)) : undefined;
    return locales.map((locale) => ({
      url: absoluteUrl(localePath(locale, suffix)),
      lastModified: episode.publishedAt ? new Date(episode.publishedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: { languages: localeHreflangAlternates(suffix) },
      // Next.js writes image URLs as they are: the `&` of a Storage URL must be escaped for the XML.
      ...(cover ? { images: [cover.replace(/&/g, "&amp;")] } : {}),
    }));
  });

  return [...pages, ...episodePages];
}
