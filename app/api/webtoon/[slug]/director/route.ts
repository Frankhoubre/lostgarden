import { recordCost } from "@/lib/webtoon/cost-server";
import { completeJson } from "@/lib/webtoon/providers/gateway-text";
import { libraryCharacters, libraryLocations } from "@/lib/webtoon/references";
import { getProjectContext } from "@/lib/webtoon/project-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { LibraryOverlay, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/director
 * Body: { messages: {role, content}[], panels: summary[], selected?: WebtoonPanel, library?: LibraryOverlay }
 *
 * The AI director of the studio: a conversation that knows the strip, the
 * selected panel and the library, answers in the user's language and
 * returns the actions the studio must run (change or regenerate a panel,
 * insert or delete panels, set a frame, add a character or a place with
 * its sheet, translate, continue the story, polish the strip). The studio
 * executes them with its own functions and reports back.
 */

export const maxDuration = 120;

type RouteContext = { params: Promise<{ slug: string }> };

export type DirectorAction =
  | { type: "update_panel"; panel_id: string; changes: Record<string, unknown>; regenerate?: boolean }
  | { type: "regenerate_panel"; panel_id: string }
  | { type: "insert_panel"; after: string | null; panel: Record<string, unknown>; generate?: boolean }
  | { type: "delete_panels"; panel_ids: string[] }
  | { type: "set_frame"; panel_id: string; frame: Record<string, unknown> }
  | { type: "add_character"; name: string; must_keep: string; generate_sheet?: boolean }
  | { type: "add_location"; name: string; must_keep: string; generate_sheet?: boolean }
  | { type: "translate"; panel_ids: string[] | "all" }
  | { type: "continue"; count: number; pace?: "calm" | "normal" | "action" }
  | { type: "polish" }
  | { type: "select_panel"; panel_id: string };

