"use client";

import { loadLibrary } from "@/lib/webtoon/library";
import { BUILT_IN_PROJECT_ID } from "@/lib/webtoon/project";
import { listProjects } from "@/lib/webtoon/projects-client";
import { libraryWith } from "@/lib/webtoon/references";
import type { ReferenceAsset } from "@/lib/webtoon/types";

/**
 * THE CAST OF THE OTHER PROJECTS. A new webtoon of the same author often
 * brings back who and what the earlier ones had (the knight of episode 1 in
 * episode 2): the bible of a new project is built knowing them. The
 * detection is told about them and says when what it sees is one of them;
 * the author then takes the existing sheet (same id, same design lock, same
 * image) instead of drawing a new one, or adds one by hand from the list.
 */

export type PreviousEntry = {
  /** Where it comes from. */
  project_id: string;
  project_title: string;
  asset: ReferenceAsset;
  /** The id the panels use: the subject of a character, the id without prefix otherwise. */
  ref: string;
  name: string;
  kind: "character" | "object" | "location";
};

const LOST_GARDEN_TITLE = "Lost Garden · Épisode 1";

function entriesOf(projectId: string, title: string, assets: ReferenceAsset[]): PreviousEntry[] {
  const out: PreviousEntry[] = [];
  const seen = new Set<string>();
  const sorted = [...assets].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
  for (const asset of sorted) {
    if (asset.kind !== "character" && asset.kind !== "object" && asset.kind !== "location") continue;
    if (asset.kind === "location" && asset.id.startsWith("loc.style.")) continue;
    const ref = asset.kind === "character" ? asset.subject ?? asset.id : asset.id.replace(/^(obj|loc)\./, "");
    if (!ref || seen.has(`${asset.kind}:${ref}`)) continue;
    // A character is its first sheet with an image (its turnaround); the others are extra views.
    if (asset.kind === "character" && !asset.image && sorted.some((a) => a.kind === "character" && a.subject === ref && a.image)) continue;
    seen.add(`${asset.kind}:${ref}`);
    out.push({ project_id: projectId, project_title: title, asset, ref, name: asset.name.split(",")[0].trim(), kind: asset.kind });
  }
  return out;
}

/** Everyone and everything the other projects hold, the newest project first, each thing once. */
export async function loadPreviousCast(currentId: string): Promise<PreviousEntry[]> {
  const projects = (await listProjects().catch(() => [])).filter((p) => p.id !== currentId);
  const sources: { id: string; title: string; base: boolean }[] = [
    ...projects.map((p) => ({ id: p.id, title: p.title, base: false })),
    ...(currentId !== BUILT_IN_PROJECT_ID ? [{ id: BUILT_IN_PROJECT_ID, title: LOST_GARDEN_TITLE, base: true }] : []),
  ];
  const libraries = await Promise.all(
    sources.map(async (source) => {
      const overlay = await loadLibrary(source.id).catch(() => null);
      // Lost Garden's built-in library under its overlay; a project's own library alone.
      const assets = source.base ? libraryWith(overlay ?? { assets: [], hidden: [] }) : overlay?.assets ?? [];
      return entriesOf(source.id, source.title, assets);
    }),
  );
  const out: PreviousEntry[] = [];
  const seen = new Set<string>();
  for (const entry of libraries.flat()) {
    const key = `${entry.kind}:${entry.ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

/** The asset a previous entry becomes in the new project: the same id and design, its origin noted. */
export function importedAsset(entry: PreviousEntry, extra: Partial<ReferenceAsset> = {}): ReferenceAsset {
  const { custom: _custom, ...asset } = entry.asset;
  void _custom;
  return { ...asset, tags: [...new Set([...(asset.tags ?? []), `from:${entry.project_id}`])], ...extra };
}
