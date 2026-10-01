import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SectionTitle } from "@/components/SectionTitle";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { GifGrid, StickerGrid } from "@/components/stickers/StickerGrids";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { breadcrumbJsonLd, buildPageMetadata, webPageJsonLd } from "@/lib/seo";
import { GIFS, LINKS, STICKERS, STICKERS_PACK_ZIP_URL, STICKERS_ZIP_URL } from "@/lib/stickers";

type StickersPageProps = {
  params: Promise<{ locale: string }>;
};

const STICKERS_KEYWORDS = [
  "Lost Garden",
  "Lost Garden GIF",
  "Lost Garden stickers",
  "anime GIFs",
  "reaction GIFs",
  "dark fantasy anime",
  "Serrure",
  "Lanterne",
];

export async function generateMetadata({
  params,
}: StickersPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return {
    ...buildPageMetadata({
      locale,
      title: dict.meta.stickers.title,
      description: dict.meta.stickers.description,
      path: localePath(locale, "/stickers"),
      pathSuffix: "/stickers",
      absoluteTitle: true,
    }),
    keywords: STICKERS_KEYWORDS,
  };
}

export default async function StickersPage({ params }: StickersPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const copy = dict.stickers;
  const homePath = localePath(locale, "/");
  const stickersPath = localePath(locale, "/stickers");

  const breadcrumbs = [
    { name: copy.breadcrumbHome, path: homePath },
    { name: copy.breadcrumbStickers, path: stickersPath },
  ] as const;

  const findUs = [
    { label: copy.giphy, href: LINKS.giphy },
    { label: copy.tenor, href: LINKS.tenor },
    { label: copy.telegramStickers, href: LINKS.telegramStickers },
    { label: copy.telegram, href: LINKS.telegram },
  ].filter((link) => link.href !== "");

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={webPageJsonLd({
          locale,
          name: copy.title,
          description: dict.meta.stickers.description,
          path: stickersPath,
        })}
      />

      <header className="site-nav border-b border-glow/20 px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
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
              className="hidden font-body text-sm font-medium text-cyan-pale/80 underline-offset-4 transition hover:text-magic hover:underline sm:inline"
            >
              {dict.legal.backToSite}
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="section-pad section-misty">
          <div className="mx-auto max-w-6xl">
            <p className="anime-label font-display text-[0.65rem] tracking-[0.2em] text-cyan-pale/75 sm:text-xs">
              {copy.badge}
            </p>
            <h1 className="anime-heading mt-4 font-display text-[clamp(2.5rem,1.5rem+5vw,4rem)] text-lily">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-2xl font-body text-lg font-medium leading-relaxed text-ivory/90 sm:text-xl">
              {copy.lead}
            </p>
            <div className="mt-8">
              <a
                href={STICKERS_ZIP_URL}
                download="lost-garden-gifs.zip"
                className="btn-primary btn-shimmer"
              >
                {copy.downloadAll}
              </a>
            </div>
          </div>
        </section>

        {GIFS.length > 0 ? (
          <section className="section-pad section-abyss" aria-labelledby="stickers-gifs">
            <div className="mx-auto max-w-6xl">
              <SectionTitle as="h2">
                <span id="stickers-gifs">{copy.gifsTitle}</span>
              </SectionTitle>
              <div className="mt-10">
                <GifGrid gifs={GIFS} />
              </div>
            </div>
          </section>
        ) : null}

        {STICKERS.length > 0 ? (
          <section className="section-pad section-misty" aria-labelledby="stickers-stickers">
            <div className="mx-auto max-w-6xl">
              <SectionTitle as="h2">
                <span id="stickers-stickers">{copy.stickersTitle}</span>
              </SectionTitle>
              <div className="mt-8">
                <a
                  href={STICKERS_PACK_ZIP_URL}
                  download="lost-garden-stickers.zip"
                  className="btn-primary btn-shimmer"
                >
                  {copy.downloadAllStickers}
                </a>
              </div>
              <div className="mt-10">
                <StickerGrid stickers={STICKERS} />
              </div>
            </div>
          </section>
        ) : null}

        {findUs.length > 0 ? (
          <section className="section-pad section-abyss" aria-labelledby="stickers-find-us">
            <div className="mx-auto max-w-6xl">
              <SectionTitle as="h2">
                <span id="stickers-find-us">{copy.findUsTitle}</span>
              </SectionTitle>
              <ul className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                {findUs.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="border-t border-glow/15 bg-cavern/35 px-4 py-6 sm:px-6">
          <p className="mx-auto max-w-6xl text-center font-body text-sm leading-relaxed text-ivory/75">
            {copy.license}
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
