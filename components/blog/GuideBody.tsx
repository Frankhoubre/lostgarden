import Link from "next/link";
import type { ArticleLink } from "@/lib/ai-anime-article";
import type { Guide } from "@/lib/guide-article";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { ProcessFaq } from "@/components/process/ProcessFaq";
import { VisionArticle } from "@/components/vision/VisionArticle";
import { ArticleHero } from "@/components/blog/ArticleHero";
import { EpisodeWatchBlock } from "@/components/EpisodeWatchBlock";
import type { ArticleImage } from "@/lib/article-media";

const linkClass =
  "font-body text-cyan-pale/90 underline-offset-4 transition hover:text-magic hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 rounded-sm";

function GuideLink({ link, locale }: { link: ArticleLink; locale: Locale }) {
  if (link.href.startsWith("http")) {
    return (
      <a href={link.href} target="_blank" rel="noopener" className={linkClass}>
        {link.label}
      </a>
    );
  }
  return (
    <Link href={localePath(locale, link.href)} className={linkClass}>
      {link.label}
    </Link>
  );
}

type GuideBodyProps = {
  guide: Guide;
  locale: Locale;
  siteName: string;
  faqHeading: string;
  relatedHeading: string;
  hero?: { image: ArticleImage; alt: string };
  episode?: { heading: string; embedTitle: string };
};

export function GuideBody({
  guide,
  locale,
  siteName,
  faqHeading,
  relatedHeading,
  hero,
  episode,
}: GuideBodyProps) {
  return (
    <>
      {hero ? <ArticleHero image={hero.image} alt={hero.alt} /> : null}
      <VisionArticle article={guide.article} siteName={siteName} />
      {episode ? (
        <section className="mt-12 border-t border-glow/20 pt-8">
          <h2 className="anime-heading font-display text-xl text-lily sm:text-2xl">
            {episode.heading}
          </h2>
          <EpisodeWatchBlock className="mt-6" title={episode.embedTitle} compact />
        </section>
      ) : null}
      <ProcessFaq heading={faqHeading} items={guide.faq} />
      <section className="mt-12 border-t border-glow/20 pt-8">
        <h2 className="anime-heading font-display text-xl text-lily">
          {relatedHeading}
        </h2>
        <ul className="mt-4 space-y-2">
          {guide.related.map((link) => (
            <li key={link.href}>
              <GuideLink link={link} locale={locale} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
