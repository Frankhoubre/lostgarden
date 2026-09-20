import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { StoryboardNotes } from "@/components/webtoon/StoryboardNotes";
import { WebtoonPageShell } from "@/components/webtoon/WebtoonPageShell";
import { WebtoonReader } from "@/components/webtoon/WebtoonReader";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { breadcrumbJsonLd, buildPageMetadata, webPageJsonLd } from "@/lib/seo";
import { computeLayout } from "@/lib/webtoon/layout";
import { withPublishedPanels } from "@/lib/webtoon/published";
import { getWebtoonScript, WEBTOON_SLUGS } from "@/lib/webtoon/scripts";
import { fill, localizedText } from "@/lib/webtoon/text";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 60;

export function generateStaticParams() {
  return locales.flatMap((locale) => WEBTOON_SLUGS.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const script = getWebtoonScript(slug);
  if (!script) return {};
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    title: `${localizedText(script.title, locale)} · ${dict.webtoon.headline} | Lost Garden`,
    description: dict.meta.webtoon.description,
    path: localePath(locale, `/webtoon/${slug}`),
    absoluteTitle: true,
  });
}

export default async function WebtoonReaderPage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const engineScript = getWebtoonScript(slug);
  if (!engineScript) notFound();
  // The studio can publish an edited version; the reader shows it when it exists.
  const script = await withPublishedPanels(engineScript);
  const dict = await getDictionary(locale);
  const w = dict.webtoon;
  const layout = computeLayout(script.panels);
  const path = localePath(locale, `/webtoon/${slug}`);
  const title = localizedText(script.title, locale);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: w.breadcrumbHome, path: localePath(locale, "/") },
          { name: w.breadcrumbWebtoon, path: localePath(locale, "/webtoon") },
          { name: title, path },
        ])}
      />
      <JsonLd data={webPageJsonLd({ locale, name: title, description: dict.meta.webtoon.description, path })} />
      <WebtoonPageShell>
        <p className="anime-label text-xs text-cyan-pale">{localizedText(script.subtitle, locale)}</p>
        <h1 className="anime-heading mt-1 font-display text-3xl text-lily sm:text-4xl">{title}</h1>
        <p className="mt-2 text-xs text-ivory/60">
          {fill(w.panels, { count: script.panels.length })} · {fill(w.height, { px: layout.total_height })}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <Link href={`${path}/editor`} className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline">
            {w.openEditor}
          </Link>
          <a href={`/api/webtoon/${slug}`} className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline">
            {w.jsonLink}
          </a>
        </div>

        <div className="webtoon-stage mt-8">
          <WebtoonReader panels={script.panels} />
        </div>

        <StoryboardNotes script={script} />
      </WebtoonPageShell>
    </>
  );
}
