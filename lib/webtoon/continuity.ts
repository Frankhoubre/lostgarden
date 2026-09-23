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
  /** What changed since the frame before (appeared, grew, rose, opened, broke, was hit): motion that one frame alone hides. */
  changed?: string;
  /** Subtitle burned into the frame, word for word: the line actually spoken. */
  subtitle?: string;
  /** Measured on the pixels, not read by the model: "black and white" when the frame has no colour (a memory, a flashback). */
  grade?: string;
  title_card?: string | null;
  screenplay_line?: string;
};

export type Moment = { from: number; to: number; frames: number; /** Subtitles of the moment, each with the second it starts. */ subtitles?: { seconds: number; text: string }[] } & Omit<FrameNote, "seconds">;

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
  | "impact"
  | "grow"
  | "land"
  | "fight";

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

/**
 * The supervisor answers in JSON, and a model does not always keep the shape
 * asked for: `others_visible` comes back as a list of things, `characters`
 * as one string, `scale` as an object. Every field is brought back to the
 * type the engine reads before anything touches it; a batch died on
 * `others_visible.toLowerCase is not a function` and left a hole in the strip.
 */
function asText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(asText).filter(Boolean).join(", ");
  return String(value);
}

/** Frame notes with every field in the shape the engine expects, whatever the model answered. */
export function normalizeNotes(notes: readonly unknown[]): FrameNote[] {
  return (notes ?? [])
    .map((raw) => {
      const n = (raw ?? {}) as Record<string, unknown>;
      const characters = Array.isArray(n.characters)
        ? n.characters.map((c) => asText(c).trim().toLowerCase()).filter(Boolean)
        : asText(n.characters)
            .split(/[,;]/)
            .map((c) => c.trim().toLowerCase())
            .filter(Boolean);
      const title = asText(n.title_card).trim();
      return {
        seconds: Number(n.seconds),
        place: asText(n.place),
        characters,
        helmet: asText(n.helmet),
        posture: asText(n.posture),
        action: asText(n.action),
        in_hands: asText(n.in_hands),
        others_visible: asText(n.others_visible),
        scale: asText(n.scale),
        motion: asText(n.motion),
        sound: asText(n.sound),
        changed: asText(n.changed),
        subtitle: asText(n.subtitle).trim(),
        ...(n.grade ? { grade: asText(n.grade) } : {}),
        title_card: title || null,
        screenplay_line: asText(n.screenplay_line),
      } satisfies FrameNote;
    })
    .filter((n) => Number.isFinite(n.seconds));
}

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
  [/in the air|mid-air|midair|airborne|leap|jump|vault|flying through/i, "air"],
  [/fall/i, "fall"],
  [/crouch|bend|bent|lean|stoop/i, "bend"],
  // Walking and standing read the same on a still image, and the supervisor flips between them
  // from one second to the next: one class, or a panel "stands still" follows one "walks".
  [/walk|step|advanc|moving forward|approach|stand|still|frozen|motionless|upright/i, "upright"],
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
  const sorted = normalizeNotes(notes).sort((a, b) => Number(a.seconds) - Number(b.seconds));
  const key = (n: Omit<FrameNote, "seconds">) =>
    [
      headNoun(String(n.place ?? "").split(/[,;.]/)[0]),
      (n.characters ?? []).map((c) => String(c).toLowerCase()).sort().join(","),
      helmetState(n.helmet) ?? "?",
      postureClass(n.posture),
      handsHold(n.in_hands) ? headNoun(heldThing(n.in_hands)) : "",
      significantNouns(n.others_visible).join(","),
      n.title_card ? "title" : "",
      n.grade ?? "",
    ].join("|");
  const moments: Moment[] = [];
  const spoken = new Set<string>();
  for (const n of sorted) {
    const last = moments[moments.length - 1];
    if (last && key(last) === key(n)) {
      last.to = Number(n.seconds);
      last.frames += 1;
      if (n.action && !String(last.action ?? "").includes(String(n.action).slice(0, 30))) last.action = `${last.action ?? ""} Then: ${n.action}`.trim();
      if (n.motion && !String(last.motion ?? "").includes(String(n.motion).slice(0, 30))) last.motion = words(last.motion, n.motion);
      if (n.sound && !String(last.sound ?? "").includes(String(n.sound).slice(0, 30))) last.sound = words(last.sound, n.sound);
      if (n.changed && !/^\s*(nothing|none|no change)/i.test(n.changed) && !String(last.changed ?? "").includes(String(n.changed).slice(0, 30))) last.changed = words(last.changed, n.changed);
      if (n.scale && !last.scale) last.scale = n.scale;
      if (n.subtitle && !spoken.has(sameLine(n.subtitle))) last.subtitles = [...(last.subtitles ?? []), { seconds: Number(n.seconds), text: n.subtitle }];
      if (n.subtitle) spoken.add(sameLine(n.subtitle));
    } else {
      // A line stays on screen across several frames and often across a cut: it is spoken once, in the moment where it appears.
      const { seconds, subtitle, ...rest } = n;
      const fresh = subtitle && !spoken.has(sameLine(subtitle));
      if (subtitle) spoken.add(sameLine(subtitle));
      moments.push({ from: Number(seconds), to: Number(seconds), frames: 1, ...rest, ...(fresh ? { subtitles: [{ seconds: Number(seconds), text: subtitle }] } : {}) });
    }
  }
  return moments;
}

