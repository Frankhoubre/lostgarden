/** Carousel order: leftmost slide is knight 13, then 12, … down to 1. */
export const KNIGHTS_CAROUSEL_ORDER = [
  13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
] as const;

export type KnightNumber = (typeof KNIGHTS_CAROUSEL_ORDER)[number];

export const REVEALED_KNIGHT_NUMBERS = new Set<KnightNumber>([12, 9]);

export function isKnightRevealed(number: KnightNumber): boolean {
  return REVEALED_KNIGHT_NUMBERS.has(number);
}

export type KnightVisual = "lanterne" | "serrure" | "hidden";

export const KNIGHT_VISUALS: Partial<Record<KnightNumber, KnightVisual>> = {
  12: "lanterne",
  9: "serrure",
};

export const KNIGHT_IMAGES: Partial<Record<KnightNumber, string>> = {
  12: "/images/sol.png",
  9: "/images/serrure.png",
};

export const KNIGHT_IMAGE_FOCUS: Partial<Record<KnightNumber, string>> = {
  12: "center 28%",
  9: "center 35%",
};

export const KNIGHT_ROMAN: Record<KnightNumber, string> = {
  13: "XIII",
  12: "XII",
  11: "XI",
  10: "X",
  9: "IX",
  8: "VIII",
  7: "VII",
  6: "VI",
  5: "V",
  4: "IV",
  3: "III",
  2: "II",
  1: "I",
};
