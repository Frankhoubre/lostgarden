import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { PressKit } from "@/components/press/PressKit";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { breadcrumbJsonLd, buildPageMetadata, webPageJsonLd } from "@/lib/seo";

type PressPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PressPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.press.title,
    description: dict.meta.press.description,
    path: localePath(locale, "/press"),
    pathSuffix: "/press",
    absoluteTitle: true,
  });
}

export default async function PressPage({ params }: PressPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const homePath = localePath(locale, "/");
  const pressPath = localePath(locale, "/press");

  const breadcrumbs = [
    { name: dict.press.breadcrumbHome, path: homePath },
    { name: dict.press.breadcrumbPress, path: pressPath },
  ] as const;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={webPageJsonLd({
          locale,
          name: dict.press.headline,
          description: dict.meta.press.description,
          path: pressPath,
        })}
      />
      <LegalPageShell title={dict.press.headline}>
        <PressKit locale={locale} dict={dict} />
      </LegalPageShell>
    </>
  );
}
