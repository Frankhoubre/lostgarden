import { computeLayout } from "@/lib/webtoon/layout";
import { getWebtoonScript, WEBTOON_SLUGS } from "@/lib/webtoon/scripts";

/**
 * GET /api/webtoon/<slug>: the storyboard JSON the engine produced, with the
 * computed layout. This is the contract ScreenWeaver (or any renderer) reads.
 */
export function generateStaticParams() {
  return WEBTOON_SLUGS.map((slug) => ({ slug }));
}

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const script = getWebtoonScript(slug);
  if (!script) {
    return Response.json({ error: "unknown webtoon script" }, { status: 404 });
  }
  return Response.json(
    { ...script, layout: computeLayout(script.panels) },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
