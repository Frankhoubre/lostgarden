/**
 * THE FILM GUIDE: the whole film read once, as a guide for the adaptation.
 *
 * The frames (one per second) are read by windows of twenty, each window
 * with the end of the previous one in mind. For every second the guide says
 * what is seen and what changed since the second before; over the seconds it
 * cuts the film into sequences of one kind (action, tension, dialogue, calm,
 * contemplation, transition, flashback, title) with an intensity. The studio
 * shows it in the film tab (a coloured timeline, the sequences, a line under
 * every frame), and the writer reads it: in "auto" pace the kind of the
 * sequence sets how many panels a second of film gets (an action sequence
 * gets many dynamic panels, a contemplation few and large), a batch never
 * straddles two sequences, and the sequence and its frame-by-frame lines go
 * into the writer's prompt.
 *
 * Stored per project in `webtoon_library/<slug>~guide` (`guide_json`).
 */

export const GUIDE_WINDOW = 20;

export const SEQUENCE_KINDS = ["action", "tension", "dialogue", "calm", "contemplation", "transition", "flashback", "title"] as const;
export type SequenceKind = (typeof SEQUENCE_KINDS)[number];

export type GuideBeat = {
  seconds: number;
  /** What the frame shows, in one short sentence. */
  what: string;
  /** What changed since the second before ("rien" when nothing did). */
  change: string;
};

export type GuideSequence = {
  from: number;
  to: number;
  kind: SequenceKind;
  /** 1 (still) to 5 (the strongest moment of the film). */
  intensity: number;
  title: string;
  summary: string;
  place?: string;
  characters?: string[];
};

/** A gesture seen in the close re-reading of an action sequence: each one must get its own panel. */
export type GuideGesture = {
  seconds: number;
  /** What is done, in one short sentence ("il lance le médaillon au loin"). */
  gesture: string;
  kind: "throw" | "blow" | "fall" | "take" | "drop" | "open" | "appear" | "leave" | "move" | "other";
};

export type FilmGuide = {
  version: 1;
  /** The gestures of the action and tension sequences, read closely a second time. */
  gestures?: GuideGesture[];
  /** The starts of the sequences already re-read closely. */
  detailed?: number[];
  /** Seconds read so far (the next window starts here). */
  analyzed_until: number;
  duration: number;
  beats: GuideBeat[];
  sequences: GuideSequence[];
  updated_at: string;
};

export const SEQUENCE_LABEL: Record<SequenceKind, string> = {
  action: "Action",
  tension: "Tension",
  dialogue: "Dialogue",
  calm: "Calme",
  contemplation: "Contemplation",
  transition: "Transition",
  flashback: "Souvenir",
  title: "Titre",
};

export const SEQUENCE_COLOR: Record<SequenceKind, string> = {
  action: "#ff6b6b",
  tension: "#ffa94d",
  dialogue: "#5eb4ff",
  calm: "#63e6be",
  contemplation: "#b197fc",
  transition: "#868e96",
  flashback: "#ced4da",
  title: "#ffd43b",
};

/** The pace the writer takes in a sequence of this kind. */
export function paceOfKind(kind: SequenceKind, intensity = 3): "action" | "normal" | "calm" {
  if (kind === "action") return "action";
  if (kind === "tension") return intensity >= 4 ? "action" : "normal";
  if (kind === "calm" || kind === "contemplation" || kind === "transition" || kind === "title") return "calm";
  return "normal";
}

export function emptyGuide(duration: number): FilmGuide {
  return { version: 1, analyzed_until: 0, duration, beats: [], sequences: [], updated_at: new Date().toISOString() };
}

function isKind(value: unknown): value is SequenceKind {
  return typeof value === "string" && (SEQUENCE_KINDS as readonly string[]).includes(value);
}

