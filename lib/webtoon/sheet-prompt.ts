import type { StyleBible } from "./style-bible";
import type { ReferenceAsset } from "./types";

/**
 * SHEET PROMPTS: the prepared prompt of every reference sheet of the bible
 * (a character, a creature or a machine, an object, a location). Shared by
 * the asset route, which sends it, and the studio, which shows it before
 * generation so the author can read it, change it, and choose the reference
 * images (the frames where the film shows the thing, or images of their
 * own). The route appends the list of the images actually attached.
 *
 * A sheet is a design document, not an illustration: one sheet per
 * character, creature or object, three views (front, side, back) on plain
 * white, nothing written on it; a location gets one aerial establishing view. Image models love to add "FRONT", "SIDE",
 * colour swatches and a floor shadow; the prompt forbids each by name, and
 * the route checks the result and cleans the white.
 */

export type SheetKind = "character" | "creature" | "object" | "location";

export function sheetKind(asset: Pick<ReferenceAsset, "kind" | "tags">): SheetKind {
  if (asset.kind === "location") return "location";
  if (asset.kind === "object") return "object";
  return (asset.tags ?? []).some((t) => /creature|machine|monster|animal/i.test(t)) ? "creature" : "character";
}

export const SHEET_KIND_LABEL: Record<SheetKind, string> = {
  character: "Personnage",
  creature: "Créature ou machine",
  object: "Objet",
  location: "Lieu",
};

const CLEAN_WHITE =
  "BACKGROUND: pure flat white (#FFFFFF) all around the subject, edge to edge. No floor, no ground line, no cast shadow under the feet, no gradient, no texture, no vignette, no frame, no border, no panel lines.";

const NO_TEXT =
  "NO TEXT OF ANY KIND: no title, no name, no view labels (no FRONT, SIDE, BACK, 3/4), no arrows, no measurement lines, no numbers, no colour swatches or palette chips, no notes, no signature, no logo, no watermark. Only the drawings.";

/** The prepared prompt of a sheet, without the list of reference images. */
export function sheetPrompt(input: { asset: Pick<ReferenceAsset, "name" | "kind" | "tags" | "must_keep" | "description">; bible: StyleBible; scale?: string; palette?: string}): string {
  const { asset, bible } = input;
  const name = asset.name.split(",")[0].trim();
  const kind = sheetKind(asset);
  const lines = [bible.base];
  // One sheet per subject, three views and nothing else: the author's rule (28 September 2026). The
  // portraits, details and scale figures of the earlier sheets are gone; what a panel needs is the
  // design seen from the front, the side and the back.
  const THREE_VIEWS =
    "EXACTLY THREE VIEWS, side by side on one row, evenly spaced, the same size and the same scale, in the same neutral pose: on the left the FRONT view, in the middle the SIDE view in strict profile, on the right the BACK view. Each view shows the whole subject, nothing cropped. Nothing else on the sheet: no fourth view, no three-quarter view, no portrait, no close-up, no expression, no detail inset, no second figure, no prop lying around.";
  if (kind === "character") {
    lines.push(`CHARACTER TURNAROUND SHEET of ${name}, in the webtoon style described above. ${THREE_VIEWS} Full body, standing, arms slightly away from the body. Every view shows exactly the same design, clothes, colours and proportions.`);
  } else if (kind === "creature") {
    lines.push(`CREATURE OR MACHINE TURNAROUND SHEET of ${name}, in the webtoon style described above, exactly as the reference images show it. ${THREE_VIEWS} Every view shows exactly the same design, parts, colours and proportions${input.scale ? ` (its true size: ${input.scale})` : ""}.`);
  } else if (kind === "object") {
    lines.push(`OBJECT TURNAROUND SHEET of ${name}, in the webtoon style described above, exactly as the reference images show it. ${THREE_VIEWS} The object alone, large, no hand holding it. Same shape, materials and colours in every view.`);
  } else {
    lines.push(
      `AERIAL ESTABLISHING VIEW of ${name}, in the webtoon style described above: the place seen from high above at a three-quarter angle, wide enough to show the whole place and what surrounds it, its main volumes, its ground, its light sources and its atmosphere (mist, glow, depth), exactly as the reference images show the place. One single illustration, a reference for every future panel set here. ABSOLUTELY NOBODY IN IT: no character, no person, no figure, no silhouette however small or distant, no creature, no animal, no machine or monster of the story, even when the reference images show one there: draw the place as if everyone had left it.`,
    );
  }
  lines.push(`DESIGN LOCKED, copy exactly: ${asset.must_keep.trim()}`);
  if (asset.description?.trim()) lines.push(`NOTES: ${asset.description.trim()}`);
  if (kind === "location" && input.palette && bible.palettes[input.palette]) lines.push(bible.palettes[input.palette]);
  if (kind !== "location") lines.push(CLEAN_WHITE);
  lines.push(NO_TEXT);
  lines.push(bible.rendering.filter((rule) => !rule.startsWith("Composition designed") && !rule.startsWith("The artwork fills")).join(" "));
  lines.push("DO NOT: " + bible.negative.join(" "));
  return lines.join("\n\n");
}
