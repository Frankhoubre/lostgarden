import type { ReferenceAsset, WebtoonPanel } from "./types";

/**
 * CONTINUITY ENGINE of the story continuation: pure functions, no model call.
 *
 * The supervisor model reads each frame of the film and writes a note; this
 * module turns those notes into what the writer must obey and what the
 * engine checks afterwards:
 *
 * - `momentsOf`: consecutive identical frames merged into moments;
 * - `eventsOf`: the physical events between two moments (a helmet knocked
 *   off, an object taken out, opened, thrown, a fall, a blow on the ground,
 *   a creature or a machine that appears, rises, roars, a run), each with
 *   the beats it must be told in, a minimum number of panels and the sound
 *   effect it carries;
 * - `eventGaps`: the events the written panels do not tell enough;
 * - `ensureSoundEffects`: a sound on every impact, roar and run, added when
 *   the writer forgot it;
 * - `entityAssets`: the objects, creatures and machines detected without a
 *   sheet in the library become sheets to draw, so they stay the same from
 *   panel to panel;
 * - `coveredUntil`: the second of the film a strip is adapted to.
 *
 * Everything here reads English notes written by a model, so the detection
 * is by keywords, wide rather than exact: a missed event costs a sound, a
 * false one costs a redundant beat the writer merges.
 */

export type FrameNote = {
  seconds: number;
  place?: string;
  characters?: string[];
  helmet?: string;
  posture?: string;
  action?: string;
  in_hands?: string;
  others_visible?: string;
  /** Size of what is visible next to the character, in words ("the machine is twenty times his height"). */
  scale?: string;
  /** What moves and how fast ("the machine lifts its body on its legs, dust falls"; "nothing moves"). */
  motion?: string;
  /** What would be heard ("a metallic clang", "a deep mechanical roar", "footsteps on moss", "silence"). */
  sound?: string;
  title_card?: string | null;
  screenplay_line?: string;
};

export type Moment = { from: number; to: number; frames: number } & Omit<FrameNote, "seconds">;

export type SoundEffect = { en: string; fr: string; style: "soft" | "hard" | "rumble"; size: number };

export type StoryEventKind =
  | "helmet_off"
  | "helmet_on"
  | "take_out"
  | "open"
  | "throw"
  | "kneel"
  | "fall"
  | "strike"
  | "appear"
  | "rise"
  | "roar"
  | "run"
  | "impact";

export type StoryEvent = {
  kind: StoryEventKind;
  from: number;
  to: number;
  /** One line, what happens. */
  what: string;
  /** The panels the event must be told in, in order. */
  beats: string[];
  min_panels: number;
  sfx?: SoundEffect;
  /** Visual effects the panels of the event must show (electric arcs, debris). */
  effects?: string[];
};

/** A panel written for the strip, as the writer answers it: only what the checks read. */
export type IntentLike = { seconds: number; description?: string; action?: string; sfx?: unknown[]; sound?: string; characters?: string[]; objects?: string[] };

const has = (text: string | undefined, pattern: RegExp) => pattern.test(text ?? "");
const words = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" ");

const helmetState = (value: string | undefined): "on" | "off" | null => {
  const h = (value ?? "").toLowerCase();
  if (!h) return null;
  // "on the ground" starts with "on": the off readings come first.
  if (h.startsWith("off") || h.includes("ground") || h.includes("in his hands") || h.includes("headless") || h.includes("knocked")) return "off";
  if (h.startsWith("on:") || h.startsWith("on his") || h.includes("on his head")) return "on";
  return null;
};

