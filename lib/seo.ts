import type { Metadata } from "next";
import { LEGAL_PUBLISHER } from "@/lib/legal";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lostgarden.app";

export const SITE = {
  name: "Lost Garden",
  url: SITE_URL,
  locale: "en_US",
  ogImage: "/images/hero-banner.png",
  ogImageWidth: 1024,
  ogImageHeight: 576,
  email: LEGAL_PUBLISHER.email,
  creator: LEGAL_PUBLISHER.name,
} as const;

export const HOME_TITLE = "Lost Garden - Poetic Dark Fantasy Anime";

export const HOME_DESCRIPTION =
  "Poetic dark fantasy anime by Frank Houbre. A hollow knight, a mysterious child, and a world beneath the earth. Watch the trailer and join the journey.";

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  /** Bypass root title template when the full title is already composed. */
  absoluteTitle?: boolean;
  noIndex?: boolean;
  ogType?: "website" | "article";
};

export function absoluteUrl(path: string): string {
  if (path === "/" || path === "") return SITE.url;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  noIndex = false,
  ogType = "website",
}: BuildPageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: ogType,
      locale: SITE.locale,
      siteName: SITE.name,
      images: [
        {
          url: SITE.ogImage,
          width: SITE.ogImageWidth,
          height: SITE.ogImageHeight,
          alt: `${SITE.name} — official anime project`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE.ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function homePageJsonLd() {
  const image = absoluteUrl(SITE.ogImage);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        name: SITE.name,
        url: SITE.url,
        description: HOME_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        logo: absoluteUrl("/images/logo-lost-garden.png"),
        email: SITE.email,
        founder: {
          "@type": "Person",
          name: SITE.creator,
        },
      },
      {
        "@type": "TVSeries",
        "@id": `${SITE.url}/#series`,
        name: SITE.name,
        description: HOME_DESCRIPTION,
        url: SITE.url,
        image,
        genre: ["Animation", "Fantasy"],
        inLanguage: "en",
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
  name,
  description,
  path,
}: {
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
    inLanguage: "en",
  };
}
