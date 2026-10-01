/**
 * Stickers & GIFs page (/[locale]/stickers).
 *
 * Files expected in /public/stickers:
 * - gif/<slug>.gif   the file people download or link to
 * - mp4/<slug>.mp4   the looping preview shown on the page
 * - webp/<slug>.webp one file per sticker
 * - lost-garden-gifs.zip  every GIF in one pack
 */

export type StickerGif = {
  slug: string;
  title: string;
  tags: string[];
  /** Pixel size of the GIF, used for the card's aspect ratio. */
  width: number;
  height: number;
};

export type Sticker = {
  slug: string;
  title: string;
};

export const GIFS: StickerGif[] = [
  {
    slug: "serrure-i-got-this",
    title: "Serrure: I got this",
    tags: ["serrure", "confident", "ok"],
    width: 480,
    height: 270,
  },
  {
    slug: "lanterne-mouais",
    title: "Lanterne: mouais",
    tags: ["lanterne", "doubt", "meh"],
    width: 480,
    height: 270,
  },
  {
    slug: "barrik-cheers",
    title: "Barrik: cheers",
    tags: ["barrik", "cheers", "celebrate"],
    width: 480,
    height: 270,
  },
];

export const STICKERS: Sticker[] = [];

/** Leave a value empty to hide its link on the page. */
export const LINKS: { giphy: string; tenor: string; telegram: string } = {
  giphy: "",
  tenor: "",
  telegram: "",
};

export const STICKERS_ZIP_URL = "/stickers/lost-garden-gifs.zip";

export function gifUrl(slug: string): string {
  return `/stickers/gif/${slug}.gif`;
}

export function gifPreviewUrl(slug: string): string {
  return `/stickers/mp4/${slug}.mp4`;
}

export function stickerUrl(slug: string): string {
  return `/stickers/webp/${slug}.webp`;
}
