import { readFile } from "node:fs/promises";
import path from "node:path";
import { panelForGeneration } from "@/lib/webtoon/compose";
import { buildGenerationRequest } from "@/lib/webtoon/generation";
import { generateWithGateway } from "@/lib/webtoon/providers/vercel-gateway";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { WebtoonPanel } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/generate
 * Body: { panel_id: string, panel?: WebtoonPanel, model?: string }
 *
 * Regenerates one panel through Vercel AI Gateway (GPT Image 2.5 Sunburst by
 * default) with the panel's reference sheets attached, and returns the image
 * as a data URL. A panel written in the studio (empty prompt, or
 * `prompt_auto`) gets its references resolved and its prompt composed here,
 * from the same bible as the engine, and the composed prompt comes back
 * with the image. The editor shows it in place; persisting it into the strip
 * is done by `scripts/webtoon-generate.mjs`, which writes the file and
 * registers it. Needs AI_GATEWAY_API_KEY on the server, and a Firebase ID
 * token of a studio account in the Authorization header.
 */

export const maxDuration = 120;

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
  const script = getWebtoonScript(slug);
  if (!script) return Response.json({ error: "unknown webtoon script" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    panel_id?: string;
    panel?: WebtoonPanel;
    model?: string;
  };
  const requested = body.panel ?? script.panels.find((p) => p.panel_id === body.panel_id);
  if (!requested) return Response.json({ error: "unknown panel" }, { status: 400 });
  const panel = panelForGeneration(requested, script);
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
    const generation = buildGenerationRequest(panel, body.model);
    const image = await generateWithGateway(generation, {
      model: body.model,
      resolveReference: referenceAsDataUrl,
    });
    return Response.json({
      panel_id: panel.panel_id,
      model: image.model,
      data_url: `data:${image.media_type};base64,${image.base64}`,
      generated_at: new Date().toISOString(),
      generation_prompt: panel.generation_prompt,
      negative_constraints: panel.negative_constraints,
      visual_references: panel.visual_references,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "generation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
