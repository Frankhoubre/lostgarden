// Node module hooks so the webtoon engine (plain TypeScript with the project's
// extensionless imports and the `@/` alias) can run outside Next.js, using
// Node's built-in type stripping. Registered by scripts/webtoon-export.mjs.
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function candidates(abs) {
  return [abs, `${abs}.ts`, `${abs}.tsx`, path.join(abs, "index.ts")];
}

export async function resolve(specifier, context, next) {
  let abs = null;
  if (specifier.startsWith("@/")) {
    abs = path.join(ROOT, specifier.slice(2));
  } else if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:")
  ) {
    abs = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (abs) {
    for (const file of candidates(abs)) {
      if (existsSync(file) && statSync(file).isFile()) {
        return next(pathToFileURL(file).href, context);
      }
    }
  }
  return next(specifier, context);
}
