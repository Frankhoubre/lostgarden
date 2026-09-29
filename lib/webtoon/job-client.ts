"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { JOBS_COLLECTION, type StudioJob } from "@/lib/webtoon/studio-job";

/** Follows the background job of a project (lib/webtoon/studio-job.ts); null when there is none. */
export function watchJob(slug: string, onChange: (job: StudioJob | null) => void): () => void {
  return onSnapshot(
    doc(getDb(), JOBS_COLLECTION, slug),
    (snapshot) => {
      const raw = snapshot.exists() ? (snapshot.data() as { job_json?: string }).job_json : undefined;
      if (!raw) return onChange(null);
      try {
        onChange(JSON.parse(raw) as StudioJob);
      } catch {
        onChange(null);
      }
    },
    () => onChange(null),
  );
}

async function call(slug: string, body: Record<string, unknown>): Promise<{ ok: boolean; job?: StudioJob; error?: string; resumed?: boolean }> {
  const user = getFirebaseAuth().currentUser;
  const token = await user?.getIdToken().catch(() => "");
  if (!user || !token) return { ok: false, error: "Connectez-vous au studio : un travail en arrière-plan agit au nom du compte." };
  const response = await fetch(`/api/webtoon/${encodeURIComponent(slug)}/job`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    // The refresh token lets the server act as the account for hours, once the tab is closed; it is kept encrypted.
    body: JSON.stringify(body.action === "start" ? { ...body, refresh_token: user.refreshToken } : body),
  });
  const payload = (await response.json().catch(() => ({}))) as { job?: StudioJob; error?: string; resumed?: boolean };
  return { ok: response.ok, ...payload, error: response.ok ? undefined : payload.error ?? `erreur ${response.status}` };
}

export function startJob(slug: string, input: { kind: StudioJob["kind"]; params?: Partial<StudioJob["params"]>; panel_ids?: string[]; prompts?: Record<string, string>; label: string }) {
  return call(slug, { action: "start", ...input });
}

export function cancelJob(slug: string) {
  return call(slug, { action: "cancel" });
}

/** Resumes a job whose chain of steps broke (the server restarts it only when it has been silent for minutes). */
export function kickJob(slug: string) {
  return call(slug, { action: "kick" });
}
