import { AnimatedInView } from "./AnimatedInView";
import { CreatureCard } from "./CreatureCard";
import { SectionTitle } from "./SectionTitle";

const creatures = [
  {
    name: "Transparent cave centipedes",
    description:
      "Tiny glass-like creatures crawl between the glowing mushrooms, carrying the silence of the caverns on their many legs.",
    icon: "centipede" as const,
  },
  {
    name: "Blue mushroom fields",
    description:
      "Whole slopes breathe in pale cyan, as if the forest floor learned how to glow without fire.",
    icon: "mushroom" as const,
  },
  {
    name: "White lily petals",
    description:
      "They drift through the mist like slow snow, finding the child before anyone else does.",
    icon: "lily" as const,
  },
  {
    name: "Stone deer guardians",
    description:
      "Two concrete heads at the cliffside station speak only when someone tries to pass.",
    icon: "deer" as const,
  },
  {
    name: "Paper gliders",
    description:
      "Fragile flying machines made of rope, gears, and paper wings, waiting at the edge of the abyss.",
    icon: "glider" as const,
  },
  {
    name: "The distant gong",
    description:
      "A single note travels through the caverns, and everyone knows the procession is near.",
    icon: "gong" as const,
  },
];

export function CreaturesSection() {
  return (
    <section id="creatures" className="section-pad scroll-mt-14">
      <AnimatedInView>
        <SectionTitle subtitle="Signs in the mist. Life that should not exist. Warnings the world forgot to speak aloud.">
          Creatures &amp; Signs
        </SectionTitle>
      </AnimatedInView>

      <div className="mx-auto mt-16 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creatures.map((creature, index) => (
          <AnimatedInView key={creature.name} delay={0.08 + index * 0.06}>
            <CreatureCard {...creature} />
          </AnimatedInView>
        ))}
      </div>
    </section>
  );
}
