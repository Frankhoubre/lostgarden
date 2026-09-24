import sharp from "sharp";
import { recordCost } from "@/lib/webtoon/cost-server";
import { checkPanelImage } from "@/lib/webtoon/image-check";
import { imageToPanel, layoutBubbles, type Figure } from "@/lib/webtoon/lettering";
import { getProjectContext, imageAsDataUrl } from "@/lib/webtoon/project-server";
import { libraryWith } from "@/lib/webtoon/references";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import { bibleFor } from "@/lib/webtoon/style-bible";
import type { LibraryOverlay, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/letter
 * Body: { panel: WebtoonPanel, library?: LibraryOverlay }
 *
 * Places the bubbles of a panel already drawn, without drawing it again: a
 * vision model finds where each character is in the image, then each bubble
 * goes next to the one who speaks, the tail on him, inside the panel, over
 * no other bubble and no sound effect. Also returns what the image breaks
 * (cast, canon, state), so the studio can say which panels to redraw.
 */

export const maxDuration = 60;

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { panel?: WebtoonPanel; library?: LibraryOverlay };
  const panel = body.panel;
  if (!panel?.image?.src) return Response.json({ error: "la case n'a pas d'image" }, { status: 400 });
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [] } : null;
  try {
    const image = await imageAsDataUrl(panel.image.src);
    const check = await checkPanelImage({ image, panel, library: libraryWith(overlay), canon: bibleFor(context.script.style_bible_id).canon });
    void recordCost({ idToken: identity.idToken, slug, usd: check.cost_usd, kind: "writer" });
    const meta = await sharp(Buffer.from(image.slice(image.indexOf(",") + 1), "base64")).metadata();
    const box = { width: 1080, height: panel.panel_height || 1350 };
    const figures: Figure[] = [];
    for (const f of check.figures) {
      const head = imageToPanel(f.head, { width: meta.width ?? 1024, height: meta.height ?? 1536 }, box, panel.focal_point);
      if (head) figures.push({ who: f.who, head });
    }
    const dialogue = panel.dialogue.length ? layoutBubbles({ dialogue: panel.dialogue, sfx: panel.sfx, figures, panel: box }) : panel.dialogue;
    return Response.json({ dialogue, issues: check.issues, cost_usd: check.cost_usd });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "lettering failed" }, { status: 502 });
  }
}
