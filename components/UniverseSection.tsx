import { AnimatedInView } from "./AnimatedInView";
import { SectionTitle } from "./SectionTitle";

const places = [
  {
    name: "Blue Forest",
    line: "Canopies of blue light beneath a ceiling of stone.",
  },
  {
    name: "Mirror Water",
    line: "Underground rivers that reflect what the surface forgot.",
  },
  {
    name: "White Lily Hill",
    line: "Pale flowers on a slope where breath still lingers.",
  },
  {
    name: "The Sleeping Machines",
    line: "Ancient organic giants, rusted, moss-covered, dreaming.",
  },
  {
    name: "The Last Garden",
    line: "A fragile sanctuary where the world might begin again.",
  },
];

export function UniverseSection() {
  return (
    <section id="universe" className="section-pad">
      <AnimatedInView>
        <SectionTitle>Beneath the surface</SectionTitle>
      </AnimatedInView>

      <ol className="mx-auto mt-16 max-w-3xl">
        {places.map((place, index) => (
          <AnimatedInView key={place.name} delay={index * 0.08}>
            <li className="universe-item group">
              <span className="universe-index font-display text-sm text-glow/50">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 border-l border-glow/10 pl-6 sm:pl-8">
                <h3 className="font-display text-xl tracking-[0.1em] text-lily transition-colors group-hover:text-magic">
                  {place.name}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-ivory/55 sm:text-base">
                  {place.line}
                </p>
              </div>
            </li>
          </AnimatedInView>
        ))}
      </ol>
    </section>
  );
}