const TERRAIN = /^(a |an |the )?(\w+ ){0,3}(branch|branches|root|roots|mushroom|mushrooms|mist|fog|trunk|trunks|stone|stones|rock|rocks|flower|flowers|lily|lilies|petal|petals|moss|light|beam|beams|tree|trees|leaf|leaves|vine|vines|ground|dust)\b/i;
/** The head noun of "a colossal round alien machine covered in moss": "machine". */
const headNoun = (phrase: string) => {
  // "the alien machine's colossal body" is about the machine: the possessive ends the phrase.
  const core = phrase.split(/'s\b|’s\b/)[0].split(/ (covered|with|on|in|behind|ahead|at|of|under|over|between|near|beside|rising|lying|standing|open|closed)\b/i)[0].trim();
  const parts = core.split(/\s+/).filter(Boolean);
  return (parts[parts.length - 1] ?? "").toLowerCase().replace(/[^a-z]/g, "");
};

const EMPTY_HANDS = /^\s*$|^(nothing|none|empty|no object|nothing held|bare|his hands are empty)/i;
const handsHold = (value: string | undefined) => !EMPTY_HANDS.test(value ?? "");
/** The thing held, without what the hand does with it. */
const heldThing = (value: string | undefined) => (value ?? "").split(/[,;:(]| and | which | that /)[0].trim().replace(/^(a|an|the) /i, "");

/**
 * What a frame shows, reduced to the signals that decide a panel: the place,
 * who is there, the helmet, the posture as a category, whether a hand holds
 * something and what, and the creatures or machines visible (terrain is not
 * a signal). The supervisor rewords the scenery every second, so comparing
 * its raw text made every second its own moment, and the strip came out at
 * one panel per second of film, several of them identical.
 */
const POSTURE_CLASSES: [RegExp, string][] = [
  [/run|sprint|flee|dash|bolt/i, "run"],
  [/kneel|knees/i, "kneel"],
  [/lying|lies|collapsed|face down|on his back|prone|sprawled|flat on/i, "down"],
  [/climb|scrambl/i, "climb"],
  [/sit/i, "sit"],
  [/fall/i, "fall"],
  [/crouch|bend|bent|lean|stoop/i, "bend"],
  [/walk|step|advanc|moving forward|approach/i, "walk"],
  [/stand|still|frozen|motionless|upright/i, "stand"],
];

function postureClass(value: string | undefined): string {
  const text = (value ?? "").toLowerCase();
  for (const [pattern, name] of POSTURE_CLASSES) if (pattern.test(text)) return name;
  return text.slice(0, 8);
}

/** The things in `others_visible` that are not scenery, as head nouns: a creature, a machine, a claw, an eye. */
function significantNouns(value: string | undefined): string[] {
  const parts = String(value ?? "")
    .split(/[,;.]| and /)
    .map((part) => part.trim())
    .filter((part) => part && !TERRAIN.test(part));
  const nouns = parts.map(headNoun).filter((noun) => noun.length > 2 && !/^(none|nothing|nobody|null)$/.test(noun));
  return [...new Set(nouns)].sort();
}

/** Consecutive frames that show the same thing collapse into one moment with a duration. */
export function momentsOf(notes: FrameNote[]): Moment[] {
  const sorted = [...notes].sort((a, b) => Number(a.seconds) - Number(b.seconds));
  const key = (n: Omit<FrameNote, "seconds">) =>
    [
      headNoun(String(n.place ?? "").split(/[,;.]/)[0]),
      (n.characters ?? []).map((c) => String(c).toLowerCase()).sort().join(","),
      helmetState(n.helmet) ?? "?",
      postureClass(n.posture),
      handsHold(n.in_hands) ? headNoun(heldThing(n.in_hands)) : "",
      significantNouns(n.others_visible).join(","),
      n.title_card ? "title" : "",
    ].join("|");
  const moments: Moment[] = [];
  for (const n of sorted) {
    const last = moments[moments.length - 1];
    if (last && key(last) === key(n)) {
      last.to = Number(n.seconds);
      last.frames += 1;
      if (n.action && !String(last.action ?? "").includes(String(n.action).slice(0, 30))) last.action = `${last.action ?? ""} Then: ${n.action}`.trim();
      if (n.motion && !String(last.motion ?? "").includes(String(n.motion).slice(0, 30))) last.motion = words(last.motion, n.motion);
      if (n.sound && !String(last.sound ?? "").includes(String(n.sound).slice(0, 30))) last.sound = words(last.sound, n.sound);
      if (n.scale && !last.scale) last.scale = n.scale;
    } else {
      const { seconds, ...rest } = n;
      moments.push({ from: Number(seconds), to: Number(seconds), frames: 1, ...rest });
    }
  }
  return moments;
}

const POSTURE_DOWN = /kneel|knees/i;
const POSTURE_FLAT = /lying|lies|collapsed|face down|on his back|prone|sprawled|flat on/i;
const POSTURE_RUN = /run|sprint|flee|dash|bolt/i;

const RE_THROW = /throw|thrown|fling|hurl|toss|sweep|swept|cast(s|ing)? (it )?away|lets? go of/i;
const RE_STRIKE = /punch|strik(e|es|ing) the ground|slam|pound|hits? the ground|hammers?|fist (comes|slams|hits|strikes|down)|beats? the ground/i;
const RE_ROAR = /roar|scream|howl|shriek|bellow|screech/i;
const RE_RISE = /\brises?\b|rising|stands? up|rears?( up)?|lifts? (itself|its body|its bulk|off the ground)|unfold|straighten|gets? up|towers? up|comes? alive|wakes?( up)?|awaken/i;
const RE_ELECTRIC = /electric|lightning|spark|arc(s|ing)?\b|crackl|surge|voltage|static/i;
const RE_IMPACT = /impact|crash|thud|boom|slam|explo|shatter|breaks?|smash|bang|lands? hard|crunch/i;
const RE_FOOTSTEPS = /footstep|running|runs|sprint|flee|dash/i;
const RE_SILENT = /^\s*(silence|silent|none|nothing|no sound|quiet)\b/i;

const SFX = {
  clang: { en: "KLANG", fr: "KLANG", style: "hard", size: 240 },
  clonk: { en: "KLONK", fr: "KLONK", style: "hard", size: 240 },
  click: { en: "click", fr: "clic", style: "soft", size: 90 },
  clack: { en: "CLACK", fr: "CLAC", style: "soft", size: 120 },
  whip: { en: "WHIP", fr: "VLAN", style: "hard", size: 180 },
  thud: { en: "THUD", fr: "BOUM", style: "hard", size: 220 },
  bam: { en: "BAM", fr: "BAM", style: "hard", size: 300 },
  crash: { en: "CRASH", fr: "CRAC", style: "hard", size: 260 },
  rumble: { en: "GRRRRK", fr: "KRRRRR", style: "rumble", size: 240 },
  roar: { en: "ROAAAR", fr: "RAAAAH", style: "hard", size: 300 },
  steps: { en: "TAP TAP TAP", fr: "TAP TAP TAP", style: "hard", size: 130 },
  bzzt: { en: "BZZZT", fr: "BZZZT", style: "rumble", size: 200 },
} satisfies Record<string, SoundEffect>;

/**
 * The physical events of a window, read from the differences between two
 * consecutive moments and from the motion and sound the supervisor noted.
 */
export function eventsOf(moments: Moment[], options: { /** Text of the last panels made: what they already show has not "appeared" here. */ previous?: string } = {}): StoryEvent[] {
  const events: StoryEvent[] = [];
  const push = (event: StoryEvent) => {
    if (!events.some((e) => e.kind === event.kind && Math.abs(e.from - event.from) <= 1)) events.push(event);
  };
  const previous = (options.previous ?? "").toLowerCase();
  // Head nouns of everything seen so far in the window: a thing appears once.
  const seen = new Set<string>();
  for (let i = 0; i < moments.length; i += 1) {
    const cur = moments[i];
    const prev = moments[i - 1];
    const text = words(cur.action, cur.motion, cur.sound, cur.in_hands);
    const electric = has(words(cur.action, cur.motion, cur.others_visible, cur.sound), RE_ELECTRIC) ? ["crackling blue-white electric arcs jumping between its metal parts, small sparks, a cold glow thrown on the nearby surfaces"] : undefined;

    if (prev) {
      const prevH = helmetState(prev.helmet);
      const curH = helmetState(cur.helmet);
      if (prevH === "on" && curH === "off") {
        // The blow is a moment or two before the first "off" reading: the supervisor still reads "on" while the helmet is in the air.
        const blow = moments.slice(Math.max(0, i - 3), i).find((m) => /helmet|branch|head/i.test(words(m.action, m.motion, m.sound, m.others_visible)) && /(hit|hits|strik|knock|catch|catches|snap|impact|clang|clank|violent|scrap)/i.test(words(m.action, m.motion, m.sound)));
        const cause = [blow?.others_visible, prev.others_visible, cur.others_visible].find((v) => v && !/^\s*(none|nothing|-)?\s*$/i.test(v)) ?? "what hits him";
        push({
          kind: "helmet_off",
          from: blow ? blow.from : Math.max(prev.from, prev.to - 1),
          to: cur.to,
          what: `the helmet is knocked off (${cause})`,
          beats: [
            `the cause, as a detail ahead of him: ${cause}`,
            "the impact, extreme close-up on the point of contact, with one big sound effect",
            "the helmet in the air, then on the ground, rolling to a stop, alone in the frame",
            "Lanterne frozen, headless: the dark empty opening above the scarf, nothing inside",
          ],
          min_panels: 4,
          sfx: SFX.clonk,
        });
      } else if (prevH === "off" && curH === "on") {
        push({
          kind: "helmet_on",
          from: Math.max(prev.from, prev.to - 1),
          to: cur.to,
          what: "the helmet goes back on",
          beats: ["both hands lift the helmet up to the open neck", "the helmet back in place, the two dark eye holes, a small sound"],
          min_panels: 2,
          sfx: SFX.clack,
        });
      }

      const prevHolds = handsHold(prev.in_hands);
      const curHolds = handsHold(cur.in_hands);
      if (!prevHolds && curHolds) {
        const thing = heldThing(cur.in_hands);
        push({
          kind: "take_out",
          from: Math.max(prev.from, prev.to - 1),
          to: cur.to,
          what: `${thing} taken out`,
          beats: [`the hand going where the object was (under the chest plate, on the ground) and closing on ${thing}`, `${thing} out, seen clearly in the gauntlet, its shape readable`],
          min_panels: 2,
        });
      }
      if (prevHolds && curHolds && !/open/i.test(prev.in_hands ?? "") && /open/i.test(cur.in_hands ?? "")) {
        const thing = heldThing(cur.in_hands);
        push({
          kind: "open",
          from: Math.max(prev.from, prev.to - 1),
          to: cur.to,
          what: `${thing} opened`,
          beats: [`detail of ${thing} opening in the gauntlet`, `what is inside ${thing}, filling the frame, exactly as the film shows it`],
          min_panels: 2,
          sfx: SFX.click,
        });
      }
      if (prevHolds && !curHolds && has(words(prev.action, cur.action, cur.in_hands, prev.in_hands, cur.motion), RE_THROW)) {
        const thing = heldThing(prev.in_hands);
        push({
          kind: "throw",
          from: Math.max(prev.from, prev.to - 1),
          to: cur.to,
          what: `${thing} thrown away`,
          beats: [`the arm sweeping out wide, ${thing} leaving the hand, motion lines`, `${thing} flying away, small against the place`, `where ${thing} lands, far from him, alone in the frame`],
          min_panels: 3,
          sfx: SFX.whip,
        });
      }

      const prevDown = has(prev.posture, POSTURE_DOWN) || has(prev.posture, POSTURE_FLAT);
      if (!prevDown && has(cur.posture, POSTURE_FLAT)) {
        push({
          kind: "fall",
          from: Math.max(prev.from, prev.to - 1),
          to: cur.to,
          what: "he falls to the ground",
          beats: ["the body in the air or tipping over, motion lines", "the body hitting the ground, extreme close-up on the contact, one giant sound effect", "down and still, dust or petals settling"],
          min_panels: 3,
          sfx: SFX.bam,
        });
      } else if (!prevDown && has(cur.posture, POSTURE_DOWN)) {
        push({
          kind: "kneel",
          from: Math.max(prev.from, prev.to - 1),
          to: cur.to,
          what: "he falls to his knees",
          beats: ["the knees hitting the ground, close on the knee plates, a metallic sound", "him on his knees, whole body, small"],
          min_panels: 2,
          sfx: SFX.clang,
        });
      }

      const curOthers = (cur.others_visible ?? "").toLowerCase().replace(/^(none|nothing|-)?$/, "");
      const curFirst = curOthers.split(/[,;.]/)[0].trim();
      const noun = headNoun(curFirst);
      // Not an appearance: terrain, the parts of Lanterne himself (the fallen helmet is the helmet_off event),
      // and anything the window or the last panels already showed.
      const fresh = noun.length > 2 && !seen.has(noun) && !previous.includes(noun);
      for (const part of curOthers.split(/[,;.]/)) {
        const n = headNoun(part.trim());
        if (n.length > 2) seen.add(n);
      }
      if (curFirst && fresh && !TERRAIN.test(curFirst) && !/^(helmet|hand|hands|arm|arms|cape|scarf|armour|armor|gauntlet|glove|boot|boots|fist|shadow|silhouette|water|reflection)$/.test(noun)) {
        const scale = cur.scale && !/^\s*(none|-|n\/a)?\s*$/i.test(cur.scale) ? cur.scale : "";
        push({
          kind: "appear",
          from: cur.from,
          to: Math.max(cur.to, cur.from + 1),
          what: `${curFirst} appears${scale ? ` (${scale})` : ""}`,
          beats: [
            `a fragment of it glimpsed first, partly hidden: one part of ${curFirst} huge in the foreground or between the trunks`,
            `the reveal, wide and tall, low angle, ${scale ? `at true scale: ${scale}, ` : ""}Lanterne tiny in the frame`,
            "his reaction: frozen, the body turned toward it",
          ],
          min_panels: 3,
        });
      }
    }

    if (!prev) for (const part of (cur.others_visible ?? "").toLowerCase().split(/[,;.]/)) { const n = headNoun(part.trim()); if (n.length > 2) seen.add(n); }

    if (has(text, RE_STRIKE)) {
      push({
        kind: "strike",
        from: cur.from,
        to: Math.max(cur.to, cur.from + 1),
        what: "a blow on the ground",
        beats: ["the fist rising, tension in the arm", "the fist hitting the ground, extreme close-up on the contact, one giant sound effect", "the aftermath: moss and dirt thrown up, the fist still down, the body bent over it"],
        min_panels: 3,
        sfx: SFX.bam,
      });
    }
    const riser = (cur.others_visible ?? "").split(/[,;.]/).map((p) => p.trim()).find((p) => p && !TERRAIN.test(p) && !/^(helmet|hand|hands|arm|arms|cape|scarf|water|reflection|light)$/.test(headNoun(p)));
    // "his arm rises slightly" is not a thing rising; "the machine lifts its body on its legs, rising" is.
    const limbRises = /\b(his|her|one) (arm|arms|hand|hands|head|gauntlet|fist|leg|legs|knee|knees)\b[^.;,]{0,10}\b(rises?|rising|lifts?)/i.test(words(cur.action, cur.motion)) && !RE_RISE.test(words(cur.action, cur.motion).replace(/\b(his|her|one) (arm|arms|hand|hands|head|gauntlet|fist|leg|legs|knee|knees)\b[^.;,]{0,10}\b(rises?|rising|lifts?)/gi, ""));
    if (riser && has(words(cur.action, cur.motion), RE_RISE) && !limbRises) {
      const subject = riser;
      push({
        kind: "rise",
        from: cur.from,
        to: Math.max(cur.to, cur.from + 1),
        what: `${subject} rises`,
        beats: [
          `before: ${subject} as it was, low, dormant, close to the ground`,
          `the movement: its legs or limbs unfolding, the body lifting off the ground, debris, dust and moss falling from it, motion lines${electric ? ", electric arcs crackling over it" : ""}`,
          `after: its full height against Lanterne, low angle, ${cur.scale ? `at true scale (${cur.scale}), ` : ""}he is tiny`,
        ],
        min_panels: 3,
        sfx: SFX.rumble,
        effects: electric,
      });
    }
    if (has(words(cur.action, cur.sound), RE_ROAR)) {
      push({ kind: "roar", from: cur.from, to: cur.to, what: "a roar", beats: ["the roar, from below, the mouth or the lens filling the frame, one giant sound effect across the panel"], min_panels: 1, sfx: SFX.roar, effects: electric });
    }
    if (has(cur.posture, POSTURE_RUN) || has(words(cur.action, cur.motion), RE_FOOTSTEPS)) {
      push({
        kind: "run",
        from: cur.from,
        to: cur.to,
        what: "he runs",
        beats: ["the run in pieces: feet hitting the moss, the cape stretched, a look back, the threat behind; sounds everywhere (footsteps, cracking roots, the roar, his own metal rattling)"],
        min_panels: Math.max(1, Math.min(3, Math.ceil(cur.frames / 2))),
        sfx: SFX.steps,
      });
    }
    if (has(cur.sound, RE_IMPACT) && !events.some((e) => e.from <= cur.to && e.to >= cur.from && e.sfx && e.kind !== "run")) {
      push({ kind: "impact", from: cur.from, to: cur.to, what: `an impact (${cur.sound})`, beats: ["the impact itself, extreme close-up on the contact, one giant sound effect", "what it breaks or throws up, as a detail"], min_panels: 2, sfx: SFX.crash });
    }
    if (electric && !events.some((e) => e.from <= cur.to && e.to >= cur.from && e.effects)) {
      const last = events.filter((e) => e.from <= cur.to && e.to >= cur.from).pop();
      if (last) last.effects = electric;
      else push({ kind: "impact", from: cur.from, to: cur.to, what: "electricity", beats: ["the electric arcs crackling, as a detail, with a sound"], min_panels: 1, sfx: SFX.bzzt, effects: electric });
    }
  }
  return events.sort((a, b) => a.from - b.from || a.to - b.to);
}

/** The events as one block of text for the writer. */
export function eventsBrief(events: StoryEvent[]): string {
  if (!events.length) return "";
  return events
    .map((e) => `EVENT ${e.from}-${e.to} s, ${e.what}: at least ${e.min_panels} panel${e.min_panels > 1 ? "s" : ""}, in this order: ${e.beats.map((b, i) => `(${i + 1}) ${b}`).join("; ")}.${e.sfx ? ` Sound effect required on the impact panel: ${e.sfx.en} (fr ${e.sfx.fr}), size ${e.sfx.size}.` : ""}${e.effects ? ` Effects: ${e.effects.join("; ")}.` : ""}`)
    .join("\n");
}

const within = (event: StoryEvent, seconds: number) => seconds >= event.from - 2 && seconds <= event.to + 1;

/** True when the second falls inside an event that changes the helmet: the state is transitional there and is not forced. */
export function inHelmetEvent(events: StoryEvent[], seconds: number): boolean {
  return events.some((e) => (e.kind === "helmet_off" || e.kind === "helmet_on") && within(e, seconds));
}

const STOP_WORDS = new Set(["the", "a", "an", "of", "in", "on", "at", "to", "and", "with", "his", "her", "its", "into", "from", "then", "that", "this", "one", "out", "up", "down", "for", "him", "she", "over", "under", "close", "shot", "panel", "frame", "detail", "view", "angle"]);

/** The distinctive words of a beat: what a panel that tells it would almost certainly contain. */
function beatWords(beat: string): string[] {
  return [...new Set(beat.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w)))];
}

