import { readFile } from "node:fs/promises";
import path from "node:path";
import { panelsFromIntents, type NextPanelIntent } from "@/lib/webtoon/continue";
import { recordCost } from "@/lib/webtoon/cost-server";
import { completeJson, type UserPart } from "@/lib/webtoon/providers/gateway-text";
import { libraryCharacters, libraryLocations, libraryWith } from "@/lib/webtoon/references";
import { getWebtoonScript } from "@/lib/webtoon/scripts";
import { STUDIO_SCREENPLAY, studioFilmFramesDense } from "@/lib/webtoon/studio-assets";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { LibraryOverlay, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * POST /api/webtoon/<slug>/continue
 * Body: { count: number, panels: WebtoonPanel[], library?: LibraryOverlay }
 * Writes at most eight panels per call (`batch`); `remaining` says how many
 * of `count` are still to write, and the caller calls again with the panels
 * it now has.
 *
 * Writes the next `count` panels of the strip. The writer model (Claude
 * Sonnet 5 through Vercel AI Gateway) sees the frames of the film that
 * follow the last adapted second, the screenplay, the continuity facts and
 * the last panels, and answers with panel intents. The engine turns them
 * into full panels with their references and prompts; the studio then
 * generates the images and the other languages. No image is made here.
 */

export const maxDuration = 300;

type RouteContext = { params: Promise<{ slug: string }> };

const MAX_COUNT = 30;
const MAX_FRAMES = 32;
/** Panels asked per model call: a longer answer gets cut by the gateway. */
const BATCH = 8;
/** Frames are one second apart; these are frames per panel by pace (about 2 s, 4 s and 5 s of film per panel). */
const FRAMES_PER_PANEL = { action: 2, normal: 4, calm: 5 } as const;


type FrameNote = {
  seconds: number;
  place?: string;
  characters?: string[];
  helmet?: string;
  posture?: string;
  action?: string;
  in_hands?: string;
  others_visible?: string;
  title_card?: string | null;
  screenplay_line?: string;
};

/**
 * First pass: read every frame of the window, one by one, and write down
 * what is literally visible (place, who, helmet on the head or on the
 * ground, posture, what is in the hands, a title card) with the screenplay
 * line it matches. The writer then plans from these notes, so the state of
 * the characters is read from the image and not guessed.
 */
type CostMeter = { usd: number };

async function analyzeFrames(input: { script: NonNullable<ReturnType<typeof getWebtoonScript>>; screenplay: string; frames: { seconds: number; label: string; src: string }[]; characters: string[]; meter: CostMeter }): Promise<FrameNote[]> {
  const system = [
    `You are the continuity supervisor of "${input.script.series}", episode ${input.script.episode}, an original anime being adapted into a webtoon. You receive frames of the finished episode taken every second, each labelled with its timecode, and the screenplay in French. The film and the screenplay match, but the film shows gestures the screenplay does not spell out (a pendant taken out and opened): the frames win for what is visible.`,
    `Characters: ${input.characters.join(" | ")}.`,
    "For EACH frame, in order, write what is literally visible, without interpretation: `place` (the location: underground blue forest, altar sanctuary, white lily field, or a short description), `characters` (ids of the characters visible, empty if nobody), `helmet` (for Lanterne: \"on his head\", \"on the ground\", \"in his hands\", \"not visible\"; for other characters, ignore), `posture` (standing, walking, kneeling, collapsed face down, lying on his back, climbing, sitting), `action` (what the frame shows happening), `in_hands` (an object held, exactly: a folded note, a silver pendant on a chain closed or open with a portrait inside, the helmet, nothing, and what the hand does with it: takes it out, opens it, holds it up, throws it; an arm swept out wide with the object gone from the hand right after is a throw, not a reach), `others_visible` (a creature, a machine, a branch, a claw), `title_card` (the exact text when the frame is a title or logo card on a plain background, else null), `screenplay_line` (the line of the screenplay this moment corresponds to, quoted in French).",
    "Be exact about the helmet and the posture: these decide how the character is drawn in the panels. Look above the cream scarf: a pale lantern-shaped helmet with two dark oval holes means \"on his head\"; a dark round opening with nothing above the scarf means the helmet is off (then say where it is: on the ground, in his hands, or not visible). A frame that shows only the armour from behind with an arm reaching out and nothing above the shoulders is headless. Consistency check before answering: from the first frame where the helmet is off until the frame where both his hands hold it up to his neck (he puts it back), every frame with Lanterne is headless; re-examine any frame in between that you were about to mark \"on his head\". If a frame is black or shows only text, say so.",
    `Continuity facts of the series: ${input.script.source.continuity.join(" ")}`,
    'Answer with JSON only: {"frames": [ {seconds, place, characters, helmet, posture, action, in_hands, others_visible, title_card, screenplay_line} ]}, one entry per frame, in the order given. Escape double quotes inside strings.',
  ].join("\n\n");
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

async function helmetChecks(frames: { seconds: number; src: string }[], meter: CostMeter): Promise<Map<number, "on" | "off" | "absent">> {
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
        const state: "on" | "off" | "absent" = !answer.lanterne_visible ? "absent" : answer.helmet_on_head ? "on" : "off";
        return [frame.seconds, state, answer.helmet_elsewhere ?? ""] as const;
      } catch {
        return [frame.seconds, "absent", ""] as const;
      }
    }),
  );
  const map = new Map<number, "on" | "off" | "absent">();
  for (const [seconds, state] of results) map.set(seconds, state);
  return map;
}

