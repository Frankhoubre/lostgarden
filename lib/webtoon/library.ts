"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadString } from "firebase/storage";
import { getDb, getFirebaseApp } from "@/lib/firebase";
import type { LibraryOverlay, ReferenceAsset } from "@/lib/webtoon/types";

/**
 * The studio's library of references: characters and locations added,
 * changed or hidden from the studio, on top of the code library. Stored in
 * Firestore as one document per strip; the images go to Storage.
 */
export const LIBRARY_COLLECTION = "webtoon_library";

export const EMPTY_LIBRARY: LibraryOverlay = { assets: [], hidden: [] };

type LibraryDocument = { assets_json: string; hidden_json: string; updated_at_iso: string; updated_by: string | null };

export async function loadLibrary(slug: string): Promise<LibraryOverlay | null> {
  const snapshot = await getDoc(doc(getDb(), LIBRARY_COLLECTION, slug));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<LibraryDocument>;
  try {
    return {
      assets: data.assets_json ? (JSON.parse(data.assets_json) as ReferenceAsset[]) : [],
      hidden: data.hidden_json ? (JSON.parse(data.hidden_json) as string[]) : [],
    };
  } catch {
    return null;
  }
}

export async function saveLibrary(slug: string, library: LibraryOverlay, user: User): Promise<void> {
  const payload: LibraryDocument & { touched: unknown } = {
    assets_json: JSON.stringify(library.assets),
    hidden_json: JSON.stringify(library.hidden),
    updated_at_iso: new Date().toISOString(),
    updated_by: user.email ?? null,
    touched: serverTimestamp(),
  };
  await setDoc(doc(getDb(), LIBRARY_COLLECTION, slug), payload);
}

/** A sheet or reference image of the library goes to Storage, next to the panels. */
export async function uploadLibraryImage(slug: string, assetId: string, dataUrl: string): Promise<string> {
  const storage = getStorage(getFirebaseApp());
  const extension = dataUrl.startsWith("data:image/jpeg") ? "jpg" : dataUrl.startsWith("data:image/webp") ? "webp" : "png";
  const safe = assetId.replace(/[^a-z0-9._-]/gi, "_");
  const target = ref(storage, `webtoon/${slug}/library/${safe}/${Date.now()}.${extension}`);
  await uploadString(target, dataUrl, "data_url");
  return getDownloadURL(target);
}

/** `Le Roi Voûte` → `le-roi-voute`, for ids. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Put or replace one asset in the overlay (by id). */
export function upsertAsset(library: LibraryOverlay, asset: ReferenceAsset): LibraryOverlay {
  const custom = { ...asset, custom: true };
  const exists = library.assets.some((a) => a.id === asset.id);
  return {
    hidden: library.hidden.filter((id) => id !== asset.id),
    assets: exists ? library.assets.map((a) => (a.id === asset.id ? custom : a)) : [...library.assets, custom],
  };
}

/** Remove an asset: a studio one disappears, a built-in one is hidden. */
export function removeAsset(library: LibraryOverlay, id: string, builtIn: boolean): LibraryOverlay {
  return {
    assets: library.assets.filter((a) => a.id !== id),
    hidden: builtIn && !library.hidden.includes(id) ? [...library.hidden, id] : library.hidden,
  };
}

export function restoreAsset(library: LibraryOverlay, id: string): LibraryOverlay {
  return { ...library, hidden: library.hidden.filter((h) => h !== id) };
}
