import { heightForAspect } from "./layout";
import { buildGenerationPrompt } from "./prompts";
import { resolveReferences } from "./references";
import { STYLE_BIBLE, type StyleBible } from "./style-bible";
import type {
  Anchor,
  Caption,
  CameraAngle,
  Dialogue,
  Fidelity,
  LocalizedText,
  NarrativeRole,
  PanelBackground,
  PanelImage,
  ReferenceAsset,
  Sfx,
  ShotType,
  SourceAnalysis,
  TransitionType,
  WebtoonBeat,
  WebtoonPanel,
  WebtoonScript,
} from "./types";

/**
 * WEBTOON ADAPTATION ENGINE
 *
 * Input: a source analysis (shots, dialogue, sounds, continuity), a list of
 * beats, and one *panel intent* per panel. An intent is the creative decision
 * (what the panel shows and why); the engine turns intents into fully
 * specified panels: timing pulled from the source shots, aspect ratio and
 * height from the shot grammar, vertical spacing from the transition grammar,
 * references resolved from the library, prompt composed from the bible.
 *
 * Intents are data. Today they are written by hand (or by an LLM pass) from
 * the analysis; the same engine runs on 30 seconds, an episode, or a
 * screenplay with no video at all, since nothing here needs a frame to exist.
 */

export type PanelIntent = {
  id: string;
  beat: string;
  shots: string[];
  fidelity: Fidelity;
  narrative_role: NarrativeRole;
  purpose: string;
  description: string;
  characters: string[];
  location: string;
  objects?: string[];
  action: string;
  emotion: string;
  shot_type: ShotType;
  camera_angle: CameraAngle;
  composition: string;
  /** Override the grammar's aspect ratio. */
  aspect_ratio?: string;
  /** Override the height derived from the aspect ratio (crops with focal point). */
  panel_height?: number;
  focal_point?: Anchor;
  transition_type: TransitionType;
  spacing_before?: number;
  spacing_after?: number;
  border?: boolean;
  bleed?: boolean;
  dialogue?: Dialogue[];
  caption?: Caption[];
  sfx?: Sfx[];
  /** Extra reference ids on top of what resolution finds. */
  references?: string[];
  /** Reference ids to drop even if resolution would add them. */
  exclude_references?: string[];
  prompt_notes?: string[];
  negative?: string[];
};

export type AdaptationInput = {
  slug: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  series: string;
  episode: number;
  analysis: SourceAnalysis;
  beats: WebtoonBeat[];
  intents: PanelIntent[];
  /** Location id → bible palette key. */
  palettes: Record<string, string>;
  /** Bible palette key → style anchor reference id (an approved panel). */
  style_anchors?: Record<string, string>;
  images?: Record<string, PanelImage>;
  bible?: StyleBible;
  generated_at?: string;
};

/** SHOT GRAMMAR: the vertical ratio a shot type asks for by default. */
export const ASPECT_BY_SHOT: Record<ShotType, string> = {
  extreme_wide: "9:16",
  wide: "4:5",
  full: "4:5",
  medium: "4:5",
  medium_close_up: "4:5",
  close_up: "4:5",
  extreme_close_up: "16:9",
  detail: "3:2",
  void: "3:2",
};

/**
 * TRANSITION GRAMMAR: the vertical distance before a panel, in canvas px.
 * Scrolling distance is reading time: a beat is a held breath, a fall is a
 * change of world.
 */
export const SPACING_BY_TRANSITION: Record<TransitionType, number> = {
  continuous: 40,
  cut: 90,
  beat: 170,
  breath: 280,
  hard_cut: 120,
  fall: 1100,
  fade_to_black: 900,
  fade_to_white: 700,
  time_skip: 600,
};

const MISSING_IMAGE: PanelImage = { src: "", width: 0, height: 0, status: "missing" };

function timeSpan(analysis: SourceAnalysis, shotIds: string[]) {
  const shots = shotIds.map((id) => {
    const shot = analysis.shots.find((s) => s.shot_id === id);
    if (!shot) throw new Error(`Unknown shot ${id}`);
    return shot;
  });
  if (!shots.length) return { start: null, end: null, frames: [] as string[] };
  return {
    start: Math.min(...shots.map((s) => s.time_start)),
    end: Math.max(...shots.map((s) => s.time_end)),
    frames: shots.flatMap((s) => s.frames),
  };
}

export function adaptScript(input: AdaptationInput): WebtoonScript {
  const bible = input.bible ?? STYLE_BIBLE;
  const beatById = new Map(input.beats.map((b) => [b.beat_id, b]));
  const used = new Map<string, ReferenceAsset>();

  const panels: WebtoonPanel[] = input.intents.map((intent, index) => {
    const beat = beatById.get(intent.beat);
    if (!beat) throw new Error(`Panel ${intent.id} points to unknown beat ${intent.beat}`);
    const span = timeSpan(input.analysis, intent.shots);
    const aspect = intent.aspect_ratio ?? ASPECT_BY_SHOT[intent.shot_type];
    const height = intent.panel_height ?? heightForAspect(aspect);
    const background: PanelBackground = beat.background;

    const excluded = new Set(intent.exclude_references ?? []);
    const palette = input.palettes[intent.location] ?? "";
    const references = resolveReferences({
      characters: intent.characters,
      location: intent.location,
      objects: intent.objects ?? [],
      source_frames: span.frames,
      explicit: intent.references,
      style: input.style_anchors?.[palette],
    }).filter((r) => !excluded.has(r.id));
    for (const r of references) used.set(r.id, r);

    const base = {
      panel_id: intent.id,
      beat_id: intent.beat,
      order: index + 1,
      source_time_start: span.start,
      source_time_end: span.end,
      source_shots: intent.shots,
      fidelity: intent.fidelity,
      narrative_role: intent.narrative_role,
      purpose: intent.purpose,
      description: intent.description,
      characters: intent.characters,
      location: intent.location,
      objects: intent.objects ?? [],
      action: intent.action,
      emotion: intent.emotion,
      shot_type: intent.shot_type,
      camera_angle: intent.camera_angle,
      composition: intent.composition,
      aspect_ratio: aspect,
      panel_height: height,
      focal_point: intent.focal_point ?? { x: 50, y: 50 },
      transition_type: intent.transition_type,
      spacing_before: intent.spacing_before ?? SPACING_BY_TRANSITION[intent.transition_type],
      spacing_after: intent.spacing_after ?? 0,
      background,
      border: intent.border ?? false,
      bleed: intent.bleed ?? true,
      dialogue: intent.dialogue ?? [],
      caption: intent.caption ?? [],
      sfx: intent.sfx ?? [],
      visual_references: references.map((r) => r.id),
    };

    const { prompt, negative } = buildGenerationPrompt({
      panel: base,
      references,
      bible,
      palette,
      notes: intent.prompt_notes,
      extraNegative: intent.negative,
    });

    return {
      ...base,
      generation_prompt: prompt,
      negative_constraints: negative,
      image: input.images?.[intent.id] ?? MISSING_IMAGE,
    };
  });

  return {
    schema_version: 1,
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle,
    series: input.series,
    episode: input.episode,
    source: input.analysis,
    canvas_width: 1080,
    style_bible_id: bible.id,
    beats: input.beats,
    panels,
    references: [...used.values()],
    generated_at: input.generated_at ?? new Date(0).toISOString(),
  };
}
