import "server-only";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import type { Dictionary } from "@/lib/i18n/types";
import { SITE, absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { CREATOR_WIKIDATA } from "@/lib/social";
import { listWebtoonScripts } from "@/lib/webtoon/scripts";
import type { SeriesEpisode } from "@/lib/webtoon/series";
import { fetchSeries } from "@/lib/webtoon/series-server";
import { fill, localizedText } from "@/lib/webtoon/text";
import type { WebtoonPanel } from "@/lib/webtoon/types";

/**
 * How the public webtoon pages present themselves to search engines and
 * social networks: titles, descriptions, schema.org ComicIssue / ComicSeries.
 * The episodes are the ones the series page lists: the published series, then
 * the built-in episodes not published yet.
 */

export type EpisodeSummary = {
  slug: string;
  series: string;
  episode: number;
  /** In the page's language for a built-in episode, as published for a studio one. */
  title: string;
  /** Public path or absolute URL of a light image of the episode. */
  cover?: string;
  panels: number;
  /** ISO date of the last publication. */
  publishedAt?: string;
};

/** The image the reader shows for a panel: its light WebP when it matches the current image. */
function readerImage(panel: WebtoonPanel): string {
  return panel.image.web && panel.image.web.of === panel.image.src ? panel.image.web.src : panel.image.src;
}

/** "Lost Garden · Épisode 2 · Le cimetière" → "Le cimetière": the project title without its series and number. */
function ownTitle(title: string, series: string): string | undefined {
  const parts = title.split(/\s[·:\-]\s/).map((part) => part.trim());
  const rest = parts.filter((part) => part && part !== series && !/^(?:[ée]pisode|ep\.?)\s*\d+$/i.test(part));
  return rest.length ? rest.join(" · ") : undefined;
}

function coverOf(panels: WebtoonPanel[]): string | undefined {
  const panel = panels.find((p) => p.image.src && p.image.status !== "missing" && !p.caption.some((c) => c.style === "title"));
  return panel ? readerImage(panel) : undefined;
}

export async function listEpisodes(locale: Locale, published?: SeriesEpisode[]): Promise<EpisodeSummary[]> {
  const series = published ?? (await fetchSeries());
  const scripts = listWebtoonScripts();
  return [
    ...series.map((e) => {
      const built = scripts.find((s) => s.slug === e.slug);
      return {
        slug: e.slug,
        series: e.series,
        episode: e.episode,
        title: built ? localizedText(built.title, locale) : (ownTitle(e.title, e.series) ?? e.title),
        cover: e.cover ?? (built ? coverOf(built.panels) : undefined),
        panels: e.panels,
        publishedAt: e.published_at,
      };
    }),
    ...scripts
      .filter((s) => !series.some((e) => e.slug === s.slug))
      .map((s) => ({
        slug: s.slug,
        series: s.series,
        episode: s.episode,
        title: localizedText(s.title, locale),
        cover: coverOf(s.panels),
        panels: s.panels.length,
        publishedAt: s.generated_at,
      })),
  ];
}

export async function findEpisode(slug: string, locale: Locale): Promise<EpisodeSummary | null> {
  return (await listEpisodes(locale)).find((e) => e.slug === slug) ?? null;
}

export function episodeNumber(dict: Dictionary, episode: number): string {
  return fill(dict.webtoon.episodeNumber, { n: episode });
}

/** "Lost Garden · Épisode 1 · The Awakening of the Lantern Knight | Webtoon". */
export function episodeTitle(dict: Dictionary, episode: EpisodeSummary): string {
  // A project titled only "Lost Garden · Épisode 2" already says it all.
  if (episode.title.includes(episode.series)) return `${episode.title} | ${dict.webtoon.headline}`;
  return `${episode.series} · ${episodeNumber(dict, episode.episode)} · ${episode.title} | ${dict.webtoon.headline}`;
}

/** The visible intro of the episode page, also its meta description. */
export function episodeIntro(dict: Dictionary, episode: EpisodeSummary, panelCount = episode.panels): string {
  return fill(dict.webtoon.episodeIntro, { n: episode.episode, series: episode.series, title: episode.title, count: panelCount });
}

/** The first line a reader meets: a bubble or a narration box, in the page's language. */
export function firstLine(panels: WebtoonPanel[], locale: Locale): string | undefined {
  for (const panel of panels) {
    const line = panel.dialogue[0]?.text ?? panel.caption.find((c) => c.style !== "title")?.text;
    const text = line ? localizedText(line, locale).replace(/\s+/g, " ").trim() : "";
    if (text) return text;
  }
  return undefined;
}

/** The intro, followed by the first line of the episode when the whole stays a snippet. */
export function episodeDescription(dict: Dictionary, episode: EpisodeSummary, locale: Locale, panels?: WebtoonPanel[]): string {
  const intro = episodeIntro(dict, episode, panels?.length ?? episode.panels);
  const line = panels ? firstLine(panels, locale) : undefined;
  if (!line) return intro;
  // Japanese and Korean full stops need no space after them.
  const withLine = `${intro}${/[。！？]$/.test(intro) ? "" : " "}${fill(dict.webtoon.quote, { text: line })}`;
  return withLine.length <= 220 ? withLine : intro;
}

/**
 * The page's metadata without images, so the segment's `opengraph-image`
 * wins (Next.js only applies it when the page sets no `openGraph.images`),
 * and the Twitter card inherits it.
 */
export function withSegmentImages(metadata: Metadata): Metadata {
  const { openGraph, twitter } = metadata;
  if (openGraph) delete (openGraph as { images?: unknown }).images;
  if (twitter) delete (twitter as { images?: unknown }).images;
  return metadata;
}

export function episodeMetadata({ locale, dict, episode, description }: { locale: Locale; dict: Dictionary; episode: EpisodeSummary; description: string }): Metadata {
  return withSegmentImages(
    buildPageMetadata({
      locale,
      title: episodeTitle(dict, episode),
      description,
      path: localePath(locale, `/webtoon/${episode.slug}`),
      pathSuffix: `/webtoon/${episode.slug}`,
      absoluteTitle: true,
      ogType: "article",
    }),
  );
}

// ---------------------------------------------------------------------------
// schema.org

function imageUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;
  return /^https?:\/\//.test(src) ? src : absoluteUrl(src);
}

