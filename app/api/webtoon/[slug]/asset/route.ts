import sharp from "sharp";
import { recordCost } from "@/lib/webtoon/cost-server";
import { imageAsDataUrl, getProjectContext } from "@/lib/webtoon/project-server";
import { completeJson } from "@/lib/webtoon/providers/gateway-text";
import { generateWithGateway } from "@/lib/webtoon/providers/vercel-gateway";
import { libraryWith } from "@/lib/webtoon/references";
import { sheetKind, sheetPrompt } from "@/lib/webtoon/sheet-prompt";
import { storeGeneratedImage } from "@/lib/webtoon/storage-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import { bibleFor } from "@/lib/webtoon/style-bible";
import type { LibraryOverlay, ReferenceAsset } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/asset
 * Body: {
 *   asset: ReferenceAsset,            the entry of the bible (character, object, location)
 *   library?: LibraryOverlay,
 *   frames?: string[],                frames of the film where the thing is seen (detected)
 *   references?: string[],            images the author gave (Storage URLs)
 *   prompt?: string,                  the prepared prompt, as the author edited it
 *   palette?: string,
 * }
 *
 * Draws a reference sheet for the bible of the project: a character
 * turnaround with expressions, a creature or machine sheet with a figure
 * for scale, an object sheet with its states, or a location illustration.
 * The prompt is the one `sheetPrompt` prepares (and the studio shows), or the
 * author's version of it; the images attached are the author's references,
 * then the frames of the film, then the other sheets of the same subject,
 * then the style anchor.
 *
 * Then the sheet is checked: a vision model reads it for any text (labels,
 * names, swatches) and, except for a location, for a background that is not
 * plain white. A sheet that fails is drawn again once with the fault named.
 * The white is then cleaned (near-white pixels set to pure white), so the
 * sheet sits clean on the page and in every prompt it is attached to.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };

const MAX_REFERENCES = 8;
const IMAGE_SRC = /^(\/[\w./%-]+\.(jpe?g|png|webp)|https:\/\/firebasestorage\.googleapis\.com\/[^\s]+)$/i;

type SheetCheck = { has_text?: boolean; text_seen?: string; background_plain_white?: boolean; views?: number; extras?: boolean; figures?: boolean; figures_seen?: string; problems?: string };

