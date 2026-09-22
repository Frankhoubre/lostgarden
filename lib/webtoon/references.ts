import type { LibraryOverlay, ReferenceAsset, WebtoonPanel } from "./types";

/**
 * Reference library: the character sheets, location sheets and objects the
 * generation step may attach to a prompt. Images are the published site
 * assets, which are frames of the finished episodes, so they carry the exact
 * design the webtoon must keep.
 *
 * `must_keep` is injected into prompts; `description` is the sheet in words
 * for generators that take text only, and for screenplay-only runs where no
 * frame of the scene exists yet.
 */
export const REFERENCE_LIBRARY: ReferenceAsset[] = [
  {
    id: "char.lanterne.webtoon",
    kind: "character",
    subject: "lanterne",
    priority: 1,
    name: "Lanterne, webtoon model sheet",
    image: "/webtoon/references/lanterne-webtoon-sheet.png",
    avatar: { x: 12, y: 9, zoom: 6.5 },
    must_keep:
      "Lanterne is a hollow suit of old armour with nobody inside. Head: a pale grey-ivory cylindrical lantern-shaped helmet with a small metal carrying ring on top, a thin decorative rim, and two small dark oval eye holes; no face. Broad ornate bronze-brown pauldrons with a simple scroll motif. A cream cloth scarf around the neck. Black quilted chest plate with a small pale metal plate and brass buckles. Steel gauntlets over black gloves, steel knee plates, black boots with steel toes. A long beige cape with a torn, ragged hem down to the calves. Modest, compact proportions: not a tall heroic knight.",
    description:
      "Turnaround (front, three-quarter, side, back) redrawn in the webtoon style of the strip: flat colour shapes, one cel shadow, clean ink lines. Derived from the production model sheet with GPT Image 2.5 Sunburst; the anime sheet stays attached after it as the design authority.",
    tags: ["lanterne", "knight", "armour", "protagonist", "model_sheet", "webtoon"],
  },
  {
    id: "char.lanterne",
    kind: "character",
    subject: "lanterne",
    priority: 2,
    name: "Lanterne, model sheet",
    image: "/webtoon/references/lanterne-sheet.png",
    must_keep:
      "Lanterne is a hollow suit of old armour with nobody inside. Head: a pale grey-ivory cylindrical lantern-shaped helmet with a small metal carrying ring on top, a thin decorative rim, and two small dark oval eye holes; no face. Broad ornate bronze-brown pauldrons engraved with scroll patterns. A cream cloth scarf around the neck. Black quilted chest plate with a small pale metal plate and brass buckles. Steel gauntlets over black gloves, steel knee plates, black boots with steel toes. A long beige cape with a torn, ragged hem down to the calves. Modest, compact proportions: not a tall heroic knight.",
    description:
      "Front, side and back views of the final design (lost-garden/09_Fiches_modeles/lanterne.png). He never speaks, never stumbles, emits no light, carries no weapon. He carries a silver pendant on a chain under his chest plate, with Rose's portrait inside; it glows blue when she is near (seen in the forest at 2:05 and in the tavern).",
    tags: ["lanterne", "knight", "armour", "protagonist", "model_sheet"],
  },
  {
    id: "char.lanterne.still",
    kind: "character",
    subject: "lanterne",
    priority: 3,
    name: "Lanterne, episode still",
    image: "/images/sol.png",
    must_keep:
      "Same design as the model sheet, seen in the finished episode: the lantern helmet, the engraved pauldrons, the cream scarf, the dark chest plate with brass buckles, sitting on the altar among blue mushrooms.",
    description: "How the design reads once lit and animated. Use for materials and light on the armour.",
    tags: ["lanterne", "still"],
  },
  {
    id: "obj.pendant",
    kind: "object",
    name: "Silver pendant, film sheet",
    image: "/webtoon/references/pendant-film-sheet.jpg",
    must_keep:
      "Lanterne's pendant: a small round silver locket the size of a pocket watch, flat, with a plain polished rim and a small loop at the top for a thin silver chain. Closed, it is a smooth silver disc. Open, the lid hinges up and the inside shows a round portrait of Rose, a small pink-haired girl in a pale hooded cloak, against a blue forest, drawn like a painted miniature with a faint blue glow. Kept under the black chest plate; it fits in a gauntlet. Never a paper, a letter or a note.",
    description: "Three frames of the finished episode: taken out on its chain (2:09), open with Rose's portrait (2:13), closed on the moss where it landed (3:12). The design authority for the object; the studio can redraw it as a webtoon sheet from here.",
    tags: ["pendant", "object", "film"],
  },
  {
    id: "obj.helmet",
    kind: "object",
    name: "Fallen helmet, film sheet",
    image: "/webtoon/references/helmet-film-sheet.jpg",
    must_keep:
      "Lanterne's helmet alone, off his head: a pale grey-ivory cylinder shaped like a lantern, slightly wider at the base, with a small metal carrying ring on top, a thin decorative rim, and two small dark oval eye holes on the front; hollow, open at the bottom, nothing inside. On the ground it lies on its side among the mushrooms; in his hands both gauntlets hold it by the sides.",
    description: "Three frames of the finished episode: the helmet on the moss (1:31), held in both gauntlets (2:55), lifted to the open neck (2:57). Attached whenever the helmet is drawn away from the body.",
    tags: ["helmet", "lanterne", "object", "film"],
  },
  {
    id: "char.alien-machine",
    kind: "character",
    subject: "alien-machine",
    priority: 1,
    avatar: { x: 16, y: 45, zoom: 2.2 },
    name: "Alien machine, film sheet",
    image: "/webtoon/references/alien-machine-film-sheet.jpg",
    must_keep:
      "The sleeping machine of the blue forest: a colossal round body of dark rusted metal plates half buried in the ground, covered with moss, small blue flowers and cables, with one enormous round lens in a red-brown riveted rim in the middle; the lens is a closed shutter of petal-shaped plates when it sleeps and a giant orange-brown eye with a black pupil when it wakes. Around the body, many long segmented metal legs like black tubes with ball joints, and two huge dark red pincer claws. Scale: its body alone is about ten times Lanterne's height; one claw is as big as he is; standing on its legs it towers over the trees. Lanterne is the size of one of its rivets.",
    description: "Three frames of the finished episode: asleep between the trunks with Lanterne tiny before it (3:33), the closed lens and the claws (4:05), risen on its legs with the eye open (4:27). A creature sheet: attached like a character sheet whenever the machine is in a panel, with its scale.",
    tags: ["alien-machine", "machine", "creature", "film"],
  },
  {
    id: "char.ghost-rabbit",
    kind: "character",
    subject: "ghost-rabbit",
    priority: 1,
    avatar: { x: 16, y: 45, zoom: 2.2 },
    name: "Ghost rabbit, film sheet",
    image: "/webtoon/references/ghost-rabbit-film-sheet.jpg",
    must_keep:
      "A small translucent rabbit made of pale blue-white light, glowing, with long upright ears, a round body, two small dark eyes and a tiny mouth; its edges are soft, the forest shows through it. The size of a real rabbit, it sits on roots and vanishes into the mist. Never solid, never furry, never coloured.",
    description: "Three frames of the finished episode: its face (1:59), its whole body on a root (2:03), behind Lanterne (1:53). A creature sheet attached whenever the rabbit is in a panel.",
    tags: ["ghost-rabbit", "creature", "film"],
  },
  {
    id: "char.rose.webtoon",
    kind: "character",
    subject: "rose",
    priority: 1,
    name: "Rose, webtoon model sheet",
    image: "/webtoon/references/rose-webtoon-sheet.png",
    avatar: { x: 12, y: 8, zoom: 7 },
    must_keep:
      "Rose is a small young child. Short pink bob hair with a single small ahoge, a white flower tucked in her hair above her left temple, which reads on the viewer's right. Large soft brown eyes, small calm mouth. A pale cream long dress with wide sleeves and a lace hem, and a grey-green hooded short cloak fastened at the collar. Small, slight, gentle silhouette.",
    description:
      "Turnaround (front, three-quarter, side, back) plus three expressions (calm, gentle smile, eyes closed) in the webtoon style of the strip. Built from the two episode stills with GPT Image 2.5 Sunburst, since the production repo has no model sheet for Rose yet; the stills stay attached after it.",
    tags: ["rose", "child", "girl", "model_sheet", "webtoon"],
  },
  {
    id: "char.rose",
    kind: "character",
    subject: "rose",
    priority: 2,
    name: "Rose, episode still (face)",
    image: "/images/rose.png",
    must_keep:
      "Rose is a small young child. Short pink bob hair with a single small ahoge, a white flower tucked in her hair above her left temple, which reads on the viewer's right. Large soft brown eyes, small calm mouth. A pale cream long dress with wide sleeves and a lace hem, and a grey-green hooded short cloak fastened at the collar. Small, slight, gentle silhouette.",
    description:
      "Calm, serene, almost unreal. She looks at the world as if she heard what it forgot. She is a child, not a symbol.",
    tags: ["rose", "child", "girl"],
  },
  {
    id: "char.rose.full",
    kind: "character",
    subject: "rose",
    priority: 3,
    name: "Rose, episode still (full body)",
    image: "/images/hero-banner.png",
    must_keep:
      "Rose full body next to Lanterne: cream long dress with wide sleeves and a lace hem, grey-green hooded short cloak, short pink bob hair with the white flower, a small child about waist height to Lanterne, gentle silhouette.",
    description: "No model sheet exists for Rose yet (lost-garden/09_Fiches_modeles has none): the two episode stills are the canon reference.",
    tags: ["rose", "full_body", "still"],
  },
  {
    id: "style.webtoon.white",
    kind: "style",
    name: "Style anchor, white world",
    image: "/webtoon/references/style-white.jpg",
    must_keep:
      "Rendering only: large flat colour shapes, one hard cel shadow per element, clean ink lines, blown-out white background, no texture. Copy the flatness, the line weight and the colour treatment, never the content.",
    description: "An approved panel of the strip (v4 pass, Rose close-up) attached to every white-world panel so the rendering stays identical from one panel to the next.",
    tags: ["style", "anchor", "white"],
  },
  {
    id: "style.webtoon.blue",
    kind: "style",
    name: "Style anchor, blue sanctuary",
    image: "/webtoon/references/style-blue.jpg",
    must_keep:
      "Rendering only: a few big flat blue and black shapes, beams as flat translucent triangles, glow as flat halos, clean silhouettes, no texture. Copy the flatness and the colour treatment, never the content.",
    description: "An approved panel of the strip (v4 pass, sanctuary extreme wide) attached to every sanctuary panel so the dark panels keep the same simplicity.",
    tags: ["style", "anchor", "blue"],
  },
  {
    id: "loc.white-lily-field",
    kind: "location",
    name: "The white lily field (memory)",
    image: "/webtoon/ep1-opening/source/ep1-00m15s.jpg",
    must_keep:
      "An endless field of white lilies under a blown-out white sky. The ground rises in a soft crest. Everything is washed out and pale; the only colours are Rose's pink hair and the muted brown of Lanterne's pauldrons.",
    description:
      "The dream or memory that opens episode 1. No sun, no horizon detail, only white light and lilies; petals drift slowly.",
    tags: ["lily_field", "white", "memory", "dream"],
  },
  {
    id: "loc.altar-sanctuary",
    kind: "location",
    name: "The altar sanctuary",
    image: "/images/sol.png",
    must_keep:
      "A dark underground stone sanctuary. High above, a large ornate circular rose window glows cold cyan-blue, its tracery like a mandala; icicle-like stalactites hang from the vault around it. Wet carved stone walls in deep blue. In the centre, a long rectangular stone altar, like a sarcophagus lid, seen along its length. Thin mist on the floor, small blue bioluminescent mushrooms and blue moss at the edges, twisted roots on the walls.",
    description:
      "Where Lanterne wakes. Cold, silent, sacred without being religious. Light comes only from the rose window and the mushrooms.",
    tags: ["altar", "sanctuary", "cavern", "rose_window", "blue"],
  },
  {
    id: "loc.altar-sanctuary.window",
    kind: "location",
    name: "Rose window above the altar (source frame)",
    image: "/webtoon/ep1-opening/source/t29.jpg",
    must_keep:
      "The exact composition of the source: the altar seen from its foot in the lower half, the glowing rose window high above, stalactites around it, everything else in blue darkness.",
    description: "Frame at 0:30 of episode 1.",
    tags: ["altar", "rose_window", "source_frame"],
  },
  {
    id: "loc.cavern-wide",
    kind: "location",
    name: "The great cavern",
    image: "/images/underground-cavern.png",
    must_keep:
      "Architecture of the underground world: colossal twisted root-columns, floating stone platforms covered in blue moss, cyan mist, a distant terraced temple.",
    description: "The wider world beneath the earth, for context and palette only.",
    tags: ["cavern", "blue", "world"],
  },
  {
    id: "loc.blue-forest",
    kind: "location",
    name: "The blue forest",
    image: "/images/blue-forest.png",
    must_keep:
      "Blue forest lighting: black trunks, cyan mist, glowing blue mushrooms, pale lilies.",
    description: "Palette reference for every underground scene.",
    tags: ["blue_forest", "mushrooms", "palette"],
  },
  {
    id: "src.ep1.s01",
    kind: "source_frame",
    name: "Episode 1, 0:00, Lanterne in the white",
    image: "/webtoon/ep1-opening/source/t00.jpg",
    must_keep: "Lanterne alone in the white world, medium shot, facing the viewer, cape lifting right, petals.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s02",
    kind: "source_frame",
    name: "Episode 1, 0:05, lilies macro",
    image: "/webtoon/ep1-opening/source/ep1-00m05s.jpg",
    must_keep: "White lilies filling the frame, orange stamens, soft edges, white light.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s03",
    kind: "source_frame",
    name: "Episode 1, 0:09, the field",
    image: "/webtoon/ep1-opening/source/t09.jpg",
    must_keep: "Wide lily field: Lanterne small at left, Rose far right on the rise, white sky.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s04",
    kind: "source_frame",
    name: "Episode 1, 0:11, Rose close-up",
    image: "/webtoon/ep1-opening/source/t11.jpg",
    must_keep: "Rose's face against the white sky, flower on the viewer's right, eyes to camera.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s05",
    kind: "source_frame",
    name: "Episode 1, 0:13, the hem",
    image: "/webtoon/ep1-opening/source/t13.jpg",
    must_keep: "Lace hem of the cream dress and bare legs among lilies.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s06",
    kind: "source_frame",
    name: "Episode 1, 0:15, the hill",
    image: "/webtoon/ep1-opening/source/ep1-00m15s.jpg",
    must_keep: "A hill of lilies, Rose a speck at the summit, Lanterne a speck at the base left.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s07",
    kind: "source_frame",
    name: "Episode 1, 0:17, Find me",
    image: "/webtoon/ep1-opening/source/t17.jpg",
    must_keep: "Rose waist up in her cloak among lilies, speaking.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s09",
    kind: "source_frame",
    name: "Episode 1, 0:25, the sanctuary",
    image: "/webtoon/ep1-opening/source/ep1-00m25s.jpg",
    must_keep: "Extreme wide blue sanctuary: beams of light, roots, mushrooms, the altar tiny in the distance.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s10",
    kind: "source_frame",
    name: "Episode 1, 0:26, the larva",
    image: "/webtoon/ep1-opening/source/t26.jpg",
    must_keep: "Pale larva on a black root in the foreground, altar with the lying knight behind.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s11",
    kind: "source_frame",
    name: "Episode 1, 0:29, the rose window",
    image: "/webtoon/ep1-opening/source/t29.jpg",
    must_keep: "Altar from its foot, sabatons on the lid, the glowing rose window above, stalactites.",
    description: "Frame of the finished episode, composition and lighting reference.",
    tags: ["source_frame"],
  },
  {
    id: "src.ep1.s12",
    kind: "source_frame",
    name: "Episode 1, 0:33, the altar from the floor",
    image: "/webtoon/ep1-opening/source/ep1-00m33s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 0:33 of episode 1.",
    tags: ["ep1", "s12"],
  },
  {
    id: "src.ep1.s13",
    kind: "source_frame",
    name: "Episode 1, 0:38, the window wakes",
    image: "/webtoon/ep1-opening/source/ep1-00m38s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 0:38 of episode 1.",
    tags: ["ep1", "s13"],
  },
  {
    id: "src.ep1.s14",
    kind: "source_frame",
    name: "Episode 1, 0:40, the first beam on him",
    image: "/webtoon/ep1-opening/source/ep1-00m40s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 0:40 of episode 1.",
    tags: ["ep1", "s14"],
  },
  {
    id: "src.ep1.s15",
    kind: "source_frame",
    name: "Episode 1, 0:42, beams on the altar",
    image: "/webtoon/ep1-opening/source/ep1-00m42s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 0:42 of episode 1.",
    tags: ["ep1", "s15"],
  },
  {
    id: "src.ep1.s16",
    kind: "source_frame",
    name: "Episode 1, 0:44, the body under the light",
    image: "/webtoon/ep1-opening/source/ep1-00m44s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 0:44 of episode 1.",
    tags: ["ep1", "s16"],
  },
  {
    id: "src.ep1.s17",
    kind: "source_frame",
    name: "Episode 1, 0:47, light in the seams",
    image: "/webtoon/ep1-opening/source/ep1-00m47s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 0:47 of episode 1.",
    tags: ["ep1", "s17"],
  },
  {
    id: "src.ep1.s18",
    kind: "source_frame",
    name: "Episode 1, 0:50, he sits up",
    image: "/webtoon/ep1-opening/source/ep1-00m50s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 0:50 of episode 1.",
    tags: ["ep1", "s18"],
  },
  {
    id: "src.ep1.s19",
    kind: "source_frame",
    name: "Episode 1, 0:53, seated, still",
    image: "/webtoon/ep1-opening/source/ep1-00m53s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 0:53 of episode 1.",
    tags: ["ep1", "s19"],
  },
  {
    id: "src.ep1.s21",
    kind: "source_frame",
    name: "Episode 1, 0:58, he looks at his hand",
    image: "/webtoon/ep1-opening/source/ep1-00m58s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 0:58 of episode 1.",
    tags: ["ep1", "s21"],
  },
  {
    id: "src.ep1.s22",
    kind: "source_frame",
    name: "Episode 1, 1:01, he bends over himself",
    image: "/webtoon/ep1-opening/source/ep1-00m61s.jpg",
    must_keep: "Framing, light and palette of the shot.",
    description: "Frame at 1:01 of episode 1.",
    tags: ["ep1", "s22"],
  },
];

