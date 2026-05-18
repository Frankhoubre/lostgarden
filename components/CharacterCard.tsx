export type CharacterVisual =
  | "sol"
  | "rose"
  | "machines"
  | "pilgrims";

type CharacterCardProps = {
  name: string;
  type: string;
  tagline: string;
  description: string;
  traits: string[];
  visual: CharacterVisual;
};

export function CharacterCard({
  name,
  type,
  tagline,
  description,
  traits,
  visual,
}: CharacterCardProps) {
  return (
    <article className="character-card glass-card group flex h-full flex-col overflow-hidden transition-transform duration-500 ease-out hover:-translate-y-1">
      <div
        className={`character-visual character-visual--${visual} relative h-48 shrink-0 sm:h-52`}
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <span className="character-type-badge w-fit rounded-full border border-glow/20 bg-cavern/60 px-3 py-1 font-body text-[0.65rem] font-medium uppercase tracking-[0.18em] text-soft-glow/90">
          {type}
        </span>
        <h3 className="mt-4 font-display text-2xl tracking-[0.1em] text-lily">
          {name}
        </h3>
        <p className="mt-2 font-body text-sm italic leading-relaxed text-magic/85">
          {tagline}
        </p>
        <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-sol-ivory/60">
          {description}
        </p>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${name} traits`}>
          {traits.map((trait) => (
            <li key={trait}>
              <span className="character-trait-tag inline-block rounded-md border border-glow/10 bg-shadow/50 px-2.5 py-1 font-body text-[0.7rem] tracking-wide text-ivory/55 transition-colors group-hover:border-glow/25 group-hover:text-ivory/75">
                {trait}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
