import "server-only";
import { SERIES_DOC, sortEpisodes, type SeriesEpisode } from "@/lib/webtoon/series";

/** The published episodes, read through the Firestore REST API (the document is world-readable). */
export async function fetchSeries(): Promise<SeriesEpisode[]> {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!project || !apiKey) return [];
  try {
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/webtoon_published/${encodeURIComponent(SERIES_DOC)}?key=${apiKey}`, { next: { revalidate: 60 } });
    if (!response.ok) return [];
    const document = (await response.json()) as { fields?: { episodes_json?: { stringValue?: string } } };
    const list = JSON.parse(document.fields?.episodes_json?.stringValue ?? "[]") as SeriesEpisode[];
    return Array.isArray(list) ? sortEpisodes(list) : [];
  } catch {
    return [];
  }
}
