import "server-only";

/**
 * Vercel AI Gateway video provider, in two calls so no request waits for
 * the whole generation: `startVideo` queues the job and returns the
 * gateway's opaque operation, `videoStatus` asks where it stands. Same wire
 * protocol as the AI SDK's `experimental_generateVideo` (the `ai` package
 * is not a dependency here): `/v4/ai/video-model/start` and `/status`.
 * Reads `AI_GATEWAY_API_KEY`, server side only.
 */

const GATEWAY_AI_URL = "https://ai-gateway.vercel.sh/v4/ai";

/** An image the gateway can read: a public URL, or bytes for the models that accept them. */
export type VideoImage = { type: "url"; url: string } | { type: "file"; mediaType: string; data: string };

export type VideoStart = {
  model: string;
  prompt: string;
  /** First frame; also the last one when `loop` is set, so the clip closes on itself. */
  image: VideoImage;
  loop?: boolean;
  seconds: number;
  resolution?: string;
};

export type VideoStatus =
  | { status: "pending" }
  | { status: "error"; error: string }
  | { status: "completed"; video: { url?: string; base64?: string; mediaType: string }; cost_usd: number };

function headers(model: string): Record<string, string> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) throw new Error("AI_GATEWAY_API_KEY is not set");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "ai-gateway-protocol-version": "0.0.1",
    "ai-gateway-auth-method": "api-key",
    "ai-video-model-specification-version": "4",
    "ai-model-id": model,
  };
}

async function post<T>(path: string, model: string, body: unknown): Promise<T> {
  const response = await fetch(`${GATEWAY_AI_URL}${path}`, { method: "POST", headers: headers(model), body: JSON.stringify(body), cache: "no-store" });
  const text = await response.text();
  if (!response.ok) throw new Error(`AI Gateway ${response.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text) as T;
}

type Metadata = Record<string, Record<string, unknown> | undefined> | null | undefined;

/**
 * What the gateway billed: the answer does not carry it for a video job, so
 * it is read from the generation record (0 when that is not ready yet).
 */
async function billed(metadata: Metadata): Promise<number> {
  const direct = Number(metadata?.gateway?.cost ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const id = metadata?.gateway?.generationId;
  if (typeof id !== "string" || !id) return 0;
  try {
    const response = await fetch(`https://ai-gateway.vercel.sh/v1/generation?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` },
      cache: "no-store",
    });
    if (!response.ok) return 0;
    const cost = Number(((await response.json()) as { data?: { total_cost?: number } }).data?.total_cost ?? 0);
    return Number.isFinite(cost) ? cost : 0;
  } catch {
    return 0;
  }
}

export async function startVideo(input: VideoStart): Promise<{ operation: unknown }> {
  const frames = [{ image: input.image, frameType: "first_frame" }, ...(input.loop ? [{ image: input.image, frameType: "last_frame" }] : [])];
  const answer = await post<{ operation?: unknown }>("/video-model/start", input.model, {
    prompt: input.prompt,
    n: 1,
    duration: input.seconds,
    ...(input.resolution ? { resolution: input.resolution } : {}),
    generateAudio: false,
    image: input.image,
    frameImages: frames,
    providerOptions: {},
  });
  if (answer.operation === undefined || answer.operation === null) throw new Error("AI Gateway returned no operation");
  return { operation: answer.operation };
}

export async function videoStatus(model: string, operation: unknown): Promise<VideoStatus> {
  const answer = await post<{
    status: "pending" | "completed" | "error" | "cancelled";
    videos?: ({ type: "url"; url: string; mediaType: string } | { type: "base64"; data: string; mediaType: string })[];
    error?: string;
    providerMetadata?: Metadata;
  }>("/video-model/status", model, { operation });
  if (answer.status === "error") return { status: "error", error: answer.error || "video generation failed" };
  if (answer.status === "cancelled") return { status: "error", error: "video generation was cancelled" };
  if (answer.status !== "completed") return { status: "pending" };
  const first = answer.videos?.[0];
  if (!first) return { status: "error", error: "AI Gateway returned no video" };
  const mediaType = first.mediaType || "video/mp4";
  const video = first.type === "url" ? { url: first.url, mediaType } : { base64: first.data, mediaType };
  return { status: "completed", video, cost_usd: await billed(answer.providerMetadata) };
}
