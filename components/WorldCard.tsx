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
  return (
    <article
      className={`world-card glass-card group flex h-full flex-col overflow-hidden transition-transform duration-500 ease-out hover:-translate-y-1 ${mysterious ? "world-card--mysterious" : ""}`}
    >
      <div
        className={`world-visual world-visual--${visual} relative h-40 shrink-0 sm:h-44`}
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl tracking-[0.08em] text-lily transition-colors group-hover:text-magic">
          {title}
        </h3>
        <p className="mt-3 font-body text-sm leading-relaxed text-sol-ivory/60">
          {description}
        </p>
      </div>
    </article>
  );
}
