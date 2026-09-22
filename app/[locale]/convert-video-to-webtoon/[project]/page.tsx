import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioApp } from "@/components/studio/StudioApp";
import { StudioGate } from "@/components/studio/StudioGate";
import { StudioProjectLoader } from "@/components/studio/StudioProjectLoader";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo";
import { getWebtoonScript } from "@/lib/webtoon/scripts";

type PageProps = { params: Promise<{ locale: string; project: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam, project } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  return {
    ...buildPageMetadata({
      locale,
      title: "Studio webtoon | Lost Garden",
      description: "Espace de travail privé du studio webtoon.",
      path: localePath(locale, `/convert-video-to-webtoon/${project}`),
      absoluteTitle: true,
      noIndex: true,
    }),
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}

/**
 * One project of the studio. Lost Garden episode 1 is built in: its script
 * comes from the code. Any other project is read from Firestore in the
 * browser, once the studio account is signed in.
 */
export default async function StudioProjectPage({ params, searchParams }: PageProps) {
  const { locale: localeParam, project } = await params;
  if (!isLocale(localeParam)) notFound();
  const query = await searchParams;
  const builtIn = getWebtoonScript(project);
  return (
    <StudioGate>
      {builtIn ? <StudioApp script={builtIn} /> : <StudioProjectLoader id={project} openBible={query.bible === "1"} />}
    </StudioGate>
  );
}
