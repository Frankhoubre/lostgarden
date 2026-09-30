import sharp from "sharp";
import { recordCost } from "@/lib/webtoon/cost-server";
import { completeJson, type UserPart } from "@/lib/webtoon/providers/gateway-text";
import { getProjectContext, imageAsDataUrl } from "@/lib/webtoon/project-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import { splitScreenplay, type FilmReadFrame, type ScriptScene } from "@/lib/webtoon/story";

/**
 * POST /api/webtoon/<slug>/story
 * - { action: "scenes", sequences, cast }: the screenplay of the project cut into its scenes, each placed on
 *   the film (from the sequences of the film guide), with its summary, its characters and its lines.
 * - { action: "read", frames, cast }: twenty seconds of the film read for the subtitle on screen and the
 *   characters seen at each second.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };
type Sequence = { from: number; to: number; title: string; summary: string; place?: string; characters?: string[] };

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; sequences?: Sequence[]; cast?: { id: string; name: string; looks?: string }[]; frames?: { seconds: number; src: string }[] };
  const cast = (body.cast ?? []).slice(0, 30);
  let usd = 0;
  const onCost = (value: number) => {
    usd += value;
  };

  try {
    if (body.action === "scenes") {
      if (!context.screenplay.trim()) return Response.json({ error: "Ce projet n'a pas de scénario." }, { status: 400 });
      const parts = splitScreenplay(context.screenplay);
      if (!parts.length) return Response.json({ error: "Le scénario n'a pas pu être découpé en scènes." }, { status: 400 });
      const sequences = (body.sequences ?? []).slice(0, 300);
      const answer = await completeJson<{ scenes?: { index?: number; first?: number | null; last?: number | null; summary?: string; characters?: string[]; lines?: { speaker?: string; text?: string }[] }[] }>({
        system: [
          "You align a screenplay with the film made from it, scene by scene, like a script supervisor.",
          "The film is given as its numbered SEQUENCES, in film order (number, seconds, title, summary, place, characters). For each scene of the screenplay (index, slugline, text), give `first` and `last`: the numbers of the first and last sequence that tell it; null for both when the film does not tell it (a scene cut from the film). Read the whole screenplay first: the scenes follow the film's order, so the sequence numbers go forward from one scene to the next, except for a flashback or a vision the screenplay places elsewhere. Match on what happens, the place and the characters, not on a single word.",
          "`summary`: what happens, one short French sentence. `characters`: the ids of the cast who appear (from the cast list). `lines`: every line of dialogue the scene has, in order, as written, with `speaker` the cast id when it is one of them, else the name written in the screenplay; voice-overs included, stage directions never.",
          'Answer with JSON only: {"scenes": [{"index", "first", "last", "summary", "characters", "lines": [{"speaker", "text"}]}]}. Include every index.',
        ].join("\n\n"),
        user: JSON.stringify({ cast: cast.map((c) => ({ id: c.id, name: c.name })), sequences: sequences.map((q, n) => ({ n, from: Math.round(q.from), to: Math.round(q.to), title: q.title, summary: q.summary, place: q.place, characters: q.characters })), scenes: parts.map((p) => ({ index: p.index, slugline: p.heading, page: p.page, text: p.text.slice(0, 2500) })) }, null, 1),
        maxTokens: 16000,
        reasoning: "low",
        temperature: 0,
        onCost,
      });
      void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
      const byIndex = new Map((answer.scenes ?? []).map((s) => [Number(s.index), s]));
      const seq = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < sequences.length ? v : null);
      let scenes: ScriptScene[] = parts.map((part) => {
        const found = byIndex.get(part.index);
        const first = seq(found?.first);
        const last = seq(found?.last) ?? first;
        const a = first !== null ? sequences[first] : null;
        const b = last !== null ? sequences[Math.max(first ?? last, last)] : null;
        return {
          ...part,
          from: a ? Math.round(a.from) : null,
          to: b ? Math.round(b.to) : null,
          summary: String(found?.summary ?? "").slice(0, 300),
          characters: (found?.characters ?? []).filter((c) => typeof c === "string").slice(0, 12),
          lines: (found?.lines ?? []).filter((l) => l?.text?.trim()).map((l) => ({ speaker: String(l.speaker ?? "").slice(0, 40), text: String(l.text).trim().slice(0, 400) })),
        };
      });
      // The film may tell the scenes in another order than the screenplay (the fall after the tavern in
      // episode 1): a scene placed before the one it follows is flagged, never moved.
      let latest = -1;
      scenes = scenes.map((scene) => {
        if (scene.from === null) return scene;
        const reordered = scene.from < latest - 5;
        latest = Math.max(latest, scene.from);
        return reordered ? { ...scene, reordered: true } : scene;
      });
      return Response.json({ scenes, cost_usd: usd });
    }

    if (body.action === "read") {
      const frames = (body.frames ?? []).slice(0, 24);
      if (!frames.length) return Response.json({ frames: [], cost_usd: 0 });
      const images = await Promise.all(
        frames.map(async (f) => {
          try {
            const data = await imageAsDataUrl(f.src);
            const out = await sharp(Buffer.from(data.slice(data.indexOf(",") + 1), "base64")).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
            return `data:image/jpeg;base64,${out.toString("base64")}`;
          } catch {
            return null;
          }
        }),
      );
      const parts: UserPart[] = [{ type: "text", text: `CAST (id: what they look like):\n${cast.map((c) => `${c.id}: ${c.name}${c.looks ? `, ${c.looks.slice(0, 220)}` : ""}`).join("\n")}` }];
      frames.forEach((f, i) => {
        if (!images[i]) return;
        parts.push({ type: "text", text: `Second ${f.seconds}:` });
        parts.push({ type: "image_url", image_url: { url: images[i]! } });
      });
      parts.push({ type: "text", text: "Read every frame now, as JSON." });
      const answer = await completeJson<{ frames?: { seconds?: number; subtitle?: string; characters?: string[] }[] }>({
        system: [
          "You read frames of an animated film, one per second, for a continuity log.",
          "For each frame: `subtitle`, the subtitle burned into the image (usually white text at the bottom), copied word for word in its language, empty when there is none; `characters`, the ids of the cast visible in the frame (even small, from behind or partly hidden), from the cast list only; an empty list when none of them is visible.",
          'Answer with JSON only: {"frames": [{"seconds", "subtitle", "characters"}]}, one entry per frame, in order.',
        ].join("\n\n"),
        user: parts,
        maxTokens: 3000,
        reasoning: "none",
        temperature: 0,
        onCost,
      });
      void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
      const ids = new Set(cast.map((c) => c.id));
      const bySecond = new Map((answer.frames ?? []).map((f) => [Number(f.seconds), f]));
      const out: FilmReadFrame[] = frames.map((f) => {
        const found = bySecond.get(f.seconds);
        const sub = String(found?.subtitle ?? "").trim();
        return { s: f.seconds, ...(sub ? { sub: sub.slice(0, 300) } : {}), who: (found?.characters ?? []).filter((c) => ids.has(c)) };
      });
      return Response.json({ frames: out, cost_usd: usd });
    }
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "story failed" }, { status: 502 });
  }
  return Response.json({ error: "unknown action" }, { status: 400 });
}
