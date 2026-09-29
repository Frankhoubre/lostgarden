import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";
import { SITE_URL } from "@/lib/seo";
import {
  ALERTS_PAGE,
  ANNOUNCEMENTS_COLLECTION,
  CONFIRM_TTL_MS,
  SUBSCRIBERS_COLLECTION,
  UNSUBSCRIBE_PATH,
  type SubscriberStatus,
} from "./alerts";
import type { MailContent } from "./alerts-mail";

/** Server side of the episode alerts (see lib/webtoon/alerts.ts for the design). */

// ---- Secrets and signed links ----

/** Its own variable when set, else derived from the gateway key the server already keeps. */
function secretKey(): Buffer {
  const material = process.env.WEBTOON_ALERTS_SECRET || `${process.env.AI_GATEWAY_API_KEY ?? ""}:webtoon-alerts-v1`;
  if (material.length < 24) throw new Error("no server secret for episode alerts (WEBTOON_ALERTS_SECRET)");
  return createHash("sha256").update(material).digest();
}

const hmac = (message: string) => createHmac("sha256", secretKey()).update(message).digest("base64url");

function sameSignature(expected: string, given: string | null | undefined): boolean {
  if (!given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null;
}

/** The document id of an address: 43 base64url characters only the server can compute. */
export const subscriberId = (email: string) => hmac(`subscriber:${email}`);

export const validId = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{43}$/.test(id);

export function confirmSignature(id: string, ts: number): string {
  return hmac(`confirm:${id}:${ts}`);
}

export function checkConfirm(id: string, ts: number, sig: string | null | undefined): "ok" | "expired" | "invalid" {
  if (!validId(id) || !Number.isFinite(ts) || !sameSignature(confirmSignature(id, ts), sig)) return "invalid";
  return Date.now() - ts > CONFIRM_TTL_MS ? "expired" : "ok";
}

export const unsubscribeSignature = (id: string) => hmac(`unsubscribe:${id}`);

export const checkUnsubscribe = (id: string, sig: string | null | undefined) => validId(id) && sameSignature(unsubscribeSignature(id), sig);

const siteUrl = () => SITE_URL.replace(/\/$/, "");

/** The page with the "confirm" button (the email never acts on a GET: mail scanners open links). */
export function confirmPageUrl(origin: string, locale: Locale, id: string): string {
  const ts = Date.now();
  const params = new URLSearchParams({ action: "confirm", id, ts: String(ts), sig: confirmSignature(id, ts) });
  return `${origin}${localePath(locale, ALERTS_PAGE)}?${params}`;
}

export function unsubscribePageUrl(origin: string, locale: Locale, id: string): string {
  const params = new URLSearchParams({ action: "unsubscribe", id, sig: unsubscribeSignature(id) });
  return `${origin}${localePath(locale, ALERTS_PAGE)}?${params}`;
}

/** RFC 8058 one-click target, for the List-Unsubscribe header. */
export function oneClickUrl(origin: string, id: string): string {
  return `${origin}${UNSUBSCRIBE_PATH}?${new URLSearchParams({ id, sig: unsubscribeSignature(id) })}`;
}

/** The public origin of the links: the site in production, the dev server locally. */
export function linkOrigin(request: Request): string {
  return process.env.NODE_ENV === "development" ? new URL(request.url).origin : siteUrl();
}

export const episodeUrl = (origin: string, locale: Locale, slug: string) => `${origin}${localePath(locale, `/webtoon/${slug}`)}`;

// ---- Firestore (REST, as the public or as the studio account) ----

const PROJECT = () => process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const BASE = () => `https://firestore.googleapis.com/v1/projects/${PROJECT()}/databases/(default)/documents`;
const docName = (path: string) => `projects/${PROJECT()}/databases/(default)/documents/${path}`;
const subscriberPath = (id: string) => `${SUBSCRIBERS_COLLECTION}/${id}`;

type Value = { stringValue?: string; integerValue?: string; timestampValue?: string };
type Fields = Record<string, Value>;

/** Without a studio token the request is anonymous: the API key identifies the project, the rules decide. */
function auth(idToken?: string | null): { query: string; headers: Record<string, string> } {
  if (idToken) return { query: "", headers: { Authorization: `Bearer ${idToken}` } };
  return { query: `?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? ""}`, headers: {} };
}

export type Subscriber = { id: string; email: string; locale: Locale; status: SubscriberStatus; created_at: string; updated_at: string };

function toSubscriber(id: string, fields: Fields): Subscriber | null {
  const email = fields.email?.stringValue;
  const status = fields.status?.stringValue;
  const locale = fields.locale?.stringValue ?? "en";
  if (!email || (status !== "pending" && status !== "confirmed")) return null;
  return {
    id,
    email,
    locale: isLocale(locale) ? locale : "en",
    status,
    created_at: fields.created_at?.timestampValue ?? "",
    updated_at: fields.updated_at?.timestampValue ?? "",
  };
}

export async function getSubscriber(id: string): Promise<Subscriber | null> {
  const a = auth();
  const response = await fetch(`${BASE()}/${subscriberPath(id)}${a.query}`, { headers: a.headers, cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Firestore ${response.status} (lecture abonné)`);
  const json = (await response.json()) as { fields?: Fields };
  return toSubscriber(id, json.fields ?? {});
}

async function commit(writes: unknown[], idToken?: string | null): Promise<void> {
  const a = auth(idToken);
  const response = await fetch(`${BASE()}:commit${a.query}`, {
    method: "POST",
    headers: { ...a.headers, "content-type": "application/json" },
    body: JSON.stringify({ writes }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Firestore ${response.status}: ${(await response.text()).slice(0, 200)}`);
}

/** Writes the address as pending: a new document, or the refresh of one still pending. */
export async function savePending(id: string, email: string, locale: Locale, existing: Subscriber | null): Promise<void> {
  const fields: Fields = { email: { stringValue: email }, locale: { stringValue: locale }, status: { stringValue: "pending" } };
  if (existing) fields.created_at = { timestampValue: existing.created_at };
  await commit([
    {
      update: { name: docName(subscriberPath(id)), fields },
      updateTransforms: [
        ...(existing ? [] : [{ fieldPath: "created_at", setToServerValue: "REQUEST_TIME" }]),
        { fieldPath: "updated_at", setToServerValue: "REQUEST_TIME" },
      ],
      currentDocument: { exists: Boolean(existing) },
    },
  ]);
}

export async function markConfirmed(subscriber: Subscriber): Promise<void> {
  await commit([
    {
      update: {
        name: docName(subscriberPath(subscriber.id)),
        fields: {
          email: { stringValue: subscriber.email },
          locale: { stringValue: subscriber.locale },
          status: { stringValue: "confirmed" },
          created_at: { timestampValue: subscriber.created_at },
        },
      },
      updateTransforms: [{ fieldPath: "updated_at", setToServerValue: "REQUEST_TIME" }],
      currentDocument: { exists: true },
    },
  ]);
}

/** Unsubscribing removes the address altogether. */
export async function deleteSubscribers(ids: string[], idToken?: string | null): Promise<void> {
  for (let i = 0; i < ids.length; i += 400) {
    await commit(ids.slice(i, i + 400).map((id) => ({ delete: docName(subscriberPath(id)) })), idToken);
  }
}

/** Every subscriber document, as the studio account (only it may list the collection). */
export async function listSubscribers(idToken: string): Promise<Subscriber[]> {
  const all: Subscriber[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({ pageSize: "300" });
    if (pageToken) params.set("pageToken", pageToken);
    const response = await fetch(`${BASE()}/${SUBSCRIBERS_COLLECTION}?${params}`, { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" });
    if (!response.ok) throw new Error(`Firestore ${response.status} (liste des abonnés)`);
    const json = (await response.json()) as { documents?: { name: string; fields?: Fields }[]; nextPageToken?: string };
    for (const d of json.documents ?? []) {
      const subscriber = toSubscriber(d.name.split("/").pop() ?? "", d.fields ?? {});
      if (subscriber) all.push(subscriber);
    }
    pageToken = json.nextPageToken ?? "";
  } while (pageToken);
  return all;
}

/**
 * Sorts the documents: those whose id matches their address (made by this
 * server), and the rest to purge (forged through Firestore, or pending past
 * the life of their confirmation link).
 */
export function sortSubscribers(list: Subscriber[]): { confirmed: Subscriber[]; pending: Subscriber[]; purge: string[] } {
  const confirmed: Subscriber[] = [];
  const pending: Subscriber[] = [];
  const purge: string[] = [];
  const now = Date.now();
  for (const s of list) {
    if (s.id !== subscriberId(s.email)) purge.push(s.id);
    else if (s.status === "confirmed") confirmed.push(s);
    else if (now - Date.parse(s.updated_at || s.created_at) > CONFIRM_TTL_MS) purge.push(s.id);
    else pending.push(s);
  }
  return { confirmed, pending, purge };
}

export type Announcement = { slug: string; sent_at: string; count: number };

export async function listAnnouncements(idToken: string): Promise<Announcement[]> {
  const response = await fetch(`${BASE()}/${ANNOUNCEMENTS_COLLECTION}?pageSize=300`, { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Firestore ${response.status} (annonces)`);
  const json = (await response.json()) as { documents?: { name: string; fields?: Fields }[] };
  return (json.documents ?? []).map((d) => ({
    slug: decodeURIComponent(d.name.split("/").pop() ?? ""),
    sent_at: d.fields?.sent_at_iso?.stringValue ?? "",
    count: Number(d.fields?.count?.integerValue ?? 0),
  }));
}

export async function saveAnnouncement(entry: Announcement, idToken: string): Promise<void> {
  await commit(
    [
      {
        update: {
          name: docName(`${ANNOUNCEMENTS_COLLECTION}/${encodeURIComponent(entry.slug)}`),
          fields: { sent_at_iso: { stringValue: entry.sent_at }, count: { integerValue: String(entry.count) } },
        },
      },
    ],
    idToken,
  );
}

// ---- Sending ----

/** WEBTOON_MAIL_DRY_RUN=1 logs every email instead of sending it (tests, local work). */
export const mailDryRun = () => process.env.WEBTOON_MAIL_DRY_RUN === "1";

/** The form and the studio entry only work when an email can actually leave (or in dry run). */
export const mailConfigured = () => mailDryRun() || Boolean(process.env.RESEND_API_KEY && process.env.WEBTOON_MAIL_FROM);

export type OutgoingMail = MailContent & { to: string; headers?: Record<string, string> };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function resendPayload(mail: OutgoingMail) {
  return {
    from: process.env.WEBTOON_MAIL_FROM,
    to: [mail.to],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    ...(process.env.WEBTOON_MAIL_REPLY_TO ? { reply_to: process.env.WEBTOON_MAIL_REPLY_TO } : {}),
    ...(mail.headers ? { headers: mail.headers } : {}),
  };
}

async function resendCall(path: string, body: unknown): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://api.resend.com${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (response.ok) return;
    // Rate limited: wait and retry; anything else is final.
    if (response.status === 429 && attempt < 2) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
}

/** Sends by batches of 100 (Resend's batch limit), slowly enough for its rate limit. */
export async function sendMails(mails: OutgoingMail[]): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (mailDryRun()) {
    for (const mail of mails) console.info(`[webtoon alerts] DRY RUN, not sent\nTo: ${mail.to}\nSubject: ${mail.subject}\n${mail.headers ? `Headers: ${JSON.stringify(mail.headers)}\n` : ""}\n${mail.text}\n`);
    return { sent: mails.length, failed: 0, errors: [] };
  }
  if (!mailConfigured()) throw new Error("envoi non configuré (RESEND_API_KEY, WEBTOON_MAIL_FROM)");
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  for (let i = 0; i < mails.length; i += 100) {
    const batch = mails.slice(i, i + 100);
    try {
      if (batch.length === 1) await resendCall("/emails", resendPayload(batch[0]));
      else await resendCall("/emails/batch", batch.map(resendPayload));
      sent += batch.length;
    } catch (error) {
      failed += batch.length;
      errors.push(error instanceof Error ? error.message : String(error));
    }
    if (i + 100 < mails.length) await sleep(600);
  }
  return { sent, failed, errors };
}

// ---- A light brake on the public form (per server instance) ----

const hits = new Map<string, number[]>();

/** At most `limit` subscriptions per address per window, per instance. */
export function rateLimited(key: string, limit = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit;
}