/**
 * Which notes of the window have no panel: a cheap text check that catches a
 * gesture the writer folded into another action (the pendant opened and
 * thrown, summarised as "he lifts the helmet").
 */
async function uncoveredNotes(input: { moments: Moment[]; intents: NextPanelIntent[]; meter: CostMeter }): Promise<{ seconds: number; moment: string }[]> {
  if (!input.moments.length || !input.intents.length) return [];
  try {
    const answer = await completeJson<{ missing?: { seconds: number; moment: string }[] }>({
      system:
        'You check the coverage of a webtoon sequence. You get the moments of a film window (what is literally visible: place, posture, what is in the hands, what happens; consecutive identical frames already merged) and the panels written for that window. List the moments that NO panel tells: a gesture, an object taken out, opened, held up or thrown, a creature appearing or leaving, a change of posture, a title card. A moment is covered when some panel clearly shows it, even from another angle. Ignore differences of framing. A still moment that spans several frames (a creature standing, a character motionless) is covered by one panel: never ask for one panel per frame. Answer with JSON only: {"missing": [{"seconds": <frame seconds>, "moment": "<what the panels should show>"}]}, an empty list when everything is covered.',
      user: `MOMENTS (consecutive identical frames merged, one panel is enough for a still moment):\n${JSON.stringify(input.moments.map((m) => ({ from: m.from, to: m.to, characters: m.characters, helmet: String(m.helmet ?? "").slice(0, 3), posture: m.posture, in_hands: m.in_hands, action: m.action, others: m.others_visible, title_card: m.title_card })), null, 1)}\n\nPANELS:\n${JSON.stringify(input.intents.map((i) => ({ seconds: i.seconds, description: i.description, state: i.state })), null, 1)}`,
      maxTokens: 4000,
      reasoning: "none",
      onCost: (usd) => { input.meter.usd += usd; },
    });
    return (answer.missing ?? []).filter((m) => m && Number.isFinite(Number(m.seconds)) && typeof m.moment === "string").slice(0, 8);
  } catch {
    return [];
  }
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
    if (h.includes("off") || h.includes("ground") || h.includes("in his hands")) return "off" as const;
    return "unknown" as const;
  });
  const track = new Map<number, "off" | "on">();
  for (let i = 0; i < sorted.length; i += 1) {
    const r = readings[i];
    if (r === "off") off = true;
    else if (r === "on") {
      // "on" needs the next Lanterne frame to agree, or a note that says he puts it back.
      const next = readings.slice(i + 1).find((x) => x !== "absent" && x !== "unknown");
      const putsBack = /(puts|putting|raises|raising|lifts|lifting).*(helmet).*(neck|head|shoulders)|helmet back on/i.test(`${sorted[i].action ?? ""} ${sorted[i].in_hands ?? ""}`);
      // The helmet only goes back on through a visible gesture: a reading of "on" after "off" without it is a misread.
      if (!off || putsBack) off = false;
      void next;
    }
    track.set(Number(sorted[i].seconds), off ? "off" : "on");
  }
  return track;
}

