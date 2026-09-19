import "server-only";

import type { GenerationRequest } from "../generation";

/**
 * Vercel AI Gateway image provider.
 *
 * Calls the gateway's OpenAI-compatible images API with the panel prompt and
 * its reference images (character sheets first, then location, then the
 * source frame), so the model sees the design it must keep. Uses
 * `/v1/images/edits` whenever references exist, `/v1/images/generations`
 * otherwise. Reads `AI_GATEWAY_API_KEY` (and the optional
 * `AI_GATEWAY_BASE_OPENAI_COMPAT_URL`) from the environment, server side only.
 *
 * Default model: GPT Image 2.5 Sunburst (`openai/gpt-image-2.5-sunburst`).
 */

export const GATEWAY_DEFAULT_MODEL = "openai/gpt-image-2.5-sunburst";
const GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

export type GatewayImage = {
  model: string;
  media_type: string;
  base64: string;
};

export type GatewayOptions = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  /** OpenAI quality tier for GPT Image models. */
  quality?: "low" | "medium" | "high" | "auto";
  /** Turns a public reference path into something the gateway can fetch: an https URL or a data: URL. */
  resolveReference: (image: string) => Promise<string>;
};

/**
 * OpenAI image sizes: square, portrait or landscape. A webtoon panel is
 * mapped to the closest orientation; the layout then crops with the panel's
 * focal point, and the plan can request "2:3" or "3:2" directly to avoid any
 * crop.
 */
export function sizeForAspect(aspect: string): string {
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h || w === h) return "1024x1024";
  return h > w ? "1024x1536" : "1536x1024";
}

export async function generateWithGateway(
  request: GenerationRequest,
  options: GatewayOptions,
): Promise<GatewayImage> {
  const apiKey = options.apiKey ?? process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY is not set");
  }
  const baseUrl =
    options.baseUrl ?? process.env.AI_GATEWAY_BASE_OPENAI_COMPAT_URL ?? GATEWAY_BASE_URL;
  const model = options.model ?? GATEWAY_DEFAULT_MODEL;
  const images = await Promise.all(
    request.references.map(async (ref) => ({ image_url: await options.resolveReference(ref.image) })),
  );

  const endpoint = images.length ? "/images/edits" : "/images/generations";
  const body: Record<string, unknown> = {
    model,
    prompt: request.prompt,
    n: 1,
    size: sizeForAspect(request.aspect_ratio),
    quality: options.quality ?? "high",
    response_format: "b64_json",
  };
  if (images.length) body.images = images;

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI Gateway ${response.status}: ${detail.slice(0, 500)}`);
  }
  const json = (await response.json()) as {
    data?: { b64_json?: string; url?: string }[];
    model?: string;
  };
  const first = json.data?.[0];
  if (!first?.b64_json) {
    throw new Error("AI Gateway returned no image data");
  }
  return { model: json.model ?? model, media_type: "image/png", base64: first.b64_json };
}
