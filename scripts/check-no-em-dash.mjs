import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["messages", "components", "lib", "app"];
const EXTENSIONS = new Set([".json", ".ts", ".tsx"]);
const EM_DASH = "\u2014";

const hits = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    const ext = entry.slice(entry.lastIndexOf("."));
    if (!EXTENSIONS.has(ext)) continue;
    const content = readFileSync(path, "utf8");
    if (!content.includes(EM_DASH)) continue;
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      if (line.includes(EM_DASH)) {
        hits.push(`${path}:${index + 1}:${line.trim()}`);
      }
    });
  }
}

for (const dir of SCAN_DIRS) {
  walk(join(ROOT, dir));
}

if (hits.length > 0) {
  console.error("Em dash (—) is not allowed in user-facing copy:\n");
  for (const hit of hits) console.error(hit);
  process.exit(1);
}

console.log("No em dashes found in scanned copy.");
