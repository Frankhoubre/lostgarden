import { REFERENCE_LIBRARY } from "@/lib/webtoon/references";
import { EP1_OPENING_ANALYSIS } from "@/lib/webtoon/sources/ep1-opening.analysis";
import filmFrames from "@/lib/webtoon/sources/ep1.film-frames.json";
import filmFramesDense from "@/lib/webtoon/sources/ep1.film-frames-2s.json";
import screenplay from "@/lib/webtoon/sources/ep1.screenplay.json";
import lieux from "@/lib/webtoon/sources/bible-lieux.json";
import dreamina from "@/lib/webtoon/sources/fiches-dreamina.json";
import trio from "@/lib/webtoon/sources/fiches-trio.json";
import type { ReferenceAsset, SourceAnalysis } from "@/lib/webtoon/types";

/**
 * Everything the private studio shows next to the strip: the screenplay,
 * the characters with their sheets, the locations, the film frames. Texts
 * come from the production repository (canon, behaviour sheets, Dreamina
 * design sheets) and are French, like the studio itself.
 */

export type StudioImage = { src: string; label: string; note?: string };

export type StudioTextBlock = { title: string; text: string };

export type StudioCharacter = {
  id: string;
  name: string;
  role: string;
  /** In the adapted segment already. */
  in_strip: boolean;
  images: StudioImage[];
  blocks: StudioTextBlock[];
};

export type StudioLocation = {
  id: string;
  name: string;
  images: StudioImage[];
  blocks: StudioTextBlock[];
};

export type StudioFrame = { src: string; seconds: number; label: string };

type DreaminaSheet = { code: string; name: string; kind: string; text: string };
type TrioSheet = { name: string; text: string };

const DREAMINA = dreamina as DreaminaSheet[];
const TRIO = trio as TrioSheet[];

function design(code: string): StudioTextBlock[] {
  const sheet = DREAMINA.find((entry) => entry.code === code);
  return sheet ? [{ title: "Design (fiche Dreamina)", text: sheet.text }] : [];
}

function behaviour(name: string): StudioTextBlock[] {
  const sheet = TRIO.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  return sheet ? [{ title: "Attitude, taille, manière de parler", text: sheet.text }] : [];
}

function mustKeep(assetId: string): StudioTextBlock[] {
  const asset = REFERENCE_LIBRARY.find((entry) => entry.id === assetId);
  return asset ? [{ title: "Verrou de design du moteur (injecté dans chaque prompt)", text: asset.must_keep }] : [];
}

