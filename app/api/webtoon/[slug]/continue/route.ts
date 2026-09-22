import { readFile } from "node:fs/promises";
import path from "node:path";
import { panelsFromIntents, type NextPanelIntent } from "@/lib/webtoon/continue";
import {
  bestFrameFor,
  coveredUntil,
  ensureSoundEffects,
  entityAssets,
  entitySheets,
  entitySlug,
  eventGaps,
  inHelmetEvent,
  eventsBrief,
  eventsOf,
  momentsOf,
  type Entity,
  type FrameNote,
  type Moment,
  type StoryEvent,
} from "@/lib/webtoon/continuity";
import { recordCost } from "@/lib/webtoon/cost-server";
import { completeJson, type UserPart } from "@/lib/webtoon/providers/gateway-text";
import { libraryCharacters, libraryLocations, libraryObjects, libraryWith } from "@/lib/webtoon/references";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { STUDIO_SCREENPLAY, studioFilmFramesDense } from "@/lib/webtoon/studio-assets";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { LibraryOverlay, ReferenceAsset, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/continue
 * Body: { count: number, panels: WebtoonPanel[], library?: LibraryOverlay, pace?, until_seconds? }
 * Writes one batch of panels per call (at most `BATCH`); `remaining` says
 * how many of `count` are still to write, and the caller calls again with
 * the panels it now has (and the library, with the sheets it drew).
 *
 * The pipeline of one batch:
 * 1. the continuity supervisor reads the next frames of the film one by one
 *    (place, who, helmet, posture, what is in the hands, what else is there
 *    and how big, what moves, what is heard), a focused check reads the
 *    helmet, and the helmet track is computed and imposed;
 * 2. the frames are merged into moments, the moments into events (a helmet
 *    knocked off, an object opened and thrown, a fall, a blow, a machine
 *    that appears and rises, a run), and the window is cut where the batch
 *    has enough panels to tell them;
 * 3. the entities of the window (objects, creatures, machines) are resolved
 *    against the library; the ones with no sheet are returned as sheets to
 *    draw (`new_assets`), so they stay the same panel after panel;
 * 4. the writer gets the moments, the events with their required beats,
 *    the entity ids, the screenplay and the frames, and answers with panel
 *    intents; the coverage and invention checks run together, then one fix
 *    call adds the missing beats and rewrites the contradictions;
 * 5. the engine composes the panels, forces the helmet state, attaches the
 *    frame where each object or creature is seen best, writes the scale of
 *    a colossal thing into the prompt and letters the sounds the writer
 *    forgot (an impact without its BAM reads as a pose).
 * No image is made here.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };

const MAX_COUNT = 30;
const MAX_FRAMES = 32;
/** Panels asked per model call: a longer answer gets cut by the gateway. */
const BATCH = 8;
/** The batch grows to this when the events of the window need more panels than asked. */
const BATCH_MAX = 11;
/** Frames are one second apart; these are frames per panel by pace (about 2 s, 4 s and 6 s of film per panel). */
const FRAMES_PER_PANEL = { action: 2, normal: 4, calm: 6 } as const;

type CostMeter = { usd: number };

/**
 * First pass: read every frame of the window, one by one, and write down
 * what is literally visible with the screenplay line it matches. The writer
 * then plans from these notes, so the state of the characters, the objects
 * in their hands and the size of what stands next to them are read from
 * the image and not guessed.
 */
async function analyzeFrames(input: {
  script: NonNullable<ReturnType<typeof getWebtoonScript>>;
  screenplay: string;
  frames: { seconds: number; label: string; src: string }[];
  characters: string[];
  objects: string[];
  meter: CostMeter;
}): Promise<FrameNote[]> {
  const system = [
    `You are the continuity supervisor of "${input.script.series}", episode ${input.script.episode}, an original anime being adapted into a webtoon. You receive frames of the finished episode taken every second, each labelled with its timecode, and the screenplay in French. The film and the screenplay match, but the film shows gestures the screenplay does not spell out: the frames win for what is visible.`,
    `Characters of the series: ${input.characters.join(" | ")}.`,
    input.objects.length ? `Objects of the series already on file: ${input.objects.join(" | ")}. Name them by these names when you see them.` : "",
    "For EACH frame, in order, write what is literally visible, without interpretation: `place` (the location: underground blue forest, altar sanctuary, white lily field, or a short description), `characters` (ids of the characters visible, empty if nobody), `helmet` (for Lanterne: \"on his head\", \"on the ground\", \"in his hands\", \"not visible\"; for other characters, ignore), `posture` (standing, walking, running, kneeling, collapsed face down, lying on his back, climbing, sitting, falling), `action` (what the frame shows happening), `in_hands` (what a hand actually holds, described by its real shape, material and colour as seen, and what the hand does with it: takes it out, opens it, holds it up, throws it; an arm swept out wide with the object gone from the hand right after is a throw; \"nothing\" when the hands are empty), `others_visible` (anything else in the frame that matters: a creature, a machine, a branch, a claw, an eye; named the same way from frame to frame), `scale` (when a creature, a machine or a structure is visible with a character: its size compared to him, in words, e.g. \"the machine's body alone is ten times his height; one claw is as big as he is\"; empty otherwise), `motion` (what moves and how: nothing moves; slow; fast; violent; and what exactly: \"the machine lifts its body on its legs, debris falls\"), `sound` (what would be heard at this instant: silence; a metallic clang; footsteps on moss; a deep mechanical roar; roots cracking; electricity crackling), `title_card` (the exact text when the frame is a title or logo card on a plain background, else null), `screenplay_line` (the line of the screenplay this moment corresponds to, quoted in French).",
    "Objects, strict. Never name an object you do not clearly see; never guess a paper, a letter, a note, a map or a book: this series has none in this episode. The small pale rectangular plate on Lanterne's chest is a metal plate of his armour, riveted on, not a paper. A round silver disc on a thin chain, that opens like a watch, is his pendant. When a hand covers the chest, write \"a hand pressed on the chest plate\", not an object. If you are not sure what is held, describe only its shape and colour and add \"(unclear)\".",
    "Be exact about the helmet and the posture: these decide how the character is drawn in the panels. Look above the cream scarf: a pale lantern-shaped helmet with two dark oval holes means \"on his head\"; a dark round opening with nothing above the scarf means the helmet is off (then say where it is: on the ground, in his hands, or not visible). A frame that shows only the armour from behind with an arm reaching out and nothing above the shoulders is headless. Consistency check before answering: from the first frame where the helmet is off until the frame where both his hands hold it up to his neck (he puts it back), every frame with Lanterne is headless; re-examine any frame in between that you were about to mark \"on his head\". If a frame is black or shows only text, say so.",
    "Be exact about size and movement: a colossal thing must be written as colossal with a comparison to the character, every frame it is visible; a thing that rises, unfolds, leans, strikes or runs must have that movement in `motion` and its sound in `sound`, because the panels will be still images and the reader must see the movement and hear the sound.",
    `Continuity facts of the series: ${input.script.source.continuity.join(" ")}`,
    'Answer with JSON only: {"frames": [ {seconds, place, characters, helmet, posture, action, in_hands, others_visible, scale, motion, sound, title_card, screenplay_line} ]}, one entry per frame, in the order given. Escape double quotes inside strings.',
  ]
    .filter(Boolean)
    .join("\n\n");
  const frameParts: UserPart[][] = await Promise.all(
    input.frames.map(async (frame): Promise<UserPart[]> => [
      { type: "text", text: `Frame at ${frame.label} (${frame.seconds} s)` },
      { type: "image_url", image_url: { url: await frameAsDataUrl(frame.src) } },
    ]),
  );
  const user: UserPart[] = [
    { type: "text", text: `Screenplay of the episode (French):\n${input.screenplay}` },
    { type: "text", text: `Frames, in order:` },
    ...frameParts.flat(),
    { type: "text", text: `Describe each of the ${input.frames.length} frames now, as JSON.` },
  ];
  const result = await completeJson<{ frames?: FrameNote[] }>({ system, user, maxTokens: 16000, reasoning: "none", onCost: (usd) => { input.meter.usd += usd; } });
  return (result.frames ?? []).filter((f) => f && Number.isFinite(Number(f.seconds)));
}

