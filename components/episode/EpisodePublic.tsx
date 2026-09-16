"use client";

import Link from "next/link";
import { EpisodeWatchBlock } from "@/components/EpisodeWatchBlock";
import { useLocale } from "@/components/providers/LocaleProvider";
import { episodePageCopy, otherEpisode, type Episode } from "@/lib/episode";
import { localePath } from "@/lib/i18n/navigation";

type EpisodePublicProps = {
  episode: Episode;
};

export function EpisodePublic({ episode }: EpisodePublicProps) {
  const { locale, dict } = useLocale();
  const e = episodePageCopy(dict, episode);
  const other = otherEpisode(episode);

  const relatedLinks = [
    { href: localePath(locale, other.pathSuffix), label: e.otherEpisodeLink },
    { href: localePath(locale, "/process"), label: e.processLink },
    { href: localePath(locale, "/vision"), label: e.visionLink },
    { href: localePath(locale, "/press"), label: e.pressLink },
  ];

  return (
    <>
      <p className="text-ivory/70">{e.lead}</p>
      <EpisodeWatchBlock className="mt-8" episode={episode} />
      <section className="mt-12 border-t border-glow/20 pt-8">
        <h2 className="anime-heading font-display text-xl text-lily">
          {e.relatedHeading}
        </h2>
        <ul className="mt-4 space-y-2">
          {relatedLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
