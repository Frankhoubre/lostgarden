import { Bangers, Nunito } from "next/font/google";

/** Webtoon lettering faces: a rounded sans for bubbles, a display face for SFX. Shared by the reader and the studio canvas. */
export const bubbleFont = Nunito({ subsets: ["latin", "latin-ext"], weight: ["600", "800"], variable: "--font-bubble", display: "swap" });
export const sfxFont = Bangers({ subsets: ["latin"], weight: "400", variable: "--font-sfx", display: "swap" });