const POSTURE_DOWN = /kneel|knees/i;
const POSTURE_FLAT = /lying|lies|collapsed|face down|on his back|prone|sprawled|flat on/i;
const POSTURE_RUN = /run|sprint|flee|dash|bolt/i;

const RE_THROW = /throw|thrown|fling|hurl|toss|sweep|swept|cast(s|ing)? (it )?away|lets? go of/i;
const RE_STRIKE = /punch|strik(e|es|ing) the ground|slam|pound|hits? the ground|hammers?|fist (comes|slams|hits|strikes|down)|beats? the ground/i;
/** A blow on a thing that rings: a gong, a bell, a drum, an anvil, a door. */
const RE_RING = /(strik|hit|bang|ring|beat|knock|swing)\w*[^.;]{0,40}\b(gong|bell|drum|anvil|shield|door|chime)|\b(mallet|hammer|stick|beater)\b[^.;]{0,40}\b(gong|bell|drum|anvil|chime)|\b(gong|bell|chime)\b[^.;]{0,30}\b(struck|rings|ringing|sounds|resounds|booms)/i;
/** Something that grows or forms in the scenery: a root, a vine, a tree, a bridge, a path. */
const RE_GROW = /\b(grow|grows|growing|grew|sprout|sprouts|extends?|extending|stretch(es|ing)?|unfurl|uncoil|coil(s|ing)? (up|out)|surges?|shoots? (up|out)|forms? (a|an)? ?(path|bridge|ramp|stair|walkway)|(bridge|path|walkway) (forms|appears|grows))\b/i;
const RE_FIGHT = /\b(fight|fights|fighting|clash|clashes|battle|battling|grapple|grappling|wrestl|attack(s|ing)? (each other|one another|the other)|struggle with|locked together)\b/i;
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
  gong: { en: "BWONNNG", fr: "BOOONNG", style: "rumble", size: 310 },
  grow: { en: "KRRRAAAKK", fr: "KRRRAAAC", style: "rumble", size: 280 },
  land: { en: "THOOM", fr: "BOUM", style: "hard", size: 240 },
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
    // A dissolve into a black-and-white memory is not a movement: across a change of grade, no fall,
    // no kneel, no landing (8:57, Lanterne kneeling in the memory made a knee slam with its KLANG).
    const prev = moments[i - 1] && (moments[i - 1].grade ?? "") === (cur.grade ?? "") ? moments[i - 1] : undefined;
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
      // Nor a part of a being already there: its face, its eyes, a root, a droplet (the Source was "revealed" five times, once per part).
      if (curFirst && fresh && !TERRAIN.test(curFirst) && !/^(helmet|hand|hands|arm|arms|cape|scarf|armour|armor|gauntlet|glove|boot|boots|fist|shadow|silhouette|water|reflection|face|faces|eye|eyes|mouth|lips?|cheek|chin|brow|forehead|hair|root|roots|branch|branches|twig|twigs|finger|fingers|droplet|drop|tear|tears|petal|petals|flower|flowers|lily|lilies|light|glow|particle|particles|mist|fog)$/.test(noun)) {
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

    // A leap or a fall followed by a character on his feet: the landing is told even when the film cuts it.
    if (prev && ["air", "fall"].includes(postureClass(prev.posture)) && ["upright", "run", "bend", "kneel"].includes(postureClass(cur.posture))) {
      push({
        kind: "land",
        from: Math.max(prev.from, prev.to - 1),
        to: cur.from,
        what: "he lands",
        beats: ["the landing: feet or knees hitting the ground, close on the contact, a burst of dust and moss, one sound effect", "him straightening up from the landing, the cape settling"],
        min_panels: 2,
        sfx: SFX.land,
      });
    }
    const change = words(cur.changed, cur.action, cur.motion);
    if (has(change, RE_GROW)) {
      const subject = (/\b(root|roots|vine|vines|tree|trunk|branch|bridge|path|plant|stem|tendril)s?\b/i.exec(change)?.[0] ?? "the thing").toLowerCase();
      push({
        kind: "grow",
        from: prev ? Math.max(prev.from, prev.to - 1) : cur.from,
        to: Math.max(cur.to, cur.from + 1),
        what: `a ${subject} grows`,
        beats: [
          `the first stir: close on the ${subject} cracking and starting to move, earth splitting, a sound`,
          `the surge, the most spectacular panel of the sequence: a very tall panel, the ${subject} rising and twisting huge, glowing magic particles along it, earth and moss falling, the character tiny`,
          `the result: the new ${subject} whole, forming its path or bridge, wide`,
          "the character's reaction, or the first step onto it",
        ],
        min_panels: 3,
        sfx: SFX.grow,
        effects: ["a soft magical glow and floating light particles along the growing part", "earth, moss and small stones falling from it", "motion lines along the growth"],
      });
    }
    if (has(words(cur.changed, cur.action, cur.sound, cur.in_hands, cur.others_visible), RE_RING)) {
      const thing = (/\b(gong|bell|drum|anvil|shield|door|chime)\b/i.exec(words(cur.changed, cur.action, cur.sound, cur.others_visible))?.[0] ?? "gong").toLowerCase();
      push({
        kind: "strike",
        from: cur.from,
        to: Math.max(cur.to, cur.from + 1),
        what: `the ${thing} is struck`,
        beats: [`the mallet or the arm raised before the ${thing}`, `the blow: close on the contact with the ${thing}, the sound huge across the panel, rings of vibration rippling out`, "the echo: those who hear it, still, the sound fading"],
        min_panels: 3,
        sfx: SFX.gong,
      });
    }
    if (has(words(cur.changed, cur.action, cur.motion), RE_FIGHT) && significantNouns(cur.others_visible).length) {
      push({
        kind: "fight",
        from: cur.from,
        to: Math.max(cur.to, cur.from + 1),
        what: `a fight (${cur.others_visible})`,
        beats: ["the fighters locked together, both visible and recognisable, each drawn from its own sheet", "a blow landing, close on the contact, one sound effect", "the character watching or slipping away, small against them"],
        min_panels: 2,
        sfx: SFX.crash,
      });
    }

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
  // An appearance and a rise at the same seconds are one reveal: two lists of beats made the writer draw
  // the same colossal figure twice in a row. The rise keeps the glimpse first, then its own beats.
  const merged: StoryEvent[] = [];
  for (const event of events.sort((a, b) => a.from - b.from || a.to - b.to)) {
    if (event.kind === "appear") {
      const rise = events.find((e) => e.kind === "rise" && Math.abs(e.from - event.from) <= 3);
      if (rise) {
        if (!rise.beats[0].startsWith("a fragment")) rise.beats = [event.beats[0], ...rise.beats.slice(1)];
        continue;
      }
    }
    merged.push(event);
  }
  // One spectacle at a time: an appearance, a rise or a growth within fifteen seconds of another is the
  // same reveal seen again, not a new one (9:00 to 9:18: the Source revealed, risen and grown in turn).
  const BIG = new Set(["appear", "rise", "grow"]);
  return merged.filter((event, index) => !BIG.has(event.kind) || !merged.slice(0, index).some((e) => BIG.has(e.kind) && event.from - e.to <= 15));
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
  // The same onomatopoeia on three panels in a row reads as a stutter, not as a sound:
  // keep the first, drop the repeats until something else is heard.
  let previous = "";
  for (const panel of out) {
    const first = panel.sfx[0]?.text.en ?? "";
    if (first && first.toLowerCase() === previous.toLowerCase()) panel.sfx = panel.sfx.slice(1);
    if (first) previous = first;
  }
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


const wordsOf = (text: string) => new Set(text.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));

