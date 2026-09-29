"use client";

import { useEffect, useRef } from "react";
import type { FirestoreError } from "firebase/firestore";
import type { Locale } from "@/lib/i18n/config";
import { useAuth } from "@/components/providers/AuthProvider";
import { PANEL_SELECTOR, READING_BAND } from "@/components/webtoon/ReadingProgress";
import { READS_COLLECTION, READS_SESSIONS, type ReadDevice } from "@/lib/webtoon/reads";
import { isStudioUser } from "@/lib/webtoon/studio";

/** At most one write every few seconds while reading; leaving the page writes at once. */
const WRITE_EVERY_MS = 5000;
/** The rules refuse longer strings. */
const clip = (value: string) => value.slice(0, 80);

type SessionState = { id: string; max: number; sent: number; created: boolean };

const sessionKey = (slug: string) => `webtoon-read:${slug}`;

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** The session of this tab on this episode: a reload keeps it, a new tab starts another. */
function loadSession(slug: string): SessionState {
  try {
    const raw = window.sessionStorage.getItem(sessionKey(slug));
    if (raw) {
      const saved = JSON.parse(raw) as Partial<SessionState>;
      if (typeof saved.id === "string" && typeof saved.max === "number") {
        return { id: saved.id, max: saved.max, sent: saved.sent ?? -1, created: Boolean(saved.created) };
      }
    }
  } catch {
    // No session storage (private window, blocked storage): a session per page load.
  }
  return { id: newId(), max: -1, sent: -1, created: false };
}

function keepSession(slug: string, state: SessionState) {
  try {
    window.sessionStorage.setItem(sessionKey(slug), JSON.stringify(state));
  } catch {
    // Nothing kept: the next load starts a new session.
  }
}

/**
 * Anonymous reading statistics: how far down the strip this reading session
 * got, for the studio's "Lecture" tab. Nothing personal is recorded (see
 * lib/webtoon/reads.ts). The dev server, `?dev=1`, automated browsers and
 * the studio's own account are left out, so the numbers are readers only.
 */
export function ReadingStats({ slug, locale }: { slug: string; locale: Locale }) {
  const { user, loading } = useAuth();
  // Read by the writer at write time: the account is known a moment after the page.
  const skip = useRef<"wait" | "yes" | "no">("wait");
  useEffect(() => {
    skip.current = loading ? "wait" : isStudioUser(user?.email) ? "yes" : "no";
  }, [user, loading]);

  useEffect(() => {
    // The dev server writes to the same Firestore as the site: its visits are not readers.
    if (process.env.NODE_ENV !== "production") return;
    if (new URLSearchParams(window.location.search).has("dev") || navigator.webdriver) return;
    const panels = [...document.querySelectorAll<HTMLElement>(PANEL_SELECTOR)];
    const total = Math.min(panels.length, 5000);
    if (!total) return;
    const device: ReadDevice = window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
    const state = loadSession(slug);
    let lastWrite = 0;
    let timer = 0;
    let writing = false;
    let again = false;

    const write = async () => {
      window.clearTimeout(timer);
      timer = 0;
      if (skip.current === "yes" || state.max < 0 || state.max <= state.sent) return;
      if (skip.current === "wait") {
        timer = window.setTimeout(() => void write(), 1000);
        return;
      }
      if (writing) {
        again = true;
        return;
      }
      writing = true;
      lastWrite = Date.now();
      const index = Math.min(state.max, total - 1);
      try {
        const [{ doc, serverTimestamp, setDoc, updateDoc }, { getDb }] = await Promise.all([import("firebase/firestore"), import("@/lib/firebase")]);
        const ref = doc(getDb(), READS_COLLECTION, slug, READS_SESSIONS, state.id);
        const progress = { max_index: index, total, panel_id: clip(panels[index]?.dataset.panelId ?? ""), updated_at: serverTimestamp() };
        const create = () => setDoc(ref, { slug, locale: clip(locale), device, started_at: serverTimestamp(), ...progress });
        const code = (error: unknown) => (error as FirestoreError | undefined)?.code;
        if (state.created) {
          // Deleted by the studio in the meantime: the session starts again.
          await updateDoc(ref, progress).catch((error: unknown) => (code(error) === "not-found" ? create() : Promise.reject(error)));
        } else {
          // Already created by an earlier load of this tab whose note was lost: move it forward instead.
          await create().catch((error: unknown) => (code(error) === "permission-denied" ? updateDoc(ref, progress) : Promise.reject(error)));
        }
        state.created = true;
        state.sent = index;
        keepSession(slug, state);
      } catch {
        // Statistics are best-effort: a failed write never bothers the reader.
      } finally {
        writing = false;
        if (again) {
          again = false;
          schedule();
        }
      }
    };

    const schedule = () => {
      if (timer) return;
      timer = window.setTimeout(() => void write(), Math.max(0, lastWrite + WRITE_EVERY_MS - Date.now()));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        let moved = false;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = panels.indexOf(entry.target as HTMLElement);
          if (index > state.max) {
            state.max = index;
            moved = true;
          }
        }
        if (moved) {
          keepSession(slug, state);
          schedule();
        }
      },
      { rootMargin: READING_BAND },
    );
    panels.forEach((p) => observer.observe(p));

    const leave = () => void write();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") leave();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", leave);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", leave);
      // Leaving for another page of the site: what was read so far is written.
      void write();
    };
  }, [slug, locale]);

  return null;
}