/** A small JPEG of the sheet for the check: the model reads it as well, and the request stays light. */
async function preview(base64: string): Promise<string> {
  const bytes = await sharp(Buffer.from(base64, "base64")).resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

async function checkSheet(base64: string, location: boolean, onCost: (usd: number) => void): Promise<SheetCheck> {
  try {
    return await completeJson<SheetCheck>({
      system:
        'You check a reference sheet drawn for a webtoon. Look at the whole image carefully, corners included. Answer with JSON only: {"has_text": true|false, "text_seen": "<the words, letters, numbers or labels you see, empty if none>", "background_plain_white": true|false, "problems": "<one short sentence, empty if none>"}. has_text is true for any letter, word, number, label (FRONT, SIDE...), caption, signature, logo or colour swatch. background_plain_white is true when everything around the drawings is plain white, with no floor, shadow, gradient, texture or frame.' +
        (location
          ? ' This sheet is a location illustration: its background is the place itself, so answer background_plain_white true. Also add "figures": true|false and "figures_seen": "<what, empty if none>": figures is true for ANY person, character, figure, silhouette (even tiny or far away), creature, animal or monster in the image; statues, carvings and paintings that are part of the place do not count.'
          : ' Also add "views": <how many whole views of the subject the sheet shows> and "extras": true|false, true when anything else is drawn besides those whole views (a portrait, a close-up, a detail inset, an expression, a second figure).'),
      user: [
        { type: "text", text: "The sheet:" },
        { type: "image_url", image_url: { url: await preview(base64) } },
      ],
      maxTokens: 300,
      reasoning: "none",
      temperature: 0,
      onCost,
    });
  } catch {
    return {};
  }
}

/** Near-white pixels to pure white: the model's off-white paper and faint floor shadow go away, the drawing stays. */
async function cleanWhite(base64: string): Promise<string> {
  const image = sharp(Buffer.from(base64, "base64")).removeAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    if (min >= 232 && max - min <= 14) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
    }
  }
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } }).png().toBuffer();
  return png.toString("base64");
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
    asset?: ReferenceAsset;
    library?: LibraryOverlay;
    palette?: string;
    frames?: string[];
    references?: string[];
    prompt?: string;
    /** "Webtoniser": the author's own image, redrawn exactly in the webtoon style as the sheet. */
    webtonize?: string;
  };
  const webtonize =
    typeof body.webtonize === "string" && (IMAGE_SRC.test(body.webtonize.trim()) || (body.webtonize.startsWith("data:image/") && body.webtonize.length < 8_000_000)) ? body.webtonize.trim() : null;
  const asset = body.asset && webtonize && !body.asset.must_keep?.trim() ? { ...body.asset, must_keep: "exactly the subject of the author's image: its shape, proportions, clothes or materials, colours and every distinctive detail." } : body.asset;
  if (!asset?.id || !asset.must_keep?.trim()) return Response.json({ error: "Décris d'abord l'élément (verrou de design)" }, { status: 400 });
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [], ...(body.library.base ? { base: body.library.base } : {}) } : null;
  const library = libraryWith(overlay);
  const bible = bibleFor(context.script.style_bible_id);
  const kind = sheetKind(asset);
  const clean = (list: unknown) => (Array.isArray(list) ? list.map((f) => String(f).trim()).filter((f) => IMAGE_SRC.test(f)) : []);
  const own = clean(body.references);
  const frames = clean(body.frames);
  const name = asset.name.split(",")[0];
  const scale = /scale:\s*([^.]+)\./i.exec(asset.description ?? "")?.[1]?.trim() ?? "";

  // Reference images, strongest intent first: the author's own, the film, the sheets already drawn, the style.
  const references: ReferenceAsset[] = [];
  const add = (item: ReferenceAsset) => {
    if (references.length < MAX_REFERENCES && item.image && !references.some((r) => r.image === item.image)) references.push(item);
  };
  if (webtonize) add({ id: "webtonize", kind: "source_frame", name: `the author's image of ${name}`, image: webtonize, must_keep: "", description: "", tags: ["own", "webtonize"] });
  own.forEach((src, i) => add({ id: `own-${i}`, kind: "source_frame", name: `reference image ${i + 1} given by the author for ${name}`, image: src, must_keep: "", description: "", tags: ["own"] }));
  frames.forEach((src) => {
    const at = /(\d{2})m(\d{2})s/.exec(decodeURIComponent(src));
    add({ id: src, kind: "source_frame", name: `film frame ${at ? `${Number(at[1])}:${at[2]}` : ""} showing ${name}`.replace(/\s+/g, " "), image: src, must_keep: "", description: "", tags: ["film"] });
  });
  const sameSubject = asset.kind === "character"
    ? library.filter((a) => a.kind === "character" && a.subject === asset.subject && a.id !== asset.id)
    : library.filter((a) => a.kind === asset.kind && a.id !== asset.id && a.id.startsWith(asset.id));
  sameSubject.slice(0, 2).forEach(add);
  if (asset.kind === "location" && asset.image) add(asset);
  const palette = body.palette && bible.palettes[body.palette] ? body.palette : kind === "location" ? "blue_sanctuary" : "white_memory";
  const anchor = library.find((a) => a.id === context.script.style_anchors?.[palette]);
  if (anchor?.image) add(anchor);

  const prepared = sheetPrompt({ asset, bible, scale, palette });
  const base = [
    body.prompt?.trim() ? body.prompt.trim() : prepared,
    webtonize
      ? "WEBTONIZE: the first reference image is the author's own picture of this subject, in another style (a photo, a painting, a 3D render, a sketch). Convert it: the same subject, recognisable at a glance, redrawn in the flat webtoon style of the series (clean line art, cel shading, the palette treatment described), as the sheet described above. Do not redesign, simplify away or add anything."
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const roles = references.map((r, i) => {
    const role = r.tags.includes("webtonize")
      ? "THE SUBJECT TO WEBTONIZE: redraw exactly this subject (every part of its design, its clothes or materials, its colours, its proportions, its distinctive details) in the webtoon style described above; change only the rendering, never the design"
      : r.kind === "style" ? "rendering reference only: copy its flatness, line weight and colour treatment, nothing of its content" : r.tags.includes("own") ? "the design to follow, given by the author" : r.tags.includes("film") ? (kind === "location" ? "the place as the finished film shows it: copy the place only; the characters and creatures in the frame are NOT to be drawn" : "the subject as the finished film shows it: copy its design exactly, ignore the rendering and the rest of the frame") : r.id === asset.id ? "the current image of this place: keep the design of the place, not its viewpoint, and never the characters or creatures it shows" : "an earlier sheet: copy the design only, never its layout, its extra views or its portraits";
    return `image ${i + 1} is ${r.name} (${role})`;
  });
  const promptFor = (fix?: string) => [base, roles.length ? `REFERENCE IMAGES, in order: ${roles.join("; ")}.` : "", fix ?? ""].filter(Boolean).join("\n\n");

  let usd = 0;
  const meter = (value: number) => {
    usd += value;
  };
  try {
    const draw = async (prompt: string) =>
      generateWithGateway(
        {
          panel_id: asset.id,
          model: "openai/gpt-image-2.5-sunburst",
          aspect_ratio: "3:2",
          width: 1536,
          height: 1024,
          prompt,
          negative_constraints: bible.negative,
          references: references.map((r) => ({ id: r.id, name: r.name, image: r.image, role: r.kind })),
        },
        { resolveReference: imageAsDataUrl },
      );
    let image = await draw(promptFor());
    meter(image.cost_usd);
    let check = await checkSheet(image.base64, kind === "location", meter);
    let attempts = 1;
    const wrongViews = (c: SheetCheck) => kind !== "location" && ((typeof c.views === "number" && c.views !== 3) || c.extras === true);
    // A location never shows anybody: a figure, even tiny, is a fault like text.
    const peopled = (c: SheetCheck) => kind === "location" && c.figures === true;
    const failed = (c: SheetCheck) => c.has_text === true || (kind !== "location" && c.background_plain_white === false) || wrongViews(c) || peopled(c);
    if (failed(check)) {
      const fault = [
        check.has_text ? `it contained text (${check.text_seen || "labels"})` : "",
        check.background_plain_white === false ? "its background was not plain white" : "",
        wrongViews(check) ? `it showed ${check.views ?? "the wrong number of"} views${check.extras ? " and extra drawings" : ""} instead of exactly three (front, side, back)` : "",
        peopled(check) ? `it showed somebody in the place (${check.figures_seen || "a figure"})` : "",
        check.problems ?? "",
      ].filter(Boolean).join("; ");
      const correction = (why: string) =>
        `CORRECTION: the previous attempt was rejected because ${why}. This time: absolutely no text or label anywhere${kind !== "location" ? ", nothing but plain white around the drawings, and exactly three whole views (front, side in profile, back) with nothing else" : ", and NOBODY in the place: no character, no figure, no silhouette, no creature, no animal, only the empty place"}.`;
      let second = await draw(promptFor(correction(fault)));
      meter(second.cost_usd);
      let secondCheck = await checkSheet(second.base64, kind === "location", meter);
      attempts = 2;
      // A place that still shows somebody gets one more try: a location never has a character in it.
      if (peopled(secondCheck)) {
        const third = await draw(promptFor(correction(`it showed somebody in the place twice (${secondCheck.figures_seen || "a figure"})`)));
        meter(third.cost_usd);
        const thirdCheck = await checkSheet(third.base64, true, meter);
        attempts = 3;
        if (!peopled(thirdCheck)) {
          second = third;
          secondCheck = thirdCheck;
        }
      }
      if (!failed(secondCheck) || failed(check)) {
        image = second;
        check = secondCheck;
      }
    }
    const base64 = kind === "location" ? image.base64 : await cleanWhite(image.base64);
    const mediaType = kind === "location" ? image.media_type : "image/png";
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "sheets" });
    const safe = asset.id.replace(/[^a-z0-9._-]/gi, "_");
    const src = await storeGeneratedImage({
      idToken: identity.idToken,
      path: `webtoon/${slug}/library/${safe}/${Date.now()}.${mediaType === "image/png" ? "png" : "jpg"}`,
      base64,
      mediaType,
    });
    return Response.json({
      id: asset.id,
      model: image.model,
      ...(src ? { src } : { data_url: `data:${mediaType};base64,${base64}` }),
      prompt: promptFor(),
      prepared,
      attempts,
      check,
      references: references.map((r) => r.image),
      cost_usd: usd,
    });
  } catch (error) {
    void recordCost({ idToken: identity.idToken, slug, usd, kind: "sheets" });
    const message = error instanceof Error ? error.message : "generation failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
