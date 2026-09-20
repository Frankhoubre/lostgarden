/**
 * Lost Garden · Webtoon adaptation engine · shared types.
 *
 * Field names in the panel schema are snake_case on purpose: the JSON
 * exported from these types is the contract shared with ScreenWeaver, and the
 * adaptation brief names the fields this way. The rendering side never decides
 * narration; it renders what the engine emits.
 */

import type { Locale } from "@/lib/i18n/config";

/** Canonical webtoon canvas width in CSS pixels (mobile first). */
export const WEBTOON_WIDTH = 1080;

/** Text that can be shown per locale. The `en` entry is always the original. */
export type LocalizedText = { en: string } & Partial<Record<Locale, string>>;

export type ReferenceKind = "character" | "location" | "object" | "style" | "source_frame";

/** A visual reference the generation step can attach to a prompt. */
export type ReferenceAsset = {
  id: string;
  kind: ReferenceKind;
  name: string;
  /** Public path under /public or an absolute URL. */
  image: string;
  /** What a generation model must copy from this asset. */
  must_keep: string;
  /** Natural language design description, reused inside prompts. */
  description: string;
  /** Free tags used by reference resolution (e.g. "lanterne", "altar"). */
  tags: string[];
  /** Character id this sheet belongs to; every sheet of a character is attached. */
  subject?: string;
  /** Order among a character's sheets: 1 is the model sheet. */
  priority?: number;
  /** Written or changed in the studio rather than in the code library. */
  custom?: boolean;
};

/**
 * What the studio adds to the code library: assets written there (a custom
 * asset with the id of a built-in one replaces it) and built-in ids hidden.
 */
export type LibraryOverlay = {
  assets: ReferenceAsset[];
  hidden: string[];
};

export type ShotType =
  | "extreme_close_up"
  | "close_up"
  | "medium_close_up"
  | "medium"
  | "full"
  | "wide"
  | "extreme_wide"
  | "detail"
  | "void";

export type CameraAngle =
  | "eye_level"
  | "low"
  | "high"
  | "top_down"
  | "dutch"
  | "over_the_shoulder"
  | "worm";

export type NarrativeRole =
  | "breath"
  | "establishing"
  | "character_intro"
  | "action"
  | "reaction"
  | "dialogue"
  | "detail"
  | "reveal"
  | "transition"
  | "tension"
  | "cliffhanger";

export type TransitionType =
  | "continuous"
  | "cut"
  | "beat"
  | "breath"
  | "hard_cut"
  | "fall"
  | "fade_to_black"
  | "fade_to_white"
  | "time_skip";

/** How close the panel is to a shot that exists in the source video. */
export type Fidelity =
  /** Matches a shot of the source, possibly reframed vertically. */
  | "direct"
  /** Same moment as a source shot, new framing (detail, counter-shot). */
  | "reframe"
  /** Bridges two source shots without adding a new action. */
  | "bridge";

export type PanelBackground = "white" | "black" | "abyss";

/** Anchor inside a panel, in percent of width/height. */
export type Anchor = { x: number; y: number };

export type BubbleStyle = "speech" | "whisper" | "thought" | "shout" | "off";

export type Dialogue = {
  speaker: string;
  text: LocalizedText;
  style: BubbleStyle;
  anchor: Anchor;
  /** Where the tail points, or omit for off-panel voices. */
  tail?: Anchor;
};

export type Caption = {
  text: LocalizedText;
  anchor: Anchor;
  style: "narration" | "location" | "time";
};

export type Sfx = {
  text: LocalizedText;
  anchor: Anchor;
  /** Rotation in degrees, size in canvas px. */
  rotate?: number;
  size?: number;
  style: "soft" | "hard" | "rumble";
};

/** Output of the generation step for a panel. */
export type PanelImage = {
  src: string;
  width: number;
  height: number;
  model?: string;
  job_id?: string;
  generated_at?: string;
  /** `stale` means the prompt changed after the image was made. */
  status: "generated" | "stale" | "missing";
};

