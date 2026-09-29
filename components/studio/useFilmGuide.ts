"use client";

import type { User } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { appendWindow, applyDetail, detailSpans, emptyGuide, GUIDE_WINDOW, type FilmGuide, type GuideBeat, type GuideSequence } from "@/lib/webtoon/film-guide";
import { loadDense } from "@/lib/webtoon/film-guide-client";
import { loadGuide, saveGuide } from "@/lib/webtoon/film-guide-client";
import type { TrackTask } from "@/lib/webtoon/notifications";
import { studioHeaders } from "@/lib/webtoon/studio-headers";

type WindowAnswer = { beats: GuideBeat[]; sequences: GuideSequence[]; continues: boolean; from: number; to: number; next: number; duration: number; done: boolean; error?: string };

/** About twenty seconds per window of twenty frames; three windows are read at once. */
const WINDOW_MS = 21_000;
const CONCURRENCY = 3;

export type GuideRun = { started: number; estimate: number; done: number; total: number } | null;

/**
 * The film guide of the open project: loaded with the project, read window
 * after window in the background (it goes on while the author works in
 * another tab), saved after each window so an interruption loses nothing,
 * and resumed from where it stopped.
 */
export function useFilmGuide(input: { slug: string; user: User | null; duration: number; notify: (message: string) => void; track?: TrackTask }) {
  const { slug, user, duration, notify, track } = input;
  const [guide, setGuide] = useState<FilmGuide | null>(null);
  const [run, setRun] = useState<GuideRun>(null);
  const stop = useRef(false);
  const guideRef = useRef<FilmGuide | null>(null);

  useEffect(() => {
    guideRef.current = guide;
  }, [guide]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadGuide(slug)
      .then((stored) => {
        if (!cancelled && stored) setGuide(stored);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug, user]);

  const start = useCallback(
    async (fromScratch = false) => {
      if (run || !duration) return;
      stop.current = false;
      let current = fromScratch || !guideRef.current ? emptyGuide(duration) : { ...guideRef.current, duration };
      const starts: number[] = [];
      for (let s = current.analyzed_until; s <= duration; s += GUIDE_WINDOW) starts.push(s);
      if (!starts.length) {
        notify("Le film est déjà entièrement lu");
        return;
      }
      const began = Date.now();
      const total = starts.length;
      setRun({ started: began, estimate: Math.ceil(total / CONCURRENCY) * WINDOW_MS, done: 0, total });
      const task = track?.(`Guide du film · lecture de ${total} fenêtre${total > 1 ? "s" : ""}`, undefined, Math.ceil(total / CONCURRENCY) * WINDOW_MS);
      const answers = new Map<number, WindowAnswer>();
      let next = 0;
      let applied = 0;
      let failures = 0;
      // Windows are read three at a time and added to the guide in film order, as soon as the ones before are in.
      const flush = async () => {
        let changed = false;
        while (applied < starts.length && answers.has(starts[applied])) {
          const answer = answers.get(starts[applied])!;
          if (!answer.error) current = appendWindow(current, answer, answer.to);
          applied += 1;
          changed = true;
        }
        if (!changed) return;
        setGuide(current);
        setRun((r) => (r ? { ...r, done: applied } : r));
        if (user) await saveGuide(slug, current, user).catch(() => undefined);
      };
      const worker = async () => {
        while (!stop.current && next < starts.length) {
          const from = starts[next];
          next += 1;
          const last = guideRef.current?.sequences[guideRef.current.sequences.length - 1];
          try {
            const response = await fetch(`/api/webtoon/${slug}/guide`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
              body: JSON.stringify({ from, previous: last && last.to >= from - 1 ? { sequence: last, beats: guideRef.current?.beats.slice(-3) } : undefined }),
            });
            const payload = (await response.json().catch(() => ({}))) as WindowAnswer;
            if (!response.ok || payload.error) throw new Error(payload.error ?? `erreur ${response.status}`);
            answers.set(from, payload);
          } catch (error) {
            failures += 1;
            answers.set(from, { beats: [], sequences: [], continues: false, from, to: from + GUIDE_WINDOW - 1, next: from + GUIDE_WINDOW, duration, done: false, error: error instanceof Error ? error.message : "erreur" });
          }
          await flush();
        }
      };
      try {
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, starts.length) }, worker));
        // A failed window leaves a hole: the guide stops before it, and the next run resumes there.
        const firstFailure = starts.find((s) => answers.get(s)?.error);
        if (firstFailure !== undefined) {
          current = { ...current, analyzed_until: Math.min(current.analyzed_until, firstFailure) };
          setGuide(current);
          if (user) await saveGuide(slug, current, user).catch(() => undefined);
        }
        const message = stop.current
          ? `arrêté à ${Math.round(current.analyzed_until)} s`
          : failures
            ? `${failures} fenêtre${failures > 1 ? "s" : ""} en échec, relancer pour reprendre`
            : `${current.sequences.length} séquences repérées`;
        if (!task) notify(`Guide du film : ${message}`);
        else if (failures && !stop.current) task.fail(message);
        else task.done(message);
      } finally {
        setRun(null);
      }
    },
    [run, duration, slug, user, notify, track],
  );

  /**
   * The close re-reading of the action and of the busy stretches: four frames per second when the dense
   * frames were extracted, one otherwise; the gestures go into the guide, stretch after stretch.
   */
  const refine = useCallback(
    async (cast: { name: string; looks: string }[] = []) => {
      if (run || !guideRef.current) return;
      stop.current = false;
      let current = guideRef.current;
      const spans = detailSpans(current);
      if (!spans.length) {
        notify("Aucun passage d'action à relire");
        return;
      }
      const dense = await loadDense(slug).catch(() => []);
      const began = Date.now();
      const estimate = Math.ceil(spans.length / 2) * 25_000;
      setRun({ started: began, estimate, done: 0, total: spans.length });
      const task = track?.(`Relecture fine · ${spans.length} passage${spans.length > 1 ? "s" : ""}`, undefined, estimate);
      let next = 0;
      let done = 0;
      let found = 0;
      const worker = async () => {
        while (!stop.current && next < spans.length) {
          const span = spans[next];
          next += 1;
          try {
            const before = current.beats.filter((b) => b.seconds >= span.from - 5 && b.seconds < span.from).map((b) => `${b.seconds} s: ${b.what}`);
            const frames = dense.filter((f) => f.seconds >= span.from && f.seconds < span.to + 1);
            const response = await fetch(`/api/webtoon/${slug}/guide`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
              body: JSON.stringify({ detail: { from: span.from, to: span.to, kind: span.kind, summary: span.summary, cast, before, frames } }),
            });
            const payload = (await response.json().catch(() => ({}))) as { gestures?: unknown[]; error?: string };
            if (!response.ok || payload.error) throw new Error(payload.error ?? `erreur ${response.status}`);
            current = applyDetail(current, { from: span.from, to: span.to }, { gestures: payload.gestures });
            found += (payload.gestures ?? []).length;
          } catch {
            // A stretch that failed stays to re-read.
          }
          done += 1;
          setGuide(current);
          setRun((r) => (r ? { ...r, done } : r));
          if (user) await saveGuide(slug, current, user).catch(() => undefined);
        }
      };
      try {
        await Promise.all([worker(), worker()]);
        const message = `${found} geste${found > 1 ? "s" : ""} repéré${found > 1 ? "s" : ""}${dense.length ? "" : " (sans images denses : une image par seconde)"}`;
        if (task) task.done(message);
        else notify(`Relecture fine : ${message}`);
      } finally {
        setRun(null);
      }
    },
    [run, slug, user, notify, track],
  );

  return { guide, setGuide, run, start, refine, stop: () => (stop.current = true) };
}
