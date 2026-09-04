import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/types";
import { localePath } from "@/lib/i18n/navigation";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildPageMetadata,
  itemListJsonLd,
  webPageJsonLd,
} from "@/lib/seo";

/** Editorial pages listed on the blog index, newest intent first. */
const ARTICLES = [
  { path: "/best-ai-anime", meta: "bestAiAnime" },
  { path: "/how-to-make-ai-anime", meta: "howToMakeAiAnime" },
  { path: "/ai-character-consistency", meta: "aiCharacterConsistency" },
  { path: "/is-ai-anime-real-anime", meta: "isAiAnimeRealAnime" },
  {
    path: "/ai-anime-vs-traditional-animation",
    meta: "aiAnimeVsTraditional",
  },
  { path: "/process", meta: "process" },
  { path: "/vision", meta: "vision" },
] as const;

type BlogPageProps = { params: Promise<{ locale: string }> };

function articleEntries(dict: Dictionary) {
  return ARTICLES.map((entry) => ({
    path: entry.path,
    title: dict.meta[entry.meta].title,
    description: dict.meta[entry.meta].description,
  }));
}

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return buildPageMetadata({
    locale,
    title: dict.meta.blog.title,
    description: dict.meta.blog.description,
    path: localePath(locale, "/blog"),
    pathSuffix: "/blog",
    absoluteTitle: true,
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const entries = articleEntries(dict);
  const blogPath = localePath(locale, "/blog");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.guides.breadcrumbHome, path: localePath(locale, "/") },
          { name: dict.guides.breadcrumbBlog, path: blogPath },
        ])}
      />
      <JsonLd
        data={webPageJsonLd({
          locale,
          name: dict.blog.headline,
          description: dict.meta.blog.description,
          path: blogPath,
        })}
      />
      <JsonLd
        data={itemListJsonLd({
          name: dict.blog.headline,
          description: dict.meta.blog.description,
          path: blogPath,
          items: entries.map((entry, index) => ({
            position: index + 1,
            name: entry.title,
            description: entry.description,
            url: absoluteUrl(localePath(locale, entry.path)),
          })),
        })}
      />
      <LegalPageShell title={dict.blog.headline}>
        <p className="font-display text-lg text-cyan-pale/90 sm:text-xl">
          {dict.blog.lead}
        </p>
        <ul className="space-y-8">
          {entries.map((entry) => (
            <li key={entry.path}>
              <h2 className="anime-heading font-display text-xl text-lily sm:text-2xl">
                <Link
                  href={localePath(locale, entry.path)}
                  className="underline-offset-4 transition hover:text-magic hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 rounded-sm"
                >
                  {entry.title}
                </Link>
              </h2>
              <p className="mt-2 text-ivory/80">{entry.description}</p>
            </li>
          ))}
        </ul>
      </LegalPageShell>
    </>
  );
}