type Moment = { from: number; to: number; frames: number } & Omit<FrameNote, "seconds">;

/**
 * Consecutive frames that show the same thing (same people, helmet, posture,
 * hands, others, title) collapse into one moment with a duration: the
 * writer then makes one panel per moment, two or three for a gesture,
 * instead of one panel per second for a creature that does not move.
 */
function momentsOf(notes: FrameNote[]): Moment[] {
  const sorted = [...notes].sort((a, b) => Number(a.seconds) - Number(b.seconds));
  const key = (n: Omit<FrameNote, "seconds">) => [String(n.place ?? "").slice(0, 24), (n.characters ?? []).join(","), String(n.helmet ?? "").slice(0, 3), n.posture ?? "", String(n.in_hands ?? "").slice(0, 40), String(n.others_visible ?? "").slice(0, 30), n.title_card ?? ""].join("|");
  const moments: Moment[] = [];
  for (const n of sorted) {
    const last = moments[moments.length - 1];
    if (last && key(last) === key(n)) {
      last.to = Number(n.seconds);
      last.frames += 1;
      if (n.action && !String(last.action ?? "").includes(String(n.action).slice(0, 30))) last.action = `${last.action ?? ""} Then: ${n.action}`.trim();
    } else {
      const { seconds, ...rest } = n;
      moments.push({ from: Number(seconds), to: Number(seconds), frames: 1, ...rest });
    }
  }
  return moments;
}

/**
 * The mirror of the coverage check: panels that show a gesture, an object or
 * a posture that the moments do not contain (a walk, a helmet raised, an
 * object thrown at the wrong time). The writer rewrites them to the moment.
 */
async function inventedPanels(input: { moments: Moment[]; intents: NextPanelIntent[]; meter: CostMeter }): Promise<{ index: number; problem: string }[]> {
  if (!input.moments.length || !input.intents.length) return [];
  try {
    const answer = await completeJson<{ invented?: { index: number; problem: string }[] }>({
      system:
        'You check a webtoon sequence against the film. You get the moments of a film window (what is literally visible, consecutive identical frames merged) and the panels written for it, numbered by index. List the panels that show something the moments at their seconds do NOT contain: a different posture (walking when he kneels), a gesture that is not there (raising the helmet, throwing, striking), an object that is not in the hands, a character who is not visible, a place that changes. A closer or wider framing of the same thing, a reaction, a detail of the surroundings are fine. Answer with JSON only: {"invented": [{"index": <panel index>, "problem": "<what contradicts the moment, and what the moment shows instead>"}]}, an empty list when all is consistent.',
      user: `MOMENTS:\n${JSON.stringify(input.moments.map((m) => ({ from: m.from, to: m.to, characters: m.characters, helmet: String(m.helmet ?? "").slice(0, 3), posture: m.posture, in_hands: m.in_hands, action: m.action, others: m.others_visible })), null, 1)}\n\nPANELS:\n${JSON.stringify(input.intents.map((i, index) => ({ index, seconds: i.seconds, description: i.description, action: i.action })), null, 1)}`,
      maxTokens: 4000,
      reasoning: "none",
      temperature: 0,
      onCost: (usd) => { input.meter.usd += usd; },
    });
    return (answer.invented ?? []).filter((m) => m && Number.isInteger(Number(m.index)) && typeof m.problem === "string").slice(0, 8);
  } catch {
    return [];
  }
}

function nearestSecond(track: Map<number, "off" | "on">, seconds: number): number {
  let best = Number.NaN;
  for (const key of track.keys()) if (Number.isNaN(best) || Math.abs(key - seconds) < Math.abs(best - seconds)) best = key;
  return best;
}

