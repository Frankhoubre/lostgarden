"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";

const WORDS: Record<Locale, { resume: string; from: string; close: string }> = {
  fr: { resume: "Reprendre la lecture", from: "case", close: "Fermer" },
  en: { resume: "Resume reading", from: "panel", close: "Close" },
  ja: { resume: "続きから読む", from: "コマ", close: "閉じる" },
  ko: { resume: "이어 읽기", from: "컷", close: "닫기" },
};

export const progressKey = (slug: string) => `webtoon-progress:${slug}`;

/** The panels of the strip on the page, in reading order. */
export const PANEL_SELECTOR = ".webtoon-strip .webtoon-panel";
/** A panel counts as read when it crosses this thin band a little above the middle of the screen. */
export const READING_BAND = "-40% 0px -55% 0px";

/** The furthest panel read of an episode, kept in this browser. */
export function readProgress(slug: string): { index: number; total: number } | null {
  try {
    const raw = window.localStorage.getItem(progressKey(slug));
    return raw ? (JSON.parse(raw) as { index: number; total: number }) : null;
  } catch {
    return null;
  }
}

/**
 * Where the reader stopped: the panel at the top of the screen is remembered
 * as the reading goes on; coming back, a button takes the reader to it.
 */
export function ReadingProgress({ slug, locale }: { slug: string; locale: Locale }) {
  const [resume, setResume] = useState<number | null>(null);
  const words = WORDS[locale] ?? WORDS.en;

  useEffect(() => {
    const saved = readProgress(slug);
    const panels = [...document.querySelectorAll<HTMLElement>(PANEL_SELECTOR)];
    const total = panels.length;
    let shown = false;
    const first = window.setTimeout(() => {
      if (saved && saved.index > 3 && saved.index < total - 2) setResume(saved.index);
      shown = true;
    }, 0);
    let furthest = saved?.index ?? 0;
    let pending = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = panels.indexOf(entry.target as HTMLElement);
          if (index > furthest) furthest = index;
        }
        window.clearTimeout(pending);
        pending = window.setTimeout(() => {
          try {
            window.localStorage.setItem(progressKey(slug), JSON.stringify({ index: furthest, total, at: new Date().toISOString() }));
          } catch {
            // Private window: nothing kept.
          }
        }, 500);
        if (shown && furthest > 3) setResume(null);
      },
      { rootMargin: READING_BAND },
    );
    panels.forEach((p) => observer.observe(p));
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(pending);
      observer.disconnect();
    };
  }, [slug]);

  if (resume === null) return null;
  return (
    <div className="webtoon-resume" role="status">
      <button
        type="button"
        onClick={() => {
          document.querySelectorAll<HTMLElement>(PANEL_SELECTOR)[resume]?.scrollIntoView({ block: "start" });
          setResume(null);
        }}
      >
        {words.resume} · {words.from} {resume + 1}
      </button>
      <button type="button" className="webtoon-resume-close" onClick={() => setResume(null)} aria-label={words.close}>
        ×
      </button>
    </div>
  );
}
