import { AnimatedInView } from "./AnimatedInView";
import { EpisodeTimeline } from "./EpisodeTimeline";
import { SectionTitle } from "./SectionTitle";

const timelineSteps = [
  {
    title: "The Oath",
    line: "Words spoken where no one listens.",
  },
  {
    title: "The Awakening",
    line: "Metal opens its eyes without a face.",
  },
  {
    title: "The Blue Forest",
    line: "Mushrooms lit paths no sun ever touched.",
  },
  {
    title: "The Eye in the Dark",
    line: "A giant remembers it is awake.",
  },
  {
    title: "The Child in the Lilies",
    line: "White petals find her in the mist.",
  },
];

export function EpisodeSection() {
  return (
    <section id="episode-one" className="section-pad scroll-mt-14">
      <AnimatedInView>
        <SectionTitle>Episode One — The Hollow Knight Wakes</SectionTitle>
      </AnimatedInView>

      <AnimatedInView className="mx-auto mt-10 max-w-2xl" delay={0.1}>
        <p className="text-center font-body text-base leading-relaxed text-sol-ivory/65 sm:text-lg">
          In the depths of an ancient cavern, an empty armor opens its eyes
          without a face. Above him, the world is blue, silent, and alive in
          ways it should not be. Somewhere in the mist, a child is waiting.
        </p>
      </AnimatedInView>

      <AnimatedInView delay={0.15}>
        <EpisodeTimeline steps={timelineSteps} />
      </AnimatedInView>
    </section>
  );
}
