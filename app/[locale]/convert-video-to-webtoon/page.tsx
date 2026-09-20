import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioApp } from "@/components/studio/StudioApp";
import { StudioGate } from "@/components/studio/StudioGate";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo";
import { getWebtoonScript } from "@/lib/webtoon/scripts";

type PageProps = { params: Promise<{ locale: string }> };

/**
 * /convert-video-to-webtoon: the private studio where the strip is edited.
 * Not indexed, not linked from the site, behind the Google allowlist gate.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  return {
    ...buildPageMetadata({
      locale,
      title: "Studio webtoon | Lost Garden",
      description: "Espace de travail privé du webtoon Lost Garden.",
      path: localePath(locale, "/convert-video-to-webtoon"),
      absoluteTitle: true,
      noIndex: true,
    }),
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}

export default async function StudioPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const script = getWebtoonScript("ep1-opening");
  if (!script) notFound();

  return (
    <StudioGate>
      <StudioApp script={script} />
    </StudioGate>
  );
}
