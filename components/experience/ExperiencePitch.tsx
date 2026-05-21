"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

type ExperiencePitchProps = {
  className?: string;
};

export function ExperiencePitch({ className = "" }: ExperiencePitchProps) {
  const { dict } = useLocale();

  return (
    <ul
      className={`mx-auto max-w-md space-y-4 text-left ${className}`.trim()}
      aria-label={dict.discover.pitchAria}
    >
      {dict.discover.pitch.map((item) => (
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