type Message = { role: "user" | "assistant"; content: string };

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const project = await getProjectContext(slug, identity);
  if (!project) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const { script } = project;
  if (!process.env.AI_GATEWAY_API_KEY) return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    messages?: Message[];
    panels?: { panel_id: string; order: number; seconds: number | null; shot: string; description: string; image: string }[];
    selected?: WebtoonPanel | null;
    library?: LibraryOverlay;
  };
  const messages = (body.messages ?? []).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-12);
  if (!messages.length || messages[messages.length - 1].role !== "user") return Response.json({ error: "message attendu" }, { status: 400 });
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [] } : null;

  const system = [
    `You are the AI director of the webtoon studio of "${script.series}", episode ${script.episode}: a calm, precise assistant who helps the author (Frank) make the strip better and does things for him. Answer in the language of the user's message (French, mostly), in a few short sentences, spoken and warm, never bureaucratic. Never use an em dash.`,
    "You know the strip (a list of panels with their id, order, film second, shot and description), the selected panel in full, and the library of characters and locations. When the user asks for a change, do it through actions rather than explaining how to do it; when the request is unclear, ask one short question and return no action.",
    "Actions you can return, executed by the studio in order:\n" +
      "- update_panel {panel_id, changes, regenerate?}: change fields of a panel (description, action, emotion, composition, shot_type, camera_angle, narrative_role, transition_type, panel_height, aspect_ratio, characters (ids), location, dialogue [{speaker, style, text:{en,fr}, anchor:{x,y}}], sfx [{text:{en,fr}, style, anchor, size, rotate}], caption); set regenerate true when the image must be redrawn (the description changed).\n" +
      "- regenerate_panel {panel_id}: redraw the image as is.\n" +
      "- insert_panel {after, panel, generate?}: a new panel after the given id (null = at the end) with the same fields as a panel intent (description, action, emotion, characters, location, shot_type, camera_angle, composition, aspect_ratio, panel_height, frame, narrative_role, transition_type, fidelity, background, dialogue, sfx); generate true to draw it now.\n" +
      "- delete_panels {panel_ids}.\n" +
      "- set_frame {panel_id, frame {width 40-100, align left|center|right, shape rect|rounded|slant|slant-reverse|wedge|wedge-reverse, overlap px, tilt deg, shadow}}: how the panel sits on the strip.\n" +
      "- add_character {name, must_keep, generate_sheet?} and add_location {name, must_keep, generate_sheet?}: a new entry in the library with its design lock in English (what the image model must copy exactly); generate_sheet true draws its sheet.\n" +
      "- translate {panel_ids | \"all\"}: fill the empty languages of the lettering.\n" +
      "- continue {count, pace?}: write, draw and translate the next panels of the film (pace calm, normal or action).\n" +
      "- polish: give every panel a webtoon frame and add the connective panels the story is missing.\n" +
      "- select_panel {panel_id}: show a panel to the user.",
    "Rules of the series to respect in what you write: Lanterne is a hollow suit of armour with a lantern helmet, he never speaks; Rose is a small calm child; texts are spoken language, short, in English `en` and French `fr`; descriptions of panels are one or two precise English sentences for the image model, with the state of the characters (helmet on or off).",
    `Characters in the library: ${libraryCharacters(overlay).map((c) => `${c.id} (${c.name})`).join(", ")}. Locations: ${libraryLocations(overlay).map((l) => `${l.id} (${l.name})`).join(", ")}.`,
    "Your reply may only claim what your `actions` array actually contains: if the array is empty, you did nothing, and you must say what you need instead. Never say \"c'est fait\" without the matching actions.",
    'Example. User: "ajoute un son BAM en haut à droite de la case p03 et mets-la en bords inclinés à 80 % à gauche". Answer: {"reply": "Voilà : un BAM incliné en haut à droite de p03, et la case passe en bords inclinés, 80 % de largeur, collée à gauche.", "actions": [{"type": "update_panel", "panel_id": "p03", "changes": {"sfx": [{"text": {"en": "BAM", "fr": "BAM"}, "style": "hard", "anchor": {"x": 72, "y": 18}, "rotate": -14, "size": 220}]}}, {"type": "set_frame", "panel_id": "p03", "frame": {"width": 80, "align": "left", "shape": "slant", "shadow": true}}]}. When you add a sound or a bubble, keep the existing ones of the panel in the array unless asked to remove them.',
    'Answer with JSON only: {"reply": "<what you say to the user>", "actions": [ ... ]}. Escape double quotes inside strings.',
  ].join("\n\n");

  const context = [
    `STRIP (${body.panels?.length ?? 0} panels):\n${JSON.stringify(body.panels ?? [], null, 0)}`,
    body.selected ? `SELECTED PANEL (full):\n${JSON.stringify({ ...body.selected, generation_prompt: undefined, negative_constraints: undefined, visual_references: undefined }, null, 0)}` : "No panel selected.",
  ].join("\n\n");

  const meter = { usd: 0 };
  try {
    const answer = await completeJson<{ reply?: string; actions?: DirectorAction[] }>({
      system,
      user: [
        { type: "text", text: context },
        { type: "text", text: `CONVERSATION:\n${messages.map((m) => `${m.role === "user" ? "USER" : "DIRECTOR"}: ${m.content}`).join("\n\n")}` },
      ],
      maxTokens: 8000,
      reasoning: "none",
      onCost: (usd) => {
        meter.usd += usd;
      },
    });
    void recordCost({ idToken: identity.idToken, slug, usd: meter.usd, kind: "writer" });
    const actions = Array.isArray(answer.actions) ? answer.actions.filter((a) => a && typeof a.type === "string").slice(0, 12) : [];
    return Response.json({ reply: typeof answer.reply === "string" ? answer.reply : "", actions, cost_usd: meter.usd });
  } catch (error) {
    void recordCost({ idToken: identity.idToken, slug, usd: meter.usd, kind: "writer" });
    return Response.json({ error: error instanceof Error ? error.message : "director failed" }, { status: 502 });
  }
}