/** What the model answered for a window, cleaned: numbers inside the window, known kinds, ordered. */
export function cleanWindow(raw: { beats?: unknown[]; sequences?: unknown[]; continues_previous?: unknown }, from: number, to: number): { beats: GuideBeat[]; sequences: GuideSequence[]; continues: boolean } {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const beats = (raw.beats ?? [])
    .map((b) => b as Record<string, unknown>)
    .map((b) => ({ seconds: Math.round(Number(b.seconds)), what: text(b.what), change: text(b.change) || "rien" }))
    .filter((b) => Number.isFinite(b.seconds) && b.seconds >= from && b.seconds <= to && b.what)
    .sort((a, b) => a.seconds - b.seconds);
  const sequences = (raw.sequences ?? [])
    .map((s) => s as Record<string, unknown>)
    .map((s) => ({
      from: Math.max(from, Math.round(Number(s.from))),
      to: Math.min(to, Math.round(Number(s.to))),
      kind: isKind(s.kind) ? s.kind : "calm",
      intensity: Math.min(5, Math.max(1, Math.round(Number(s.intensity) || 2))),
      title: text(s.title) || "Séquence",
      summary: text(s.summary),
      place: text(s.place) || undefined,
      characters: Array.isArray(s.characters) ? s.characters.map(text).filter(Boolean).slice(0, 8) : undefined,
    }))
    .filter((s) => Number.isFinite(s.from) && Number.isFinite(s.to) && s.to >= s.from)
    .sort((a, b) => a.from - b.from);
  // No hole and no overlap inside the window: each sequence starts where the one before ends.
  const tiled: GuideSequence[] = [];
  for (const sequence of sequences) {
    const previous = tiled[tiled.length - 1];
    const start = previous ? previous.to + 1 : from;
    if (sequence.to < start) continue;
    tiled.push({ ...sequence, from: start });
  }
  if (tiled.length) tiled[tiled.length - 1].to = to;
  else tiled.push({ from, to, kind: "calm", intensity: 2, title: "Séquence", summary: "" });
  return { beats, sequences: tiled, continues: raw.continues_previous === true };
}

/**
 * Sequences at the scale of a scene. Two neighbours of the same kind are one
 * sequence (windows are read apart, a scene often spans two of them); a
 * quiet piece of three seconds or less (a fade to black, a breath between
 * two shots) joins the sequence before it. A short action, tension,
 * dialogue, memory or title keeps its own place: a fall of two seconds is
 * exactly what must get its panels.
 */
export function consolidate(sequences: GuideSequence[]): GuideSequence[] {
  const quiet = (s: GuideSequence) => (s.kind === "transition" || s.kind === "calm" || s.kind === "contemplation") && s.intensity <= 2;
  const merge = (a: GuideSequence, b: GuideSequence): GuideSequence => ({
    ...a,
    to: Math.max(a.to, b.to),
    intensity: Math.max(a.intensity, b.intensity),
    summary: b.summary && !a.summary.includes(b.summary) ? `${a.summary} ${b.summary}`.trim().slice(0, 700) : a.summary,
    characters: [...new Set([...(a.characters ?? []), ...(b.characters ?? [])])],
  });
  const out: GuideSequence[] = [];
  for (const sequence of sequences) {
    const last = out[out.length - 1];
    if (last && (last.kind === sequence.kind || (quiet(sequence) && sequence.to - sequence.from < 3))) out[out.length - 1] = merge(last, sequence);
    else out.push({ ...sequence });
  }
  // A quiet piece at the very start takes the kind of what follows it.
  if (out.length > 1 && quiet(out[0]) && out[0].to - out[0].from < 3) out.splice(0, 2, { ...out[1], from: out[0].from });
  return out;
}

/** The guide with one more window: its beats added, its first sequence merged into the last one when it continues it. */
export function appendWindow(guide: FilmGuide, window: { beats: GuideBeat[]; sequences: GuideSequence[]; continues: boolean }, to: number): FilmGuide {
  const beats = [...guide.beats.filter((b) => !window.beats.some((w) => w.seconds === b.seconds)), ...window.beats].sort((a, b) => a.seconds - b.seconds);
  const sequences = [...guide.sequences];
  const [first, ...rest] = window.sequences;
  const last = sequences[sequences.length - 1];
  if (first && last && window.continues && last.kind === first.kind) {
    sequences[sequences.length - 1] = {
      ...last,
      to: first.to,
      intensity: Math.max(last.intensity, first.intensity),
      summary: first.summary && first.summary !== last.summary ? `${last.summary} ${first.summary}`.slice(0, 600) : last.summary,
      characters: [...new Set([...(last.characters ?? []), ...(first.characters ?? [])])],
    };
  } else if (first) sequences.push(first);
  sequences.push(...rest);
  return { ...guide, beats, sequences: consolidate(sequences), analyzed_until: Math.max(guide.analyzed_until, to + 1), updated_at: new Date().toISOString() };
}

