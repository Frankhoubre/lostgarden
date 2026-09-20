import { readFile } from "node:fs/promises";
import path from "node:path";
import { panelsFromIntents, type NextPanelIntent } from "@/lib/webtoon/continue";
import { completeJson, type UserPart } from "@/lib/webtoon/providers/gateway-text";
import { libraryCharacters, libraryLocations, libraryWith } from "@/lib/webtoon/references";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { STUDIO_SCREENPLAY, studioFilmFrames } from "@/lib/webtoon/studio-assets";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { LibraryOverlay, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/continue
 * Body: { count: number, panels: WebtoonPanel[] }
 *
 * Writes the next `count` panels of the strip. The writer model (Claude
 * Sonnet 5 through Vercel AI Gateway) sees the frames of the film that
 * follow the last adapted second, the screenplay, the continuity facts and
 * the last panels, and answers with panel intents. The engine turns them
 * into full panels with their references and prompts; the studio then
 * generates the images and the other languages. No image is made here.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };

const MAX_COUNT = 30;
const MAX_FRAMES = 32;

async function frameAsDataUrl(src: string): Promise<string> {
  const bytes = await readFile(path.join(process.cwd(), "public", src));
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const script = getWebtoonScript(slug);
  if (!script) return Response.json({ error: "unknown webtoon script" }, { status: 404 });
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { count?: number; panels?: WebtoonPanel[]; library?: LibraryOverlay };
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [] } : null;
  const library = libraryWith(overlay);
  const count = Math.max(1, Math.min(MAX_COUNT, Math.round(Number(body.count) || 10)));
  const current = Array.isArray(body.panels) && body.panels.length ? body.panels : script.panels;
  const adaptedUntil = Math.max(0, ...current.map((p) => p.source_time_end ?? 0));
  const frames = studioFilmFrames().filter((f) => f.seconds > adaptedUntil).slice(0, Math.min(MAX_FRAMES, Math.max(12, count * 2)));
  if (!frames.length) return Response.json({ error: "Fin de l'épisode : il n'y a plus d'image du film après la dernière case" }, { status: 400 });

  const tail = current.slice(-4).map((p) => ({
    panel_id: p.panel_id,
    seconds: p.source_time_start,
    description: p.description,
    characters: p.characters,
    location: p.location,
    shot_type: p.shot_type,
    background: p.background,
    dialogue: p.dialogue.map((d) => `${d.speaker}: ${d.text.en}`),
  }));
  const locations = libraryLocations(overlay).map((l) => {
    const asset = library.find((a) => a.id === `loc.${l.id}`);
    return `${l.id}: ${asset?.must_keep ?? l.name}`;
  });
  const characters = libraryCharacters(overlay).map((c) => {
    const sheet = library.find((a) => a.kind === "character" && a.subject === c.id);
    return `${c.id} (${c.name}): ${sheet?.must_keep ?? ""}`;
  });

  const system = [
    `You are the adaptation engine of "${script.series}", an original poetic dark fantasy anime by Frank Houbre, being redrawn as a vertical Korean-style webtoon read on a phone. Episode ${script.episode}. You write the NEXT ${count} panels of the strip, continuing exactly where it stops.`,
    "You receive: the last panels already made (for continuity), frames of the finished episode taken every five seconds after the adapted segment (each labelled with its timecode), and the screenplay of the episode in French.",
    "Method: read the frames in order and follow the film, and read the screenplay to understand what is happening between two frames (a frame every five seconds misses the action itself). Each panel draws from one frame: give its timecode in `seconds`. Do not invent actions that are not in the film or the screenplay. Cover the film continuously: the panels must run forward in time, without going back, and the last panel must land on the frame where the next call should continue.",
    "Decompose every physical event. When the film or the screenplay has an impact, a fall, an object that drops or rolls, a door, a hand that grabs, a reveal, never leave it to one panel: tell it in two to four panels so the reader understands what happened without words. Typical breakdown: the cause (a detail: the low branch ahead of him), the impact (an extreme close-up on the point of contact, with one sound effect), the consequence (a detail: the helmet rolling on the ground, coming to rest), the reaction (the character frozen, or a hand reaching). These intermediate panels use fidelity `reframe` or `bridge`, draw from the frame closest to the moment for light and place, and are not limited in number: a reader must be able to say what happened in each of them. Outside such events, a closer look, a reverse angle or a breath on the same moment stays at most one panel in four.",
    "Rhythm of a webtoon: a wide establishing panel each time the place changes, close-ups on gestures, details on objects, an almost empty panel for a silence, a tall panel for a fall or a vertical space.",
    "Location, strict: look at each frame and name the place actually visible. The sheet of the location you name is attached to the prompt and its design is copied into the background, so a wrong location paints the wrong place (an altar in a forest). Use `altar-sanctuary` only when the altar or the rose window is visible; use `blue-forest` for the cavern forest of black trunks, roots and glowing mushrooms; use `white-lily-field` for the white memory; otherwise create a short new id in lower case with hyphens and describe the place in the panel description. Never copy the location of the previous panel without checking the frame.",
    `Characters with a design sheet (use these exact ids in "characters"): ${characters.join(" | ")}. Lanterne never speaks, never stumbles, emits no light and has no face inside the helmet. Rose is a small calm child. Other characters may be named in lower case (e.g. "unhooker", "vault-king") and must then be described in the panel description.`,
    `Locations with a sheet (use the id in "location" when the scene is there, otherwise a short new id in lower case with hyphens, described in the panel): ${locations.join(" | ")}.`,
    `Continuity of the series: ${script.source.continuity.join(" ")}`,
    "Page background: `white` for the white memory world, `black` for the underground; `abyss` only for a fall into the deep.",
    "Shot types: extreme_wide, wide, full, medium, medium_close_up, close_up, extreme_close_up, detail, void. Angles: eye_level, low, high, top_down, dutch, over_the_shoulder, worm. Narrative roles: breath, establishing, character_intro, action, reaction, dialogue, detail, reveal, transition, tension, cliffhanger. Transitions (the space before the panel): continuous, cut, beat, breath, hard_cut, fall, fade_to_black, fade_to_white, time_skip.",
    "Lettering: dialogue only when the screenplay has a line at that moment, written in English in `en` and in French in `fr`, spoken and short; `style` speech, whisper, thought, shout or off; `speaker` is the character's name. Captions are rare (narration, a place, a time). Sound effects (`sfx`, style soft, hard or rumble) only for a sound that matters, as an English onomatopoeia in `en` and a French one in `fr`. Anchors are percentages of the panel: `anchor: {x, y}`.",
    "Write `description` as one or two precise sentences of what the panel shows (subject, pose, framing, light, and what is in the background), `action` as the movement or its absence, `emotion` in a few words, `composition` as where the eye goes, `purpose` as why the panel exists. Each panel must be understandable on its own from the image and at most one sound effect. Never use an em dash.",
    `Answer with JSON only: {"panels": [ {seconds, description, action, emotion, purpose, characters, location, shot_type, camera_angle, composition, narrative_role, transition_type, fidelity, background, dialogue: [{speaker, style, en, fr, anchor}], caption: [{style, en, fr, anchor}], sfx: [{style, en, fr, anchor}]} ] } with exactly ${count} panels.`,
  ].join("\n\n");

  const screenplay = STUDIO_SCREENPLAY.pages.map((page) => `[page ${page.page}]\n${page.text}`).join("\n\n");
  const frameParts: UserPart[][] = await Promise.all(
    frames.map(async (frame): Promise<UserPart[]> => [
      { type: "text", text: `Frame at ${frame.label} (${frame.seconds} s)` },
      { type: "image_url", image_url: { url: await frameAsDataUrl(frame.src) } },
    ]),
  );
  const user: UserPart[] = [
    { type: "text", text: `The strip is adapted up to ${adaptedUntil} s. Last panels made:\n${JSON.stringify(tail, null, 1)}` },
    { type: "text", text: `Screenplay of the episode (French):\n${screenplay}` },
    { type: "text", text: `Frames of the film after ${adaptedUntil} s, in order:` },
    ...frameParts.flat(),
    { type: "text", text: `Write the next ${count} panels now, as JSON.` },
  ];

  try {
    const result = await completeJson<{ panels?: NextPanelIntent[] }>({ system, user, maxTokens: 16000 });
    const intents = (result.panels ?? []).slice(0, count);
    const panels = panelsFromIntents(current, intents, frames, script, overlay);
    if (!panels.length) return Response.json({ error: "Le modèle n'a renvoyé aucune case exploitable" }, { status: 502 });
    return Response.json({ panels, adapted_until: adaptedUntil, frames: frames.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "writing failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
