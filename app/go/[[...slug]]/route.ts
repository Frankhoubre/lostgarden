import { LATEST_EPISODE } from "@/lib/episode";

// Destinations des liens courts /go/<source>-<destination>[-<format>], clé = utm_campaign.
const DESTINATIONS: Record<string, string> = {
  home: "/fr",
  en: "/en",
  episode: `/fr${LATEST_EPISODE.pathSuffix}`,
  anime: `/fr${LATEST_EPISODE.pathSuffix}`,
  animation: `/fr${LATEST_EPISODE.pathSuffix}`,
  manga: `/fr${LATEST_EPISODE.pathSuffix}`,
  webtoon: "/fr/webtoon",
  personnages: "/fr#characters",
};

const CANONICAL_ORIGIN = "https://www.lostgarden.world";

const SOURCES: Record<string, string> = {
  tt: "tiktok",
  yt: "youtube",
  li: "linkedin",
  x: "x",
  th: "threads",
  rd: "reddit",
  qa: "quora",
  md: "medium",
  sb: "substack",
  hn: "hackernoon",
  hf: "higgsfield",
  ig: "instagram",
  ud: "udemy",
  sk: "skool",
  em: "email",
  fb: "facebook",
  dc: "discord",
  bl: "blog",
};

const FORMATS: Record<string, string> = {
  c: "comment",
  m: "dm",
  p: "post",
  a: "article",
  b: "bio",
  s: "story",
  v: "video_description",
};

function clean(value: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  return decoded
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 80);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await params;
  const parts = clean(slug[0] ?? "").split("-").filter(Boolean);
  const content = slug[1] ? clean(slug[1]) : "";

  const sourceCode = parts[0] ?? "";
  let rest = parts.slice(1);
  let medium = "social";
  if (rest.length >= 2 && FORMATS[rest[rest.length - 1]]) {
    medium = FORMATS[rest[rest.length - 1]];
    rest = rest.slice(0, -1);
  }
  const campaign = rest.join("-") || "home";
  const path = DESTINATIONS[campaign] ?? DESTINATIONS.home;

  const url = new URL(path, CANONICAL_ORIGIN);
  url.searchParams.set("utm_source", SOURCES[sourceCode] ?? (sourceCode || "direct"));
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  if (content) url.searchParams.set("utm_content", content);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
