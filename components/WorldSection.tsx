import { AnimatedInView } from "./AnimatedInView";
import { AtmosphereLayer } from "./AtmosphereLayer";
import { SectionTitle } from "./SectionTitle";
import { WorldCard } from "./WorldCard";

const places = [
  {
    title: "The Blue Forest",
    description:
      "A dense underground forest with no sky, filled with glowing mushrooms, giant roots, pale flowers, and blue mist.",
    visual: "blue-forest" as const,
  },
  {
    title: "The Mirror Waters",
    description:
      "Silent underground rivers and pools reflecting lights that do not come from the sun.",
    visual: "mirror-waters" as const,
  },
  {
    title: "The White Lily Hill",
    description:
      "A dreamlike place that appears like a memory, covered in white lilies and impossible wind.",
    visual: "white-lily-hill" as const,
  },
  {
    title: "The Sleeping Machine Fields",
    description:
      "Ancient alien bodies half-buried beneath moss, roots, and luminous fungi.",
    visual: "sleeping-machine-fields" as const,
  },
  {
    title: "The Last Garden",
    description:
      "A place whispered about in the deepest caverns. No one describes it the same way twice.",
    visual: "last-garden" as const,
    mysterious: true,
  },
];

export function WorldSection() {
  return (
    <section id="world" className="section-pad section-misty scroll-mt-14">
      <AtmosphereLayer />
      <AnimatedInView>
        <SectionTitle subtitle="A buried world of blue forests, broken sanctuaries, sleeping machines, and impossible gardens.">
          The World Beneath
        </SectionTitle>
      </AnimatedInView>

      <AnimatedInView className="mx-auto mt-10 max-w-2xl" delay={0.08}>
        <p className="text-center font-body text-base font-medium leading-relaxed text-sol-ivory/85 sm:text-lg">
          The deeper you go, the more the world listens.
        </p>
      </AnimatedInView>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place, index) => (
          <AnimatedInView key={place.title} delay={0.12 + index * 0.07}>
            <WorldCard {...place} />
          </AnimatedInView>
        ))}
      </div>
    </section>
  );
}
