import sharp from "sharp";
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
 * again, and so an object is told apart from a character. What the author's
 * other projects hold (`previous`, with their sheets) is given too: an entry
 * that is one of them comes back with `same_as`, so its sheet is reused.
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

/** A sheet of an earlier project, small: fourteen of them go with the merge call. */
async function smallSheet(src: string): Promise<string> {
  const data = await imageAsDataUrl(src);
  const bytes = await sharp(Buffer.from(data.split(",")[1], "base64")).resize({ width: 512, withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 75 }).toBuffer();
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

function sample<T>(list: readonly T[], max: number): T[] {
  if (list.length <= max) return [...list];
  const step = list.length / max;
  return Array.from({ length: max }, (_, i) => list[Math.floor(i * step)]);
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  if (!process.env.AI_GATEWAY_API_KEY) return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as {
    step?: BibleStep;
    known?: { id: string; name: string; kind: string; must_keep?: string }[];
    previous?: { id: string; name: string; kind: string; must_keep?: string; project?: string; image?: string }[];
    /** "Rapprocher": candidates already detected, matched against the earlier projects only (no new detection). */
    match?: { id: string; name: string; kind: string; must_keep?: string; description?: string; frames?: string[] }[];
  };
  if (Array.isArray(body.match)) return matchCandidates(body, slug, identity.idToken);
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const step: BibleStep = body.step === "objects" || body.step === "locations" ? body.step : "characters";
  const known = (Array.isArray(body.known) ? body.known : []).slice(0, 60).map((k) => ({ id: k.id, name: k.name, kind: k.kind, looks: String(k.must_keep ?? "").slice(0, 160) }));
  const stepKinds = step === "characters" ? ["character"] : step === "objects" ? ["object"] : ["location"];
  const previous = (Array.isArray(body.previous) ? body.previous : [])
    .filter((p) => p && typeof p.id === "string" && stepKinds.includes(String(p.kind)))
    .slice(0, 40)
    .map((p) => ({ id: p.id, name: String(p.name ?? ""), project: String(p.project ?? ""), looks: String(p.must_keep ?? "").slice(0, 400), image: typeof p.image === "string" ? p.image : "" }));
  const previousIds = new Set(previous.map((p) => p.id));
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
        previous.length
          ? "EARLIER PROJECTS of the same author (other episodes, other webtoons) already have these entries, with their sheets shown as images. When an entry you write is the same being, object or place as one of them (the same design, even described with other words: a knight with a lantern-shaped helmet IS the earlier knight with a lantern-shaped helmet), set `same_as` to that earlier entry's id and use its name. Only for a real match of design; never force one."
          : "",
        `Only entries of this step: ${step === "characters" ? "`kind` character or creature" : step === "objects" ? "`kind` object" : "`kind` location"}; leave out everything else, it has its own step. Order the entries by importance, the main ones first. Answer with JSON only: {"candidates": [...]}. Escape double quotes inside strings.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      user: [
        {
          type: "text" as const,
          text: [
            synopsis ? `SYNOPSIS:\n${synopsis}` : "",
            seen.length ? `WHAT THE READERS SAW:\n${JSON.stringify(seen.map(({ group, ...s }) => ({ ...s, group })), null, 1)}` : "",
            !seen.length && screenplay ? `SCREENPLAY:\n${screenplay}` : "",
            previous.length ? `EARLIER PROJECTS' ENTRIES:\n${JSON.stringify(previous.map(({ image, ...p }) => ({ ...p, has_sheet: Boolean(image) })), null, 1)}` : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
        // Their sheets, so a match is made on the design and not on the words.
        ...(
          await Promise.all(
            previous
              .filter((p) => p.image)
              .slice(0, 14)
              .map(async (p): Promise<UserPart[]> => {
                try {
                  return [
                    { type: "text", text: `Sheet of the earlier entry ${p.id} (${p.name}, from ${p.project}):` },
                    { type: "image_url", image_url: { url: await smallSheet(p.image) } },
                  ];
                } catch {
                  return [];
                }
              }),
          )
        ).flat(),
      ],
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
        ...(typeof raw.same_as === "string" && previousIds.has(raw.same_as) ? { same_as: raw.same_as } : {}),
      });
    }
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
    return Response.json({ candidates, sampled: seen.length ? Math.min(MAX_SAMPLES, context.frames.length) : 0, cost_usd: usd });
  } catch (error) {
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
    return Response.json({ error: error instanceof Error ? error.message : "detection failed" }, { status: 502 });
  }
}


