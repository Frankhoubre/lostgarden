import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import { localePath } from "@/lib/i18n/navigation";

type ProcessRelatedLinksProps = {
  locale: Locale;
  dict: Dictionary;
};

export function ProcessRelatedLinks({ locale, dict }: ProcessRelatedLinksProps) {
  const links = [
    { href: localePath(locale, "/vision"), label: dict.process.links.vision },
    { href: localePath(locale, "/episode-1"), label: dict.process.links.episode },
    { href: localePath(locale, "/press"), label: dict.process.links.press },
  ] as const;

  return (
    <section className="mt-12 border-t border-glow/20 pt-8">
      <h2 className="anime-heading font-display text-xl text-lily">
        {dict.process.relatedHeading}
      </h2>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-body text-cyan-pale/90 underline-offset-4 transition hover:text-magic hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
