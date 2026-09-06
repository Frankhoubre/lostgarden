import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideBody } from "@/components/blog/GuideBody";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getGuide } from "@/lib/guides";
import { getArticleMedia, ogCardPath } from "@/lib/article-media";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import {
  articlePageJsonLd,
  breadcrumbJsonLd,
  buildPageMetadata,
  faqPageJsonLd,
} from "@/lib/seo";

const SLUG = "/ai-anime-vs-traditional-animation" as const;
const PUBLISHED = "2026-09-04";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const media = getArticleMedia(SLUG);

  return buildPageMetadata({
    locale,
    title: dict.meta.aiAnimeVsTraditional.title,
    description: dict.meta.aiAnimeVsTraditional.description,
    path: localePath(locale, SLUG),
    pathSuffix: SLUG,
    absoluteTitle: true,
    ogType: "article",
    ...(media
      ? {
          ogImage: ogCardPath(locale, SLUG),
          ogImageWidth: 1200,
          ogImageHeight: 630,
          ogImageAlt: dict.media.alt[media.imageData.altKey],
        }
      : {}),
  });
}

export default async function AiAnimeVsTraditionalPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const guide = getGuide(locale, SLUG);
  const media = getArticleMedia(SLUG);
  const page = dict.guides.aiAnimeVsTraditional;
  const pagePath = localePath(locale, SLUG);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.guides.breadcrumbHome, path: localePath(locale, "/") },
          { name: dict.guides.breadcrumbBlog, path: localePath(locale, "/blog") },
          { name: page.headline, path: pagePath },
        ])}
      />
      <JsonLd
        data={articlePageJsonLd({
          locale,
          headline: page.headline,
          description: dict.meta.aiAnimeVsTraditional.description,
          path: pagePath,
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
          keywords: page.keywords,
          ...(media ? { image: media.imageData.src } : {}),
        })}
      />
      <JsonLd data={faqPageJsonLd(guide.faq)} />
      <LegalPageShell title={page.headline}>
        <GuideBody
          guide={guide}
          locale={locale}
          siteName={dict.common.siteName}
          faqHeading={dict.guides.faqHeading}
          relatedHeading={dict.guides.relatedHeading}
          hero={
            media
              ? { image: media.imageData, alt: dict.media.alt[media.imageData.altKey] }
              : undefined
          }
          episode={
            media?.episode
              ? { heading: dict.media.episodeHeading, embedTitle: dict.trailer.embedTitle }
              : undefined
          }
        />
      </LegalPageShell>
    </>
  );
}
