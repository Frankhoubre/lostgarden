import type { ReferenceAsset, WebtoonPanel } from "./types";
import type { StyleBible } from "./style-bible";

const SHOT_LABEL: Record<WebtoonPanel["shot_type"], string> = {
  extreme_close_up: "extreme close-up",
  close_up: "close-up",
  medium_close_up: "medium close-up, waist up",
  medium: "medium shot",
  full: "full shot, whole body visible",
  wide: "wide shot",
  extreme_wide: "extreme wide shot, the figures tiny in the space",
  detail: "detail shot, insert on one element",
  void: "almost empty frame, atmosphere only",
};

const ANGLE_LABEL: Record<WebtoonPanel["camera_angle"], string> = {
  eye_level: "camera at eye level",
  low: "low angle, camera close to the ground looking up",
  high: "high angle looking down",
  top_down: "top-down view",
  dutch: "slightly tilted camera",
  over_the_shoulder: "over the shoulder",
  worm: "worm's eye view",
};

const ROLE_LABEL: Record<ReferenceAsset["kind"], string> = {
  character: "character design to copy exactly",
  location: "location design to copy",
  object: "object design to copy",
  style: "style and palette reference",
  source_frame: "composition and lighting reference from the finished episode",
};

export type PromptInput = {
  panel: Omit<WebtoonPanel, "generation_prompt" | "negative_constraints" | "image">;
  references: ReferenceAsset[];
  bible: StyleBible;
  /** Palette key of the bible for this panel's world. */
  palette: string;
  /** Free additions written by the adapter for this panel. */
  notes?: string[];
  extraNegative?: string[];
};

/**
 * PANEL PROMPT: one paragraph per concern, always in the same order, so a
 * generator sees the same structure for every panel of a script:
 * world → shot → what happens → who (design locks) → where → references →
 * rendering rules → bans.
 */
export function buildGenerationPrompt(input: PromptInput): {
  prompt: string;
  negative: string[];
} {
  const { panel, references, bible, palette, notes = [], extraNegative = [] } = input;
  const characters = references.filter((r) => r.kind === "character");
  const locations = references.filter((r) => r.kind === "location");
  const objects = references.filter((r) => r.kind === "object");

  const lines: string[] = [];
  lines.push(bible.base);
  if (bible.palettes[palette]) lines.push(bible.palettes[palette]);

  lines.push(
    `SHOT: ${SHOT_LABEL[panel.shot_type]}, ${ANGLE_LABEL[panel.camera_angle]}. Vertical webtoon panel, aspect ratio ${panel.aspect_ratio}, read on a phone.`,
  );
  lines.push(`SCENE: ${panel.description}`);
  lines.push(`COMPOSITION: ${panel.composition}`);
  lines.push(`ACTION AND MOOD: ${panel.action} Emotion: ${panel.emotion}.`);

  if (characters.length) {
    lines.push(
      "CHARACTERS, design locked: " +
        characters.map((c) => `${c.name}: ${c.must_keep}`).join(" "),
    );
  }
  if (locations.length) {
    lines.push("LOCATION, design locked: " + locations.map((l) => l.must_keep).join(" "));
  }
  if (objects.length) {
    lines.push("OBJECTS: " + objects.map((o) => o.must_keep).join(" "));
  }
  if (references.length) {
    lines.push(
      "REFERENCE IMAGES, in order: " +
        references
          .map((r, i) => `image ${i + 1} is ${r.name} (${ROLE_LABEL[r.kind]})`)
          .join("; ") +
        ". Source frames give framing, light and palette; character sheets give the design. Redraw the scene for the requested vertical aspect ratio instead of stretching or cropping a reference.",
    );
  }
  if (notes.length) lines.push("NOTES: " + notes.join(" "));
  lines.push(bible.rendering.join(" "));

  const negative = [...bible.negative, ...extraNegative];
  lines.push("DO NOT: " + negative.join(" "));

  return { prompt: lines.join("\n\n"), negative };
}
