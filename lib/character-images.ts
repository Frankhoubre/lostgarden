import type { CharacterVisual } from "@/components/CharacterCard";

export const CHARACTER_IMAGES: Partial<Record<CharacterVisual, string>> = {
  sol: "/images/sol.png",
  rose: "/images/rose.png",
  machines: "/images/sleeping-machines.png",
};

export const CHARACTER_IMAGE_FOCUS: Partial<Record<CharacterVisual, string>> = {
  sol: "center 28%",
  rose: "center 42%",
  machines: "center 35%",
};
