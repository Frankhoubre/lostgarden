import { EPISODE_ONE } from "@/lib/episode";

/** Edit these URLs when assets are ready in /public/press */
export const PRESS_KIT = {
  episodeUrl: EPISODE_ONE.watchUrl,
  episodeEmbedUrl: EPISODE_ONE.embedUrl,
  pressReleasePdfUrl: "/press/lost-garden-press-release.pdf",
  pressKitZipUrl: "/press/lost-garden-press-kit.zip",
  pressAssetsBaseUrl: "/press",
  contactEmail: "frank.houbre@gmail.com",
  heroImageUrl: "/press/forest-machines.png",
  ogImageUrl: "/press/forest-machines.png",
  portraitImageUrl: "/press/frank-houbre-portrait.png",
  logoImageUrl: "/images/logo-lost-garden.png",
} as const;

export const PRESS_SOCIAL = {
  instagram: "https://www.instagram.com/frank.houbre",
  youtube: "https://www.youtube.com/@businessdynamite",
  tiktok: "https://www.tiktok.com/@frankhoubre",
} as const;

export type PressAssetId =
  | "pressRelease"
  | "images"
  | "portrait"
  | "logo"
  | "comments"
  | "episodeLinks"
  | "summary";

export const PRESS_ASSET_FILES: Record<
  PressAssetId,
  { filename: string; href: string }
> = {
  pressRelease: {
    filename: "lost-garden-press-release.pdf",
    href: PRESS_KIT.pressReleasePdfUrl,
  },
  images: {
    filename: "lost-garden-hd-images.zip",
    href: `${PRESS_KIT.pressAssetsBaseUrl}/lost-garden-hd-images.zip`,
  },
  portrait: {
    filename: "frank-houbre-portrait.png",
    href: PRESS_KIT.portraitImageUrl,
  },
  logo: {
    filename: "lost-garden-logo.png",
    href: PRESS_KIT.logoImageUrl,
  },
  comments: {
    filename: "lost-garden-audience-comments.png",
    href: `${PRESS_KIT.pressAssetsBaseUrl}/lost-garden-audience-comments.png`,
  },
  episodeLinks: {
    filename: "lost-garden-episode-links.txt",
    href: `${PRESS_KIT.pressAssetsBaseUrl}/lost-garden-episode-links.txt`,
  },
  summary: {
    filename: "lost-garden-project-summary.pdf",
    href: `${PRESS_KIT.pressAssetsBaseUrl}/lost-garden-project-summary.pdf`,
  },
};

export const PRESS_GALLERY_IMAGES = [
  {
    src: "/press/forest-machines.png",
    altKey: "forestMachines" as const,
    width: 1024,
    height: 576,
  },
  {
    src: "/press/lanterne-portrait.png",
    altKey: "lanterne" as const,
    width: 1024,
    height: 576,
  },
  {
    src: "/press/rose-capsule.png",
    altKey: "roseCapsule" as const,
    width: 1024,
    height: 576,
  },
  {
    src: "/press/tavern-knights.png",
    altKey: "tavern" as const,
    width: 1024,
    height: 576,
  },
] as const;

export const PRESS_EPISODE_STILL = "/press/rose-capsule.png";

export const PRESS_SECTION_IDS = {
  story: "story",
  facts: "facts",
  episode: "episode",
  watch: "watch",
  release: "release",
  creator: "creator",
  assets: "assets",
  gallery: "gallery",
  quotes: "quotes",
  contact: "contact",
} as const;
