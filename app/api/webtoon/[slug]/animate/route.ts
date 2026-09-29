import { readFile } from "node:fs/promises";
import path from "node:path";
import { recordCost } from "@/lib/webtoon/cost-server";
import { MOTION_MODEL, MOTION_RESOLUTION, motionEstimate, motionSeconds } from "@/lib/webtoon/motion";
import { startVideo, videoStatus, type VideoImage } from "@/lib/webtoon/providers/gateway-video";
import { getProjectContext } from "@/lib/webtoon/project-server";
import { uploadToStorage } from "@/lib/webtoon/storage-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { PanelMotion } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/animate
 * Body: { action: "start", panel_id, image, prompt, seconds }
 *     | { action: "status", panel_id, image, prompt, seconds, operation }
 *
 * Makes an animated panel: a short muted loop from the panel's image
 * (`lib/webtoon/motion.ts`), through Vercel AI Gateway. "start" queues the
 * job and returns the gateway's operation; the studio then asks "status"
 * every few seconds, so no call waits for the whole generation. When the
 * video is ready it is stored in Firebase Storage
 * (`webtoon/<slug>/<panel>/motion/<ts>.mp4`) as the signed-in account and
 * the answer carries the panel's `motion`; behind the dev bypass the video
 * comes back as a data URL. The cost is recorded under "video".
 */

export const maxDuration = 120;

type RouteContext = { params: Promise<{ slug: string }> };

/** Where the gateway can fetch the images of the code library: the live site (never a local server). */
const PUBLIC_ORIGIN = /^https:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL ?? "") ? process.env.NEXT_PUBLIC_SITE_URL : "https://lostgarden.world";
const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const LOCAL_IMAGE = /^\/[\w./%-]+\.(jpe?g|png|webp)$/i;
const STORAGE_IMAGE = /^https:\/\/firebasestorage\.googleapis\.com\/\S+$/;

/**
 * The image as the gateway can read it. Most video models only fetch a URL:
 * a panel of the code library is read from the live site when it is there,
 * and sent as bytes otherwise (a file added locally, not deployed yet).
 */
async function gatewayImage(image: string): Promise<VideoImage> {
  if (STORAGE_IMAGE.test(image)) return { type: "url", url: image };
  try {
    const online = await fetch(`${PUBLIC_ORIGIN}${image}`, { method: "HEAD", redirect: "follow", cache: "no-store" });
    if (online.ok && (online.headers.get("content-type") ?? "").startsWith("image/")) return { type: "url", url: online.url };
  } catch {
    // Not reachable: the bytes below.
  }
  const file = path.join(process.cwd(), "public", image);
  const bytes = await readFile(file);
  return { type: "file", mediaType: MIME[path.extname(file).toLowerCase()] ?? "image/jpeg", data: bytes.toString("base64") };
}

async function videoBytes(video: { url?: string; base64?: string }): Promise<Buffer> {
  if (video.base64) return Buffer.from(video.base64, "base64");
  if (!video.url) throw new Error("no video to download");
  const response = await fetch(video.url, { cache: "no-store" });
  if (!response.ok) throw new Error(`video download ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "start" | "status";
    panel_id?: string;
    image?: string;
    prompt?: string;
    seconds?: number;
    operation?: unknown;
  };
  const panelId = String(body.panel_id ?? "").trim();
  const of = String(body.image ?? "");
  const image = of.split("#")[0];
  const prompt = String(body.prompt ?? "").trim().slice(0, 1500);
  const seconds = motionSeconds(body.seconds);
  if (!/^[\w-]{1,80}$/.test(panelId)) return Response.json({ error: "unknown panel" }, { status: 400 });
  if (!LOCAL_IMAGE.test(image) && !STORAGE_IMAGE.test(image)) return Response.json({ error: "La case n'a pas d'image à animer" }, { status: 400 });
  if (!prompt) return Response.json({ error: "Écrivez d'abord le mouvement voulu" }, { status: 400 });

  try {
    if (body.action === "start") {
      const { operation } = await startVideo({ model: MOTION_MODEL, prompt, image: await gatewayImage(image), loop: true, seconds, resolution: MOTION_RESOLUTION });
      return Response.json({ operation, model: MOTION_MODEL, seconds, estimate_usd: motionEstimate(seconds) });
    }
    if (body.action !== "status" || body.operation === undefined) return Response.json({ error: "action start or status" }, { status: 400 });

    const state = await videoStatus(MOTION_MODEL, body.operation);
    if (state.status === "pending") return Response.json({ status: "pending" });
    if (state.status === "error") return Response.json({ status: "error", error: state.error }, { status: 502 });

    const bytes = await videoBytes(state.video);
    const cost = state.cost_usd || motionEstimate(seconds);
    void recordCost({ idToken: identity.idToken, slug, usd: cost, kind: "video" });
    const src = identity.idToken
      ? await uploadToStorage({ idToken: identity.idToken, path: `webtoon/${slug}/${panelId}/motion/${Date.now()}.mp4`, bytes, contentType: "video/mp4" })
      : `data:video/mp4;base64,${bytes.toString("base64")}`;
    const motion: PanelMotion = { src, of, prompt, seconds, model: MOTION_MODEL, cost_usd: cost, created_at: new Date().toISOString() };
    return Response.json({ status: "completed", motion, bytes: bytes.byteLength });
  } catch (error) {
    const message = error instanceof Error ? error.message : "animation failed";
    return Response.json({ status: "error", error: message }, { status: 502 });
  }
}
