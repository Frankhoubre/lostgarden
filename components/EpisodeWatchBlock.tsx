"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import {
  episodeCopy,
  LATEST_EPISODE,
  type Episode,
} from "@/lib/episode";

type EpisodeWatchBlockProps = {
  className?: string;
  /** Defaults to the most recent episode. */
  episode?: Episode;
  /** Defaults to "Lost Garden · <episode label>". */
  title?: string;
  id?: string;
  compact?: boolean;
};

export function EpisodeWatchBlock({
  className = "",
  episode = LATEST_EPISODE,
  title,
  id,
  compact = false,
}: EpisodeWatchBlockProps) {
  const { dict } = useLocale();
  const copy = episodeCopy(dict, episode);
  const frameTitle = title ?? `${dict.common.siteName} · ${copy.label}`;

  return (
    <div id={id} className={className}>
      <div className="trailer-frame relative aspect-video w-full overflow-hidden rounded-2xl">
        <iframe
          src={`${episode.embedUrl}?rel=0`}
          title={frameTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <p
        className={`text-center font-body font-medium leading-relaxed text-ivory/85 ${
          compact ? "mt-3 text-xs sm:text-sm" : "mt-5 text-sm sm:text-base"
        }`}
      >
        {dict.episode.youtubeEngagement}
      </p>
      <div className={`flex justify-center ${compact ? "mt-3" : "mt-5"}`}>
        <a
          href={episode.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          {dict.episode.openOnYouTube}
        </a>
      </div>
    </div>
  );
}