/** The beats of an event that no panel of its span seems to tell. */
export function missingBeats(event: StoryEvent, intents: IntentLike[]): string[] {
  const texts = intents.filter((i) => within(event, Number(i.seconds))).map((i) => `${i.description ?? ""} ${i.action ?? ""}`.toLowerCase());
  if (!texts.length) return event.beats;
  return event.beats.filter((beat) => {
    const wanted = beatWords(beat);
    if (!wanted.length) return false;
    // A beat is told when some panel shares a third of its distinctive words.
    return !texts.some((text) => wanted.filter((w) => text.includes(w)).length >= Math.max(2, Math.ceil(wanted.length / 3)));
  });
}

/**
 * The events the written panels do not tell: too few panels, or a required
 * beat (the cause, the impact, the consequence) that no panel shows. Feeds
 * the coverage check, so the fix call writes the beats that are missing
 * rather than more panels of the same moment.
 */
export function eventGaps(events: StoryEvent[], intents: IntentLike[]): { seconds: number; moment: string }[] {
  const gaps: { seconds: number; moment: string }[] = [];
  for (const event of events) {
    const written = intents.filter((i) => within(event, Number(i.seconds)));
    const absent = missingBeats(event, intents);
    if (written.length >= event.min_panels && !absent.length) continue;
    const beats = absent.length ? absent : event.beats;
    gaps.push({
      seconds: event.to,
      moment: `${event.what} (${event.from}-${event.to} s): ${written.length} panel${written.length === 1 ? "" : "s"} written, ${event.min_panels} needed. These beats are NOT told and the reader cannot follow what happens: ${beats.map((b, i) => `(${i + 1}) ${b}`).join("; ")}.${event.sfx ? ` The panel of the impact carries the sound effect ${event.sfx.en}, size ${event.sfx.size}.` : ""}`,
    });
  }
  return gaps;
}

