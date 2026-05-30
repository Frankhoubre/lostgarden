import Image from "next/image";
import {
  KNIGHT_IMAGES,
  KNIGHT_IMAGE_FOCUS,
  KNIGHT_ROMAN,
  KNIGHT_VISUALS,
  type KnightNumber,
} from "@/lib/knights";

export type KnightCardContent =
  | {
      revealed: true;
      name: string;
      title: string;
      tagline: string;
      description: string;
      traits: string[];
    }
  | {
      revealed: false;
      hiddenTitle: string;
      hiddenTeaser: string;
      hiddenBadge: string;
    };

type KnightCardProps = {
  number: KnightNumber;
  content: KnightCardContent;
  traitsAria?: string;
};

export function KnightCard({ number, content, traitsAria }: KnightCardProps) {
  const imageSrc = KNIGHT_IMAGES[number];
  const imageFocus = KNIGHT_IMAGE_FOCUS[number] ?? "center";
  const visual = KNIGHT_VISUALS[number] ?? "hidden";

  return (
    <article
      className="knight-card glass-card group flex h-full w-full flex-col overflow-hidden"
      aria-labelledby={`knight-${number}-title`}
    >
      <div className="relative h-56 shrink-0 overflow-hidden sm:h-64">
        <span className="knight-number-badge anime-label absolute left-4 top-4 z-10 rounded-md border border-magic/40 bg-abyss/80 px-3 py-1 font-display text-xs tracking-[0.2em] text-lily">
          {KNIGHT_ROMAN[number]}
        </span>
        {content.revealed && imageSrc ? (
          <>
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              style={{ objectPosition: imageFocus }}
              sizes="(max-width: 768px) 90vw, 420px"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06162f] via-[#06162f]/45 to-transparent"
              aria-hidden="true"
            />
          </>
        ) : (
          <div
            className={`character-visual character-visual--${visual} relative h-full w-full`}
            {...(!content.revealed ? { "data-knight": KNIGHT_ROMAN[number] } : {})}
            aria-hidden="true"
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-glow/15"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        {content.revealed ? (
          <>
            <span className="anime-label character-type-badge w-fit rounded-md border-2 border-glow/35 bg-cavern/80 px-3 py-1 font-display text-[0.7rem] text-soft-glow">
              {content.title}
            </span>
            <h3
              id={`knight-${number}-title`}
              className="anime-heading mt-4 font-display text-2xl text-lily"
            >
              {content.name}
            </h3>
            <p className="mt-2 font-body text-sm font-bold leading-relaxed text-magic">
              {content.tagline}
            </p>
            <div className="knight-card-lore mt-4 min-h-0 max-h-52 flex-1 overflow-y-auto overscroll-contain pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
              <div className="space-y-3">
                {content.description.split("\n\n").map((paragraph, index) => (
                  <p
                    key={index}
                    className="font-body text-sm leading-relaxed text-sol-ivory/80"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            <ul className="mt-5 shrink-0 flex flex-wrap gap-2" aria-label={traitsAria}>
              {content.traits.map((trait) => (
                <li key={trait}>
                  <span className="character-trait-tag inline-block rounded-md border-2 border-glow/20 bg-shadow/60 px-2.5 py-1 font-body text-[0.75rem] font-medium text-ivory/75">
                    {trait}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <span className="anime-label w-fit rounded-md border border-glow/25 bg-cavern/60 px-3 py-1 font-display text-[0.65rem] tracking-[0.18em] text-cyan-pale/70">
              {content.hiddenBadge}
            </span>
            <h3
              id={`knight-${number}-title`}
              className="anime-heading mt-4 font-display text-2xl text-lily/90"
            >
              {content.hiddenTitle}
            </h3>
            <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-ivory/55">
              {content.hiddenTeaser}
            </p>
          </>
        )}
      </div>
    </article>
  );
}
