"use client";

import { AnimatedInView } from "./AnimatedInView";
import { AtmosphereLayer } from "./AtmosphereLayer";
import { CharacterCard, type CharacterVisual } from "./CharacterCard";
import { SectionTitle } from "./SectionTitle";
import { useLocale } from "@/components/providers/LocaleProvider";

export function CharactersSection() {
  const { dict } = useLocale();

  return (
    <section id="characters" className="section-pad section-abyss scroll-mt-14">
      <AtmosphereLayer />
      <AnimatedInView>
        <SectionTitle subtitle={dict.characters.subtitle}>
          {dict.characters.title}
        </SectionTitle>
      </AnimatedInView>

      <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6">
        {dict.characters.list.map((character, index) => (
          <AnimatedInView
            key={character.name}
            delay={0.1 + index * 0.08}
            variant={index % 2 === 1 ? "slideLeft" : "fadeUp"}
          >
            <CharacterCard
              {...character}
              visual={character.visual as CharacterVisual}
            />
          </AnimatedInView>
        ))}
      </div>
    </section>
  );
}
