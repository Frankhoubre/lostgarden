"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { LIBRARY_COLLECTION } from "@/lib/webtoon/library";
import type { FilmRead, StoryDoc } from "@/lib/webtoon/story";

async function load<T>(id: string, field: string): Promise<T | null> {
  const snapshot = await getDoc(doc(getDb(), LIBRARY_COLLECTION, id));
  if (!snapshot.exists()) return null;
  try {
    return JSON.parse(String((snapshot.data() as Record<string, unknown>)[field] ?? "null")) as T | null;
  } catch {
    return null;
  }
}

async function save(id: string, field: string, value: unknown, user: User) {
  await setDoc(doc(getDb(), LIBRARY_COLLECTION, id), { [field]: JSON.stringify(value), updated_at_iso: new Date().toISOString(), updated_by: user.email ?? null, touched: serverTimestamp() });
}

export const loadStory = (slug: string) => load<StoryDoc>(`${slug}~story`, "story_json");
export const saveStory = (slug: string, story: StoryDoc, user: User) => save(`${slug}~story`, "story_json", story, user);
export const loadFilmRead = (slug: string) => load<FilmRead>(`${slug}~filmread`, "read_json");
export const saveFilmRead = (slug: string, read: FilmRead, user: User) => save(`${slug}~filmread`, "read_json", read, user);
