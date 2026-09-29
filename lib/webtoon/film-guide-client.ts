"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { LIBRARY_COLLECTION } from "@/lib/webtoon/library";
import type { FilmGuide } from "@/lib/webtoon/film-guide";

/** The film guide of a project lives next to its library: `webtoon_library/<slug>~guide`. */
export const guideDocId = (slug: string) => `${slug}~guide`;

export async function loadGuide(slug: string): Promise<FilmGuide | null> {
  const snapshot = await getDoc(doc(getDb(), LIBRARY_COLLECTION, guideDocId(slug)));
  if (!snapshot.exists()) return null;
  try {
    const guide = JSON.parse((snapshot.data() as { guide_json?: string }).guide_json ?? "null") as FilmGuide | null;
    return guide && Array.isArray(guide.sequences) ? guide : null;
  } catch {
    return null;
  }
}

export async function saveGuide(slug: string, guide: FilmGuide, user: User): Promise<void> {
  await setDoc(doc(getDb(), LIBRARY_COLLECTION, guideDocId(slug)), {
    guide_json: JSON.stringify(guide),
    updated_at_iso: new Date().toISOString(),
    updated_by: user.email ?? null,
    touched: serverTimestamp(),
  });
}

/** The dense frames (four per second) of the action scenes: `webtoon_library/<slug>~dense`. */
export const denseDocId = (slug: string) => `${slug}~dense`;

export type DenseFrame = { src: string; seconds: number };

export async function loadDense(slug: string): Promise<DenseFrame[]> {
  const snapshot = await getDoc(doc(getDb(), LIBRARY_COLLECTION, denseDocId(slug)));
  if (!snapshot.exists()) return [];
  try {
    const list = JSON.parse((snapshot.data() as { dense_json?: string }).dense_json ?? "[]") as DenseFrame[];
    return Array.isArray(list) ? list.sort((a, b) => a.seconds - b.seconds) : [];
  } catch {
    return [];
  }
}

export async function saveDense(slug: string, frames: DenseFrame[], user: User): Promise<void> {
  await setDoc(doc(getDb(), LIBRARY_COLLECTION, denseDocId(slug)), {
    dense_json: JSON.stringify([...frames].sort((a, b) => a.seconds - b.seconds)),
    count: frames.length,
    updated_at_iso: new Date().toISOString(),
    updated_by: user.email ?? null,
    touched: serverTimestamp(),
  });
}

/** Where a dense frame goes in Storage: `webtoon/<slug>/film-dense/01m23s250.jpg`. */
export function densePath(slug: string, seconds: number): string {
  const whole = Math.floor(seconds);
  const ms = Math.round((seconds - whole) * 1000);
  return `webtoon/${slug}/film-dense/${String(Math.floor(whole / 60)).padStart(2, "0")}m${String(whole % 60).padStart(2, "0")}s${String(ms).padStart(3, "0")}.jpg`;
}