function seriesId(series: string): string {
  const key = series.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "series";
  return `${SITE.url}/webtoon#${key}`;
}

const AUTHOR = { "@type": "Person", name: SITE.creator, sameAs: [CREATOR_WIKIDATA] };

function issueNode(locale: Locale, episode: EpisodeSummary) {
  const url = absoluteUrl(localePath(locale, `/webtoon/${episode.slug}`));
  const image = imageUrl(episode.cover);
  return {
    "@type": "ComicIssue",
    "@id": `${url}#issue`,
    name: episode.title,
    issueNumber: episode.episode,
    url,
    ...(image ? { image } : {}),
    ...(episode.publishedAt ? { datePublished: episode.publishedAt } : {}),
  };
}

export function comicIssueJsonLd({ locale, episode, description }: { locale: Locale; episode: EpisodeSummary; description: string }) {
  return {
    "@context": "https://schema.org",
    ...issueNode(locale, episode),
    description,
    inLanguage: locale,
    genre: ["Dark Fantasy", "Webtoon"],
    isAccessibleForFree: true,
    author: AUTHOR,
    publisher: { "@id": `${SITE.url}/#organization` },
    isPartOf: {
      "@type": "ComicSeries",
      "@id": seriesId(episode.series),
      name: episode.series,
      url: absoluteUrl(localePath(locale, "/webtoon")),
    },
    about: { "@id": `${SITE.url}/#series` },
  };
}

/** One ComicSeries per series on the page, each with its issues in order. */
export function comicSeriesJsonLd({ locale, episodes, description }: { locale: Locale; episodes: EpisodeSummary[]; description: string }) {
  const names = [...new Set(episodes.map((e) => e.series))];
  const nodes = names.map((name) => {
    const issues = episodes.filter((e) => e.series === name).sort((a, b) => a.episode - b.episode);
    const image = imageUrl(issues[0]?.cover);
    const dates = issues.map((e) => e.publishedAt).filter((d): d is string => Boolean(d)).sort();
    return {
      "@type": "ComicSeries",
      "@id": seriesId(name),
      name,
      url: absoluteUrl(localePath(locale, "/webtoon")),
      description,
      inLanguage: locale,
      ...(image ? { image } : {}),
      ...(dates[0] ? { startDate: dates[0] } : {}),
      author: AUTHOR,
      publisher: { "@id": `${SITE.url}/#organization` },
      hasPart: issues.map((e) => issueNode(locale, e)),
    };
  });
  return { "@context": "https://schema.org", "@graph": nodes };
}
