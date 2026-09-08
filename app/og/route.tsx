import { ImageResponse } from "next/og";
import { createElement } from "react";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";
import { ARTICLE_IMAGES, ARTICLE_MEDIA, OG_CARD_SIZE } from "@/lib/article-media";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { absoluteUrl, INDEXABLE_PATH_SUFFIXES, type IndexablePathSuffix } from "@/lib/seo";

/**
 * Open Graph card for an article: the article's own still, the headline in
 * the visitor's language, the series name. One route for every article and
 * every locale, so no per-page image files.
 *
 * Falls back to the plain still if the card cannot be rendered, so a share
 * never shows a broken image.
 */

const WIDTH = OG_CARD_SIZE.width;
const HEIGHT = OG_CARD_SIZE.height;
const CACHE = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";

const FONT_QUERIES: Record<Locale, string> = {
  en: "family=Noto+Sans:wght@700",
  fr: "family=Noto+Sans:wght@700",
  ja: "family=Noto+Sans+JP:wght@700",
  ko: "family=Noto+Sans+KR:wght@700",
};

const fontCache = new Map<Locale, Promise<ArrayBuffer | null>>();

/**
 * Google Fonts serves TTF to clients that do not advertise woff2 support.
 * Only successes stay cached: a transient failure must not pin a fontless
 * card in the CDN for a week.
 */
async function loadFont(locale: Locale): Promise<ArrayBuffer | null> {
  const cached = fontCache.get(locale);
  if (cached) return cached;
  const promise = (async () => {
    try {
      // Google Fonts picks the format from the User-Agent. A non-browser
      // agent gets TTF; a legacy browser string gets WOFF. Satori reads
      // both, so either answer is accepted.
      const css = await fetch(`https://fonts.googleapis.com/css2?${FONT_QUERIES[locale]}&display=swap`, {
        headers: { "User-Agent": "curl/8" },
        signal: AbortSignal.timeout(8000),
      }).then((r) => r.text());
      const url = css.match(/src: url\(([^)]+)\) format\('(?:truetype|opentype|woff)'\)/)?.[1];
      if (!url) return null;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      return res.ok ? await res.arrayBuffer() : null;
    } catch {
      return null;
    }
  })();
  fontCache.set(locale, promise);
  const font = await promise;
  if (!font) fontCache.delete(locale);
  return font;
}

/** Latin headlines survive the default font; Japanese and Korean do not. */
const NEEDS_CUSTOM_FONT: ReadonlySet<Locale> = new Set(["ja", "ko"]);

function isIndexable(value: string): value is IndexablePathSuffix {
  return (INDEXABLE_PATH_SUFFIXES as readonly string[]).includes(value);
}

async function stillBytes(src: string): Promise<Buffer> {
  return readFile(join(process.cwd(), "public", src));
}


type CardProps = { stillBuffer: ArrayBuffer; headline: string; fontFamily: string };

/** The card markup, kept outside the request handler's try block. */
function Card({ stillBuffer, headline, fontFamily }: CardProps) {
  return (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          position: "relative",
          backgroundColor: "#020817",
          fontFamily,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // @ts-expect-error Satori accepts an ArrayBuffer as image source.
          src={stillBuffer}
          alt=""
          width={WIDTH}
          height={HEIGHT}
          style={{ position: "absolute", top: 0, left: 0, width: WIDTH, height: HEIGHT, objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            backgroundImage: "linear-gradient(180deg, rgba(2,8,23,0.05) 0%, rgba(2,8,23,0.35) 45%, rgba(2,8,23,0.92) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 64,
            right: 64,
            bottom: 56,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 6,
              color: "#7dd3fc",
              textTransform: "uppercase",
            }}
          >
            Lost Garden
          </div>
          <div
            style={{
              display: "flex",
              fontSize: headline.length > 48 ? 52 : 62,
              lineHeight: 1.15,
              color: "#f8fafc",
              fontWeight: 700,
              textShadow: "0 2px 24px rgba(2,8,23,0.9)",
            }}
          >
            {headline}
          </div>
        </div>
      </div>
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const localeParam = params.get("locale") ?? "en";
  const path = params.get("path") ?? "";
  const locale: Locale = isLocale(localeParam) ? localeParam : "en";
  if (!isIndexable(path) || !ARTICLE_MEDIA[path]) {
    return new Response("Not found", { status: 404 });
  }
  const media = ARTICLE_MEDIA[path]!;
  const image = ARTICLE_IMAGES[media.image];
  const fallback = () => Response.redirect(absoluteUrl(image.src), 302);

  try {
    const still = await stillBytes(image.src);
    // Satori sniffs the format from the bytes; a data URI with the wrong
    // declared type is silently dropped, so the still goes in as a buffer.
    const stillBuffer = still.buffer.slice(still.byteOffset, still.byteOffset + still.byteLength) as ArrayBuffer;
    const dict = await getDictionary(locale);
    const headline = media.headline(dict);
    const font = await loadFont(locale);
    if (!font && NEEDS_CUSTOM_FONT.has(locale)) return fallback();
    const fontFamily = font ? "Card" : "sans-serif";

    return new ImageResponse(
      // createElement rather than JSX: the lint rule forbids JSX inside try, and the
      // try is what guarantees a share never gets a broken image.
      createElement(Card, { stillBuffer, headline, fontFamily }),
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: font ? [{ name: "Card", data: font, weight: 700, style: "normal" }] : undefined,
        headers: { "Cache-Control": CACHE },
      },
    );
  } catch {
    return fallback();
  }
}