/**
 * One focused question per frame, in parallel: is the helmet on his head?
 * A single image and a yes/no question read far better than a sheet of
 * sixteen, and the answer overrides the supervisor's `helmet` note.
 */
/** Two frames the checker compares against: the helmet on (1:25) and the hollow neck (2:25). */
const HELMET_EXAMPLES = { on: "/webtoon/ep1-opening/film/01m25s.jpg", off: "/webtoon/ep1-opening/film/02m25s.jpg" };

async function helmetChecks(frames: { seconds: number; src: string }[], meter: CostMeter): Promise<Map<number, "on" | "off" | "unsure" | "absent">> {
  const [exampleOn, exampleOff] = await Promise.all([frameAsDataUrl(HELMET_EXAMPLES.on), frameAsDataUrl(HELMET_EXAMPLES.off)]);
  const results = await Promise.all(
    frames.map(async (frame) => {
      try {
        const answer = await completeJson<{ lanterne_visible?: boolean; helmet_on_head?: boolean; helmet_elsewhere?: string }>({
          system:
            'You check one frame of an anime. Lanterne is a hollow suit of armour with a cream scarf around the neck. Image A shows him WITH his head: a pale cylindrical lantern-shaped helmet with two dark oval holes sits above the scarf. Image B shows him WITHOUT his head: above the scarf there is only a dark round opening into the empty armour, nothing else; the helmet may lie on the ground beside him. Compare the third image to A and B. Answer with JSON only: {"lanterne_visible": true|false, "helmet_on_head": true|false, "helmet_elsewhere": "on the ground" | "in his hands" | "not visible"}. helmet_on_head is true only when the pale helmet with its eye holes sits above the scarf as in A. A dark opening above the scarf as in B, or shoulders with nothing above them, means false.',
          user: [
            { type: "text", text: "Image A, helmet ON his head:" },
            { type: "image_url", image_url: { url: exampleOn } },
            { type: "text", text: "Image B, WITHOUT his head, the neck open and empty:" },
            { type: "image_url", image_url: { url: exampleOff } },
            { type: "text", text: "The frame to check: is the helmet on his head here, as in A, or is the neck open as in B?" },
            { type: "image_url", image_url: { url: await frameAsDataUrl(frame.src) } },
          ],
          maxTokens: 200,
          reasoning: "none",
          temperature: 0,
          onCost: (usd) => { meter.usd += usd; },
        });
        // "off" is strong only when the helmet is seen somewhere else (the ground, his hands): the top of the
        // helmet seen from above, or a head cut by the frame, reads as a dark opening and would remove it wrongly.
        const elsewhere = String(answer.helmet_elsewhere ?? "").toLowerCase();
        const state: "on" | "off" | "unsure" | "absent" = !answer.lanterne_visible ? "absent" : answer.helmet_on_head ? "on" : /ground|hand/.test(elsewhere) ? "off" : "unsure";
        return [frame.seconds, state] as const;
      } catch {
        return [frame.seconds, "absent"] as const;
      }
    }),
  );
  const map = new Map<number, "on" | "off" | "unsure" | "absent">();
  for (const [seconds, state] of results) map.set(seconds, state);
  return map;
}

/**
 * The entities of the window: every object, creature, machine or character
 * the notes mention, resolved to the library (same id) or declared new with
 * a design lock read from the frames. Terrain (branches, roots, mushrooms,
 * mist) is not an entity. New entities become sheets the studio draws.
 */
