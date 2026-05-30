"use client";

import { AnimatedInView } from "./AnimatedInView";
import { AtmosphereLayer } from "./AtmosphereLayer";
import { KnightsCarousel } from "./knights/KnightsCarousel";
import { SectionTitle } from "./SectionTitle";
import { useLocale } from "@/components/providers/LocaleProvider";

export function KnightsSection() {
  const { dict } = useLocale();

  return (
    <section id="knights" className="section-pad section-discover scroll-mt-14">
      <AtmosphereLayer />
      <AnimatedInView>
        <SectionTitle subtitle={dict.knights.subtitle}>
          {dict.knights.title}
        </SectionTitle>
      </AnimatedInView>

      <AnimatedInView className="mx-auto mt-12 w-full max-w-7xl" delay={0.1}>
        <KnightsCarousel />
      </AnimatedInView>
    </section>
  );
}
