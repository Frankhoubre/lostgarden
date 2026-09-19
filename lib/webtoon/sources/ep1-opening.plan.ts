import type { PanelIntent } from "../adaptation";
import type { WebtoonBeat } from "../types";

/**
 * ADAPTATION PLAN · episode 1, 0:00-0:30 · eleven shots become fifteen panels:
 * ten direct panels, one per shot of the film, plus five bridges that add no
 * action (a detail, a counter-shot, a breath, a fall).
 *
 * Decisions, shot by shot:
 *  s01 → p01  kept as the opening image; the white above his helmet is the
 *             first breath of the strip.
 *      → p01b bridge: petals on empty white, the wind keeps falling.
 *  s02 → p02  the lily insert stays: it is the only warm colour and it
 *             prepares the field.
 *  s03 → p03  the rack focus becomes the scroll itself: sharp lilies (p02),
 *             then the wide field on a tall panel; distance = height.
 *      → p03b reframe: the back of his helmet, the field ahead, her speck.
 *  s04 → p04  Rose's silent close-up, kept: she looks first, speaks later.
 *  s05 → p05  the hem and her feet: a small low insert, one beat of ground.
 *  s06 → p06  the hill: a tall panel whose upper half is empty white sky.
 *  s07 → p06b reframe: the flower in her hair, a petal lifting.
 *      → p07  the line. Waist-up, so it is not a copy of p04.
 *  s08 → p07b bridge: two seconds of black become a tall dark panel with one
 *             faint glow below; the page turns black in the gap before it.
 *  s09 → p08  the sanctuary, tallest panel: beams at the top, altar at the
 *             bottom, the eye travels down the way the light does.
 *  s10 → p09  the larva on the root, first living thing, small panel.
 *      → p09b reframe: his gauntlet on the stone, one mushroom.
 *  s11 → p10  the rose window over the sabatons: the segment ends on
 *             expectation, the awakening starts after 0:30.
 * Nothing is invented. Every panel maps to a shot of the film, the bridges
 * only look at that same shot from closer or from behind.
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

/** One approved panel per palette, attached after the character sheets to lock the rendering. */
export const EP1_OPENING_STYLE_ANCHORS: Record<string, string> = {
  white_memory: "style.webtoon.white",
  blue_sanctuary: "style.webtoon.blue",
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
    bleed: false,
    sfx: [
      { text: { en: "whoooosh", fr: "fshhhhh", ja: "ヒュウウウ", ko: "휘이이잉" }, anchor: { x: 68, y: 36 }, rotate: -14, size: 70, style: "soft" },
    ],
    exclude_references: ["loc.white-lily-field"],
    prompt_notes: [
      "The whole image is white and pale grey with faint bloom; the darkest values are the eye holes of the helmet and the black of the chest plate, softened by the light.",
      "Keep the two dark oval eye holes small and calm, no glow.",
    ],
  },
  {
    id: "p01b",
    beat: "b1",
    shots: ["s01"],
    fidelity: "bridge",
    narrative_role: "breath",
    purpose:
      "A breath of white between the knight and the lilies: a few petals crossing an empty panel carry the wind of the previous case downward. Nothing happens here, the page only keeps falling.",
    description:
      "Two or three small white lily petals drifting across a plain, empty, overexposed white. Nothing else: no ground, no horizon, no figure.",
    characters: [],
    location: "white-lily-field",
    action: "Petals drift down and to the right.",
    emotion: "weightless, suspended",
    shot_type: "void",
    camera_angle: "eye_level",
    composition:
      "Nearly empty 3:2 strip; one petal sharp just left of centre, two smaller softer ones toward the upper right; the rest is flat white.",
    aspect_ratio: "3:2",
    panel_height: 420,
    transition_type: "continuous",
    bleed: true,
    exclude_references: ["loc.white-lily-field"],
    prompt_notes: [
      "Almost nothing drawn: the panel is ninety percent flat white. The petals are simple curved shapes with one ink line and one flat pale grey shadow each.",
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
    bleed: false,
    exclude_references: ["loc.white-lily-field"],
    prompt_notes: [
      "Three or four big simple lily shapes with a few ink lines and one flat shadow each; the rest is empty white. No stamens drawn one by one beyond the main flower.",
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
    bleed: true,
    sfx: [
      { text: { en: "fwooooo", fr: "fwooooo", ja: "フォオオオ", ko: "후우우우" }, anchor: { x: 30, y: 22 }, rotate: -6, size: 64, style: "soft" },
    ],
    exclude_references: ["char.lanterne.still"],
    prompt_notes: [
      "The field is one flat pale shape with a few simple lily silhouettes in the foreground; the sky is empty white. The two figures are the only detailed elements.",
      "Both characters are tiny; their silhouettes must still read: the lantern helmet and the pauldrons for him, the round pink head and the cloak for her.",
      "Rose is seen from the front, facing him; Lanterne from behind at three quarters.",
    ],
  },
  {
    id: "p03b",
    beat: "b2",
    shots: ["s03"],
    fidelity: "reframe",
    narrative_role: "transition",
    purpose:
      "The counter-shot the film implies: from behind Lanterne's helmet, the field ahead out of focus, so the eye travels toward Rose before her close-up. Same moment as the wide shot, new framing.",
    description:
      "Close on the back of Lanterne's lantern helmet and his pauldrons, seen strictly from behind, slightly off centre; ahead of him, out of focus, the pale field of lilies under a white sky, with a faint pink and grey-green speck far away on the rise: Rose.",
    characters: ["lanterne"],
    location: "white-lily-field",
    action: "He does not move. Petals pass him.",
    emotion: "attention, held breath",
    shot_type: "close_up",
    camera_angle: "over_the_shoulder",
    composition:
      "16:9 strip. The helmet occupies the left third, cut by the top edge, the ring on top visible; the right two thirds are the soft white field; Rose's speck on the right third line, slightly above centre.",
    aspect_ratio: "16:9",
    transition_type: "continuous",
    bleed: false,
    exclude_references: ["loc.white-lily-field"],
    prompt_notes: [
      "Lanterne is seen strictly from behind: the back of the cylinder helmet, the ring on top, the pauldrons and the cream scarf; no eye holes visible.",
      "The field is one flat pale shape; Rose is a two-tone speck, pink head and grey-green cloak, tiny.",
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
    bleed: false,
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
      "A beat of ground: the hem of her dress and her small shoes in the lilies. It says she is really standing there, small and unprotected, before the hill shows how far.",
    description:
      "Low insert among the lilies: the lace hem of Rose's cream dress and her small feet standing between white lily blooms, seen from knee height. White light, soft focus in front and behind.",
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
    bleed: false,
    exclude_references: ["char.rose", "loc.white-lily-field"],
    prompt_notes: [
      "Only the lower part of the cream dress and the small feet among the flowers; no face in frame.",
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
    bleed: true,
    exclude_references: ["loc.white-lily-field", "char.lanterne.still"],
    prompt_notes: [
      "The hill is one flat pale rounded shape; a handful of simple lily silhouettes at the bottom edge; the sky is empty flat white.",
      "The figures are minuscule; the hill and the white are the subject.",
    ],
  },
  {
    id: "p06b",
    beat: "b3",
    shots: ["s07"],
    fidelity: "reframe",
    narrative_role: "detail",
    purpose:
      "A detail before the only line: the white flower in her hair and a petal lifting from it. It slows the page so that Find me lands alone in the next case.",
    description:
      "Extreme close-up on the side of Rose's head: the white flower tucked in her pink hair above her left temple, strands of pink hair moving in the wind, one petal lifting away from the flower. Plain white sky behind.",
    characters: ["rose"],
    location: "white-lily-field",
    action: "The wind lifts her hair and one petal.",
    emotion: "tender, fragile",
    shot_type: "extreme_close_up",
    camera_angle: "eye_level",
    composition:
      "16:9. The flower slightly right of centre, pink hair filling the left half, empty white on the right where the petal drifts away.",
    aspect_ratio: "16:9",
    transition_type: "beat",
    bleed: false,
    exclude_references: ["char.rose", "loc.white-lily-field"],
    prompt_notes: [
      "Only hair, flower and white in frame: no eye, no face features.",
      "The flower is a simple five-petal white shape with a pale yellow centre, drawn with a few ink lines; the hair is two flat pinks and a few line strokes.",
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
    bleed: false,
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
      "Her arms hang relaxed at her sides under the cloak; no hands raised, no hands clasped, no gesture. As in the film, only her face and the wind move.",
    ],
  },
  {
    id: "p07b",
    beat: "b4",
    shots: ["s08"],
    fidelity: "bridge",
    narrative_role: "transition",
    purpose:
      "The two seconds of black become a tall, almost empty panel: the eye falls with the page, and a first cold glow at the bottom announces the sanctuary without showing anything of it.",
    description:
      "Near-total darkness. A tall black panel; at the very bottom, a faint cold cyan haze, like light seen from far above through mist. Nothing else is drawn.",
    characters: [],
    location: "altar-sanctuary",
    action: "Nothing moves. The dark deepens.",
    emotion: "vertigo, silence",
    shot_type: "void",
    camera_angle: "eye_level",
    composition:
      "9:16. Ninety percent flat black; a soft cyan haze in the bottom fifth, brighter toward the centre bottom, with no shapes inside it.",
    aspect_ratio: "9:16",
    panel_height: 1100,
    transition_type: "fall",
    spacing_before: 1100,
    bleed: true,
    exclude_references: ["loc.altar-sanctuary"],
    prompt_notes: [
      "This is a transition panel: a black field with one soft glow at the bottom. No mushrooms, no altar, no roots, no figure, no stars, no texture, no gradient banding.",
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
    transition_type: "breath",
    bleed: true,
    sfx: [
      { text: { en: "vmmmmm", fr: "vmmmmm", ja: "ヴウウウ", ko: "브으으음" }, anchor: { x: 24, y: 12 }, rotate: -90, size: 60, style: "rumble" },
      { text: { en: "drip", fr: "ploc", ja: "ぽた", ko: "똑" }, anchor: { x: 62, y: 84 }, rotate: 0, size: 40, style: "soft" },
    ],
    exclude_references: ["loc.altar-sanctuary", "char.lanterne.still"],
    prompt_notes: [
      "Radical simplicity, poster-like: the whole image is made of about fifteen big flat shapes. One black root silhouette at the upper left, one flat dark-blue wall tone, one mid-blue tone for the lit area, three or four flat translucent beam triangles, a flat pale mist band, the altar as one small simple block, and at most four glowing mushrooms drawn as simple caps with a soft flat halo.",
      "No pillars, no arches, no stalactites drawn individually, no rocks, no floor tiles, no cracks, no ornament, no reflections, no texture anywhere. Big empty areas of flat blue-black.",
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
    bleed: false,
    sfx: [
      { text: { en: "skrt skrt", fr: "crr crr", ja: "カサ カサ", ko: "스륵 스륵" }, anchor: { x: 22, y: 78 }, rotate: -8, size: 44, style: "soft" },
    ],
    exclude_references: ["char.lanterne.still"],
    prompt_notes: [
      "The root is one dark flat shape, the larva a simple pale segmented shape with one highlight, the altar and knight behind are simplified flat silhouettes in two blue tones.",
      "The larva is white-blue, translucent, about the length of a forearm, with soft rounded segments and no face detail; it is gentle, not monstrous.",
    ],
  },
  {
    id: "p09b",
    beat: "b5",
    shots: ["s10"],
    fidelity: "reframe",
    narrative_role: "detail",
    purpose:
      "A slow travel along the body before the sabatons: his steel gauntlet resting on the stone, one mushroom glowing beside it. It stretches the stillness the film holds with its camera move; nothing new happens.",
    description:
      "Detail of Lanterne's steel gauntlet over a black glove resting on the carved stone lid of the altar, palm down, fingers slightly apart; beside the hand, one small blue glowing mushroom; cold blue light from above, thin mist.",
    characters: ["lanterne"],
    location: "altar-sanctuary",
    action: "The hand does not move. The mushroom glows.",
    emotion: "stillness, waiting",
    shot_type: "detail",
    camera_angle: "high",
    composition:
      "16:9. The gauntlet crosses the lower half from the left, the mushroom lower right, the stone a flat dark blue plane, black at the top edge.",
    aspect_ratio: "16:9",
    transition_type: "continuous",
    bleed: false,
    exclude_references: ["char.lanterne.still", "loc.altar-sanctuary"],
    prompt_notes: [
      "Gauntlet, glove, stone and one mushroom only: a handful of flat shapes in two blues, a steel grey and black. No face, no body beyond the wrist and a hint of the beige cape edge.",
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
    bleed: false,
    sfx: [
      { text: { en: "VMMMMMMM", fr: "VMMMMMMM", ja: "ヴヴヴヴヴ", ko: "브으으으음" }, anchor: { x: 50, y: 8 }, rotate: 0, size: 78, style: "rumble" },
    ],
    exclude_references: ["char.lanterne.still"],
    prompt_notes: [
      "The rose window is a simple flat cyan disc with a few clean tracery lines, the stalactites a few triangles, the altar and sabatons flat dark shapes against the light. No ornament drawn in detail.",
      "Only the sabatons and the lower legs of the knight are visible, dark against the glowing window; the rest of the body is hidden by perspective.",
    ],
  },
];
