import { AnimatedInView } from "./AnimatedInView";
import { SectionTitle } from "./SectionTitle";

const cards = [
  {
    title: "The Blue Forest",
    visual: "blue-forest" as const,
    description: "Roots drink the dark. Mushrooms keep the silence lit.",
  },
  {
    title: "The Hollow Armor",
    visual: "hollow-armor" as const,
    description: "Metal shaped like duty. A lantern where a face should be.",
  },
  {
    title: "The Last Garden",
    visual: "last-garden" as const,
    description: "White lilies in stone. A place the world still remembers.",
  },
];

export function WorldSection() {
  return (
    <section id="world" className="section-pad">
      <AnimatedInView>
        <SectionTitle>A world beneath the world</SectionTitle>
      </AnimatedInView>

      <AnimatedInView className="mx-auto mt-10 max-w-2xl" delay={0.1}>
        <p className="text-center font-body text-lg leading-relaxed text-ivory/70 italic sm:text-xl">
          &ldquo;Far below the dead surface, a blue forest still breathes. Rivers
          run through stone. White lilies grow where nothing should survive. And
          somewhere in the mist, an empty armor wakes.&rdquo;
        </p>
      </AnimatedInView>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <AnimatedInView key={card.title} delay={0.15 + index * 0.1}>
            <article className="glass-card group flex h-full flex-col overflow-hidden">
              <div
                className={`card-visual card-visual--${card.visual} relative h-44 shrink-0`}
                aria-hidden="true"
              />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl tracking-[0.08em] text-lily">
                  {card.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-ivory/60">
                  {card.description}
                </p>
              </div>
            </article>
          </AnimatedInView>
        ))}
      </div>
    </section>
  );
}