type Sfx = WebtoonPanel["sfx"][number];

const soundEffect = (sfx: SoundEffect, anchor: { x: number; y: number }, rotate = -12): Sfx => ({ text: { en: sfx.en, fr: sfx.fr }, anchor, style: sfx.style, rotate, size: sfx.size });

/**
 * Ambient sound: what a place makes all the time (steps on moss, a breeze, a
 * rustle, the hum of the cavern). Lettering it in every panel is noise, and
 * the strip came back with TAP TAP TAP on panels where nobody moves; these
 * only get a sound inside a run.
 */
const RE_AMBIENT = /^\s*(a |an |the )?(soft|faint|quiet|distant|low|gentle)?\s*(footstep|step|rustl|breeze|wind|hum|drip|whisper|murmur|echo|ambien|silence|nothing|quiet|calm|moss|cloth|fabric|cape)/i;

/** A sound effect guessed from what the writer said would be heard, for a panel that letters none. */
export function sfxForSound(sound: string | undefined): SoundEffect | null {
  if (!sound || RE_SILENT.test(sound) || RE_AMBIENT.test(sound)) return null;
  if (RE_ROAR.test(sound)) return SFX.roar;
  if (RE_ELECTRIC.test(sound)) return SFX.bzzt;
  if (/metal|clang|armour|armor|helmet/i.test(sound)) return SFX.clang;
  if (/rumble|mechanical|grind|engine|hydraulic|creak|groan/i.test(sound)) return SFX.rumble;
  if (/click|clasp|latch/i.test(sound)) return SFX.click;
  if (RE_IMPACT.test(sound)) return SFX.crash;
  if (/thud|fall|drop/i.test(sound)) return SFX.thud;
  return null;
}

