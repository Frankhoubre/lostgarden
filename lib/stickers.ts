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
    slug: "lanterne-this-is-fine",
    title: "Lanterne: everything's going to be fine",
    tags: ["this is fine", "fine", "everything is fine", "fire", "calm", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "serrure-never-wrong",
    title: "Serrure: never wrong",
    tags: ["never wrong", "confident", "trust me", "i was right", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "lanterne-sure",
    title: "Lanterne: sure",
    tags: ["sure", "doubt", "skeptical", "mouais", "stare", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "forgeron-nope",
    title: "The blacksmith: nope",
    tags: ["nope", "no", "no way", "rejected", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "lanterne-yes",
    title: "Lanterne: yes!",
    tags: ["yes", "celebrate", "victory", "happy", "hooray", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "barrik-still-the-worst",
    title: "Serrure: yep, still the worst",
    tags: ["the worst", "still the worst", "friends", "reunion", "barrel", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "souris-peek",
    title: "The mouse peeks",
    tags: ["peek", "peeking", "hiding", "cute", "mouse", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "serrure-sorry",
    title: "Serrure: one of the weakest, sorry",
    tags: ["sorry", "not sorry", "weak", "burn", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "lanterne-facepalm",
    title: "Lanterne holds his helm",
    tags: ["facepalm", "headache", "oh no", "stress", "why", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "forgeron-just-kidding",
    title: "The blacksmith: just kidding",
    tags: ["just kidding", "joke", "lol", "kidding", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "serrure-simple",
    title: "Serrure: simple, very simple",
    tags: ["simple", "easy", "no problem", "piece of cake", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "who-taught-this-guy",
    title: "Who taught this guy?",
    tags: ["who taught you", "really", "seriously", "judging", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "lanterne-oops",
    title: "Oops",
    tags: ["oops", "fail", "my bad", "fall", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "demon-probably",
    title: "Probably",
    tags: ["probably", "maybe", "eyes", "darkness", "uncertain", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "relax-just-a-demon",
    title: "Relax, it's just a demon",
    tags: ["relax", "calm down", "no worries", "chill", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "forgeron-hmm",
    title: "The blacksmith: hmm",
    tags: ["hmm", "thinking", "deciding", "let me think", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "serrure-life-impossible",
    title: "He's gonna make my life impossible",
    tags: ["annoying", "trouble", "my life", "ugh", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "not-the-back",
    title: "Not the back!",
    tags: ["oh no", "watching", "cringe", "not the back", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "serrure-you-did-good",
    title: "Serrure: you did good today",
    tags: ["good job", "proud", "well done", "wholesome", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "barrik-silhouette",
    title: "Barrik's silhouette",
    tags: ["wait", "i know that", "who is that", "barrel", "desert", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "serrure-never-lost",
    title: "Serrure: I never get lost",
    tags: ["never lost", "told you", "see", "proud", "lost garden"],
    width: 480,
    height: 270,
  },
  {
    slug: "serrure-another-knight",
    title: "Serrure: another knight",
    tags: ["welcome", "hello", "another one", "hi", "lost garden"],
    width: 480,
    height: 270,
  },
];

export const STICKERS: Sticker[] = [];

/** Leave a value empty to hide its link on the page. */
export const LINKS: { giphy: string; tenor: string; telegram: string } = {
  giphy: "https://giphy.com/channel/lostgardenworld",
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
