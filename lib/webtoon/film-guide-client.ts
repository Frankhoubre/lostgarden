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
