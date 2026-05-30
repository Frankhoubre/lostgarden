"use client";

import { EpisodeWatchBlock } from "@/components/EpisodeWatchBlock";
import { useLocale } from "@/components/providers/LocaleProvider";
import { AnimatedInView } from "./AnimatedInView";
import { AtmosphereLayer } from "./AtmosphereLayer";

export function TrailerSection() {
  const { dict } = useLocale();

  return (
    <section id="trailer" className="section-pad section-abyss">
      <AtmosphereLayer />
      <AnimatedInView variant="scaleIn">
        <div className="mx-auto max-w-5xl">
          <p className="anime-heading text-center font-display text-2xl text-lily sm:text-3xl">
            {dict.trailer.headline}
          </p>
          <p className="mt-3 text-center font-body text-sm font-medium text-ivory/80 sm:text-base">
            {dict.trailer.subline}
          </p>
          <EpisodeWatchBlock
            className="mt-8"
            title={dict.trailer.embedTitle}
          />
        </div>
      </AnimatedInView>
    </section>
  );
}