/**
 * A sound on every event that has one, and on every panel the writer said
 * makes a sound: the writer often describes the impact and forgets the
 * lettering, and a blow without its BAM reads as a pose.
 */
export function ensureSoundEffects(panels: WebtoonPanel[], intents: IntentLike[], events: StoryEvent[]): WebtoonPanel[] {
  const out = panels.map((p) => ({ ...p, sfx: [...p.sfx] }));
  const secondsOf = (p: WebtoonPanel) => Number(p.source_time_start ?? Number.NaN);
  for (const event of events) {
    if (!event.sfx) continue;
    const inRange = out.filter((p) => !p.image?.model?.startsWith("title") && Number.isFinite(secondsOf(p)) && within(event, secondsOf(p)));
    if (!inRange.length) continue;
    if (event.kind === "run") {
      // A run sounds in every panel, in several directions: footsteps where the writer wrote none.
      for (const panel of inRange) {
        const text = `${panel.action} ${panel.description}`;
        const hasSteps = panel.sfx.some((s) => /tap|step|pat|dash/i.test(s.text.en));
        if (!hasSteps && panel.sfx.length < 3 && /run|feet|foot|sprint|dash|flee|step|boots?/i.test(text)) panel.sfx.push(soundEffect(SFX.steps, { x: 70, y: 82 }, -8));
      }
      continue;
    }
    if (inRange.some((p) => p.sfx.length)) continue;
    const impactRe = event.kind === "roar" ? RE_ROAR : event.kind === "rise" ? RE_RISE : event.kind === "throw" ? RE_THROW : event.kind === "strike" ? RE_STRIKE : /impact|contact|hits?|strik|knock|slam|falls?|drops?|rolls?|lands?|crash/i;
    const target = inRange.find((p) => impactRe.test(`${p.action} ${p.description}`)) ?? inRange.reduce((best, p) => (Math.abs(secondsOf(p) - event.to) < Math.abs(secondsOf(best) - event.to) ? p : best), inRange[0]);
    target.sfx.push(soundEffect(event.sfx, { x: 62, y: 34 }));
  }
  // What the writer said would be heard, when it wrote no lettering for it (panels and intents align by index).
  out.forEach((panel, index) => {
    if (panel.sfx.length) return;
    const guess = sfxForSound(intents[index]?.sound);
    if (guess) panel.sfx.push(soundEffect(guess, { x: 64, y: 30 }));
  });
  return out;
}

