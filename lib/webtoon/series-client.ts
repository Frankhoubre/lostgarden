"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { PUBLISHED_COLLECTION } from "@/lib/webtoon/studio";
import { SERIES_DOC, sortEpisodes, type SeriesEpisode } from "@/lib/webtoon/series";

/** Adds or updates one episode in the public list of the series (on publication). */
export async function upsertSeriesEpisode(entry: SeriesEpisode, user: User): Promise<void> {
  const ref = doc(getDb(), PUBLISHED_COLLECTION, SERIES_DOC);
  const snapshot = await getDoc(ref);
  let list: SeriesEpisode[] = [];
  try {
    list = JSON.parse(String(snapshot.data()?.episodes_json ?? "[]")) as SeriesEpisode[];
  } catch {
    list = [];
  }
  const next = sortEpisodes([...list.filter((e) => e.slug !== entry.slug), entry]);
  await setDoc(ref, { episodes_json: JSON.stringify(next), updated_at_iso: new Date().toISOString(), updated_by: user.email ?? null, touched: serverTimestamp() });
}
