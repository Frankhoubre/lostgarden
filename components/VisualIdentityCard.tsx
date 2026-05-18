export type VisualIdentityVariant =
  | "blue-mist"
  | "white-lilies"
  | "hollow-metal"
  | "sleeping-machines";

type VisualIdentityCardProps = {
  title: string;
  variant: VisualIdentityVariant;
};

export function VisualIdentityCard({ title, variant }: VisualIdentityCardProps) {
  return (
    <article className="visual-identity-card glass-card group overflow-hidden transition-transform duration-500 ease-out hover:-translate-y-1">
      <div
        className={`visual-identity-art visual-identity-art--${variant}`}
        aria-hidden="true"
      />
      <p className="p-5 text-center font-display text-sm tracking-[0.14em] text-lily sm:text-base">
        {title}
      </p>
    </article>
  );
}
