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
 * Body: { panel: WebtoonPanel, image: data URL, mask?: data URL, prompt: string, size: "1024x1536" | "1536x1024" | "1024x1024", library?: LibraryOverlay, quality?: "medium" | "high" }
 *
 * Without a mask: an edit of the whole panel with a prompt ("make it night",
 * "he looks at the camera", "remove the second rabbit"), the composition,
 * the characters and the style kept. With a mask: redraws one zone of a panel. The studio sends the panel image letterboxed
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

  const body = (await request.json().catch(() => ({}))) as { panel?: WebtoonPanel; image?: string; mask?: string; prompt?: string; size?: string; library?: LibraryOverlay; quality?: string; extra_references?: { name?: string; image?: string; kind?: string }[]; /** The HD finish of an approved sketch: the same image, drawn clean at full quality. */ finish?: boolean };
  const instruction = (body.prompt ?? "").trim();
  if (!body.image?.startsWith("data:image/")) return Response.json({ error: "image attendue" }, { status: 400 });
  if (body.mask && !body.mask.startsWith("data:image/png")) return Response.json({ error: "masque PNG attendu" }, { status: 400 });
  const zone = Boolean(body.mask);
  if (!instruction && !body.finish) return Response.json({ error: zone ? "Dis ce qui doit apparaître dans la zone" : "Dis ce qui doit changer dans la case" }, { status: 400 });
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
  // The objects of the panel too (the pendant keeps its design when the edit touches it).
  for (const object of panel?.objects ?? []) {
    const sheet = library.find((a) => a.kind === "object" && (a.id === object || a.id === `obj.${object}`) && a.image);
    if (sheet && references.length < 6) references.push({ id: sheet.id, name: sheet.name, image: sheet.image, role: "object" });
  }
  // What the author called with "@" in the instruction: a sheet, a place, an object, another panel.
  const ROLE_OF = { character: "character", object: "object", location: "location", panel: "panel" } as const;
  for (const extra of (Array.isArray(body.extra_references) ? body.extra_references : []).slice(0, 4)) {
    if (!extra || typeof extra.image !== "string" || !/^(\/[\w./%-]+\.(jpe?g|png|webp)|https:\/\/firebasestorage\.googleapis\.com\/\S+)$/i.test(extra.image)) continue;
    if (references.some((r) => r.image === extra.image) || references.length >= 7) continue;
    references.push({ id: `mention-${references.length}`, name: String(extra.name ?? "a reference").slice(0, 80), image: extra.image, role: ROLE_OF[extra.kind as keyof typeof ROLE_OF] ?? "character" });
  }
  const locks = references.slice(1).map((r) => library.find((a) => a.id === r.id)?.must_keep).filter(Boolean);

  const prompt = [
    bible.base,
    body.finish && !zone
      ? `FINAL RENDER of an approved webtoon panel. Image 1 is its rough draft, drawn fast at low quality. Keep exactly its framing and camera angle, its composition, every character in the same place and pose, the same expressions, the same palette and light. Redraw it clean at full final quality: crisp even ink lines, clean flat colours, one hard cel shadow per element, the details finished. Nothing added, nothing removed, nothing moved.${instruction ? ` Also: ${instruction}.` : ""} The black bands at the edges of image 1, if any, are padding: keep them black.`
      : zone
      ? `RETOUCH of an existing webtoon panel. Image 1 is the panel; the mask marks one zone of it. Inside that zone, and only there: ${instruction}. Everything outside the zone stays exactly as drawn in image 1: same composition, same lines, same flat colours, same light. The new content matches the flatness, the line weight and the palette of the rest of the panel and connects seamlessly at the edge of the zone.`
      : `EDIT of an existing webtoon panel. Image 1 is the panel. Apply this change: ${instruction}. Everything the change does not name stays exactly as drawn in image 1: the same framing and camera angle, the same composition, the same characters in the same places and poses, the same lines, flat colours and light. Redraw the whole image at the same quality, not a collage. The black bands at the edges of image 1, if any, are padding: keep them black.`,
    locks.length ? `DESIGN LOCKED: ${locks.join(" ")}` : "",
    references.length > 1 ? `REFERENCE IMAGES: image 1 is the panel to ${zone ? "retouch" : "edit"}; ${references.slice(1).map((r, i) => `image ${i + 2} is ${r.name} (${r.role === "object" ? "object design to copy exactly" : r.role === "location" ? "the place: its design, light and palette" : r.role === "panel" ? "another panel of the strip: keep its characters, clothes, place and light" : "character design to copy exactly"})`).join("; ")}.` : "",
    bible.rendering.filter((rule) => !rule.startsWith("Composition designed")).join(" "),
    "DO NOT: " + bible.negative.join(" "),
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const image = await generateWithGateway(
      { panel_id: panel?.panel_id ?? "panel", model: "openai/gpt-image-2.5-sunburst", aspect_ratio: "4:5", width: 1080, height: 1350, prompt, negative_constraints: bible.negative, references },
      { resolveReference: referenceAsDataUrl, ...(zone ? { mask: body.mask } : {}), size, outputFormat: "jpeg", outputCompression: 92, quality: body.quality === "medium" ? "medium" : "high" },
    );
    void recordCost({ idToken: identity.idToken, slug, usd: image.cost_usd, kind: "images" });
    return Response.json({ data_url: `data:${image.media_type};base64,${image.base64}`, model: image.model, cost_usd: image.cost_usd });
  } catch (error) {
    const message = error instanceof Error ? error.message : "retouch failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
