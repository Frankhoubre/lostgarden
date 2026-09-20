"use client";

import type { User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadString } from "firebase/storage";
import { getDb, getFirebaseApp } from "@/lib/firebase";
import type { WebtoonPanel } from "@/lib/webtoon/types";

/**
 * The private studio at /convert-video-to-webtoon. Access is an allowlist of
 * Google accounts, checked in the browser (gate) and on the server (generate
 * route) and enforced by the Firestore and Storage rules, which repeat the
 * same addresses. `NEXT_PUBLIC_WEBTOON_STUDIO_EMAILS` can extend the list
 * without a deploy of the rules only if the rules are updated too.
 */
const BUILT_IN_STUDIO_EMAILS = ["frank.houbre@gmail.com"];

export function studioEmails(): string[] {
  const extra = (process.env.NEXT_PUBLIC_WEBTOON_STUDIO_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...BUILT_IN_STUDIO_EMAILS, ...extra])];
}

export function isStudioUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return studioEmails().includes(email.trim().toLowerCase());
}

/** Firestore collections: the working draft and the version the public reader shows. */
export const DRAFTS_COLLECTION = "webtoon_drafts";
export const PUBLISHED_COLLECTION = "webtoon_published";

export type StoredStrip = {
  panels: WebtoonPanel[];
  updated_at: string | null;
  updated_by: string | null;
};

type StripDocument = {
  /**
   * The first slice of the panels as one JSON array string. A Firestore
   * document holds at most 1 MiB, and a long strip with its composed prompts
   * goes past that: the panels are packed into slices of at most
   * `CHUNK_BYTES`, the first one here and the others in the `chunks`
   * subcollection (`chunks/1`, `chunks/2`, ...), `chunk_count` slices in all.
   * A strip saved before the slicing has no `chunk_count` and reads as one.
   */
  panels_json: string;
  chunk_count?: number;
  updated_by: string | null;
  updated_at_iso: string;
};

/** Under the Firestore limit of 1 MiB per document, with room for the other fields. */
const CHUNK_BYTES = 700_000;
export const CHUNKS_SUBCOLLECTION = "chunks";

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** Packs the panels into JSON array strings of at most `CHUNK_BYTES` each, in order. */
export function sliceStrip(panels: WebtoonPanel[], limit = CHUNK_BYTES): string[] {
  const slices: string[] = [];
  let current: WebtoonPanel[] = [];
  let bytes = 2;
  for (const panel of panels) {
    const size = utf8Bytes(JSON.stringify(panel)) + 1;
    if (current.length && bytes + size > limit) {
      slices.push(JSON.stringify(current));
      current = [];
      bytes = 2;
    }
    current.push(panel);
    bytes += size;
  }
  if (current.length || !slices.length) slices.push(JSON.stringify(current));
  return slices;
}

function parsePanels(raw: string | undefined): WebtoonPanel[] {
  if (!raw) return [];
  try {
    const panels = JSON.parse(raw) as WebtoonPanel[];
    return Array.isArray(panels) ? panels : [];
  } catch {
    return [];
  }
}

export async function loadStrip(collectionName: string, slug: string): Promise<StoredStrip | null> {
  const db = getDb();
  const snapshot = await getDoc(doc(db, collectionName, slug));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<StripDocument>;
  const panels = parsePanels(data.panels_json);
  const count = Math.max(1, Math.floor(data.chunk_count ?? 1));
  for (let index = 1; index < count; index += 1) {
    const chunk = await getDoc(doc(db, collectionName, slug, CHUNKS_SUBCOLLECTION, String(index)));
    panels.push(...parsePanels((chunk.data() as { panels_json?: string } | undefined)?.panels_json));
  }
  if (!panels.length) return null;
  return { panels, updated_at: data.updated_at_iso ?? null, updated_by: data.updated_by ?? null };
}

export async function saveStrip(collectionName: string, slug: string, panels: WebtoonPanel[], user: User): Promise<string> {
  const db = getDb();
  const now = new Date().toISOString();
  const slices = sliceStrip(panels);
  const batch = writeBatch(db);
  const payload: StripDocument & { touched: unknown } = {
    panels_json: slices[0],
    chunk_count: slices.length,
    updated_by: user.email ?? null,
    updated_at_iso: now,
    touched: serverTimestamp(),
  };
  batch.set(doc(db, collectionName, slug), payload);
  slices.slice(1).forEach((slice, offset) => {
    batch.set(doc(db, collectionName, slug, CHUNKS_SUBCOLLECTION, String(offset + 1)), { panels_json: slice, updated_at_iso: now });
  });
  await batch.commit();
  // Slices left over from a longer save would be read again: drop them.
  const stale = await getDocs(collection(db, collectionName, slug, CHUNKS_SUBCOLLECTION));
  await Promise.all(stale.docs.filter((chunk) => Number(chunk.id) >= slices.length).map((chunk) => deleteDoc(chunk.ref)));
  return now;
}

/**
 * A regenerated or uploaded panel image goes to Firebase Storage, never into
 * Firestore: the panel keeps a plain https URL that the reader can display.
 */
export async function uploadPanelImage(slug: string, panelId: string, dataUrl: string): Promise<string> {
  const storage = getStorage(getFirebaseApp());
  const extension = dataUrl.startsWith("data:image/jpeg") ? "jpg" : dataUrl.startsWith("data:image/webp") ? "webp" : "png";
  const path = `webtoon/${slug}/${panelId}/${Date.now()}.${extension}`;
  const target = ref(storage, path);
  await uploadString(target, dataUrl, "data_url");
  return getDownloadURL(target);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Reads the natural size of an image so the panel keeps correct dimensions. */
export function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("image failed to load"));
    image.src = src;
  });
}
