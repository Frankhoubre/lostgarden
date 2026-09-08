import type { CharacterVisual } from "@/components/CharacterCard";

export const CHARACTER_IMAGES: Partial<Record<CharacterVisual, string>> = {
  sol: "/images/sol.jpg",
  rose: "/images/rose.jpg",
  machines: "/images/sleeping-machines.jpg",
  pilgrims: "/images/pelerins.jpg",
};

export const CHARACTER_IMAGE_FOCUS: Partial<Record<CharacterVisual, string>> = {
  sol: "center 28%",
  rose: "center 42%",
  machines: "center 35%",
  pilgrims: "center 42%",
};
