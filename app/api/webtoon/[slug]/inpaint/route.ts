import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordCost } from "@/lib/webtoon/cost-server";
import { generateWithGateway } from "@/lib/webtoon/providers/vercel-gateway";
import { libraryWith } from "@/lib/webtoon/references";
import { getProjectContext } from "@/lib/webtoon/project-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import { bibleFor } from "@/lib/webtoon/style-bible";
import type { LibraryOverlay, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/inpaint
 * Body: { panel: WebtoonPanel, image: data URL, mask: data URL, prompt: string, size: "1024x1536" | "1536x1024" | "1024x1024", library?: LibraryOverlay }
 *
 * Redraws one zone of a panel. The studio sends the panel image letterboxed
 * to an OpenAI size and a PNG mask transparent where the zone is; the model
 * redraws the image with the instruction applied to that zone, with the
 * panel's character sheets attached so a redrawn character keeps its
 * design. The answer comes back as a JPEG data URL: the studio then pastes
 * only the masked zone onto the original, so nothing else moves.
 */

export const maxDuration = 120;

type RouteContext = { params: Promise<{ slug: string }> };

const SIZES = new Set(["1024x1536", "1536x1024", "1024x1024"]);
const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

async function referenceAsDataUrl(image: string): Promise<string> {
  if (image.startsWith("http") || image.startsWith("data:")) return image;
  const file = path.join(process.cwd(), "public", image);
  const bytes = await readFile(file);
  return `data:${MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream"};base64,${bytes.toString("base64")}`;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const bible = bibleFor(context.script.style_bible_id);
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { panel?: WebtoonPanel; image?: string; mask?: string; prompt?: string; size?: string; library?: LibraryOverlay };
  const instruction = (body.prompt ?? "").trim();
  if (!body.image?.startsWith("data:image/") || !body.mask?.startsWith("data:image/png")) return Response.json({ error: "image et masque attendus" }, { status: 400 });
  if (!instruction) return Response.json({ error: "Dis ce qui doit apparaître dans la zone" }, { status: 400 });
  const size = body.size && SIZES.has(body.size) ? body.size : "1024x1536";
  const panel = body.panel;
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [] } : null;
  const library = libraryWith(overlay);

  // The source first (the mask applies to it), then at most one sheet per character named by the panel.
  const references: { id: string; name: string; image: string; role: string }[] = [{ id: "source", name: "the panel to retouch", image: body.image, role: "source_frame" }];
  for (const character of panel?.characters ?? []) {
    const sheet = library.filter((a) => a.kind === "character" && a.subject === character && a.image).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))[0];
    if (sheet && references.length < 4) references.push({ id: sheet.id, name: sheet.name, image: sheet.image, role: "character" });
  }
  const locks = references.slice(1).map((r) => library.find((a) => a.id === r.id)?.must_keep).filter(Boolean);

  const prompt = [
    bible.base,
    `RETOUCH of an existing webtoon panel. Image 1 is the panel; the mask marks one zone of it. Inside that zone, and only there: ${instruction}. Everything outside the zone stays exactly as drawn in image 1: same composition, same lines, same flat colours, same light. The new content matches the flatness, the line weight and the palette of the rest of the panel and connects seamlessly at the edge of the zone.`,
    locks.length ? `CHARACTERS, design locked: ${locks.join(" ")}` : "",
    references.length > 1 ? `REFERENCE IMAGES: image 1 is the panel to retouch; ${references.slice(1).map((r, i) => `image ${i + 2} is ${r.name} (character design to copy exactly)`).join("; ")}.` : "",
    bible.rendering.filter((rule) => !rule.startsWith("Composition designed")).join(" "),
    "DO NOT: " + bible.negative.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const image = await generateWithGateway(
      { panel_id: panel?.panel_id ?? "panel", model: "openai/gpt-image-2.5-sunburst", aspect_ratio: "4:5", width: 1080, height: 1350, prompt, negative_constraints: bible.negative, references },
      { resolveReference: referenceAsDataUrl, mask: body.mask, size, outputFormat: "jpeg", outputCompression: 92 },
    );
    void recordCost({ idToken: identity.idToken, slug, usd: image.cost_usd, kind: "images" });
    return Response.json({ data_url: `data:${image.media_type};base64,${image.base64}`, model: image.model, cost_usd: image.cost_usd });
  } catch (error) {
    const message = error instanceof Error ? error.message : "retouch failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
