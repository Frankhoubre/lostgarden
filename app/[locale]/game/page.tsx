import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GameShell } from "@/components/game/GameShell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { breadcrumbJsonLd, buildPageMetadata, webPageJsonLd } from "@/lib/seo";

type GamePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.game.title,
    description: dict.meta.game.description,
    path: localePath(locale, "/game"),
    pathSuffix: "/game",
    absoluteTitle: true,
  });
}

export default async function GamePage({ params }: GamePageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const copy = dict.game;
  const homePath = localePath(locale, "/");
  const gamePath = localePath(locale, "/game");

  const breadcrumbs = [
    { name: copy.breadcrumbHome, path: homePath },
    { name: copy.breadcrumbGame, path: gamePath },
  ] as const;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={webPageJsonLd({
          locale,
          name: copy.headline,
          description: dict.meta.game.description,
          path: gamePath,
        })}
      />

      <header className="site-nav border-b border-glow/20 px-5 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link
            href={homePath}
            className="anime-heading font-display text-lg text-lily transition hover:text-magic"
          >
            {dict.common.siteName}
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={homePath}
              className="font-body text-sm font-medium text-cyan-pale/80 underline-offset-4 transition hover:text-magic hover:underline"
            >
              {dict.legal.backToSite}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-5 sm:py-12">
        <h1 className="anime-heading font-display text-3xl text-lily sm:text-4xl">
          {copy.headline}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-ivory/85 sm:text-base">
          {copy.lead}
        </p>

        <section className="mt-8" aria-label={copy.headline}>
          <GameShell />
        </section>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <section>
            <h2 className="anime-label font-display text-sm text-cyan-pale">
              {copy.controlsTitle}
            </h2>
            <ul className="mt-3 space-y-2 font-body text-sm text-ivory/80">
              {copy.controls.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-3 font-body text-xs text-ivory/55">{copy.touchHint}</p>
          </section>
          <section>
            <h2 className="anime-label font-display text-sm text-cyan-pale">
              {copy.loreTitle}
            </h2>
            <ul className="mt-3 space-y-2 font-body text-sm text-ivory/80">
              {copy.lore.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-10 font-body text-xs text-ivory/55">{copy.credits}</p>
      </main>

      <SiteFooter />
    </>
  );
}
