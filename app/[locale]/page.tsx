import { JsonLd } from "@/components/seo/JsonLd";
import { CharactersSection } from "@/components/CharactersSection";
import { DiscoverSection } from "@/components/DiscoverSection";
import { Hero } from "@/components/Hero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { homePageJsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return (
    <>
      <JsonLd data={homePageJsonLd(locale, dict)} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-mist focus:px-4 focus:py-2 focus:text-lily"
      >
        {dict.common.skipToContent}
      </a>

      <SiteNav />

      <main id="main">
        <Hero />
        <CharactersSection />
        <DiscoverSection />
      </main>

      <SiteFooter />
    </>
  );
}

export async function generateMetadata({ params }: HomePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const { buildPageMetadata } = await import("@/lib/seo");

  return buildPageMetadata({
    locale,
    title: dict.meta.home.title,
    description: dict.meta.home.description,
    path: localePath(locale, "/"),
    absoluteTitle: true,
  });
}
