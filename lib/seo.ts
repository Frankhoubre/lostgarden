import type { Metadata } from "next";
import { EPISODE_ONE } from "@/lib/episode";
import { defaultLocale, locales, openGraphLocales, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { LEGAL_PUBLISHER } from "@/lib/legal";
import { SOCIAL_LINKS } from "@/lib/social";
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

const SITEMAP_HINTS: Record<
  IndexablePathSuffix,
  { changeFrequency: SitemapFrequency; priority: number }
> = {
  "/": { changeFrequency: "weekly", priority: 1 },
  "/episode-1": { changeFrequency: "weekly", priority: 0.9 },
  "/press": { changeFrequency: "monthly", priority: 0.8 },
  "/vision": { changeFrequency: "monthly", priority: 0.7 },
  "/process": { changeFrequency: "monthly", priority: 0.7 },
  "/legal-notice": { changeFrequency: "yearly", priority: 0.2 },
  "/privacy-policy": { changeFrequency: "yearly", priority: 0.2 },
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
        founder: {
          "@type": "Person",
          name: SITE.creator,
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
        numberOfEpisodes: 1,
        datePublished: "2026-06-02",
        sameAs: Object.values(SOCIAL_LINKS),
        creator: {
          "@type": "Person",
          name: SITE.creator,
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

export function articlePageJsonLd({
  locale,
  headline,
  description,
  path,
}: {
  locale: Locale;
  headline: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: absoluteUrl(path),
    author: {
      "@type": "Person",
      name: SITE.creator,
    },
    publisher: { "@id": `${SITE.url}/#organization` },
    isPartOf: { "@id": `${SITE.url}/#website` },
    inLanguage: schemaLanguages[locale],
    about: { "@id": `${SITE.url}/#series` },
    keywords: [
      "AI anime",
      "AI-assisted animation",
      "generative animation",
      "indie anime",
      "Lost Garden",
    ],
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
    name,
    description,
    thumbnailUrl: image,
    uploadDate: "2026-06-02",
    contentUrl: EPISODE_ONE.watchUrl,
    embedUrl: EPISODE_ONE.embedUrl,
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

export function getSitemapEntries(): Array<{
  url: string;
  lastModified: Date;
  changeFrequency: SitemapFrequency;
  priority: number;
  alternates: { languages: Record<string, string> };
}> {
  const lastModified = new Date();
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
        lastModified,
        changeFrequency: hints.changeFrequency,
        priority: hints.priority,
        alternates: { languages: localeHreflangAlternates(pathSuffix) },
      });
    }
  }

  return entries;
}
