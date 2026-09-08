import Link from "next/link";
import type { AiAnimeArticle, ArticleLink } from "@/lib/ai-anime-article";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { VisionBlock } from "@/components/vision/VisionArticle";
import { ArticleHero } from "@/components/blog/ArticleHero";
import { LiteYouTube } from "@/components/blog/LiteYouTube";
import type { ArticleImage } from "@/lib/article-media";

const linkClass =
  "font-body text-cyan-pale/90 underline-offset-4 transition hover:text-magic hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 rounded-sm";

function isExternal(href: string) {
  return href.startsWith("http");
}

function ArticleAnchor({ link, locale }: { link: ArticleLink; locale: Locale }) {
  if (isExternal(link.href)) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener"
        className={linkClass}
      >
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

type AiAnimeArticleBodyProps = {
  article: AiAnimeArticle;
  locale: Locale;
  siteName: string;
  hero?: { image: ArticleImage; alt: string };
  playLabel: string;
};

export function AiAnimeArticleBody({
  article,
  locale,
  siteName,
  hero,
  playLabel,
}: AiAnimeArticleBodyProps) {
  return (
    <>
      {hero ? <ArticleHero image={hero.image} alt={hero.alt} /> : null}
      <p className="font-display text-lg text-cyan-pale/90 sm:text-xl">
        {siteName}
      </p>
      <p className="mt-2 text-ivory/60">
        {article.updatedLabel} · {article.byline}
      </p>

      <p className="rounded-md border border-glow/30 bg-glow/5 p-4 font-body text-base leading-relaxed text-ivory/90 sm:text-lg">
        {article.lead}
      </p>

      {article.intro.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      <p className="border-l-2 border-glow/40 py-1 pl-5 text-sm text-ivory/60">
        {article.disclosure}
      </p>

      <section>
        <h2 className="anime-heading font-display text-xl text-lily sm:text-2xl">
          {article.method.heading}
        </h2>
        <div className="mt-3 space-y-3">
          {article.method.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ul className="list-disc space-y-2 pl-5 text-ivory/80">
            {article.method.list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="anime-heading font-display text-2xl text-lily sm:text-3xl">
          {article.rankingHeading}
        </h2>

        <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-y border-glow/20 py-4 text-sm">
          {article.entries.map((entry) => (
            <li key={entry.rank}>
              <a href={`#rank-${entry.rank}`} className={linkClass}>
                {entry.rank}. {entry.title}
              </a>
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-12">
          {article.entries.map((entry) => (
            <article key={entry.rank} id={`rank-${entry.rank}`} className="scroll-mt-24">
              <h3 className="anime-heading font-display text-xl text-lily sm:text-2xl">
                <span className="text-cyan-pale/70">{entry.rank}.</span>{" "}
                {entry.title}
              </h3>
              <p className="mt-1 font-body text-xs uppercase tracking-wider text-ivory/45 sm:text-sm">
                {entry.meta}
              </p>
              {entry.youtubeId ? (
                <LiteYouTube
                  youtubeId={entry.youtubeId}
                  title={entry.title}
                  playLabel={playLabel}
                  className="mt-4"
                />
              ) : null}
              <p className="mt-3 font-display text-base font-medium text-cyan-pale/95 sm:text-lg">
                {entry.verdict}
              </p>
              <div className="mt-3 space-y-3">
                {entry.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-4 border-l-2 border-glow/40 py-1 pl-5 text-ivory/75">
                <span className="font-display font-semibold text-cyan-pale/95">
                  {entry.aiRoleLabel}.
                </span>{" "}
                {entry.aiRole}
              </p>
              {entry.links ? (
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {entry.links.map((link) => (
                    <li key={link.href}>
                      <ArticleAnchor link={link} locale={locale} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {article.sections.map((section, index) => (
        <VisionBlock key={section.heading ?? `section-${index}`} section={section} />
      ))}

      <section>
        <h2 className="anime-heading font-display text-xl text-lily sm:text-2xl">
          {article.productionHeading}
        </h2>
        <div className="mt-3 space-y-3">
          {article.productionParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {article.productionLinks.map((link) => (
              <li key={link.href}>
                <ArticleAnchor link={link} locale={locale} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="anime-heading font-display text-xl text-lily sm:text-2xl">
          {article.faqHeading}
        </h2>
        <dl className="mt-6 space-y-8">
          {article.faq.map((item) => (
            <div key={item.question}>
              <dt className="font-display text-base font-semibold text-cyan-pale/95 sm:text-lg">
                {item.question}
              </dt>
              <dd className="mt-2 text-ivory/80">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="anime-heading font-display text-xl text-lily sm:text-2xl">
          {article.sourcesHeading}
        </h2>
        <p className="mt-3 text-ivory/70">{article.sourcesNote}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {article.sources.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener nofollow"
                className={linkClass}
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-glow/20 pt-8">
        <h2 className="anime-heading font-display text-xl text-lily">
          {article.relatedHeading}
        </h2>
        <ul className="mt-4 space-y-2">
          {article.relatedLinks.map((link) => (
            <li key={link.href}>
              <ArticleAnchor link={link} locale={locale} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
