import { EPISODE_ONE } from "@/lib/episode";
import type { Locale } from "@/lib/i18n/config";

/** Edit these URLs when assets are ready in /public/press */
export const PRESS_TIKTOK = {
  videoId: "7647885636711501088",
  watchUrl: "https://www.tiktok.com/@frankhoubre/video/7647885636711501088",
  embedUrl: "https://www.tiktok.com/embed/v2/7647885636711501088",
  profileUrl: "https://www.tiktok.com/@frankhoubre",
  /** Update when metrics change */
  views: "26 000+",
  likes: "9 000+",
  commentCount: "430+",
} as const;

export const PRESS_KIT = {
  episodeUrl: EPISODE_ONE.watchUrl,
  episodeEmbedUrl: EPISODE_ONE.embedUrl,
  tiktokUrl: PRESS_TIKTOK.watchUrl,
  tiktokEmbedUrl: PRESS_TIKTOK.embedUrl,
  pressReleaseUrl: "/press/lost-garden-press-release.fr.txt",
  pressReleaseUrlEn: "/press/lost-garden-press-release.en.txt",
  pressKitZipUrl: "/press/lost-garden-press-kit.zip",
  pressAssetsBaseUrl: "/press",
  contactEmail: "frank.houbre@gmail.com",
  heroImageUrl: "/press/forest-machines.png",
  ogImageUrl: "/press/forest-machines.png",
  portraitImageUrl: "/press/frank-houbre-portrait.png",
  logoImageUrl: "/press/lost-garden-logo.png",
} as const;

export const PRESS_SOCIAL = {
  instagram: "https://www.instagram.com/frank.houbre",
  youtube: "https://www.youtube.com/@businessdynamite",
  tiktok: PRESS_TIKTOK.profileUrl,
} as const;

export type PressAssetId =
  | "pressRelease"
  | "images"
  | "portrait"
  | "logo"
  | "comments"
  | "episodeLinks"
  | "summary";

export type PressAssetFile = {
  filename: string;
  href: string;
  /** When set, used instead of href for non-default locales */
  hrefByLocale?: Partial<Record<Locale, string>>;
};

export const PRESS_ASSET_FILES: Record<PressAssetId, PressAssetFile> = {
  pressRelease: {
    filename: "lost-garden-press-release.fr.txt",
    href: PRESS_KIT.pressReleaseUrl,
    hrefByLocale: {
      en: PRESS_KIT.pressReleaseUrlEn,
    },
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
    filename: "lost-garden-audience-comments.txt",
    href: `${PRESS_KIT.pressAssetsBaseUrl}/lost-garden-audience-comments.txt`,
  },
  episodeLinks: {
    filename: "lost-garden-episode-links.txt",
    href: `${PRESS_KIT.pressAssetsBaseUrl}/lost-garden-episode-links.txt`,
  },
  summary: {
    filename: "lost-garden-project-summary.txt",
    href: `${PRESS_KIT.pressAssetsBaseUrl}/lost-garden-project-summary.txt`,
  },
};

export function pressAssetHref(asset: PressAssetFile, locale: Locale): string {
  return asset.hrefByLocale?.[locale] ?? asset.href;
}

export function pressAssetFilename(asset: PressAssetFile, locale: Locale): string {
  const href = pressAssetHref(asset, locale);
  return href.split("/").pop() ?? asset.filename;
}

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
  audience: "audience",
  release: "release",
  creator: "creator",
  assets: "assets",
  gallery: "gallery",
  quotes: "quotes",
  contact: "contact",
} as const;
