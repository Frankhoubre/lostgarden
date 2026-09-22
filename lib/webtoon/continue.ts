import { ASPECT_BY_SHOT, SPACING_BY_TRANSITION } from "./adaptation";
import { composePanel, panelFromFrame, type FramePick } from "./compose";
import { effectCues, motionCues } from "./continuity";
import { heightForAspect } from "./layout";
import type {
  Anchor,
  LibraryOverlay,
  PanelFrame,
  BubbleStyle,
  CameraAngle,
  Fidelity,
  NarrativeRole,
  PanelBackground,
  ShotType,
  TransitionType,
  WebtoonPanel,
  WebtoonScript,
} from "./types";

/**
 * CONTINUING THE STRIP: the studio asks a writer model for the next N
 * panels from the frames of the film that follow the adapted segment and
 * from the screenplay. The model answers with panel intents in this shape;
 * the engine then turns them into full panels (references, prompt) exactly
 * as it does for a hand-written plan. Images and the other languages come
 * after, from the same routes the studio already uses.
 */

export type NextText = { en: string; fr?: string; style?: string; speaker?: string; anchor?: Anchor; /** Sound effects: size in canvas px (96 normal, up to 320 for a big impact). */ size?: number; rotate?: number };

/**
 * The series' title cards as real images: the logo on black, drawn once
 * from the site's logo file, so a title card looks like the film's.
 */
const TITLE_CARD_IMAGES: { match: RegExp; src: string; width: number; height: number }[] = [
  { match: /lost\s*garden/i, src: "/webtoon/ep1-opening/title-card.png", width: 1080, height: 1350 },
];

export type NextPanelIntent = {
  /** Timecode of the film frame the panel draws from, in seconds. */
  seconds: number;
  description: string;
  /** What must stay true about the characters here (helmet on the ground, kneeling, holding the helmet). */
  state?: string;
  /** A title card instead of an image: the text shown large on a plain background. */
  title_card?: string;
  action: string;
  emotion: string;
  purpose?: string;
  characters?: string[];
  location?: string;
  shot_type?: ShotType;
  camera_angle?: CameraAngle;
  composition?: string;
  /** Scale of the panel on the phone: a ratio like "9:16" (tall), "4:5", "3:2", "3:1" (a thin strip) or "9:20" (a very tall reveal). */
  aspect_ratio?: string;
  /** Height in canvas px at 1080 wide, when the ratio is not enough: up to 2600. */
  panel_height?: number;
  bleed?: boolean;
  border?: boolean;
  focal_point?: Anchor;
  /** How the panel sits on the strip: width in percent, side, shape, overlap of the previous panel, tilt. */
  frame?: PanelFrame;
  narrative_role?: NarrativeRole;
  transition_type?: TransitionType;
  fidelity?: Fidelity;
  background?: PanelBackground;
  dialogue?: NextText[];
  caption?: NextText[];
  sfx?: NextText[];
  /** Objects with a sheet in the library, by id without the `obj.` prefix ("pendant"): their sheets are attached. */
  objects?: string[];
  /** How much moves in the panel; the prompt gets speed lines, debris and stretched cloth accordingly. */
  motion?: "none" | "slow" | "fast" | "violent";
  /** Visual effects the panel must show ("electric arcs", "dust", "debris"). */
  effects?: string[];
  /** What would be heard in the panel; a sound effect is lettered from it when `sfx` is empty. */
  sound?: string;
  /** Size of a thing next to the character, written into the prompt ("the machine: twenty times his height"). */
  scale_note?: string;
  /** More frames of the film to attach (the object seen best, the creature in close-up), public paths. */
  extra_frames?: string[];
};

const SHOTS = new Set<ShotType>(["extreme_close_up", "close_up", "medium_close_up", "medium", "full", "wide", "extreme_wide", "detail", "void"]);
const ANGLES = new Set<CameraAngle>(["eye_level", "low", "high", "top_down", "dutch", "over_the_shoulder", "worm"]);
const ROLES = new Set<NarrativeRole>(["breath", "establishing", "character_intro", "action", "reaction", "dialogue", "detail", "reveal", "transition", "tension", "cliffhanger"]);
const TRANSITIONS = new Set<TransitionType>(Object.keys(SPACING_BY_TRANSITION) as TransitionType[]);
const BUBBLES = new Set<BubbleStyle>(["speech", "whisper", "thought", "shout", "off"]);

const pick = <T extends string>(value: unknown, allowed: Set<T>, fallback: T): T =>
  typeof value === "string" && allowed.has(value as T) ? (value as T) : fallback;

