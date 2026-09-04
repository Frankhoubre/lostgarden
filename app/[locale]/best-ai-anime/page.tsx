import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AiAnimeArticleBody } from "@/components/blog/AiAnimeArticleBody";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAiAnimeArticle } from "@/lib/ai-anime-articles";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import {
  articlePageJsonLd,
  breadcrumbJsonLd,
  buildPageMetadata,
  faqPageJsonLd,
  itemListJsonLd,
} from "@/lib/seo";

const PUBLISHED = "2026-09-04";

type BestAiAnimePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: BestAiAnimePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.bestAiAnime.title,
    description: dict.meta.bestAiAnime.description,
    path: localePath(locale, "/best-ai-anime"),
    pathSuffix: "/best-ai-anime",
    absoluteTitle: true,
    ogType: "article",
  });
}

export default async function BestAiAnimePage({ params }: BestAiAnimePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const article = getAiAnimeArticle(locale);
  const pagePath = localePath(locale, "/best-ai-anime");

  const breadcrumbs = [
    { name: dict.bestAiAnime.breadcrumbHome, path: localePath(locale, "/") },
    { name: dict.bestAiAnime.breadcrumbCurrent, path: pagePath },
  ] as const;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={articlePageJsonLd({
          locale,
          headline: dict.bestAiAnime.headline,
          description: dict.meta.bestAiAnime.description,
          path: pagePath,
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
          keywords: dict.bestAiAnime.keywords,
        })}
      />
      <JsonLd
        data={itemListJsonLd({
          name: article.rankingHeading,
          description: dict.meta.bestAiAnime.description,
          path: pagePath,
          items: article.entries.map((entry) => ({
            position: entry.rank,
            name: entry.title,
            description: entry.verdict,
          })),
        })}
      />
      <JsonLd data={faqPageJsonLd(article.faq)} />
      <LegalPageShell title={dict.bestAiAnime.headline}>
        <AiAnimeArticleBody
          article={article}
          locale={locale}
          siteName={dict.common.siteName}
        />
      </LegalPageShell>
    </>
  );
}
