import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import { LEGAL_PUBLISHER } from "@/lib/legal";
import { localePath } from "@/lib/i18n/navigation";
import { SOCIAL_LINKS } from "@/lib/social";
import { EPISODE_ONE } from "@/lib/episode";

type PressKitProps = {
  locale: Locale;
  dict: Dictionary;
};

export function PressKit({ locale, dict }: PressKitProps) {
  const p = dict.press;

  return (
    <>
      <p className="text-ivory/70">{p.lead}</p>

      <section>
        <h2 className="anime-heading font-display text-xl text-lily">
          {p.pitchHeading}
        </h2>
        <p className="mt-3">{p.pitch}</p>
      </section>

      <section>
        <h2 className="anime-heading font-display text-xl text-lily">
          {p.factsHeading}
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ivory/80">
          {p.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="anime-heading font-display text-xl text-lily">
          {p.linksHeading}
        </h2>
        <ul className="mt-3 space-y-2">
          <li>
            <Link
              href={localePath(locale, "/process")}
              className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
            >
              {p.linkProcess}
            </Link>
          </li>
          <li>
            <Link
              href={localePath(locale, "/vision")}
              className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
            >
              {p.linkVision}
            </Link>
          </li>
          <li>
            <Link
              href={localePath(locale, "/episode-1")}
              className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
            >
              {p.linkEpisode}
            </Link>
          </li>
          <li>
            <a
              href={EPISODE_ONE.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
            >
              {p.linkYoutube}
            </a>
          </li>
          <li>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
            >
              Instagram
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="anime-heading font-display text-xl text-lily">
          {p.contactHeading}
        </h2>
        <p className="mt-3">
          <a
            href={`mailto:${LEGAL_PUBLISHER.email}`}
            className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
          >
            {LEGAL_PUBLISHER.email}
          </a>
        </p>
        <p className="mt-3 text-ivory/60">{p.contactNote}</p>
      </section>
    </>
  );
}