/**
 * Consecutive panels that say the same thing: the same second or the next,
 * the same people, the same framing, most of the same words. The later one
 * is dropped; an event keeps its beats because their words differ.
 */
export function dropRepeats<T extends { seconds: number; description?: string; characters?: string[]; shot_type?: string; title_card?: string }>(list: T[]): T[] {
  const out: T[] = [];
  for (const item of list) {
    const last = out[out.length - 1];
    if (last && !item.title_card && !last.title_card && Math.abs(Number(item.seconds) - Number(last.seconds)) <= 1 && (item.shot_type ?? "") === (last.shot_type ?? "") && [...(item.characters ?? [])].sort().join() === [...(last.characters ?? [])].sort().join()) {
      const a = wordsOf(String(item.description ?? "").split("STATE TO KEEP")[0]);
      const b = wordsOf(String(last.description ?? "").split("STATE TO KEEP")[0]);
      let shared = 0;
      for (const w of a) if (b.has(w)) shared += 1;
      if (shared / Math.max(1, Math.min(a.size, b.size)) > 0.62) continue;
    }
    out.push(item);
  }
  return out;
}

/** Seconds of film per panel by pace, outside the extra beats of the events. */
export const SECONDS_PER_PANEL = { action: 1.3, normal: 2.6, calm: 4 } as const;

