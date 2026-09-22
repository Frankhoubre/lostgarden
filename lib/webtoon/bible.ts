import type { ReferenceAsset } from "./types";

/**
 * THE BIBLE OF A PROJECT, built in the onboarding: the characters (people,
 * creatures, machines), then the important objects, then the locations and
 * biomes. Each step detects candidates in the film (or the screenplay), the
 * author keeps, rejects, renames, corrects or adds them, chooses the images
 * each sheet is drawn from, and generates the sheets. With the three steps
 * done the bible is complete and the strip can be generated.
 */

export type BibleStep = "characters" | "objects" | "locations";

export const BIBLE_STEPS: { id: BibleStep; label: string; noun: string; hint: string }[] = [
  { id: "characters", label: "Personnages", noun: "personnage", hint: "Tout ce qui vit ou agit : les personnes, les animaux, les créatures, les machines." },
  { id: "objects", label: "Objets", noun: "objet", hint: "Ce qu'une main tient, ouvre, lance, ou ce que l'histoire suit : un pendentif, une clé, une arme, un casque tombé." },
  { id: "locations", label: "Lieux et biomes", noun: "lieu", hint: "Chaque endroit où l'histoire se passe : une forêt, une grotte, une salle, un désert." },
];

export type BibleCandidate = {
  /** Lower case with hyphens: the id the panels will use. */
  id: string;
  name: string;
  kind: "character" | "creature" | "object" | "location";
  /** Design lock in English, written from the images: what every drawing must keep. */
  must_keep: string;
  /** What it is in the story, in a line. */
  description: string;
  /** Seconds of the film where it is visible (a sample). */
  seconds: number[];
  /** The two or three seconds where it is seen best: the default references of its sheet. */
  best_seconds: number[];
  importance: "main" | "secondary" | "minor";
  /** For a creature, a machine, a structure: its size against a person. */
  scale?: string;
};

/** The library asset a kept candidate becomes (its sheet is drawn afterwards). */
export function candidateAsset(candidate: BibleCandidate): ReferenceAsset {
  const tags = [candidate.id, "studio", "bible", ...(candidate.kind === "creature" ? ["creature"] : [])];
  const description = [candidate.description, candidate.scale ? `Scale: ${candidate.scale}.` : ""].filter(Boolean).join(" ");
  if (candidate.kind === "location") {
    return { id: `loc.${candidate.id}`, kind: "location", name: candidate.name, image: "", must_keep: candidate.must_keep, description, tags };
  }
  if (candidate.kind === "object") {
    return { id: `obj.${candidate.id}`, kind: "object", name: candidate.name, image: "", must_keep: candidate.must_keep, description, tags };
  }
  return { id: `char.${candidate.id}.webtoon`, kind: "character", subject: candidate.id, priority: 1, name: `${candidate.name}, webtoon model sheet`, image: "", must_keep: candidate.must_keep, description, tags };
}

/** The step a library asset belongs to. */
export function assetStep(asset: Pick<ReferenceAsset, "kind">): BibleStep | null {
  if (asset.kind === "character") return "characters";
  if (asset.kind === "object") return "objects";
  if (asset.kind === "location") return "locations";
  return null;
}

export function slugId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^(a|an|the|le|la|les|un|une) /, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
