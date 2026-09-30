import type { WebtoonPanel } from "./types";

/**
 * THE STORY BEHIND THE STRIP: the screenplay cut into its scenes and placed
 * on the film, the film read once for its spoken lines and who is on screen,
 * and what follows from both: the lines no bubble carries, the bubbles no
 * line explains, and where each character is in the film against where the
 * strip draws him. Stored next to the library: `<slug>~story` (the scenes)
 * and `<slug>~filmread` (the film read second by second).
 */

export type ScriptLine = { speaker: string; text: string };

export type ScriptScene = {
  index: number;
  /** The slugline ("INT. SANCTUAIRE SOUTERRAIN , CONTINU"), or "Page N" for a screenplay without them. */
  heading: string;
  page: number;
  text: string;
  /** Where the scene is in the film, in seconds; null when the film does not show it. */
  from: number | null;
  to: number | null;
  /** One French sentence: what happens. */
  summary: string;
  characters: string[];
  lines: ScriptLine[];
  /** The film tells it earlier than the scene before it in the screenplay: another order, or a misreading to check. */
  reordered?: boolean;
  /** Placed by the author: the next alignment keeps these seconds. */
  manual?: boolean;
};

/** `ignored`: lines the author leaves out of the strip on purpose (their text). */
export type StoryDoc = { scenes: ScriptScene[]; ignored?: string[]; updated_at: string };

/** One second of the film: the subtitle on screen and the characters seen. */
export type FilmReadFrame = { s: number; sub?: string; who: string[] };
export type FilmRead = { frames: FilmReadFrame[]; until: number; updated_at: string };

export const FILM_READ_WINDOW = 20;

/** The screenplay cut at its sluglines; by page when it has none. Pages are marked "[page N]" in the text. */
export function splitScreenplay(text: string): Omit<ScriptScene, "from" | "to" | "summary" | "characters" | "lines">[] {
  const scenes: Omit<ScriptScene, "from" | "to" | "summary" | "characters" | "lines">[] = [];
  let page = 1;
  let current: { heading: string; page: number; lines: string[] } | null = null;
  const heading = /^\s*(INT\.?|EXT\.?|INT\/EXT\.?|I\/E\.?)\s/i;
  for (const raw of text.split("\n")) {
    const pageMark = /^\[page (\d+)\]/.exec(raw.trim());
    if (pageMark) {
      page = Number(pageMark[1]);
      continue;
    }
    if (heading.test(raw)) {
      if (current) scenes.push({ index: scenes.length, heading: current.heading, page: current.page, text: current.lines.join("\n").trim() });
      current = { heading: raw.trim().replace(/\s+/g, " "), page, lines: [] };
      continue;
    }
    if (!current) current = { heading: `Page ${page}`, page, lines: [] };
    current.lines.push(raw);
  }
  if (current) scenes.push({ index: scenes.length, heading: current.heading, page: current.page, text: current.lines.join("\n").trim() });
  return scenes.filter((s) => s.text || !s.heading.startsWith("Page "));
}

// ---- Matching lines and bubbles ----

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9぀-ヿ一-鿿가-힯]+/g, " ")
    .trim();
}

function bigrams(text: string): Map<string, number> {
  const s = ` ${text} `;
  const out = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i += 1) {
    const g = s.slice(i, i + 2);
    out.set(g, (out.get(g) ?? 0) + 1);
  }
  return out;
}

