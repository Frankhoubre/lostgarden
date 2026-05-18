import { AnimatedInView } from "./AnimatedInView";
import { SectionTitle } from "./SectionTitle";
import { VisualIdentityCard } from "./VisualIdentityCard";

const identityCards = [
  { title: "Blue mist", variant: "blue-mist" as const },
  { title: "White lilies", variant: "white-lilies" as const },
  { title: "Hollow metal", variant: "hollow-metal" as const },
  { title: "Sleeping machines", variant: "sleeping-machines" as const },
];

export function VisualIdentitySection() {
  return (
    <section id="visual-identity" className="section-pad scroll-mt-14">
      <AnimatedInView>
        <SectionTitle>Visual Identity</SectionTitle>
      </AnimatedInView>

      <AnimatedInView className="mx-auto mt-10 max-w-2xl" delay={0.08}>
        <p className="text-center font-body text-base font-medium leading-relaxed text-sol-ivory/85 sm:text-lg">
          Lost Garden uses simple anime color treatment, muted blue palettes,
          soft cel-shading, readable silhouettes, and dreamlike underground
          environments.
        </p>
      </AnimatedInView>

      <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2">
        {identityCards.map((card, index) => (
          <AnimatedInView key={card.title} delay={0.1 + index * 0.08}>
            <VisualIdentityCard {...card} />
          </AnimatedInView>
        ))}
      </div>
    </section>
  );
}