/** The sequence a second belongs to (the next one when the second falls before the first). */
export function sequenceAt(guide: Pick<FilmGuide, "sequences"> | null | undefined, seconds: number): GuideSequence | undefined {
  if (!guide?.sequences.length) return undefined;
  return guide.sequences.find((s) => seconds >= s.from && seconds <= s.to) ?? guide.sequences.find((s) => s.from > seconds);
}

/** What the writer needs of the guide around a stretch of film: the sequences that touch it and its lines. */
export function guideSlice(guide: FilmGuide | null | undefined, from: number, to: number): (Pick<FilmGuide, "sequences" | "beats"> & { gestures?: GuideGesture[] }) | undefined {
  if (!guide?.sequences.length) return undefined;
  return {
    sequences: guide.sequences.filter((s) => s.to >= from && s.from <= to),
    beats: guide.beats.filter((b) => b.seconds >= from && b.seconds <= to),
    gestures: (guide.gestures ?? []).filter((g) => g.seconds >= from && g.seconds <= to),
  };
}

/** The guide as the writer reads it, for the seconds of its window. */
export function guideBrief(slice: (Pick<FilmGuide, "sequences" | "beats"> & { gestures?: GuideGesture[] }) | undefined, from: number, to: number): string {
  if (!slice?.sequences.length) return "";
  const tc = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, "0")}`;
  const sequences = slice.sequences
    .filter((s) => s.to >= from && s.from <= to)
    .map((s) => `${tc(s.from)} to ${tc(s.to)}: ${s.kind.toUpperCase()} sequence, intensity ${s.intensity}/5, "${s.title}": ${s.summary}`);
  const beats = slice.beats.filter((b) => b.seconds >= from && b.seconds <= to).map((b) => `${tc(b.seconds)} ${b.what}${b.change && b.change !== "rien" ? ` (changed: ${b.change})` : ""}`);
  const gestures = (slice.gestures ?? []).filter((g) => g.seconds >= from && g.seconds <= to).map((g) => `${tc(g.seconds)} ${g.gesture}`);
  return [
    `Sequences:\n${sequences.join("\n")}`,
    gestures.length ? `GESTURES noted in a close re-reading of the action (read by a model, they can be misread: check each against the frames; a gesture the frames confirm gets its own panel):\n${gestures.join("\n")}` : "",
    beats.length ? `Second by second:\n${beats.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}


/** The sequences that deserve the close re-reading: action, and tension of some intensity, not re-read yet. */
export function sequencesToDetail(guide: FilmGuide): GuideSequence[] {
  const done = new Set(guide.detailed ?? []);
  return guide.sequences.filter((s) => !done.has(s.from) && (s.kind === "action" || (s.kind === "tension" && s.intensity >= 3) || (s.to - s.from <= 12 && s.intensity >= 4)));
}

const GESTURE_KINDS = ["throw", "blow", "fall", "take", "drop", "open", "appear", "leave", "move", "other"] as const;

/** The kind of a gesture, English or the French a model sometimes answers with. */
function gestureKind(value: unknown): GuideGesture["kind"] {
  const v = String(value ?? "").toLowerCase();
  if ((GESTURE_KINDS as readonly string[]).includes(v)) return v as GuideGesture["kind"];
  if (/jet|lanc/.test(v)) return "throw";
  if (/coup|frapp/.test(v)) return "blow";
  if (/chut|tomb|effondr/.test(v)) return "fall";
  if (/pris|prend|ramass/.test(v)) return "take";
  if (/l[aâ]ch|laiss|abandon/.test(v)) return "drop";
  if (/ouvr/.test(v)) return "open";
  if (/appar/.test(v)) return "appear";
  if (/part|dispar|quitt/.test(v)) return "leave";
  if (/mouv|brusq/.test(v)) return "move";
  return "other";
}