export function tc(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(s % 1 ? 1 : 0).padStart(s % 1 ? 4 : 2, "0")}`;
}

export function studioCharacters(): StudioCharacter[] {
  const production = (file: string, label: string): StudioImage => ({
    src: `/webtoon/references/production/${file}.jpg`,
    label,
    note: "Planche modèle de production (09_Fiches_modeles)",
  });
  return [
    {
      id: "lanterne",
      name: "Lanterne",
      role: "Le Chevalier Lanterne, douzième des treize chevaliers. Une armure vide à tête de lanterne. Il ne parle jamais. Son enfant-source est Rose.",
      in_strip: true,
      images: [
        { src: "/webtoon/references/lanterne-webtoon-sheet.png", label: "Fiche webtoon", note: "Tour complet redessiné dans le style de la bande, jointe en premier sur chaque case." },
        { src: "/webtoon/references/lanterne-sheet.png", label: "Fiche anime", note: "Planche modèle de production, autorité de design." },
        { src: "/images/sol.png", label: "Still de l'épisode", note: "Assis sur l'autel, la lumière et les matières de la série." },
      ],
      blocks: [...mustKeep("char.lanterne.webtoon"), ...design("LAN"), ...behaviour("Lanterne")],
    },
    {
      id: "rose",
      name: "Rose",
      role: "L'enfant-source de Lanterne. Une seule réplique dans la première minute : « Find me. » Petite, calme, presque irréelle.",
      in_strip: true,
      images: [
        { src: "/webtoon/references/rose-webtoon-sheet.png", label: "Fiche webtoon", note: "Tour complet et trois expressions dans le style de la bande. Aucune planche de production n'existe pour Rose." },
        { src: "/images/rose.png", label: "Still, visage", note: "Le canon de son visage et de la fleur, côté gauche de sa tête, à droite pour le spectateur." },
        { src: "/images/hero-banner.png", label: "Still, corps entier", note: "Sa taille par rapport à Lanterne." },
      ],
      blocks: mustKeep("char.rose.webtoon"),
    },
    {
      id: "serrure",
      name: "Serrure",
      role: "Neuvième chevalier, une clé dorée sur le plastron. Il porte toute la parole des deux épisodes. Une demi-tête de plus que Lanterne, exactement.",
      in_strip: false,
      images: [production("serrure", "Planche modèle"), { src: "/images/serrure.png", label: "Visuel du site" }],
      blocks: [...design("SER"), ...behaviour("Serrure")],
    },
    {
      id: "bourdon",
      name: "Bourdon",
      role: "Géant de pierre à la barbe de feu, coule des cloches, rit avant de réfléchir.",
      in_strip: false,
      images: [production("bourdon", "Planche modèle")],
      blocks: design("BOU"),
    },
    {
      id: "barrik",
      name: "Barrik",
      role: "Un tonneau sur deux jambes. Personnage principal de l'épisode 3.",
      in_strip: false,
      images: [production("barrik", "Planche modèle")],
      blocks: [...design("BAR"), ...behaviour("Barrik")],
    },
    {
      id: "roi-voute",
      name: "Le Roi Voûte",
      role: "Le roi sous la voûte de l'épisode 2.",
      in_strip: false,
      images: [production("roi-voute", "Planche modèle")],
      blocks: design("ROI"),
    },
    {
      id: "decrocheur",
      name: "Le Décrocheur",
      role: "Chasseur de chevaliers, attiré par les médaillons ouverts.",
      in_strip: false,
      images: [production("decrocheur", "Planche modèle")],
      blocks: design("DEC"),
    },
    {
      id: "chevalier-sombre",
      name: "Le Chevalier Sombre",
      role: "",
      in_strip: false,
      images: [production("chevalier-sombre", "Planche modèle")],
      blocks: design("CHV"),
    },
    {
      id: "colosse-cuirasse",
      name: "Le Colosse cuirassé",
      role: "Planche modèle de production, sans fiche de design associée dans le dépôt.",
      in_strip: false,
      images: [production("colosse-cuirasse", "Planche modèle")],
      blocks: [],
    },
    {
      id: "reptilien-pale",
      name: "Le Reptilien pâle",
      role: "Planche modèle de production, sans fiche de design associée dans le dépôt.",
      in_strip: false,
      images: [production("reptilien-pale", "Planche modèle")],
      blocks: [],
    },
  ];
}

function libraryImages(filter: (asset: ReferenceAsset) => boolean): StudioImage[] {
  return REFERENCE_LIBRARY.filter(filter).map((asset) => ({ src: asset.image, label: asset.name, note: asset.description }));
}

export function studioLocations(): StudioLocation[] {
  const dreaminaLocations = DREAMINA.filter((entry) => entry.kind === "location").map((entry) => ({
    title: `${entry.name} (${entry.code})`,
    text: entry.text,
  }));
  return [
    {
      id: "white-lily-field",
      name: "Le champ de lys blanc (le souvenir)",
      images: libraryImages((a) => a.id === "loc.white-lily-field" || a.id === "style.webtoon.white"),
      blocks: mustKeep("loc.white-lily-field"),
    },
    {
      id: "altar-sanctuary",
      name: "Le sanctuaire souterrain et l'autel",
      images: libraryImages((a) => a.id.startsWith("loc.altar-sanctuary") || a.id === "loc.cavern-wide" || a.id === "style.webtoon.blue"),
      blocks: mustKeep("loc.altar-sanctuary"),
    },
    {
      id: "blue-forest",
      name: "La forêt bleue souterraine (suite de l'épisode)",
      images: [
        ...libraryImages((a) => a.id === "loc.blue-forest"),
        { src: "/images/forest-reference.png", label: "Référence forêt" },
        { src: "/images/sleeping-machines.png", label: "Les machines endormies" },
        { src: "/images/pelerins.png", label: "Les pèlerins" },
      ],
      blocks: mustKeep("loc.blue-forest"),
    },
    {
      id: "canon",
      name: "Fiches lieux de production et bible des lieux",
      images: [],
      blocks: [
        ...dreaminaLocations,
        { title: "Bible des lieux, principes", text: (lieux as { intro: string }).intro },
        ...(lieux as { places: StudioTextBlock[] }).places.map((place) => ({ title: `Bible des lieux · ${place.title}`, text: place.text })),
      ],
    },
  ];
}

export function studioFilmFrames(): StudioFrame[] {
  return (filmFrames as { src: string; seconds: number }[]).map((frame) => ({ ...frame, label: tc(frame.seconds) }));
}

/**
 * One frame every two seconds, for the writer: a gesture of three seconds
 * (a pendant taken out, opened, thrown) does not exist in the five-second
 * grid, and what no frame shows never gets a panel.
 */
export function studioFilmFramesDense(): StudioFrame[] {
  return (filmFramesDense as { src: string; seconds: number }[]).map((frame) => ({ ...frame, label: tc(frame.seconds) }));
}

/** Production documentation by character id, for the editable library. */
export function characterDocs(): Record<string, { role?: string; blocks: StudioTextBlock[]; extra?: StudioImage[] }> {
  const docs: Record<string, { role?: string; blocks: StudioTextBlock[]; extra?: StudioImage[] }> = {};
  for (const character of studioCharacters()) {
    docs[character.id] = {
      role: character.role,
      blocks: character.blocks.filter((block) => !block.title.startsWith("Verrou de design")),
      extra: character.images.filter((image) => !REFERENCE_LIBRARY.some((asset) => asset.image === image.src)),
    };
  }
  return docs;
}

/** Production documentation by location id, for the editable library. */
export function locationDocs(): Record<string, { role?: string; blocks: StudioTextBlock[]; extra?: StudioImage[] }> {
  const docs: Record<string, { role?: string; blocks: StudioTextBlock[]; extra?: StudioImage[] }> = {};
  for (const location of studioLocations()) {
    docs[location.id] = {
      blocks: location.blocks.filter((block) => !block.title.startsWith("Verrou de design")),
      extra: location.images.filter((image) => !REFERENCE_LIBRARY.some((asset) => asset.image === image.src)),
    };
  }
  return docs;
}

export const STUDIO_SCREENPLAY = screenplay as {
  title: string;
  source: string;
  pdf: string;
  pages: { page: number; text: string }[];
};

export const STUDIO_ANALYSIS: SourceAnalysis = EP1_OPENING_ANALYSIS;
