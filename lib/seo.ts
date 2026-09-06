import type { Metadata } from "next";
import { EPISODE_ONE } from "@/lib/episode";
import { defaultLocale, locales, openGraphLocales, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { LEGAL_PUBLISHER } from "@/lib/legal";
import { CREATOR_WIKIDATA, DATABASE_LINKS, SOCIAL_LINKS } from "@/lib/social";
import { ARTICLE_IMAGES, ARTICLE_MEDIA } from "@/lib/article-media";
import type { Dictionary } from "@/lib/i18n/types";

/**
 * Canonical origin. Vercel serves the site on the `www` host and
 * 307-redirects the bare domain to it, so every canonical, hreflang,
 * sitemap and JSON-LD URL must be built on `www` as well. A canonical or
 * hreflang target that redirects is not treated as canonical by Google.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lostgarden.world";

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
  "/ai-manga",
  "/ai-anime-generator",
  "/ai-anime-voice-and-sound",
  "/how-to-tell-if-anime-is-ai",
  "/making-of-episode-1",
  "/can-one-person-make-an-anime",
  "/ai-anime-storyboard",
  "/ai-anime-backgrounds",
  "/ai-anime-script",
  "/ai-anime-copyright",
  "/history-of-ai-anime",
  "/anime-style-prompts",
  "/editing-ai-anime",
  "/why-ai-anime-looks-bad",
  "/ai-film-festivals-animation",
  "/lost-garden-story-and-characters",
  "/press",
  "/episode-1",
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

/**
 * `lastModified` is the date the page content last changed, per page.
 * Bump it when you edit that page's copy. A single shared build date on
 * every entry teaches Google to ignore the field entirely.
 */
const SITEMAP_HINTS: Record<
  IndexablePathSuffix,
  { changeFrequency: SitemapFrequency; priority: number; lastModified: string }
> = {
  "/": { changeFrequency: "weekly", priority: 1, lastModified: "2026-09-04" },
  "/episode-1": { changeFrequency: "weekly", priority: 0.9, lastModified: "2026-06-03" },
  "/press": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-06-08" },
  "/vision": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-04" },
  "/process": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-04" },
  "/best-ai-anime": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-04" },
  "/blog": { changeFrequency: "weekly", priority: 0.7, lastModified: "2026-09-05" },
  "/how-to-make-ai-anime": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-04" },
  "/ai-character-consistency": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-04" },
  "/is-ai-anime-real-anime": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-04" },
  "/ai-anime-vs-traditional-animation": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-04" },
  "/ai-manga": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-05" },
  "/ai-anime-generator": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-05" },
  "/ai-anime-voice-and-sound": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-05" },
  "/how-to-tell-if-anime-is-ai": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-05" },
  "/making-of-episode-1": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-05" },
  "/can-one-person-make-an-anime": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-05" },
  "/ai-anime-storyboard": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-05" },
  "/ai-anime-backgrounds": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-05" },
  "/ai-anime-script": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-05" },
  "/ai-anime-copyright": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-05" },
  "/history-of-ai-anime": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-05" },
  "/anime-style-prompts": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-05" },
  "/editing-ai-anime": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-05" },
  "/why-ai-anime-looks-bad": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-05" },
  "/ai-film-festivals-animation": { changeFrequency: "monthly", priority: 0.7, lastModified: "2026-09-05" },
  "/lost-garden-story-and-characters": { changeFrequency: "monthly", priority: 0.8, lastModified: "2026-09-05" },
  "/legal-notice": { changeFrequency: "yearly", priority: 0.2, lastModified: "2026-06-03" },
  "/privacy-policy": { changeFrequency: "yearly", priority: 0.2, lastModified: "2026-06-03" },
};

type BuildPageMetadataOptions = {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  /** Used for hreflang when different from inferring from `path`. */
  pathSuffix?: IndexablePathSuffix;
  /** Bypass root title template when the full title is already composed. */
  absoluteTitle?: boolean;
  noIndex?: boolean;
  ogType?: "website" | "article";
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
};

export function localeHreflangAlternates(
  pathSuffix: IndexablePathSuffix,
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
      images: [
        {
          url: ogImage,
          width: ogImageWidth,
          height: ogImageHeight,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
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
        founder: { "@id": CREATOR_ID },
      },
      creatorJsonLd(),
      {
        "@type": "TVSeries",
        "@id": `${SITE.url}/#series`,
        name: SITE.name,
        description: dict.meta.home.description,
        url: pageUrl,
        image,
        genre: ["Animation", "Dark Fantasy", "Anime"],
        inLanguage: schemaLanguages[locale],
        numberOfEpisodes: 1,
        datePublished: EPISODE_ONE.publishedAt,
        sameAs: [
          ...Object.values(SOCIAL_LINKS),
          ...Object.values(DATABASE_LINKS),
        ],
        creator: { "@id": CREATOR_ID },
        episode: episodeJsonLd(locale, dict),
      },
    ],
  };
}