const byId = new Map(REFERENCE_LIBRARY.map((asset) => [asset.id, asset]));

export function getReference(id: string): ReferenceAsset {
  const asset = byId.get(id);
  if (!asset) throw new Error(`Unknown reference asset: ${id}`);
  return asset;
}

/**
 * Reference resolution: pick the assets a panel needs from what it shows.
 * Characters map to their sheets, the location to its sheet, and any source
 * frame listed by the analysis shot the panel draws from is attached as a
 * composition reference. Explicit ids on the panel always win.
 */
export function resolveReferences(input: {
  characters: string[];
  location: string;
  objects: string[];
  source_frames: string[];
  explicit?: string[];
  /** Style anchor id: an approved panel attached after the character sheets. */
  style?: string;
}): ReferenceAsset[] {
  const picked = new Map<string, ReferenceAsset>();
  const add = (asset: ReferenceAsset | undefined) => {
    if (asset && !picked.has(asset.id)) picked.set(asset.id, asset);
  };

  for (const id of input.explicit ?? []) add(byId.get(id));

  for (const character of input.characters) {
    const sheets = REFERENCE_LIBRARY.filter(
      (asset) => asset.kind === "character" && asset.subject === character,
    ).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
    // Two sheets per character at most: the webtoon sheet and the canon behind it.
    for (const sheet of sheets.slice(0, 2)) add(sheet);
  }
  if (input.style) add(byId.get(input.style));
  add(byId.get(`loc.${input.location}`));
  for (const object of input.objects) add(byId.get(`obj.${object}`));

  for (const frame of input.source_frames) {
    const match = REFERENCE_LIBRARY.find(
      (asset) => asset.kind === "source_frame" && asset.image === frame,
    );
    add(match);
  }

  return [...picked.values()];
}

