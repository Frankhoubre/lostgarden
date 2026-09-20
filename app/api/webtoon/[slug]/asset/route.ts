import { readFile } from "node:fs/promises";
import path from "node:path";
import { generateWithGateway } from "@/lib/webtoon/providers/vercel-gateway";
import { libraryWith } from "@/lib/webtoon/references";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { recordCost } from "@/lib/webtoon/cost-server";
import { storeGeneratedImage } from "@/lib/webtoon/storage-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import { STYLE_BIBLE } from "@/lib/webtoon/style-bible";
import type { LibraryOverlay, ReferenceAsset } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/asset
 * Body: { asset: ReferenceAsset, library?: LibraryOverlay, palette?: string }
 *
 * Draws a reference sheet for the studio's library: a character turnaround
 * in the webtoon style of the strip, or a location design illustration.
 * The design lock of the asset (`must_keep`) drives the prompt; the other
 * images of the same subject and the style anchor are attached so the
 * sheet matches what the strip already shows. Returns the image as a data
 * URL; the studio stores it and points the asset to it.
 */

export const maxDuration = 120;

type RouteContext = { params: Promise<{ slug: string }> };

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

async function referenceAsDataUrl(image: string): Promise<string> {
  if (image.startsWith("http")) return image;
  const file = path.join(process.cwd(), "public", image);
  const bytes = await readFile(file);
  return `data:${MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream"};base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const script = getWebtoonScript(slug);
  if (!script) return Response.json({ error: "unknown webtoon script" }, { status: 404 });
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { asset?: ReferenceAsset; library?: LibraryOverlay; palette?: string };
  const asset = body.asset;
  if (!asset?.id || !asset.must_keep?.trim()) return Response.json({ error: "Décris d'abord l'élément (verrou de design)" }, { status: 400 });
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [] } : null;
  const library = libraryWith(overlay);
  const palette = body.palette && STYLE_BIBLE.palettes[body.palette] ? body.palette : asset.kind === "character" ? "white_memory" : "blue_sanctuary";
  const anchorId = script.style_anchors?.[palette];

  const references: ReferenceAsset[] = [];
  if (asset.kind === "character") {
    for (const sheet of library.filter((a) => a.kind === "character" && a.subject === asset.subject && a.id !== asset.id && a.image).slice(0, 3)) references.push(sheet);
  } else if (asset.image) {
    references.push(asset);
  }
  const anchor = library.find((a) => a.id === anchorId);
  if (anchor?.image) references.push(anchor);

  const subjectName = asset.name.split(",")[0];
  const lines = [STYLE_BIBLE.base];
  if (asset.kind === "character") {
    lines.push(
      `CHARACTER MODEL SHEET of ${subjectName}, drawn in the webtoon style of the strip on a plain flat white background: a full-body turnaround in one row (front view, three-quarter view, side view, back view), standing in the same neutral pose at the same scale, and below it three head-and-shoulders expressions in a row (calm, gentle smile, eyes closed). Single sheet, no text, no labels, no arrows, no frames.`,
    );
    lines.push(`DESIGN LOCKED, copy exactly: ${asset.must_keep}`);
    if (asset.description) lines.push(`NOTES: ${asset.description}`);
  } else if (asset.kind === "location") {
    lines.push(`LOCATION DESIGN SHEET of ${subjectName}: one wide establishing illustration of the place, empty of characters, drawn in the flat webtoon style of the strip, composed as a reference for future panels (main volumes, light sources, palette).`);
    lines.push(`DESIGN LOCKED, copy exactly: ${asset.must_keep}`);
    if (STYLE_BIBLE.palettes[palette]) lines.push(STYLE_BIBLE.palettes[palette]);
    if (asset.description) lines.push(`NOTES: ${asset.description}`);
  } else {
    lines.push(`REFERENCE ILLUSTRATION of ${subjectName}, drawn in the flat webtoon style of the strip. ${asset.must_keep}`);
  }
  if (references.length) {
    lines.push(
      "REFERENCE IMAGES, in order: " +
        references.map((r, i) => `image ${i + 1} is ${r.name} (${r.kind === "style" ? "rendering reference only: copy its flatness, line weight and colour treatment, nothing of its content" : "design to keep"})`).join("; ") +
        ".",
    );
  }
  lines.push(STYLE_BIBLE.rendering.filter((rule) => !rule.startsWith("Composition designed")).join(" "));
  lines.push("DO NOT: " + STYLE_BIBLE.negative.join(" "));

  try {
    const image = await generateWithGateway(
      {
        panel_id: asset.id,
        model: "openai/gpt-image-2.5-sunburst",
        aspect_ratio: "3:2",
        width: 1536,
        height: 1024,
        prompt: lines.join("\n\n"),
        negative_constraints: STYLE_BIBLE.negative,
        references: references.map((r) => ({ id: r.id, name: r.name, image: r.image, role: r.kind })),
      },
      { resolveReference: referenceAsDataUrl },
    );
    void recordCost({ idToken: identity.idToken, slug, usd: image.cost_usd, kind: "sheets" });
    const safe = asset.id.replace(/[^a-z0-9._-]/gi, "_");
    const src = await storeGeneratedImage({
      idToken: identity.idToken,
      path: `webtoon/${slug}/library/${safe}/${Date.now()}.png`,
      base64: image.base64,
      mediaType: image.media_type,
    });
    return Response.json({ id: asset.id, model: image.model, ...(src ? { src } : { data_url: `data:${image.media_type};base64,${image.base64}` }), prompt: lines.join("\n\n") });
  } catch (error) {
    const message = error instanceof Error ? error.message : "generation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
