import sharp from "sharp";
import { recordCost } from "@/lib/webtoon/cost-server";
import { GUIDE_WINDOW, SEQUENCE_KINDS, cleanWindow, type GuideBeat, type GuideSequence } from "@/lib/webtoon/film-guide";
import { getProjectContext, imageAsDataUrl } from "@/lib/webtoon/project-server";
import { completeJson, type UserPart } from "@/lib/webtoon/providers/gateway-text";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";

/**
 * POST /api/webtoon/<slug>/guide: reads one window of the film for the film
 * guide (`lib/webtoon/film-guide.ts`). Body: { from: seconds, previous?:
 * { sequence, beats } } with the last sequence and the last lines already
 * in the guide, so the reading goes on from where it stopped. Answers the
 * window's lines (one per second) and sequences, cleaned, and where the next
 * window starts. The studio calls it window after window and saves the guide.
 */

export const maxDuration = 120;

type RouteContext = { params: Promise<{ slug: string }> };

/** A small JPEG of a frame: twenty of them in one request, read for what happens, not for detail. */
async function small(src: string, width = 384): Promise<string> {
  const data = await imageAsDataUrl(src);
  const bytes = await sharp(Buffer.from(data.split(",")[1], "base64")).resize({ width, withoutEnlargement: true }).jpeg({ quality: width > 400 ? 82 : 72 }).toBuffer();
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

/**
 * The close re-reading of one action or tension sequence: its frames large (640 px), a few at a time,
 * looked at for every gesture a quick reading misses (an arm flung out to throw, a fist coming down, a
 * fall, an object leaving a hand). Answers the lines of those seconds and the list of gestures.
 */
/** One second of dense frames side by side (four quarter-second frames, left to right): read like a flip-book. */
async function strip(frames: { src: string }[]): Promise<string> {
  const parts = await Promise.all(
    frames.map(async (f) => {
      const data = await imageAsDataUrl(f.src);
      return sharp(Buffer.from(data.split(",")[1], "base64")).resize({ width: 320, height: 180, fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
    }),
  );
  const out = await sharp({ create: { width: 320 * parts.length, height: 180, channels: 3, background: "#000" } })
    .composite(parts.map((input, i) => ({ input, left: i * 320, top: 0 })))
    .jpeg({ quality: 80 })
    .toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}

async function readDetail(
  detail: { from: number; to: number; kind?: string; summary?: string; cast?: { name: string; looks: string }[]; frames?: { src: string; seconds: number }[]; before?: string[] },
  context: NonNullable<Awaited<ReturnType<typeof getProjectContext>>>,
  slug: string,
  idToken: string | null | undefined,
) {
  const from = Math.max(0, Math.round(Number(detail.from) || 0));
  const to = Math.min(from + 24, Math.round(Number(detail.to) || from));
  const SRC = /^(\/[\w./%-]+\.(jpe?g|png|webp)|https:\/\/firebasestorage\.googleapis\.com\/\S+)$/i;
  const dense = (Array.isArray(detail.frames) ? detail.frames : [])
    .filter((f) => f && typeof f.src === "string" && SRC.test(f.src) && Number.isFinite(Number(f.seconds)) && f.seconds >= from && f.seconds < to + 1)
    .map((f) => ({ src: f.src, seconds: Number(f.seconds) }))
    .sort((a, b) => a.seconds - b.seconds);
  // Each second of the stretch: a strip of its four dense frames, or its one frame when there are no dense frames.
  const seconds: { seconds: number; frames: { src: string }[] }[] = [];
  for (let sec = from; sec <= to; sec += 1) {
    const quarter = dense.filter((f) => Math.floor(f.seconds + 0.001) === sec);
    const single = context.frames.find((f) => f.seconds === sec);
    if (quarter.length) seconds.push({ seconds: sec, frames: quarter });
    else if (single) seconds.push({ seconds: sec, frames: [single] });
  }
  if (!seconds.length) return Response.json({ beats: [], gestures: [] });
  const tc = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  let usd = 0;
  try {
    const images: UserPart[][] = await Promise.all(
      seconds.map(async (s): Promise<UserPart[]> => [
        { type: "text", text: s.frames.length > 1 ? `Second ${s.seconds} (${tc(s.seconds)}): ${s.frames.length} frames a quarter of a second apart, left to right:` : `Second ${s.seconds} (${tc(s.seconds)}):` },
        { type: "image_url", image_url: { url: s.frames.length > 1 ? await strip(s.frames) : await small(s.frames[0].src, 640) } },
      ]),
    );
    // Gestures only, with a short instruction: asking for a line per second as well diluted the reading
    // (the blows on the ground became "reaching for the pendant"). The quick reading keeps its lines.
    // Three readings in parallel, a gesture kept when two of them see it (same kind, within a second):
    // one reading alone swings between a throw and a fall on the same strips.
    const read = () =>
      completeJson<{ gestures?: { seconds?: unknown; gesture?: unknown; kind?: unknown }[] }>({
        system:
          "You watch a passage of an animated film, second by second, to list the gestures a webtoon adaptation must show. The CAST describes each character at rest; the images show their state now (a helmet may be off, leaving a dark round opening at the neck: that opening is not a helmet, and a helmet lying on the ground is not a lantern). Report only what the images show. Answer with JSON only.",
        user: [
          ...(detail.cast?.length ? [{ type: "text" as const, text: `CAST (at rest): ${detail.cast.slice(0, 8).map((c) => `${c.name}: ${String(c.looks).slice(0, 300)}`).join(" | ")}` }] : []),
          ...(detail.before?.length ? [{ type: "text" as const, text: `JUST BEFORE: ${detail.before.slice(-4).join(" | ")}` }] : []),
          ...images.flat(),
          {
            type: "text",
            text: `${dense.length ? "Each strip is one second of film, read left to right like a flip-book: the MOVEMENT is what changes across its four frames. " : ""}List every gesture of this passage in order: a throw (an arm swung out, an object leaving the hand), a blow (a fist coming down on the ground or on someone: each blow counts), a fall, an object dropped or taken, someone appearing or leaving, a sudden movement. JSON only: {"gestures": [{"seconds" (an integer), "gesture" (French, short), "kind" (throw, blow, fall, take, drop, open, appear, leave, move or other)}]}`,
          },
        ],
        maxTokens: 3000,
        reasoning: "none",
        temperature: 0.2,
        onCost: (value) => {
          usd += value;
        },
      }).catch(() => ({ gestures: [] }));
    const readings = await Promise.all([read(), read(), read()]);
    const KINDS = new Set(["throw", "blow", "fall", "take", "drop", "open", "appear", "leave", "move", "other"]);
    const norm = (list: { seconds?: unknown; gesture?: unknown; kind?: unknown }[] | undefined) =>
      (list ?? [])
        .map((g) => ({ seconds: Math.round(parseFloat(String(g.seconds))), gesture: String(g.gesture ?? "").trim(), kind: KINDS.has(String(g.kind)) ? String(g.kind) : "other" }))
        .filter((g) => Number.isFinite(g.seconds) && g.gesture);
    const all = readings.map((r) => norm(r.gestures));
    const kept: { seconds: number; gesture: string; kind: string }[] = [];
    for (const [i, list] of all.entries()) {
      for (const g of list) {
        const votes = 1 + all.filter((other, j) => j !== i && other.some((o) => o.kind === g.kind && Math.abs(o.seconds - g.seconds) <= 1)).length;
        if (votes >= 2 && !kept.some((k) => k.kind === g.kind && Math.abs(k.seconds - g.seconds) <= 1)) kept.push(g);
      }
    }
    const answer = { gestures: kept.sort((x, y) => x.seconds - y.seconds) };
    void recordCost({ idToken: idToken ?? null, slug, usd, kind: "writer" });
    return Response.json({ beats: [], gestures: answer.gestures ?? [], from, to, dense: dense.length, cost_usd: usd });
  } catch (error) {
    void recordCost({ idToken: idToken ?? null, slug, usd, kind: "writer" });
    return Response.json({ error: error instanceof Error ? error.message : "relecture impossible" }, { status: 502 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  if (!process.env.AI_GATEWAY_API_KEY) return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  if (!context.frames.length) return Response.json({ error: "Ce projet n'a pas encore d'images du film." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as {
    from?: number;
    previous?: { sequence?: GuideSequence; beats?: GuideBeat[] };
    detail?: { from: number; to: number; kind?: string; summary?: string; cast?: { name: string; looks: string }[]; frames?: { src: string; seconds: number }[]; before?: string[] };
  };
  if (body.detail) return readDetail(body.detail, context, slug, identity.idToken);
  const from = Math.max(0, Math.round(Number(body.from) || 0));
  const frames = context.frames.filter((f) => f.seconds >= from).slice(0, GUIDE_WINDOW);
  if (!frames.length) return Response.json({ done: true, beats: [], sequences: [], next: from });
  const to = frames[frames.length - 1].seconds;
  const duration = context.frames[context.frames.length - 1].seconds;

  const previous = body.previous?.sequence
    ? `The guide so far ends with this sequence: ${JSON.stringify({ from: body.previous.sequence.from, to: body.previous.sequence.to, kind: body.previous.sequence.kind, intensity: body.previous.sequence.intensity, title: body.previous.sequence.title, summary: body.previous.sequence.summary })}. Its last lines: ${(body.previous.beats ?? []).slice(-3).map((b) => `${b.seconds} s: ${b.what}`).join(" | ")}.`
    : "This is the start of the film.";

  const system = [
    `You read a film, "${context.script.series}"${context.lostGarden ? ", an original dark fantasy anime" : ""}, one frame per second, to write the guide its webtoon adaptation will follow. The frames are consecutive: frame n+1 is one second after frame n, so you can see what moves, appears, disappears or changes between two frames.`,
    "For EVERY frame given, write one line: `what` is what the frame shows in one short concrete sentence (who, doing what, where, what is in the hands); `change` is what changed since the frame just before (a gesture, a new character, an object taken or thrown, a cut to another shot or place, an effect, the light), or \"rien\" when it is the same still image.",
    `Then cut the window into SEQUENCES: stretches of film of one nature. kind is one of ${SEQUENCE_KINDS.join(", ")}: action (fight, chase, fall, impact, fast movement: needs many dynamic panels), tension (threat, suspense, something about to happen), dialogue (characters speaking, subtitles), calm (quiet ordinary moment), contemplation (a character or the camera looks at a place, a landscape, a slow breathing moment: few large panels), transition (passing from one place or time to another), flashback (a memory, often black and white), title (a title card, a logo, text on black). intensity from 1 (still) to 5 (peak of the film). title is a short name in French, summary tells what happens in the sequence in one or two French sentences, place is where, characters who is there.`,
    "A sequence starts where the nature of the scene changes (a calm walk that turns into a chase is two sequences), never at a mere cut, a new angle or a fade: a sequence usually lasts ten seconds or more, and a window of twenty seconds rarely holds more than two. A very short burst keeps its own sequence only when it is an action (a fall, a blow) or a title. Sequences tile the window with no gap: the first starts at the first frame, the last ends at the last frame. Set continues_previous to true when the first sequence of this window is the same sequence as the last one of the guide so far (same nature, same action going on).",
    'Answer with JSON only: {"beats": [{"seconds", "what", "change"}], "sequences": [{"from", "to", "kind", "intensity", "title", "summary", "place", "characters"}], "continues_previous": true|false}. The lines in French. Escape double quotes inside strings.',
  ].join("\n\n");

  let usd = 0;
  try {
    const images: UserPart[][] = await Promise.all(
      frames.map(async (frame): Promise<UserPart[]> => [
        { type: "text", text: `${frame.seconds} s (${frame.label})` },
        { type: "image_url", image_url: { url: await small(frame.src) } },
      ]),
    );
    const user: UserPart[] = [
      { type: "text", text: previous },
      ...(context.screenplay ? [{ type: "text" as const, text: `The screenplay, for names and context (the frames win for what is visible):\n${context.screenplay.slice(0, 12000)}` }] : []),
      { type: "text", text: `Frames from ${from} s to ${to} s:` },
      ...images.flat(),
      { type: "text", text: `Write the ${frames.length} lines and the sequences of this window now, as JSON.` },
    ];
    const raw = await completeJson<{ beats?: unknown[]; sequences?: unknown[]; continues_previous?: unknown }>({
      system,
      user,
      maxTokens: 8000,
      reasoning: "none",
      temperature: 0.2,
      onCost: (value) => {
        usd += value;
      },
    });
    const window = cleanWindow(raw, frames[0].seconds, to);
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
    return Response.json({ ...window, from: frames[0].seconds, to, next: to + 1, duration, done: to >= duration, cost_usd: usd });
  } catch (error) {
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
    return Response.json({ error: error instanceof Error ? error.message : "lecture du film impossible" }, { status: 502 });
  }
}
