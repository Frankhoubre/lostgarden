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
 * A sheet is a design document, not an illustration: plain white around the
 * subject, nothing written on it. Image models love to add "FRONT", "SIDE",
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
export function sheetPrompt(input: { asset: Pick<ReferenceAsset, "name" | "kind" | "tags" | "must_keep" | "description">; bible: StyleBible; scale?: string; palette?: string; /** Who stands next to a creature for scale: an adult human, or the hero of the series. */ scaleFigure?: string }): string {
  const { asset, bible } = input;
  const name = asset.name.split(",")[0].trim();
  const kind = sheetKind(asset);
  const lines = [bible.base];
  if (kind === "character") {
    lines.push(
      `CHARACTER MODEL SHEET of ${name}, in the webtoon style described above. Top row: the whole body four times at the same scale and in the same neutral standing pose, arms slightly away from the body: front view, three-quarter view, side view, back view, evenly spaced. Bottom row: three head-and-shoulders portraits of the same character, larger: a calm face, a gentle smile, a worried face. Every view shows exactly the same design, clothes, colours and proportions.`,
    );
  } else if (kind === "creature") {
    lines.push(
      `CREATURE OR MACHINE DESIGN SHEET of ${name}, in the webtoon style described above. Top row: the whole body from the front, from three-quarter and from the side, at the same scale, exactly as the reference images show it. Bottom row: a large detail of its most striking part (an eye, a claw, a lens, a mouth, a joint)${input.scale ? `, and a small silhouette of ${input.scaleFigure ?? "an adult human"} standing next to one of its feet, drawn at true relative scale (${input.scale}), so the sheet says how big it is` : ""}.`,
    );
  } else if (kind === "object") {
    lines.push(
      `OBJECT DESIGN SHEET of ${name}, in the webtoon style described above. The object large and centred, seen from the front and from three-quarter. When it opens or changes state, each state side by side (closed, open, with what is inside drawn exactly as the reference images show it). Below, a small detail of its most important part. Same shape, same materials, same colours and same size relation to a hand as in the reference images. No hand, unless one is needed to show how it is held.`,
    );
  } else {
    lines.push(
      `LOCATION DESIGN SHEET of ${name}, in the webtoon style described above: one wide establishing illustration of the place, empty of characters, composed as a reference for future panels (main volumes, light sources, palette, ground, what surrounds it), exactly as the reference images show the place.`,
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
