import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EpisodeWatchBlock } from "@/components/EpisodeWatchBlock";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleOgMetadata } from "@/lib/article-media";
import { EPISODE_ONE } from "@/lib/episode";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { breadcrumbJsonLd, buildPageMetadata, episodeVideoJsonLd, webPageJsonLd } from "@/lib/seo";
import { formatTimestamp, groupCues } from "@/lib/transcript";
import { getTranscript, TRANSCRIPT_PUBLISHED } from "@/lib/transcripts";

/**
 * Full dialogue of Episode One with timestamps that deep-link into the
 * YouTube player. Published only once every language has its subtitles.
 */

const SLUG = "/episode-1-transcript" as const;

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam) || !TRANSCRIPT_PUBLISHED) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.episodeOneTranscript.title,
    description: dict.meta.episodeOneTranscript.description,
    path: localePath(locale, SLUG),
    pathSuffix: SLUG,
    absoluteTitle: true,
    ogType: "article",
    ...articleOgMetadata(locale, SLUG, dict),
  });
}

export default async function TranscriptPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam) || !TRANSCRIPT_PUBLISHED) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const cues = getTranscript(locale);
  const paragraphs = groupCues(cues);
  const pagePath = localePath(locale, SLUG);
  const fullText = cues.map((cue) => cue.text).join(" ");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.episodeOnePublic.breadcrumbHome, path: localePath(locale, "/") },
          { name: dict.episodeOnePublic.breadcrumbEpisode, path: localePath(locale, "/episode-1") },
          { name: dict.transcript.breadcrumb, path: pagePath },
        ])}
      />
      <JsonLd
        data={webPageJsonLd({
          locale,
          name: dict.meta.episodeOneTranscript.title,
          description: dict.meta.episodeOneTranscript.description,
          path: pagePath,
        })}
      />
      <JsonLd
        data={{
          ...episodeVideoJsonLd({
            locale,
            dict,
            name: dict.meta.episodeOnePublic.title,
            description: dict.meta.episodeOnePublic.description,
          }),
          transcript: fullText,
        }}
      />
      <LegalPageShell title={dict.transcript.headline}>
        <p className="font-display text-lg text-cyan-pale/90 sm:text-xl">{dict.common.siteName}</p>
        <p className="mt-2 text-ivory/60">{dict.transcript.lead}</p>
        <EpisodeWatchBlock title={dict.trailer.embedTitle} compact />
        <div className="space-y-6">
          {paragraphs.map((group) => {
            const start = Math.floor(group[0].start);
            return (
              <p key={`${group[0].start}`} className="flex gap-4">
                <a
                  href={`${EPISODE_ONE.watchUrl}?t=${start}`}
                  target="_blank"
                  rel="noopener"
                  className="shrink-0 font-display text-xs tracking-[0.12em] text-cyan-pale/70 underline-offset-4 hover:text-magic hover:underline"
                  aria-label={`${dict.transcript.watchAt} ${formatTimestamp(start)}`}
                >
                  {formatTimestamp(start)}
                </a>
                <span>{group.map((cue) => cue.text).join(" ")}</span>
              </p>
            );
          })}
        </div>
      </LegalPageShell>
    </>
  );
}
