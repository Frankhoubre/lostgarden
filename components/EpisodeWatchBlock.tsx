"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { EPISODE_ONE } from "@/lib/episode";

type EpisodeWatchBlockProps = {
  className?: string;
  title: string;
  id?: string;
  compact?: boolean;
};

export function EpisodeWatchBlock({
  className = "",
  title,
  id,
  compact = false,
}: EpisodeWatchBlockProps) {
  const { dict } = useLocale();

  return (
    <div id={id} className={className}>
      <div className="trailer-frame relative aspect-video w-full overflow-hidden rounded-2xl">
        <iframe
          src={`${EPISODE_ONE.embedUrl}?rel=0`}
          title={title}
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
        {dict.episodeOne.youtubeEngagement}
      </p>
      <div className={`flex justify-center ${compact ? "mt-3" : "mt-5"}`}>
        <a
          href={EPISODE_ONE.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          {dict.episodeOne.openOnYouTube}
        </a>
      </div>
    </div>
  );
}
