"use client";

import { useEffect, useRef, useState } from "react";
import type { StudioNotification } from "@/lib/webtoon/notifications";

type StudioNotificationsProps = {
  items: StudioNotification[];
  onOpenPanel: (panelId: string) => void;
  onMarkRead: () => void;
  onClear: () => void;
};

function ago(from: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - from) / 1000));
  if (seconds < 60) return `il y a ${seconds} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return new Date(from).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function duration(entry: StudioNotification, now: number): string {
  const seconds = Math.max(0, Math.round(((entry.ended_at ?? now) - entry.started_at) / 1000));
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * The bell at the top right of the studio and its panel: the running tasks
 * first with their spinner, then everything that ended, newest first. A
 * click on an entry about a panel opens that panel in the editor.
 */
export function StudioNotifications({ items, onOpenPanel, onMarkRead, onClear }: StudioNotificationsProps) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const host = useRef<HTMLDivElement>(null);
  const running = items.filter((entry) => entry.status === "running");
  const unread = items.filter((entry) => !entry.read && entry.status !== "running").length;

  useEffect(() => {
    if (!open && !running.length) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open, running.length]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (host.current && !host.current.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  // Opening the panel reads what it shows.
  useEffect(() => {
    if (open && unread) onMarkRead();
  }, [open, unread, onMarkRead]);

  const ordered = [...running, ...items.filter((entry) => entry.status !== "running")];

  return (
    <div className="studio-notif" ref={host}>
      <button
        type="button"
        className={`webtoon-mini studio-gear-button studio-notif-bell ${open ? "is-active" : ""}`}
        onClick={() => {
          setNow(Date.now());
          setOpen((value) => !value);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={running.length ? `${running.length} modification${running.length > 1 ? "s" : ""} en cours` : "Notifications"}
      >
        {running.length ? (
          <span className="studio-spinner" aria-hidden />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        )}
        {running.length ? <b className="studio-notif-count is-running">{running.length}</b> : unread ? <b className="studio-notif-count">{unread > 99 ? "99+" : unread}</b> : null}
        <span className="sr-only">Notifications</span>
      </button>
      {open ? (
        <div className="studio-notif-panel" role="dialog" aria-label="Notifications">
          <div className="studio-notif-head">
            <p className="studio-gear-title">Notifications{running.length ? ` · ${running.length} en cours` : ""}</p>
            {items.length > running.length ? (
              <button type="button" className="studio-notif-clear" onClick={onClear}>
                Tout effacer
              </button>
            ) : null}
          </div>
          {ordered.length ? (
            <ul className="studio-notif-list">
              {ordered.map((entry) => {
                const clickable = Boolean(entry.panel_id);
                const body = (
                  <>
                    <span className={`studio-notif-state is-${entry.status}`} aria-hidden>
                      {entry.status === "running" ? <span className="studio-spinner" /> : entry.status === "done" ? "✓" : entry.status === "error" ? "!" : "i"}
                    </span>
                    <span className="studio-notif-text">
                      <b>{entry.title}</b>
                      {entry.detail ? <span>{entry.detail}</span> : null}
                      <small>
                        {entry.status === "running" ? `en cours depuis ${duration(entry, now)}` : `${ago(entry.ended_at ?? entry.started_at, now)}${entry.ended_at && entry.status !== "info" ? ` · ${duration(entry, now)}` : ""}`}
                      </small>
                    </span>
                    {entry.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="studio-notif-thumb" src={entry.thumb} alt="" loading="lazy" />
                    ) : null}
                  </>
                );
                return (
                  <li key={entry.id} className={`studio-notif-item is-${entry.status} ${entry.read ? "" : "is-unread"}`}>
                    {clickable ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenPanel(entry.panel_id!);
                          setOpen(false);
                        }}
                        title="Ouvrir la case"
                      >
                        {body}
                      </button>
                    ) : (
                      <div>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="studio-notif-empty">Rien pour l&apos;instant. Chaque modification lancée apparaît ici, en cours puis terminée.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