/** Prompt text for the movement of a panel, so a still image reads as motion. */
export function motionCues(motion: string | undefined): string {
  switch ((motion ?? "").toLowerCase()) {
    case "slow":
      return "MOTION: slow movement: the pose leaning into the movement, one or two thin motion lines, the cape settling.";
    case "fast":
      return "MOTION: fast movement: speed lines and motion streaks behind the moving parts, the cape and scarf stretched by the movement, dust or petals kicked up, the pose caught mid-movement, never a static standing pose.";
    case "violent":
      return "MOTION: violent movement: strong diagonal composition, tilted horizon, debris and fragments flying, impact lines radiating from the point of contact, motion streaks, the ground cracking.";
    default:
      return "";
  }
}

/** Prompt text for the visual effects of a panel. */
export function effectCues(effects: string[] | undefined): string {
  const list = (effects ?? []).map((e) => String(e).trim()).filter(Boolean);
  if (!list.length) return "";
  const expanded = list.map((e) => (RE_ELECTRIC.test(e) ? "crackling blue-white electric arcs jumping between its metal parts, small sparks, a cold glow thrown on the nearby surfaces" : e));
  return `EFFECTS, drawn clearly: ${[...new Set(expanded)].join("; ")}.`;
}

/**
 * An object, creature, machine or character the supervisor saw in the
 * window, resolved to the library or to be added to it.
 */
