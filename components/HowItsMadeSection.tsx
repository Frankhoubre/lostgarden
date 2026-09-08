import Image from "next/image";
import Link from "next/link";
import { SectionTitle } from "@/components/SectionTitle";
import { HOME_ARTICLES } from "@/lib/articles";
import { ARTICLES } from "@/lib/articles";
import { getArticleMedia } from "@/lib/article-media";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import type { Dictionary } from "@/lib/i18n/types";

type HowItsMadeSectionProps = {
  locale: Locale;
  dict: Dictionary;
};

/**
 * Four articles on the home page, so the page that carries the most
 * authority links straight into the pages that have to rank.
 */
export function HowItsMadeSection({ locale, dict }: HowItsMadeSectionProps) {
  const entries = HOME_ARTICLES.map((path) => ARTICLES.find((a) => a.path === path)).filter(
    (entry): entry is (typeof ARTICLES)[number] => Boolean(entry),
  );

  return (
    <section id="articles" className="section-pad scroll-mt-14">
      <SectionTitle subtitle={dict.homeArticles.subtitle}>{dict.homeArticles.title}</SectionTitle>

      <ul className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2">
        {entries.map((entry) => {
          const media = getArticleMedia(entry.path);
          const meta = dict.meta[entry.meta];
          const href = localePath(locale, entry.path);
          return (
            <li key={entry.path} className="glass-card overflow-hidden rounded-2xl">
              <Link href={href} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60">
                {media ? (
                  <Image
                    src={media.imageData.src}
                    alt=""
                    width={media.imageData.width}
                    height={media.imageData.height}
                    sizes="(max-width: 640px) 100vw, 480px"
                    className="aspect-video w-full object-cover transition group-hover:opacity-90"
                  />
                ) : null}
                <div className="p-5">
                  <h3 className="anime-heading font-display text-lg text-lily transition group-hover:text-magic sm:text-xl">
                    {meta.title}
                  </h3>
                  <p className="mt-2 font-body text-sm leading-relaxed text-ivory/75">{meta.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex justify-center">
        <Link href={localePath(locale, "/blog")} className="btn-secondary">
          {dict.homeArticles.all}
        </Link>
      </div>
    </section>
  );
}
