import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { VisionArticle } from "@/components/vision/VisionArticle";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { getVisionArticle } from "@/lib/vision-articles";
import { breadcrumbJsonLd, buildPageMetadata, webPageJsonLd } from "@/lib/seo";

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
    absoluteTitle: true,
    ogType: "article",
  });
}

export default async function VisionPage({ params }: VisionPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const article = getVisionArticle(locale);
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
        data={webPageJsonLd({
          locale,
          name: dict.vision.headline,
          description: dict.meta.vision.description,
          path: visionPath,
        })}
      />
      <LegalPageShell title={dict.vision.headline}>
        <VisionArticle article={article} siteName={dict.common.siteName} />
      </LegalPageShell>
    </>
  );
}
