import { SPACING_BY_TRANSITION } from "./adaptation";
import { heightForAspect } from "./layout";
import { buildGenerationPrompt } from "./prompts";
import { frameReference, isReferenceId, libraryWith } from "./references";
import { STYLE_BIBLE } from "./style-bible";
import type { LibraryOverlay, PanelBackground, ReferenceAsset, WebtoonPanel, WebtoonScript } from "./types";

/**
 * STUDIO COMPOSITION: the part of the adaptation engine that runs on a panel
 * written in the studio rather than in a plan file. It resolves the
 * references from what the panel says (characters, location, film frames)
 * and composes the prompt from the bible, exactly like `adaptScript` does
 * for a panel intent. Runs in the browser (editor) and on the server
 * (generate route), so it stays free of Firebase and Node APIs.
 */

type ScriptWorld = Pick<WebtoonScript, "palettes" | "style_anchors">;

const PALETTE_BY_BACKGROUND: Record<PanelBackground, string> = {
  white: "white_memory",
  black: "blue_sanctuary",
  abyss: "blue_sanctuary",
};

/** The bible palette for a panel: by location when the plan names one, by page background otherwise. */
export function paletteForPanel(panel: Pick<WebtoonPanel, "location" | "background">, script: ScriptWorld): string {
  return script.palettes?.[panel.location] ?? PALETTE_BY_BACKGROUND[panel.background];
}

function isFramePath(id: string): boolean {
  return id.startsWith("/") || id.startsWith("http");
}

/**
 * References in the order the generator expects: two sheets per character
 * (webtoon sheet, then the canon behind it), the style anchor of the
 * palette, the location sheet, then the film frames (library ids of kind
 * `source_frame` kept from the panel, plus any frame picked in the studio).
 */
export function composeReferences(panel: WebtoonPanel, script: ScriptWorld, overlay?: LibraryOverlay | null): ReferenceAsset[] {
  const picked = new Map<string, ReferenceAsset>();
  const add = (asset: ReferenceAsset | undefined) => {
    if (asset && asset.image && !picked.has(asset.id)) picked.set(asset.id, asset);
  };
  const library = libraryWith(overlay);
  const byId = new Map(library.map((asset) => [asset.id, asset]));

  for (const character of panel.characters) {
    const sheets = library.filter((asset) => asset.kind === "character" && asset.subject === character && asset.image).sort(
      (a, b) => (a.priority ?? 99) - (b.priority ?? 99),
    );
    for (const sheet of sheets.slice(0, 2)) add(sheet);
  }
  const palette = paletteForPanel(panel, script);
  add(byId.get(script.style_anchors?.[palette] ?? ""));
  add(byId.get(`loc.${panel.location}`));
  for (const object of panel.objects) add(byId.get(`obj.${object}`));
  for (const id of panel.visual_references) {
    const asset = byId.get(id);
    if (asset?.kind === "source_frame") add(asset);
    else if (!asset && !isReferenceId(id) && isFramePath(id)) add(frameReference(id));
  }
  return [...picked.values()];
}

/** The panel with its references resolved and its prompt composed from its fields. */
export function composePanel(panel: WebtoonPanel, script: ScriptWorld, overlay?: LibraryOverlay | null): WebtoonPanel {
  const references = composeReferences(panel, script, overlay);
  const hasFrame = references.some((r) => r.kind === "source_frame");
  const notes = hasFrame
    ? [
        "BACKGROUND: draw only what the film frame shows at this moment, from the framing asked. The location sheet gives the palette and the materials of the place; it never adds elements the frame does not show (no altar, no rose window, no beams, no building unless they are visible in the frame).",
      ]
    : [];
  const { prompt, negative } = buildGenerationPrompt({
    panel,
    references,
    bible: STYLE_BIBLE,
    palette: paletteForPanel(panel, script),
    notes,
  });
  return {
    ...panel,
    visual_references: references.map((r) => r.id),
    generation_prompt: prompt,
    negative_constraints: negative,
    prompt_auto: true,
  };
}

/** True when the panel has no usable prompt yet or asks the studio to compose it. */
export function needsComposition(panel: WebtoonPanel): boolean {
  return panel.prompt_auto === true || !panel.generation_prompt.trim();
}

/** The panel as it must be sent to a generator: composed when it asks for it, as written otherwise. */
export function panelForGeneration(panel: WebtoonPanel, script: ScriptWorld, overlay?: LibraryOverlay | null): WebtoonPanel {
  return needsComposition(panel) ? composePanel(panel, script, overlay) : panel;
}

export type FramePick = { src: string; seconds: number };

function frameId(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `f${String(m).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
}

/**
 * A new panel drawn from one frame of the film, to continue the strip past
 * the adapted segment. It inherits the world of the panel before it (beat,
 * location, background, characters) and attaches the frame as its source.
 * The studio composes its prompt once a description is written.
 */
export function panelFromFrame(panels: readonly WebtoonPanel[], frame: FramePick, after?: WebtoonPanel): WebtoonPanel {
  const from = after ?? panels[panels.length - 1];
  const taken = new Set(panels.map((p) => p.panel_id));
  let id = frameId(frame.seconds);
  let n = 2;
  while (taken.has(id)) id = `${frameId(frame.seconds)}-${n++}`;
  const aspect = "4:5";
  return {
    panel_id: id,
    beat_id: from?.beat_id ?? "studio",
    order: panels.length + 1,
    source_time_start: frame.seconds,
    source_time_end: frame.seconds + 5,
    source_shots: [],
    fidelity: "direct",
    narrative_role: "action",
    purpose: "",
    description: "",
    characters: from?.characters ?? [],
    location: from?.location ?? "",
    objects: [],
    action: "",
    emotion: "",
    shot_type: "medium",
    camera_angle: "eye_level",
    composition: "",
    aspect_ratio: aspect,
    panel_height: heightForAspect(aspect),
    focal_point: { x: 50, y: 50 },
    transition_type: "cut",
    spacing_before: SPACING_BY_TRANSITION.cut,
    spacing_after: 0,
    background: from?.background ?? "black",
    border: false,
    bleed: true,
    dialogue: [],
    caption: [],
    sfx: [],
    visual_references: [frame.src],
    generation_prompt: "",
    negative_constraints: [],
    prompt_auto: true,
    image: { src: "", width: 0, height: 0, status: "missing" },
  };
}

/** Film frame paths already attached to a panel, in order. */
export function attachedFrames(panel: WebtoonPanel): string[] {
  return panel.visual_references.filter((id) => !isReferenceId(id) && isFramePath(id));
}