export function isReferenceId(id: string): boolean {
  return byId.has(id);
}

/**
 * The library the studio works with: the code library, minus the ids the
 * studio hid, each built-in replaced by the studio's version when one has
 * the same id, plus the assets written in the studio. Assets without an
 * image stay listed (to be generated) but are never attached to a prompt.
 */
export function libraryWith(overlay?: LibraryOverlay | null): ReferenceAsset[] {
  if (!overlay) return REFERENCE_LIBRARY;
  const hidden = new Set(overlay.hidden);
  const custom = new Map(overlay.assets.map((asset) => [asset.id, { ...asset, custom: true }]));
  // A project of its own starts from nothing: the Lost Garden library never leaks into it.
  const base = overlay.base === "none" ? [] : REFERENCE_LIBRARY;
  const merged = base.filter((asset) => !hidden.has(asset.id)).map((asset) => custom.get(asset.id) ?? asset);
  const known = new Set(merged.map((asset) => asset.id));
  return [...merged, ...overlay.assets.filter((asset) => !known.has(asset.id) && !hidden.has(asset.id)).map((asset) => ({ ...asset, custom: true }))];
}

export function findReference(id: string, overlay?: LibraryOverlay | null): ReferenceAsset | undefined {
  return overlay ? libraryWith(overlay).find((asset) => asset.id === id) : byId.get(id);
}

