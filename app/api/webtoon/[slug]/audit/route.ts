import sharp from "sharp";
import { recordCost } from "@/lib/webtoon/cost-server";
import { completeJson, type UserPart } from "@/lib/webtoon/providers/gateway-text";
import { getProjectContext, imageAsDataUrl } from "@/lib/webtoon/project-server";
import { libraryWith } from "@/lib/webtoon/references";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import { bibleFor } from "@/lib/webtoon/style-bible";
import type { LibraryOverlay, PanelAuditIssue } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/audit
 * Body: { panels: { panel_id, order, description, characters, image }[], library?: LibraryOverlay }
 *
 * THE EPISODE AGAINST ITS SHEETS. The check made at each drawing looks at the
 * cast and the state (who is there, a helmet on or off); it lets colours and
 * costume details pass on purpose, or every panel would be redrawn. This pass
 * looks at exactly that, a few panels at a time next to the model sheet of
 * every character they show: an armour of another shape, a cape of another
 * colour, a helmet redesigned, Serrure no taller than Lanterne. Each fault
 * comes back as one French sentence an illustrator (or a retouch) can act on.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };

type AuditPanel = { panel_id: string; order: number; description: string; characters: string[]; image: string };

/** Small enough to keep a batch cheap, large enough to see a costume: the panels at 640 px, the sheets at 1024. */
async function shrink(src: string, width: number): Promise<string> {
  const data = await imageAsDataUrl(src);
  const bytes = Buffer.from(data.slice(data.indexOf(",") + 1), "base64");
  const out = await sharp(bytes).resize({ width, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const context = await getProjectContext(slug, identity);
  if (!context) return Response.json({ error: "unknown webtoon project" }, { status: 404 });
  const body = (await request.json().catch(() => ({}))) as { panels?: AuditPanel[]; library?: LibraryOverlay };
  const panels = (body.panels ?? []).filter((p) => p?.panel_id && p.image && p.characters?.length).slice(0, 8);
  if (!panels.length) return Response.json({ results: {}, cost_usd: 0 });
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [], base: body.library.base } : null;
  const library = libraryWith(overlay);
  const canon = bibleFor(context.script.style_bible_id).canon ?? {};

  // One model sheet per character of the batch: the first sheet of its subject that has an image.
  const ids = [...new Set(panels.flatMap((p) => p.characters))];
  const sheets = ids
    .map((id) => {
      const sheet = library.filter((a) => a.kind === "character" && a.subject === id && a.image).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))[0];
      return sheet ? { id, name: sheet.name.split(",")[0], image: sheet.image, looks: sheet.must_keep.slice(0, 400), canon: canon[id] ?? [] } : null;
    })
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (!sheets.length) return Response.json({ results: {}, cost_usd: 0, note: "aucune fiche de personnage avec image" });

  try {
    const [sheetImages, panelImages] = await Promise.all([
      Promise.all(sheets.map((s) => shrink(s.image, 1024).catch(() => null))),
      Promise.all(panels.map((p) => shrink(p.image, 640).catch(() => null))),
    ]);
    const parts: UserPart[] = [{ type: "text", text: "MODEL SHEETS (the design every panel must follow):" }];
    sheets.forEach((s, i) => {
      if (!sheetImages[i]) return;
      parts.push({ type: "text", text: `Sheet of ${s.name} (id ${s.id}). Must keep: ${s.looks}${s.canon.length ? ` Canon: ${s.canon.join(" ")}` : ""}` });
      parts.push({ type: "image_url", image_url: { url: sheetImages[i]! } });
    });
    parts.push({ type: "text", text: "PANELS TO CHECK:" });
    panels.forEach((p, i) => {
      if (!panelImages[i]) return;
      parts.push({ type: "text", text: `Panel ${p.panel_id} (case ${p.order}), shows ${p.characters.join(", ")}: ${p.description.split("STATE TO KEEP")[0].slice(0, 260)}` });
      parts.push({ type: "image_url", image_url: { url: panelImages[i]! } });
    });
    parts.push({ type: "text", text: "Check every panel against the sheets now, as JSON." });

    let usd = 0;
    const answer = await completeJson<{ panels?: Record<string, { who?: string; issue?: string; severity?: string }[]> }>({
      system: [
        "You are the design supervisor of a webtoon. You compare each drawn panel with the model sheets of the characters it shows, the way a supervisor checks an episode before it goes out.",
        "Report only DESIGN DEVIATIONS from the sheet, for a character that is clearly visible: the costume or armour of another shape or cut, a wrong colour of a costume part, cape, hair or armour, a helmet or head of another design, a signature element missing when it should be seen (a cape, a pendant, a crest), the wrong proportions or relative height between characters (as the canon states it), a character drawn with a face or features the sheet does not have.",
        "NOT deviations, never reported: the pose, the expression, the camera angle, the scene lighting and its colour cast (night, blue cavern, warm memory), shadows, motion blur, a detail too small to see at that framing, a part of the costume hidden by the framing, the drawing style, the background and the scenery (they are not on the sheet), the bubbles. A character seen from far away or from behind is only checked for what can be seen. Never write a remark that is not a deviation (a note, a doubt, a \"but this is fine\"): leave it out.",
        "Each deviation is ONE short sentence IN FRENCH that an illustrator can act on directly, naming the part and what the sheet shows (e.g. \"La cape de Lanterne est bleue, la fiche la montre écrue, effilochée en bas.\"). `who` is the character id. `severity`: \"high\" when a reader would notice it at a glance, \"low\" otherwise.",
        'Answer with JSON only: {"panels": {"<panel_id>": [{"who", "issue", "severity"}]}}. A panel that follows its sheets gets an empty list. Include every panel id you were given.',
      ].join("\n\n"),
      user: parts,
      maxTokens: 2500,
      reasoning: "none",
      temperature: 0,
      onCost: (value) => {
        usd += value;
      },
    });
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "writer" });
    const known = new Set(ids);
    const results: Record<string, PanelAuditIssue[]> = {};
    for (const p of panels) {
      const list = answer.panels?.[p.panel_id] ?? [];
      results[p.panel_id] = list
        .filter((i) => typeof i?.issue === "string" && i.issue.trim())
        // A remark that clears itself is not a fault ("mais ceci relève du fond", "ce n'est pas un écart").
        .filter((i) => !/relève du (fond|décor)|pas (un|d'?)\s*écart|n'est pas (un défaut|une erreur)|arrière-plan|conforme à la fiche/i.test(i.issue!))
        .map((i) => ({ who: known.has(String(i.who)) ? String(i.who) : p.characters[0], issue: i.issue!.trim().slice(0, 300), severity: i.severity === "high" ? ("high" as const) : ("low" as const) }))
        .slice(0, 5);
    }
    return Response.json({ results, cost_usd: usd });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "audit failed" }, { status: 502 });
  }
}
