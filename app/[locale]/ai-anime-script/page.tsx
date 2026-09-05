import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideBody } from "@/components/blog/GuideBody";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getGuide } from "@/lib/guides";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import {
  articlePageJsonLd,
  breadcrumbJsonLd,
  buildPageMetadata,
  faqPageJsonLd,
} from "@/lib/seo";

const SLUG = "/ai-anime-script" as const;
const PUBLISHED = "2026-09-05";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.aiAnimeScript.title,
    description: dict.meta.aiAnimeScript.description,
    path: localePath(locale, SLUG),
    pathSuffix: SLUG,
    absoluteTitle: true,
    ogType: "article",
  });
}

export default async function AiAnimeScriptPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const guide = getGuide(locale, SLUG);
  const page = dict.guides.aiAnimeScript;
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
          description: dict.meta.aiAnimeScript.description,
          path: pagePath,
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
          keywords: page.keywords,
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
        />
      </LegalPageShell>
    </>
  );
}
