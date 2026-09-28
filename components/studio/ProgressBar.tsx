"use client";

import { useEffect, useState } from "react";

type ProgressBarProps = {
  /** When the work started (Date.now()), and how long it usually takes. */
  startedAt: number;
  estimateMs: number;
  label?: string;
  /** Several items of one job: shown as "3 / 12" and folded into the bar. */
  done?: number;
  total?: number;
  /** Small variant, for a thumbnail or a notification. */
  compact?: boolean;
  className?: string;
};

/**
 * A progress bar for work whose end is only known when it comes (an image,
 * a sheet, a batch of panels): it fills along the usual duration, reaches
 * 85 % at the estimate, then creeps towards the end without ever claiming
 * to be done. It shows the time left, or that the work runs a little long.
 */
export function progressAt(elapsed: number, estimate: number): number {
  const e = Math.max(1, estimate);
  if (elapsed <= e) return 0.85 * (elapsed / e);
  return 0.85 + 0.13 * (1 - Math.exp(-(elapsed - e) / (e * 0.6)));
}

export function formatLeft(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${String(s % 60).padStart(2, "0")}`;
}

export function ProgressBar({ startedAt, estimateMs, label, done, total, compact = false, className = "" }: ProgressBarProps) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 400);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);
  const elapsed = Math.max(0, now - startedAt);
  const items = total && total > 1 ? { done: Math.min(done ?? 0, total), total } : null;
  // A job of several items: the finished ones count in full, the running one along its estimate.
  const fraction = items ? Math.min(0.99, (items.done + progressAt(elapsed - (items.done * estimateMs) / items.total, estimateMs / items.total)) / items.total) : progressAt(elapsed, estimateMs);
  const left = estimateMs - elapsed;
  const pct = Math.round(Math.min(0.99, Math.max(0.02, fraction)) * 100);
  return (
    <div className={`studio-progress ${compact ? "is-compact" : ""} ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className="studio-progress-track">
        <div className="studio-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="studio-progress-meta">
        {label ? <span className="studio-progress-label">{label}</span> : null}
        {items ? <span>{items.done} / {items.total}</span> : null}
        <span className="studio-progress-time">{left > 1500 ? `≈ ${formatLeft(left)}` : "presque fini…"}</span>
      </div>
    </div>
  );
}
