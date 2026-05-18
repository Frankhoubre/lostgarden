import Image from "next/image";

export type VisualIdentityVariant =
  | "blue-mist"
  | "white-lilies"
  | "hollow-metal"
  | "sleeping-machines";

const IDENTITY_IMAGES: Partial<Record<VisualIdentityVariant, string>> = {
  "blue-mist": "/images/blue-forest.png",
  "sleeping-machines": "/images/sleeping-machines.png",
};

type VisualIdentityCardProps = {
  title: string;
  variant: VisualIdentityVariant;
};

export function VisualIdentityCard({ title, variant }: VisualIdentityCardProps) {
  const imageSrc = IDENTITY_IMAGES[variant];

  return (
    <article className="visual-identity-card glass-card group overflow-hidden transition-transform duration-500 ease-out hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden sm:h-52">
        {imageSrc ? (
          <>
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06162f]/80 to-transparent"
              aria-hidden="true"
            />
          </>
        ) : (
          <div
            className={`visual-identity-art visual-identity-art--${variant} h-full`}
            aria-hidden="true"
          />
        )}
      </div>
      <p className="anime-heading p-5 text-center font-display text-sm text-lily sm:text-base">
        {title}
      </p>
    </article>
  );
}
