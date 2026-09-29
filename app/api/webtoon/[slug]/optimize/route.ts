import sharp from "sharp";
import { getProjectContext, imageAsDataUrl } from "@/lib/webtoon/project-server";
import { uploadToStorage } from "@/lib/webtoon/storage-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";

/**
 * POST /api/webtoon/<slug>/optimize: the light versions the public reader loads.
 * Body: { items: [{ panel_id, src }] } (a dozen at most). Each image is read,
 * brought to the reading width (1080 px, never enlarged), encoded in WebP and
 * stored next to the panel's images (`webtoon/<slug>/web/<panel>/<time>.webp`).
 * Answers, per item, the WebP's URL, size and weight, and the original weight.
 */

export const maxDuration = 120;

type RouteContext = { params: Promise<{ slug: string }> };

const SRC = /^(\/[\w./%-]+\.(jpe?g|png|webp)|https:\/\/firebasestorage\.googleapis\.com\/\S+)$/i;
const WIDTH = 1080;

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  if (!identity.idToken) return Response.json({ error: "un compte connecté est nécessaire pour ranger les images" }, { status: 400 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { items?: { panel_id?: string; src?: string }[] };
  const items = (Array.isArray(body.items) ? body.items : []).filter((i) => i && typeof i.panel_id === "string" && typeof i.src === "string" && SRC.test(i.src.split("#")[0])).slice(0, 12);
  const results = await Promise.all(
    items.map(async (item) => {
      try {
        const data = await imageAsDataUrl(item.src!.split("#")[0]);
        const original = Buffer.from(data.split(",")[1], "base64");
        const { data: bytes, info } = await sharp(original).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 80, effort: 4 }).toBuffer({ resolveWithObject: true });
        const safe = item.panel_id!.replace(/[^a-z0-9._-]/gi, "_");
        const web = await uploadToStorage({ idToken: identity.idToken!, path: `webtoon/${slug}/web/${safe}/${Date.now()}.webp`, bytes, contentType: "image/webp" });
        return { panel_id: item.panel_id, of: item.src, web: { src: web, of: item.src!, width: info.width, height: info.height, bytes: bytes.byteLength }, original_bytes: original.byteLength };
      } catch (error) {
        return { panel_id: item.panel_id, of: item.src, error: error instanceof Error ? error.message : "échec" };
      }
    }),
  );
  return Response.json({ results });
}