const SHAPES = new Set<NonNullable<PanelFrame["shape"]>>(["rect", "rounded", "slant", "slant-reverse", "wedge", "wedge-reverse"]);

/** A clean frame from whatever the writer sent, or undefined when it sent nothing usable. */
export function cleanFrame(value: unknown): PanelFrame | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const frame: PanelFrame = {};
  const width = Number(raw.width);
  if (Number.isFinite(width)) frame.width = Math.round(Math.min(100, Math.max(40, width)));
  if (raw.align === "left" || raw.align === "center" || raw.align === "right") frame.align = raw.align;
  if (typeof raw.shape === "string" && SHAPES.has(raw.shape as NonNullable<PanelFrame["shape"]>)) frame.shape = raw.shape as PanelFrame["shape"];
  const overlap = Number(raw.overlap);
  if (Number.isFinite(overlap) && overlap > 0) frame.overlap = Math.round(Math.min(400, overlap) / 10) * 10;
  const tilt = Number(raw.tilt);
  if (Number.isFinite(tilt) && tilt !== 0) frame.tilt = Math.max(-6, Math.min(6, Math.round(tilt)));
  if (typeof raw.shadow === "boolean") frame.shadow = raw.shadow;
  return Object.keys(frame).length ? frame : undefined;
}

const anchor = (value: Anchor | undefined, fallback: Anchor): Anchor =>
  value && Number.isFinite(value.x) && Number.isFinite(value.y)
    ? { x: Math.min(95, Math.max(5, value.x)), y: Math.min(95, Math.max(5, value.y)) }
    : fallback;

const text = (item: NextText) => ({ en: (item.en ?? "").trim(), ...(item.fr?.trim() ? { fr: item.fr.trim() } : {}) });

/**
 * Full panels from the writer's intents, appended after the current strip.
 * Each intent must name a frame of the film; unknown frames are snapped to
 * the closest one after the adapted segment.
 */
