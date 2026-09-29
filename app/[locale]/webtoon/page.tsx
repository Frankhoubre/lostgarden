import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { WebtoonPageShell } from "@/components/webtoon/WebtoonPageShell";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { breadcrumbJsonLd, buildPageMetadata, webPageJsonLd } from "@/lib/seo";
import { listWebtoonScripts } from "@/lib/webtoon/scripts";
import { fetchSeries } from "@/lib/webtoon/series-server";
import { EpisodeProgress, SeriesResume } from "@/components/webtoon/SeriesProgress";
import { EpisodeAlerts } from "@/components/webtoon/EpisodeAlerts";
import { mailConfigured } from "@/lib/webtoon/alerts-server";
import { fill, localizedText } from "@/lib/webtoon/text";
import { comicSeriesJsonLd, listEpisodes, withSegmentImages } from "@/lib/webtoon/episode-seo";

type PageProps = { params: Promise<{ locale: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  // The shared image comes from this segment's opengraph-image (latest episode's cover).
  return withSegmentImages(
    buildPageMetadata({
      locale,
      title: dict.meta.webtoon.title,
      description: dict.meta.webtoon.description,
      path: localePath(locale, "/webtoon"),
      pathSuffix: "/webtoon",
      absoluteTitle: true,
    }),
  );
}

export default async function WebtoonIndexPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const w = dict.webtoon;
  const scripts = listWebtoonScripts();
  // The episodes the studio published, in series order; a built-in episode not published yet keeps its card.
  const series = await fetchSeries();
  const episodes = await listEpisodes(locale, series);
  const cards = [
    ...series.map((e) => {
      const built = scripts.find((sc) => sc.slug === e.slug);
      const number = locale === "ja" ? `第${e.episode}話` : locale === "ko" ? `${e.episode}화` : locale === "en" ? `Episode ${e.episode}` : `Épisode ${e.episode}`;
      return { slug: e.slug, label: `${e.series} · ${number}`, title: built ? localizedText(built.title, locale) : e.title, cover: e.cover, panels: e.panels };
    }),
    ...scripts
      .filter((sc) => !series.some((e) => e.slug === sc.slug))
      .map((sc) => ({ slug: sc.slug, label: localizedText(sc.subtitle, locale), title: localizedText(sc.title, locale), cover: sc.panels.find((p) => p.image.status !== "missing" && p.image.src)?.image.src, panels: sc.panels.length })),
  ];
  const homePath = localePath(locale, "/");
  const path = localePath(locale, "/webtoon");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: w.breadcrumbHome, path: homePath },
          { name: w.breadcrumbWebtoon, path },
        ])}
      />
      <JsonLd data={webPageJsonLd({ locale, name: w.headline, description: dict.meta.webtoon.description, path })} />
      <JsonLd data={comicSeriesJsonLd({ locale, episodes, description: dict.meta.webtoon.description })} />
      <WebtoonPageShell>
        <h1 className="anime-heading font-display text-3xl text-lily sm:text-4xl">{w.headline}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ivory/85 sm:text-base">{w.lead}</p>

        <SeriesResume episodes={cards.map((c) => ({ slug: c.slug, title: c.title }))} locale={locale} />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {cards.length === 0 ? <li className="text-ivory/60">{w.indexEmpty}</li> : null}
          {cards.map((card) => (
            <li key={card.slug} className="webtoon-card">
              <Link href={localePath(locale, `/webtoon/${card.slug}`)} className="block">
                <div className="webtoon-card-cover">
                  {card.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.cover} alt="" loading="lazy" />
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="anime-label text-[0.65rem] text-cyan-pale">{card.label}</p>
                  <h2 className="mt-1 font-display text-lg text-lily">{card.title}</h2>
                  <p className="mt-2 text-xs text-ivory/60">{fill(w.panels, { count: card.panels })}</p>
                  <EpisodeProgress slug={card.slug} locale={locale} />
                  <span className="mt-3 inline-block text-sm text-magic">{w.read} →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {mailConfigured() ? <EpisodeAlerts locale={locale} words={w.alerts} privacyHref={localePath(locale, "/privacy-policy")} /> : null}

        <section className="mt-12">
          <h2 className="anime-heading font-display text-xl text-lily">{w.pipelineTitle}</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ivory/80">
            {w.pipelineSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </WebtoonPageShell>
    </>
  );
}
