import { AnimatedInView } from "./AnimatedInView";
import { SectionTitle } from "./SectionTitle";
import { WaitlistForm } from "./WaitlistForm";

export function WaitlistSection() {
  return (
    <section id="waitlist" className="section-pad">
      <AnimatedInView>
        <SectionTitle
          subtitle="Join the waitlist to receive early visuals, episode updates, and the first trailer release."
        >
          Enter the Garden first.
        </SectionTitle>
      </AnimatedInView>

      <AnimatedInView className="mt-12" delay={0.15}>
        <WaitlistForm />
      </AnimatedInView>
    </section>
  );
}
