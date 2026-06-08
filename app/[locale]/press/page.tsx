import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PressKit } from "@/components/press/PressKit";
import { PressPageShell } from "@/components/press/PressPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { PRESS_KIT } from "@/lib/press";
import { breadcrumbJsonLd, buildPageMetadata, webPageJsonLd } from "@/lib/seo";

type PressPageProps = {
  params: Promise<{ locale: string }>;
};

const PRESS_KEYWORDS = [
  "Lost Garden",
  "Frank Houbre",
  "série animée",
  "animation IA",
  "animation indépendante",
  "dark fantasy",
  "one-person studio",
  "ScreenWeaver",
  "AI filmmaking",
  "anime",
  "creative AI workflow",
  "independent animation",
  "AI-assisted animation",
  "animated dark fantasy series",
];

export async function generateMetadata({
  params,
}: PressPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const meta = dict.meta.press;

  const base = buildPageMetadata({
    locale,
    title: meta.title,
    description: meta.description,
    path: localePath(locale, "/press"),
    pathSuffix: "/press",
    absoluteTitle: true,
    ogImage: PRESS_KIT.ogImageUrl,
    ogImageAlt: `${dict.press.hero.title} press kit`,
  });

  const ogTitle = meta.ogTitle ?? meta.title;
  const ogDescription = meta.ogDescription ?? meta.description;

  return {
    ...base,
    keywords: PRESS_KEYWORDS,
    openGraph: {
      ...base.openGraph,
      title: ogTitle,
      description: ogDescription,
    },
    twitter: {
      ...base.twitter,
      title: ogTitle,
      description: ogDescription,
    },
  };
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
          name: dict.press.hero.title,
          description: dict.meta.press.description,
          path: pressPath,
        })}
      />
      <PressPageShell>
        <PressKit locale={locale} dict={dict} />
      </PressPageShell>
    </>
  );
}
