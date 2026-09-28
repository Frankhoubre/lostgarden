/**
 * The studio's notification center: every change launched on the strip (an
 * image drawn, a retouch, a batch, a save) leaves an entry, running while it
 * works and done or failed when it ends, so a long session can be followed
 * from the bell at the top right. Entries stay in the browser (per strip)
 * across reloads; a task that was running when the page closed comes back
 * as interrupted.
 */
export type StudioNotificationStatus = "running" | "done" | "error" | "info";

export type StudioNotification = {
  id: string;
  title: string;
  detail?: string;
  status: StudioNotificationStatus;
  /** The panel the entry is about: a click on the entry selects it. */
  panel_id?: string;
  /** The resulting image, shown as a thumbnail. */
  thumb?: string;
  started_at: number;
  /** How long this kind of work usually takes: the running entry shows a progress bar. */
  estimate_ms?: number;
  ended_at?: number;
  read: boolean;
};

/** A task in progress, as the editor sees it: end it once, well or badly. */
export type StudioTask = {
  done: (detail?: string, thumb?: string) => void;
  fail: (detail: string) => void;
};

export type TrackTask = (title: string, panelId?: string, estimateMs?: number) => StudioTask;

export const NOTIFICATION_LIMIT = 80;

export function storageKey(slug: string): string {
  return `studio-notifications:${slug}`;
}

export function loadNotifications(slug: string): StudioNotification[] {
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    const list = raw ? (JSON.parse(raw) as StudioNotification[]) : [];
    if (!Array.isArray(list)) return [];
    return list.map((entry) => (entry.status === "running" ? { ...entry, status: "error", detail: "Interrompu : la page a été rechargée ou fermée pendant le travail.", ended_at: entry.started_at } : entry));
  } catch {
    return [];
  }
}

export function saveNotifications(slug: string, list: StudioNotification[]): void {
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(list.slice(0, NOTIFICATION_LIMIT)));
  } catch {
    // Private window or full storage: the center still works for this visit.
  }
}

/** An error message, as the studio words them. */
export function looksLikeError(message: string): boolean {
  return /erreur|impossible|Storage|Gateway|\b[45]\d{2}\b|refus|échec|non dessinée|non enregistr/i.test(message);
}