async function resolveEntities(input: { notes: FrameNote[]; library: ReferenceAsset[]; frames: { seconds: number; src: string }[]; meter: CostMeter }): Promise<Entity[]> {
  const mentions = input.notes
    .map((n) => ({ seconds: Number(n.seconds), characters: n.characters ?? [], in_hands: n.in_hands ?? "", others: n.others_visible ?? "", scale: n.scale ?? "" }))
    .filter((m) => m.characters.length || (m.in_hands && !/^\s*(nothing|none|empty)/i.test(m.in_hands)) || m.others.trim());
  if (!mentions.length) return [];
  const known = [
    ...input.library.filter((a) => a.kind === "character" && a.subject).map((a) => ({ id: a.subject as string, kind: "character" as const, name: a.name.split(",")[0], must_keep: a.must_keep.slice(0, 160) })),
    ...input.library.filter((a) => a.kind === "object").map((a) => ({ id: a.id.replace(/^obj\./, ""), kind: "object" as const, name: a.name.split(",")[0], must_keep: a.must_keep.slice(0, 160) })),
  ].filter((k, i, all) => all.findIndex((x) => x.id === k.id && x.kind === k.kind) === i);
  // The clearest frames of the window, so the design lock of a new entity is read from the image and not from the notes alone.
  const sample = input.frames.filter((_, i) => i % 3 === 0).slice(0, 8);
  const frameParts: UserPart[][] = await Promise.all(
    sample.map(async (frame): Promise<UserPart[]> => [
      { type: "text", text: `Frame at ${frame.seconds} s` },
      { type: "image_url", image_url: { url: await frameAsDataUrl(frame.src) } },
    ]),
  );
  try {
    const answer = await completeJson<{ entities?: { ref?: string | null; kind?: string; name?: string; must_keep?: string; seconds?: number[]; best_seconds?: number[]; scale?: string; creature?: boolean }[] }>({
      system: [
        "You keep the registry of everything that appears in a film being adapted into a webtoon, so that each thing is drawn the same way in every panel. You get the continuity notes of a window of frames (who is visible, what is in the hands, what else is there, how big), some of the frames, and the library of things that already have a design sheet.",
        "List every ENTITY of the window: a character, a creature, a machine, or an object that is held, used, thrown or that the story follows. Not an entity: terrain and scenery (a branch, a root, a mushroom, mist, trunks, stones, flowers, light), body parts, clothing that belongs to a character, and Lanterne's helmet while it is on his head (the fallen helmet alone on the ground IS an object entity, id `helmet`).",
        "For each entity: `ref` is the id of the library entry when it is the same thing (the library ids are given; match on meaning: \"a silver pendant on a chain\" is the library's pendant), else null. `kind` is `character` for anything alive or any creature, monster or machine, `object` for a thing. `name` is short in English. `must_keep` is a precise DESIGN LOCK in English written from the frames: overall shape, proportions, materials, colours, distinctive parts, how it opens or moves, and for a creature or machine its size compared to Lanterne. `seconds` lists every second where it is visible; `best_seconds` the two or three seconds where it is seen best (largest, clearest, its whole shape). `scale` is its size compared to Lanterne, in words, for a creature, machine or structure. `creature` is true for a creature, monster or machine.",
        'Answer with JSON only: {"entities": [ {ref, kind, name, must_keep, seconds, best_seconds, scale, creature} ]}. Escape double quotes inside strings.',
      ].join("\n\n"),
      user: [
        { type: "text", text: `LIBRARY (id, kind, name, design lock):\n${JSON.stringify(known, null, 1)}` },
        { type: "text", text: `NOTES of the window:\n${JSON.stringify(mentions, null, 1)}` },
        { type: "text", text: "Some frames of the window:" },
        ...frameParts.flat(),
        { type: "text", text: "List the entities now, as JSON." },
      ],
      maxTokens: 6000,
      reasoning: "none",
      temperature: 0,
      onCost: (usd) => { input.meter.usd += usd; },
    });
    const entities: Entity[] = [];
    for (const raw of answer.entities ?? []) {
      if (!raw || typeof raw.name !== "string" || !raw.name.trim()) continue;
      const kind: Entity["kind"] = raw.kind === "object" ? "object" : "character";
      const ref = typeof raw.ref === "string" ? raw.ref.trim().toLowerCase().replace(/^(obj|char)\./, "").replace(/\.webtoon$/, "") : "";
      const match = ref ? known.find((k) => k.id === ref && k.kind === kind) ?? known.find((k) => k.id === ref) : undefined;
      const id = match?.id ?? entitySlug(raw.name);
      if (!id) continue;
      const seconds = (Array.isArray(raw.seconds) ? raw.seconds : []).map(Number).filter((s) => Number.isFinite(s));
      const best = (Array.isArray(raw.best_seconds) ? raw.best_seconds : []).map(Number).filter((s) => Number.isFinite(s));
      const entity: Entity = {
        id,
        kind: match?.kind ?? kind,
        name: match?.name ?? raw.name.trim(),
        must_keep: (typeof raw.must_keep === "string" && raw.must_keep.trim()) || match?.must_keep || raw.name.trim(),
        seconds,
        best_seconds: best.length ? best : seconds.slice(0, 2),
        // Only a creature, a machine or a structure carries a scale; a character's "human-sized" or "reference scale" is noise in a prompt.
        scale:
          (raw.creature === true || (match && input.library.some((a) => (a.subject === match.id || a.id === `obj.${match.id}`) && a.tags.some((t) => /creature|machine|monster/i.test(t))))) &&
          !(match && input.library.some((a) => a.subject === match.id && !a.tags.some((t) => /creature|machine|monster/i.test(t)))) &&
          typeof raw.scale === "string" &&
          raw.scale.trim() &&
          !/^\s*(none|n\/a|-)\s*$|reference/i.test(raw.scale)
            ? raw.scale.trim()
            : undefined,
        has_sheet: entitySheets({ id, kind: match?.kind ?? kind }, input.library).some((a) => a.image),
        creature: raw.creature === true,
      };
      if (!entities.some((e) => e.id === entity.id && e.kind === entity.kind)) entities.push(entity);
    }
    return entities;
  } catch {
    return [];
  }
}

/**
 * Coverage and invention in one pass: which moments and which required event
 * beats no panel tells, and which panels show something the moments do not
 * contain. Both feed one fix call.
 */
async function reviewPanels(input: { moments: Moment[]; events: StoryEvent[]; intents: NextPanelIntent[]; meter: CostMeter }): Promise<{ missing: { seconds: number; moment: string }[]; invented: { index: number; problem: string }[] }> {
  if (!input.moments.length || !input.intents.length) return { missing: [], invented: [] };
  const momentsText = JSON.stringify(input.moments.map((m) => ({ from: m.from, to: m.to, characters: m.characters, helmet: String(m.helmet ?? "").slice(0, 3), posture: m.posture, in_hands: m.in_hands, action: m.action, others: m.others_visible, motion: m.motion, sound: m.sound, title_card: m.title_card })), null, 1);
  const [coverage, invention] = await Promise.all([
    completeJson<{ missing?: { seconds: number; moment: string }[] }>({
      system:
        'You check the coverage of a webtoon sequence. You get the moments of a film window (what is literally visible: place, posture, what is in the hands, what happens; consecutive identical frames already merged), the EVENTS that must be told with their required beats, and the panels written for that window. List what NO panel tells: a gesture, an object taken out, opened, held up or thrown, a creature appearing or leaving, a machine rising, a blow, a fall, a change of posture, a title card, and each required beat of an event that has no panel. A moment is covered when some panel clearly shows it, even from another angle. Ignore differences of framing. A still moment that spans several frames is covered by one panel: never ask for one panel per frame. Answer with JSON only: {"missing": [{"seconds": <frame seconds>, "moment": "<what the panels should show>"}]}, an empty list when everything is covered.',
      user: `MOMENTS:\n${momentsText}\n\nEVENTS AND REQUIRED BEATS:\n${eventsBrief(input.events) || "none"}\n\nPANELS:\n${JSON.stringify(input.intents.map((i) => ({ seconds: i.seconds, description: i.description, action: i.action, sfx: (i.sfx ?? []).map((s) => s.en) })), null, 1)}`,
      maxTokens: 4000,
      reasoning: "none",
      onCost: (usd) => { input.meter.usd += usd; },
    }).catch(() => ({ missing: [] })),
    completeJson<{ invented?: { index: number; problem: string }[] }>({
      system:
        'You check a webtoon sequence against the film. You get the moments of a film window (what is literally visible, consecutive identical frames merged) and the panels written for it, numbered by index. List the panels that show something the moments at their seconds do NOT contain: a different posture (walking when he kneels), a gesture that is not there (raising the helmet, throwing, striking), an object that is not in the hands or a different object (a paper where the notes say a pendant), a character who is not visible, a place that changes. A closer or wider framing of the same thing, a reaction, a detail of the surroundings, a beat of an event told from the nearest frame are fine. Answer with JSON only: {"invented": [{"index": <panel index>, "problem": "<what contradicts the moment, and what the moment shows instead>"}]}, an empty list when all is consistent.',
      user: `MOMENTS:\n${momentsText}\n\nPANELS:\n${JSON.stringify(input.intents.map((i, index) => ({ index, seconds: i.seconds, description: i.description, action: i.action, objects: i.objects })), null, 1)}`,
      maxTokens: 4000,
      reasoning: "none",
      temperature: 0,
      onCost: (usd) => { input.meter.usd += usd; },
    }).catch(() => ({ invented: [] })),
  ]);
  const missing = [...(coverage.missing ?? []).filter((m) => m && Number.isFinite(Number(m.seconds)) && typeof m.moment === "string"), ...eventGaps(input.events, input.intents)].slice(0, 10);
  const invented = (invention.invented ?? []).filter((m) => m && Number.isInteger(Number(m.index)) && typeof m.problem === "string").slice(0, 8);
  return { missing, invented };
}

