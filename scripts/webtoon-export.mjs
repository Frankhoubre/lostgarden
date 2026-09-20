// Export every webtoon script to public/webtoon/<slug>/webtoon.json, the
// contract shared with ScreenWeaver and the file the editor can re-import.
//
//   node scripts/webtoon-export.mjs            # all scripts
//   node scripts/webtoon-export.mjs ep1-opening
//   node scripts/webtoon-export.mjs --prompts  # also print the prompts
import { register } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

register("./webtoon-ts-loader.mjs", import.meta.url);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const printPrompts = args.includes("--prompts");
const wanted = args.filter((a) => !a.startsWith("--"));

const { listWebtoonScripts } = await import("../lib/webtoon/scripts.ts");
const { computeLayout } = await import("../lib/webtoon/layout.ts");

for (const script of listWebtoonScripts()) {
  if (wanted.length && !wanted.includes(script.slug)) continue;
  const dir = path.join(ROOT, "public", "webtoon", script.slug);
  mkdirSync(dir, { recursive: true });
  const layout = computeLayout(script.panels);
  const out = path.join(dir, "webtoon.json");
  writeFileSync(out, JSON.stringify({ ...script, layout }, null, 2) + "\n");
  const missing = script.panels.filter((p) => p.image.status !== "generated").length;
  console.log(
    `${script.slug}: ${script.panels.length} panels, ${layout.total_height}px tall, ${missing} image(s) missing → ${path.relative(ROOT, out)}`,
  );
  if (printPrompts) {
    for (const p of script.panels) {
      console.log(`\n===== ${p.panel_id} · ${p.aspect_ratio} · ${p.panel_height}px · refs ${p.visual_references.join(", ")}\n`);
      console.log(p.generation_prompt);
    }
  }
}