/**
 * A film frame picked in the studio that has no library entry: any public
 * image path (or https URL) listed in `visual_references` becomes a
 * source-frame reference on the fly, attached last like the others.
 */
export function frameReference(image: string): ReferenceAsset {
  const match = /(\d{2})m(\d{2})s/.exec(image);
  const label = match ? `${Number(match[1])}:${match[2]}` : image.split("/").pop() ?? image;
  return {
    id: image,
    kind: "source_frame",
    name: `Episode frame at ${label}`,
    image,
    must_keep: "Framing, light and palette of the shot.",
    description: `Frame of the finished episode at ${label}, picked in the studio.`,
    tags: ["source_frame", "studio"],
  };
}

export function referencesForPanel(panel: WebtoonPanel, overlay?: LibraryOverlay | null): ReferenceAsset[] {
  return panel.visual_references
    .map((id) => findReference(id, overlay) ?? (id.startsWith("/") || id.startsWith("http") ? frameReference(id) : undefined))
    .filter((asset): asset is ReferenceAsset => Boolean(asset && asset.image));
}

export type LibraryEntry = { id: string; name: string; image?: string; avatar?: ReferenceAsset["avatar"] };

/** The face crop to use for a character sheet: the asset's own, or the turnaround default. */
export const DEFAULT_AVATAR = { x: 12, y: 9, zoom: 6.5 };