/** True when the text says the helmet is off (headless), false when it says it is on, null when it says nothing. */
function helmetFromText(text: string): boolean | null {
  if (/headless|without (his )?helmet|helmet (is )?(off|on the ground|lying|in his hands|beside him)|no head|empty neck|open neck|hollow neck/i.test(text)) return true;
  if (/helmet (is |now |back )*on( his head)?|puts? (the |his )?helmet back|helmet restored|helmet secured/i.test(text)) return false;
  return null;
}

/** The helmet state per second of the window: "off" (headless) or "on". */
function helmetTrack(notes: FrameNote[], previous: WebtoonPanel[]): Map<number, "off" | "on"> {
  let off = false;
  for (let i = previous.length - 1; i >= 0; i -= 1) {
    const read = helmetFromText(`${previous[i].description} ${previous[i].purpose}`);
    if (read !== null) {
      off = read;
      break;
    }
  }
  const sorted = [...notes].sort((a, b) => Number(a.seconds) - Number(b.seconds));
  const readings = sorted.map((n) => {
    const h = (n.helmet ?? "").toLowerCase();
    if (!(n.characters ?? []).includes("lanterne")) return "absent" as const;
    if (h.includes("on his head")) return "on" as const;
    // "not visible" or a bare "off" is weak (a head out of frame, the top of the helmet seen from above): the state holds.
    if (h.includes("ground") || h.includes("in his hands") || h.includes("headless")) return "off" as const;
    return "unknown" as const;
  });
  const track = new Map<number, "off" | "on">();
  for (let i = 0; i < sorted.length; i += 1) {
    const r = readings[i];
    if (r === "off") {
      // Symmetric: after "on", the helmet only comes off through a visible event (knocked off,
      // falls, rolls, taken off) or three consecutive readings; a head cut by the frame reads "off" wrongly.
      const text = `${sorted[i].action ?? ""} ${sorted[i].in_hands ?? ""} ${sorted[i].others_visible ?? ""} ${sorted[i].motion ?? ""}`;
      const comesOff = /helmet/i.test(text) && /(knock|fall|falls|falling|roll|rolls|drop|drops|slip|slips|comes off|flies|take|takes|taking|remove|removes|pull)/i.test(text);
      const following = readings.slice(i + 1).filter((x) => x !== "absent" && x !== "unknown").slice(0, 2);
      const stableOff = following.length === 2 && following.every((x) => x === "off");
      if (off || comesOff || stableOff) off = true;
    } else if (r === "on") {
      // The helmet goes back on through a visible gesture (both hands placing it), or when three
      // consecutive readings of Lanterne say "on": one or two isolated "on" after "off" are misreads.
      const text = `${sorted[i].action ?? ""} ${sorted[i].in_hands ?? ""} ${sorted[i].posture ?? ""} ${sorted[i].motion ?? ""}`;
      const putsBack = /helmet/i.test(text) && /(put|puts|putting|place|places|placing|set|sets|setting|lift|lifts|lifting|rais|lower|lowers|lowering|slide|slides|press|presses).*(on|onto|over|back|head|neck|shoulders)|helmet (is )?back on|back on his head/i.test(text);
      const following = readings.slice(i + 1).filter((x) => x !== "absent" && x !== "unknown").slice(0, 2);
      const stable = following.length === 2 && following.every((x) => x === "on");
      if (!off || putsBack || stable) off = false;
    }
    track.set(Number(sorted[i].seconds), off ? "off" : "on");
  }
  return track;
}

function nearestSecond(track: Map<number, "off" | "on">, seconds: number): number {
  let best = Number.NaN;
  for (const key of track.keys()) if (Number.isNaN(best) || Math.abs(key - seconds) < Math.abs(best - seconds)) best = key;
  return best;
}

/**
 * Where to cut the window so the batch can tell it: one panel per moment,
 * plus the extra panels each event needs. The last moment kept is where the
 * next call resumes, so no second of film is skipped or rushed.
 */
function cutWindow(moments: Moment[], events: StoryEvent[], budget: number): { end: number; needed: number } {
  let needed = 0;
  let end = moments.length ? moments[0].to : 0;
  for (const moment of moments) {
    const cost = 1 + events.filter((e) => e.to >= moment.from && e.to <= moment.to).reduce((sum, e) => sum + Math.max(0, e.min_panels - 1), 0);
    // Never cut inside an event: a blow told without its consequence is what the reader cannot follow.
    const straddles = events.some((e) => e.from <= end && e.to > end);
    if (needed && needed + cost > budget && !straddles) break;
    needed += cost;
    end = moment.to;
  }
  return { end, needed: Math.max(1, needed) };
}