/**
 * How many panels a stretch of film deserves: its length at the pace, plus
 * part of what its events need beyond two panels each. Frank found 14 panels
 * for 18 seconds (7:54 to 8:12) too many; this gives about 10.
 */
export function panelBudget(input: { from: number; to: number; events: Pick<StoryEvent, "from" | "to" | "min_panels">[]; pace: keyof typeof SECONDS_PER_PANEL }): number {
  const span = Math.max(1, input.to - input.from + 1);
  const extra = input.events.filter((e) => e.to >= input.from && e.from <= input.to).reduce((sum, e) => sum + Math.max(0, e.min_panels - 2), 0);
  return Math.max(3, Math.ceil(span / SECONDS_PER_PANEL[input.pace]) + extra);
}

/**
 * Brings a batch down to its budget, dropping the weakest panels first: a
 * reframe or bridge with no bubble, no sound effect and no title, whose
 * second is already told by a neighbour and whose description adds the
 * least to it. A panel that carries a line of the film, a sound or a title
 * card is never dropped, nor the last panel (where the next batch resumes),
 * nor a beat of an event already down to its minimum.
 */
export function trimToBudget<T extends { seconds: number; description?: string; characters?: string[]; title_card?: string; fidelity?: string; dialogue?: unknown[]; sfx?: unknown[]; narrative_role?: string }>(list: T[], budget: number, events: Pick<StoryEvent, "from" | "to" | "min_panels">[] = []): T[] {
  const out = [...list];
  const inEvent = (item: T) => events.find((e) => Number(item.seconds) >= e.from - 1 && Number(item.seconds) <= e.to + 1);
  const keeps = (item: T) => {
    if (item.title_card || (item.dialogue?.length ?? 0) > 0 || (item.sfx ?? []).some((x) => Number((x as { size?: number }).size ?? 0) >= 150)) return true;
    // One reveal and one establishing view are kept; the writer labels half a scene "reveal"
    // (9:00 to 9:18, the tree-being rising: twenty panels for twenty seconds).
    if (item.narrative_role === "reveal" || item.narrative_role === "establishing") return out.find((o) => o.narrative_role === item.narrative_role) === item;
    const event = inEvent(item);
    return Boolean(event && out.filter((o) => inEvent(o) === event).length <= event.min_panels);
  };
  const overlap = (a: T, b: T | undefined) => {
    if (!b) return 0;
    const wa = wordsOf(String(a.description ?? "").split("STATE TO KEEP")[0]);
    const wb = wordsOf(String(b.description ?? "").split("STATE TO KEEP")[0]);
    let shared = 0;
    for (const w of wa) if (wb.has(w)) shared += 1;
    return shared / Math.max(1, Math.min(wa.size, wb.size));
  };
  while (out.length > budget) {
    let worst = -1;
    let worstScore = Infinity;
    for (let i = 0; i < out.length - 1; i += 1) {
      const item = out[i];
      if (keeps(item)) continue;
      const prev = out[i - 1];
      const next = out[i + 1];
      const gap = Math.min(prev ? Math.abs(Number(item.seconds) - Number(prev.seconds)) : 99, next ? Math.abs(Number(next.seconds) - Number(item.seconds)) : 99);
      // Lower is weaker: close in time to a neighbour, redundant with it, a reframe or a bridge rather than the frame itself.
      const score = Math.min(gap, 4) - 3 * Math.max(overlap(item, prev), overlap(item, next)) + (item.fidelity === "direct" ? 1.5 : 0) - (item.characters?.length ? 0 : 0.5);
      if (score < worstScore) {
        worstScore = score;
        worst = i;
      }
    }
    if (worst < 0) break;
    out.splice(worst, 1);
  }
  return out;
}

/** A line of dialogue reduced to its words, to tell the same line in two panels. */
export function sameLine(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * A line of the film is lettered once. A subtitle held across several
 * frames came back as the same bubble in two or three panels in a row
 * (8:14 to 8:40: « Le plus maladroit, c'est certain. » three times); the
 * later copies are removed, also when the last panels already made carry it.
 */
export function dropRepeatedLines<T extends { dialogue?: { en?: string; fr?: string }[] }>(list: T[], earlier: string[] = []): T[] {
  const said = new Set(earlier.map(sameLine).filter(Boolean));
  for (const item of list) {
    if (!item.dialogue?.length) continue;
    item.dialogue = item.dialogue.filter((d) => {
      const keys = [d.fr, d.en].filter((x): x is string => Boolean(x)).map(sameLine).filter(Boolean);
      if (keys.some((k) => said.has(k))) return false;
      for (const k of keys) said.add(k);
      return true;
    });
  }
  return list;
}
