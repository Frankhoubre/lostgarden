import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { VisionArticle } from "@/components/vision/VisionArticle";
import { ArticleHero } from "@/components/blog/ArticleHero";
import { articleOgMetadata, getArticleMedia } from "@/lib/article-media";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { getVisionArticle } from "@/lib/vision-articles";
import {
  articlePageJsonLd,
  breadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";

const SLUG = "/vision" as const;

type VisionPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: VisionPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.vision.title,
    description: dict.meta.vision.description,
    path: localePath(locale, "/vision"),
    pathSuffix: "/vision",
    absoluteTitle: true,
    ogType: "article",
    ...articleOgMetadata(locale, SLUG, dict),
  });
}

export default async function VisionPage({ params }: VisionPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const article = getVisionArticle(locale);
  const media = getArticleMedia(SLUG);
  const homePath = localePath(locale, "/");
  const visionPath = localePath(locale, "/vision");

  const breadcrumbs = [
    { name: dict.vision.breadcrumbHome, path: homePath },
    { name: dict.vision.breadcrumbVision, path: visionPath },
  ] as const;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={articlePageJsonLd({
          locale,
          headline: dict.vision.headline,
          description: dict.meta.vision.description,
          path: visionPath,
          ...(media ? { image: media.imageData.src } : {}),
        })}
      />
      <LegalPageShell title={dict.vision.headline}>
        {media ? (
          <ArticleHero image={media.imageData} alt={dict.media.alt[media.imageData.altKey]} />
        ) : null}
        <VisionArticle article={article} siteName={dict.common.siteName} />
      </LegalPageShell>
    </>
  );
}
