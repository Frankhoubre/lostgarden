import { ARTICLES } from "@/lib/articles";
import { ARTICLE_IMAGES, ARTICLE_MEDIA } from "@/lib/article-media";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { absoluteUrl, SITE } from "@/lib/seo";

/** RSS 2.0 feed of the articles, one per language, prerendered at build. */

export const dynamic = "force-static";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function escape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function GET(_request: Request, context: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await context.params;
  if (!isLocale(localeParam)) return new Response("Not found", { status: 404 });
  const locale: Locale = localeParam;
  const dict = await getDictionary(locale);

  const items = [...ARTICLES]
    .sort((a, b) => b.published.localeCompare(a.published))
    .map((entry) => {
      const meta = dict.meta[entry.meta];
      const url = absoluteUrl(localePath(locale, entry.path));
      const media = ARTICLE_MEDIA[entry.path];
      const image = media ? absoluteUrl(ARTICLE_IMAGES[media.image].src) : null;
      return `    <item>
      <title>${escape(meta.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(entry.published).toUTCString()}</pubDate>
      <description>${escape(meta.description)}</description>${
        image ? `\n      <enclosure url="${image}" type="image/jpeg" length="0" />` : ""
      }
    </item>`;
    })
    .join("\n");

  const self = absoluteUrl(localePath(locale, "/feed.xml"));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(dict.feed.title)}</title>
    <link>${absoluteUrl(localePath(locale, "/blog"))}</link>
    <description>${escape(dict.feed.description)}</description>
    <language>${locale}</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
    <image>
      <url>${absoluteUrl(SITE.ogImage)}</url>
      <title>${escape(dict.feed.title)}</title>
      <link>${absoluteUrl(localePath(locale, "/"))}</link>
    </image>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