function writerSystem(input: { script: NonNullable<ReturnType<typeof getWebtoonScript>>; batch: number; characters: string[]; locations: string[]; pace?: "calm" | "normal" | "action" }): string {
  const { script, batch, characters, locations, pace = "normal" } = input;
  return [
    `You are the adaptation engine of "${script.series}", an original poetic dark fantasy anime by Frank Houbre, being redrawn as a vertical Korean-style webtoon read on a phone. Episode ${script.episode}. You write the NEXT ${batch} panels of the strip, continuing exactly where it stops.`,
    "You receive: the last panels already made (for continuity), frames of the finished episode taken every five seconds after the adapted segment (each labelled with its timecode), and the screenplay of the episode in French.",
    "Two sources, both authoritative, and they match: the film (the frames) and the screenplay. Method: first find the passage of the screenplay that corresponds to the frames you receive (same place, same events). Then cover EVERY beat of that passage and every visible moment of the film, in order: a frame every five seconds misses most gestures, and the screenplay tells you what happens between two frames (he tries to make a sound and only a hollow metallic moan comes out, he falls to his knees, he clutches the helmet, he strikes the ground, he stays on his knees, then he stands). A beat of the screenplay with no frame of its own draws from the nearest frame for light and place (fidelity `bridge`). Each panel gives the timecode of its frame in `seconds` and quotes the screenplay line it comes from in `screenplay_line`. Do not invent actions that are in neither source. Cover the sources continuously and densely: start at the first frame after the last panel made, advance frame by frame, and give each frame the panels its moments need (one to four), then move to the next frame. The frames you receive are the next few frames only: cover all of them, and only them, with the requested number of panels, about one to two per frame, and two or three for a frame where something happens (an impact, a fall, a hand that grabs). Never skip a frame where something changes, never jump ahead. The last panel lands on the last frame given, where the next call continues.",
    "Continuity of state, strict. You receive frame-by-frame notes from a continuity supervisor: they say, for each frame, whether the helmet is ON his head or OFF (headless), the posture, what is in the hands, who is visible and where the title cards are. The `helmet` field is computed from the whole sequence and is the truth: when it says OFF, Lanterne is headless in that panel, whatever the character sheet shows and even if the head is out of frame; never write \"helmet on\" or \"helmet back on\" for a frame marked OFF. Carry the state of each character from panel to panel and write it in every `description` and in `state`. Once the helmet is on the ground, Lanterne is drawn WITHOUT his helmet in every panel until the panel where he puts it back: a hollow suit of armour with the cream scarf around an open, empty neck, no head, nothing inside; the helmet lies where it fell and is shown or implied. The same for kneeling, holding an object, an injury, a torn cape, a light that is on or off: a state changes only when the film or the screenplay changes it. Never invent a change of state: no helmet that loosens or falls, no wound, no lost object unless a frame or a screenplay line shows it. A note saying the helmet is \"not visible\" means the frame does not include the head, nothing more: the helmet stays as it was.",
    "Objects and gestures, strict. Whatever the notes put in a character's hands or show him doing (a pendant taken out from under the chest plate, opened, looked at, thrown away; a note; the helmet) must get its own panels and be followed to its end: taken out, opened, what is inside, the look, the gesture that ends it. A frame that shows a hand holding an object is never summarised into another action. The frames are one second apart: a gesture that spans several frames is a small sequence of panels, not one.",
    "Not every panel shows a character. One panel in four or five is an illustration or an atmosphere panel with nobody in it: the place, the light, a detail of the environment (a root, a mushroom, the mist, the sleeping machine), an object on the ground (the fallen helmet alone). The film has such shots and the screenplay describes the world (\"Le monde est beau. Mais il n'est pas sûr.\"). Use them for silences, for a change of place and to let the reader breathe.",
    "Title cards. When the film shows the title of the series or a logo, make a title card panel instead of an image: `title_card` set to the exact text (for this series: \"LOST GARDEN\"), background black, transition fade_to_black, no description needed. Never ask the image model to draw text.",
    "Decompose every physical event. When the film or the screenplay has an impact, a fall, an object that drops or rolls, a door, a hand that grabs, a reveal, never leave it to one panel: tell it in two to four panels so the reader understands what happened without words. Typical breakdown: the cause (a detail: the low branch ahead of him), the impact (an extreme close-up on the point of contact, with one sound effect), the consequence (a detail: the helmet rolling on the ground, coming to rest), the reaction (the character frozen, or a hand reaching). These intermediate panels use fidelity `reframe` or `bridge`, draw from the frame closest to the moment for light and place, and are not limited in number: a reader must be able to say what happened in each of them. Outside such events, a closer look, a reverse angle or a breath on the same moment stays at most one panel in four.",
    "Rhythm of a webtoon: a wide establishing panel each time the place changes, close-ups on gestures, details on objects, an almost empty panel for a silence, a tall panel for a fall or a vertical space.",
    "Never lose the reader. Between two panels the reader must always know where we are and how we got there: when the place, the subject or the direction changes, add a connective panel (an establishing view, an insert on what the character looks at, a reaction, a step, a hand, a sound in the dark). The frames are one second apart: a panel covers three to five seconds of film in a normal pace, one to two in action; a still moment (a creature standing, a character motionless, a held look) is ONE panel however many frames it spans; several panels only when the frames show a gesture that changes (an object taken out, opened, thrown; a fall; a turn). Use `screenplay_line` to check that no beat of the screenplay is skipped.",
    "Layout, like a real webtoon. Break the stack of full-width rectangles with `frame`: `width` in percent (40 to 100), `align` (left, center, right), `shape` (rect, rounded, slant, slant-reverse, wedge, wedge-reverse), `overlap` (px, the panel rides over the one above, 60 to 300), `tilt` (degrees, -6 to 6), `shadow`. Rules of thumb: a landscape or a reveal is full width (100, shape rect or wedge); a detail or a reaction is narrow (50 to 72) pushed left or right, often overlapping the big panel above it by 100 to 200 px, rounded or slanted; two or three narrow panels in a row alternate sides like a zigzag; an impact gets slant edges and a small tilt; a quiet moment gets a centered rounded panel with margins; keep full width for at most half of the panels.",
    "Action and threat: make the reader feel it. When something threatens or attacks (a machine that wakes, a chase, a fall, a blow), stop following the frames one panel each and tell every second in three to five panels: the threat rising in the background while the character does not see it yet; a detail of the threat (a leg, a claw, an eye) huge in the foreground with the character tiny behind; the character turning, backing away, the first step of the run; extreme close-ups of the eyes, the hands, the feet hitting the moss; the threat from below, low angle, dutch angle; the character from above, small; a wide shot of the two together with the distance closing; the impact panel with a giant sound effect; then the breath after. Alternate mini panels in rapid succession (3:1 and 16:9, 300 to 450 px, continuous or hard_cut, no gap) with one very tall panel for the peak. Compositions on diagonals, tilted horizon (`tilt` 3 to 6, shape slant), cape and limbs stretched by motion, sharp light from the threat's eyes. Never a calm medium shot in the middle of a chase.",
    pace === "action"
      ? `THIS BATCH IS AN ACTION SEQUENCE: ${batch} panels for the few frames given, three to five per frame, dense, dynamic, no calm panel except the last breath. Every panel must add a beat of threat or motion.`
      : pace === "calm"
        ? "This batch is a calm sequence: one to two panels per frame, wide and quiet, silence between them."
        : "",
    "Scale, and make it spectacular. A phone strip lives on contrast of size. Vary the panels strongly and say it in `aspect_ratio` (and `panel_height` up to 2600 when you want it taller than the ratio gives): mini panels in quick succession for details and beats (`3:1` or `16:9`, 300 to 500 px: a foot on moss, a mushroom, a glance, a sound), standard panels (`4:5`) for the action, and very tall full-bleed panels (`9:16`, or `panel_height` 2200 to 2600) for what must feel immense: a landscape, a fall, the reveal of something huge. The reveal of a colossal thing (a sleeping machine, a chasm, a giant) is the tallest panel of the sequence, low angle, the character tiny in it, preceded by a build-up of two to four quiet transition panels (walking deeper, forest details, mist, a first shadow or fragment glimpsed between the trunks, a sound) and a long silence before it (`transition_type` `fall` or `time_skip`, or `hard_cut` for a shock). An impact or a shock gets a big sound effect: `sfx.size` 180 to 320 for a BAAM, with a `rotate`. Use `focal_point` (percent) to say what must stay in frame when the panel crops the image.",
    "Location, strict: look at each frame and name the place actually visible. The sheet of the location you name is attached to the prompt and its design is copied into the background, so a wrong location paints the wrong place (an altar in a forest). Use `altar-sanctuary` only when the altar or the rose window is visible; use `blue-forest` for the cavern forest of black trunks, roots and glowing mushrooms; use `white-lily-field` for the white memory; otherwise create a short new id in lower case with hyphens and describe the place in the panel description. Never copy the location of the previous panel without checking the frame.",
    `Characters with a design sheet (use these exact ids in "characters"): ${characters.join(" | ")}. Lanterne never speaks, never stumbles, emits no light and has no face inside the helmet. Rose is a small calm child. Other characters may be named in lower case (e.g. "unhooker", "vault-king") and must then be described in the panel description.`,
    `Locations with a sheet (use the id in "location" when the scene is there, otherwise a short new id in lower case with hyphens, described in the panel): ${locations.join(" | ")}.`,
    `Continuity of the series: ${script.source.continuity.join(" ")}`,
    "Page background: `white` for the white memory world, `black` for the underground; `abyss` only for a fall into the deep.",
    "Shot types: extreme_wide, wide, full, medium, medium_close_up, close_up, extreme_close_up, detail, void. Angles: eye_level, low, high, top_down, dutch, over_the_shoulder, worm. Narrative roles: breath, establishing, character_intro, action, reaction, dialogue, detail, reveal, transition, tension, cliffhanger. Transitions (the space before the panel): continuous, cut, beat, breath, hard_cut, fall, fade_to_black, fade_to_white, time_skip.",
    "Lettering: dialogue only when the screenplay has a line at that moment, written in English in `en` and in French in `fr`, spoken and short; `style` speech, whisper, thought, shout or off; `speaker` is the character's name. Captions are rare (narration, a place, a time). Sound effects (`sfx`, style soft, hard or rumble) only for a sound that matters, as an English onomatopoeia in `en` and a French one in `fr`. Anchors are percentages of the panel: `anchor: {x, y}`.",
    "Write `description` as one or two precise sentences of what the panel shows (subject, pose, framing, light, and what is in the background), `action` as the movement or its absence, `emotion` in a few words, `composition` as where the eye goes, `purpose` as why the panel exists. Each panel must be understandable on its own from the image and at most one sound effect. Never use an em dash.",
    `Answer with JSON only: {"panels": [ {seconds, screenplay_line, state, description, action, emotion, purpose, characters, location, shot_type, camera_angle, composition, aspect_ratio, panel_height, bleed, focal_point: {x, y}, frame: {width, align, shape, overlap, tilt, shadow}, narrative_role, transition_type, fidelity, background, title_card, dialogue: [{speaker, style, en, fr, anchor}], caption: [{style, en, fr, anchor}], sfx: [{style, en, fr, anchor, size, rotate}]} ] } with exactly ${batch} panels (a title card counts as one). Escape every double quote inside a string value; no comments, no trailing commas.`,
  ].join("\n\n");
}

