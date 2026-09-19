import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { WebtoonPageShell } from "@/components/webtoon/WebtoonPageShell";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { breadcrumbJsonLd, buildPageMetadata, webPageJsonLd } from "@/lib/seo";
import { computeLayout } from "@/lib/webtoon/layout";
import { listWebtoonScripts } from "@/lib/webtoon/scripts";
import { fill, localizedText } from "@/lib/webtoon/text";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    title: dict.meta.webtoon.title,
    description: dict.meta.webtoon.description,
    path: localePath(locale, "/webtoon"),
    pathSuffix: "/webtoon",
    absoluteTitle: true,
  });
}

export default async function WebtoonIndexPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const w = dict.webtoon;
  const scripts = listWebtoonScripts();
  const homePath = localePath(locale, "/");
  const path = localePath(locale, "/webtoon");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: w.breadcrumbHome, path: homePath },
          { name: w.breadcrumbWebtoon, path },
        ])}
      />
      <JsonLd data={webPageJsonLd({ locale, name: w.headline, description: dict.meta.webtoon.description, path })} />
      <WebtoonPageShell>
        <h1 className="anime-heading font-display text-3xl text-lily sm:text-4xl">{w.headline}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ivory/85 sm:text-base">{w.lead}</p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {scripts.length === 0 ? <li className="text-ivory/60">{w.indexEmpty}</li> : null}
          {scripts.map((script) => {
            const layout = computeLayout(script.panels);
            const cover = script.panels.find((p) => p.image.status !== "missing" && p.image.src);
            return (
              <li key={script.slug} className="webtoon-card">
                <Link href={localePath(locale, `/webtoon/${script.slug}`)} className="block">
                  <div className="webtoon-card-cover">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover.image.src} alt="" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p className="anime-label text-[0.65rem] text-cyan-pale">{localizedText(script.subtitle, locale)}</p>
                    <h2 className="mt-1 font-display text-lg text-lily">{localizedText(script.title, locale)}</h2>
                    <p className="mt-2 text-xs text-ivory/60">
                      {fill(w.panels, { count: script.panels.length })} · {fill(w.height, { px: layout.total_height })}
                    </p>
                    <span className="mt-3 inline-block text-sm text-magic">{w.read} →</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <section className="mt-12">
          <h2 className="anime-heading font-display text-xl text-lily">{w.pipelineTitle}</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ivory/80">
            {w.pipelineSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </WebtoonPageShell>
    </>
  );
}
