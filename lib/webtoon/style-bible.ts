/**
 * The Lost Garden visual bible, as prompt fragments.
 *
 * Every generation prompt starts from `STYLE_BIBLE.base` and ends with the
 * shared negative constraints. Per-panel prompts only add what the panel
 * changes. Keeping the bible in one place is what keeps two panels in the
 * same world: the guide on the site says a bible is a tool of refusal, and
 * this is the machine-readable version of it.
 */

export type StyleBible = {
  id: string;
  /** Opening sentence of every prompt. */
  base: string;
  /** Rendering instructions shared by every panel. */
  rendering: string[];
  /** Palettes by world; a panel picks one through its location. */
  palettes: Record<string, string>;
  /** Things no panel may contain. */
  negative: string[];
};

export const STYLE_BIBLE: StyleBible = {
  id: "lost-garden-webtoon-v2",
  base:
    "Lost Garden, an original dark fantasy anime by Frank Houbre, drawn as a premium full-colour Korean webtoon panel. Keep the identity of the series exactly: its characters, its poetic dark fantasy mood, its deep blue and cyan palette, its strong readable silhouettes, its mist and floating particles. Render it the webtoon way: clean confident line art with varied line weight, soft cel shading with smooth airbrushed gradients on skin and cloth, luminous painterly backgrounds slightly softer than the figures, crisp edges on the characters, generous negative space, composition built for a phone screen.",
  rendering: [
    "Single illustration, one scene only, no collage, no split screen, no page layout, no multiple panels.",
    "Drawn 2D webtoon illustration, not 3D render, not photograph, not live action, not flat vector.",
    "Composition designed for a vertical webtoon panel read on a phone: the subject stays readable at small size, the eye reads top to bottom.",
    "The artwork fills the whole image edge to edge with no frame, border, margin or vignette drawn into it.",
  ],
  palettes: {
    white_memory:
      "Overexposed white world of a memory: blown-out white sky, pale washed-out colours, almost monochrome, soft bloom, tiny white petals drifting in the air, gentle wind, no sun visible.",
    blue_sanctuary:
      "Deep underground stone sanctuary: near black shadows, cold blue and cyan light, wet carved stone, thin mist along the ground, faint bioluminescent blue mushrooms and blue moss at the edges, no sky, no sunlight.",
    blue_forest:
      "Underground blue forest: black tree trunks, cyan mist, glowing blue mushrooms, pale blue lilies, no sky, no sunlight.",
  },
  negative: [
    "No text, letters, numbers, logo, signature, watermark or caption anywhere in the image.",
    "No speech bubbles and no panel borders drawn in the artwork.",
    "No human face, eyes, skin or hair inside Lanterne's helmet: the helmet is a hollow lantern with two small dark oval holes.",
    "No glowing eyes on Lanterne, no sword, no shield, no weapon, no wings, no cape colour other than beige.",
    "No extra characters, animals or creatures unless named in the prompt.",
    "No modern objects, no photographic realism, no 3D CGI look, no chibi proportions.",
  ],
};