export type Entity = {
  /** Library id: a character subject ("rabbit") or an object id without prefix ("pendant"). */
  id: string;
  kind: "character" | "object";
  name: string;
  must_keep: string;
  /** Seconds where it is visible. */
  seconds: number[];
  /** Seconds where it is seen best (large, clear). */
  best_seconds: number[];
  scale?: string;
  /** True when the library already has a sheet with an image for it. */
  has_sheet: boolean;
  /** A creature or a machine rather than a person: its sheet shows it next to Lanterne for scale. */
  creature?: boolean;
};

/** `Silver pendant` → `silver-pendant`. */
export function entitySlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^(a|an|the) /, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** The library sheets for an entity: character sheets by subject, an object sheet by id. */
export function entitySheets(entity: Pick<Entity, "id" | "kind">, library: ReferenceAsset[]): ReferenceAsset[] {
  return entity.kind === "character" ? library.filter((a) => a.kind === "character" && a.subject === entity.id) : library.filter((a) => a.kind === "object" && a.id === `obj.${entity.id}`);
}

/**
 * The sheets to draw for the entities that have none: one asset per entity,
 * without image, with the frames of the film where it is seen best as the
 * design source. The studio draws them and puts them in its library before
 * generating the panels, and every later panel that names the entity
 * attaches the sheet.
 */
