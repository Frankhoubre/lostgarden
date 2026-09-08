import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/types";
import { localePath } from "@/lib/i18n/navigation";
import { articleOgMetadata, getArticleMedia } from "@/lib/article-media";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildPageMetadata,
  itemListJsonLd,
  webPageJsonLd,
} from "@/lib/seo";

import { ARTICLES } from "@/lib/articles";

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
    ...articleOgMetadata(locale, "/blog", dict),
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
        <ul className="space-y-10">
          {entries.map((entry) => {
            const media = getArticleMedia(entry.path);
            return (
              <li key={entry.path} className="grid gap-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
                {media ? (
                  <Link
                    href={localePath(locale, entry.path)}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="trailer-frame block overflow-hidden rounded-xl"
                  >
                    <Image
                      src={media.imageData.src}
                      alt=""
                      width={media.imageData.width}
                      height={media.imageData.height}
                      sizes="(max-width: 640px) 100vw, 14rem"
                      className="h-auto w-full"
                    />
                  </Link>
                ) : null}
                <div>
                  <h2 className="anime-heading font-display text-xl text-lily sm:text-2xl">
                    <Link
                      href={localePath(locale, entry.path)}
                      className="underline-offset-4 transition hover:text-magic hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 rounded-sm"
                    >
                      {entry.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-ivory/80">{entry.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </LegalPageShell>
    </>
  );
}
