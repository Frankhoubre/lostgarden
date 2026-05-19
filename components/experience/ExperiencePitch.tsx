import { EXPERIENCE_COPY } from "@/lib/experience-copy";

type ExperiencePitchProps = {
  className?: string;
};

export function ExperiencePitch({ className = "" }: ExperiencePitchProps) {
  return (
    <ul
      className={`mx-auto max-w-md space-y-4 text-left ${className}`.trim()}
      aria-label="What you get by joining"
    >
      {EXPERIENCE_COPY.pitch.map((item) => (
        <li
          key={item.title}
          className="rounded-lg border border-glow/12 bg-cavern/35 px-4 py-3 backdrop-blur-sm"
        >
          <p className="font-display text-sm font-semibold tracking-wide text-lily">
            {item.title}
          </p>
          <p className="mt-1.5 font-body text-sm leading-relaxed text-ivory/70">
            {item.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