export function entityAssets(entities: Entity[], library: ReferenceAsset[], frameSrc: (seconds: number) => string | undefined): { asset: ReferenceAsset; frames: string[] }[] {
  const out: { asset: ReferenceAsset; frames: string[] }[] = [];
  for (const entity of entities) {
    if (entitySheets(entity, library).some((a) => a.image)) continue;
    const frames = [...entity.best_seconds, ...entity.seconds]
      .map((s) => frameSrc(s))
      .filter((src, i, all): src is string => Boolean(src) && all.indexOf(src) === i)
      .slice(0, 3);
    if (!frames.length) continue;
    const tags = [entity.id, "studio", "auto", ...(entity.creature ? ["creature"] : [])];
    const asset: ReferenceAsset =
      entity.kind === "character"
        ? { id: `char.${entity.id}.webtoon`, kind: "character", subject: entity.id, priority: 1, name: `${entity.name}, webtoon model sheet`, image: "", must_keep: entity.must_keep, description: `Detected in the film at ${entity.seconds.slice(0, 6).join(", ")} s; sheet drawn from those frames.${entity.scale ? ` Scale: ${entity.scale}.` : ""}`, tags }
        : { id: `obj.${entity.id}`, kind: "object", name: entity.name, image: "", must_keep: entity.must_keep, description: `Detected in the film at ${entity.seconds.slice(0, 6).join(", ")} s; sheet drawn from those frames.`, tags };
    out.push({ asset, frames });
  }
  return out;
}

/** The frame of the film where an entity is seen best, nearest to a panel's second. */
export function bestFrameFor(entity: Entity, seconds: number, frameSrc: (seconds: number) => string | undefined): string | undefined {
  const pool = entity.best_seconds.length ? entity.best_seconds : entity.seconds;
  if (!pool.length) return undefined;
  const nearest = pool.reduce((best, s) => (Math.abs(s - seconds) < Math.abs(best - seconds) ? s : best), pool[0]);
  return frameSrc(nearest);
}

/**
 * The second of the film a strip is adapted to. A panel written in the
 * studio draws from one frame, one second of film; a panel of a plan covers
 * its shot. (Earlier studio panels were saved with a five-second span,
 * which made each new batch skip four seconds of film.)
 */
export function coveredUntil(panels: readonly Pick<WebtoonPanel, "panel_id" | "source_time_start" | "source_time_end" | "prompt_auto">[]): number {
  let until = 0;
  for (const p of panels) {
    const start = p.source_time_start ?? null;
    const end = p.source_time_end ?? null;
    const studio = /^[ft]\d{2}m\d{2}s/.test(p.panel_id) || p.prompt_auto === true;
    const covered = studio && start !== null ? Math.min(end ?? start + 1, start + 1) : (end ?? 0);
    if (covered > until) until = covered;
  }
  return until;
}
