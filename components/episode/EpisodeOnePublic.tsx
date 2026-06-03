"use client";

import Link from "next/link";
import { EpisodeWatchBlock } from "@/components/EpisodeWatchBlock";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";

export function EpisodeOnePublic() {
  const { locale, dict } = useLocale();
  const e = dict.episodeOnePublic;

  return (
    <>
      <p className="text-ivory/70">{e.lead}</p>
      <EpisodeWatchBlock
        className="mt-8"
        title={`${dict.common.siteName} ${e.watchTitle}`}
      />
      <section className="mt-12 border-t border-glow/20 pt-8">
        <h2 className="anime-heading font-display text-xl text-lily">
          {e.relatedHeading}
        </h2>
        <ul className="mt-4 space-y-2">
          <li>
            <Link
              href={localePath(locale, "/process")}
              className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
            >
              {e.processLink}
            </Link>
          </li>
          <li>
            <Link
              href={localePath(locale, "/vision")}
              className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
            >
              {e.visionLink}
            </Link>
          </li>
          <li>
            <Link
              href={localePath(locale, "/press")}
              className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
            >
              {e.pressLink}
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
