import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EpisodePageBody, buildEpisodeMetadata } from "@/components/episode/EpisodePageBody";
import { EPISODE_TWO } from "@/lib/episode";
import { isLocale, type Locale } from "@/lib/i18n/config";

type EpisodeTwoPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: EpisodeTwoPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  return buildEpisodeMetadata(localeParam as Locale, EPISODE_TWO);
}

export default async function EpisodeTwoPage({ params }: EpisodeTwoPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  return <EpisodePageBody locale={localeParam as Locale} episode={EPISODE_TWO} />;
}
