import "server-only";
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { SITE, absoluteUrl } from "@/lib/seo";

/**
 * The shared image of a webtoon page (1200 x 630): the episode's cover as a
 * blurred backdrop and a card on the right, the series name, "Épisode N" and
 * the title in Oswald, the site's display face. Every step falls back: no
 * cover, the site's static share image; no font, the default one.
 */

export const WEBTOON_OG_SIZE = { width: 1200, height: 630 };
const CARD = { width: 360, height: 540 };
const PUBLIC_DIR = resolve(process.cwd(), "public");

async function readSource(source: string): Promise<Buffer | null> {
  let src = source;
  try {
    if (src.startsWith("/") && !src.startsWith("//")) {
      const local = resolve(join(PUBLIC_DIR, decodeURIComponent(src.split("?")[0])));
      if (local.startsWith(PUBLIC_DIR + sep)) {
        try {
          return await readFile(local);
        } catch {
          // Not bundled with the function: read it from the site instead.
        }
      }
      src = absoluteUrl(src);
    }
    const url = new URL(src);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "force-cache" });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length ? bytes : null;
  } catch {
    return null;
  }
}

const dataUri = (bytes: Buffer) => `data:image/jpeg;base64,${bytes.toString("base64")}`;

/** JPEG data URIs (satori reads neither WebP nor large files well): backdrop, and the card when there is a cover. */
async function artwork(cover?: string): Promise<{ backdrop: string; card?: string } | null> {
  try {
    const bytes = cover ? await readSource(cover) : null;
    if (bytes) {
      const [backdrop, card] = await Promise.all([
        sharp(bytes).resize(WEBTOON_OG_SIZE.width, WEBTOON_OG_SIZE.height, { fit: "cover" }).blur(24).modulate({ brightness: 0.6 }).jpeg({ quality: 70 }).toBuffer(),
        sharp(bytes).resize(CARD.width, CARD.height, { fit: "cover", position: sharp.strategy.attention }).jpeg({ quality: 86 }).toBuffer(),
      ]);
      return { backdrop: dataUri(backdrop), card: dataUri(card) };
    }
    const fallback = await readSource(SITE.ogImage);
    if (!fallback) return null;
    const backdrop = await sharp(fallback).resize(WEBTOON_OG_SIZE.width, WEBTOON_OG_SIZE.height, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
    return { backdrop: dataUri(backdrop) };
  } catch {
    return null;
  }
}

/** A Google font subset to the text drawn, as TTF (what satori reads). */
async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const query = `family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await fetch(`https://fonts.googleapis.com/css2?${query}`, { signal: AbortSignal.timeout(5000), cache: "force-cache" }).then((r) => (r.ok ? r.text() : ""));
    const url = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(css)?.[1];
    if (!url) return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "force-cache" });
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${space > max * 0.5 ? cut.slice(0, space) : cut}…`;
}

export async function webtoonOgImage({ kicker, heading, title, cover, footer }: { kicker: string; heading: string; title?: string; cover?: string; footer: string }): Promise<ImageResponse> {
  const shownTitle = title ? clip(title, 72) : undefined;
  const text = [kicker.toUpperCase(), heading, shownTitle ?? "", footer.toUpperCase()].join(" ");
  const cjk = /[぀-ヿ一-鿿]/.test(text) ? "Noto Sans JP" : /[가-힯]/.test(text) ? "Noto Sans KR" : null;
  const [art, oswald, fallback] = await Promise.all([artwork(cover), googleFont("Oswald", 600, text), cjk ? googleFont(cjk, 700, text) : Promise.resolve(null)]);
  const fonts = [
    ...(oswald ? [{ name: "Oswald", data: oswald, weight: 600 as const, style: "normal" as const }] : []),
    ...(fallback && cjk ? [{ name: cjk, data: fallback, weight: 700 as const, style: "normal" as const }] : []),
  ];
  const textWidth = art?.card ? 660 : 1056;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#020817", fontFamily: fonts.map((f) => f.name).join(", ") || undefined }}>
        {art ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={art.backdrop} width={WEBTOON_OG_SIZE.width} height={WEBTOON_OG_SIZE.height} style={{ position: "absolute", left: 0, top: 0 }} />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WEBTOON_OG_SIZE.width,
            height: WEBTOON_OG_SIZE.height,
            display: "flex",
            background: "linear-gradient(90deg, rgba(2,8,23,0.94) 0%, rgba(2,8,23,0.78) 52%, rgba(2,8,23,0.3) 100%)",
          }}
        />
        <div style={{ position: "absolute", left: 72, top: 0, width: textWidth, height: WEBTOON_OG_SIZE.height, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", fontSize: 34, letterSpacing: 8, color: "#b9f3ff" }}>{kicker.toUpperCase()}</div>
          <div style={{ display: "flex", fontSize: 112, lineHeight: 1.05, color: "#f8fafc", marginTop: 8 }}>{heading}</div>
          {shownTitle ? <div style={{ display: "flex", fontSize: 42, lineHeight: 1.2, color: "#d8d2c2", marginTop: 18 }}>{shownTitle}</div> : null}
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, color: "#38bdf8", marginTop: 40 }}>{footer.toUpperCase()}</div>
        </div>
        {art?.card ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img
            src={art.card}
            width={CARD.width}
            height={CARD.height}
            style={{ position: "absolute", right: 72, top: (WEBTOON_OG_SIZE.height - CARD.height) / 2, borderRadius: 18, border: "2px solid rgba(185,243,255,0.4)", boxShadow: "0 0 60px rgba(56,189,248,0.35)" }}
          />
        ) : null}
      </div>
    ),
    { ...WEBTOON_OG_SIZE, fonts },
  );
}
