"use client";

import type { User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { LIBRARY_COLLECTION } from "@/lib/webtoon/library";
import { CHUNKS_SUBCOLLECTION, loadStrip, saveStrip } from "@/lib/webtoon/studio";
import type { WebtoonPanel } from "@/lib/webtoon/types";

/**
 * NAMED SAVE POINTS of a strip ("Avant peaufinage", "Version envoyée à X"):
 * the whole strip kept as it was, to come back to days later, when "Annuler"
 * only reaches back to the start of the session. Each point is stored like a
 * draft, sliced (`webtoon_snapshots/<slug>~<id>` and its chunks), studio only;
 * the list lives next to the library (`webtoon_library/<slug>~snapshots`).
 * One is also taken by itself before every publication.
 */

export const SNAPSHOTS_COLLECTION = "webtoon_snapshots";
/** Automatic points kept per strip; the oldest go first. The author's own are never removed by the studio. */
const AUTO_KEPT = 20;

export type SnapshotEntry = { id: string; name: string; at: string; panels: number; images: number; auto: boolean };

const listDoc = (slug: string) => doc(getDb(), LIBRARY_COLLECTION, `${slug}~snapshots`);

export async function listSnapshots(slug: string): Promise<SnapshotEntry[]> {
  const snapshot = await getDoc(listDoc(slug));
  if (!snapshot.exists()) return [];
  try {
    const list = JSON.parse((snapshot.data() as { list_json?: string }).list_json ?? "[]") as SnapshotEntry[];
    return Array.isArray(list) ? list.sort((a, b) => b.at.localeCompare(a.at)) : [];
  } catch {
    return [];
  }
}

async function writeList(slug: string, list: SnapshotEntry[], user: User) {
  await setDoc(listDoc(slug), { list_json: JSON.stringify(list), updated_at_iso: new Date().toISOString(), updated_by: user.email ?? null, touched: serverTimestamp() });
}

async function dropStored(slug: string, id: string) {
  const key = `${slug}~${id}`;
  const chunks = await getDocs(collection(getDb(), SNAPSHOTS_COLLECTION, key, CHUNKS_SUBCOLLECTION));
  await Promise.all(chunks.docs.map((chunk) => deleteDoc(chunk.ref)));
  await deleteDoc(doc(getDb(), SNAPSHOTS_COLLECTION, key));
}

export async function createSnapshot(slug: string, name: string, panels: WebtoonPanel[], user: User, auto = false): Promise<SnapshotEntry> {
  const id = `s${Date.now().toString(36)}`;
  await saveStrip(SNAPSHOTS_COLLECTION, `${slug}~${id}`, panels, user);
  const entry: SnapshotEntry = { id, name: name.trim().slice(0, 80) || "Sans nom", at: new Date().toISOString(), panels: panels.length, images: panels.filter((p) => p.image.src).length, auto };
  let list = [entry, ...(await listSnapshots(slug))];
  const autos = list.filter((s) => s.auto);
  const extra = autos.slice(AUTO_KEPT);
  for (const old of extra) await dropStored(slug, old.id).catch(() => undefined);
  list = list.filter((s) => !extra.includes(s));
  await writeList(slug, list, user);
  return entry;
}

export async function loadSnapshot(slug: string, id: string): Promise<WebtoonPanel[] | null> {
  return (await loadStrip(SNAPSHOTS_COLLECTION, `${slug}~${id}`))?.panels ?? null;
}

export async function deleteSnapshot(slug: string, id: string, user: User): Promise<void> {
  await dropStored(slug, id);
  await writeList(slug, (await listSnapshots(slug)).filter((s) => s.id !== id), user);
}

export async function renameSnapshot(slug: string, id: string, name: string, user: User): Promise<void> {
  await writeList(slug, (await listSnapshots(slug)).map((s) => (s.id === id ? { ...s, name: name.trim().slice(0, 80) || s.name, auto: false } : s)), user);
}
