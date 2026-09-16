import { EpisodePublic } from "@/components/episode/EpisodePublic";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  episodeMetaCopy,
  episodePageCopy,
  type Episode,
} from "@/lib/episode";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  episodeVideoJsonLd,
  webPageJsonLd,
} from "@/lib/seo";

/** Shared metadata for every public episode page. */
export async function buildEpisodeMetadata(locale: Locale, episode: Episode) {
  const dict = await getDictionary(locale);
  const meta = episodeMetaCopy(dict, episode);

  return buildPageMetadata({
    locale,
    title: meta.title,
    description: meta.description,
    path: localePath(locale, episode.pathSuffix),
    pathSuffix: episode.pathSuffix,
    absoluteTitle: true,
  });
}

type EpisodePageBodyProps = {
  locale: Locale;
  episode: Episode;
};

/** Shared body for every public episode page. */
export async function EpisodePageBody({
  locale,
  episode,
}: EpisodePageBodyProps) {
  const dict = await getDictionary(locale);
  const copy = episodePageCopy(dict, episode);
  const meta = episodeMetaCopy(dict, episode);
  const episodePath = localePath(locale, episode.pathSuffix);

  const breadcrumbs = [
    { name: copy.breadcrumbHome, path: localePath(locale, "/") },
    { name: copy.breadcrumbEpisode, path: episodePath },
  ] as const;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={webPageJsonLd({
          locale,
          name: copy.headline,
          description: meta.description,
          path: episodePath,
        })}
      />
      <JsonLd
        data={episodeVideoJsonLd({
          locale,
          episode,
          name: meta.title,
          description: meta.description,
        })}
      />
      <LegalPageShell title={copy.headline}>
        <EpisodePublic episode={episode} />
      </LegalPageShell>
    </>
  );
}
