import Image from "next/image";
import {
  CHARACTER_IMAGE_FOCUS,
  CHARACTER_IMAGES,
} from "@/lib/character-images";

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
  traitsAria: string;
};

export function CharacterCard({
  name,
  type,
  tagline,
  description,
  traits,
  visual,
  traitsAria,
}: CharacterCardProps) {
  const imageSrc = CHARACTER_IMAGES[visual];
  const imageFocus = CHARACTER_IMAGE_FOCUS[visual] ?? "center";

  return (
    <article className="character-card glass-card group flex h-full flex-col overflow-hidden transition-transform duration-500 ease-out hover:-translate-y-1">
      <div className="relative h-52 shrink-0 overflow-hidden sm:h-56">
        {imageSrc ? (
          <>
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              style={{ objectPosition: imageFocus }}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06162f] via-[#06162f]/40 to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-glow/15"
              aria-hidden="true"
            />
          </>
        ) : (
          <div
            className={`character-visual character-visual--${visual} relative h-full w-full`}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <span className="anime-label character-type-badge w-fit rounded-md border-2 border-glow/35 bg-cavern/80 px-3 py-1 font-display text-[0.7rem] text-soft-glow">
          {type}
        </span>
        <h3 className="anime-heading mt-4 font-display text-2xl text-lily">
          {name}
        </h3>
        <p className="mt-2 font-body text-sm font-bold leading-relaxed text-magic">
          {tagline}
        </p>
        <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-sol-ivory/80">
          {description}
        </p>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label={traitsAria}>
          {traits.map((trait) => (
            <li key={trait}>
              <span className="character-trait-tag inline-block rounded-md border-2 border-glow/20 bg-shadow/60 px-2.5 py-1 font-body text-[0.75rem] font-medium text-ivory/75 transition-colors group-hover:border-glow/40 group-hover:text-lily">
                {trait}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
