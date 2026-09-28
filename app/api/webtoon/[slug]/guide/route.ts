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
async function small(src: string): Promise<string> {
  const data = await imageAsDataUrl(src);
  const bytes = await sharp(Buffer.from(data.split(",")[1], "base64")).resize({ width: 384, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  if (!process.env.AI_GATEWAY_API_KEY) return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  if (!context.frames.length) return Response.json({ error: "Ce projet n'a pas encore d'images du film." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { from?: number; previous?: { sequence?: GuideSequence; beats?: GuideBeat[] } };
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
