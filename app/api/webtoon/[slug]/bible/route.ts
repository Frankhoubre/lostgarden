import { slugId, type BibleCandidate, type BibleStep } from "@/lib/webtoon/bible";
import { recordCost } from "@/lib/webtoon/cost-server";
import { getProjectContext, imageAsDataUrl } from "@/lib/webtoon/project-server";
import { completeJson, type UserPart } from "@/lib/webtoon/providers/gateway-text";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";

/**
 * POST /api/webtoon/<slug>/bible
 * Body: { step: "characters" | "objects" | "locations", known?: { id, name, kind, must_keep }[] }
 *
 * Detects the candidates of one step of the bible. With a film: frames are
 * sampled across the whole film (about one every eight seconds, at most 120),
 * read in parallel groups of ten by a vision model that lists what it sees
 * with the seconds, then one call merges the groups into a list without
 * duplicates, a design lock written from the images and the seconds where
 * each thing is seen best. Without a film: the screenplay is read instead.
 * What the bible already holds (`known`) is given so it is not proposed
 * again, and so an object is told apart from a character.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };

const GROUP = 10;
const MAX_SAMPLES = 120;

const WHAT: Record<BibleStep, string> = {
  characters:
    "every CHARACTER: a person, an animal, a creature, a monster, a robot or a machine that moves or acts. Kind `character` for a person, `creature` for an animal, a creature, a monster or a machine. Several appearances of the same one are one entry (same clothes, same face, same shape).",
  objects:
    "every IMPORTANT OBJECT: a separate thing a character holds, uses, opens, throws, loses or finds (a pendant, a key, a weapon, a book, a lantern, a letter), or that the story shows alone in close-up. NEVER a part of a character or a creature: not its clothes, cape, scarf, armour, helmet while worn, shoulder pads, gloves; not a limb, a claw, a pincer, an eye, a lens of a machine; those are drawn with their owner's sheet. A worn item becomes an object only when it leaves its owner (a helmet lying on the ground, a cape left behind). Not scenery either (trees, rocks, furniture, a forest). Kind `object`.",
  locations:
    "every LOCATION or BIOME: each distinct place where the story happens (a forest, a cave, a sanctuary, a room, a street, a desert, a sky). Frames of the same place from other angles are one entry. Kind `location`.",
};

type Seen = { name: string; kind?: string; looks?: string; seconds?: number[] };

function sample<T>(list: readonly T[], max: number): T[] {
  if (list.length <= max) return [...list];
  const step = list.length / max;
  return Array.from({ length: max }, (_, i) => list[Math.floor(i * step)]);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  if (!process.env.AI_GATEWAY_API_KEY) return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { step?: BibleStep; known?: { id: string; name: string; kind: string; must_keep?: string }[] };
  const step: BibleStep = body.step === "objects" || body.step === "locations" ? body.step : "characters";
  const known = (Array.isArray(body.known) ? body.known : []).slice(0, 60).map((k) => ({ id: k.id, name: k.name, kind: k.kind, looks: String(k.must_keep ?? "").slice(0, 160) }));
  const synopsis = context.project?.synopsis?.trim() ?? "";
  let usd = 0;
  const onCost = (value: number) => {
    usd += value;
  };

  try {
    let seen: (Seen & { group: number })[] = [];
    if (context.frames.length) {
      // Spread the samples over the whole film, then read them in parallel groups.
      const every = Math.max(1, Math.round(context.frames.length / MAX_SAMPLES));
      const picked = sample(context.frames.filter((_, i) => i % every === 0), MAX_SAMPLES);
      const groups: (typeof picked)[] = [];
      for (let i = 0; i < picked.length; i += GROUP) groups.push(picked.slice(i, i + GROUP));
      const answers = await Promise.all(
        groups.map(async (group, index) => {
          const parts: UserPart[] = [];
          for (const frame of group) {
            parts.push({ type: "text", text: `Frame at ${frame.label} (${frame.seconds} s)` });
            parts.push({ type: "image_url", image_url: { url: await imageAsDataUrl(frame.src) } });
          }
          try {
            const answer = await completeJson<{ seen?: Seen[] }>({
              system: [
                `You build the visual bible of a film being adapted into a webtoon. List ${WHAT[step]}`,
                "For each, write `name` (a short English name that says what it is: \"girl with pink hair\", \"giant spider machine\", \"silver pendant\", \"blue mushroom forest\"), `kind`, `looks` (what it looks like, precisely, from the frames: shape, proportions, colours, materials, clothes, distinctive details) and `seconds` (the timecodes of the frames where it is visible). Only what you clearly see; nothing guessed.",
                known.length ? `Already in the bible, do not list again: ${known.map((k) => `${k.name} (${k.kind})`).join("; ")}.` : "",
                'Answer with JSON only: {"seen": [{"name", "kind", "looks", "seconds": [..]}]}, an empty list when there is nothing of that kind. Escape double quotes inside strings.',
              ]
                .filter(Boolean)
                .join("\n\n"),
              user: [...parts, { type: "text", text: "List what these frames show, as JSON." }],
              maxTokens: 4000,
              reasoning: "none",
              temperature: 0,
              onCost,
            });
            return (answer.seen ?? []).filter((s) => s && typeof s.name === "string").map((s) => ({ ...s, group: index }));
          } catch {
            return [];
          }
        }),
      );
      seen = answers.flat();
    }

    // One call merges what the groups saw (or reads the screenplay when there is no film).
    const screenplay = context.screenplay.slice(0, 60000);
    if (!seen.length && !screenplay && !synopsis) return Response.json({ candidates: [], note: "Aucune image du film ni scénario à lire." });
    const merged = await completeJson<{ candidates?: BibleCandidate[] }>({
      system: [
        `You finish the visual bible of "${context.script.series}", a film adapted into a webtoon. The step: ${WHAT[step]}`,
        seen.length
          ? "You get what several readers saw in groups of frames. The same thing is often described by several groups with other words: merge them into one entry. Drop what appears once and does not matter to the story."
          : "There is no film: read the screenplay and the synopsis.",
        "For each entry write: `id` (english, lower case with hyphens, short), `name` (a short name to show the author, in French when the thing has no proper name in the story, the proper name otherwise), `kind`, `must_keep` (a precise DESIGN LOCK in English that an illustrator can draw from without the images: overall shape, proportions, colours, materials, clothes, distinctive details; for a creature, a machine or a place, its size against a person), `description` (what it is in the story, one short sentence in French), `seconds` (all the seconds where it was seen), `best_seconds` (two or three seconds where it is seen best: large, clear, its whole shape), `importance` (main, secondary or minor), `scale` (for a creature, a machine or a structure: its size against a person, in English; else empty).",
        known.length ? `Already in the bible, never propose them again: ${JSON.stringify(known)}.` : "",
        `Only entries of this step: ${step === "characters" ? "`kind` character or creature" : step === "objects" ? "`kind` object" : "`kind` location"}; leave out everything else, it has its own step. Order the entries by importance, the main ones first. Answer with JSON only: {"candidates": [...]}. Escape double quotes inside strings.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      user: [
        synopsis ? `SYNOPSIS:\n${synopsis}` : "",
        seen.length ? `WHAT THE READERS SAW:\n${JSON.stringify(seen.map(({ group, ...s }) => ({ ...s, group })), null, 1)}` : "",
        !seen.length && screenplay ? `SCREENPLAY:\n${screenplay}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
      maxTokens: 12000,
      reasoning: "none",
      temperature: 0,
      onCost,
    });

    const knownIds = new Set(known.map((k) => k.id.replace(/^(char\.|obj\.|loc\.)/, "").replace(/\.webtoon$/, "")));
    const frameSeconds = new Set(context.frames.map((f) => f.seconds));
    const nearest = (s: number) => {
      if (!context.frames.length) return s;
      if (frameSeconds.has(s)) return s;
      return context.frames.reduce((best, f) => (Math.abs(f.seconds - s) < Math.abs(best - s) ? f.seconds : best), context.frames[0].seconds);
    };
    const kinds = step === "characters" ? ["character", "creature"] : step === "objects" ? ["object"] : ["location"];
    const candidates: BibleCandidate[] = [];
    for (const raw of merged.candidates ?? []) {
      if (!raw || typeof raw.name !== "string" || !raw.name.trim()) continue;
      const id = slugId(raw.id || raw.name);
      if (!id || knownIds.has(id) || candidates.some((c) => c.id === id)) continue;
      // An entry of another step (a pendant among the characters, a forest among the objects) waits for its own step.
      const rawKind = String(raw.kind ?? "").toLowerCase();
      if (rawKind && !kinds.includes(rawKind) && ["character", "creature", "object", "location"].includes(rawKind)) continue;
      const kind = (kinds.includes(rawKind) ? rawKind : kinds[0]) as BibleCandidate["kind"];
      const seconds = [...new Set((Array.isArray(raw.seconds) ? raw.seconds : []).map(Number).filter(Number.isFinite).map(nearest))].sort((a, b) => a - b);
      const best = [...new Set((Array.isArray(raw.best_seconds) ? raw.best_seconds : []).map(Number).filter(Number.isFinite).map(nearest))].slice(0, 3);
      candidates.push({
        id,
        name: raw.name.trim(),
        kind,
        must_keep: String(raw.must_keep ?? "").trim() || raw.name.trim(),
        description: String(raw.description ?? "").trim(),
        seconds,
        best_seconds: best.length ? best : seconds.slice(0, 3),
        importance: raw.importance === "main" || raw.importance === "minor" ? raw.importance : "secondary",
        ...(typeof raw.scale === "string" && raw.scale.trim() ? { scale: raw.scale.trim() } : {}),
      });
    }
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
    return Response.json({ candidates, sampled: seen.length ? Math.min(MAX_SAMPLES, context.frames.length) : 0, cost_usd: usd });
  } catch (error) {
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
    return Response.json({ error: error instanceof Error ? error.message : "detection failed" }, { status: 502 });
  }
}
