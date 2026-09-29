import { recordCost } from "@/lib/webtoon/cost-server";
import { glossaryBrief, type CharacterVoice, type Glossary, type GlossaryTerm } from "@/lib/webtoon/glossary";
import { completeJson } from "@/lib/webtoon/providers/gateway-text";
import { getProjectContext } from "@/lib/webtoon/project-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { Locale } from "@/lib/i18n/config";

/**
 * POST /api/webtoon/<slug>/glossary
 * - { action: "suggest", lines, names, known }: proposes the terms of a glossary (names, places, key words)
 *   from the lettering of the strip, with the renderings its translations already use.
 * - { action: "voices", items, glossary }: reads lines of dialogue against the voice of each character and the
 *   glossary, and returns only the lines that break them or sound translated, with a rewrite.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };

type Line = { fr?: string; en?: string; ja?: string; ko?: string };
type VoiceItem = { key: string; speaker: string; style: string; text: Line };
export type VoiceIssue = { key: string; locale: Locale; problem: string; suggestion: string };

const LOCALES: Locale[] = ["fr", "en", "ja", "ko"];

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; lines?: Line[]; names?: string[]; known?: GlossaryTerm[]; items?: VoiceItem[]; glossary?: Glossary };
  let usd = 0;
  const onCost = (value: number) => {
    usd += value;
  };

  try {
    if (body.action === "suggest") {
      const lines = (body.lines ?? []).slice(0, 500);
      const answer = await completeJson<{ terms?: GlossaryTerm[] }>({
        system: [
          `You build the translation glossary of "${context.script.series}", a webtoon lettered in French, English, Japanese and Korean.`,
          "From the lettering and the names of the cast and places, list the terms that must never vary from one panel to another: names of characters, creatures, places, objects that matter, invented words, titles, recurring key words. Not common words.",
          "For each, the French form and its rendering in en, ja, ko: the one the lettering already uses most when it exists (look at the lines), else the natural one (a name usually stays as is in English, is transcribed in katakana and hangul). A short `note` only when useful (\"never translated\", \"feminine\").",
          'Answer with JSON only: {"terms": [{"fr", "en", "ja", "ko", "note"}]}. At most 40 terms, the most important first. Skip the terms already known.',
        ].join("\n\n"),
        user: JSON.stringify({ names: body.names ?? [], known: (body.known ?? []).map((t) => t.fr), lines }, null, 1),
        maxTokens: 4000,
        reasoning: "none",
        temperature: 0,
        onCost,
      });
      void recordCost({ idToken: identity.idToken, slug, usd, kind: "translate" });
      const known = new Set((body.known ?? []).map((t) => t.fr.toLowerCase()));
      const terms = (answer.terms ?? []).filter((t) => t?.fr?.trim() && !known.has(t.fr.trim().toLowerCase())).map((t) => ({ fr: t.fr.trim(), en: t.en?.trim(), ja: t.ja?.trim(), ko: t.ko?.trim(), ...(t.note?.trim() ? { note: t.note.trim() } : {}) }));
      return Response.json({ terms, cost_usd: usd });
    }

    if (body.action === "voices") {
      const items = (body.items ?? []).filter((i) => i?.key && i.text).slice(0, 80);
      if (!items.length) return Response.json({ issues: [], cost_usd: 0 });
      const glossary: Glossary = { terms: body.glossary?.terms ?? [], voices: (body.glossary?.voices ?? []) as CharacterVoice[] };
      const answer = await completeJson<{ issues?: VoiceIssue[] }>({
        system: [
          `You are the dialogue editor of "${context.script.series}", a webtoon lettered in French, English, Japanese and Korean. You read the lines in order, like a reader, in every language.`,
          glossaryBrief(glossary, LOCALES),
          "Flag ONLY a line that: breaks the voice of its speaker as described (a calm character who suddenly jokes loudly, a child who speaks like an adult, a register that changes); sounds translated rather than spoken in that language (word-for-word, stiff, a calque, an unnatural word order); breaks the glossary; is too long for a bubble compared with the others. Never flag a line for taste alone. Most lines are fine: say nothing about them.",
          "For each flagged line: `key`, `locale` (the language of the problem), `problem` in one short French sentence, `suggestion`: the rewritten line in that language, as short as the original, natural, same meaning. In French and English, the second person singular only when a child or a close companion is addressed. Never an em dash.",
          'Answer with JSON only: {"issues": [{"key", "locale", "problem", "suggestion"}]}.',
        ]
          .filter(Boolean)
          .join("\n\n"),
        user: JSON.stringify(items.map((i) => ({ key: i.key, speaker: i.speaker, style: i.style, ...i.text })), null, 1),
        maxTokens: 6000,
        reasoning: "none",
        temperature: 0,
        onCost,
      });
      void recordCost({ idToken: identity.idToken, slug, usd, kind: "translate" });
      const byKey = new Map(items.map((i) => [i.key, i]));
      // A "rewrite" identical to the line is a doubt, not a fault.
      const issues = (answer.issues ?? []).filter((i) => byKey.has(i?.key) && LOCALES.includes(i.locale) && i.suggestion?.trim() && i.suggestion.trim() !== (byKey.get(i.key)!.text[i.locale] ?? "").trim()).map((i) => ({ key: i.key, locale: i.locale, problem: String(i.problem ?? "").slice(0, 300), suggestion: i.suggestion.trim().replace(/\u2014/g, ",") }));
      return Response.json({ issues, cost_usd: usd });
    }
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "glossary failed" }, { status: 502 });
  }
  return Response.json({ error: "unknown action" }, { status: 400 });
}
