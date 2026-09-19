import type { PanelIntent } from "../adaptation";
import type { WebtoonBeat } from "../types";

/**
 * ADAPTATION PLAN · episode 1, 0:00-0:30 · eleven shots become ten panels.
 *
 * Decisions, shot by shot:
 *  s01 → p01  kept as the opening image; the white above his helmet is the
 *             first breath of the strip.
 *  s02 → p02  the lily insert stays: it is the only warm colour and it
 *             prepares the field.
 *  s03 → p03  the rack focus becomes the scroll itself: sharp lilies (p02),
 *             then the wide field on a tall panel; distance = height.
 *  s04 → p04  Rose's silent close-up, kept: she looks first, speaks later.
 *  s05 → p05  the hem and bare feet: a small low insert, one beat of ground.
 *  s06 → p06  the hill: a tall panel whose upper half is empty white sky.
 *  s07 → p07  the line. Waist-up, so it is not a copy of p04.
 *  s08 → gap  two seconds of black become the longest gap of the strip and
 *             the page turns black: no panel, only the fall.
 *  s09 → p08  the sanctuary, tallest panel: beams at the top, altar at the
 *             bottom, the eye travels down the way the light does.
 *  s10 → p09  the larva on the root, first living thing, small panel.
 *  s11 → p10  the rose window over the sabatons: the segment ends on
 *             expectation, the awakening starts after 0:30.
 * Nothing is added. Every panel maps to a shot of the film.
 */
export const EP1_OPENING_BEATS: WebtoonBeat[] = [
  {
    beat_id: "b1",
    title: "White",
    intent: "Install the memory: a knight alone in a white nowhere.",
    source_time_start: 0,
    source_time_end: 4.4,
    background: "white",
  },
  {
    beat_id: "b2",
    title: "The lilies",
    intent: "From a flower to a field: reveal the second figure and the distance.",
    source_time_start: 4.4,
    source_time_end: 11.2,
    background: "white",
  },
  {
    beat_id: "b3",
    title: "Find me",
    intent: "Rose looks, stands, is far, and asks the one thing she asks.",
    source_time_start: 11.2,
    source_time_end: 20.6,
    background: "white",
  },
  {
    beat_id: "b4",
    title: "Black",
    intent: "The memory ends. Two seconds of nothing, rendered as distance.",
    source_time_start: 20.6,
    source_time_end: 22.6,
    background: "black",
  },
  {
    beat_id: "b5",
    title: "The sanctuary",
    intent: "The present: a vast blue silence, an altar, a knight who has not moved yet.",
    source_time_start: 22.6,
    source_time_end: 30,
    background: "black",
  },
];

export const EP1_OPENING_PALETTES: Record<string, string> = {
  "white-lily-field": "white_memory",
  "altar-sanctuary": "blue_sanctuary",
};

const FIND_ME = {
  en: "Find me.",
  fr: "Trouve-moi.",
  ja: "わたしを見つけて。",
  ko: "나를 찾아줘.",
};

