import type { Metadata } from "next";
import {
  EPISODES,
  LATEST_EPISODE,
  episodeThumbnailUrl,
  SERIES_PUBLISHED_AT,
  type Episode,
} from "@/lib/episode";
import { defaultLocale, locales, openGraphLocales, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { LEGAL_PUBLISHER } from "@/lib/legal";
import { CREATOR_WIKIDATA, DATABASE_LINKS, SOCIAL_LINKS } from "@/lib/social";
import type { Dictionary } from "@/lib/i18n/types";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lostgarden.world";

export const SITE = {
  name: "Lost Garden",
  url: SITE_URL,
  ogImage: "/images/og-image.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  email: LEGAL_PUBLISHER.email,
  creator: LEGAL_PUBLISHER.name,
} as const;

/** Locale-neutral path segment, e.g. `/process` or `/`. */
export const INDEXABLE_PATH_SUFFIXES = [
  "/",
  "/vision",
  "/process",
  "/best-ai-anime",
  "/blog",
  "/how-to-make-ai-anime",
  "/ai-character-consistency",
  "/is-ai-anime-real-anime",
  "/ai-anime-vs-traditional-animation",
  "/press",
  "/stickers",
  "/game",
  "/webtoon",
  "/episode-1",
  "/episode-2",
  "/legal-notice",
  "/privacy-policy",
] as const;

export type IndexablePathSuffix = (typeof INDEXABLE_PATH_SUFFIXES)[number];

type SitemapFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

const SITEMAP_HINTS: Record<
  IndexablePathSuffix,
  { changeFrequency: SitemapFrequency; priority: number }
> = {
  "/": { changeFrequency: "weekly", priority: 1 },
  "/episode-2": { changeFrequency: "weekly", priority: 0.9 },
  "/episode-1": { changeFrequency: "weekly", priority: 0.9 },
  "/press": { changeFrequency: "monthly", priority: 0.8 },
  "/stickers": { changeFrequency: "monthly", priority: 0.6 },
  "/game": { changeFrequency: "monthly", priority: 0.8 },
  "/webtoon": { changeFrequency: "weekly", priority: 0.8 },
  "/vision": { changeFrequency: "monthly", priority: 0.7 },
  "/process": { changeFrequency: "monthly", priority: 0.7 },
  "/best-ai-anime": { changeFrequency: "monthly", priority: 0.8 },
  "/blog": { changeFrequency: "weekly", priority: 0.7 },
  "/how-to-make-ai-anime": { changeFrequency: "monthly", priority: 0.8 },
  "/ai-character-consistency": { changeFrequency: "monthly", priority: 0.7 },
  "/is-ai-anime-real-anime": { changeFrequency: "monthly", priority: 0.8 },
  "/ai-anime-vs-traditional-animation": { changeFrequency: "monthly", priority: 0.7 },
  "/legal-notice": { changeFrequency: "yearly", priority: 0.2 },
  "/privacy-policy": { changeFrequency: "yearly", priority: 0.2 },
};

type BuildPageMetadataOptions = {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  /** Locale-neutral path for hreflang, e.g. `/webtoon` or `/webtoon/ep1-opening`. */
  pathSuffix?: IndexablePathSuffix | `/${string}`;
  /** Bypass root title template when the full title is already composed. */
  absoluteTitle?: boolean;
  noIndex?: boolean;
  ogType?: "website" | "article";
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
  /** The route has its own `opengraph-image`: leave the share image to it. */
  segmentImage?: boolean;
};

export function localeHreflangAlternates(
  pathSuffix: IndexablePathSuffix | `/${string}`,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = absoluteUrl(localePath(loc, pathSuffix));
  }
  languages["x-default"] = absoluteUrl(
    localePath(defaultLocale, pathSuffix),
  );
  return languages;
}

export function absoluteUrl(path: string): string {
  if (path === "/" || path === "") return SITE.url;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPageMetadata({
  locale,
  title,
  description,
  path,
  pathSuffix,
  absoluteTitle = false,
  noIndex = false,
  ogType = "website",
  ogImage = SITE.ogImage,
  ogImageWidth = SITE.ogImageWidth,
  ogImageHeight = SITE.ogImageHeight,
  ogImageAlt = `${SITE.name}, official anime project`,
  segmentImage = false,
}: BuildPageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);
  const hreflang =
    pathSuffix && !noIndex
      ? localeHreflangAlternates(pathSuffix)
      : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      ...(hreflang ? { languages: hreflang } : {}),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: ogType,
      locale: openGraphLocales[locale],
      alternateLocale: locales
        .filter((loc) => loc !== locale)
        .map((loc) => openGraphLocales[loc]),
      siteName: SITE.name,
      ...(segmentImage
        ? {}
        : {
            images: [
              {
                url: ogImage,
                width: ogImageWidth,
                height: ogImageHeight,
                alt: ogImageAlt,
              },
            ],
          }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(segmentImage ? {} : { images: [ogImage] }),
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

const schemaLanguages: Record<Locale, string> = {
  en: "en",
  fr: "fr",
  ja: "ja",
  ko: "ko",
};

export function homePageJsonLd(locale: Locale, dict: Dictionary) {
  const image = absoluteUrl(SITE.ogImage);
  const pageUrl = absoluteUrl(`/${locale}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        name: SITE.name,
        url: pageUrl,
        description: dict.meta.home.description,
        inLanguage: schemaLanguages[locale],
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/images/logo-lost-garden.png"),
        },
        email: SITE.email,
        sameAs: Object.values(SOCIAL_LINKS),
        founder: {
          "@type": "Person",
          name: SITE.creator,
          sameAs: [CREATOR_WIKIDATA],
        },
      },
      {
        "@type": "TVSeries",
        "@id": `${SITE.url}/#series`,
        name: SITE.name,
        description: dict.meta.home.description,
        url: pageUrl,
        image,
        genre: ["Animation", "Dark Fantasy", "Anime"],
        inLanguage: schemaLanguages[locale],
        numberOfEpisodes: EPISODES.length,
        datePublished: SERIES_PUBLISHED_AT,
        sameAs: [
          ...Object.values(SOCIAL_LINKS),
          ...Object.values(DATABASE_LINKS),
        ],
        creator: {
          "@type": "Person",
          name: SITE.creator,
          sameAs: [CREATOR_WIKIDATA],
        },
      },
    ],
  };
}