export function panelsFromIntents(
  current: readonly WebtoonPanel[],
  intents: NextPanelIntent[],
  frames: FramePick[],
  script: Pick<WebtoonScript, "palettes" | "style_anchors">,
  overlay?: LibraryOverlay | null,
): WebtoonPanel[] {
  const panels: WebtoonPanel[] = [...current];
  const created: WebtoonPanel[] = [];
  for (const intent of intents) {
    if (!intent) continue;
    const title = typeof intent.title_card === "string" ? intent.title_card.trim() : "";
    if (!title && (typeof intent.description !== "string" || !intent.description.trim())) continue;
    const seconds = Number(intent.seconds);
    const frame = frames.reduce((best, f) => (Math.abs(f.seconds - seconds) < Math.abs(best.seconds - seconds) ? f : best), frames[0]);
    if (!frame) continue;
    const base = panelFromFrame(panels, frame, panels[panels.length - 1]);
    if (title) {
      // A title card: the series' logo image when we have it, the lettering on a plain background otherwise.
      const logo = TITLE_CARD_IMAGES.find((entry) => entry.match.test(title));
      const card: WebtoonPanel = {
        ...base,
        panel_id: base.panel_id.replace(/^f/, "t"),
        fidelity: "direct",
        narrative_role: "transition",
        purpose: `Title card: ${title}`,
        description: "",
        action: "",
        emotion: "",
        characters: [],
        shot_type: "void",
        composition: "",
        aspect_ratio: "4:5",
        panel_height: heightForAspect("4:5"),
        transition_type: pick(intent.transition_type, TRANSITIONS, "fade_to_black"),
        spacing_before: SPACING_BY_TRANSITION[pick(intent.transition_type, TRANSITIONS, "fade_to_black")],
        spacing_after: SPACING_BY_TRANSITION.breath,
        background: pick(intent.background, new Set<PanelBackground>(["white", "black", "abyss"]), "black"),
        bleed: true,
        caption: logo ? [] : [{ text: { en: title }, anchor: { x: 50, y: 50 }, style: "title" }],
        visual_references: [],
        generation_prompt: "",
        negative_constraints: [],
        prompt_auto: false,
        image: logo ? { src: logo.src, width: logo.width, height: logo.height, model: "title-card", status: "generated" } : base.image,
      };
      panels.push(card);
      created.push(card);
      continue;
    }
    const state = typeof intent.state === "string" ? intent.state.trim() : "";
    // Movement, effects and scale are part of the picture: they go into the description the prompt is built from.
    const cues = [motionCues(intent.motion), effectCues(intent.effects), typeof intent.scale_note === "string" && intent.scale_note.trim() ? `SCALE: ${intent.scale_note.trim()}` : ""].filter(Boolean).join(" ");
    const extraFrames = Array.isArray(intent.extra_frames) ? intent.extra_frames.map((f) => String(f).trim()).filter((f) => f && f !== frame.src) : [];
    const shot = pick(intent.shot_type, SHOTS, "medium");
    const wanted = typeof intent.aspect_ratio === "string" && /^\d+:\d+$/.test(intent.aspect_ratio.trim()) ? intent.aspect_ratio.trim() : null;
    const aspect = wanted ?? ASPECT_BY_SHOT[shot];
    const wantedHeight = Number(intent.panel_height);
    const height = Number.isFinite(wantedHeight) && wantedHeight >= 240 ? Math.min(2600, Math.round(wantedHeight / 10) * 10) : Math.min(2600, heightForAspect(aspect));
    const transition = pick(intent.transition_type, TRANSITIONS, "cut");
    const background = pick(intent.background, new Set<PanelBackground>(["white", "black", "abyss"]), base.background);
    const draft: WebtoonPanel = {
      ...base,
      source_time_start: frame.seconds,
      // Frames are one second apart: the panel covers its second, and the next batch starts at the next frame.
      source_time_end: frame.seconds + 1,
      fidelity: pick(intent.fidelity, new Set<Fidelity>(["direct", "reframe", "bridge"]), "direct"),
      narrative_role: pick(intent.narrative_role, ROLES, "action"),
      purpose: [(intent.purpose ?? "").trim(), state ? `State: ${state}` : ""].filter(Boolean).join(" "),
      description: [intent.description.trim(), state ? `STATE TO KEEP EXACTLY: ${state}` : "", cues].filter(Boolean).join(" "),
      action: (intent.action ?? "").trim(),
      emotion: (intent.emotion ?? "").trim(),
      characters: Array.isArray(intent.characters) ? intent.characters.map((c) => String(c).trim().toLowerCase()).filter(Boolean) : base.characters,
      location: (intent.location ?? base.location).trim().toLowerCase(),
      objects: Array.isArray(intent.objects) ? intent.objects.map((o) => String(o).trim().toLowerCase().replace(/^obj\./, "")).filter(Boolean) : [],
      visual_references: [...base.visual_references, ...extraFrames],
      shot_type: shot,
      camera_angle: pick(intent.camera_angle, ANGLES, "eye_level"),
      composition: (intent.composition ?? "").trim(),
      aspect_ratio: aspect,
      panel_height: height,
      bleed: typeof intent.bleed === "boolean" ? intent.bleed : base.bleed,
      border: typeof intent.border === "boolean" ? intent.border : base.border,
      frame: cleanFrame(intent.frame),
      focal_point: anchor(intent.focal_point, { x: 50, y: 50 }),
      transition_type: transition,
      spacing_before: SPACING_BY_TRANSITION[transition],
      background,
      dialogue: (intent.dialogue ?? [])
        .filter((line) => line?.en?.trim())
        .map((line, i) => ({
          speaker: (line.speaker ?? "").trim(),
          text: text(line),
          style: pick(line.style, BUBBLES, "speech"),
          anchor: anchor(line.anchor, { x: 30, y: 15 + i * 22 }),
          tail: { x: 50, y: 50 },
        })),
      caption: (intent.caption ?? [])
        .filter((box) => box?.en?.trim())
        .map((box, i) => ({
          text: text(box),
          anchor: anchor(box.anchor, { x: 8, y: 8 + i * 14 }),
          style: pick(box.style, new Set(["narration", "location", "time"] as const), "narration"),
        })),
      sfx: (intent.sfx ?? [])
        .filter((effect) => effect?.en?.trim())
        .map((effect, i) => ({
          text: text(effect),
          anchor: anchor(effect.anchor, { x: 62, y: 30 + i * 20 }),
          style: pick(effect.style, new Set(["soft", "hard", "rumble"] as const), "soft"),
          rotate: Number.isFinite(Number(effect.rotate)) ? Math.max(-90, Math.min(90, Number(effect.rotate))) : -10,
          size: Number.isFinite(Number(effect.size)) ? Math.max(30, Math.min(320, Number(effect.size))) : 96,
        })),
    };
    const panel = composePanel(draft, script, overlay);
    panels.push(panel);
    created.push(panel);
  }
  return created.map((panel, i) => ({ ...panel, order: current.length + i + 1 }));
}
