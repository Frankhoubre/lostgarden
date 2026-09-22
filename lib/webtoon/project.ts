import { FLAT_WEBTOON_BIBLE } from "./style-bible";
import type { BibleCandidate, BibleStep } from "./bible";
import type { LibraryOverlay, SourceAnalysis, WebtoonScript } from "./types";

/**
 * STUDIO PROJECTS: one webtoon per project. Lost Garden episode 1 is the
 * built-in project (its script, frames and screenplay live in the code);
 * every other project lives in Firestore and is built into a script here, so
 * the editor, the reader and every route see the same shape.
 *
 * Storage, within the rules the studio already has (no new collection):
 * - `webtoon_library/~projects`: the registry, `projects_json`, a list of
 *   `ProjectSummary`, newest first;
 * - `webtoon_library/<id>~project`: the project itself (`project_json`);
 * - `webtoon_library/<id>~frames`: the film frames (`frames_json`);
 * - `webtoon_library/<id>`, `webtoon_drafts/<id>`, `webtoon_costs/<id>`,
 *   `webtoon_published/<id>`: the library, the strip, the cost, the
 *   published version, exactly as for Lost Garden;
 * - Storage `webtoon/<id>/film/<mm>m<ss>s.jpg`: one frame per second.
 */

export const BUILT_IN_PROJECT_ID = "ep1-opening";
export const PROJECT_REGISTRY_DOC = "~projects";
export const projectDocId = (id: string) => `${id}~project`;
export const framesDocId = (id: string) => `${id}~frames`;

export type ProjectSource = "video" | "screenplay" | "scratch";

/**
 * Where the onboarding stands. The order is the order of the steps: the
 * project is usable in the editor from `done`, and can be reopened at any
 * earlier step to add what is missing.
 */
export const ONBOARDING_STEPS = ["source", "frames", "characters", "objects", "locations", "done"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type ProjectFrame = { src: string; seconds: number };

export type ProjectSummary = {
  id: string;
  title: string;
  source: ProjectSource;
  onboarding: OnboardingStep;
  created_at: string;
  updated_at: string;
  /** Thumbnail: a frame of the film or a sheet. */
  cover?: string;
};

export type StudioProject = ProjectSummary & {
  /** Language the lettering is written in first. */
  language: "fr" | "en";
  /** Id of the style bible (fixed for the project). */
  style: string;
  /** What the film is about, in a few lines: given to the writer and to the detectors. */
  synopsis: string;
  /** Screenplay text, when there is one (pasted or read from a file). */
  screenplay: string;
  video?: { name: string; duration: number; width: number; height: number; interval: number };
  frames_count?: number;
  /** What the detection proposed at each step of the bible and the author has not kept or rejected yet. */
  candidates?: Partial<Record<BibleStep, BibleCandidate[]>>;
};

export function newProjectId(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return `${base || "projet"}-${Date.now().toString(36).slice(-5)}`;
}

export function blankProject(input: { id: string; title: string; source: ProjectSource; language?: "fr" | "en" }): StudioProject {
  const now = new Date().toISOString();
  return {
    id: input.id,
    title: input.title,
    source: input.source,
    onboarding: "source",
    created_at: now,
    updated_at: now,
    language: input.language ?? "fr",
    style: FLAT_WEBTOON_BIBLE.id,
    synopsis: "",
    screenplay: "",
  };
}

export function summaryOf(project: StudioProject): ProjectSummary {
  const { id, title, source, onboarding, created_at, updated_at, cover } = project;
  return { id, title, source, onboarding, created_at, updated_at, ...(cover ? { cover } : {}) };
}

/** The library overlay a project starts with: empty, and never on top of the Lost Garden library. */
export const EMPTY_PROJECT_LIBRARY: LibraryOverlay = { assets: [], hidden: [], base: "none" };

/** `83` → `01m23s`, the name of a frame file. */
export function frameName(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}m${String(s % 60).padStart(2, "0")}s`;
}

/** `83` → `1:23`. */
export function frameLabel(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The frames as the editor lists them, with their labels. */
export function labelledFrames(frames: readonly ProjectFrame[]): { src: string; seconds: number; label: string }[] {
  return frames.map((f) => ({ src: f.src, seconds: f.seconds, label: frameLabel(f.seconds) }));
}

/** Every `step` seconds, for the pickers that would list a thousand frames otherwise. */
export function sparseFrames<T extends { seconds: number }>(frames: readonly T[], step = 5): T[] {
  return frames.filter((f) => Math.round(f.seconds) % step === 0);
}

function emptyAnalysis(project: StudioProject): SourceAnalysis {
  return {
    source_id: project.id,
    title: project.title,
    origin: {
      kind: project.source === "video" ? (project.screenplay ? "video+screenplay" : "video") : "screenplay",
      method: project.source === "video" ? "Images extraites dans le navigateur, une par seconde." : "Scénario fourni dans le studio.",
    },
    time_start: 0,
    time_end: project.video?.duration ?? 0,
    shots: [],
    dialogue: [],
    sounds: [],
    continuity: project.synopsis ? [project.synopsis] : [],
  };
}

/**
 * A project as a script: no panels yet (the draft brings them), the style
 * bible of the project, no palette of Lost Garden, no style anchor until the
 * project has approved panels.
 */
export function projectScript(project: StudioProject): WebtoonScript {
  return {
    schema_version: 1,
    slug: project.id,
    title: { en: project.title, fr: project.title },
    subtitle: { en: "", fr: "" },
    series: project.title,
    episode: 1,
    source: emptyAnalysis(project),
    canvas_width: 1080,
    style_bible_id: project.style,
    beats: [],
    panels: [],
    references: [],
    palettes: {},
    style_anchors: {},
    generated_at: project.created_at,
  };
}