async function frameAsDataUrl(src: string): Promise<string> {
  const bytes = await readFile(path.join(process.cwd(), "public", src));
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

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
  const until = Number.isFinite(Number(body.until_seconds)) ? Number(body.until_seconds) : null;
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
  const screenplay = STUDIO_SCREENPLAY.pages.map((page) => `[page ${page.page}]\n${page.text}`).join("\n\n");

  // One batch per call: a long answer gets cut by the gateway and a long call
  // by the platform, so the studio asks for eight panels at a time and calls
  // again with the panels just written, which keeps the story continuous.
  const created: WebtoonPanel[] = [];
  let current = start;
  let lastNotes: FrameNote[] = [];
  const meter: CostMeter = { usd: 0 };
  try {
    while (created.length < Math.min(count, BATCH)) {
      const batch = Math.min(BATCH, count - created.length);
      const adaptedUntil = Math.max(0, ...current.map((p) => p.source_time_end ?? 0));
      // Fewer frames than panels: the writer must have room to decompose an event into several panels.
      // An action sequence gets far fewer frames per batch, so every second of it is told in several panels.
      // Inside a bounded span (a rewrite), the frames left are spread over the panels left to write, so
      // the whole count lands on the span instead of running out of frames after the first batch.
      const perPanel = FRAMES_PER_PANEL[pace];
      const available = studioFilmFramesDense().filter((f) => f.seconds > adaptedUntil && (until === null || f.seconds <= until));
      const share = until === null ? Math.max(2, Math.ceil(batch * perPanel)) : Math.max(1, Math.ceil((available.length * batch) / Math.max(batch, count)));
      const frames = available.slice(0, Math.min(MAX_FRAMES, share));
      if (!frames.length) {
        if (!created.length) return Response.json({ error: "Fin de l'épisode : il n'y a plus d'image du film après la dernière case" }, { status: 400 });
        break;
      }
      const tail = current.slice(-4).map((p) => ({
        panel_id: p.panel_id,
        seconds: p.source_time_start,
        description: p.description,
        characters: p.characters,
        location: p.location,
        shot_type: p.shot_type,
        background: p.background,
        dialogue: p.dialogue.map((d) => `${d.speaker}: ${d.text.en}`),
      }));
      const system = writerSystem({ script, batch, characters, locations, pace });
      const [notes, helmet] = await Promise.all([analyzeFrames({ script, screenplay, frames, characters, meter }), helmetChecks(frames, meter)]);
      for (const note of notes) {
        const check = helmet.get(Number(note.seconds));
        if (check === "on") note.helmet = "on his head";
        else if (check === "off" && (note.helmet ?? "").includes("on his head")) note.helmet = "off his head (on the ground, in his hands or out of frame)";
      }
      // Helmet track, deterministic: the state arrives from the panels already made, then each
      // frame can only change it with a clear reading (two consecutive frames for "on"); a
      // close-up where the head is out of frame keeps the state. The writer receives it as
      // truth and the panels are forced to it afterwards.
      const track = helmetTrack(notes, current);
      for (const note of notes) {
        const state = track.get(Number(note.seconds));
        if (state) note.helmet = state === "off" ? "OFF: headless, the neck is a dark empty opening above the scarf (the helmet lies on the ground or is out of frame)" : "ON: the helmet is on his head";
      }
      const moments = momentsOf(notes);
      lastNotes = notes;
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
          text: `MOMENTS of this window, from the continuity supervisor's frame-by-frame notes (consecutive identical frames merged; \`from\` and \`to\` are seconds, \`frames\` how many). They are the truth about the state of the characters (helmet ON or OFF, posture, what is in the hands), the place, the people visible and the title cards. Make ONE panel per moment, two or three only for a moment whose action is a gesture that changes (an object taken out, opened, thrown; a fall; a turn); never several panels for a moment where nothing moves, however long it lasts. Put each panel's \`seconds\` inside its moment:\n${JSON.stringify(moments, null, 1)}`,
        },
        { type: "text", text: `Frames of the film after ${adaptedUntil} s, in order:` },
        ...frameParts.flat(),
        { type: "text", text: `Write the next ${batch} panels now, as JSON, consistent with the notes.` },
      ];
      const result = await completeJson<{ panels?: NextPanelIntent[] }>({ system, user, maxTokens: 24000, reasoning: "none", onCost: (usd) => { meter.usd += usd; } });
      let intents = (result.panels ?? []).slice(0, batch);
      // Coverage check: every note of the window must be told by a panel; the writer adds the missing moments.
      const missing = await uncoveredNotes({ moments, intents, meter });
      if (missing.length) {
        const extra = await completeJson<{ panels?: NextPanelIntent[] }>({
          system,
          user: [
            ...user,
            {
              type: "text",
              text: `You wrote these panels:\n${JSON.stringify(intents.map((i) => ({ seconds: i.seconds, description: i.description })), null, 1)}\n\nThese moments of the notes have NO panel yet and the reader would miss them:\n${JSON.stringify(missing, null, 1)}\n\nWrite the panels that tell each of these moments (one to three per moment, same JSON shape, with their seconds). Answer with JSON only: {"panels": [...]}.`,
            },
          ],
          maxTokens: 16000,
          reasoning: "none",
          onCost: (usd) => { meter.usd += usd; },
        });
        const added = (extra.panels ?? []).filter((i) => i && typeof i.description === "string");
        intents = [...intents, ...added].sort((a, b) => Number(a.seconds) - Number(b.seconds));
      }
      // Invention check: panels that contradict the moments are rewritten to them.
      const invented = await inventedPanels({ moments, intents, meter });
      if (invented.length) {
        const fixed = await completeJson<{ panels?: NextPanelIntent[] }>({
          system,
          user: [
            ...user,
            {
              type: "text",
              text: `Some of the panels you wrote contradict the film:\n${JSON.stringify(invented.map((m) => ({ ...m, panel: intents[m.index] })), null, 1)}\n\nRewrite ONLY these panels so that each shows exactly what the moment at its seconds shows (same seconds, same JSON shape, keep the framing idea when it is compatible). Answer with JSON only: {"panels": [...]} in the same order as the problems listed.`,
            },
          ],
          maxTokens: 12000,
          reasoning: "none",
          onCost: (usd) => { meter.usd += usd; },
        });
        const replacements = fixed.panels ?? [];
        invented.forEach((m, k) => {
          const replacement = replacements[k];
          if (replacement && typeof replacement.description === "string" && replacement.description.trim()) intents[m.index] = { ...intents[m.index], ...replacement };
        });
      }
      const panels = panelsFromIntents(current, intents, frames, script, overlay).map((panel) => {
        const state = panel.source_time_start === null ? undefined : track.get(nearestSecond(track, panel.source_time_start));
        if (!state || !panel.characters.includes("lanterne") || !panel.description) return panel;
        const text = panel.description.split("STATE TO KEEP EXACTLY:")[0].trim();
        if (state === "off") {
          const cleaned = text.replace(/helmet (is |now |back )*on( his head)?/gi, "hollow open neck, no helmet").replace(/(his|the) helmet('s)? (dark )?(oval )?eye holes/gi, "the dark opening of his empty neck");
          return { ...panel, description: `${cleaned} STATE TO KEEP EXACTLY: headless: the helmet is OFF, above the cream scarf there is only a dark empty opening into the armour, no head, no face; the helmet lies on the ground nearby or is out of frame.` };
        }
        const cleaned = text.replace(/headless|without his helmet/gi, "helmet on his head");
        return { ...panel, description: `${cleaned} STATE TO KEEP EXACTLY: the helmet is ON his head.` };
      });
      if (!panels.length) {
        if (!created.length) return Response.json({ error: "Le modèle n'a renvoyé aucune case exploitable" }, { status: 502 });
        break;
      }
      created.push(...panels);
      current = [...current, ...panels];
    }
    void recordCost({ idToken: identity.idToken, slug, usd: meter.usd, kind: "writer" });
    return Response.json({ panels: created, notes: lastNotes, adapted_until: Math.max(0, ...start.map((p) => p.source_time_end ?? 0)), batch: BATCH, remaining: Math.max(0, count - created.length), cost_usd: meter.usd });
  } catch (error) {
    void recordCost({ idToken: identity.idToken, slug, usd: meter.usd, kind: "writer" });
    const message = error instanceof Error ? error.message : "writing failed";
    if (created.length) return Response.json({ panels: created, partial: true, error: message });
    return Response.json({ error: message }, { status: 502 });
  }
}
