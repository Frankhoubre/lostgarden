import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { FilmGuide } from "./film-guide";
import { JOBS_COLLECTION, type OpeningState, type StudioJob } from "./studio-job";
import type { LibraryOverlay, ReferenceAsset, WebtoonPanel } from "./types";

/**
 * The server side of a background job (lib/webtoon/studio-job.ts): it acts
 * as the studio account without a browser. The tab that starts the job hands
 * over the account's Firebase refresh token; it is kept encrypted in the job
 * document (readable by the studio account only, by the Firestore rules) and
 * exchanged for a fresh ID token at each step, so the Firestore and Storage
 * rules apply exactly as from the studio. The steps call each other with a
 * signature only the server can make.
 */

const PROJECT = () => process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const BASE = () => `https://firestore.googleapis.com/v1/projects/${PROJECT()}/databases/(default)/documents`;

/** The key of the job secrets: its own variable when set, else derived from the gateway key the server already keeps. */
function secretKey(): Buffer {
  const material = process.env.WEBTOON_JOB_SECRET || `${process.env.AI_GATEWAY_API_KEY ?? ""}:webtoon-job-v1`;
  if (material.length < 24) throw new Error("no server secret for background jobs (WEBTOON_JOB_SECRET)");
  return createHash("sha256").update(material).digest();
}

export function sealToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const body = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

export function openToken(sealed: string): string {
  const [iv, tag, body] = sealed.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

/** The signature of a step call: only this server can start the next step of a job. */
export function stepSignature(slug: string, jobId: string): string {
  return createHmac("sha256", secretKey()).update(`${slug}:${jobId}`).digest("base64url");
}

export function validStep(slug: string, jobId: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = Buffer.from(stepSignature(slug, jobId));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** A fresh ID token of the studio account, from the refresh token the tab handed over. */
export async function idTokenFrom(refreshToken: string): Promise<{ idToken: string; refreshToken: string }> {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not set");
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    cache: "no-store",
  });
  const json = (await response.json().catch(() => ({}))) as { id_token?: string; refresh_token?: string; error?: { message?: string } };
  if (!response.ok || !json.id_token) throw new Error(`jeton du compte refusé (${json.error?.message ?? response.status})`);
  return { idToken: json.id_token, refreshToken: json.refresh_token ?? refreshToken };
}

type Fields = Record<string, { stringValue?: string; integerValue?: string; doubleValue?: number; booleanValue?: boolean }>;

