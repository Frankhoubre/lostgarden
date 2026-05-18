export type CreatureIcon =
  | "centipede"
  | "mushroom"
  | "lily"
  | "deer"
  | "glider"
  | "gong";

type CreatureCardProps = {
  name: string;
  description: string;
  icon: CreatureIcon;
};

export function CreatureCard({ name, description, icon }: CreatureCardProps) {
  return (
    <article className="creature-card glass-card group p-5 transition-transform duration-500 ease-out hover:-translate-y-0.5 sm:p-6">
      <div
        className={`creature-icon creature-icon--${icon}`}
        aria-hidden="true"
      />
      <h3 className="anime-heading mt-4 font-display text-base text-lily sm:text-lg">
        {name}
      </h3>
      <p className="mt-2 font-body text-sm leading-relaxed text-sol-ivory/80">
        {description}
      </p>
    </article>
  );
}
