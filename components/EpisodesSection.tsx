"use client";

import Link from "next/link";
import { AnimatedInView } from "./AnimatedInView";
import { SectionTitle } from "./SectionTitle";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  episodeCopy,
  EPISODES_NEWEST_FIRST,
  UPCOMING_EPISODE_NUMBER,
  type Episode,
} from "@/lib/episode";
import type { Locale } from "@/lib/i18n/config";
import { formatMessage } from "@/lib/i18n/format";
import { localePath } from "@/lib/i18n/navigation";

function formatReleaseDate(locale: Locale, episode: Episode) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(episode.publishedAt));
}

function formatDuration(locale: Locale, episode: Episode) {
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "minute",
    unitDisplay: "short",
  }).format(episode.durationMinutes);
}

export function EpisodesSection() {
  const { locale, dict } = useLocale();
  const e = dict.episodes;

  return (
    <section id="episodes" className="section-pad scroll-mt-14">
      <AnimatedInView>
        <SectionTitle subtitle={e.subtitle}>{e.title}</SectionTitle>
      </AnimatedInView>

      <AnimatedInView className="mx-auto mt-12 w-full max-w-3xl" delay={0.1}>
        <ul className="flex flex-col gap-5">
          {EPISODES_NEWEST_FIRST.map((episode) => {
            const copy = episodeCopy(dict, episode);
            return (
              <li key={episode.number} className="glass-card p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="anime-label font-display text-sm tracking-[0.14em] text-magic">
                    {copy.label}
                  </span>
                  <span className="anime-label episode-release-badge rounded-md border border-magic/40 bg-abyss/60 px-2.5 py-1 font-display text-[0.65rem] tracking-[0.16em] text-lily">
                    {e.statusOut}
                  </span>
                </div>
                <h3 className="anime-heading mt-2 font-display text-lg text-lily sm:text-xl">
                  {copy.title}
                </h3>
                <p className="mt-2 font-body text-sm text-ivory/65">
                  {formatReleaseDate(locale, episode)} &middot;{" "}
                  {formatDuration(locale, episode)}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={localePath(locale, episode.pathSuffix)}
                    className="btn-primary text-center"
                  >
                    {e.episodePage}
                  </Link>
                  <a
                    href={episode.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-center"
                  >
                    {dict.episode.openOnYouTube}
                  </a>
                </div>
              </li>
            );
          })}

          <li className="glass-card border-dashed p-6 opacity-90 sm:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="anime-label font-display text-sm tracking-[0.14em] text-cyan-pale/70">
                {formatMessage(e.upcomingLabel, {
                  number: UPCOMING_EPISODE_NUMBER,
                })}
              </span>
              <span className="anime-label rounded-md border border-glow/30 bg-cavern/50 px-2.5 py-1 font-display text-[0.65rem] tracking-[0.16em] text-cyan-pale/80">
                {e.statusProduction}
              </span>
            </div>
            <p className="mt-3 font-body text-sm leading-relaxed text-ivory/75">
              {e.upcomingLine}
            </p>
          </li>
        </ul>
      </AnimatedInView>
    </section>
  );
}
