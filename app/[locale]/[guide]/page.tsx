import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideBody } from "@/components/blog/GuideBody";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleOgMetadata, getArticleMedia, GUIDES, isGuideSlug } from "@/lib/article-media";
import type { GuideSlug } from "@/lib/guide-article";
import { getGuide } from "@/lib/guides";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import {
  articlePageJsonLd,
  breadcrumbJsonLd,
  buildPageMetadata,
  faqPageJsonLd,
} from "@/lib/seo";

/**
 * Every long-form guide is served by this one route. The slug list comes
 * from GUIDES, so adding a guide means adding its content and one table
 * entry, not a new page file.
 */

type PageProps = { params: Promise<{ locale: string; guide: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    (Object.keys(GUIDES) as GuideSlug[]).map((slug) => ({ locale, guide: slug.slice(1) })),
  );
}

function resolve(localeParam: string, guideParam: string) {
  const slug = `/${guideParam}`;
  if (!isLocale(localeParam) || !isGuideSlug(slug)) return null;
  return { locale: localeParam as Locale, slug };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam, guide } = await params;
  const resolved = resolve(localeParam, guide);
  if (!resolved) return {};
  const { locale, slug } = resolved;
  const dict = await getDictionary(locale);
  const meta = dict.meta[GUIDES[slug].key];

  return buildPageMetadata({
    locale,
    title: meta.title,
    description: meta.description,
    path: localePath(locale, slug),
    pathSuffix: slug,
    absoluteTitle: true,
    ogType: "article",
    ...articleOgMetadata(locale, slug, dict),
  });
}

export default async function GuidePage({ params }: PageProps) {
  const { locale: localeParam, guide: guideParam } = await params;
  const resolved = resolve(localeParam, guideParam);
  if (!resolved) notFound();
  const { locale, slug } = resolved;
  const dict = await getDictionary(locale);
  const { key, published } = GUIDES[slug];
  const guide = getGuide(locale, slug);
  const media = getArticleMedia(slug);
  const page = dict.guides[key];
  const pagePath = localePath(locale, slug);

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
          description: dict.meta[key].description,
          path: pagePath,
          datePublished: published,
          dateModified: published,
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
