import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { EpisodeOnePublic } from "@/components/episode/EpisodeOnePublic";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  episodeVideoJsonLd,
  webPageJsonLd,
} from "@/lib/seo";

type EpisodeOnePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: EpisodeOnePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.episodeOnePublic.title,
    description: dict.meta.episodeOnePublic.description,
    path: localePath(locale, "/episode-1"),
    pathSuffix: "/episode-1",
    absoluteTitle: true,
  });
}

export default async function EpisodeOnePage({ params }: EpisodeOnePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const homePath = localePath(locale, "/");
  const episodePath = localePath(locale, "/episode-1");

  const breadcrumbs = [
    { name: dict.episodeOnePublic.breadcrumbHome, path: homePath },
    { name: dict.episodeOnePublic.breadcrumbEpisode, path: episodePath },
  ] as const;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={webPageJsonLd({
          locale,
          name: dict.episodeOnePublic.headline,
          description: dict.meta.episodeOnePublic.description,
          path: episodePath,
        })}
      />
      <JsonLd
        data={episodeVideoJsonLd({
          locale,
          name: dict.meta.episodeOnePublic.title,
          description: dict.meta.episodeOnePublic.description,
        })}
      />
      <LegalPageShell title={dict.episodeOnePublic.headline}>
        <EpisodeOnePublic />
      </LegalPageShell>
    </>
  );
}
