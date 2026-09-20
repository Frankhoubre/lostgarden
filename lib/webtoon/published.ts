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
    updated_at_iso?: { stringValue?: string };
  };
};

export type PublishedStrip = { panels: WebtoonPanel[]; published_at: string | null };

export async function fetchPublishedStrip(slug: string): Promise<PublishedStrip | null> {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!project || !apiKey) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${PUBLISHED_COLLECTION}/${encodeURIComponent(slug)}?key=${apiKey}`;
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    const document = (await response.json()) as FirestoreDocument;
    const raw = document.fields?.panels_json?.stringValue;
    if (!raw) return null;
    const panels = JSON.parse(raw) as WebtoonPanel[];
    if (!Array.isArray(panels) || !panels.length) return null;
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
