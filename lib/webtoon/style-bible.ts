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
  id: "lost-garden-webtoon-v4",
  base:
    "Lost Garden, an original dark fantasy anime by Frank Houbre, redrawn as a Korean webtoon (manhwa) panel in a deliberately simple, flat, graphic style. Keep the identity of the series: the same character designs, the poetic dark fantasy mood, the deep blue and cyan palette, the strong readable silhouettes. Rendering rules, strict: every element is built from large flat colour shapes, three to five tones per element at most (base colour, one hard cel shadow, one small highlight); clean digital ink outlines of varied weight on characters and props; backgrounds are simplified into a few big flat shapes and silhouettes with at most one soft gradient, drawn with far less detail than the characters; light, mist and glow are flat translucent shapes; small repeated details are suggested by a handful of simple marks, never drawn one by one; lots of empty space. The result looks like a weekly webtoon page coloured with bucket fills, not like a painting and not like a film frame.",
  rendering: [
    "Single illustration, one scene only, no collage, no split screen, no page layout, no multiple panels.",
    "Flat and simple: no painterly brushwork, no photographic lighting, no texture, no film grain, no micro-detail, no realistic materials, no volumetric light, no dense foliage or ornament. If a surface would need a gradient, use a flat tone instead.",
    "Draw at most a third of the detail visible in the reference frames: the reference images give the character designs, the framing and the palette only; ignore their rendering, their density and their lighting completely and redraw everything flat and simplified.",
    "Line art is visible and clean, like digital inking; colours stay inside the lines; backgrounds are simpler, flatter and softer than the characters.",
    "Composition designed for a vertical webtoon panel read on a phone: the subject stays readable at small size, the eye reads top to bottom.",
    "The artwork fills the whole image edge to edge with no frame, border, margin or vignette drawn into it.",
  ],
  palettes: {
    white_memory:
      "Overexposed white world of a memory: a flat blown-out white sky with no clouds drawn, pale washed-out colours, almost monochrome, a few simple white petal shapes drifting, no sun visible; the lily field is a flat pale shape with a handful of simple lily silhouettes, never a carpet of individually drawn flowers.",
    blue_sanctuary:
      "Deep underground stone sanctuary drawn in a few flat shapes: near black silhouettes of stone and roots, two or three flat tones of cold blue, light beams as flat translucent triangles, mist as a flat pale band, a few simple glowing mushroom shapes at the edges, no sky, no sunlight, no carved ornament drawn in detail.",
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
    "No painterly or semi-realistic rendering, no dense detail, no complex textures, no volumetric rendering, no crowds of small elements drawn individually: flat colours and clean lines only.",
  ],
};

/**
 * The same flat webtoon rendering as the Lost Garden bible, without anything
 * of the series: no name, no palette of its own, no rule about its hero. It
 * is the style a new project starts with; the project's own character,
 * object and location sheets carry its identity.
 */
export const FLAT_WEBTOON_BIBLE: StyleBible = {
  id: "flat-webtoon-v1",
  base:
    "A Korean webtoon (manhwa) panel in a deliberately simple, flat, graphic style, adapted from a finished animated film. Keep the identity of the source: the same character designs, the same mood, the same palette, strong readable silhouettes. Rendering rules, strict: every element is built from large flat colour shapes, three to five tones per element at most (base colour, one hard cel shadow, one small highlight); clean digital ink outlines of varied weight on characters and props; backgrounds are simplified into a few big flat shapes and silhouettes with at most one soft gradient, drawn with far less detail than the characters; light, mist and glow are flat translucent shapes; small repeated details are suggested by a handful of simple marks, never drawn one by one; lots of empty space. The result looks like a weekly webtoon page coloured with bucket fills, not like a painting and not like a film frame.",
  rendering: STYLE_BIBLE.rendering,
  palettes: {},
  negative: [
    "No text, letters, numbers, logo, signature, watermark or caption anywhere in the image.",
    "No speech bubbles and no panel borders drawn in the artwork.",
    "No extra characters, animals or creatures unless named in the prompt.",
    "No photographic realism, no 3D CGI look, no chibi proportions unless the character sheets show them.",
    "No painterly or semi-realistic rendering, no dense detail, no complex textures, no volumetric rendering, no crowds of small elements drawn individually: flat colours and clean lines only.",
  ],
};

export const STYLE_BIBLES: Record<string, StyleBible> = {
  [STYLE_BIBLE.id]: STYLE_BIBLE,
  [FLAT_WEBTOON_BIBLE.id]: FLAT_WEBTOON_BIBLE,
};

/** The bible of a script or project; the Lost Garden one when the id is unknown. */
export function bibleFor(id: string | undefined | null): StyleBible {
  return (id && STYLE_BIBLES[id]) || STYLE_BIBLE;
}