const CREATOR_ID = `${SITE_URL}/#creator`;
const EPISODE_ONE_ID = `${SITE_URL}/#episode-1`;
const EPISODE_ONE_VIDEO_ID = `${SITE_URL}/#episode-1-video`;

/** Single Person node shared by Organization.founder and TVSeries.creator. */
function creatorJsonLd() {
  return {
    "@type": "Person",
    "@id": CREATOR_ID,
    name: SITE.creator,
    url: SITE.url,
    sameAs: [CREATOR_WIKIDATA],
  };
}

/**
 * Episode node embedded in the TVSeries graph so the series entity leads
 * straight to the watchable content, in the visitor's language.
 */
function episodeJsonLd(locale: Locale, dict: Dictionary) {
  return {
    "@type": "TVEpisode",
    "@id": EPISODE_ONE_ID,
    name: dict.meta.episodeOnePublic.title,
    episodeNumber: 1,
    url: absoluteUrl(localePath(locale, "/episode-1")),
    datePublished: EPISODE_ONE.publishedAt,
    duration: EPISODE_ONE.duration,
    inLanguage: schemaLanguages[locale],
    partOfSeries: { "@id": `${SITE_URL}/#series` },
    video: { "@id": EPISODE_ONE_VIDEO_ID },
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
  image = SITE.ogImage,
}: {
  locale: Locale;
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  keywords?: readonly string[];
  /** Site-relative path of the article's lead still. */
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: absoluteUrl(path),
    image: absoluteUrl(image),
    author: {
      "@type": "Person",
      name: SITE.creator,
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
}: {
  locale: Locale;
  name: string;
  description: string;
}) {
  const image = absoluteUrl(SITE.ogImage);

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": EPISODE_ONE_VIDEO_ID,
    name,
    description,
    thumbnailUrl: image,
    uploadDate: EPISODE_ONE.publishedAt,
    duration: EPISODE_ONE.duration,
    contentUrl: EPISODE_ONE.watchUrl,
    embedUrl: EPISODE_ONE.embedUrl,
    inLanguage: schemaLanguages[locale],
    creator: creatorJsonLd(),
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

export function getSitemapEntries(): Array<{
  url: string;
  lastModified: Date;
  changeFrequency: SitemapFrequency;
  priority: number;
  alternates: { languages: Record<string, string> };
  images?: string[];
}> {
  const entries: Array<{
    url: string;
    lastModified: Date;
    changeFrequency: SitemapFrequency;
    priority: number;
    alternates: { languages: Record<string, string> };
    images?: string[];
  }> = [];

  for (const pathSuffix of INDEXABLE_PATH_SUFFIXES) {
    const hints = SITEMAP_HINTS[pathSuffix];
    const media = ARTICLE_MEDIA[pathSuffix];
    const images = media ? [absoluteUrl(ARTICLE_IMAGES[media.image].src)] : undefined;
    for (const locale of locales) {
      entries.push({
        url: absoluteUrl(localePath(locale, pathSuffix)),
        lastModified: new Date(hints.lastModified),
        changeFrequency: hints.changeFrequency,
        priority: hints.priority,
        alternates: { languages: localeHreflangAlternates(pathSuffix) },
        ...(images ? { images } : {}),
      });
    }
  }

  return entries;
}