/** Character ids that have at least one sheet in the library, with a display name and the image of their first sheet. */
export function libraryCharacters(overlay?: LibraryOverlay | null): LibraryEntry[] {
  const seen = new Map<string, LibraryEntry>();
  for (const asset of [...libraryWith(overlay)].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))) {
    if (asset.kind !== "character" || !asset.subject) continue;
    const entry = seen.get(asset.subject);
    if (!entry) seen.set(asset.subject, { id: asset.subject, name: asset.name.split(",")[0], image: asset.image || undefined, avatar: asset.avatar });
    else if (!entry.image && asset.image) {
      entry.image = asset.image;
      entry.avatar = asset.avatar;
    }
  }
  return [...seen.values()];
}

/** Object ids (without the `obj.` prefix) that have a sheet in the library, with their image. */
export function libraryObjects(overlay?: LibraryOverlay | null): LibraryEntry[] {
  return libraryWith(overlay)
    .filter((asset) => asset.kind === "object")
    .map((asset) => ({ id: asset.id.replace(/^obj\./, ""), name: asset.name.split(",")[0], image: asset.image || undefined }));
}

/** Location ids (without the `loc.` prefix) that have a sheet in the library, with their image. */
export function libraryLocations(overlay?: LibraryOverlay | null): LibraryEntry[] {
  return libraryWith(overlay)
    .filter((asset) => asset.kind === "location")
    .map((asset) => ({ id: asset.id.replace(/^loc\./, ""), name: asset.name, image: asset.image || undefined }));
}
