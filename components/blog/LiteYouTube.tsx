"use client";

import { useState } from "react";

type LiteYouTubeProps = {
  youtubeId: string;
  title: string;
  /** Visible label on the play control, e.g. "Play the trailer". */
  playLabel: string;
  className?: string;
};

/**
 * Poster first, iframe only after a click. Six embedded players on one page
 * would otherwise load six YouTube runtimes before the reader scrolls to any.
 */
export function LiteYouTube({ youtubeId, title, playLabel, className = "" }: LiteYouTubeProps) {
  const [active, setActive] = useState(false);
  const poster = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

  return (
    <div
      className={`trailer-frame relative aspect-video w-full overflow-hidden rounded-2xl bg-abyss ${className}`.trim()}
    >
      {active ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`${playLabel}: ${title}`}
          className="group absolute inset-0 flex h-full w-full items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
          />
          <span className="relative flex items-center gap-3 rounded-full border border-glow/40 bg-abyss/80 px-5 py-3 font-display text-sm tracking-[0.12em] text-lily backdrop-blur-sm transition group-hover:border-magic group-hover:text-magic">
            <span aria-hidden="true" className="text-base">▶</span>
            {playLabel}
          </span>
        </button>
      )}
    </div>
  );
}
