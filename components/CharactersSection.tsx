import { AnimatedInView } from "./AnimatedInView";

const characters = [
  {
    name: "Sol",
    visual: "sol" as const,
    text: "An empty armor with a lantern-shaped head. No face. No body. No voice. Only hollow metallic sounds, forgotten gestures, and a duty he does not understand.",
  },
  {
    name: "Rose",
    visual: "rose" as const,
    text: "A quiet child with the power to wake life beneath the ashes. She is not a weapon. Not a miracle to spend. Just a child who should have been protected.",
  },
];

export function CharactersSection() {
  return (
    <section id="characters" className="section-pad">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        {characters.map((character, index) => (
          <AnimatedInView key={character.name} delay={index * 0.12}>
            <article className="glass-card overflow-hidden">
              <div
                className={`character-visual character-visual--${character.visual} h-52`}
                aria-hidden="true"
              />
              <div className="p-8">
                <h3 className="font-display text-2xl tracking-[0.12em] text-lily">
                  {character.name}
                </h3>
                <p className="mt-4 font-body text-base leading-relaxed text-ivory/65">
                  {character.text}
                </p>
              </div>
            </article>
          </AnimatedInView>
        ))}
      </div>

      <AnimatedInView className="mx-auto mt-14 max-w-2xl" delay={0.2}>
        <p className="text-center font-display text-lg italic leading-relaxed tracking-wide text-magic/90 sm:text-xl">
          &ldquo;He was made to bring her to the Garden. He may become the only
          one who refuses.&rdquo;
        </p>
      </AnimatedInView>
    </section>
  );
}
