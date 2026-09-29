import type { Anchor, Dialogue, Sfx } from "./types";

/**
 * THE SOUND EFFECTS OF THE STRIP, ready to drop on a panel: each one has its
 * drawn style (a burst behind an impact, a steel gradient on metal, speed
 * lines behind a rush of air, jagged letters on a crack), a size and a slant
 * that suit it, and its onomatopoeia in the four languages of the lettering
 * (Japanese in katakana, Korean in hangul, the sound each language hears,
 * not a translation of the word).
 */

export const SFX_STYLES = ["soft", "hard", "rumble", "impact", "metal", "whoosh", "crack"] as const;
export type SfxStyle = (typeof SFX_STYLES)[number];

export const SFX_STYLE_LABEL: Record<SfxStyle, string> = {
  soft: "Doux",
  hard: "Dur",
  rumble: "Grondement",
  impact: "Impact",
  metal: "Métal",
  whoosh: "Souffle",
  crack: "Craquement",
};

export type SfxPreset = { id: string; label: string; hint: string; effect: Omit<Sfx, "anchor"> };

export const SFX_LIBRARY: SfxPreset[] = [
  { id: "blow", label: "Coup", hint: "Un poing, une lame qui frappe", effect: { text: { en: "BAM", fr: "BAM", ja: "ドン", ko: "쾅" }, style: "impact", size: 220, rotate: -8 } },
  { id: "ground", label: "Coup au sol", hint: "Frapper la terre, un choc sourd", effect: { text: { en: "THOOM", fr: "BOUM", ja: "ドゴォ", ko: "쿵" }, style: "impact", size: 260, rotate: 4 } },
  { id: "fall", label: "Chute", hint: "Un corps ou un objet qui tombe", effect: { text: { en: "THUD", fr: "POC", ja: "ドサッ", ko: "털썩" }, style: "hard", size: 150, rotate: -6 } },
  { id: "clang", label: "Métal", hint: "Armure, épée, casque qui sonne", effect: { text: { en: "CLANG", fr: "KLANG", ja: "ガキン", ko: "챙" }, style: "metal", size: 190, rotate: -10 } },
  { id: "clink", label: "Tintement", hint: "Un médaillon, une chaîne, un petit métal", effect: { text: { en: "tink", fr: "ting", ja: "チャリン", ko: "딸랑" }, style: "metal", size: 90, rotate: -6 } },
  { id: "whoosh", label: "Souffle", hint: "Un objet lancé, un mouvement rapide", effect: { text: { en: "FWOOSH", fr: "FIOUUU", ja: "ヒュッ", ko: "휙" }, style: "whoosh", size: 150, rotate: -4 } },
  { id: "wind", label: "Vent", hint: "Le vent dans les herbes, une brise", effect: { text: { en: "fshhh", fr: "fffff", ja: "ヒュウウ", ko: "휘이잉" }, style: "soft", size: 80, rotate: -12 } },
  { id: "crack", label: "Craquement", hint: "Pierre qui se fend, sol qui cède", effect: { text: { en: "KRAK", fr: "KRAK", ja: "バキッ", ko: "쩍" }, style: "crack", size: 200, rotate: 8 } },
  { id: "rumble", label: "Grondement", hint: "La caverne, une machine, la terre", effect: { text: { en: "RRRMBL", fr: "GRRRR", ja: "ゴゴゴ", ko: "우르르" }, style: "rumble", size: 180, rotate: 0 } },
  { id: "hum", label: "Bourdonnement", hint: "La rosace, une lumière, une énergie", effect: { text: { en: "vmmmm", fr: "vmmmm", ja: "ヴウウン", ko: "우웅" }, style: "rumble", size: 90, rotate: -6 } },
  { id: "step", label: "Pas", hint: "Des pas lourds d'armure", effect: { text: { en: "klank klank", fr: "klonk klonk", ja: "ガシャ ガシャ", ko: "철컥 철컥" }, style: "hard", size: 80, rotate: -4 } },
  { id: "heart", label: "Battement", hint: "Un cœur, une attente", effect: { text: { en: "ba-dum", fr: "boum-boum", ja: "ドクン", ko: "두근" }, style: "soft", size: 100, rotate: 0 } },
];

/**
 * Where a new sound goes: the free spot of the panel farthest from its
 * bubbles and other sounds, so it never lands on a line of dialogue.
 */
export function freeSpot(taken: { dialogue: Pick<Dialogue, "anchor">[]; sfx: Pick<Sfx, "anchor">[] }): Anchor {
  const others = [...taken.dialogue.map((d) => d.anchor), ...taken.sfx.map((s) => s.anchor)];
  const spots: Anchor[] = [
    { x: 62, y: 30 },
    { x: 38, y: 70 },
    { x: 70, y: 72 },
    { x: 30, y: 28 },
    { x: 50, y: 50 },
    { x: 72, y: 50 },
  ];
  if (!others.length) return spots[0];
  const distance = (a: Anchor) => Math.min(...others.map((o) => Math.hypot(o.x - a.x, o.y - a.y)));
  return spots.reduce((best, spot) => (distance(spot) > distance(best) + 4 ? spot : best), spots[0]);
}

/** A seeded wobble per letter, so a drawn sound keeps its shape from one render to the next. */
export function letterJitter(text: string, index: number, strength: number): { rotate: number; scale: number; lift: number } {
  let h = 2166136261 ^ index;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (index * 374761393), 668265263);
  const r = (shift: number) => (((h >>> shift) & 0xff) / 255) * 2 - 1;
  return { rotate: r(0) * 9 * strength, scale: 1 + r(8) * 0.12 * strength, lift: r(16) * 0.08 * strength };
}
