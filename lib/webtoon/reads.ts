/**
 * Anonymous reading statistics of the public reader. Each reading session of
 * an episode (one tab, one episode) is one document in
 * `webtoon_reads/<slug>/sessions/<sessionId>`: how far down the strip it got,
 * nothing about who read it (no cookie, no IP, no user agent). The public may
 * only create and move forward its own documents; the studio reads them (see
 * firestore.rules, which repeat the allowed keys).
 */
export const READS_COLLECTION = "webtoon_reads";
export const READS_SESSIONS = "sessions";

export type ReadDevice = "mobile" | "desktop";

/** A session as stored: timestamps are Firestore server times, read back as milliseconds. */
export type ReadSession = {
  id: string;
  locale: string;
  /** The furthest panel reached, 0-based in the published strip. */
  max_index: number;
  total: number;
  panel_id: string;
  device: ReadDevice;
  started_at: number;
  updated_at: number;
};

export type ReadDrop = {
  /** The last panel these readers saw, 0-based. */
  index: number;
  /** The panel_id most of them stopped on (the published strip may differ from the draft). */
  panel_id: string | null;
  /** Share of all sessions that stopped there, 0 to 1. */
  share: number;
  /** Share of the sessions that reached this panel and went no further. */
  of_reached: number;
};

export type ReadStats = {
  sessions: number;
  /** Panel count of the latest version read: the length of the curve. */
  total: number;
  median_index: number;
  /** Share of the sessions that reached the last panel of the strip they read. */
  finished: number;
  /** retention[i]: share of the sessions that reached panel i. */
  retention: number[];
  drops: ReadDrop[];
  mobile: number;
};

/** Sessions stopping before the end, grouped by the panel they stopped on, steepest first. */
export function computeReadStats(sessions: ReadSession[], dropCount = 5): ReadStats | null {
  if (!sessions.length) return null;
  const latest = sessions.reduce((a, b) => (b.updated_at > a.updated_at ? b : a));
  const total = Math.max(1, latest.total);
  const n = sessions.length;
  const reached = new Array<number>(total).fill(0);
  const stopped = new Map<number, Map<string, number>>();
  for (const s of sessions) {
    const top = Math.min(s.max_index, total - 1);
    reached[top] += 1;
    // Reaching the end of the strip they read is not a drop, even if it has grown since.
    if (s.max_index < s.total - 1 && top < total - 1) {
      const ids = stopped.get(top) ?? new Map<string, number>();
      ids.set(s.panel_id, (ids.get(s.panel_id) ?? 0) + 1);
      stopped.set(top, ids);
    }
  }
  // Cumulative from the end: a session that reached panel i also passed every panel before it.
  const retention = new Array<number>(total).fill(0);
  let running = 0;
  for (let i = total - 1; i >= 0; i -= 1) {
    running += reached[i];
    retention[i] = running / n;
  }
  const drops: ReadDrop[] = [...stopped.entries()]
    .map(([index, ids]) => {
      const count = [...ids.values()].reduce((a, b) => a + b, 0);
      const panel_id = [...ids.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return { index, panel_id, share: count / n, of_reached: retention[index] ? count / n / retention[index] : 0 };
    })
    .sort((a, b) => b.share - a.share || a.index - b.index)
    .slice(0, dropCount);
  const sorted = sessions.map((s) => s.max_index).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median_index = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return {
    sessions: n,
    total,
    median_index,
    finished: sessions.filter((s) => s.max_index >= s.total - 1).length / n,
    retention,
    drops,
    mobile: sessions.filter((s) => s.device === "mobile").length / n,
  };
}