export const EP1_OPENING_INTENTS: PanelIntent[] = [
  {
    id: "p01",
    beat: "b1",
    shots: ["s01"],
    fidelity: "direct",
    narrative_role: "character_intro",
    purpose:
      "The first image of the series: a hollow knight standing in white. Opening on him, not on the world, makes the white read as his state rather than as a place.",
    description:
      "Lanterne alone in an overexposed white void with no horizon. Medium shot, waist up, facing the viewer, arms at his sides, the torn beige cape lifting to the right in a slow wind. Small white petals drift across the frame. His colours are washed out, as if remembered.",
    characters: ["lanterne"],
    location: "white-lily-field",
    action: "He stands still. Only the cape and the petals move.",
    emotion: "suspended, unreal, quiet",
    shot_type: "medium",
    camera_angle: "eye_level",
    composition:
      "Lanterne placed slightly right of centre in the lower two thirds; generous empty white above the helmet; the cape's movement points right, out of frame. No ground line visible, the white swallows his legs below the waist.",
    transition_type: "breath",
    spacing_before: 220,
    references: ["char.lanterne.sheet"],
    exclude_references: ["char.lanterne", "loc.white-lily-field"],
    prompt_notes: [
      "The whole image is white and pale grey with faint bloom; the darkest values are the eye holes of the helmet and the black of the chest plate, softened by the light.",
      "Keep the two dark oval eye holes small and calm, no glow.",
    ],
  },
  {
    id: "p02",
    beat: "b2",
    shots: ["s02"],
    fidelity: "direct",
    narrative_role: "detail",
    purpose:
      "A close insert on the lilies: the only warm colour of the sequence, and the flower the field will be made of. It also breaks the scale before the wide shot.",
    description:
      "Macro on white lilies filling the whole frame: open trumpets, curled white petals, orange-red stamens, pale green stems, the edges of the frame softly out of focus, white light behind.",
    characters: [],
    location: "white-lily-field",
    action: "Nothing moves but a petal.",
    emotion: "tender, close",
    shot_type: "detail",
    camera_angle: "eye_level",
    composition:
      "Three or four large lilies across the frame, the sharpest one just left of centre, the others dissolving into white at the edges. No sky, no ground, only flowers.",
    transition_type: "cut",
    exclude_references: ["loc.white-lily-field"],
    prompt_notes: [
      "The orange of the stamens is the one saturated colour; keep everything else white, ivory and pale green.",
    ],
  },
  {
    id: "p03",
    beat: "b2",
    shots: ["s03"],
    fidelity: "direct",
    narrative_role: "establishing",
    purpose:
      "The film pulls focus from blurred lilies to the two figures; here the scroll does it. A tall panel makes the distance between Lanterne and Rose a distance the thumb has to cross.",
    description:
      "A vast field of white lilies under a blown-out white sky. Lanterne stands small at the left in the middle distance, seen from behind at three quarters, facing right. Far to the right and a little higher, on a low rise of lilies, a tiny figure faces him: Rose, in a grey-green hooded cloak, pink hair. Lilies in soft focus in the foreground.",
    characters: ["lanterne", "rose"],
    location: "white-lily-field",
    action: "The two figures face each other across the field. Neither moves.",
    emotion: "longing, distance",
    shot_type: "extreme_wide",
    camera_angle: "eye_level",
    composition:
      "Vertical 9:16. The field occupies the lower half; the upper half is white sky with drifting petals. Lanterne small in the lower left; Rose smaller, at the right, on the crest, slightly above him. Nothing in the centre of the frame.",
    transition_type: "beat",
    references: ["char.lanterne.sheet"],
    exclude_references: ["char.lanterne"],
    prompt_notes: [
      "Both characters are tiny; their silhouettes must still read: the lantern helmet and the pauldrons for him, the round pink head and the cloak for her.",
      "Rose is seen from the front, facing him; Lanterne from behind at three quarters.",
    ],
  },
  {
    id: "p04",
    beat: "b3",
    shots: ["s04"],
    fidelity: "direct",
    narrative_role: "character_intro",
    purpose:
      "Rose's face, silent. She looks before she speaks; the reader meets her eyes with nothing to read yet.",
    description:
      "Big close-up of Rose against a white sky: short pink bob hair moving in the wind, the white flower in her hair on the viewer's right, large soft eyes looking straight at the viewer, small closed mouth, hood down on her shoulders. A single white petal crosses the foreground, out of focus.",
    characters: ["rose"],
    location: "white-lily-field",
    action: "She looks at Lanterne, at the viewer. She does not speak.",
    emotion: "calm, watchful, unreadable",
    shot_type: "close_up",
    camera_angle: "eye_level",
    composition:
      "Her face fills the upper two thirds, eyes on the upper third line, a little left of centre; white sky around her; the hood and collar at the bottom edge.",
    transition_type: "cut",
    exclude_references: ["loc.white-lily-field"],
    prompt_notes: [
      "Her eyes are a soft warm brown with a pink reflection, never glowing.",
      "Skin very pale, lit from everywhere by the white; almost no shadow.",
    ],
  },
  {
    id: "p05",
    beat: "b3",
    shots: ["s05"],
    fidelity: "direct",
    narrative_role: "detail",
    purpose:
      "A beat of ground: the hem of her dress and her bare feet in the lilies. It says she is really standing there, small and unprotected, before the hill shows how far.",
    description:
      "Low insert among the lilies: the lace hem of Rose's cream dress and her bare pale legs and feet standing between white lily blooms, seen from knee height. White light, soft focus in front and behind.",
    characters: ["rose"],
    location: "white-lily-field",
    action: "She stands still among the flowers.",
    emotion: "fragile, grounded",
    shot_type: "detail",
    camera_angle: "low",
    composition:
      "Wide 16:9 strip. The hem crosses the frame just above centre, the feet lower right, lilies in the foreground left; no face, no sky.",
    aspect_ratio: "16:9",
    transition_type: "continuous",
    exclude_references: ["char.rose", "loc.white-lily-field"],
    prompt_notes: [
      "Only the lower half of a small child's dress and her bare feet; no face in frame.",
    ],
  },
  {
    id: "p06",
    beat: "b3",
    shots: ["s06"],
    fidelity: "direct",
    narrative_role: "establishing",
    purpose:
      "The widest shot of the sequence: a whole hill of lilies with two specks on it. The upper half of the panel is empty white, so the scroll spends time in nothing before the line.",
    description:
      "Extreme wide: a rounded hill entirely covered in white lilies under a blown-out white sky. At the summit, a speck: Rose, cloak and pink hair. At the base of the hill on the left, another speck: Lanterne, facing the hill. Lilies in soft focus in the foreground.",
    characters: ["lanterne", "rose"],
    location: "white-lily-field",
    action: "Both stand still, very far apart.",
    emotion: "immensity, separation",
    shot_type: "extreme_wide",
    camera_angle: "eye_level",
    composition:
      "Vertical 9:16. The hill sits in the lower third with its summit just below the centre of the frame; the upper half is white sky with a few petals. Rose a few pixels tall at the summit, Lanterne a few pixels tall at the lower left.",
    transition_type: "beat",
    references: ["char.lanterne.sheet"],
    exclude_references: ["char.lanterne", "loc.white-lily-field"],
    prompt_notes: [
      "The figures are minuscule; the hill and the white are the subject.",
    ],
  },
  {
    id: "p07",
    beat: "b3",
    shots: ["s07"],
    fidelity: "direct",
    narrative_role: "dialogue",
    purpose:
      "The only line of the sequence. Waist-up so the panel is not a repeat of p04: the cloak, the lilies and the parted lips carry the moment.",
    description:
      "Medium close-up of Rose, waist up, among the lilies against the white sky: grey-green hooded short cloak fastened at the collar over the cream dress, pink bob hair, the white flower in her hair on the viewer's right, lips just parted as she speaks, eyes on the viewer.",
    characters: ["rose"],
    location: "white-lily-field",
    action: "Rose says: Find me.",
    emotion: "tender, a quiet plea",
    shot_type: "medium_close_up",
    camera_angle: "eye_level",
    composition:
      "Rose slightly right of centre, head in the upper third; the upper left is plain white sky; lilies at the bottom corners.",
    transition_type: "cut",
    exclude_references: ["loc.white-lily-field"],
    negative: ["No empty rectangle, box, frame or blank shape drawn anywhere in the image."],
    dialogue: [
      {
        speaker: "Rose",
        text: FIND_ME,
        style: "whisper",
        anchor: { x: 27, y: 13 },
        tail: { x: 47, y: 27 },
      },
    ],
    prompt_notes: [
      "The upper left quarter of the image is plain, empty white sky with nothing drawn in it: no box, no rectangle, no frame, no bubble, no outline. Lettering is added afterwards on top of the finished art.",
    ],
  },
  {
    id: "p08",
    beat: "b5",
    shots: ["s09"],
    fidelity: "direct",
    narrative_role: "reveal",
    purpose:
      "After the black fall, the present: the sanctuary in one tall panel. Light enters at the top and the reader travels down the beams to the altar, the way the film's eye does.",
    description:
      "Extreme wide of a vast underground sanctuary in deep blue and black. Pale cyan light falls in long beams from high above through mist; twisted black roots frame the left edge and the top; glowing blue mushrooms and pools of cold light along the stone floor; thin ground mist. Far in the middle distance, tiny, a long stone altar with an armoured figure lying on it.",
    characters: ["lanterne"],
    location: "altar-sanctuary",
    action: "Nothing moves. The knight lies on the altar, minuscule in the space.",
    emotion: "cold, sacred, held breath",
    shot_type: "extreme_wide",
    camera_angle: "eye_level",
    composition:
      "Vertical 9:16. Beams of light enter from the top edge and widen downward; roots in silhouette across the upper left; the altar small, low, right of centre, in the brightest pool of light; mushrooms in the lower corners. The darkest values at the edges, the light at the centre bottom.",
    transition_type: "fall",
    spacing_before: 1400,
    references: ["char.lanterne.sheet"],
    exclude_references: ["char.lanterne", "loc.altar-sanctuary"],
    prompt_notes: [
      "The lying knight is a tiny pale shape on the altar, arms along the body, helmet toward the left.",
      "Blue-black darkness everywhere except the beams, the mushrooms and the pool of light at the altar.",
    ],
  },
  {
    id: "p09",
    beat: "b5",
    shots: ["s10"],
    fidelity: "direct",
    narrative_role: "detail",
    purpose:
      "The first living thing: a pale larva crawling along a root toward the altar. A small panel keeps the world quiet and shows the scale from close by.",
    description:
      "Medium shot at root level: in the foreground a pale translucent segmented larva-like creature, softly glowing from inside, crawls along a thick black root that crosses the frame diagonally. Behind it, out of focus, the stone altar with Lanterne lying on it in blue light, small mushrooms glowing on the floor.",
    characters: ["lanterne"],
    location: "altar-sanctuary",
    action: "The creature crawls toward the altar. Lanterne does not move.",
    emotion: "first sign of life, curiosity",
    shot_type: "medium",
    camera_angle: "eye_level",
    composition:
      "3:2 panel. The root enters from the lower left and rises to the right; the larva on it left of centre, sharp; the altar and the lying armour behind, upper right, soft. Shallow depth of field.",
    aspect_ratio: "3:2",
    transition_type: "continuous",
    references: ["char.lanterne.sheet"],
    exclude_references: ["char.lanterne"],
    prompt_notes: [
      "The larva is white-blue, translucent, about the length of a forearm, with soft rounded segments and no face detail; it is gentle, not monstrous.",
    ],
  },
  {
    id: "p10",
    beat: "b5",
    shots: ["s11"],
    fidelity: "direct",
    narrative_role: "cliffhanger",
    purpose:
      "The last image of the segment: the rose window above the knight's feet. Light on a body that has not moved; the awakening begins right after, so the strip ends on expectation.",
    description:
      "Low wide shot along the stone altar from its foot. Closest to the viewer, two dark armoured sabatons rest on the carved stone lid. Above and beyond, an immense ornate circular rose window glows cold cyan and white, its tracery like a mandala, ice-like stalactites hanging from the vault around it; beams of light fall from it onto the altar; carved stone walls in deep blue on both sides.",
    characters: ["lanterne"],
    location: "altar-sanctuary",
    action: "Stillness. Light falls on the lying knight.",
    emotion: "awe, expectation",
    shot_type: "wide",
    camera_angle: "low",
    composition:
      "The rose window centred in the upper half, partly cut by the top edge; the altar's foot and the two sabatons in the lower third, centred, in silhouette against the light; symmetry is allowed here as in the film. Stalactites frame the window left and right.",
    transition_type: "cut",
    spacing_after: 420,
    references: ["char.lanterne.sheet"],
    exclude_references: ["char.lanterne"],
    prompt_notes: [
      "Only the sabatons and the lower legs of the knight are visible, dark against the glowing window; the rest of the body is hidden by perspective.",
    ],
  },
];
