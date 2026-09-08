import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { ProcessFaq } from "@/components/process/ProcessFaq";
import { ProcessRelatedLinks } from "@/components/process/ProcessRelatedLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { VisionArticle } from "@/components/vision/VisionArticle";
import { ArticleHero } from "@/components/blog/ArticleHero";
import { articleOgMetadata, getArticleMedia } from "@/lib/article-media";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { getProcessArticle, getProcessFaq } from "@/lib/process-articles";
import {
  articlePageJsonLd,
  breadcrumbJsonLd,
  buildPageMetadata,
  faqPageJsonLd,
} from "@/lib/seo";

const SLUG = "/process" as const;

type ProcessPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ProcessPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.process.title,
    description: dict.meta.process.description,
    path: localePath(locale, "/process"),
    pathSuffix: "/process",
    absoluteTitle: true,
    ogType: "article",
    ...articleOgMetadata(locale, SLUG, dict),
  });
}

export default async function ProcessPage({ params }: ProcessPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const article = getProcessArticle(locale);
  const media = getArticleMedia(SLUG);
  const faq = getProcessFaq(locale);
  const homePath = localePath(locale, "/");
  const processPath = localePath(locale, "/process");

  const breadcrumbs = [
    { name: dict.process.breadcrumbHome, path: homePath },
    { name: dict.process.breadcrumbProcess, path: processPath },
  ] as const;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={articlePageJsonLd({
          locale,
          headline: dict.process.headline,
          description: dict.meta.process.description,
          path: processPath,
          ...(media ? { image: media.imageData.src } : {}),
        })}
      />
      <JsonLd data={faqPageJsonLd(faq)} />
      <LegalPageShell title={dict.process.headline}>
        {media ? (
          <ArticleHero image={media.imageData} alt={dict.media.alt[media.imageData.altKey]} />
        ) : null}
        <VisionArticle article={article} siteName={dict.common.siteName} />
        <ProcessFaq heading={dict.process.faqHeading} items={faq} />
        <ProcessRelatedLinks locale={locale} dict={dict} />
      </LegalPageShell>
    </>
  );
}