export type WebtoonPanel = {
  panel_id: string;
  beat_id: string;
  /** Position inside the script, 1-based. */
  order: number;
  source_time_start: number | null;
  source_time_end: number | null;
  /** Shot ids of the source analysis this panel draws from. */
  source_shots: string[];
  fidelity: Fidelity;
  narrative_role: NarrativeRole;
  /** Why the panel exists, one or two sentences. */
  purpose: string;
  description: string;
  characters: string[];
  location: string;
  objects: string[];
  action: string;
  emotion: string;
  shot_type: ShotType;
  camera_angle: CameraAngle;
  composition: string;
  /** Aspect ratio requested from the generator, e.g. "9:16". */
  aspect_ratio: string;
  /** Rendered height in canvas px at WEBTOON_WIDTH. */
  panel_height: number;
  /** Point of the image kept visible when the panel crops it (percent). */
  focal_point: Anchor;
  transition_type: TransitionType;
  spacing_before: number;
  spacing_after: number;
  background: PanelBackground;
  border: boolean;
  bleed: boolean;
  dialogue: Dialogue[];
  caption: Caption[];
  sfx: Sfx[];
  visual_references: string[];
  generation_prompt: string;
  negative_constraints: string[];
  /**
   * `true` when the studio composes the prompt from the panel's fields
   * (description, action, characters, location, shot) before each
   * generation. Engine panels leave it unset: their prompt is the engine's.
   */
  prompt_auto?: boolean;
  image: PanelImage;
};

/** A narrative beat groups panels that share one dramatic intention. */
export type WebtoonBeat = {
  beat_id: string;
  title: string;
  intent: string;
  source_time_start: number | null;
  source_time_end: number | null;
  background: PanelBackground;
};

export type SourceShot = {
  shot_id: string;
  time_start: number;
  time_end: number;
  /** `approx` when the timing comes from sparse frames, not a cut list. */
  timing: "exact" | "approx";
  description: string;
  characters: string[];
  location: string;
  action: string;
  emotion: string;
  shot_type: ShotType;
  camera_angle: CameraAngle;
  dialogue: { time: number; speaker: string; text: string }[];
  sounds: string[];
  /** Local path or URL of a frame of this shot, used as composition reference. */
  frames: string[];
  notes?: string;
};

/** The narrative analysis of a slice of source material. */
export type SourceAnalysis = {
  source_id: string;
  title: string;
  /** Where the analysis comes from: a video, a screenplay, or both. */
  origin: {
    kind: "video" | "screenplay" | "video+screenplay";
    video_url?: string;
    screenplay_ref?: string;
    /** How the timeline was reconstructed, for honesty in the export. */
    method: string;
  };
  time_start: number;
  time_end: number;
  shots: SourceShot[];
  /** Dialogue with exact timestamps when a subtitle track exists. */
  dialogue: { time: number; speaker: string; text: string }[];
  /** Sounds worth translating into SFX, or deliberately not. */
  sounds: { time: number; sound: string; graphic: boolean; note?: string }[];
  /** Continuity facts every panel must respect. */
  continuity: string[];
};

export type WebtoonScript = {
  schema_version: 1;
  slug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  series: string;
  episode: number;
  source: SourceAnalysis;
  canvas_width: number;
  style_bible_id: string;
  beats: WebtoonBeat[];
  panels: WebtoonPanel[];
  /** Reference assets used by at least one panel. */
  references: ReferenceAsset[];
  /** Location id → bible palette key, so the studio can compose new panels. */
  palettes?: Record<string, string>;
  /** Bible palette key → style anchor reference id. */
  style_anchors?: Record<string, string>;
  generated_at: string;
};

/** Layout entry: absolute vertical placement of a panel on the strip. */
export type PanelPlacement = {
  panel_id: string;
  top: number;
  height: number;
  gap_before: number;
  gap_after: number;
  background: PanelBackground;
};

export type WebtoonLayout = {
  width: number;
  total_height: number;
  placements: PanelPlacement[];
};
