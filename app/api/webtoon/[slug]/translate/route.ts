import { recordCost } from "@/lib/webtoon/cost-server";
import { completeJson } from "@/lib/webtoon/providers/gateway-text";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import { LETTERING_LOCALES, sourceLocale, type LetteringItem } from "@/lib/webtoon/translate";
import type { Locale } from "@/lib/i18n/config";

/**
 * POST /api/webtoon/<slug>/translate
 * Body: { items: LetteringItem[], scene?: string, locales?: Locale[] }
 *
 * Translates the lettering of one or several panels into the site's
 * languages through Vercel AI Gateway (Claude Sonnet 5). Each item keeps its
 * key so the studio can write the result back. Natural spoken language,
 * short enough for a bubble, sound effects adapted rather than transcribed.
 */

export const maxDuration = 120;

type RouteContext = { params: Promise<{ slug: string }> };

const LANGUAGE: Record<Locale, string> = { fr: "French", en: "English", ja: "Japanese", ko: "Korean" };

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const script = getWebtoonScript(slug);
  if (!script) return Response.json({ error: "unknown webtoon script" }, { status: 404 });
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { items?: LetteringItem[]; scene?: string; locales?: Locale[] };
  const items = (body.items ?? []).filter((item) => item.key && item.text && sourceLocale(item.text));
  if (!items.length) return Response.json({ error: "nothing to translate" }, { status: 400 });
  const locales = (body.locales ?? LETTERING_LOCALES).filter((l) => LETTERING_LOCALES.includes(l));

  const system = [
    `You translate the lettering of "${script.series}", an original poetic dark fantasy anime by Frank Houbre, adapted as a vertical webtoon. Episode ${script.episode}.`,
    "Speakers: Lanterne is a hollow suit of armour who never speaks. Rose is a small, calm child who speaks softly and simply. The Unhooker, the King of the Vault and the other creatures of the Below speak in short, low sentences.",
    "Rules: write natural spoken language, the way a person would say it out loud, never a word-for-word transfer. Keep each line as short as the original so it fits in a bubble. Keep the register (whisper, shout, thought). Captions are narration or a place or a time. Sound effects (sfx) are onomatopoeia: give the natural onomatopoeia of each language (Japanese in katakana, Korean in hangul), not a translation of the word.",
    "In English and French, use the second person singular only when a child or a close companion is addressed. Never use an em dash. Use plain punctuation.",
    'Answer with JSON only, shaped {"translations": {"<key>": {"fr": "...", "en": "...", "ja": "...", "ko": "..."}}}. Include every key you were given and every requested language, including the source language copied as is.',
  ].join("\n");

  const user = JSON.stringify(
    {
      scene: body.scene ?? "",
      languages: locales.map((l) => `${l} = ${LANGUAGE[l]}`),
      items: items.map((item) => ({
        key: item.key,
        kind: item.kind,
        speaker: item.speaker || undefined,
        style: item.style,
        source_language: LANGUAGE[sourceLocale(item.text) as Locale],
        text: item.text[sourceLocale(item.text) as Locale],
      })),
    },
    null,
    1,
  );

  try {
    let cost = 0;
    const result = await completeJson<{ translations?: Record<string, Partial<Record<Locale, string>>> }>({ system, user, onCost: (usd) => { cost += usd; } });
    void recordCost({ idToken: identity.idToken, slug, usd: cost, kind: "translate" });
    const translations = result.translations ?? {};
    return Response.json({ translations, count: Object.keys(translations).length, cost_usd: cost });
  } catch (error) {
    const message = error instanceof Error ? error.message : "translation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
