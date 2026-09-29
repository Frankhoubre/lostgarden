import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { StoryboardNotes } from "@/components/webtoon/StoryboardNotes";
import { notesOf } from "@/lib/webtoon/notes";
import { WebtoonPageShell } from "@/components/webtoon/WebtoonPageShell";
import { WebtoonReader } from "@/components/webtoon/WebtoonReader";
import { forReader } from "@/lib/webtoon/reader-panels";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo";
import { comicIssueJsonLd, episodeDescription, episodeIntro, episodeMetadata, findEpisode, type EpisodeSummary } from "@/lib/webtoon/episode-seo";
import { computeLayout } from "@/lib/webtoon/layout";
import { fetchPublishedStrip, withPublishedPanels } from "@/lib/webtoon/published";
import { fetchSeries } from "@/lib/webtoon/series-server";
import { neighbours, type SeriesEpisode } from "@/lib/webtoon/series";
import { EpisodeAlerts } from "@/components/webtoon/EpisodeAlerts";
import { EpisodeNav } from "@/components/webtoon/EpisodeNav";
import { mailConfigured } from "@/lib/webtoon/alerts-server";
import { ReadingProgress } from "@/components/webtoon/ReadingProgress";
import { ReadingStats } from "@/components/webtoon/ReadingStats";
import type { WebtoonPanel } from "@/lib/webtoon/types";
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
  const episode = await findEpisode(slug, locale);
  if (!episode) return {};
  const dict = await getDictionary(locale);
  // The same reads as the page (deduplicated by the fetch cache): the description quotes the first line.
  const script = getWebtoonScript(slug);
  const panels = script ? (await withPublishedPanels(script)).panels : (await fetchPublishedStrip(slug))?.panels;
  return episodeMetadata({ locale, dict, episode, description: episodeDescription(dict, episode, locale, panels) });
}

export default async function WebtoonReaderPage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const engineScript = getWebtoonScript(slug);
  const episodes = await fetchSeries();
  const { previous, next } = neighbours(episodes, slug);
  if (!engineScript) {
    // An episode made in a studio project: its published strip and its line in the series.
    const episode = episodes.find((e) => e.slug === slug);
    const published = episode ? await fetchPublishedStrip(slug) : null;
    if (!episode || !published) notFound();
    const summary = await findEpisode(slug, locale);
    return <ProjectEpisode locale={locale} episode={episode} summary={summary} panels={published.panels} previous={previous} next={next} />;
  }
  // The studio can publish an edited version; the reader shows it when it exists.
  const script = await withPublishedPanels(engineScript);
  const dict = await getDictionary(locale);
  const w = dict.webtoon;
  const layout = computeLayout(script.panels);
  const path = localePath(locale, `/webtoon/${slug}`);
  const title = localizedText(script.title, locale);
  const summary: EpisodeSummary = (await findEpisode(slug, locale)) ?? { slug, series: script.series, episode: script.episode, title, panels: script.panels.length };

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: w.breadcrumbHome, path: localePath(locale, "/") },
          { name: w.breadcrumbWebtoon, path: localePath(locale, "/webtoon") },
          { name: title, path },
        ])}
      />
      <JsonLd data={webPageJsonLd({ locale, name: title, description: episodeIntro(dict, summary, script.panels.length), path })} />
      <JsonLd data={comicIssueJsonLd({ locale, episode: summary, description: episodeDescription(dict, summary, locale, script.panels) })} />
      <WebtoonPageShell>
        <p className="anime-label text-xs text-cyan-pale">{localizedText(script.subtitle, locale)}</p>
        <h1 className="anime-heading mt-1 font-display text-3xl text-lily sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ivory/85">{episodeIntro(dict, summary, script.panels.length)}</p>
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
          <WebtoonReader panels={forReader(script.panels)} />
        </div>
        <ReadingProgress slug={slug} locale={locale} />
        <ReadingStats slug={slug} locale={locale} />
        <EpisodeNav locale={locale} previous={previous} next={next} />
        {mailConfigured() ? <EpisodeAlerts locale={locale} words={w.alerts} privacyHref={localePath(locale, "/privacy-policy")} /> : null}

        <StoryboardNotes script={notesOf(script)} />
      </WebtoonPageShell>
    </>
  );
}

/** An episode of a studio project: the published strip, with the series around it. */
async function ProjectEpisode({ locale, episode, summary: found, panels, previous, next }: { locale: Locale; episode: SeriesEpisode; summary: EpisodeSummary | null; panels: WebtoonPanel[]; previous?: SeriesEpisode; next?: SeriesEpisode }) {
  const dict = await getDictionary(locale);
  const w = dict.webtoon;
  const layout = computeLayout(panels);
  const path = localePath(locale, `/webtoon/${episode.slug}`);
  const summary: EpisodeSummary = found ?? { slug: episode.slug, series: episode.series, episode: episode.episode, title: episode.title, cover: episode.cover, panels: panels.length, publishedAt: episode.published_at };
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: w.breadcrumbHome, path: localePath(locale, "/") },
          { name: w.breadcrumbWebtoon, path: localePath(locale, "/webtoon") },
          { name: episode.title, path },
        ])}
      />
      <JsonLd data={comicIssueJsonLd({ locale, episode: summary, description: episodeDescription(dict, summary, locale, panels) })} />
      <WebtoonPageShell>
        <p className="anime-label text-xs text-cyan-pale">{episode.series}</p>
        <h1 className="anime-heading mt-1 font-display text-3xl text-lily sm:text-4xl">{episode.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ivory/85">{episodeIntro(dict, summary, panels.length)}</p>
        <p className="mt-2 text-xs text-ivory/60">
          {fill(w.panels, { count: panels.length })} · {fill(w.height, { px: layout.total_height })}
        </p>
        <div className="webtoon-stage mt-8">
          <WebtoonReader panels={forReader(panels)} />
        </div>
        <ReadingProgress slug={episode.slug} locale={locale} />
        <ReadingStats slug={episode.slug} locale={locale} />
        <EpisodeNav locale={locale} previous={previous} next={next} />
        {mailConfigured() ? <EpisodeAlerts locale={locale} words={w.alerts} privacyHref={localePath(locale, "/privacy-policy")} /> : null}
      </WebtoonPageShell>
    </>
  );
}
