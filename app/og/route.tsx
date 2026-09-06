import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";
import { ARTICLE_IMAGES, ARTICLE_MEDIA } from "@/lib/article-media";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { INDEXABLE_PATH_SUFFIXES, type IndexablePathSuffix } from "@/lib/seo";

/**
 * Open Graph card for an article: the article's own still, the headline in
 * the visitor's language, the series name. One route for every article and
 * every locale, so no per-page image files.
 *
 * Falls back to the plain still if the card cannot be rendered, so a share
 * never shows a broken image.
 */

const WIDTH = 1200;
const HEIGHT = 630;
const CACHE = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";

const FONT_QUERIES: Record<Locale, string> = {
  en: "family=Noto+Sans:wght@700",
  fr: "family=Noto+Sans:wght@700",
  ja: "family=Noto+Sans+JP:wght@700",
  ko: "family=Noto+Sans+KR:wght@700",
};

const fontCache = new Map<Locale, Promise<ArrayBuffer | null>>();

/** Google Fonts serves TTF to clients that do not advertise woff2 support. */
async function loadFont(locale: Locale): Promise<ArrayBuffer | null> {
  const cached = fontCache.get(locale);
  if (cached) return cached;
  const promise = (async () => {
    try {
      const css = await fetch(`https://fonts.googleapis.com/css2?${FONT_QUERIES[locale]}&display=swap`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:5.0) Gecko/20100101 Firefox/5.0" },
        signal: AbortSignal.timeout(8000),
      }).then((r) => r.text());
      const url = css.match(/src: url\(([^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1];
      if (!url) return null;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      return res.ok ? await res.arrayBuffer() : null;
    } catch {
      return null;
    }
  })();
  fontCache.set(locale, promise);
  return promise;
}

function isIndexable(value: string): value is IndexablePathSuffix {
  return (INDEXABLE_PATH_SUFFIXES as readonly string[]).includes(value);
}

async function stillBytes(src: string): Promise<Buffer> {
  return readFile(join(process.cwd(), "public", src));
}

function headlineFor(dict: Awaited<ReturnType<typeof getDictionary>>, key: string): string {
  if (key === "bestAiAnime") return dict.bestAiAnime.headline;
  const guides = dict.guides as unknown as Record<string, { headline?: string } | undefined>;
  return guides[key]?.headline ?? dict.common.siteName;
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
  const still = await stillBytes(image.src);
  const mime = image.src.endsWith(".jpg") ? "image/jpeg" : "image/png";
  // Satori sniffs the format from the bytes; a data URI with the wrong
  // declared type is silently dropped, so the still goes in as a buffer.
  const stillBuffer = still.buffer.slice(still.byteOffset, still.byteOffset + still.byteLength) as ArrayBuffer;

  try {
    const dict = await getDictionary(locale);
    const headline = headlineFor(dict, media.headlineKey);
    const font = await loadFont(locale);
    const fontFamily = font ? "Card" : "sans-serif";

    return new ImageResponse(
      (
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
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: font ? [{ name: "Card", data: font, weight: 700, style: "normal" }] : undefined,
        headers: { "Cache-Control": CACHE },
      },
    );
  } catch {
    return new Response(new Uint8Array(still), {
      status: 200,
      headers: { "Content-Type": mime, "Cache-Control": CACHE },
    });
  }
}
