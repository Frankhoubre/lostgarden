import { cleanFrame, panelsFromIntents, type NextPanelIntent } from "@/lib/webtoon/continue";
import { recordCost } from "@/lib/webtoon/cost-server";
import { completeJson } from "@/lib/webtoon/providers/gateway-text";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { studioFilmFrames } from "@/lib/webtoon/studio-assets";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { LibraryOverlay, PanelFrame, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/polish
 * Body: { panels: WebtoonPanel[], library?: LibraryOverlay, max_inserts?: number }
 *
 * A layout pass over the whole strip, text only: the model reads every
 * panel (what it shows, its shot, its role, its size) and answers with a
 * `frame` for each one (width, side, shape, overlap, tilt) so the strip
 * reads like a real webtoon, plus the connective panels the story is
 * missing (an establishing view, an insert, a reaction) as intents placed
 * after an existing panel. The engine turns those into full panels; the
 * studio then generates their images. No image is made here.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };

type PolishAnswer = {
  frames?: Record<string, PanelFrame>;
  inserts?: (NextPanelIntent & { after?: string })[];
};

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const script = getWebtoonScript(slug);
  if (!script) return Response.json({ error: "unknown webtoon script" }, { status: 404 });
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { panels?: WebtoonPanel[]; library?: LibraryOverlay; max_inserts?: number };
  const panels = Array.isArray(body.panels) && body.panels.length ? body.panels : script.panels;
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [] } : null;
  const maxInserts = Math.max(0, Math.min(20, Math.round(Number(body.max_inserts ?? 10))));

  const summary = panels.map((p) => ({
    id: p.panel_id,
    order: p.order,
    seconds: p.source_time_start,
    shot: p.shot_type,
    angle: p.camera_angle,
    role: p.narrative_role,
    fidelity: p.fidelity,
    aspect: p.aspect_ratio,
    height: p.panel_height,
    transition: p.transition_type,
    background: p.background,
    characters: p.characters,
    location: p.location,
    title_card: p.caption.find((c) => c.style === "title")?.text.en,
    sfx: p.sfx.map((s) => s.text.en),
    description: p.description.split("STATE TO KEEP EXACTLY:")[0].trim().slice(0, 220),
    frame: p.frame ?? null,
  }));

  const system = [
    `You are the layout editor of "${script.series}", episode ${script.episode}, a vertical webtoon read on a phone. You receive the whole strip as a list of panels in reading order. Two jobs.`,
    "1. LAYOUT. Give every panel a `frame`: `width` in percent of the strip (40 to 100), `align` (left, center, right), `shape` (rect, rounded, slant, slant-reverse, wedge, wedge-reverse), `overlap` in px over the panel above (0, or 60 to 300), `tilt` in degrees (-6 to 6), `shadow` (true or false). Rules of thumb of a real webtoon: a landscape, a reveal, a title card is full width (100, rect or wedge, no overlap); a detail, an insert or a reaction is narrow (50 to 72) pushed left or right, often overlapping the big panel above by 100 to 200 px, rounded or slanted; two or three narrow panels in a row alternate sides like a zigzag; an impact gets slant edges and a tilt of 2 to 4 degrees; a quiet or sad moment gets a centered rounded panel (80 to 88) with margins; never two identical frames in a row when the mood changes; keep full width for at most half of the panels. A panel that overlaps must not hide the faces or the lettering of the one above: overlap only wide, calm panels.",
    `2. CONNECTIONS. Find the places where a reader could lose the thread: a jump of place, of subject or of direction between two panels, an action whose cause or consequence is not shown, a look whose object is not shown. Propose at most ${maxInserts} connective panels there, the fewest that make the story flow: an establishing view, an insert on what the character looks at, a reaction, a step, a hand, a detail of the place, a sound in the dark. Each is an intent with \`after\` set to the id of the panel it goes after, and: seconds (the film timecode it belongs to, same as its neighbours), description (one or two precise sentences, with the state of the characters: helmet on or off, kneeling, headless), state, action, emotion, purpose, characters (ids: lanterne, rose), location (blue-forest, altar-sanctuary, white-lily-field), shot_type, camera_angle, composition, aspect_ratio, panel_height, frame, narrative_role, transition_type, fidelity (bridge), background, sfx (optional: {style, en, fr, size, rotate}). Never invent an action or a change of state that the neighbouring panels do not imply; a connective panel shows the same moment from another distance or the surroundings.`,
    `Continuity of the series: ${script.source.continuity.join(" ")}`,
    'Answer with JSON only: {"frames": {"<panel id>": {width, align, shape, overlap, tilt, shadow}, ...}, "inserts": [ {after, seconds, description, state, action, emotion, purpose, characters, location, shot_type, camera_angle, composition, aspect_ratio, panel_height, frame, narrative_role, transition_type, fidelity, background, sfx} ]}. Every panel id must appear in frames. Escape double quotes inside strings.',
  ].join("\n\n");

  const meter = { usd: 0 };
  try {
    const answer = await completeJson<PolishAnswer>({
      system,
      user: `The strip, in reading order (${panels.length} panels):\n${JSON.stringify(summary, null, 1)}`,
      maxTokens: 24000,
      reasoning: "none",
      onCost: (usd) => {
        meter.usd += usd;
      },
    });
    const frames: Record<string, PanelFrame> = {};
    for (const [id, value] of Object.entries(answer.frames ?? {})) {
      const frame = cleanFrame(value);
      if (frame && panels.some((p) => p.panel_id === id)) frames[id] = frame;
    }
    const filmFrames = studioFilmFrames();
    const inserts: { after: string; panel: WebtoonPanel }[] = [];
    let current = panels;
    for (const intent of (answer.inserts ?? []).slice(0, maxInserts)) {
      const after = typeof intent.after === "string" && panels.some((p) => p.panel_id === intent.after) ? intent.after : null;
      if (!after) continue;
      const anchor = panels.find((p) => p.panel_id === after)!;
      const seconds = Number.isFinite(Number(intent.seconds)) ? Number(intent.seconds) : (anchor.source_time_start ?? 0);
      const made = panelsFromIntents(current, [{ ...intent, seconds }], filmFrames, script, overlay);
      if (!made.length) continue;
      const panel = { ...made[0], location: made[0].location || anchor.location, background: anchor.background, beat_id: anchor.beat_id };
      inserts.push({ after, panel });
      current = [...current, panel];
    }
    void recordCost({ idToken: identity.idToken, slug, usd: meter.usd, kind: "writer" });
    return Response.json({ frames, inserts, cost_usd: meter.usd });
  } catch (error) {
    void recordCost({ idToken: identity.idToken, slug, usd: meter.usd, kind: "writer" });
    const message = error instanceof Error ? error.message : "polish failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