/** The guide with one sequence re-read: its lines replaced by the close ones, its gestures added. */
export function applyDetail(guide: FilmGuide, sequence: Pick<GuideSequence, "from" | "to">, answer: { beats?: unknown[]; gestures?: unknown[] }): FilmGuide {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const inside = (s: number) => Number.isFinite(s) && s >= sequence.from && s <= sequence.to;
  const beats = (answer.beats ?? [])
    .map((b) => b as Record<string, unknown>)
    .map((b) => ({ seconds: Math.round(Number(b.seconds)), what: text(b.what), change: text(b.change) || "rien" }))
    .filter((b) => inside(b.seconds) && b.what);
  const gestures = (answer.gestures ?? [])
    .map((g) => g as Record<string, unknown>)
    .map((g) => ({ seconds: Math.round(parseFloat(String(g.seconds))), gesture: text(g.gesture), kind: gestureKind(g.kind) }))
    .filter((g) => inside(g.seconds) && g.gesture);
  const replaced = new Set(beats.map((b) => b.seconds));
  return {
    ...guide,
    beats: [...guide.beats.filter((b) => !replaced.has(b.seconds)), ...beats].sort((a, b) => a.seconds - b.seconds),
    gestures: [...(guide.gestures ?? []).filter((g) => !inside(g.seconds)), ...gestures].sort((a, b) => a.seconds - b.seconds),
    detailed: [...new Set([...(guide.detailed ?? []), sequence.from])],
    updated_at: new Date().toISOString(),
  };
}

/** The moments, four per second, of the stretches worth a close re-reading, each stretch at most `max` seconds. */
export function detailSpans(guide: FilmGuide, max = 20): { from: number; to: number; kind: SequenceKind; summary: string; start: number }[] {
  const spans: { from: number; to: number; kind: SequenceKind; summary: string; start: number }[] = [];
  for (const s of sequencesToDetail(guide)) {
    for (let from = s.from; from <= s.to; from += max) spans.push({ from, to: Math.min(s.to, from + max - 1), kind: s.kind, summary: s.summary, start: s.from });
  }
  // Busy stretches the quick reading labelled calm: something changes almost every second (2:20 to 2:31 of
  // episode 1, a throw and blows on the ground read as "contemplation"). Eight seconds with five action changes or more.
  const covered = (sec: number) => spans.some((sp) => sec >= sp.from && sec <= sp.to);
  const done = new Set(guide.detailed ?? []);
  // A change of framing (a cut, a closer shot, a new angle) is not an action; what the characters do is.
  const CAMERA = /^(rien|coupe|cadrage|recadrage|changement (de plan|d'angle|de cadrage)|plan |nouveau plan|vue |zoom|même |retour |fondu|l[ée]g[èe]re? variation)/i;
  const changed = new Set(guide.beats.filter((b) => b.change && !CAMERA.test(b.change.trim())).map((b) => b.seconds));
  const busy: { from: number; to: number }[] = [];
  const seconds = guide.beats.map((b) => b.seconds);
  for (const start of seconds) {
    let n = 0;
    for (let t = start; t < start + 8; t += 1) if (changed.has(t)) n += 1;
    if (n < 5) continue;
    // Two seconds of margin before: the gesture that starts the stretch (the throw at 2:20) comes just ahead of it.
    const from = Math.max(0, start - 2);
    const last = busy[busy.length - 1];
    if (last && from <= last.to + 1) last.to = Math.max(last.to, start + 7);
    else busy.push({ from, to: start + 7 });
  }
  for (const b of busy) {
    const seq = sequenceAt(guide, b.from);
    if (done.has(b.from)) continue;
    for (let from = b.from; from <= b.to; from += max) {
      const to = Math.min(b.to, from + max - 1);
      if (covered(from) && covered(to)) continue;
      spans.push({ from, to, kind: seq?.kind ?? "calm", summary: seq?.summary ?? "", start: from });
    }
  }
  return spans.sort((a, b) => a.from - b.from);
}

/** Four moments per second over the stretches: what the dense extraction reads. */
export function denseTimes(spans: { from: number; to: number }[], perSecond = 4): number[] {
  const out = new Set<number>();
  for (const span of spans) for (let t = span.from; t <= span.to + 0.76; t += 1 / perSecond) out.add(Math.round(t * 1000) / 1000);
  return [...out].sort((a, b) => a - b);
}
