import { computeLayout } from "@/lib/webtoon/layout";
import { withPublishedPanels } from "@/lib/webtoon/published";
import { getWebtoonScript, WEBTOON_SLUGS } from "@/lib/webtoon/scripts";

/**
 * GET /api/webtoon/<slug>: the storyboard JSON the engine produced, with the
 * computed layout. This is the contract ScreenWeaver (or any renderer) reads.
 * When the studio published an edited version, that version is served.
 */
export const revalidate = 60;

export function generateStaticParams() {
  return WEBTOON_SLUGS.map((slug) => ({ slug }));
}

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const engineScript = getWebtoonScript(slug);
  if (!engineScript) {
    return Response.json({ error: "unknown webtoon script" }, { status: 404 });
  }
  const script = await withPublishedPanels(engineScript);
  return Response.json(
    { ...script, layout: computeLayout(script.panels) },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
