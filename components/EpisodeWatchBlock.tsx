"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { EPISODE_ONE } from "@/lib/episode";

type EpisodeWatchBlockProps = {
  className?: string;
  title: string;
};

export function EpisodeWatchBlock({ className = "", title }: EpisodeWatchBlockProps) {
  const { dict } = useLocale();

  return (
    <div className={className}>
      <div className="trailer-frame relative aspect-video w-full overflow-hidden rounded-2xl">
        <iframe
          src={`${EPISODE_ONE.embedUrl}?rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <p className="mt-5 text-center font-body text-sm font-medium leading-relaxed text-ivory/85 sm:text-base">
        {dict.episodeOne.youtubeEngagement}
      </p>
      <div className="mt-5 flex justify-center">
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
