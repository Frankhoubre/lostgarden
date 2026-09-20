import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebtoonEditor } from "@/components/webtoon/WebtoonEditor";
import { WebtoonPageShell } from "@/components/webtoon/WebtoonPageShell";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { buildPageMetadata } from "@/lib/seo";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { localizedText } from "@/lib/webtoon/text";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  return buildPageMetadata({
    locale,
    title: `${dict.webtoon.editor.title} | Lost Garden`,
    description: dict.webtoon.editor.lead,
    path: localePath(locale, `/webtoon/${slug}/editor`),
    absoluteTitle: true,
    noIndex: true,
  });
}

export default async function WebtoonEditorPage({ params }: PageProps) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const script = getWebtoonScript(slug);
  if (!script) notFound();
  const dict = await getDictionary(locale);

  return (
    <WebtoonPageShell wide>
      <p className="anime-label text-xs text-cyan-pale">{localizedText(script.subtitle, locale)}</p>
      <h1 className="anime-heading mt-1 font-display text-2xl text-lily sm:text-3xl">
        {dict.webtoon.editor.title} · {localizedText(script.title, locale)}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ivory/75">{dict.webtoon.editor.lead}</p>
      <div className="mt-6">
        <WebtoonEditor script={script} />
      </div>
    </WebtoonPageShell>
  );
}
