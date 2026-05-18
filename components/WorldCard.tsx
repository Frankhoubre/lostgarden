import Image from "next/image";
import { WORLD_IMAGES } from "@/lib/world-images";

export type WorldVisual =
  | "blue-forest"
  | "mirror-waters"
  | "white-lily-hill"
  | "sleeping-machine-fields"
  | "last-garden";

type WorldCardProps = {
  title: string;
  description: string;
  visual: WorldVisual;
  mysterious?: boolean;
};

export function WorldCard({
  title,
  description,
  visual,
  mysterious = false,
}: WorldCardProps) {
  const imageSrc = WORLD_IMAGES[visual];

  return (
    <article
      className={`world-card glass-card group flex h-full flex-col overflow-hidden transition-transform duration-500 ease-out hover:-translate-y-1 ${mysterious ? "world-card--mysterious" : ""}`}
    >
      <div className="relative h-44 shrink-0 overflow-hidden sm:h-48">
        {imageSrc ? (
          <>
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06162f] via-[#06162f]/35 to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-glow/15"
              aria-hidden="true"
            />
          </>
        ) : (
          <div
            className={`world-visual world-visual--${visual} relative h-full w-full`}
            aria-hidden="true"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="anime-heading font-display text-xl text-lily transition-colors group-hover:text-magic">
          {title}
        </h3>
        <p className="mt-3 font-body text-sm leading-relaxed text-sol-ivory/80">
          {description}
        </p>
      </div>
    </article>
  );
}
