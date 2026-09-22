"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { getDb, getFirebaseApp } from "@/lib/firebase";
import { LIBRARY_COLLECTION } from "@/lib/webtoon/library";
import {
  PROJECT_REGISTRY_DOC,
  framesDocId,
  frameName,
  projectDocId,
  summaryOf,
  type ProjectFrame,
  type ProjectSummary,
  type StudioProject,
} from "@/lib/webtoon/project";

/** The projects of the studio, newest first (Lost Garden, built in, is not listed here). */
export async function listProjects(): Promise<ProjectSummary[]> {
  const snapshot = await getDoc(doc(getDb(), LIBRARY_COLLECTION, PROJECT_REGISTRY_DOC));
  if (!snapshot.exists()) return [];
  try {
    const list = JSON.parse(String(snapshot.data().projects_json ?? "[]")) as ProjectSummary[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeRegistry(list: ProjectSummary[], user: User) {
  await setDoc(doc(getDb(), LIBRARY_COLLECTION, PROJECT_REGISTRY_DOC), {
    projects_json: JSON.stringify(list),
    updated_at_iso: new Date().toISOString(),
    updated_by: user.email ?? null,
    touched: serverTimestamp(),
  });
}

export async function loadProject(id: string): Promise<StudioProject | null> {
  const snapshot = await getDoc(doc(getDb(), LIBRARY_COLLECTION, projectDocId(id)));
  if (!snapshot.exists()) return null;
  try {
    return JSON.parse(String(snapshot.data().project_json)) as StudioProject;
  } catch {
    return null;
  }
}

/** Saves the project and its line in the registry. */
export async function saveProject(project: StudioProject, user: User): Promise<StudioProject> {
  const next = { ...project, updated_at: new Date().toISOString() };
  await setDoc(doc(getDb(), LIBRARY_COLLECTION, projectDocId(project.id)), {
    project_json: JSON.stringify(next),
    updated_at_iso: next.updated_at,
    updated_by: user.email ?? null,
    touched: serverTimestamp(),
  });
  const list = await listProjects();
  const summary = summaryOf(next);
  await writeRegistry([summary, ...list.filter((p) => p.id !== next.id)], user);
  return next;
}

/** Takes the project out of the list; its data stays where it is and can be restored from the export. */
export async function removeProject(id: string, user: User): Promise<void> {
  const list = await listProjects();
  await writeRegistry(
    list.filter((p) => p.id !== id),
    user,
  );
}

export async function loadFrames(id: string): Promise<ProjectFrame[]> {
  const snapshot = await getDoc(doc(getDb(), LIBRARY_COLLECTION, framesDocId(id)));
  if (!snapshot.exists()) return [];
  try {
    const frames = JSON.parse(String(snapshot.data().frames_json ?? "[]")) as ProjectFrame[];
    return Array.isArray(frames) ? frames.sort((a, b) => a.seconds - b.seconds) : [];
  } catch {
    return [];
  }
}

export async function saveFrames(id: string, frames: ProjectFrame[], user: User): Promise<void> {
  const sorted = [...frames].sort((a, b) => a.seconds - b.seconds);
  await setDoc(doc(getDb(), LIBRARY_COLLECTION, framesDocId(id)), {
    frames_json: JSON.stringify(sorted),
    count: sorted.length,
    updated_at_iso: new Date().toISOString(),
    updated_by: user.email ?? null,
    touched: serverTimestamp(),
  });
}

/** One frame of the film to Storage, public URL back. */
export async function uploadFrame(id: string, seconds: number, blob: Blob): Promise<string> {
  const target = ref(getStorage(getFirebaseApp()), `webtoon/${id}/film/${frameName(seconds)}.jpg`);
  await uploadBytes(target, blob, { contentType: "image/jpeg", cacheControl: "public, max-age=31536000" });
  return getDownloadURL(target);
}

/** A reference image chosen by the user for a sheet (a photo, a drawing), to Storage. */
export async function uploadReference(id: string, assetId: string, file: File): Promise<string> {
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const safe = assetId.replace(/[^a-z0-9._-]/gi, "_");
  const target = ref(getStorage(getFirebaseApp()), `webtoon/${id}/references/${safe}/${Date.now()}.${extension}`);
  await uploadBytes(target, file, { contentType: file.type || "image/jpeg" });
  return getDownloadURL(target);
}