function writerSystem(input: { script: NonNullable<ReturnType<typeof getWebtoonScript>>; batch: number; characters: string[]; locations: string[]; objects: string[]; pace?: "calm" | "normal" | "action" }): string {
  const { script, batch, characters, locations, objects, pace = "normal" } = input;
  return [
    `You are the adaptation engine of "${script.series}", an original poetic dark fantasy anime by Frank Houbre, being redrawn as a vertical Korean-style webtoon read on a phone. Episode ${script.episode}. You write the NEXT ${batch} panels of the strip, continuing exactly where it stops.`,
    "You receive: the last panels already made (for continuity), the MOMENTS of the next seconds of the film as noted by a continuity supervisor (frames taken every second, identical consecutive frames merged), the EVENTS of those seconds with the beats each must be told in, the ENTITIES visible (objects, creatures, machines, with the ids to use), the frames themselves, and the screenplay of the episode in French.",
    "Two sources, both authoritative, and they match: the film (the frames and the notes) and the screenplay. Method: first find the passage of the screenplay that corresponds to the frames. Then cover EVERY moment and EVERY event beat, in order, and only the seconds given: the window is cut so that your panels fit it; the last panel lands on the last moment, where the next call continues. Each panel gives the timecode of its frame in `seconds` and quotes the screenplay line it comes from in `screenplay_line`. Never skip a moment where something changes, never jump ahead, never invent an action that is in neither source.",
    "How many panels a moment gets. A moment is a stretch of film where the same thing is true (`from` to `to` in seconds, `frames` how many). ONE panel per moment, whatever its length: a character who walks for eight seconds is one panel, not eight. A second panel only when the moment lasts more than six seconds and deserves another angle (a wide one then a detail), or when its action changes inside it. The beats of an EVENT are the exception: each one is its own panel, always. Two panels of the same moment must never describe the same thing twice: if you cannot say what the second one adds, do not write it.",
    "Events are told in pieces, always. An impact, a fall, an object that drops or rolls, a blow on the ground, a hand that grabs, a machine that rises, a reveal: never one panel. The EVENTS block gives the beats: the cause (a detail of what is about to hit), the impact (an extreme close-up on the point of contact with ONE big sound effect, `sfx.size` 180 to 320, with a `rotate`), the consequence (the helmet rolling, the dirt thrown up, the object flying), the reaction (the character frozen, the body bent). Each beat is its own panel with fidelity `reframe` or `bridge`, drawing from the nearest frame for light and place. A reader must be able to say what happened from the pictures alone.",
    "Sound. Every impact, blow, fall, roar, crack and run carries sound effects in the lettering (`sfx`): one giant one on an impact, and in a run or a chase two or three smaller ones scattered across the panel (footsteps on moss, roots cracking, his own metal rattling, the roar behind) with different rotations. Also fill `sound` with what would be heard in the panel, in words, even when you letter nothing (\"silence\" when nothing). A panel of an action sequence without any sound effect is a mistake.",
    "Movement. A panel is a still image: say in `motion` how much moves (none, slow, fast, violent) and in `effects` what must be drawn to show it (speed lines, debris, dust, electric arcs, sparks). When a machine or a creature rises, unfolds, leans or strikes, the panel BEFORE shows it as it was, the panel of the movement shows the limbs mid-movement with debris falling and motion lines, the panel AFTER shows its new height against the character. Never describe a movement with a static standing pose.",
    "Scale. When something colossal is in the panel (a machine, a giant, a chasm), write its size against the character in `scale_note` (\"the machine: twenty times his height, one leg thicker than a trunk; Lanterne the size of one of its rivets\") and compose for it: the character tiny at the bottom, low angle, the thing overflowing the frame. The reveal of a colossal thing is the tallest panel of the sequence (`aspect_ratio` `9:16` or `panel_height` 2200 to 2600, full width), preceded by a fragment glimpsed first (a leg, a claw, an eye huge in the foreground, the character small behind) and followed by the reaction.",
    "Objects and creatures, strict. Every object in a hand and every creature or machine named in ENTITIES has a design sheet attached to the panel when you put its id in `objects` (objects) or in `characters` (creatures, machines): always do it, in every panel where it is visible, even partly. Draw what the notes say is there and nothing else: no paper, letter, note or map exists in this episode; the pale plate on Lanterne's chest is armour. An object taken out, opened, looked at, thrown gets its own panels, followed to the end.",
    "Continuity of state, strict. The `helmet` field of the moments is computed from the whole sequence and is the truth: when it says OFF, Lanterne is headless in that panel, whatever the character sheet shows and even if the head is out of frame; never write \"helmet on\" or \"helmet back on\" for a moment marked OFF. Carry the state of each character from panel to panel and write it in every `description` and in `state`. Once the helmet is on the ground, Lanterne is drawn WITHOUT his helmet in every panel until the panel where he puts it back: a hollow suit of armour with the cream scarf around an open, empty neck, no head, nothing inside; the helmet lies where it fell and is shown or implied. The same for kneeling, holding an object, an injury, a torn cape: a state changes only when the film or the screenplay changes it. A note saying the helmet is \"not visible\" means the frame does not include the head, nothing more.",
    "Not every panel shows a character. One panel in four or five is an illustration or an atmosphere panel with nobody in it: the place, the light, a detail of the environment, an object on the ground (the fallen helmet alone, the pendant where it landed). Use them for silences, for a change of place and to let the reader breathe.",
    "Title cards. When the film shows the title of the series or a logo, make a title card panel instead of an image: `title_card` set to the exact text (for this series: \"LOST GARDEN\"), background black, transition fade_to_black, no description needed. Never ask the image model to draw text.",
    "Rhythm of a webtoon: a wide establishing panel each time the place changes, close-ups on gestures, details on objects, an almost empty panel for a silence, a tall panel for a fall or a vertical space. Never lose the reader: when the place, the subject or the direction changes, add a connective panel (an establishing view, an insert on what the character looks at, a reaction, a step, a hand, a sound in the dark).",
    "Layout, like a real webtoon. Break the stack of full-width rectangles with `frame`: `width` in percent (40 to 100), `align` (left, center, right), `shape` (rect, rounded, slant, slant-reverse, wedge, wedge-reverse), `overlap` (px, the panel rides over the one above, 60 to 300), `tilt` (degrees, -6 to 6), `shadow`. A landscape or a reveal is full width (100, shape rect or wedge); a detail or a reaction is narrow (50 to 72) pushed left or right, often overlapping the big panel above by 100 to 200 px, rounded or slanted; two or three narrow panels in a row alternate sides like a zigzag; an impact gets slant edges and a small tilt; a quiet moment gets a centered rounded panel with margins; keep full width for at most half of the panels.",
    "Action and threat: make the reader feel it. When something threatens or attacks (a machine that wakes, a chase, a fall, a blow), tell every second in three to five panels: the threat rising in the background while the character does not see it yet; a detail of the threat huge in the foreground with the character tiny behind; the character turning, backing away, the first step of the run; extreme close-ups of the eye holes, the hands, the feet hitting the moss; the threat from below, low angle, dutch angle; the character from above, small; a wide shot of the two with the distance closing; the impact panel with a giant sound effect; then the breath after. Mini panels in rapid succession (`3:1` and `16:9`, 300 to 450 px, continuous or hard_cut, no gap) with one very tall panel for the peak. Diagonals, tilted horizon (`tilt` 3 to 6, shape slant), cape and limbs stretched by motion. Never a calm medium shot in the middle of a chase.",
    pace === "action"
      ? `THIS BATCH IS AN ACTION SEQUENCE: ${batch} panels for the few frames given, three to five per moment, dense, dynamic, sounds in every panel, no calm panel except the last breath.`
      : pace === "calm"
        ? "This batch is a calm sequence: one to two panels per moment, wide and quiet, silence between them."
        : "",
    "Scale of the panels. Vary them strongly and say it in `aspect_ratio` (and `panel_height` up to 2600 when you want it taller than the ratio gives): mini panels in quick succession for details and beats (`3:1` or `16:9`, 300 to 500 px), standard panels (`4:5`) for the action, very tall full-bleed panels (`9:16`, or `panel_height` 2200 to 2600) for what must feel immense. Use `focal_point` (percent) to say what must stay in frame when the panel crops the image.",
    "Location, strict: look at each frame and name the place actually visible. The sheet of the location you name is attached to the prompt and its design is copied into the background, so a wrong location paints the wrong place. Use `altar-sanctuary` only when the altar or the rose window is visible; use `blue-forest` for the cavern forest of black trunks, roots and glowing mushrooms; use `white-lily-field` for the white memory; otherwise create a short new id in lower case with hyphens and describe the place in the panel description. Never copy the location of the previous panel without checking the frame.",
    `Characters with a design sheet (use these exact ids in "characters"): ${characters.join(" | ")}. Lanterne never speaks, never stumbles, emits no light and has no face inside the helmet. Rose is a small calm child. Other characters may be named in lower case and must then be described in the panel description.`,
    objects.length ? `Objects with a design sheet (use these ids in "objects", without prefix): ${objects.join(" | ")}.` : "",
    `Locations with a sheet (use the id in "location" when the scene is there, otherwise a short new id in lower case with hyphens, described in the panel): ${locations.join(" | ")}.`,
    `Continuity of the series: ${script.source.continuity.join(" ")}`,
    "Page background: `white` for the white memory world, `black` for the underground; `abyss` only for a fall into the deep.",
    "Shot types: extreme_wide, wide, full, medium, medium_close_up, close_up, extreme_close_up, detail, void. Angles: eye_level, low, high, top_down, dutch, over_the_shoulder, worm. Narrative roles: breath, establishing, character_intro, action, reaction, dialogue, detail, reveal, transition, tension, cliffhanger. Transitions (the space before the panel): continuous, cut, beat, breath, hard_cut, fall, fade_to_black, fade_to_white, time_skip.",
    "Lettering: dialogue only when the screenplay has a line at that moment, written in English in `en` and in French in `fr`, spoken and short; `style` speech, whisper, thought, shout or off; `speaker` is the character's name. Captions are rare (narration, a place, a time). Sound effects (`sfx`, style soft, hard or rumble) as an English onomatopoeia in `en` and a French one in `fr`, with `size` (96 normal, 180 to 320 for an impact) and `rotate`. Anchors are percentages of the panel: `anchor: {x, y}`.",
    "Write `description` as one or two precise sentences of what the panel shows (subject, pose, framing, light, what is in the background, what is in the hands), `action` as the movement or its absence, `emotion` in a few words, `composition` as where the eye goes, `purpose` as why the panel exists. Each panel must be understandable on its own from the image and its sound effects. Never use an em dash.",
    `Answer with JSON only: {"panels": [ {seconds, screenplay_line, state, description, action, emotion, purpose, characters, objects, location, shot_type, camera_angle, composition, motion, effects, sound, scale_note, aspect_ratio, panel_height, bleed, focal_point: {x, y}, frame: {width, align, shape, overlap, tilt, shadow}, narrative_role, transition_type, fidelity, background, title_card, dialogue: [{speaker, style, en, fr, anchor}], caption: [{style, en, fr, anchor}], sfx: [{style, en, fr, anchor, size, rotate}]} ] } with exactly ${batch} panels (a title card counts as one). Escape every double quote inside a string value; no comments, no trailing commas.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function frameAsDataUrl(src: string): Promise<string> {
  const bytes = await readFile(path.join(process.cwd(), "public", src));
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

const isUsable = (i: NextPanelIntent | undefined): i is NextPanelIntent => Boolean(i && ((typeof i.title_card === "string" && i.title_card.trim()) || (typeof i.description === "string" && i.description.trim())));

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  const script = getWebtoonScript(slug);
  if (!script) return Response.json({ error: "unknown webtoon script" }, { status: 404 });
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: "AI_GATEWAY_API_KEY is not configured on this deployment" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { count?: number; panels?: WebtoonPanel[]; library?: LibraryOverlay; pace?: "calm" | "normal" | "action"; until_seconds?: number };
  const pace: "calm" | "normal" | "action" = body.pace === "calm" || body.pace === "action" ? body.pace : "normal";
  // `until_seconds: null` (the open-ended "next panels" of the studio) must stay open: Number(null) is 0.
  const until = body.until_seconds !== null && body.until_seconds !== undefined && Number.isFinite(Number(body.until_seconds)) ? Number(body.until_seconds) : null;
  const overlay = body.library && Array.isArray(body.library.assets) ? { assets: body.library.assets, hidden: body.library.hidden ?? [] } : null;
  const library = libraryWith(overlay);
  const count = Math.max(1, Math.min(MAX_COUNT, Math.round(Number(body.count) || 10)));
  const start = Array.isArray(body.panels) && body.panels.length ? body.panels : script.panels;

  const locations = libraryLocations(overlay).map((l) => {
    const asset = library.find((a) => a.id === `loc.${l.id}`);
    return `${l.id}: ${asset?.must_keep ?? l.name}`;
  });
  const characters = libraryCharacters(overlay).map((c) => {
    const sheet = library.find((a) => a.kind === "character" && a.subject === c.id);
    return `${c.id} (${c.name}): ${sheet?.must_keep ?? ""}`;
  });
  const objectEntries = libraryObjects(overlay);
  const screenplay = STUDIO_SCREENPLAY.pages.map((page) => `[page ${page.page}]\n${page.text}`).join("\n\n");
  const allFrames = studioFilmFramesDense();
  const frameSrc = (seconds: number) => allFrames.find((f) => f.seconds === Math.round(seconds))?.src;

  const created: WebtoonPanel[] = [];
  const newAssets: { asset: ReferenceAsset; frames: string[] }[] = [];
  let lastNotes: FrameNote[] = [];
  let lastEvents: StoryEvent[] = [];
  const meter: CostMeter = { usd: 0 };
  try {
    const batch = Math.min(BATCH, count);
    const adaptedUntil = coveredUntil(start);
    // The window: a few seconds per panel by pace, then cut where the moments and events fit the batch.
    // Inside a bounded span (a rewrite), the frames left are spread over the panels left to write.
    const perPanel = FRAMES_PER_PANEL[pace];
    const available = allFrames.filter((f) => f.seconds >= adaptedUntil && (until === null || f.seconds <= until));
    const share = until === null ? Math.max(2, Math.ceil(batch * perPanel)) : Math.max(1, Math.ceil((available.length * batch) / Math.max(batch, count)));
    const window = available.slice(0, Math.min(MAX_FRAMES, share));
    if (!window.length) return Response.json({ error: "Fin de l'épisode : il n'y a plus d'image du film après la dernière case" }, { status: 400 });

    const [rawNotes, helmet] = await Promise.all([analyzeFrames({ script, screenplay, frames: window, characters, objects: objectEntries.map((o) => o.name), meter }), helmetChecks(window, meter)]);
    for (const note of rawNotes) {
      const check = helmet.get(Number(note.seconds));
      if (check === "on") note.helmet = "on his head";
      else if (check === "off" && (note.helmet ?? "").includes("on his head")) note.helmet = "off his head (on the ground or in his hands)";
    }
    // Helmet track, deterministic: the state arrives from the panels already made, then each
    // frame can only change it with a clear reading; a close-up where the head is out of frame
    // keeps the state. The writer receives it as truth and the panels are forced to it afterwards.
    const track = helmetTrack(rawNotes, start);
    for (const note of rawNotes) {
      const state = track.get(Number(note.seconds));
      if (state) note.helmet = state === "off" ? "OFF: headless, the neck is a dark empty opening above the scarf (the helmet lies on the ground or is out of frame)" : "ON: the helmet is on his head";
    }
    // Moments, events, then the cut: the batch tells what fits, the next call resumes at the cut.
    const allMoments = momentsOf(rawNotes);
    const allEvents = eventsOf(allMoments, { previous: start.slice(-4).map((p) => `${p.description} ${p.characters.join(" ")} ${p.objects.join(" ")}`).join(" ") });
    const cut = cutWindow(allMoments, allEvents, pace === "action" ? BATCH_MAX : batch);
    const frames = window.filter((f) => f.seconds <= cut.end);
    const notes = rawNotes.filter((n) => Number(n.seconds) <= cut.end);
    const moments = allMoments.filter((m) => m.from <= cut.end);
    const events = allEvents.filter((e) => e.from <= cut.end);
    // What the window actually needs, not a fixed eight: asking for more than the moments
    // hold is what padded the strip with several panels of the same motionless second.
    const asked = Math.max(3, Math.min(BATCH_MAX, cut.needed));
    lastNotes = notes;
    lastEvents = events;

    // Entities: objects, creatures and machines, with a sheet or with one to draw.
    const entities = await resolveEntities({ notes, library, frames, meter });
    newAssets.push(...entityAssets(entities, library, frameSrc));
    const entityLines = entities.map((e) => `${e.kind === "object" ? `object "${e.id}"` : `character "${e.id}"`} = ${e.name}${e.scale ? ` (scale: ${e.scale})` : ""}, visible at ${e.seconds.slice(0, 12).join(", ")} s${e.has_sheet ? "" : " (sheet being drawn from the film)"}: ${e.must_keep.slice(0, 220)}`);

    const tail = start.slice(-4).map((p) => ({
      panel_id: p.panel_id,
      seconds: p.source_time_start,
      description: p.description,
      characters: p.characters,
      objects: p.objects,
      location: p.location,
      shot_type: p.shot_type,
      background: p.background,
      dialogue: p.dialogue.map((d) => `${d.speaker}: ${d.text.en}`),
    }));
    const system = writerSystem({ script, batch: asked, characters, locations, objects: entities.filter((e) => e.kind === "object").map((e) => e.id).concat(objectEntries.map((o) => o.id)).filter((id, i, all) => all.indexOf(id) === i), pace });
    const frameParts: UserPart[][] = await Promise.all(
      frames.map(async (frame): Promise<UserPart[]> => [
        { type: "text", text: `Frame at ${frame.label} (${frame.seconds} s)` },
        { type: "image_url", image_url: { url: await frameAsDataUrl(frame.src) } },
      ]),
    );
    const user: UserPart[] = [
      { type: "text", text: `The strip is adapted up to ${adaptedUntil} s. Last panels made:\n${JSON.stringify(tail, null, 1)}` },
      { type: "text", text: `Screenplay of the episode (French):\n${screenplay}` },
      {
        type: "text",
        text: `MOMENTS of this window, from the continuity supervisor's frame-by-frame notes (consecutive identical frames merged; \`from\` and \`to\` are seconds, \`frames\` how many). They are the truth about the state of the characters (helmet ON or OFF, posture, what is in the hands), the place, the people and things visible, their size, what moves and what is heard. One panel per still moment, two to four for a moment whose action changes. Put each panel's \`seconds\` inside its moment:\n${JSON.stringify(moments, null, 1)}`,
      },
      { type: "text", text: `EVENTS of this window and the beats each must be told in (mandatory, in this order, each beat its own panel):\n${eventsBrief(events) || "none: no physical event in these seconds"}` },
      { type: "text", text: `ENTITIES visible in this window (put the id in \`objects\` or \`characters\` of every panel where the thing is visible):\n${entityLines.join("\n") || "none besides the characters"}` },
      { type: "text", text: `Frames of the film from ${frames[0].seconds} s to ${frames[frames.length - 1].seconds} s, in order:` },
      ...frameParts.flat(),
      { type: "text", text: `Write the next ${asked} panels now, as JSON, consistent with the notes and the events.` },
    ];
    const result = await completeJson<{ panels?: NextPanelIntent[] }>({ system, user, maxTokens: 24000, reasoning: "none", onCost: (usd) => { meter.usd += usd; } });
    let intents = (result.panels ?? []).filter(isUsable).slice(0, BATCH_MAX + 4);

    // One review, two checks: what is missing (moments and event beats) and what contradicts the film; one fix call for both.
    const { missing, invented } = await reviewPanels({ moments, events, intents, meter });
    if (missing.length || invented.length) {
      const fixed = await completeJson<{ added?: NextPanelIntent[]; rewritten?: NextPanelIntent[] }>({
        system,
        user: [
          ...user,
          {
            type: "text",
            text: [
              `You wrote these panels:\n${JSON.stringify(intents.map((i, index) => ({ index, seconds: i.seconds, description: i.description })), null, 1)}`,
              missing.length ? `These moments and event beats have NO panel yet and the reader would miss them:\n${JSON.stringify(missing, null, 1)}\n\nWrite the panels that tell each of them (one to three per item, same JSON shape, with their seconds, with their sound effects) in "added". Never write again a beat that one of your panels already tells at another second (compare with the list above): add only what is truly missing, and give each added panel the seconds where it falls between the existing ones.` : "",
              invented.length ? `These panels contradict the film:\n${JSON.stringify(invented.map((m) => ({ ...m, panel: intents[m.index] })), null, 1)}\n\nRewrite ONLY these panels so that each shows exactly what the moment at its seconds shows (same seconds, same JSON shape, keep the framing idea when it is compatible), in "rewritten", in the same order as the problems listed.` : "",
              'Answer with JSON only: {"added": [...], "rewritten": [...]} (empty lists when nothing to add or rewrite).',
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
        maxTokens: 16000,
        reasoning: "none",
        onCost: (usd) => { meter.usd += usd; },
      }).catch(() => ({ added: [], rewritten: [] }));
      const rewritten = fixed.rewritten ?? [];
      invented.forEach((m, k) => {
        const replacement = rewritten[k];
        if (replacement && typeof replacement.description === "string" && replacement.description.trim() && intents[m.index]) intents[m.index] = { ...intents[m.index], ...replacement };
      });
      // An added panel that repeats one already written (same beat, same second, same words) is dropped.
      const bag = (i: NextPanelIntent) => new Set(`${i.description} ${i.action ?? ""}`.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));
      const similar = (a: NextPanelIntent, b: NextPanelIntent) => {
        const A = bag(a);
        const B = bag(b);
        let shared = 0;
        for (const w of A) if (B.has(w)) shared += 1;
        return shared / Math.max(1, Math.min(A.size, B.size)) > 0.6;
      };
      const added = (fixed.added ?? []).filter(isUsable).filter((candidate) => !intents.some((i) => Math.abs(Number(i.seconds) - Number(candidate.seconds)) <= 2 && similar(i, candidate)));
      intents = [...intents, ...added].sort((a, b) => Number(a.seconds) - Number(b.seconds));
    }

    // Deterministic passes on the intents: objects in hand, the frame where each entity is seen best, scale.
    for (const intent of intents) {
      const seconds = Number(intent.seconds);
      const objectIds = new Set((intent.objects ?? []).map((o) => String(o).trim().toLowerCase().replace(/^obj\./, "")));
      const characterIds = new Set((intent.characters ?? []).map((c) => String(c).trim().toLowerCase()));
      const text = `${intent.description} ${intent.action ?? ""}`.toLowerCase();
      const present: Entity[] = [];
      for (const entity of entities) {
        const named = entity.kind === "object" ? objectIds.has(entity.id) : characterIds.has(entity.id);
        const visibleNow = entity.seconds.some((s) => Math.abs(s - seconds) <= 1);
        const mentioned = entity.name.toLowerCase().split(/\s+/).some((w) => w.length > 3 && text.includes(w));
        if (named || (visibleNow && mentioned)) {
          present.push(entity);
          if (entity.kind === "object") objectIds.add(entity.id);
          else characterIds.add(entity.id);
        }
      }
      intent.objects = [...objectIds];
      intent.characters = [...characterIds];
      const extra = present.map((e) => bestFrameFor(e, seconds, frameSrc)).filter((src): src is string => Boolean(src));
      intent.extra_frames = [...new Set([...(intent.extra_frames ?? []), ...extra])].slice(0, 2);
      const scaled = present.filter((e) => e.scale);
      if (scaled.length && !(typeof intent.scale_note === "string" && intent.scale_note.trim())) intent.scale_note = scaled.map((e) => `${e.name}: ${e.scale}`).join("; ");
      for (const event of events) {
        if (event.effects && seconds >= event.from - 1 && seconds <= event.to + 1) intent.effects = [...new Set([...(intent.effects ?? []), ...event.effects])];
      }
    }

    let panels = panelsFromIntents(start, intents, frames, script, overlay).map((panel) => {
      const state = panel.source_time_start === null ? undefined : track.get(nearestSecond(track, panel.source_time_start));
      // Inside the seconds where the helmet comes off or goes back, the state is what the beat says (in the air, rolling): nothing is forced.
      if (!state || !panel.characters.includes("lanterne") || !panel.description || (panel.source_time_start !== null && inHelmetEvent(events, panel.source_time_start))) return panel;
      const text = panel.description.split("STATE TO KEEP EXACTLY:")[0].trim();
      const cues = panel.description.split(/(?=MOTION:|EFFECTS, drawn clearly:|SCALE:)/).slice(1).join(" ").replace(/STATE TO KEEP EXACTLY:[^]*?(?=MOTION:|EFFECTS, drawn clearly:|SCALE:|$)/g, "").trim();
      if (state === "off") {
        const cleaned = text.replace(/helmet (is |now |back )*on( his head)?/gi, "hollow open neck, no helmet").replace(/(his|the) helmet('s)? (dark )?(oval )?eye holes/gi, "the dark opening of his empty neck");
        return { ...panel, description: `${cleaned} STATE TO KEEP EXACTLY: headless: the helmet is OFF, above the cream scarf there is only a dark empty opening into the armour, no head, no face; the helmet lies on the ground nearby or is out of frame. ${cues}`.trim() };
      }
      const cleaned = text.replace(/headless|without his helmet/gi, "helmet on his head");
      return { ...panel, description: `${cleaned} STATE TO KEEP EXACTLY: the helmet is ON his head. ${cues}`.trim() };
    });
    panels = ensureSoundEffects(panels, intents, events);
    if (!panels.length) return Response.json({ error: "Le modèle n'a renvoyé aucune case exploitable" }, { status: 502 });
    created.push(...panels);
    void recordCost({ idToken: identity.idToken, slug, usd: meter.usd, kind: "writer" });
    return Response.json({
      panels: created,
      notes: lastNotes,
      events: lastEvents,
      entities: entities.map((e) => ({ id: e.id, kind: e.kind, name: e.name, has_sheet: e.has_sheet, scale: e.scale })),
      new_assets: newAssets,
      adapted_until: adaptedUntil,
      covered_until: coveredUntil([...start, ...created]),
      batch: BATCH,
      remaining: Math.max(0, count - created.length),
      cost_usd: meter.usd,
    });
  } catch (error) {
    void recordCost({ idToken: identity.idToken, slug, usd: meter.usd, kind: "writer" });
    const message = error instanceof Error ? error.message : "writing failed";
    if (created.length) return Response.json({ panels: created, new_assets: newAssets, partial: true, error: message });
    return Response.json({ error: message }, { status: 502 });
  }
}