/** Dice coefficient on character pairs: close to 1 for the same line reworded a little, low for another line. */
export function similarity(a: string, b: string): number {
  const x = normalize(a);
  const y = normalize(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  // A short line inside a longer bubble (two lines lettered together) counts as found.
  if (x.length >= 8 && y.includes(x)) return 0.95;
  const bx = bigrams(x);
  const by = bigrams(y);
  let common = 0;
  for (const [g, n] of bx) common += Math.min(n, by.get(g) ?? 0);
  const total = [...bx.values()].reduce((s, n) => s + n, 0) + [...by.values()].reduce((s, n) => s + n, 0);
  return (2 * common) / total;
}

export type SourceLine = { kind: "script" | "film"; speaker?: string; text: string; seconds: number | null; scene?: number };

/** The film, read over this scene's seconds, shows at least one subtitle (read up to there). */
export function sceneHasSubtitles(scene: Pick<ScriptScene, "from" | "to">, read: FilmRead | null): boolean {
  if (scene.from === null || !read) return false;
  const to = scene.to ?? scene.from;
  return read.frames.some((f) => f.sub && f.s >= scene.from! - 2 && f.s <= to + 2);
}

/**
 * Every line the episode speaks: the subtitles of the film (a subtitle held
 * on screen for several seconds is one line, at its first second) and the
 * lines of the screenplay for the scenes the film tells without subtitles.
 */
export function sourceLines(story: StoryDoc | null, read: FilmRead | null): SourceLine[] {
  const film: SourceLine[] = [];
  for (const frame of read?.frames ?? []) {
    const sub = frame.sub?.trim();
    if (!sub) continue;
    const last = film[film.length - 1];
    if (last && last.seconds !== null && frame.s - last.seconds <= 8 && similarity(last.text, sub) > 0.8) continue;
    film.push({ kind: "film", text: sub, seconds: frame.s });
  }
  // Where the film has subtitles, they are what is said: the film rewords the screenplay, sometimes in
  // another language (the tavern of episode 1 is written in English and spoken in French). The screenplay
  // speaks only for the scenes the film tells without subtitles, and never for a scene the film does not tell.
  const script: SourceLine[] = [];
  for (const scene of story?.scenes ?? []) {
    if (!sceneHasSubtitles(scene, read) && scene.from !== null) {
      for (const line of scene.lines) script.push({ kind: "script", speaker: line.speaker, text: line.text, seconds: scene.from, scene: scene.index });
    }
  }
  return [...film, ...script].sort((a, b) => (a.seconds ?? 1e9) - (b.seconds ?? 1e9));
}

type Bubble = { panel: WebtoonPanel; index: number; texts: string[] };

function bubbles(panels: readonly WebtoonPanel[]): Bubble[] {
  return panels.flatMap((panel) => panel.dialogue.map((d, index) => ({ panel, index, texts: [d.text.fr, d.text.en].filter((t): t is string => Boolean(t?.trim())) })));
}

const bestMatch = (line: string, bubble: Bubble) => Math.max(0, ...bubble.texts.map((t) => similarity(line, t)));

export type MissingLine = SourceLine & { panel: WebtoonPanel | null };

/** The panel of a second: the last one that starts at or before it, else the first after. */
export function panelAt(panels: readonly WebtoonPanel[], seconds: number | null): WebtoonPanel | null {
  if (seconds === null) return null;
  const timed = panels.filter((p) => p.source_time_start !== null);
  let best: WebtoonPanel | null = null;
  for (const p of timed) if ((p.source_time_start ?? 0) <= seconds) best = p;
  return best ?? timed[0] ?? null;
}

/**
 * The lines no bubble carries. A line is found in a bubble of the panels
 * around its second (a minute and a half either side: the strip does not follow the
 * film to the second), or anywhere when its second is unknown.
 */
export function missingLines(sources: SourceLine[], panels: readonly WebtoonPanel[]): MissingLine[] {
  const all = bubbles(panels);
  return sources
    .filter((line) => {
      const near = line.seconds === null ? all : all.filter((b) => b.panel.source_time_start === null || Math.abs((b.panel.source_time_start ?? 0) - (line.seconds ?? 0)) <= 90);
      return !near.some((b) => bestMatch(line.text, b) >= 0.55);
    })
    .map((line) => ({ ...line, panel: panelAt(panels, line.seconds) }));
}

export type UnsourcedBubble = { panel: WebtoonPanel; index: number; speaker: string; text: string };

/** Bubbles whose line is in neither the subtitles nor the screenplay: invented, or reworded beyond recognition. */
export function unsourcedBubbles(sources: SourceLine[], panels: readonly WebtoonPanel[]): UnsourcedBubble[] {
  if (!sources.length) return [];
  return bubbles(panels)
    .filter((b) => b.texts.length && !sources.some((line) => bestMatch(line.text, b) >= 0.45))
    .map((b) => ({ panel: b.panel, index: b.index, speaker: b.panel.dialogue[b.index].speaker, text: b.texts[0] }));
}

// ---- Who is where ----

export type Presence = {
  id: string;
  name: string;
  /** Spans of the film where the character is seen (seconds, merged when less than 3 s apart). */
  film: { from: number; to: number }[];
  panels: { panel: WebtoonPanel; seconds: number; odd: boolean }[];
};

/**
 * For each character: the spans of the film where he is seen, and the panels
 * that draw him, a panel marked `odd` when the film, read at that moment,
 * does not show him within three seconds (drawn where the film has nobody).
 */
export function presence(read: FilmRead | null, panels: readonly WebtoonPanel[], cast: { id: string; name: string }[]): Presence[] {
  const frames = read?.frames ?? [];
  const covered = (s: number) => read !== null && s <= read.until;
  return cast
    .map(({ id, name }) => {
      const seen = frames.filter((f) => f.who.includes(id)).map((f) => f.s);
      const film: { from: number; to: number }[] = [];
      for (const s of seen) {
        const last = film[film.length - 1];
        if (last && s - last.to <= 3) last.to = s;
        else film.push({ from: s, to: s });
      }
      const drawn = panels
        .filter((p) => p.characters.includes(id) && p.source_time_start !== null)
        .map((p) => {
          const s = p.source_time_start ?? 0;
          const odd = covered(s) && !seen.some((t) => Math.abs(t - s) <= 3);
          return { panel: p, seconds: s, odd };
        });
      return { id, name, film, panels: drawn };
    })
    .filter((p) => p.film.length || p.panels.length);
}

export const tc = (seconds: number | null) => (seconds === null ? "?" : `${Math.floor(seconds / 60)}:${String(Math.round(seconds) % 60).padStart(2, "0")}`);