export function breadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageJsonLd({
  locale,
  name,
  description,
  path,
}: {
  locale: Locale;
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${SITE.url}/#website` },
    inLanguage: schemaLanguages[locale],
  };
}

const DEFAULT_ARTICLE_KEYWORDS = [
  "AI anime",
  "AI-assisted animation",
  "generative animation",
  "indie anime",
  "Lost Garden",
] as const;

export function articlePageJsonLd({
  locale,
  headline,
  description,
  path,
  datePublished,
  dateModified,
  keywords = DEFAULT_ARTICLE_KEYWORDS,
}: {
  locale: Locale;
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  keywords?: readonly string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    // Every article route ships its own share image (see lib/article-share.tsx).
    image: {
      "@type": "ImageObject",
      url: absoluteUrl(`${path}/opengraph-image`),
      width: 1200,
      height: 630,
    },
    author: {
      "@type": "Person",
      name: SITE.creator,
      url: SITE.url,
      sameAs: [CREATOR_WIKIDATA],
    },
    publisher: { "@id": `${SITE.url}/#organization` },
    isPartOf: { "@id": `${SITE.url}/#website` },
    inLanguage: schemaLanguages[locale],
    about: { "@id": `${SITE.url}/#series` },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    keywords: [...keywords],
  };
}

/**
 * Ranked list markup for the AI anime round-up. Google reads ItemList on
 * "best of" pages, so each entry carries its position and a short description.
 */
export function itemListJsonLd({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items: ReadonlyArray<{
    position: number;
    name: string;
    description: string;
    url?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url: absoluteUrl(path),
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      description: item.description,
      ...(item.url ? { url: item.url } : {}),
    })),
  };
}

export function faqPageJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function episodeVideoJsonLd({
  locale,
  name,
  description,
  episode = LATEST_EPISODE,
}: {
  locale: Locale;
  name: string;
  description: string;
  episode?: Episode;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    // The episode's own frame, not the site-wide image: Google shows it in video results.
    thumbnailUrl: [
      episodeThumbnailUrl(episode),
      `https://i.ytimg.com/vi/${episode.youtubeId}/hqdefault.jpg`,
    ],
    uploadDate: episode.publishedAt,
    ...(episode.duration ? { duration: episode.duration } : {}),
    contentUrl: episode.watchUrl,
    embedUrl: episode.embedUrl,
    inLanguage: schemaLanguages[locale],
    creator: {
      "@type": "Person",
      name: SITE.creator,
    },
    partOfSeries: { "@id": `${SITE.url}/#series` },
    keywords: [
      "AI anime",
      "AI-assisted anime",
      "AI animation",
      "dark fantasy anime",
      "Lost Garden",
    ],
  };
}

/**
 * Last real content change of each page (ISO date). A sitemap that claims every
 * page changed "just now" teaches crawlers to ignore the field: update a line
 * here when the page's content changes, and only then.
 */
const PAGE_LAST_MODIFIED: Record<IndexablePathSuffix, string> = {
  "/": "2026-11-16",
  "/episode-2": "2026-09-15",
  "/episode-1": "2026-09-15",
  "/press": "2026-11-16",
  "/stickers": "2026-10-01",
  "/game": "2026-09-24",
  "/webtoon": "2026-11-16",
  "/vision": "2026-11-16",
  "/process": "2026-11-16",
  "/best-ai-anime": "2026-09-04",
  "/blog": "2026-11-16",
  "/how-to-make-ai-anime": "2026-09-04",
  "/ai-character-consistency": "2026-09-04",
  "/is-ai-anime-real-anime": "2026-09-04",
  "/ai-anime-vs-traditional-animation": "2026-09-04",
  "/legal-notice": "2026-09-24",
  "/privacy-policy": "2026-09-29",
};

export function getSitemapEntries(): Array<{
  url: string;
  lastModified: Date;
  changeFrequency: SitemapFrequency;
  priority: number;
  alternates: { languages: Record<string, string> };
}> {
  const entries: Array<{
    url: string;
    lastModified: Date;
    changeFrequency: SitemapFrequency;
    priority: number;
    alternates: { languages: Record<string, string> };
  }> = [];

  for (const pathSuffix of INDEXABLE_PATH_SUFFIXES) {
    const hints = SITEMAP_HINTS[pathSuffix];
    for (const locale of locales) {
      entries.push({
        url: absoluteUrl(localePath(locale, pathSuffix)),
        lastModified: new Date(PAGE_LAST_MODIFIED[pathSuffix]),
        changeFrequency: hints.changeFrequency,
        priority: hints.priority,
        alternates: { languages: localeHreflangAlternates(pathSuffix) },
      });
    }
  }

  return entries;
}
