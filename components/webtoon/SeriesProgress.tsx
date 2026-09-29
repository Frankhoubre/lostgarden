"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readProgress } from "@/components/webtoon/ReadingProgress";
import type { Locale } from "@/lib/i18n/config";
import { localePath } from "@/lib/i18n/navigation";

const WORDS: Record<Locale, { resume: string; read: string; done: string }> = {
  fr: { resume: "Reprendre", read: "lu à", done: "Lu" },
  en: { resume: "Resume", read: "read", done: "Read" },
  ja: { resume: "続きから", read: "既読", done: "読了" },
  ko: { resume: "이어 읽기", read: "읽음", done: "완독" },
};

/** On an episode card: how far this browser read it. */
export function EpisodeProgress({ slug, locale }: { slug: string; locale: Locale }) {
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => {
    const p = readProgress(slug);
    const timer = window.setTimeout(() => setRatio(p && p.total ? Math.min(1, (p.index + 1) / p.total) : null), 0);
    return () => window.clearTimeout(timer);
  }, [slug]);
  if (ratio === null) return null;
  const w = WORDS[locale] ?? WORDS.en;
  return (
    <span className="webtoon-card-progress">
      <i style={{ width: `${Math.round(ratio * 100)}%` }} />
      <small>{ratio > 0.97 ? w.done : `${w.read} ${Math.round(ratio * 100)} %`}</small>
    </span>
  );
}

/** At the top of the series: back to the episode last read, where it stopped. */
export function SeriesResume({ episodes, locale }: { episodes: { slug: string; title: string }[]; locale: Locale }) {
  const [last, setLast] = useState<{ slug: string; title: string; index: number } | null>(null);
  useEffect(() => {
    let best: { slug: string; title: string; index: number; at: string } | null = null;
    for (const e of episodes) {
      try {
        const raw = window.localStorage.getItem(`webtoon-progress:${e.slug}`);
        const p = raw ? (JSON.parse(raw) as { index: number; total: number; at?: string }) : null;
        if (p && p.index > 3 && p.index < p.total - 2 && (!best || String(p.at ?? "") > best.at)) best = { slug: e.slug, title: e.title, index: p.index, at: String(p.at ?? "") };
      } catch {
        // Nothing kept in a private window.
      }
    }
    const timer = window.setTimeout(() => setLast(best), 0);
    return () => window.clearTimeout(timer);
  }, [episodes]);
  if (!last) return null;
  const w = WORDS[locale] ?? WORDS.en;
  return (
    <Link href={localePath(locale, `/webtoon/${last.slug}`)} className="webtoon-series-resume">
      {w.resume} · {last.title}
    </Link>
  );
}