async function getFields(path: string, idToken: string): Promise<Fields | null> {
  const response = await fetch(`${BASE()}/${path}`, { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore ${response.status} sur ${path.split("/")[0]}`);
  return ((await response.json()) as { fields?: Fields }).fields ?? {};
}

type Write = { update: { name: string; fields: Fields } } | { delete: string };

async function commit(writes: Write[], idToken: string): Promise<void> {
  const response = await fetch(`${BASE()}:commit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}`, "content-type": "application/json" },
    body: JSON.stringify({ writes }),
  });
  if (!response.ok) throw new Error(`Firestore ${response.status}: ${(await response.text()).slice(0, 200)}`);
}

const docName = (path: string) => `projects/${PROJECT()}/databases/(default)/documents/${path}`;
const str = (value: string) => ({ stringValue: value });

// ---- The job document ----

export type StoredJob = { job: StudioJob; sealed: string };

export async function loadJob(slug: string, idToken: string): Promise<StoredJob | null> {
  const fields = await getFields(`${JOBS_COLLECTION}/${encodeURIComponent(slug)}`, idToken);
  if (!fields?.job_json?.stringValue) return null;
  try {
    return { job: JSON.parse(fields.job_json.stringValue) as StudioJob, sealed: fields.token?.stringValue ?? "" };
  } catch {
    return null;
  }
}

export async function saveJob(job: StudioJob, sealed: string, idToken: string): Promise<void> {
  job.updated_at = new Date().toISOString();
  job.log = job.log.slice(-24);
  await commit(
    [
      {
        update: {
          name: docName(`${JOBS_COLLECTION}/${encodeURIComponent(job.slug)}`),
          fields: { job_json: str(JSON.stringify(job)), token: str(sealed), status: str(job.status), updated_at_iso: str(job.updated_at), heartbeat_at: str(job.heartbeat_at) },
        },
      },
    ],
    idToken,
  );
}

// ---- The draft, sliced as lib/webtoon/studio.ts slices it ----

const CHUNK_BYTES = 700_000;

function slices(panels: WebtoonPanel[]): string[] {
  const out: string[] = [];
  let current: WebtoonPanel[] = [];
  let bytes = 2;
  for (const panel of panels) {
    const size = Buffer.byteLength(JSON.stringify(panel)) + 1;
    if (current.length && bytes + size > CHUNK_BYTES) {
      out.push(JSON.stringify(current));
      current = [];
      bytes = 2;
    }
    current.push(panel);
    bytes += size;
  }
  if (current.length || !out.length) out.push(JSON.stringify(current));
  return out;
}

export async function loadDraft(slug: string, idToken: string): Promise<{ panels: WebtoonPanel[]; chunks: number }> {
  const path = `webtoon_drafts/${encodeURIComponent(slug)}`;
  const fields = await getFields(path, idToken);
  if (!fields) return { panels: [], chunks: 0 };
  const panels = JSON.parse(fields.panels_json?.stringValue ?? "[]") as WebtoonPanel[];
  const count = Math.max(1, Number(fields.chunk_count?.integerValue ?? 1));
  for (let i = 1; i < count; i += 1) {
    const chunk = await getFields(`${path}/chunks/${i}`, idToken);
    panels.push(...(JSON.parse(chunk?.panels_json?.stringValue ?? "[]") as WebtoonPanel[]));
  }
  return { panels, chunks: count };
}

/** Saves the draft in one commit, with the job as its author, so an open tab merges it instead of stopping its saves. */
export async function saveDraft(slug: string, panels: WebtoonPanel[], previousChunks: number, sessionId: string, email: string, idToken: string): Promise<void> {
  const path = `webtoon_drafts/${encodeURIComponent(slug)}`;
  const parts = slices(panels.map((p, i) => (p.order === i + 1 ? p : { ...p, order: i + 1 })));
  const now = new Date().toISOString();
  const writes: Write[] = [
    { update: { name: docName(path), fields: { panels_json: str(parts[0]), chunk_count: { integerValue: String(parts.length) }, updated_by: str(email), updated_at_iso: str(now), session_id: str(sessionId) } } },
    ...parts.slice(1).map((slice, i) => ({ update: { name: docName(`${path}/chunks/${i + 1}`), fields: { panels_json: str(slice), updated_at_iso: str(now) } } })),
  ];
  for (let i = parts.length; i < previousChunks; i += 1) writes.push({ delete: docName(`${path}/chunks/${i}`) });
  await commit(writes, idToken);
}

// ---- The library, its guide and the opening state ----

export async function loadLibraryOverlay(slug: string, idToken: string): Promise<LibraryOverlay | null> {
  const fields = await getFields(`webtoon_library/${encodeURIComponent(slug)}`, idToken);
  if (!fields) return null;
  return {
    assets: JSON.parse(fields.assets_json?.stringValue ?? "[]") as ReferenceAsset[],
    hidden: JSON.parse(fields.hidden_json?.stringValue ?? "[]") as string[],
    ...(fields.base?.stringValue ? { base: fields.base.stringValue as "lost-garden" | "none" } : {}),
  };
}

export async function saveLibraryOverlay(slug: string, library: LibraryOverlay, email: string, idToken: string): Promise<void> {
  await commit(
    [
      {
        update: {
          name: docName(`webtoon_library/${encodeURIComponent(slug)}`),
          fields: { assets_json: str(JSON.stringify(library.assets)), hidden_json: str(JSON.stringify(library.hidden)), ...(library.base ? { base: str(library.base) } : {}), updated_at_iso: str(new Date().toISOString()), updated_by: str(email) },
        },
      },
    ],
    idToken,
  );
}

export async function loadGuideDoc(slug: string, idToken: string): Promise<FilmGuide | null> {
  const fields = await getFields(`webtoon_library/${encodeURIComponent(`${slug}~guide`)}`, idToken).catch(() => null);
  try {
    const guide = JSON.parse(fields?.guide_json?.stringValue ?? "null") as FilmGuide | null;
    return guide && Array.isArray(guide.sequences) ? guide : null;
  } catch {
    return null;
  }
}

export async function loadOpening(slug: string, idToken: string): Promise<OpeningState | null> {
  const fields = await getFields(`webtoon_library/${encodeURIComponent(`${slug}~handoff`)}`, idToken).catch(() => null);
  try {
    const value = JSON.parse(fields?.handoff_json?.stringValue ?? "null") as OpeningState | null;
    return value?.text ? value : null;
  } catch {
    return null;
  }
}

/** The glossary and voices of a series (lib/webtoon/glossary.ts), for the translation. */
export async function loadGlossaryDoc(docId: string, idToken: string): Promise<import("./glossary").Glossary | null> {
  const fields = await getFields(`webtoon_library/${encodeURIComponent(docId)}`, idToken).catch(() => null);
  try {
    const value = JSON.parse(fields?.glossary_json?.stringValue ?? "null") as import("./glossary").Glossary | null;
    return value ? { terms: value.terms ?? [], voices: value.voices ?? [] } : null;
  } catch {
    return null;
  }
}
