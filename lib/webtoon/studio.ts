"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
  /** The panels as one JSON string: one field to read, no Firestore typing to decode. */
  panels_json: string;
  updated_by: string | null;
  updated_at_iso: string;
};

function decode(data: Partial<StripDocument> | undefined): StoredStrip | null {
  if (!data?.panels_json) return null;
  try {
    const panels = JSON.parse(data.panels_json) as WebtoonPanel[];
    if (!Array.isArray(panels) || !panels.length) return null;
    return { panels, updated_at: data.updated_at_iso ?? null, updated_by: data.updated_by ?? null };
  } catch {
    return null;
  }
}

export async function loadStrip(collection: string, slug: string): Promise<StoredStrip | null> {
  const snapshot = await getDoc(doc(getDb(), collection, slug));
  return snapshot.exists() ? decode(snapshot.data() as Partial<StripDocument>) : null;
}

export async function saveStrip(collection: string, slug: string, panels: WebtoonPanel[], user: User): Promise<string> {
  const now = new Date().toISOString();
  const payload: StripDocument & { touched: unknown } = {
    panels_json: JSON.stringify(panels),
    updated_by: user.email ?? null,
    updated_at_iso: now,
    touched: serverTimestamp(),
  };
  await setDoc(doc(getDb(), collection, slug), payload);
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