/**
 * "Rapprocher": which of the candidates already detected are someone or something of the author's
 * earlier projects. One call with the candidates (their design lock and a frame of each) and the
 * earlier entries (their sheet); answers { matches: { <candidate id>: <earlier asset id> } }.
 */
async function matchCandidates(
  body: { match?: { id: string; name: string; kind: string; must_keep?: string; description?: string; frames?: string[] }[]; previous?: { id: string; name: string; kind: string; must_keep?: string; project?: string; image?: string }[] },
  slug: string,
  idToken: string | null | undefined,
) {
  const candidates = (body.match ?? []).slice(0, 40);
  const previous = (Array.isArray(body.previous) ? body.previous : []).slice(0, 40);
  if (!candidates.length || !previous.length) return Response.json({ matches: {} });
  const ids = new Set(previous.map((p) => p.id));
  let usd = 0;
  try {
    const parts: UserPart[] = [
      {
        type: "text",
        text: `NEW PROJECT'S CANDIDATES:\n${JSON.stringify(candidates.map((c) => ({ id: c.id, name: c.name, kind: c.kind, looks: String(c.must_keep ?? "").slice(0, 400), story: c.description ?? "" })), null, 1)}\n\nEARLIER PROJECTS' ENTRIES:\n${JSON.stringify(previous.map((p) => ({ id: p.id, name: p.name, kind: p.kind, project: p.project, looks: String(p.must_keep ?? "").slice(0, 400) })), null, 1)}`,
      },
    ];
    for (const c of candidates) {
      const frame = (c.frames ?? []).find((f) => typeof f === "string");
      if (!frame) continue;
      try {
        parts.push({ type: "text", text: `A frame of the new film showing candidate ${c.id} (${c.name}):` }, { type: "image_url", image_url: { url: await smallSheet(frame) } });
      } catch {
        // No frame: the words decide.
      }
    }
    for (const p of previous.filter((x) => x.image).slice(0, 16)) {
      try {
        parts.push({ type: "text", text: `Sheet of the earlier entry ${p.id} (${p.name}):` }, { type: "image_url", image_url: { url: await smallSheet(p.image!) } });
      } catch {
        // No sheet: the words decide.
      }
    }
    const answer = await completeJson<{ matches?: { candidate?: string; earlier?: string }[] }>({
      system:
        'You match the characters, objects or places detected in a new film of an author with the ones of the author\'s earlier projects (other episodes of the same series, other webtoons). A candidate matches an earlier entry when it is the same being, object or place: the same design, even described with other words or seen from another angle (a knight with a lantern-shaped helmet is the earlier knight with a lantern-shaped helmet). Never match two different beings that merely look alike in kind (two different knights). Answer with JSON only: {"matches": [{"candidate": "<candidate id>", "earlier": "<earlier entry id>"}]}, only the real matches.',
      user: [...parts, { type: "text", text: "The matches, as JSON." }],
      maxTokens: 3000,
      reasoning: "none",
      temperature: 0,
      onCost: (value) => {
        usd += value;
      },
    });
    const matches: Record<string, string> = {};
    for (const m of answer.matches ?? []) if (m?.candidate && m.earlier && ids.has(m.earlier) && candidates.some((c) => c.id === m.candidate)) matches[m.candidate] = m.earlier;
    void recordCost({ idToken: idToken ?? null, slug, usd, kind: "writer" });
    return Response.json({ matches, cost_usd: usd });
  } catch (error) {
    void recordCost({ idToken: idToken ?? null, slug, usd, kind: "writer" });
    return Response.json({ error: error instanceof Error ? error.message : "rapprochement impossible" }, { status: 502 });
  }
}
