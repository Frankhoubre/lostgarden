// Generate panel images through Vercel AI Gateway and register them.
//
//   AI_GATEWAY_API_KEY=... node scripts/webtoon-generate.mjs ep1-opening            # every panel
//   AI_GATEWAY_API_KEY=... node scripts/webtoon-generate.mjs ep1-opening p03 p07    # some panels
//   node scripts/webtoon-generate.mjs ep1-opening --dry-run                         # print the requests
//
// Model: openai/gpt-image-2.5-sunburst unless WEBTOON_IMAGE_MODEL is set.
// Each request carries the panel's reference images (character sheets first).
// Results are written to public/webtoon/<slug>/panels/<panel>.png and
// registered in lib/webtoon/sources/<slug>.images.ts.
import { register } from "node:module";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

register("./webtoon-ts-loader.mjs", import.meta.url);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const [slug, ...panelIds] = args.filter((a) => !a.startsWith("--"));
if (!slug) {
  console.error("usage: node scripts/webtoon-generate.mjs <slug> [panel ids] [--dry-run]");
  process.exit(1);
}

const { getWebtoonScript } = await import("../lib/webtoon/scripts.ts");
const { buildGenerationRequest } = await import("../lib/webtoon/generation.ts");
const { sizeForAspect } = await import("../lib/webtoon/providers/vercel-gateway.ts");

const script = getWebtoonScript(slug);
if (!script) {
  console.error(`unknown script ${slug}`);
  process.exit(1);
}
const model = process.env.WEBTOON_IMAGE_MODEL ?? "openai/gpt-image-2.5-sunburst";
const baseUrl = process.env.AI_GATEWAY_BASE_OPENAI_COMPAT_URL ?? "https://ai-gateway.vercel.sh/v1";
const apiKey = process.env.AI_GATEWAY_API_KEY;
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

const toDataUrl = (image) => {
  if (image.startsWith("http")) return image;
  const file = path.join(ROOT, "public", image);
  const mime = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  return `data:${mime};base64,${readFileSync(file).toString("base64")}`;
};

/** Width and height from a PNG header, so no image library is needed. */
const pngSize = (buffer) => ({ width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) });

const outDir = path.join(ROOT, "public", "webtoon", slug, "panels");
const imagesTs = path.join(ROOT, "lib", "webtoon", "sources", `${slug}.images.ts`);
mkdirSync(outDir, { recursive: true });

const constName = `${slug.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase()}_IMAGES`;
let registry = {};
if (existsSync(imagesTs)) {
  const match = readFileSync(imagesTs, "utf8").match(/= (\{[\s\S]*\});/);
  if (match) registry = JSON.parse(match[1]);
}

const panels = script.panels.filter((p) => !panelIds.length || panelIds.includes(p.panel_id));
for (const panel of panels) {
  const request = buildGenerationRequest(panel, model);
  const size = sizeForAspect(request.aspect_ratio);
  console.log(`\n${panel.panel_id} · ${request.aspect_ratio} → ${size} · refs: ${request.references.map((r) => r.id).join(", ")}`);
  if (dryRun) {
    console.log(request.prompt);
    continue;
  }
  if (!apiKey) {
    console.error("AI_GATEWAY_API_KEY is not set; use --dry-run to inspect the requests.");
    process.exit(1);
  }
  const images = request.references.map((r) => ({ image_url: toDataUrl(r.image) }));
  const endpoint = images.length ? "/images/edits" : "/images/generations";
  const body = { model, prompt: request.prompt, n: 1, size, quality: "high", response_format: "b64_json" };
  if (images.length) body.images = images;
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    console.error(`${panel.panel_id}: gateway ${response.status} ${(await response.text()).slice(0, 300)}`);
    continue;
  }
  const json = await response.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`${panel.panel_id}: no image in response`);
    continue;
  }
  const buffer = Buffer.from(b64, "base64");
  const file = path.join(outDir, `${panel.panel_id}.png`);
  writeFileSync(file, buffer);
  const { width, height } = pngSize(buffer);
  registry[panel.panel_id] = {
    src: `/webtoon/${slug}/panels/${panel.panel_id}.png`,
    width,
    height,
    model: json.model ?? model,
    job_id: json.id ?? "",
    generated_at: new Date().toISOString(),
    status: "generated",
  };
  console.log(`${panel.panel_id}: ${width}x${height} → ${path.relative(ROOT, file)}`);
}

if (!dryRun) {
  const sorted = Object.fromEntries(Object.entries(registry).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(
    imagesTs,
    'import type { PanelImage } from "../types";\n\n/** Generated panel images. Written by scripts/webtoon-generate.mjs or scripts/webtoon-images.py. */\nexport const ' +
      `${constName}: Record<string, PanelImage> = ${JSON.stringify(sorted, null, 2)};\n`,
  );
  console.log(`\nregistry → ${path.relative(ROOT, imagesTs)}`);
}
