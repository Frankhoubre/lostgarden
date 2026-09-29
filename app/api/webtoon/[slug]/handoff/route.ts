import sharp from "sharp";
import { recordCost } from "@/lib/webtoon/cost-server";
import { completeJson, type UserPart } from "@/lib/webtoon/providers/gateway-text";
import { getProjectContext, imageAsDataUrl } from "@/lib/webtoon/project-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";

/**
 * POST /api/webtoon/<slug>/handoff
 * Body: { from_title, panels: { order, description, characters, lines }[], images: string[], cast: { id, name }[] }
 *
 * Reads the end of the previous episode (its last panels, in words, and its
 * last images) and says where each character is left: helmet on or off,
 * what is torn or hurt, what the hands hold, where they stand. One short
 * English line per character, the way a panel's "STATE TO KEEP EXACTLY"
 * reads, so the first panels of the new episode start from it.
 */

export const maxDuration = 120;

type RouteContext = { params: Promise<{ slug: string }> };

type EndPanel = { order: number; description: string; characters: string[]; lines?: string[] };

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { from_title?: string; panels?: EndPanel[]; images?: string[]; cast?: { id: string; name: string }[] };
  const panels = (body.panels ?? []).slice(-16);
  if (!panels.length) return Response.json({ error: "l'épisode précédent n'a pas de cases" }, { status: 400 });
  const images = await Promise.all(
    (body.images ?? []).slice(-3).map(async (src) => {
      try {
        const data = await imageAsDataUrl(src);
        const out = await sharp(Buffer.from(data.slice(data.indexOf(",") + 1), "base64")).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
        return `data:image/jpeg;base64,${out.toString("base64")}`;
      } catch {
        return null;
      }
    }),
  );
  const parts: UserPart[] = [
    { type: "text", text: `THE END OF "${body.from_title ?? "the previous episode"}", its last panels in order (the last one closes the episode):\n${JSON.stringify(panels.map((p) => ({ case: p.order, characters: p.characters, description: p.description.slice(0, 700), lines: p.lines?.slice(0, 4) })), null, 1)}` },
    { type: "text", text: `CAST (ids): ${JSON.stringify(body.cast ?? [])}` },
  ];
  images.forEach((image, i) => {
    if (!image) return;
    parts.push({ type: "text", text: i === images.length - 1 ? "The last panel of the episode:" : "One of the last panels:" });
    parts.push({ type: "image_url", image_url: { url: image } });
  });
  parts.push({ type: "text", text: "Say where each character is left, as JSON." });
  let usd = 0;
  try {
    const answer = await completeJson<{ characters?: { id?: string; state?: string }[]; place?: string }>({
      system: [
        "You are the continuity supervisor of a webtoon series. The next episode starts where this one ends: tell the illustrator where each character is left at the very end.",
        "For every character still present or last seen at the end, one short English line of their physical state only: head (helmet ON or OFF, and where the helmet is), clothes and armour (torn, missing pieces, dirt), wounds, what each hand holds or what they carry, and posture if it lasts (kneeling, lying). Only what the panels or images show; never a feeling or an expression, never a guess about what happens next, never the design the sheet already gives (hair, usual clothes). At most 22 words a line. A character whose state is plain and unchanged gets a short line (\"Rose: as on her sheet, nothing in her hands\").",
        "`place`: where the episode ends, in a few words.",
        'Answer with JSON only: {"characters": [{"id", "state"}], "place": "..."}.',
      ].join("\n\n"),
      user: parts,
      maxTokens: 1200,
      reasoning: "none",
      temperature: 0,
      onCost: (value) => {
        usd += value;
      },
    });
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
    const names = new Map((body.cast ?? []).map((c) => [c.id, c.name]));
    const lines = (answer.characters ?? []).filter((c) => c?.state?.trim()).map((c) => `${names.get(String(c.id)) ?? c.id}: ${c.state!.trim()}`);
    // Whole lines only, under what a generation carries of a state (600 characters).
    let text = "";
    for (const line of [...lines, ...(answer.place?.trim() ? [`Place at the end: ${answer.place.trim()}`] : [])]) {
      if ((text ? text.length + 1 : 0) + line.length > 580) break;
      text = text ? `${text}\n${line}` : line;
    }
    return Response.json({ text, cost_usd: usd });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "handoff failed" }, { status: 502 });
  }
}
