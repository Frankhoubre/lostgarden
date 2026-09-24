import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { panelForGeneration } from "@/lib/webtoon/compose";
import { buildGenerationRequest } from "@/lib/webtoon/generation";
import { checkPanelImage } from "@/lib/webtoon/image-check";
import { autoPlaced, fixLettering, imageToPanel, layoutBubbles, type Figure } from "@/lib/webtoon/lettering";
import { libraryWith } from "@/lib/webtoon/references";
import { bibleFor } from "@/lib/webtoon/style-bible";
import { generateWithGateway } from "@/lib/webtoon/providers/vercel-gateway";
import { getProjectContext } from "@/lib/webtoon/project-server";
import { recordCost } from "@/lib/webtoon/cost-server";
import { storeGeneratedImage } from "@/lib/webtoon/storage-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { LibraryOverlay, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/generate
 * Body: { panel_id: string, panel?: WebtoonPanel, model?: string }
 *
 * Regenerates one panel through Vercel AI Gateway (GPT Image 2.5 Sunburst by
 * default) with the panel's reference sheets attached. With a real studio
 * account the image is stored in Firebase Storage from here and only its
 * URL comes back (`src`); behind the dev bypass it comes back as a data URL. A panel written in the studio (empty prompt, or
 * `prompt_auto`) gets its references resolved and its prompt composed here,
 * from the same bible as the engine, and the composed prompt comes back
 * with the image. The editor shows it in place; persisting it into the strip
 * is done by `scripts/webtoon-generate.mjs`, which writes the file and
 * registers it. Needs AI_GATEWAY_API_KEY on the server, and a Firebase ID
 * token of a studio account in the Authorization header.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

async function referenceAsDataUrl(image: string): Promise<string> {
  if (image.startsWith("http")) return image;
  const file = path.join(process.cwd(), "public", image);
  const bytes = await readFile(file);
  const mime = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const { script } = context;

  const body = (await request.json().catch(() => ({}))) as {
    panel_id?: string;
    panel?: WebtoonPanel;
    model?: string;
    /** The studio's library changes, so its characters and locations are attached. */
    library?: LibraryOverlay;
    /** Image quality: "medium" costs about a third of "high" at the same size. */
    quality?: "low" | "medium" | "high";
  };
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [] } : null;
  const requested = body.panel ?? script.panels.find((p) => p.panel_id === body.panel_id);
  if (!requested) return Response.json({ error: "unknown panel" }, { status: 400 });
  const panel = panelForGeneration(requested, script, overlay);
  if (!panel.description.trim() && !panel.generation_prompt.trim()) {
    return Response.json({ error: "Écris d'abord une description de la case" }, { status: 400 });
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      { error: "AI_GATEWAY_API_KEY is not configured on this deployment" },
      { status: 503 },
    );
  }

  try {
    const generation = buildGenerationRequest(panel, body.model, overlay);
    const options = {
      model: body.model,
      quality: body.quality === "low" || body.quality === "medium" || body.quality === "high" ? body.quality : undefined,
      resolveReference: referenceAsDataUrl,
    };
    let image = await generateWithGateway(generation, options);
    let spent = image.cost_usd;
    // The drawn image, checked against the panel: cast, canon, state. One redraw with the faults named.
    const library = libraryWith(overlay);
    const canon = bibleFor(script.style_bible_id).canon;
    let check = await checkPanelImage({ image: `data:${image.media_type};base64,${image.base64}`, panel, library, canon });
    let checkCost = check.cost_usd;
    const firstIssues = check.issues;
    if (check.issues.length) {
      const again = await generateWithGateway({ ...generation, prompt: `${generation.prompt}\n\nFIX: the previous drawing of this panel was wrong: ${check.issues.join(" ")} Draw it again without these faults.` }, options);
      spent += again.cost_usd;
      image = again;
      check = await checkPanelImage({ image: `data:${image.media_type};base64,${image.base64}`, panel, library, canon });
      checkCost += check.cost_usd;
    }
    void recordCost({ idToken: identity.idToken, slug, usd: spent, kind: "images" });
    void recordCost({ idToken: identity.idToken, slug, usd: checkCost, kind: "writer" });
    // A memory in black and white is delivered in black and white, whatever tint the model left.
    if (panel.grade === "monochrome") {
      const grey = await sharp(Buffer.from(image.base64, "base64")).grayscale().jpeg({ quality: 92 }).toBuffer();
      image.base64 = grey.toString("base64");
      image.media_type = "image/jpeg";
    }
    // Bubbles placed from where the characters are in this image, unless someone placed them by hand.
    const lettered = fixLettering(panel, { mute: bibleFor(script.style_bible_id).mute });
    let dialogue = lettered.dialogue;
    if (lettered.dialogue.length && autoPlaced(lettered.dialogue)) {
      const meta = await sharp(Buffer.from(image.base64, "base64")).metadata();
      const box = { width: 1080, height: lettered.panel_height || 1350 };
      const figures: Figure[] = [];
      for (const f of check.figures) {
        const head = imageToPanel(f.head, { width: meta.width ?? 1024, height: meta.height ?? 1536 }, box, panel.focal_point);
        if (head) figures.push({ who: f.who, head });
      }
      dialogue = layoutBubbles({ dialogue: lettered.dialogue, sfx: panel.sfx, figures, panel: box, cast: [...new Set(libraryWith(overlay).filter((a) => a.kind === "character" && a.subject).map((a) => a.subject as string))] });
    }
    const extension = image.media_type === "image/jpeg" ? "jpg" : image.media_type === "image/webp" ? "webp" : "png";
    const src = await storeGeneratedImage({
      idToken: identity.idToken,
      path: `webtoon/${slug}/${panel.panel_id}/${Date.now()}.${extension}`,
      base64: image.base64,
      mediaType: image.media_type,
    });
    return Response.json({
      panel_id: panel.panel_id,
      model: image.model,
      ...(src ? { src } : { data_url: `data:${image.media_type};base64,${image.base64}` }),
      generated_at: new Date().toISOString(),
      cost_usd: spent + checkCost,
      dialogue,
      panel_height: lettered.panel_height,
      check: { first: firstIssues, remaining: check.issues, redrawn: firstIssues.length > 0 },
      generation_prompt: panel.generation_prompt,
      negative_constraints: panel.negative_constraints,
      visual_references: panel.visual_references,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "generation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
