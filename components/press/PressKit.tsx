"use client";

import Image from "next/image";
import { AnimatedInView } from "@/components/AnimatedInView";
import { PressGallery } from "@/components/press/PressGallery";
import { SectionTitle } from "@/components/SectionTitle";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import { localePath } from "@/lib/i18n/navigation";
import {
  PRESS_ASSET_FILES,
  PRESS_KIT,
  PRESS_EPISODE_STILL,
  PRESS_SECTION_IDS,
  PRESS_SOCIAL,
  pressAssetFilename,
  pressAssetHref,
  type PressAssetId,
} from "@/lib/press";

type PressKitProps = {
  locale: Locale;
  dict: Dictionary;
};

function PressSection({
  id,
  className = "",
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`press-section section-pad ${className}`.trim()}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function PressKit({ locale, dict }: PressKitProps) {
  const p = dict.press;
  const contactMailto = `mailto:${PRESS_KIT.contactEmail}`;

  const navItems = [
    { id: PRESS_SECTION_IDS.story, label: p.nav.story },
    { id: PRESS_SECTION_IDS.facts, label: p.nav.facts },
    { id: PRESS_SECTION_IDS.episode, label: p.nav.episode },
    { id: PRESS_SECTION_IDS.watch, label: p.nav.watch },
    { id: PRESS_SECTION_IDS.audience, label: p.nav.audience },
    { id: PRESS_SECTION_IDS.release, label: p.nav.release },
    { id: PRESS_SECTION_IDS.creator, label: p.nav.creator },
    { id: PRESS_SECTION_IDS.assets, label: p.nav.assets },
    { id: PRESS_SECTION_IDS.gallery, label: p.nav.gallery },
    { id: PRESS_SECTION_IDS.quotes, label: p.nav.quotes },
    { id: PRESS_SECTION_IDS.contact, label: p.nav.contact },
  ];

  return (
    <>
      {/* Hero */}
      <section className="press-hero relative isolate min-h-[70svh] overflow-hidden sm:min-h-[88vh]">
        <div className="hero-scene absolute inset-0">
          <Image
            src={PRESS_KIT.heroImageUrl}
            alt=""
            fill
            priority
            unoptimized
            className="hero-reference-layer"
            sizes="100vw"
          />
          <div className="hero-reference-veil absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[70svh] max-w-6xl flex-col justify-end px-5 pb-12 pt-28 sm:min-h-[88vh] sm:px-6 sm:pb-20">
          <AnimatedInView>
            <p className="anime-label font-display text-[0.65rem] tracking-[0.2em] text-cyan-pale/75 sm:text-xs">
              {p.hero.badge}
            </p>
            <h1 className="anime-heading mt-4 font-display text-[clamp(2.75rem,1.5rem+6vw,4.5rem)] text-lily">
              {p.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl font-body text-lg font-medium leading-relaxed text-ivory/92 sm:text-xl">
              {p.hero.subtitle}
            </p>
            <p className="mt-5 max-w-3xl font-body text-base leading-relaxed text-ivory/80 sm:text-lg">
              {p.hero.lead}
            </p>
            <p className="mt-6 max-w-2xl border-l-2 border-glow/40 pl-4 font-body text-base italic leading-relaxed text-ivory/85 sm:text-lg">
              {p.hero.emotional}
            </p>

            <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {p.hero.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-glow/15 bg-abyss/35 px-3 py-4 text-center backdrop-blur-sm"
                >
                  <p className="anime-heading font-display text-xl text-lily sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 font-body text-[0.65rem] font-medium uppercase tracking-wide text-cyan-pale/65 sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={`#${PRESS_SECTION_IDS.watch}`} className="btn-primary btn-shimmer">
                {p.hero.ctaWatch}
              </a>
              <a
                href={PRESS_KIT.pressKitZipUrl}
                download="lost-garden-press-kit.zip"
                className="btn-secondary"
              >
                {p.hero.ctaDownload}
              </a>
              <a href={`#${PRESS_SECTION_IDS.contact}`} className="btn-secondary">
                {p.hero.ctaContact}
              </a>
            </div>
          </AnimatedInView>
        </div>
      </section>

      {/* In-page nav */}
      <nav
        className="press-anchor-nav sticky top-[57px] z-40 border-b border-glow/15 bg-abyss/90 backdrop-blur-md"
        aria-label={p.headline}
      >
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="press-anchor-link shrink-0 rounded-md px-3 py-2 font-display text-[0.65rem] font-semibold tracking-[0.1em] text-cyan-pale/70 transition hover:bg-cavern/70 hover:text-lily sm:text-xs"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Story angle */}
      <PressSection id={PRESS_SECTION_IDS.story} className="section-misty">
        <AnimatedInView>
          <SectionTitle subtitle={p.storyAngle.lead}>{p.storyAngle.title}</SectionTitle>
          <p className="mx-auto mt-6 max-w-3xl text-center font-body text-base leading-relaxed text-ivory/82 sm:text-lg">
            {p.storyAngle.body}
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {p.storyAngle.angles.map((angle) => (
              <article key={angle.title} className="glass-card p-6">
                <h3 className="anime-heading font-display text-lg text-lily">
                  {angle.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-ivory/85 sm:text-base">
                  {angle.text}
                </p>
              </article>
            ))}
          </div>
        </AnimatedInView>
      </PressSection>

      {/* Key facts */}
      <PressSection id={PRESS_SECTION_IDS.facts} className="section-abyss">
        <AnimatedInView>
          <SectionTitle>{p.keyFacts.title}</SectionTitle>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
            {p.keyFacts.items.map((item) => (
              <div
                key={`${item.highlight}-${item.label}`}
                className="press-fact-card rounded-xl border border-glow/20 bg-cave-night/55 p-5 text-center backdrop-blur-sm transition hover:border-glow/40"
              >
                <p className="anime-heading font-display text-2xl text-lily sm:text-3xl">
                  {item.highlight}
                </p>
                <p className="mt-2 font-body text-xs font-medium uppercase tracking-wide text-cyan-pale/70 sm:text-sm">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </AnimatedInView>
      </PressSection>

      {/* Episode */}
      <PressSection id={PRESS_SECTION_IDS.episode} className="section-misty">
        <AnimatedInView>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="anime-heading font-display text-2xl text-lily sm:text-3xl md:text-4xl">
                {p.episode.title}
              </h2>
              <div className="mt-6 space-y-4 font-body text-base leading-relaxed text-ivory/88 sm:text-lg">
                {p.episode.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8">
                <a href={`#${PRESS_SECTION_IDS.watch}`} className="btn-primary">
                  {p.episode.cta}
                </a>
              </div>
            </div>
            <div className="press-episode-visual relative aspect-[4/3] overflow-hidden rounded-2xl border border-glow/25 shadow-[0_0_60px_rgba(56,189,248,0.12)]">
              <Image
                src={PRESS_EPISODE_STILL}
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-abyss/70 via-transparent to-abyss/20" />
            </div>
          </div>
        </AnimatedInView>
      </PressSection>

      {/* Watch */}
      <PressSection id={PRESS_SECTION_IDS.watch} className="section-abyss">
        <AnimatedInView>
          <SectionTitle subtitle={p.watch.lead}>{p.watch.title}</SectionTitle>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2 lg:gap-10">
            <div>
              <p className="anime-label mb-3 font-display text-xs tracking-[0.16em] text-cyan-pale/70">
                {p.watch.youtubeLabel}
              </p>
              <div className="trailer-frame relative aspect-video w-full overflow-hidden rounded-2xl">
                <iframe
                  src={`${PRESS_KIT.episodeEmbedUrl}?rel=0`}
                  title={`${p.watch.title} · YouTube`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={PRESS_KIT.episodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-[0.75rem]"
                >
                  {p.watch.openYoutube}
                </a>
              </div>
            </div>

            <div>
              <p className="anime-label mb-3 font-display text-xs tracking-[0.16em] text-cyan-pale/70">
                {p.watch.tiktokLabel}
              </p>
              <div className="press-tiktok-frame trailer-frame relative w-full overflow-hidden rounded-2xl">
                <iframe
                  src={PRESS_KIT.tiktokEmbedUrl}
                  title={`${p.watch.title} · TikTok`}
                  allow="encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="press-tiktok-embed w-full border-0"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={PRESS_KIT.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-[0.75rem]"
                >
                  {p.watch.openTiktok}
                </a>
              </div>
            </div>
          </div>
        </AnimatedInView>
      </PressSection>

      {/* Audience reactions */}
      <PressSection id={PRESS_SECTION_IDS.audience} className="section-misty">
        <AnimatedInView>
          <SectionTitle subtitle={p.audience.intro}>{p.audience.title}</SectionTitle>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {p.audience.stats.map((stat) => (
              <div
                key={stat.label}
                className="press-audience-stat rounded-xl border border-glow/25 bg-cave-night/50 px-5 py-6 text-center backdrop-blur-sm"
              >
                <p className="anime-heading font-display text-3xl text-lily sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 font-body text-xs font-medium uppercase tracking-wide text-cyan-pale/70 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.audience.comments.map((comment) => (
              <blockquote
                key={comment.slice(0, 40)}
                className="press-audience-comment rounded-xl border border-glow/18 bg-abyss/40 p-5"
              >
                <p className="font-body text-sm leading-relaxed text-ivory/88">
                  &ldquo;{comment}&rdquo;
                </p>
              </blockquote>
            ))}
          </div>

          <p className="mt-8 text-center font-body text-xs text-ivory/45">
            {p.audience.source}
          </p>
        </AnimatedInView>
      </PressSection>

      {/* Press release */}
      <PressSection id={PRESS_SECTION_IDS.release} className="section-misty">
        <AnimatedInView>
          <SectionTitle>{p.pressRelease.title}</SectionTitle>
          <article className="press-release mx-auto mt-12 max-w-3xl rounded-2xl border border-glow/25 bg-cave-night/50 p-6 backdrop-blur-sm sm:p-10">
            <p className="anime-label font-display text-xs tracking-[0.18em] text-cyan-pale/70">
              {p.pressRelease.dateline}
            </p>
            <h3 className="anime-heading mt-4 font-display text-xl leading-snug text-lily sm:text-2xl">
              {p.pressRelease.headline}
            </h3>
            <div className="mt-8 space-y-5 font-body text-sm leading-relaxed text-ivory/88 sm:text-base">
              {p.pressRelease.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 space-y-6">
              {p.pressRelease.quotes.map((quote) => (
                <blockquote
                  key={quote.slice(0, 48)}
                  className="press-quote border-l-2 border-glow/50 pl-5 font-body text-base italic leading-relaxed text-ivory/92 sm:text-lg"
                >
                  &ldquo;{quote}&rdquo;
                  <footer className="mt-3 text-sm not-italic text-cyan-pale/75">
                    Frank Houbre
                  </footer>
                </blockquote>
              ))}
            </div>
          </article>
          <div className="mt-8 text-center">
            <a
              href={pressAssetHref(PRESS_ASSET_FILES.pressRelease, locale)}
              download={pressAssetFilename(PRESS_ASSET_FILES.pressRelease, locale)}
              className="btn-secondary"
            >
              {p.pressRelease.downloadCta}
            </a>
          </div>
        </AnimatedInView>
      </PressSection>

      {/* About Frank */}
      <PressSection id={PRESS_SECTION_IDS.creator} className="section-abyss">
        <AnimatedInView>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,280px)_1fr]">
            <div className="press-portrait relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden rounded-2xl border border-glow/25 bg-cave-night">
              <Image
                src={PRESS_KIT.portraitImageUrl}
                alt={p.aboutFrank.portraitAlt}
                fill
                unoptimized
                className="object-cover"
                sizes="280px"
              />
            </div>
            <div>
              <h2 className="anime-heading font-display text-3xl text-lily sm:text-4xl">
                {p.aboutFrank.title}
              </h2>
              <p className="mt-6 font-body text-base leading-relaxed text-ivory/88 sm:text-lg">
                {p.aboutFrank.bio}
              </p>
              <ul className="mt-8 space-y-2 font-body text-sm sm:text-base">
                <li>
                  <span className="text-cyan-pale/65">{p.aboutFrank.emailLabel}: </span>
                  <a
                    href={contactMailto}
                    className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
                  >
                    {PRESS_KIT.contactEmail}
                  </a>
                </li>
                <li>
                  <span className="text-cyan-pale/65">{p.social.instagram}: </span>
                  <a
                    href={PRESS_SOCIAL.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
                  >
                    @frank.houbre
                  </a>
                </li>
                <li>
                  <span className="text-cyan-pale/65">{p.social.youtube}: </span>
                  <a
                    href={PRESS_SOCIAL.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
                  >
                    @businessdynamite
                  </a>
                </li>
                <li>
                  <span className="text-cyan-pale/65">{p.social.tiktok}: </span>
                  <a
                    href={PRESS_SOCIAL.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-pale/90 underline-offset-4 hover:text-magic hover:underline"
                  >
                    @frankhoubre
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </AnimatedInView>
      </PressSection>

      {/* Assets */}
      <PressSection id={PRESS_SECTION_IDS.assets} className="section-misty">
        <AnimatedInView>
          <SectionTitle subtitle={p.assets.intro}>{p.assets.title}</SectionTitle>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.assets.items.map((asset) => {
              const file = PRESS_ASSET_FILES[asset.id as PressAssetId];
              const href = pressAssetHref(file, locale);
              const filename = pressAssetFilename(file, locale);
              return (
                <article key={asset.id} className="glass-card flex flex-col p-6">
                  <h3 className="anime-heading font-display text-lg text-lily">
                    {asset.title}
                  </h3>
                  <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-ivory/75">
                    {asset.description}
                  </p>
                  <a
                    href={href}
                    download={filename}
                    className="btn-secondary mt-6 w-full text-center text-[0.75rem]"
                  >
                    {p.assets.download}
                  </a>
                </article>
              );
            })}
          </div>
        </AnimatedInView>
      </PressSection>

      {/* Gallery */}
      <PressSection id={PRESS_SECTION_IDS.gallery} className="section-abyss">
        <AnimatedInView>
          <SectionTitle subtitle={p.gallery.intro}>{p.gallery.title}</SectionTitle>
          <div className="mt-12">
            <PressGallery dict={p.gallery} />
          </div>
        </AnimatedInView>
      </PressSection>

      {/* Quotes */}
      <PressSection id={PRESS_SECTION_IDS.quotes} className="section-misty">
        <AnimatedInView>
          <SectionTitle subtitle={p.quotes.intro}>{p.quotes.title}</SectionTitle>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {p.quotes.items.map((quote) => (
              <blockquote
                key={quote.slice(0, 40)}
                className="press-pull-quote rounded-xl border border-glow/20 bg-cave-night/45 p-6"
              >
                <p className="font-body text-base leading-relaxed text-ivory/90">
                  &ldquo;{quote}&rdquo;
                </p>
              </blockquote>
            ))}
          </div>
          <p className="mt-8 text-center font-body text-sm text-cyan-pale/70">
            {p.quotes.attribution}
          </p>
        </AnimatedInView>
      </PressSection>

      {/* Contact */}
      <PressSection id={PRESS_SECTION_IDS.contact} className="section-abyss pb-24">
        <AnimatedInView>
          <div className="press-contact-card mx-auto max-w-3xl rounded-2xl border border-glow/30 bg-gradient-to-b from-cave-night/80 to-abyss/90 p-8 text-center sm:p-12">
            <h2 className="anime-heading font-display text-2xl text-lily sm:text-3xl">
              {p.contact.title}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl font-body text-base leading-relaxed text-ivory/85 sm:text-lg">
              {p.contact.lead}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <a href={contactMailto} className="btn-primary btn-shimmer">
                {p.contact.cta}
              </a>
              <a
                href={contactMailto}
                className="font-body text-sm text-cyan-pale/80 underline-offset-4 hover:text-magic hover:underline"
              >
                {PRESS_KIT.contactEmail}
              </a>
            </div>
            <div className="mt-10">
              <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-cyan-pale/55">
                {p.contact.topicsLabel}
              </p>
              <ul className="mt-3 flex flex-wrap justify-center gap-2">
                {p.contact.topics.map((topic) => (
                  <li
                    key={topic}
                    className="rounded-md border border-glow/15 bg-cavern/40 px-3 py-1.5 font-body text-xs text-ivory/75"
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AnimatedInView>
      </PressSection>

      <footer className="border-t border-glow/10 bg-abyss px-5 py-10 text-center">
        <p className="anime-heading font-display text-lg text-lily">{p.footer.title}</p>
        <p className="mt-2 font-body text-sm text-ivory/60">{p.footer.description}</p>
      </footer>
    </>
  );
}
