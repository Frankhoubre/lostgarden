"use client";

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
          <div className="trailer-frame relative aspect-video w-full overflow-hidden rounded-2xl">
            <div className="trailer-frame-inner absolute inset-0 flex flex-col items-center justify-center gap-4">
              <button
                type="button"
                className="trailer-play trailer-play--pulse"
                aria-label={dict.trailer.playAria}
                disabled
              >
                <span className="trailer-play-icon" aria-hidden="true" />
              </button>
              <p className="anime-heading font-display text-2xl text-lily sm:text-3xl">
                {dict.trailer.headline}
              </p>
              <p className="font-body text-sm font-medium text-ivory/80 sm:text-base">
                {dict.trailer.subline}
              </p>
            </div>
          </div>
        </div>
      </AnimatedInView>
    </section>
  );
}
