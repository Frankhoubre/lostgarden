import "server-only";
import type { WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

/**
 * The public reader shows what the studio published, when something was
 * published, and the engine's version otherwise. The read goes through the
 * Firestore REST API, so it works in a server component without the Admin
 * SDK: the `webtoon_published` collection is world-readable by its rules,
 * writable only by the studio accounts.
 */
const PUBLISHED_COLLECTION = "webtoon_published";

type FirestoreDocument = {
  fields?: {
    panels_json?: { stringValue?: string };
    chunk_count?: { integerValue?: string };
    updated_at_iso?: { stringValue?: string };
  };
};

export type PublishedStrip = { panels: WebtoonPanel[]; published_at: string | null };

function parsePanels(raw: string | undefined): WebtoonPanel[] {
  if (!raw) return [];
  try {
    const panels = JSON.parse(raw) as WebtoonPanel[];
    return Array.isArray(panels) ? panels : [];
  } catch {
    return [];
  }
}

/**
 * The panels are stored in slices of under 1 MiB: the first on the document,
 * the others in its `chunks` subcollection (see `saveStrip` in studio.ts).
 */
export async function fetchPublishedStrip(slug: string): Promise<PublishedStrip | null> {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!project || !apiKey) return null;
  const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${PUBLISHED_COLLECTION}/${encodeURIComponent(slug)}`;
  try {
    const response = await fetch(`${base}?key=${apiKey}`, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    const document = (await response.json()) as FirestoreDocument;
    const panels = parsePanels(document.fields?.panels_json?.stringValue);
    const count = Math.max(1, Number(document.fields?.chunk_count?.integerValue ?? 1));
    for (let index = 1; index < count; index += 1) {
      const chunk = await fetch(`${base}/chunks/${index}?key=${apiKey}`, { next: { revalidate: 60 } });
      if (!chunk.ok) return null;
      panels.push(...parsePanels(((await chunk.json()) as FirestoreDocument).fields?.panels_json?.stringValue));
    }
    if (!panels.length) return null;
    return { panels, published_at: document.fields?.updated_at_iso?.stringValue ?? null };
  } catch {
    return null;
  }
}

/** The script with the published panels swapped in, when there are some. */
export async function withPublishedPanels(script: WebtoonScript): Promise<WebtoonScript & { published_at?: string | null }> {
  const published = await fetchPublishedStrip(script.slug);
  if (!published) return script;
  return { ...script, panels: published.panels, published_at: published.published_at };
}
