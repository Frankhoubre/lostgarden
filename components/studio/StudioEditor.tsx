"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { PanelCanvas } from "@/components/studio/PanelCanvas";
import { sfxFont } from "@/components/webtoon/fonts";
import { PanelInpaint, retouchImage, type RetouchRequest } from "@/components/studio/PanelInpaint";
import { CastPicker } from "@/components/studio/CastPicker";
import { PanelHistory } from "@/components/studio/PanelHistory";
import { StudioReview } from "@/components/studio/StudioReview";
import { MentionTextarea, type MentionItem } from "@/components/studio/MentionTextarea";
import { ProgressBar } from "@/components/studio/ProgressBar";
import type { PanelBusy } from "@/components/studio/PanelCanvas";
import { imageVersions, originLabel, restoreImage, withNewImage } from "@/lib/webtoon/image-history";
import type { TrackTask } from "@/lib/webtoon/notifications";
import { stateOf } from "@/lib/webtoon/panel-state";
import { SEQUENCE_LABEL, guideSlice, paceOfKind, sequenceAt, type FilmGuide } from "@/lib/webtoon/film-guide";
import { applyRhythm } from "@/lib/webtoon/rhythm";
import { SFX_LIBRARY, SFX_STYLES, SFX_STYLE_LABEL, freeSpot, type SfxStyle } from "@/lib/webtoon/sfx-library";
import { PhonePreview } from "@/components/studio/PhonePreview";
import { EpisodeHandoffCard } from "@/components/studio/EpisodeHandoffCard";
import { HANDOFF_PANELS, loadHandoff, type EpisodeHandoff } from "@/lib/webtoon/handoff-client";
import { BUILT_IN_PROJECT_ID } from "@/lib/webtoon/project";
import { startJob } from "@/lib/webtoon/job-client";
import { REVIEW_LABEL, needsFinish, reviewOf, reviewProgress, withReview, type ReviewState } from "@/lib/webtoon/review";
import { fitLettering, letteringIssues, measureLettering, type LetteringIssue } from "@/components/studio/lettering-fit";
import { StripCanvas } from "@/components/studio/StripCanvas";
import { StudioDirector } from "@/components/studio/StudioDirector";
import type { DirectorAction } from "@/app/api/webtoon/[slug]/director/route";
import { cleanFrame, panelsFromIntents, type NextPanelIntent } from "@/lib/webtoon/continue";
import { coveredUntil, SECONDS_PER_PANEL } from "@/lib/webtoon/continuity";
import { PanelDragGhost } from "@/components/studio/PanelDragGhost";
import { usePanelDrag, type DropTarget } from "@/components/studio/usePanelDrag";
import { uploadLibraryImage, upsertAsset, slugify } from "@/lib/webtoon/library";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { JobSummary } from "@/components/studio/StudioApp";
import { getFirebaseAuth } from "@/lib/firebase";
import type { Locale } from "@/lib/i18n/config";
import { SPACING_BY_TRANSITION } from "@/lib/webtoon/adaptation";
import { attachedFrames, composePanel, needsComposition, panelForGeneration } from "@/lib/webtoon/compose";
import {
  appendFromFrame,
  deletePanel,
  deletePanels,
  setLayer,
  renumber,
  insertAfter,
  markForRegeneration,
  mergeWithNext,
  movePanel,
  movePanelsTo,
  setTransition,
  splitPanel,
  toggleFrame,
  updatePanel,
} from "@/lib/webtoon/editor-ops";
import { buildGenerationRequest } from "@/lib/webtoon/generation";
import { computeLayout } from "@/lib/webtoon/layout";
import { libraryCharacters, libraryLocations, libraryObjects, libraryWith, panelReferenceNumber, panelReferenceSrc, referencesForPanel } from "@/lib/webtoon/references";
import { imageSize, readFileAsDataUrl, uploadPanelImage } from "@/lib/webtoon/studio";
import { studioFilmFrames, studioFilmFramesDense } from "@/lib/webtoon/studio-assets";
import { applyTranslations, itemsToTranslate, type LetteringItem } from "@/lib/webtoon/translate";
import type {
  BubbleStyle,
  CameraAngle,
  Fidelity,
  LibraryOverlay,
  LocalizedText,
  PanelAuditIssue,
  PanelFrame,
  NarrativeRole,
  PanelBackground,
  ShotType,
  TransitionType,
  WebtoonPanel,
  WebtoonScript,
 ReferenceAsset } from "@/lib/webtoon/types";

const SHOT_TYPES: ShotType[] = ["extreme_wide", "wide", "full", "medium", "medium_close_up", "close_up", "extreme_close_up", "detail", "void"];
const ANGLES: CameraAngle[] = ["eye_level", "low", "high", "top_down", "dutch", "over_the_shoulder", "worm"];
const TRANSITIONS = Object.keys(SPACING_BY_TRANSITION) as TransitionType[];
const BACKGROUNDS: PanelBackground[] = ["white", "black", "abyss"];
const BUBBLES: BubbleStyle[] = ["speech", "whisper", "thought", "shout", "off"];
const FIDELITIES: Fidelity[] = ["direct", "reframe", "bridge"];
const ROLES: NarrativeRole[] = ["breath", "establishing", "character_intro", "action", "reaction", "dialogue", "detail", "reveal", "transition", "tension", "cliffhanger"];
/** Lost Garden episode 1: one frame every five seconds, the pickers of the editor. */
const LOST_GARDEN_FRAMES = studioFilmFrames();
/** Images generated at the same time by a batch. */
const IMAGE_CONCURRENCY = 3;

/**
 * What the continue route needs from the strip: every panel's id, order and
 * timecodes (to number the new panels and know where the film stops), and
 * the last panels in full (continuity, helmet, lines already lettered).
 * Sending the whole strip with every prompt made each call several MB at
 * 340 panels.
 */
function slimForContinue(panels: readonly WebtoonPanel[]): WebtoonPanel[] {
  const full = 16;
  return panels.map((p, i) =>
    i >= panels.length - full
      ? p
      : ({ panel_id: p.panel_id, order: p.order, source_time_start: p.source_time_start, source_time_end: p.source_time_end, prompt_auto: p.prompt_auto, description: "", purpose: "", characters: [], objects: [], dialogue: [], caption: [], sfx: [], image: { status: p.image.status } } as unknown as WebtoonPanel),
  );
}

/** Headers of a generation call: the Firebase token, or the local bypass on the dev server. */
async function studioHeaders(): Promise<Record<string, string>> {
  const token = (await getFirebaseAuth().currentUser?.getIdToken().catch(() => "")) ?? "";
  if (token) return { Authorization: `Bearer ${token}` };
  if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("dev")) {
    return { "x-studio-dev": "1" };
  }
  return {};
}

type GeneratePayload = {
  /** Public URL when the server stored the image itself. */
  src?: string;
  data_url?: string;
  cost_usd?: number;
  model?: string;
  error?: string;
  generation_prompt?: string;
  negative_constraints?: string[];
  visual_references?: string[];
  /** The bubbles placed from where the characters are in the drawn image. */
  dialogue?: WebtoonPanel["dialogue"];
  /** Taller when the bubbles need it. */
  panel_height?: number;
  /** Sound effects moved off the bubbles. */
  sfx?: WebtoonPanel["sfx"];
  /** What the image check found: faults of the first drawing, and those left after the redraw. */
  check?: { first: string[]; remaining: string[]; redrawn: boolean };
};

/**
 * A running job of the studio: writing the next panels, generating images
 * one by one, or translating. Drives the progress bar, the skeleton cards,
 * the spinner on the panel being made and the time estimate.
 */
type Job = {
  phase: "writing" | "images" | "translating";
  label: string;
  done: number;
  total: number;
  /** Panels waiting for their image, in order. */
  queue: string[];
  /** Panel whose image is being generated right now (the first of `running`). */
  current: string | null;
  /** Every panel whose image is being generated right now: several run at once. */
  running?: string[];
  /** Skeleton cards shown while the writer drafts the panels. */
  placeholders: number;
  /** When the current estimate says the job ends. */
  deadline: number;
  /** When the current phase started: the progress bar runs from here to the deadline. */
  started?: number;
  /** When each running panel's image started. */
  runningSince?: Record<string, number>;
};

const ESTIMATE = { writeBase: 25_000, writePer: 5_000, image: 50_000, retouch: 42_000, translateBase: 10_000, translatePer: 1_000 };

/** A deadline `ms` from now, kept out of the component so the lint knows it is not render work. */
function deadlineIn(ms: number): number {
  return Date.now() + ms;
}


/** Panels that still need an image: none yet, or the prompt changed since. */
function pendingPanels(panels: WebtoonPanel[]): WebtoonPanel[] {
  return panels.filter((p) => p.image.status !== "generated" && (p.description.trim() || p.generation_prompt.trim()));
}

const LABEL: Record<string, string> = {
  white: "Blanc", black: "Noir", abyss: "Bleu abysse",
  establishing: "Situation", character_intro: "Entrée d'un personnage", action: "Action", reaction: "Réaction",
  dialogue: "Dialogue", detail: "Détail", reveal: "Révélation", transition: "Transition", tension: "Tension", cliffhanger: "Suspens",
  speech: "Parole", whisper: "Chuchoté", thought: "Pensée", shout: "Cri", off: "Hors champ",
  soft: "Doux", hard: "Dur", rumble: "Grondement",
  direct: "Plan du film", reframe: "Même instant, recadré", bridge: "Pont",
  continuous: "Continu", cut: "Coupe", beat: "Temps", breath: "Respiration", hard_cut: "Coupe sèche", fall: "Chute",
  fade_to_black: "Fondu au noir", fade_to_white: "Fondu au blanc", time_skip: "Ellipse",
};
const label = (value: string) => LABEL[value] ?? value;

type StudioEditorProps = {
  script: WebtoonScript;
  panels: WebtoonPanel[];
  setPanels: Dispatch<SetStateAction<WebtoonPanel[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  notify: (message: string) => void;
  /** Opens a running entry in the notification center, ended by the editor when the work is done. */
  track?: TrackTask;
  /** Past the episode's budget, asks the author before a batch or a continuation; true to go on. */
  checkBudget?: () => boolean;
  /** Ask the studio to write the draft once the current panels are rendered. */
  onAutosave?: () => void;
  /** The studio's characters and locations, attached to every generation. */
  library: LibraryOverlay;
  setLibrary: (next: LibraryOverlay) => void;
  /** Language of the lettering shown in the canvas and the strip preview. */
  previewLocale: Locale;
  /** Reports the running job so the bar can show it from every tab. */
  onJob?: (job: JobSummary) => void;
  /** Reports the panels ticked in the list, in strip order (the social teaser starts from them). */
  onCheckedChange?: (ids: string[]) => void;
  /** The film guide (sequences, second by second lines): the "auto" pace follows it and the writer reads it. */
  guide?: FilmGuide | null;
  /** The whole film, one frame per second, for the review against the strip; Lost Garden's when unset. */
  allFrames?: { src: string; seconds: number; label: string }[];
  /** Frames of the project's film offered by the pickers (every five seconds); Lost Garden's when unset. */
  filmFrames?: { src: string; seconds: number; label: string }[];
};

/**
 * The working view of the strip: the list on the left, the selected panel
 * at working size in the middle with draggable lettering, the inspector on
 * the right. Every change goes through the pure editor operations, so the
 * public reader renders exactly what is edited here.
 */
export function StudioEditor({ script, panels, setPanels, selectedId, setSelectedId, notify, track, checkBudget, onAutosave, library, setLibrary, previewLocale, onJob, onCheckedChange, filmFrames, allFrames, guide = null }: StudioEditorProps) {
  useLocale();
  const FILM_FRAMES = filmFrames ?? LOST_GARDEN_FRAMES;
  const ALL_FRAMES = useMemo(() => allFrames ?? studioFilmFramesDense(), [allFrames]);
  const locale = previewLocale;
  const CHARACTERS = useMemo(() => libraryCharacters(library), [library]);
  const LOCATIONS = useMemo(() => libraryLocations(library), [library]);
  const OBJECTS = useMemo(() => libraryObjects(library), [library]);
  /** What "@" calls in a prompt: the characters, places and objects of the library, and the panels drawn so far. */
  const MENTIONS = useMemo<MentionItem[]>(
    () => [
      ...CHARACTERS.map((c) => ({ kind: "character" as const, id: c.id, name: c.name, image: c.image, avatar: c.avatar })),
      ...LOCATIONS.map((l) => ({ kind: "location" as const, id: l.id, name: l.name, image: l.image })),
      ...OBJECTS.map((o) => ({ kind: "object" as const, id: o.id, name: o.name, image: o.image })),
      ...panels
        .filter((p) => p.image.src && p.image.status !== "missing")
        .map((p) => ({ kind: "panel" as const, id: p.panel_id, name: `Case ${p.order}`, image: p.image.src, hint: p.description.slice(0, 70) })),
    ],
    [CHARACTERS, LOCATIONS, OBJECTS, panels],
  );
  const { user } = useAuth();
  /** `panel`: the selected panel alone; `strip`: the whole strip as the reader sees it; `review`: the strip against the film. */
  const [view, setView] = useState<"panel" | "strip" | "review" | "phone">(() => {
    try {
      const stored = window.localStorage.getItem("studio.view");
      return stored === "strip" || stored === "review" || stored === "phone" ? stored : "panel";
    } catch {
      return "panel";
    }
  });
  const chooseView = (next: "panel" | "strip" | "review" | "phone") => {
    setView(next);
    try {
      window.localStorage.setItem("studio.view", next);
    } catch {
      // Storage may be unavailable; the choice just does not persist.
    }
  };
  /** Image quality: same 1K size either way; "medium" saves about 0.03 $ a panel and half the time (measured 23 September 2026). */
  // "low": a sketch, to judge framing and layout for a few cents; the approved ones are finished in HD later.
  const [quality, setQuality] = useState<"high" | "medium" | "low">(() => {
    try {
      const stored = window.localStorage.getItem("studio.quality");
      return stored === "medium" || stored === "low" ? stored : "high";
    } catch {
      return "high";
    }
  });
  const chooseQuality = (next: "high" | "medium" | "low") => {
    setQuality(next);
    try {
      window.localStorage.setItem("studio.quality", next);
    } catch {
      // Storage may be unavailable; the choice just does not persist.
    }
  };
  const [showFocal, setShowFocal] = useState(false);
  const [busy, setBusy] = useState(false);
  /**
   * Panels being redrawn one by one ("Regénérer l'image"): each has its own
   * state, so several can be drawn at once, while a long run goes on too.
   * The studio's lock (`busy`) is only for the long runs.
   */
  const [drawing, setDrawing] = useState<Map<string, { kind: "generate" | "retouch"; started: number }>>(() => new Map());
  const startDrawing = (id: string, kind: "generate" | "retouch") => setDrawing((current) => new Map(current).set(id, { kind, started: Date.now() }));
  const stopDrawing = (id: string) =>
    setDrawing((current) => {
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  // A long run in a background tab was frozen by Chrome mid-run (fetches left pending, nothing saved).
  // Chrome does not freeze a page that holds a Web Lock: hold one while a job runs.
  const working = busy || drawing.size > 0;
  useEffect(() => {
    if (!working || typeof navigator === "undefined" || !navigator.locks) return;
    let release: () => void = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    void navigator.locks.request("lostgarden-studio-job", () => held).catch(() => {});
    return () => release();
  }, [working]);
  const [job, setJob] = useState<Job | null>(null);
  const [nextCount, setNextCount] = useState(10);
  /** The continuation is asked in panels or in seconds of film ("the next 30 seconds"). */
  const [nextUnit, setNextUnit] = useState<"panels" | "seconds">("panels");
  /** "auto": the kind of the film sequence decides (action, calm...), as read in the film guide. */
  const [pace, setPace] = useState<"auto" | "calm" | "normal" | "action">("auto");
  /** The pace a stretch starting here gets: the one chosen, or the one of the guide's sequence in "auto". */
  const paceAt = (seconds: number): "calm" | "normal" | "action" => {
    if (pace !== "auto") return pace;
    const sequence = sequenceAt(guide, seconds);
    return sequence ? paceOfKind(sequence.kind, sequence.intensity) : "normal";
  };
  const paceWord = (value: "calm" | "normal" | "action") => (value === "action" ? "action" : value === "calm" ? "calme" : "normal");
  const [inpaintOpen, setInpaintOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Latest panels and library, for the director's actions that run one after the other.
  const panelsRef = useRef(panels);
  const libraryRef = useRef(library);
  useEffect(() => {
    panelsRef.current = panels;
    libraryRef.current = library;
  }, [panels, library]);
  // The Delete key deletes the selected panel, unless the author is typing or a window is open.
  const deleteRef = useRef<() => void>(() => {});
  useEffect(() => {
    deleteRef.current = deleteSelected;
  });
  // V validates the selected panel and X sends it back, both moving to the next one: a whole episode reviewed from the keyboard.
  const reviewKeyRef = useRef<(status: ReviewState) => void>(() => {});
  useEffect(() => {
    reviewKeyRef.current = (status) => {
      const current = panelsRef.current.find((p) => p.panel_id === selectedId);
      if (current) review(current, status, undefined, true);
    };
  });
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const k = event.key.toLowerCase();
      if (k !== "v" && k !== "x") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], dialog")) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      reviewKeyRef.current(k === "v" ? "approved" : "redo");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], dialog")) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      deleteRef.current();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const [inspectorTab, setInspectorTab] = useState<"scene" | "text" | "layout">("scene");
  const [panelMenuOpen, setPanelMenuOpen] = useState(false);
  const panelMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panelMenuOpen) return;
    const close = (event: MouseEvent) => {
      if (panelMenuRef.current && !panelMenuRef.current.contains(event.target as Node)) setPanelMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [panelMenuOpen]);
  /** Panels ticked in the list for a batch action (regenerate, translate, delete). */
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  /** Bubbles and captions too big for their panel in some language, from the last check (null: not checked). */
  const [letterIssues, setLetterIssues] = useState<LetteringIssue[] | null>(null);
  /** The summary of the check against the sheets, closed by the author until the next check. */
  const [hideAudit, setHideAudit] = useState(false);
  /** The list shows every panel, or those of one review state. */
  const [listFilter, setListFilter] = useState<"all" | ReviewState | "sketch">("all");
  /** Long runs on the server, so the tab can be closed (lib/webtoon/studio-job.ts). Remembered per browser. */
  const [background, setBackground] = useState(() => {
    try {
      return window.localStorage.getItem("studio.background") === "1";
    } catch {
      return false;
    }
  });
  const chooseBackground = (on: boolean) => {
    setBackground(on);
    try {
      window.localStorage.setItem("studio.background", on ? "1" : "0");
    } catch {
      // The choice just does not persist.
    }
  };
  /** Hands a run to the server; the bar under the header follows it and this tab merges each of its saves. */
  const runInBackground = async (input: Parameters<typeof startJob>[1]) => {
    if (!user) {
      notify("Connectez-vous au studio pour lancer un travail en arrière-plan.");
      return;
    }
    const result = await startJob(script.slug, { ...input, params: { quality, ...input.params } });
    notify(result.ok ? `${input.label} : lancé en arrière-plan. Vous pouvez fermer l'onglet, le travail continue sur le serveur.` : `Arrière-plan impossible : ${result.error}`);
  };

  /** Where the episode before left the characters (a project's own episode only, never the first one). */
  const [handoff, setHandoff] = useState<EpisodeHandoff | null>(null);
  const handoffRef = useRef<EpisodeHandoff | null>(null);
  handoffRef.current = handoff;
  const opensSeries = script.slug === BUILT_IN_PROJECT_ID;
  useEffect(() => {
    if (opensSeries || !user) return;
    let cancelled = false;
    void loadHandoff(script.slug)
      .then((value) => {
        if (!cancelled) setHandoff(value);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [script.slug, user, opensSeries]);
  const lastChecked = useRef<string | null>(null);
  const stopBatch = useRef(false);
  /** Measured image durations, so the estimate learns from the real speed (kept in the browser across visits). */
  const imageTimes = useRef<number[]>([]);
  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("studio-image-times") ?? "[]") as number[];
      if (Array.isArray(stored)) imageTimes.current = stored.filter((t) => Number.isFinite(t) && t > 5_000 && t < 400_000).slice(-10);
    } catch {
      // No storage: the default estimate is used.
    }
  }, []);

  useEffect(() => {
    onJob?.(job ? { label: job.label, done: job.done, total: job.total, deadline: job.deadline, started: job.started } : null);
  }, [job, onJob]);
  useEffect(() => {
    onCheckedChange?.(panels.filter((p) => checked.has(p.panel_id)).map((p) => p.panel_id));
  }, [checked, panels, onCheckedChange]);
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => panels.find((p) => p.panel_id === selectedId) ?? panels[0] ?? null, [panels, selectedId]);
  const selectedPanelId = selected?.panel_id ?? null;

  // The list on the left follows the selection: a click on a panel of the strip (or the arrows, or
  // the director) brings its thumbnail into view and makes it flash once. Only the list scrolls,
  // never the page, so the strip stays where the author clicked.
  const listRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list || !selectedPanelId) return;
    const item = list.querySelector<HTMLElement>(`[data-drop-id="${CSS.escape(selectedPanelId)}"]`);
    if (!item) return;
    if (list.scrollHeight > list.clientHeight + 4) {
      const box = list.getBoundingClientRect();
      const at = item.getBoundingClientRect();
      if (at.top < box.top + 48 || at.bottom > box.bottom - 48) {
        // A smooth scroll never runs in a hidden tab: jump there instead.
        list.scrollTo({ top: list.scrollTop + (at.top - box.top) - list.clientHeight / 2 + at.height / 2, behavior: document.hidden ? "auto" : "smooth" });
      }
    }
    item.classList.remove("is-flash");
    // Restart the animation when the same panel is selected again.
    void item.offsetWidth;
    item.classList.add("is-flash");
    const done = window.setTimeout(() => item.classList.remove("is-flash"), 1200);
    return () => window.clearTimeout(done);
  }, [selectedPanelId]);
  const layout = useMemo(() => computeLayout(panels), [panels]);
  const index = selected ? panels.findIndex((p) => p.panel_id === selected.panel_id) : -1;

  const patch = (changes: Partial<WebtoonPanel>) => {
    if (!selected) return;
    setPanels((current) => updatePanel(current, selected.panel_id, changes));
  };

  const select = (id: string | null) => {
    setSelectedId(id);
    // The panel last clicked is where a Shift+click range starts, whichever way it goes (up or down the list).
    if (id) lastChecked.current = id;
  };

  const step = (delta: number) => {
    const next = panels[index + delta];
    if (next) select(next.panel_id);
  };

  /** Store an image on a panel: uploaded to Storage when signed in, kept in the session otherwise. */
  /** Put a new image on the panel; the one it replaces stays in the panel's history. Returns the image's URL. */
  const applyImage = async (panel: WebtoonPanel, dataUrl: string, model?: string, extra: Partial<WebtoonPanel> = {}, cost?: number, origin: "generate" | "inpaint" | "upload" = "generate", note?: string): Promise<string> => {
    let src = dataUrl;
    if (user && dataUrl.startsWith("data:")) {
      try {
        src = await uploadPanelImage(script.slug, panel.panel_id, dataUrl);
      } catch (error) {
        notify(`Image gardée dans la session seulement : ${error instanceof Error ? error.message : "envoi impossible"}`);
      }
    }
    const size = await imageSize(dataUrl).catch(() => ({ width: 1080, height: panel.panel_height }));
    const image = { src, width: size.width, height: size.height, model, generated_at: new Date().toISOString(), status: "generated" as const, origin, ...(origin === "generate" ? { quality } : {}), ...(note ? { note } : {}), ...(cost ? { cost_usd: cost } : {}) };
    setPanels((current) => current.map((p) => (p.panel_id === panel.panel_id ? withNewImage({ ...p, ...extra }, image) : p)));
    return src;
  };

  /** One generation call for one panel; the composed prompt comes back with the image. */
  /**
   * The panel before in the strip, for the continuity of the image check: the nearest earlier panel with
   * an image, and the nearest earlier state line (a helmet off stays off until a panel says otherwise).
   */
  const previousFor = (id: string): { image?: string; state?: string; description?: string } | undefined => {
    const list = panelsRef.current;
    const at = list.findIndex((p) => p.panel_id === id);
    const before = at > 0 ? list.slice(Math.max(0, at - 8), at).reverse() : [];
    const withImage = before.find((p) => p.image.src && p.image.status !== "missing");
    const withState = before.find((p) => stateOf(p.description));
    // The opening of an episode: nothing before says the state yet, the end of the episode before does.
    const opening = handoffRef.current;
    if (opening?.text && at >= 0 && at < HANDOFF_PANELS && !withState) {
      return { image: withImage?.image.src ?? (at === 0 ? opening.image : undefined), state: opening.text, description: withImage?.description ?? `the last panel of ${opening.from_title}` };
    }
    if (!withImage && !withState) return undefined;
    return { image: withImage?.image.src, state: withState ? stateOf(withState.description) : undefined, description: withImage?.description };
  };

  /** The image's URL when it worked, null otherwise. */
  const generateOne = async (panel: WebtoonPanel, onFailure?: (reason: string) => void): Promise<string | null> => {
    try {
      const response = await fetch(`/api/webtoon/${script.slug}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ panel_id: panel.panel_id, panel, library: libraryRef.current, quality, previous: previousFor(panel.panel_id) }),
      });
      const payload = (await response.json().catch(() => ({}))) as GeneratePayload;
      const received = payload.src ?? payload.data_url;
      if (!response.ok || !received) {
        notify(`${panel.panel_id} : ${payload.error ?? `erreur ${response.status}`}`);
        setPanels((current) => markForRegeneration(current, panel.panel_id));
        onFailure?.(payload.error ?? `erreur ${response.status}`);
        return null;
      }
      const composed: Partial<WebtoonPanel> = {
        ...(needsComposition(panel) && payload.generation_prompt
          ? { generation_prompt: payload.generation_prompt, negative_constraints: payload.negative_constraints ?? panel.negative_constraints, visual_references: payload.visual_references ?? panel.visual_references, prompt_auto: true }
          : {}),
        ...(payload.dialogue ? { dialogue: payload.dialogue } : {}),
        ...(payload.sfx ? { sfx: payload.sfx } : {}),
        ...(payload.panel_height && payload.panel_height > panel.panel_height ? { panel_height: payload.panel_height } : {}),
      };
      if (payload.check?.remaining.length) notify(`${panel.panel_id} : ${payload.check.remaining.join(" ")}`);
      return await applyImage(panel, received, payload.model, composed, payload.cost_usd, "generate");
    } catch (error) {
      onFailure?.(error instanceof Error ? error.message : "erreur de génération");
      notify(error instanceof Error ? error.message : "Erreur de génération");
      return null;
    }
  };

  /**
   * The review adds a panel from the film: the frame of that second, after that panel, described by the
   * gesture or the guide line, then drawn right away (the panel before gives the continuity).
   */
  const addFromFilm = async (input: { seconds: number; afterId: string; description: string }) => {
    const frame = ALL_FRAMES.find((f) => f.seconds === input.seconds);
    if (!frame) return;
    const before = panelsRef.current;
    const next = appendFromFrame(before, { src: frame.src, seconds: frame.seconds }, input.afterId);
    const created = next.find((p) => !before.some((q) => q.panel_id === p.panel_id));
    if (!created) return;
    const panel: WebtoonPanel = { ...created, description: input.description.trim() || created.description, prompt_auto: true };
    const list = next.map((p) => (p.panel_id === panel.panel_id ? panel : p));
    panelsRef.current = list;
    setPanels(list);
    select(panel.panel_id);
    onAutosave?.();
    if (!panel.description.trim()) {
      notify(`Case ${panel.order} ajoutée à ${frame.label} : écrivez sa description, puis « Générer l'image »`);
      return;
    }
    startDrawing(panel.panel_id, "generate");
    const task = track?.(`Case ${panel.order} · ajoutée depuis le film (${frame.label})`, panel.panel_id, imageEstimate());
    let failure = "la génération a échoué";
    try {
      const src = await generateOne(panel, (reason) => {
        failure = reason;
      });
      if (src) {
        task?.done("case dessinée depuis l'image du film", src);
        onAutosave?.();
      } else task?.fail(failure);
    } finally {
      stopDrawing(panel.panel_id);
    }
  };

  /** Delete the selected panel (button on the panel, the toolbar, or the Delete key), the next one selected. */
  const deleteSelected = () => {
    const current = panelsRef.current;
    const at = current.findIndex((p) => p.panel_id === selectedId);
    if (at < 0) return;
    const target = current[at];
    if (drawing.has(target.panel_id)) return notify("Cette case est en train d'être dessinée : attendez la fin avant de la supprimer");
    if (!window.confirm(`Supprimer la case ${target.order} (${target.panel_id}) ?`)) return;
    const next = deletePanel(current, target.panel_id);
    setPanels(next);
    select(next[Math.min(at, next.length - 1)]?.panel_id ?? null);
    onAutosave?.();
    notify(`Case ${target.order} supprimée`);
  };

  /** "Mettre au-dessus" / "Mettre en dessous": in front of or behind the panels it can overlap. */
  const moveLayer = (id: string, direction: "front" | "back") => {
    setPanels((current) => setLayer(current, id, direction));
    onAutosave?.();
  };

  const regenerate = async () => {
    if (!selected || drawing.has(selected.panel_id)) return;
    if (!selected.description.trim() && !selected.generation_prompt.trim()) {
      notify("Écris d'abord une description de la case");
      return;
    }
    const panel = selected;
    startDrawing(panel.panel_id, "generate");
    const task = track?.(`Case ${panel.order} · ${panel.image.src ? "nouvelle image" : "première image"}`, panel.panel_id, imageEstimate());
    let failure = "la génération a échoué";
    try {
      const src = await generateOne(panel, (reason) => {
        failure = reason;
      });
      if (src) {
        task?.done(panel.image.src ? "image regénérée, l'ancienne est dans l'historique" : "image générée", src);
        onAutosave?.();
      } else task?.fail(failure);
    } finally {
      stopDrawing(panel.panel_id);
    }
  };

  /**
   * A retouch launched from the window, which is already closed: the panel
   * shows a loader, the notification center a running entry, and the new
   * image takes the place of the current one when it arrives (the current
   * one goes to the history). Several panels can be retouched at once.
   */
  const runRetouch = async (panel: WebtoonPanel, request: RetouchRequest) => {
    startDrawing(panel.panel_id, "retouch");
    const short = request.prompt.length > 70 ? `${request.prompt.slice(0, 67)}…` : request.prompt;
    const task = track?.(`Case ${panel.order} · ${request.mask ? "retouche d'une zone" : "modification"}`, panel.panel_id, ESTIMATE.retouch);
    try {
      // A retouch has no sketch tier: an edit at low quality would coarsen the panel.
      const dataUrl = await retouchImage({ ...request, slug: script.slug, panel, library: libraryRef.current, quality: quality === "low" ? "medium" : quality });
      const src = await applyImage(panel, dataUrl, "inpaint", {}, undefined, "inpaint", request.prompt);
      onAutosave?.();
      if (task) task.done(`« ${short} »`, src);
      else notify(request.mask ? "Zone retouchée" : "Case modifiée");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "retouche impossible";
      if (task) task.fail(reason);
      else notify(`Retouche impossible : ${reason}`);
    } finally {
      stopDrawing(panel.panel_id);
    }
  };

  /** Bring back an earlier image of the panel; the current one goes to the history. */
  const pickVersion = (panel: WebtoonPanel, src: string) => {
    setPanels((current) => current.map((p) => (p.panel_id === panel.panel_id ? restoreImage(p, src) : p)));
    onAutosave?.();
    notify(`Case ${panel.order} : autre version de l'image remise`);
  };

  /** Generate every panel without a current image, one after the other, in strip order. */
  const generatePending = async () => {
    if (busy) return;
    if (checkBudget && !checkBudget()) return;
    const todo = pendingPanels(panels);
    if (!todo.length) {
      notify("Toutes les cases ont une image à jour");
      return;
    }
    if (!window.confirm(`Générer ${todo.length} case${todo.length > 1 ? "s" : ""} (${todo.map((p) => p.panel_id).join(", ")})${background ? " en arrière-plan" : ""} ?`)) return;
    if (background) {
      await runInBackground({ kind: "images", label: `${todo.length} image${todo.length > 1 ? "s" : ""} manquante${todo.length > 1 ? "s" : ""}`, panel_ids: todo.map((p) => p.panel_id) });
      return;
    }
    setBusy(true);
    stopBatch.current = false;
    try {
      const ok = await runImages(todo);
      notify(`${ok}/${todo.length} image${todo.length > 1 ? "s" : ""} générée${ok > 1 ? "s" : ""}. Pense à enregistrer.`);
    } finally {
      setJob(null);
      setBusy(false);
    }
  };

  const imageEstimate = () => {
    const times = imageTimes.current.slice(-5);
    return times.length ? times.reduce((a, b) => a + b, 0) / times.length : ESTIMATE.image;
  };

  /** Generate the images of these panels one after the other, feeding the job display. */
  const runImages = async (list: WebtoonPanel[]): Promise<number> => {
    // Several images at once: each call waits most of its minute on the image model,
    // so three in flight make a long batch about three times shorter.
    let ok = 0;
    let next = 0;
    let done = 0;
    const running = new Map<string, number>();
    // One estimate for the whole batch, from its start: re-estimating from "now" at each image pushed the end away.
    const batchStart = Date.now();
    const batchEnd = batchStart + Math.ceil(list.length / IMAGE_CONCURRENCY) * imageEstimate();
    const report = () =>
      setJob({
        started: batchStart,
        phase: "images",
        label: `Images ${Math.min(done + running.size, list.length)}/${list.length}${running.size > 1 ? ` · ${running.size} en même temps` : ""}`,
        done,
        total: list.length,
        queue: list.slice(next).map((p) => p.panel_id),
        current: [...running.keys()][0] ?? null,
        running: [...running.keys()],
        runningSince: Object.fromEntries(running),
        placeholders: 0,
        deadline: batchEnd,
      });
    if (list[0]) select(list[0].panel_id);
    const worker = async () => {
      while (!stopBatch.current && next < list.length) {
        const panel = list[next];
        next += 1;
        const started = Date.now();
        running.set(panel.panel_id, started);
        report();
        if (await generateOne(panel)) {
          ok += 1;
          imageTimes.current = [...imageTimes.current, Date.now() - started].slice(-10);
          try {
            window.localStorage.setItem("studio-image-times", JSON.stringify(imageTimes.current));
          } catch {
            // No storage: the estimate learns for this visit only.
          }
          onAutosave?.();
        }
        running.delete(panel.panel_id);
        done += 1;
        report();
      }
    };
    await Promise.all(Array.from({ length: Math.min(IMAGE_CONCURRENCY, list.length) }, worker));
    return ok;
  };

  /**
   * Drag and drop: the panel dragged moves before or after the panel it is
   * dropped on; when it is checked, every checked panel moves with it, in
   * the order of the strip. Not while a job writes or generates, because
   * the job puts back the order it started from.
   */
  const dropPanels = (dragId: string, target: DropTarget) => {
    const ids = checked.has(dragId) ? panels.filter((p) => checked.has(p.panel_id)).map((p) => p.panel_id) : [dragId];
    const next = movePanelsTo(panels, ids, target.id, target.after);
    if (next === panels) return;
    setPanels(next);
    select(dragId);
    notify(ids.length > 1 ? `${ids.length} cases déplacées` : `Case déplacée en position ${next.findIndex((p) => p.panel_id === dragId) + 1}`);
  };
  const listDrag = usePanelDrag({ onDrop: dropPanels, holdMs: 250, moveStartPx: 6, disabled: busy });
  const dragCount = (id: string | null) => (id && checked.has(id) ? checked.size : 1);
  const dropClass = (drag: { dragId: string | null; target: DropTarget | null }, id: string) =>
    `${drag.dragId === id || (drag.dragId && checked.has(drag.dragId) && checked.has(id)) ? "is-dragging" : ""} ${drag.target?.id === id && drag.dragId !== id ? (drag.target.after ? "is-drop-after" : "is-drop-before") + (drag.target.axis === "x" ? " is-drop-x" : "") : ""}`;

  /**
   * Holes in the film: two panels in a row with more than eight seconds of
   * film between them, which no event of the story explains (a lost span
   * after a rewrite, a failed batch). Shown in the list, filled on demand.
   */
  const HOLE_SECONDS = 8;
  const holeBefore = (index: number): { from: number; to: number } | null => {
    if (index === 0) return null;
    const prev = panels[index - 1];
    const next = panels[index];
    if (prev.source_time_start === null || next.source_time_start === null || next.gap_ignored) return null;
    const from = coveredUntil([prev]);
    return next.source_time_start - from >= HOLE_SECONDS ? { from, to: next.source_time_start } : null;
  };
  /** "Ignorer": the stretch stays untold on purpose; the choice is saved with the strip. */
  const ignoreHole = (index: number, ignored = true) => {
    const panel = panels[index];
    if (!panel) return;
    setPanels((current) => current.map((p) => (p.panel_id === panel.panel_id ? { ...p, gap_ignored: ignored || undefined } : p)));
    onAutosave?.();
  };
  const ignoredHoles = panels.filter((p) => p.gap_ignored).length;
  const formatSeconds = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
  const fillHole = async (index: number) => {
    const hole = holeBefore(index);
    if (!hole || busy) return;
    const count = Math.max(3, Math.round((hole.to - hole.from) / 3));
    if (!window.confirm(`Écrire, dessiner et traduire les cases de ${formatSeconds(hole.from)} à ${formatSeconds(hole.to)} (environ ${count} cases) ?`)) return;
    await writeSpan({ base: panels, insertAfter: panels[index - 1].panel_id, count, until: hole.to - 1, label: "le trou" });
  };

  /**
   * The gaps between panels from the film guide (lib/webtoon/rhythm.ts): the checked panels, or the whole
   * strip. The first panel and the panels laid over the one before keep theirs; "Annuler" brings them back.
   */
  const rhythmStrip = (ids?: Set<string>) => {
    if (!guide?.sequences.length) return;
    const { panels: next, changed } = applyRhythm(panelsRef.current, guide, ids);
    if (!changed) {
      notify("Les espaces suivent déjà le guide du film");
      return;
    }
    setPanels(next);
    onAutosave?.();
    notify(`Espaces rythmés sur ${changed} case${changed > 1 ? "s" : ""} : serrés dans l'action, larges dans la contemplation`);
  };

  /**
   * Continue the story: the writer model drafts the next N panels from the
   * frames that follow the last one, the engine composes them, then the
   * images are generated one by one and the lettering is translated.
   */
  const continueStory = async () => {
    if (busy) return;
    if (checkBudget && !checkBudget()) return;
    if (nextUnit === "seconds") {
      // A stretch of film: written to its end, the number of panels follows the pace.
      const seconds = Math.max(5, Math.min(600, Math.round(nextCount) || 30));
      const from = coveredUntil(panels);
      const estimate = Math.max(2, Math.round(seconds / SECONDS_PER_PANEL[paceAt(from)]));
      if (!window.confirm(`Écrire et générer les ${seconds} secondes suivantes du film (${formatSeconds(from)} à ${formatSeconds(from + seconds)}, environ ${estimate} cases)${background ? " en arrière-plan" : ""} ?`)) return;
      if (background) {
        await runInBackground({ kind: "continue", label: `Suite de ${formatSeconds(from)} à ${formatSeconds(from + seconds)}`, params: { count: estimate, until: from + seconds, pace, insert_after: null } });
        return;
      }
      await writeSpan({ base: panels, insertAfter: null, count: estimate, until: from + seconds, label: "la suite" });
      return;
    }
    const count = Math.max(1, Math.min(30, Math.round(nextCount) || 1));
    if (!window.confirm(`Écrire et générer ${count === 1 ? "la case suivante" : `les ${count} cases suivantes`} à partir de ${coveredUntil(panels).toFixed(0)} s du film${pace === "auto" ? (guide?.sequences.length ? ", au rythme du guide du film" : ", en rythme normal (le film n'est pas encore lu)") : `, en rythme ${paceWord(pace)}`} ?`)) return;
    if (background) {
      await runInBackground({ kind: "continue", label: `${count} case${count > 1 ? "s" : ""} suivante${count > 1 ? "s" : ""}`, params: { count, until: null, pace, insert_after: null } });
      return;
    }
    await writeSpan({ base: panels, insertAfter: null, count, until: null, label: "la suite" });
  };

  /**
   * Rewrite the checked panels as an action sequence: they are removed and
   * the span of film they covered is written again, densely, then generated
   * and translated, in their place.
   */
  const rewriteChecked = async (count: number) => {
    if (busy || !checkedPanels.length) return;
    const first = panels.findIndex((p) => p.panel_id === checkedPanels[0].panel_id);
    const before = panels[first - 1] ?? null;
    const until = coveredUntil(checkedPanels);
    const from = before ? coveredUntil([before]) : 0;
    if (!(until > from)) {
      notify("Les cases cochées n'ont pas de temps de film à réécrire");
      return;
    }
    if (!window.confirm(`Remplacer ${checkedPanels.length} case${checkedPanels.length > 1 ? "s" : ""} (${from.toFixed(0)} s à ${until.toFixed(0)} s du film) par environ ${count} cases en rythme ${pace === "auto" ? "du guide du film" : paceWord(pace)} ?`)) return;
    const kept = panels.filter((p) => !checked.has(p.panel_id));
    setChecked(new Set());
    await writeSpan({ base: kept, insertAfter: before?.panel_id ?? null, count, until, label: "la séquence" });
  };

  /**
   * Sheets for what the writer found in the film without one (an object in a
   * hand, a creature, a machine): each is added to the library, drawn from the
   * frames of the film where it is seen best, stored, and from then on every
   * panel that names it attaches the same design.
   */
  const adoptAssets = async (found: { asset: ReferenceAsset; frames: string[] }[]) => {
    for (const { asset, frames } of found) {
      if (stopBatch.current) return;
      const name = asset.name.split(",")[0];
      const known = libraryWith(libraryRef.current).find((a) => a.id === asset.id);
      if (known?.image) continue;
      const target = known ?? asset;
      let next = upsertAsset(libraryRef.current, target);
      libraryRef.current = next;
      setLibrary(next);
      setJob((job) => (job ? { ...job, label: `Fiche de ${name} dessinée depuis le film…` } : job));
      try {
        const response = await fetch(`/api/webtoon/${script.slug}/asset`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
          body: JSON.stringify({ asset: target, library: next, frames }),
        });
        const payload = (await response.json().catch(() => ({}))) as { src?: string; data_url?: string; error?: string };
        const received = payload.src ?? payload.data_url;
        if (!response.ok || !received) {
          notify(`Fiche de ${name} non dessinée : ${payload.error ?? response.status}`);
          continue;
        }
        let src = received;
        if (user && received.startsWith("data:")) src = await uploadLibraryImage(script.slug, target.id, received).catch(() => received);
        next = upsertAsset(next, { ...target, image: src });
        libraryRef.current = next;
        setLibrary(next);
        notify(`Fiche de ${name} ajoutée à la bibliothèque (${target.kind === "object" ? "objet" : "personnage"})`);
      } catch (error) {
        notify(`Fiche de ${name} : ${error instanceof Error ? error.message : "erreur"}`);
      }
    }
  };

  /** Write, generate and translate a span of the film into the strip, after `insertAfter` (or at the end). */
  const writeSpan = async (input: { base: WebtoonPanel[]; insertAfter: string | null; count: number; until: number | null; label: string }) => {
    const { count, until } = input;
    setBusy(true);
    stopBatch.current = false;
    setJob({
      started: Date.now(),
      phase: "writing",
      label: count === 1 ? "Lecture du film et écriture de la case suivante…" : `Lecture du film et écriture de ${count} cases…`,
      done: 0,
      total: count,
      queue: [],
      current: null,
      placeholders: count,
      deadline: deadlineIn(ESTIMATE.writeBase + ESTIMATE.writePer * count + count * imageEstimate() + ESTIMATE.translateBase + ESTIMATE.translatePer * count),
    });
    try {
      // The route writes eight panels per call; call again with what it wrote until the count is reached.
      // The writer only sees the panels up to the insertion point, so the span is continuous with them.
      const created: WebtoonPanel[] = [];
      let failures = 0;
      const anchorIndex = input.insertAfter ? input.base.findIndex((p) => p.panel_id === input.insertAfter) : input.base.length - 1;
      const head = input.base.slice(0, anchorIndex + 1);
      const tail = input.base.slice(anchorIndex + 1);
      let current = head;
      const assemble = () => [...current, ...tail].map((p, i) => ({ ...p, order: i + 1 }));
      setPanels(assemble());
      // A bounded span (a rewrite, a hole) is written to its end: the count is a target, not a stop.
      // A rewrite of the chase stopped at its count and left 37 seconds of film without a panel.
      const spanCovered = () => until !== null && coveredUntil(current) >= until - 1;
      const cap = until === null ? count : Math.max(count * 2, count + 12);
      while (!stopBatch.current && (until === null ? created.length < count : !spanCovered() && created.length < cap)) {
        const ask = Math.min(8, Math.max(1, count - created.length));
        setJob((job) => (job ? { ...job, label: `Écriture des cases ${head.length + created.length + 1} à ${head.length + created.length + ask}…`, placeholders: count - created.length } : job));
        const response = await fetch(`/api/webtoon/${script.slug}/continue`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
          // The route writes at most eight; it needs the whole remaining count to spread a bounded span evenly.
          body: JSON.stringify({
            count: until === null ? count - created.length : Math.max(8, count - created.length),
            panels: slimForContinue(current),
            library: libraryRef.current,
            pace,
            until_seconds: until,
            // The guide around the stretch to write: its sequences drive the "auto" pace and its lines go to the writer.
            guide: guideSlice(guide, Math.max(0, coveredUntil(current) - 2), coveredUntil(current) + 180),
            // The opening of an episode after the first: the writer starts from where the episode before left everyone.
            ...(handoffRef.current?.text && current.length < 30 ? { handoff: handoffRef.current.text } : {}),
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as { panels?: WebtoonPanel[]; new_assets?: { asset: ReferenceAsset; frames: string[] }[]; error?: string };
        if (!response.ok || !payload.panels?.length) {
          const reason = payload.error ?? `réponse ${response.status}`;
          const done = /Fin de l'épisode/.test(reason);
          // One batch failing used to end the whole run in silence, which left a hole in the
          // middle of the strip: retry once, and say why when it fails again.
          if (!done && failures < 2) {
            failures += 1;
            notify(`Lot non écrit (${reason}). Nouvelle tentative…`);
            await new Promise((resolve) => window.setTimeout(resolve, 3000));
            continue;
          }
          if (!created.length) {
            notify(payload.error ?? `Le studio n'a pas pu écrire la suite (réponse ${response.status}).`);
            return;
          }
          if (!done) notify(`Écriture arrêtée à ${created.length} cases sur ${count} : ${reason}`);
          break;
        }
        failures = 0;
        // The new panels get the gaps of their scene right away (a film not read yet leaves the writer's).
        const written = applyRhythm([...current, ...payload.panels], guide, new Set(payload.panels.map((p) => p.panel_id))).panels.slice(current.length);
        created.push(...written);
        current = [...current, ...written];
        setPanels(assemble());
        onAutosave?.();
        if (created.length === payload.panels.length) select(created[0].panel_id);
        // What the writer found in the film without a sheet gets one now, before any image is made.
        if (payload.new_assets?.length) await adoptAssets(payload.new_assets);
      }
      if (until !== null && !spanCovered() && !stopBatch.current) {
        notify(`La plage n'est pas couverte jusqu'au bout : rien entre ${Math.round(coveredUntil(current))} s et ${Math.round(until)} s. Le trou est signalé dans la liste, « Combler » le termine.`);
      } else {
        notify(`${created.length} cases écrites. Génération des images…`);
      }
      // A title card has no image to make.
      const ok = await runImages(created.filter((p) => p.description.trim() || p.generation_prompt.trim()));
      if (!stopBatch.current) {
        setJob({ started: Date.now(), phase: "translating", label: "Traduction des textes…", done: created.length, total: created.length, queue: [], current: null, placeholders: 0, deadline: deadlineIn(ESTIMATE.translateBase + ESTIMATE.translatePer * created.length) });
        setBusy(false);
        await translatePanels(created, false);
      }
      notify(`${input.label === "la suite" ? "Suite écrite" : "Séquence réécrite"} : ${created.length} cases, ${ok} image${ok > 1 ? "s" : ""}. Pense à enregistrer.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur");
    } finally {
      setJob(null);
      setBusy(false);
    }
  };

  /**
   * Polish the whole strip: the layout editor gives every panel a frame and
   * proposes the connective panels the story is missing; their images are
   * then generated and their lettering translated.
   */
  const polishStrip = async (confirmed = false) => {
    if (busy) return;
    if (!confirmed && !window.confirm("Peaufiner la bande ? L'IA donne une forme de webtoon à chaque case (largeur, côté, bords, chevauchement) et ajoute les cases de liaison qui manquent, puis génère leurs images.")) return;
    setBusy(true);
    stopBatch.current = false;
    setJob({ started: Date.now(), phase: "writing", label: "Mise en page et cases de liaison…", done: 0, total: 1, queue: [], current: null, placeholders: 0, deadline: deadlineIn(90_000) });
    try {
      const response = await fetch(`/api/webtoon/${script.slug}/polish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ panels, library, max_inserts: 10 }),
      });
      const payload = (await response.json().catch(() => ({}))) as { frames?: Record<string, PanelFrame>; inserts?: { after: string; panel: WebtoonPanel }[]; error?: string };
      if (!response.ok || !payload.frames) {
        notify(payload.error ?? `Erreur ${response.status}`);
        return;
      }
      const inserts = payload.inserts ?? [];
      const next: WebtoonPanel[] = [];
      for (const panel of panels) {
        next.push(payload.frames[panel.panel_id] ? { ...panel, frame: payload.frames[panel.panel_id] } : panel);
        for (const insert of inserts) if (insert.after === panel.panel_id) next.push(insert.panel);
      }
      const renumbered = next.map((p, i) => ({ ...p, order: i + 1 }));
      setPanels(renumbered);
      onAutosave?.();
      notify(`Mise en page appliquée à ${Object.keys(payload.frames).length} cases, ${inserts.length} case${inserts.length > 1 ? "s" : ""} de liaison ajoutée${inserts.length > 1 ? "s" : ""}`);
      const created = inserts.map((i) => i.panel);
      if (created.length) {
        const ok = await runImages(created);
        if (!stopBatch.current) {
          setJob({ started: Date.now(), phase: "translating", label: "Traduction des textes…", done: created.length, total: created.length, queue: [], current: null, placeholders: 0, deadline: deadlineIn(ESTIMATE.translateBase + ESTIMATE.translatePer * created.length) });
          setBusy(false);
          await translatePanels(created, false);
        }
        notify(`Bande peaufinée : ${created.length} case${created.length > 1 ? "s" : ""} de liaison, ${ok} image${ok > 1 ? "s" : ""}. Pense à enregistrer.`);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur");
    } finally {
      setJob(null);
      setBusy(false);
    }
  };

  /** The AI director: send the thread with the studio's context, then run what it decided. */
  const askDirector = async (messages: { role: "user" | "assistant"; content: string }[]): Promise<{ reply: string; done: string[] }> => {
    const summary = panels.map((p) => ({ panel_id: p.panel_id, order: p.order, seconds: p.source_time_start, shot: p.shot_type, description: p.description.split("STATE TO KEEP")[0].slice(0, 140), image: p.image.status }));
    const response = await fetch(`/api/webtoon/${script.slug}/director`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
      body: JSON.stringify({ messages, panels: summary, selected, library }),
    });
    const payload = (await response.json().catch(() => ({}))) as { reply?: string; actions?: DirectorAction[]; error?: string };
    if (!response.ok) throw new Error(payload.error ?? `Erreur ${response.status}`);
    const done: string[] = [];
    for (const action of payload.actions ?? []) {
      try {
        const note = await runDirectorAction(action);
        if (note) done.push(note);
      } catch (error) {
        done.push(`${action.type} : ${error instanceof Error ? error.message : "échec"}`);
      }
    }
    if (done.length) onAutosave?.();
    return { reply: payload.reply ?? "", done };
  };

  const PANEL_FIELDS = new Set(["description", "action", "emotion", "composition", "purpose", "shot_type", "camera_angle", "narrative_role", "transition_type", "fidelity", "background", "panel_height", "aspect_ratio", "characters", "location", "dialogue", "sfx", "caption", "focal_point", "bleed", "border", "spacing_before", "spacing_after"]);

  const runDirectorAction = async (action: DirectorAction): Promise<string | null> => {
    const find = (id: string) => panelsRef.current.find((p) => p.panel_id === id);
    switch (action.type) {
      case "select_panel": {
        if (find(action.panel_id)) select(action.panel_id);
        return null;
      }
      case "update_panel": {
        const panel = find(action.panel_id);
        if (!panel) return `case ${action.panel_id} introuvable`;
        const changes: Partial<WebtoonPanel> = {};
        for (const [key, value] of Object.entries(action.changes ?? {})) if (PANEL_FIELDS.has(key)) (changes as Record<string, unknown>)[key] = value;
        if (changes.dialogue) changes.dialogue = (changes.dialogue as WebtoonPanel["dialogue"]).map((d) => ({ speaker: d.speaker ?? "", text: d.text ?? { en: "" }, style: d.style ?? "speech", anchor: d.anchor ?? { x: 30, y: 20 }, tail: d.tail ?? { x: 50, y: 50 } }));
        if (changes.sfx) changes.sfx = (changes.sfx as WebtoonPanel["sfx"]).map((x) => ({ text: x.text ?? { en: "" }, anchor: x.anchor ?? { x: 60, y: 30 }, style: x.style ?? "hard", rotate: x.rotate ?? -10, size: x.size ?? 120 }));
        if (changes.caption) changes.caption = (changes.caption as WebtoonPanel["caption"]).map((c) => ({ text: c.text ?? { en: "" }, anchor: c.anchor ?? { x: 8, y: 8 }, style: c.style ?? "narration" }));
        if (typeof changes.panel_height === "number") changes.panel_height = Math.max(240, Math.min(2600, Math.round(changes.panel_height / 10) * 10));
        const next = updatePanel(panelsRef.current, panel.panel_id, { ...changes, prompt_auto: changes.description ? true : panel.prompt_auto });
        panelsRef.current = next;
        setPanels(next);
        if (action.regenerate) {
          const updated = next.find((p) => p.panel_id === panel.panel_id)!;
          await runImages([updated]);
          setJob(null);
          return `case ${panel.panel_id} modifiée et regénérée`;
        }
        return `case ${panel.panel_id} modifiée`;
      }
      case "regenerate_panel": {
        const panel = find(action.panel_id);
        if (!panel) return `case ${action.panel_id} introuvable`;
        await runImages([panel]);
        setJob(null);
        return `case ${panel.panel_id} regénérée`;
      }
      case "insert_panel": {
        const base = panelsRef.current;
        const anchorIndex = action.after ? base.findIndex((p) => p.panel_id === action.after) : base.length - 1;
        if (anchorIndex < 0) return `case ${action.after} introuvable`;
        const anchor = base[anchorIndex];
        const seconds = Number((action.panel as { seconds?: number }).seconds ?? anchor.source_time_end ?? anchor.source_time_start ?? 0);
        const [created] = panelsFromIntents(base, [{ ...(action.panel as NextPanelIntent), seconds }], FILM_FRAMES, script, library);
        if (!created) return "case non créée";
        const next = renumber([...base.slice(0, anchorIndex + 1), created, ...base.slice(anchorIndex + 1)]);
        panelsRef.current = next;
        setPanels(next);
        select(created.panel_id);
        if (action.generate) {
          await runImages([created]);
          setJob(null);
          return `case ${created.panel_id} insérée et générée`;
        }
        return `case ${created.panel_id} insérée`;
      }
      case "delete_panels": {
        const ids = (action.panel_ids ?? []).filter((id) => find(id));
        if (!ids.length) return "aucune case à supprimer";
        const next = deletePanels(panelsRef.current, ids);
        panelsRef.current = next;
        setPanels(next);
        return `${ids.length} case${ids.length > 1 ? "s" : ""} supprimée${ids.length > 1 ? "s" : ""}`;
      }
      case "set_frame": {
        const panel = find(action.panel_id);
        if (!panel) return `case ${action.panel_id} introuvable`;
        const next = updatePanel(panelsRef.current, panel.panel_id, { frame: cleanFrame(action.frame) });
        panelsRef.current = next;
        setPanels(next);
        return `forme de ${panel.panel_id} changée`;
      }
      case "add_character":
      case "add_location": {
        const id = slugify(action.name);
        if (!id) return "nom vide";
        const isChar = action.type === "add_character";
        const asset = isChar
          ? { id: `char.${id}.webtoon`, kind: "character" as const, subject: id, priority: 1, name: `${action.name}, webtoon model sheet`, image: "", must_keep: action.must_keep, description: "Ajouté par le Directeur IA.", tags: [id, "studio"] }
          : { id: `loc.${id}`, kind: "location" as const, name: action.name, image: "", must_keep: action.must_keep, description: "Ajouté par le Directeur IA.", tags: ["studio"] };
        let next = upsertAsset(libraryRef.current, asset);
        libraryRef.current = next;
        setLibrary(next);
        if (action.generate_sheet !== false) {
          const response = await fetch(`/api/webtoon/${script.slug}/asset`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
            body: JSON.stringify({ asset, library: next }),
          });
          const payload = (await response.json().catch(() => ({}))) as { src?: string; data_url?: string; error?: string };
          const received = payload.src ?? payload.data_url;
          if (!response.ok || !received) return `${action.name} ajouté, fiche non dessinée (${payload.error ?? response.status})`;
          let src = received;
          if (user && received.startsWith("data:")) src = await uploadLibraryImage(script.slug, asset.id, received).catch(() => received);
          next = upsertAsset(next, { ...asset, image: src });
          libraryRef.current = next;
          setLibrary(next);
          return `${action.name} ajouté à la bibliothèque, fiche dessinée`;
        }
        return `${action.name} ajouté à la bibliothèque`;
      }
      case "translate": {
        const targets = action.panel_ids === "all" ? panelsRef.current : panelsRef.current.filter((p) => (action.panel_ids ?? []).includes(p.panel_id));
        await translatePanels(targets, false);
        return `traduction de ${targets.length} case${targets.length > 1 ? "s" : ""}`;
      }
      case "continue": {
        const count = Math.max(1, Math.min(30, Math.round(action.count) || 8));
        if (action.pace) setPace(action.pace);
        await writeSpan({ base: panelsRef.current, insertAfter: null, count, until: null, label: "la suite" });
        return `${count} cases écrites à la suite`;
      }
      case "polish": {
        await polishStrip(true);
        return "bande peaufinée";
      }
      default:
        return null;
    }
  };

  const replaceImage = async (file: File) => {
    if (!selected) return;
    setBusy(true);
    try {
      await applyImage(selected, await readFileAsDataUrl(file), "manual-upload", {}, undefined, "upload");
      onAutosave?.();
      notify("Image remplacée");
    } finally {
      setBusy(false);
    }
  };

  /** Rebuild the prompt and references from the panel's fields, right now, in the browser. */
  const recompose = () => {
    if (!selected) return;
    const next = composePanel(selected, script, library);
    patch({ generation_prompt: next.generation_prompt, negative_constraints: next.negative_constraints, visual_references: next.visual_references, prompt_auto: true });
    notify("Prompt recomposé depuis les champs");
  };

  const addFromFrame = (src: string) => {
    const frame = FILM_FRAMES.find((f) => f.src === src);
    if (!frame) return;
    const next = appendFromFrame(panels, frame, selected?.panel_id ?? null);
    setPanels(next);
    const created = next.find((p) => !panels.some((q) => q.panel_id === p.panel_id));
    if (created) select(created.panel_id);
    notify(`Case ${created?.panel_id ?? ""} créée à partir de l'image ${frame.label}`);
  };

  /**
   * Translate the lettering of some panels in one call: bubbles, captions
   * and sounds, from whatever language they were written in, into the four
   * languages of the site. `all` retranslates filled languages too.
   */
  const translatePanels = async (targets: WebtoonPanel[], all: boolean) => {
    if (busy) return;
    const batchItems: LetteringItem[] = targets.flatMap((panel) =>
      itemsToTranslate(panel, all).map((item) => ({ ...item, key: `${panel.panel_id}|${item.key}` })),
    );
    if (!batchItems.length) {
      notify(all ? "Aucun texte à traduire" : "Toutes les langues sont déjà remplies");
      return;
    }
    setBusy(true);
    try {
      const scene = targets.length === 1 ? targets[0].description : `${script.series}, episode ${script.episode}, ${targets.length} panels.`;
      const response = await fetch(`/api/webtoon/${script.slug}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ items: batchItems, scene }),
      });
      const payload = (await response.json().catch(() => ({}))) as { translations?: Record<string, Record<string, string>>; error?: string };
      if (!response.ok || !payload.translations) {
        notify(payload.error ?? `Erreur ${response.status}`);
        return;
      }
      const byPanel = new Map<string, Record<string, Record<string, string>>>();
      for (const [key, value] of Object.entries(payload.translations)) {
        const [panelId, itemKey] = key.split("|");
        if (!panelId || !itemKey) continue;
        const bucket = byPanel.get(panelId) ?? {};
        bucket[itemKey] = value;
        byPanel.set(panelId, bucket);
      }
      const translated = targets.map((p) => (byPanel.has(p.panel_id) ? applyTranslations(p, byPanel.get(p.panel_id)!, all) : p));
      setPanels((current) => current.map((p) => (byPanel.has(p.panel_id) ? applyTranslations(p, byPanel.get(p.panel_id)!, all) : p)));
      onAutosave?.();
      notify(`${batchItems.length} texte${batchItems.length > 1 ? "s" : ""} traduit${batchItems.length > 1 ? "s" : ""} en fr, en, ja, ko`);
      // A translation longer than the French can push a bubble out of its panel: said now, not at the export.
      void checkLettering(translated.filter((p) => byPanel.has(p.panel_id)), true);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur de traduction");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Measures the bubbles and captions of these panels (the whole strip when omitted) in every language and
   * keeps what overflows (components/studio/lettering-fit.ts). `quiet`: only speaks when something overflows.
   */
  const checkLettering = async (targets?: WebtoonPanel[], quiet = false) => {
    const list = targets ?? panelsRef.current;
    const issues = letteringIssues(list, await measureLettering(list));
    const ids = new Set(list.map((p) => p.panel_id));
    // A partial check replaces what it re-measured and keeps the rest of the last one.
    setLetterIssues((current) => (targets ? [...(current ?? []).filter((i) => !ids.has(i.panel_id)), ...issues] : issues));
    if (!issues.length) {
      if (!quiet) notify("Toutes les bulles tiennent dans leur case, dans les quatre langues");
      return;
    }
    const byLocale = new Map<string, number>();
    for (const issue of issues) byLocale.set(issue.locale, (byLocale.get(issue.locale) ?? 0) + 1);
    const cases = new Set(issues.map((i) => i.panel_id)).size;
    notify(`Bulles trop pleines dans ${cases} case${cases > 1 ? "s" : ""} (${[...byLocale].map(([l, n]) => `${l} ${n}`).join(", ")}) : voir en haut de la liste`);
  };

  /** Moves the overflowing lettering back inside its panel, for every language at once; overlaps stay flagged. */
  const fitOverflowing = async () => {
    if (!letterIssues?.length) return;
    const ids = new Set(letterIssues.filter((i) => i.reason !== "overlap").map((i) => i.panel_id));
    const targets = panelsRef.current.filter((p) => ids.has(p.panel_id));
    if (!targets.length) {
      notify("Il ne reste que des bulles qui se chevauchent : « Replacer les bulles » les place d'après l'image");
      return;
    }
    const sizes = await measureLettering(targets);
    const fitted = new Map(targets.map((p) => [p.panel_id, fitLettering(p, sizes)]));
    setPanels((current) => current.map((p) => fitted.get(p.panel_id) ?? p));
    onAutosave?.();
    notify(`Bulles recadrées dans ${fitted.size} case${fitted.size > 1 ? "s" : ""}`);
    await checkLettering([...fitted.values()], true);
  };

  /** "@" in a prompt of the selected panel: the reference goes with it (sheet, place, object, or the image of another panel). */
  const attachMention = (item: MentionItem) => {
    if (!selected) return;
    if (item.kind === "character") {
      if (!selected.characters.includes(item.id)) setCharacters(item.id, true);
    } else if (item.kind === "location") {
      patch({ location: item.id });
    } else if (item.kind === "object") {
      const current = selected.objects ?? [];
      if (!current.includes(item.id)) patch({ objects: [...current, item.id] });
    } else {
      const other = panelsRef.current.find((p) => p.panel_id === item.id);
      if (!other || other.panel_id === selected.panel_id) return;
      const src = panelReferenceSrc(other);
      if (!selected.visual_references.some((r) => r.split("#")[0] === other.image.src.split("#")[0])) patch({ visual_references: [...selected.visual_references, src] });
    }
    notify(`${item.name} ${item.kind === "panel" ? "jointe comme référence" : "joint à la case"}`);
  };

  const setCharacters = (id: string, on: boolean) => {
    if (!selected) return;
    const characters = on ? [...new Set([...selected.characters, id])] : selected.characters.filter((c) => c !== id);
    patch({ characters, image: selected.image.status === "generated" ? { ...selected.image, status: "stale" } : selected.image });
  };

  const toggleChecked = (id: string, shiftKey: boolean) => {
    // Read the anchor now: the state updater runs later, once the anchor has moved.
    const anchor = shiftKey ? lastChecked.current ?? selectedId : null;
    lastChecked.current = id;
    setChecked((current) => {
      const next = new Set(current);
      if (anchor) {
        const a = panels.findIndex((p) => p.panel_id === anchor);
        const b = panels.findIndex((p) => p.panel_id === id);
        if (a >= 0 && b >= 0) {
          for (const p of panels.slice(Math.min(a, b), Math.max(a, b) + 1)) next.add(p.panel_id);
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checkedPanels = panels.filter((p) => checked.has(p.panel_id));

  /**
   * Re-places the bubbles of the checked panels from where the characters are
   * in their image, without redrawing, and checks each image against its
   * panel (cast, canon, state). The panels whose image breaks something stay
   * checked, ready for "Regénérer".
   */
  const reletterChecked = async () => {
    if (busy) return;
    const list = checkedPanels.filter((p) => p.image.src && p.image.status !== "missing");
    if (!list.length) return;
    setBusy(true);
    const faulty: string[] = [];
    const reports: string[] = [];
    let done = 0;
    setJob({ started: Date.now(), phase: "images", label: `Bulles et vérification de ${list.length} cases…`, done: 0, total: list.length, queue: [], current: null, placeholders: 0, deadline: deadlineIn(Math.ceil(list.length / 4) * 12000) });
    const queue = [...list];
    const worker = async () => {
      for (let panel = queue.shift(); panel; panel = queue.shift()) {
        try {
          const response = await fetch(`/api/webtoon/${script.slug}/letter`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
            body: JSON.stringify({ panel, library: libraryRef.current, previous_speakers: panels.slice(Math.max(0, panels.findIndex((p) => p.panel_id === panel.panel_id) - 8), panels.findIndex((p) => p.panel_id === panel.panel_id)).reverse().flatMap((p) => p.dialogue.map((d) => d.speaker)) }),
          });
          const payload = (await response.json().catch(() => ({}))) as { dialogue?: WebtoonPanel["dialogue"]; sfx?: WebtoonPanel["sfx"]; panel_height?: number; issues?: string[]; error?: string };
          if (response.ok) {
            const id = panel.panel_id;
            if (payload.dialogue) setPanels((current) => current.map((p) => (p.panel_id === id ? { ...p, dialogue: payload.dialogue!, ...(payload.sfx ? { sfx: payload.sfx } : {}), panel_height: Math.max(p.panel_height, payload.panel_height ?? 0) } : p)));
            if (payload.issues?.length) {
              faulty.push(id);
              reports.push(`${id} : ${payload.issues.join(" ")}`);
            }
          }
        } catch {
          // One panel failing does not stop the others.
        }
        done += 1;
        setJob((job) => (job ? { ...job, done } : job));
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, list.length) }, worker));
    setJob(null);
    setBusy(false);
    setChecked(new Set(faulty));
    notify(faulty.length ? `Bulles replacées. ${faulty.length} image${faulty.length > 1 ? "s" : ""} à redessiner, restée${faulty.length > 1 ? "s" : ""} cochée${faulty.length > 1 ? "s" : ""} : ${reports.slice(0, 3).join(" · ")}` : "Bulles replacées, aucune image fautive");
    onAutosave?.();
  };

  /** The panel's check against the sheets, when it is about its current image (a new image makes it stale). */
  const auditOf = (panel: WebtoonPanel) => (panel.audit && panel.image.src && panel.audit.of === panel.image.src ? panel.audit : null);

  /**
   * "Contrôler la cohérence": the drawn panels next to the model sheets of their characters, six at a time
   * (app/api/webtoon/[slug]/audit). What departs from a sheet stays on the panel, listed above the strip and
   * in the inspector, where a retouch can fix it. A panel already checked on this image is not sent again.
   */
  const auditPanels = async (targets: WebtoonPanel[], force = false) => {
    if (busy) return;
    const list = targets.filter((p) => p.image.src && p.image.status !== "missing" && p.characters.length && (force || !auditOf(p)));
    if (!list.length) {
      notify("Ces cases sont déjà contrôlées sur leur image actuelle");
      return;
    }
    const BATCH = 6;
    const batches: WebtoonPanel[][] = [];
    for (let i = 0; i < list.length; i += BATCH) batches.push(list.slice(i, i + BATCH));
    if (!window.confirm(`Comparer ${list.length} case${list.length > 1 ? "s" : ""} aux fiches des personnages (costume, couleurs, casque, proportions) ? Environ ${Math.max(1, Math.round(batches.length * 0.35))} min, ${(batches.length * 0.02).toFixed(2)} $.`)) return;
    setBusy(true);
    stopBatch.current = false;
    let done = 0;
    let flagged = 0;
    const started = Date.now();
    setJob({ started, phase: "images", label: `Contrôle de cohérence : 0/${list.length} cases`, done: 0, total: list.length, queue: [], current: null, placeholders: 0, deadline: started + Math.ceil(batches.length / 2) * 33_000 });
    const queue = [...batches];
    const worker = async () => {
      for (let batch = queue.shift(); batch && !stopBatch.current; batch = queue.shift()) {
        try {
          const response = await fetch(`/api/webtoon/${script.slug}/audit`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
            body: JSON.stringify({ panels: batch.map((p) => ({ panel_id: p.panel_id, order: p.order, description: p.description, characters: p.characters, image: p.image.src })), library: libraryRef.current }),
          });
          const payload = (await response.json().catch(() => ({}))) as { results?: Record<string, PanelAuditIssue[]>; error?: string };
          if (response.ok && payload.results) {
            const at = new Date().toISOString();
            const results = payload.results;
            flagged += batch.filter((p) => results[p.panel_id]?.length).length;
            // Only onto the image that was checked: a panel redrawn meanwhile keeps its old result out.
            setPanels((current) => current.map((p) => {
              const sent = batch.find((b) => b.panel_id === p.panel_id);
              return sent && results[p.panel_id] && p.image.src === sent.image.src ? { ...p, audit: { of: sent.image.src, at, issues: results[p.panel_id] } } : p;
            }));
          } else {
            notify(`Contrôle d'un lot impossible : ${payload.error ?? response.status}`);
          }
        } catch (error) {
          notify(`Contrôle d'un lot impossible : ${error instanceof Error ? error.message : "erreur"}`);
        }
        done += batch.length;
        setJob((job) => (job ? { ...job, done, label: `Contrôle de cohérence : ${done}/${list.length} cases` } : job));
      }
    };
    try {
      await Promise.all(Array.from({ length: Math.min(2, batches.length) }, worker));
      onAutosave?.();
      setHideAudit(false);
      notify(flagged ? `${flagged} case${flagged > 1 ? "s" : ""} sur ${done} s'écarte${flagged > 1 ? "nt" : ""} des fiches : voir en haut de la liste` : `${done} cases contrôlées : toutes suivent leurs fiches`);
    } finally {
      setJob(null);
      setBusy(false);
    }
  };

  /** A retouch that applies the remarks of the check, with the sheets of the characters concerned as references. */
  const fixFromAudit = (panel: WebtoonPanel) => {
    const audit = auditOf(panel);
    if (!audit?.issues.length) return;
    const who = [...new Set(audit.issues.map((i) => i.who))];
    const references = who.map((id) => CHARACTERS.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c?.image)).map((c) => ({ name: c.name, image: c.image!, kind: "character" as const }));
    const prompt = `Corriger le dessin pour suivre la fiche du personnage, sans rien changer d'autre (cadrage, pose, décor, lumière) : ${audit.issues.map((i) => i.issue).join(" ")}`;
    void runRetouch(panel, { prompt, mask: null, brush: 0, references });
  };

  /** Sets the review of a panel; "Validée" and "À refaire" from the keyboard move on to the next panel. */
  const review = (panel: WebtoonPanel, status: ReviewState, note?: string, next = false) => {
    if (!panel.image.src) return;
    setPanels((current) => current.map((p) => (p.panel_id === panel.panel_id ? withReview(p, status, note ?? (status === reviewOf(p).status ? reviewOf(p).note : undefined)) : p)));
    onAutosave?.();
    if (next) {
      const at = panelsRef.current.findIndex((p) => p.panel_id === panel.panel_id);
      const following = panelsRef.current.slice(at + 1).find((p) => p.image.src);
      if (following) select(following.panel_id);
    }
  };

  /** The approved sketches drawn clean at full quality, on the server, the composition kept (lib/webtoon/job-runner.ts). */
  const finishApproved = async () => {
    const list = panelsRef.current.filter(needsFinish);
    if (!list.length) return;
    if (!window.confirm(`Finir en HD ${list.length} case${list.length > 1 ? "s" : ""} validée${list.length > 1 ? "s" : ""} ? Chaque esquisse est redessinée au propre, même cadrage et même composition, sur le serveur (environ ${(list.length * 0.19).toFixed(2)} $). Vous pouvez fermer l'onglet.`)) return;
    await runInBackground({ kind: "finalize", label: `Finition HD de ${list.length} case${list.length > 1 ? "s" : ""}`, panel_ids: list.map((p) => p.panel_id) });
  };

  /** Every panel the check against the sheets flagged, retouched on the server with its remarks. */
  const fixAllFromAudit = async () => {
    const list = panelsRef.current.filter((p) => auditOf(p)?.issues.length && reviewOf(p).status !== "approved");
    if (!list.length) return;
    if (!window.confirm(`Corriger ${list.length} case${list.length > 1 ? "s" : ""} en écart avec leurs fiches ? Chaque image est retouchée avec ses remarques, sur le serveur (environ ${(list.length * 0.19).toFixed(2)} $). Les cases validées ne sont pas touchées. Vous pouvez fermer l'onglet.`)) return;
    const prompts = Object.fromEntries(list.map((p) => [p.panel_id, `Corriger le dessin pour suivre la fiche du personnage, sans rien changer d'autre (cadrage, pose, décor, lumière) : ${auditOf(p)!.issues.map((i) => i.issue).join(" ")}`]));
    await runInBackground({ kind: "retouch", label: `Correction de ${list.length} écart${list.length > 1 ? "s" : ""} aux fiches`, panel_ids: list.map((p) => p.panel_id), prompts });
  };

  const regenerateChecked = async () => {
    if (busy || !checkedPanels.length) return;
    if (checkBudget && !checkBudget()) return;
    let withText = checkedPanels.filter((p) => p.description.trim() || p.generation_prompt.trim());
    if (!withText.length) {
      notify("Aucune des cases cochées n'a de description");
      return;
    }
    // An approved panel is never redrawn by a batch without the author saying so.
    const approved = withText.filter((p) => reviewOf(p).status === "approved");
    if (approved.length && !window.confirm(`${approved.length} des cases cochées sont validées. Les regénérer aussi ? (Annuler : seules les autres le sont.)`)) withText = withText.filter((p) => reviewOf(p).status !== "approved");
    if (!withText.length) return;
    if (!window.confirm(`Regénérer ${withText.length} case${withText.length > 1 ? "s" : ""} (${withText.map((p) => p.panel_id).join(", ")}) ?`)) return;
    setBusy(true);
    stopBatch.current = false;
    try {
      const ok = await runImages(withText);
      notify(`${ok}/${withText.length} image${withText.length > 1 ? "s" : ""} regénérée${ok > 1 ? "s" : ""}. Pense à enregistrer.`);
    } finally {
      setJob(null);
      setBusy(false);
    }
  };

  const deleteChecked = () => {
    if (!checkedPanels.length) return;
    if (!window.confirm(`Supprimer ${checkedPanels.length} case${checkedPanels.length > 1 ? "s" : ""} (${checkedPanels.map((p) => p.panel_id).join(", ")}) ?`)) return;
    const next = deletePanels(panels, checked);
    setPanels(next);
    setChecked(new Set());
    if (selected && checked.has(selected.panel_id)) select(next[Math.min(index, next.length - 1)]?.panel_id ?? null);
    onAutosave?.();
    notify(`${checkedPanels.length} case${checkedPanels.length > 1 ? "s" : ""} supprimée${checkedPanels.length > 1 ? "s" : ""}`);
  };

  const copyPrompt = () => {
    if (!selected) return;
    navigator.clipboard.writeText(JSON.stringify(buildGenerationRequest(panelForGeneration(selected, script), "openai/gpt-image-2.5-sunburst", library), null, 2)).then(() => notify("Requête copiée"));
  };

  const textInputs = (value: LocalizedText, onText: (next: LocalizedText) => void) => (
    <div className="studio-langs">
      {(["fr", "en", "ja", "ko"] as Locale[]).map((code) => (
        <label key={code}>
          <span>{code}</span>
          <input value={value[code] ?? ""} placeholder={value.en} onChange={(e) => onText({ ...value, [code]: e.target.value })} />
        </label>
      ))}
    </div>
  );

  if (!selected) {
    // A new project: nothing in the strip yet, the first panels are written from the start of the film.
    return (
      <section className="studio-card studio-start space-y-3">
        <p className="anime-label text-xs text-cyan-pale">Premières cases</p>
        <h2 className="font-display text-xl text-lily">La bande est vide</h2>
        <p className="text-sm text-ivory/75">
          Le studio lit le film depuis le début avec le scénario et la bible du projet, écrit les cases, joint à chacune les fiches de ce qu&apos;elle montre, puis dessine les images et traduit les textes.
        </p>
        {!opensSeries ? <EpisodeHandoffCard slug={script.slug} title={`${script.series} · Épisode ${script.episode}`} handoff={handoff} onChange={setHandoff} cast={CHARACTERS.map((c) => ({ id: c.id, name: c.name }))} headers={studioHeaders} notify={notify} /> : null}
        {job ? (
          <p className="text-sm text-lily"><span className="studio-spinner" aria-hidden /> {job.label}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input type="number" min={1} max={30} value={nextCount} onChange={(e) => setNextCount(Number(e.target.value))} className="studio-input" style={{ width: "5rem" }} aria-label="Nombre de cases" />
            <select value={pace} onChange={(e) => setPace(e.target.value as "auto" | "calm" | "normal" | "action")} className="studio-input" aria-label="Rythme">
              <option value="auto">Auto (guide du film)</option>
              <option value="normal">Normal</option>
              <option value="action">Action</option>
              <option value="calm">Calme</option>
            </select>
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void continueStory()} disabled={busy}>
              Générer les {Math.max(1, Math.min(30, Math.round(nextCount) || 1))} premières cases
            </button>
          </div>
        )}
      </section>
    );
  }

  const pending = pendingPanels(panels).length;
  /** When a panel's image started and how long it usually takes: its own drawing, or its turn in a batch. */
  const busyOf = (id: string): { started: number; estimate: number } | undefined => {
    const own = drawing.get(id);
    if (own) return { started: own.started, estimate: own.kind === "retouch" ? ESTIMATE.retouch : imageEstimate() };
    const since = job?.runningSince?.[id];
    return since ? { started: since, estimate: imageEstimate() } : undefined;
  };
  const isTitleCard = selected.caption.some((c) => c.style === "title") && !selected.image.src;
  const versions = imageVersions(selected);
  const stripBusy = new Map<string, PanelBusy>([
    ...(job?.running ?? (job?.current ? [job.current] : [])).map((id) => [id, { label: "Génération…", ...busyOf(id) }] as [string, PanelBusy]),
    ...(job?.queue ?? []).map((id) => [id, { label: "En attente" }] as [string, PanelBusy]),
    ...[...drawing].map(([id, entry]) => [id, { label: entry.kind === "retouch" ? "Retouche…" : "Génération…", ...busyOf(id) }] as [string, PanelBusy]),
  ]);
  const preview = panelForGeneration(selected, script, library);
  const frames = attachedFrames(selected);

  return (
    <div className="studio-editor webtoon-editor">
      <aside className="studio-list" ref={listRef}>
        <p className="studio-list-total">
          {panels.length} cases · {layout.total_height.toLocaleString("fr-FR")} px
          {ignoredHoles ? (
            <>
              {" · "}
              <button
                type="button"
                className="studio-list-link"
                onClick={() => {
                  setPanels((current) => current.map((p) => (p.gap_ignored ? { ...p, gap_ignored: undefined } : p)));
                  onAutosave?.();
                }}
                title="Réafficher les trous dans le film que vous aviez ignorés"
              >
                {ignoredHoles} trou{ignoredHoles > 1 ? "s" : ""} ignoré{ignoredHoles > 1 ? "s" : ""} · réafficher
              </button>
            </>
          ) : null}
        </p>
        <div className="studio-list-actions">
          {job ? (
            <div className="studio-job" role="status" aria-live="polite">
              <div className="studio-job-head">
                <span className="studio-spinner" aria-hidden />
                <span className="studio-job-label">{job.label}</span>
                <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => { stopBatch.current = true; }} disabled={job.phase !== "images"}>Arrêter</button>
              </div>
              <ProgressBar
                key={`${job.phase}-${job.started ?? 0}`}
                startedAt={job.started ?? job.deadline - 60_000}
                estimateMs={Math.max(5_000, job.deadline - (job.started ?? job.deadline - 60_000))}
                label={job.phase === "writing" ? "Écriture des cases" : job.phase === "translating" ? "Traduction" : "Images"}
                done={job.phase === "images" ? job.done : undefined}
                total={job.phase === "images" ? job.total : undefined}
              />
            </div>
          ) : checked.size ? (
            <div className="studio-selection" role="toolbar" aria-label="Cases cochées">
              <span className="text-xs text-ivory/85"><b>{checked.size}</b> case{checked.size > 1 ? "s" : ""} cochée{checked.size > 1 ? "s" : ""}</span>
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void regenerateChecked()} disabled={busy} title="Regénère les cases cochées, dans l'ordre de la bande">Regénérer</button>
              <button type="button" className="webtoon-mini" onClick={() => void translatePanels(checkedPanels, false)} disabled={busy} title="Remplit les langues vides des cases cochées">Traduire</button>
              <button type="button" className="webtoon-mini" onClick={() => void reletterChecked()} disabled={busy} title="Place les bulles à côté de qui parle, d'après l'image, et vérifie chaque image (personnages, casque, armes) ; les cases fautives restent cochées">Replacer les bulles</button>
              {checkedPanels.some((p) => p.image.status === "stale") ? (
                <button
                  type="button"
                  className="webtoon-mini"
                  onClick={() => {
                    const ids = new Set(checkedPanels.filter((p) => p.image.status === "stale").map((p) => p.panel_id));
                    setPanels((current) => current.map((p) => (ids.has(p.panel_id) ? { ...p, image: { ...p.image, status: "generated" as const } } : p)));
                    notify(`${ids.size} image${ids.size > 1 ? "s" : ""} gardée${ids.size > 1 ? "s" : ""} telle${ids.size > 1 ? "s" : ""} quelle${ids.size > 1 ? "s" : ""}`);
                  }}
                  disabled={busy}
                  title="L'image de ces cases est juste malgré le changement de texte ou de fiche : elles ne sont plus à regénérer"
                >
                  Garder l&apos;image
                </button>
              ) : null}
              <button
                type="button"
                className="webtoon-mini"
                onClick={() => {
                  // The count is asked, with a suggestion by pace: the action pace tells every second in several panels, the others one panel per moment.
                  const rewritePace = paceAt(Math.min(...checkedPanels.map((p) => p.source_time_start ?? 0)));
                  const suggested = rewritePace === "action" ? checkedPanels.length * 2 : rewritePace === "calm" ? Math.max(4, Math.round(checkedPanels.length * 0.8)) : Math.max(8, Math.round(checkedPanels.length * 1.2));
                  const answer = window.prompt(`Réécrire ${checkedPanels.length} case${checkedPanels.length > 1 ? "s" : ""} en rythme ${pace === "auto" ? `du guide (${paceWord(rewritePace)})` : paceWord(pace)} : combien de cases écrire ?`, String(suggested));
                  const n = Math.round(Number(answer));
                  if (answer !== null && n > 0) void rewriteChecked(Math.min(150, n));
                }}
                disabled={busy}
                title="Remplace les cases cochées par une séquence réécrite sur le même passage du film, au rythme choisi dans « Suite de l'histoire »"
              >
                Réécrire
              </button>
              <button type="button" className="webtoon-mini" onClick={() => void auditPanels(checkedPanels, true)} disabled={busy} title="Compare les cases cochées aux fiches de leurs personnages, même déjà contrôlées">Contrôler</button>
              <button type="button" className="webtoon-mini" onClick={() => rhythmStrip(new Set(checkedPanels.map((p) => p.panel_id)))} disabled={busy || !guide?.sequences.length} title={guide?.sequences.length ? "L'espace avant chaque case cochée suit la scène du film : serré dans l'action, large dans la contemplation, une grande respiration entre deux scènes" : "Lisez d'abord le film dans « Images du film »"}>Rythmer</button>
              <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={deleteChecked} disabled={busy}>Supprimer</button>
              <button type="button" className="webtoon-mini" onClick={() => setChecked(new Set(panels.map((p) => p.panel_id)))} disabled={checked.size === panels.length}>Tout</button>
              <button type="button" className="webtoon-mini" onClick={() => setChecked(new Set())}>Aucune</button>
            </div>
          ) : (
            <>
              <button type="button" className="webtoon-mini" onClick={generatePending} disabled={busy || !pending} title="Génère chaque case sans image ou dont le prompt a changé">
                Générer les cases manquantes{pending ? ` (${pending})` : ""}
              </button>
              <button type="button" className="webtoon-mini" onClick={() => void translatePanels(panels, false)} disabled={busy} title="Remplit les langues vides de toutes les bulles, cartouches et sons">
                Traduire toute la bande
              </button>
              <button type="button" className="webtoon-mini" onClick={() => void polishStrip(false)} disabled={busy} title="Donne une forme de webtoon à chaque case et ajoute les cases de liaison qui manquent">
                Peaufiner la bande
              </button>
              <button type="button" className="webtoon-mini" onClick={() => rhythmStrip()} disabled={busy || !guide?.sequences.length} title={guide?.sequences.length ? "L'espace avant chaque case suit la scène du film : serré dans l'action, large dans la contemplation, une grande respiration entre deux scènes" : "Lisez d'abord le film dans « Images du film »"}>
                Rythmer les espaces
              </button>
              <button type="button" className="webtoon-mini" onClick={() => void checkLettering()} disabled={busy} title="Mesure chaque bulle et cartouche dans les quatre langues et signale celles qui débordent de leur case ou en chevauchent une autre">
                Vérifier les bulles
              </button>
              <button type="button" className="webtoon-mini" onClick={() => void auditPanels(panels)} disabled={busy} title="Compare chaque case dessinée aux fiches de ses personnages (costume, couleurs, casque, proportions) et liste celles qui s'en écartent">
                Contrôler la cohérence
              </button>
            </>
          )}
        </div>
        {letterIssues?.length ? (
          <div className="studio-letter-issues" role="status">
            <p>
              <b>Bulles trop pleines</b> dans {new Set(letterIssues.map((i) => i.panel_id)).size > 1 ? `${new Set(letterIssues.map((i) => i.panel_id)).size} cases` : "1 case"} :{" "}
              {(["fr", "en", "ja", "ko"] as Locale[])
                .map((l) => [l, letterIssues.filter((i) => i.locale === l).length] as const)
                .filter(([, n]) => n)
                .map(([l, n]) => `${l} ${n}`)
                .join(" · ")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini" onClick={() => setChecked(new Set(letterIssues.map((i) => i.panel_id)))}>Cocher ces cases</button>
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void fitOverflowing()} disabled={busy} title="Déplace chaque bulle qui dépasse juste assez pour tenir dans la case avec son texte le plus long, et agrandit la case si une bulle est plus haute qu'elle">Recadrer les bulles</button>
              <button type="button" className="webtoon-mini" onClick={() => setLetterIssues(null)}>Masquer</button>
            </div>
          </div>
        ) : null}
        {(() => {
          const off = panels.filter((p) => auditOf(p)?.issues.length);
          if (hideAudit || !off.length) return null;
          const byWho = new Map<string, number>();
          for (const p of off) for (const who of new Set(auditOf(p)!.issues.map((i) => i.who))) byWho.set(who, (byWho.get(who) ?? 0) + 1);
          const glaring = off.filter((p) => auditOf(p)!.issues.some((i) => i.severity === "high")).length;
          return (
            <div className="studio-letter-issues studio-audit-issues" role="status">
              <p>
                <b>Écarts aux fiches</b> dans {off.length > 1 ? `${off.length} cases` : "1 case"}
                {glaring ? `, dont ${glaring} visible${glaring > 1 ? "s" : ""} au premier coup d'œil` : ""} :{" "}
                {[...byWho].map(([id, n]) => `${CHARACTERS.find((c) => c.id === id)?.name ?? id} ${n}`).join(" · ")}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="webtoon-mini" onClick={() => setChecked(new Set(off.map((p) => p.panel_id)))} title="Puis « Regénérer », ou une case à la fois : « Retoucher avec ces remarques » dans l'inspecteur">Cocher ces cases</button>
                <button type="button" className="webtoon-mini" onClick={() => select(off.find((p) => auditOf(p)!.issues.some((i) => i.severity === "high"))?.panel_id ?? off[0].panel_id)}>Voir la première</button>
                <button type="button" className="webtoon-mini studio-primary" onClick={() => void fixAllFromAudit()} disabled={!user} title="Chaque case en écart est retouchée avec ses remarques, fiches en référence, sur le serveur ; les cases validées ne sont pas touchées">Tout corriger</button>
                <button type="button" className="webtoon-mini" onClick={() => setHideAudit(true)}>Masquer</button>
              </div>
            </div>
          );
        })()}
        {(() => {
          const progress = reviewProgress(panels);
          const toFinish = panels.filter(needsFinish).length;
          const sketches = panels.filter((p) => p.image.src && p.image.quality === "low").length;
          return (
            <div className="studio-rv-head">
              <div className="studio-rv-gauge" title={`${progress.approved} validées, ${progress.redo} à refaire, ${progress.total - progress.approved - progress.redo} à revoir`}>
                <span className="is-approved" style={{ width: `${progress.total ? (progress.approved / progress.total) * 100 : 0}%` }} />
                <span className="is-redo" style={{ width: `${progress.total ? (progress.redo / progress.total) * 100 : 0}%` }} />
              </div>
              <div className="studio-rv-row">
                <span>
                  <b>{progress.approved}</b>/{progress.total} validées{progress.redo ? ` · ${progress.redo} à refaire` : ""}{sketches ? ` · ${sketches} esquisses` : ""}
                </span>
                <select value={listFilter} onChange={(e) => setListFilter(e.target.value as typeof listFilter)} aria-label="Filtrer la liste">
                  <option value="all">Toutes les cases</option>
                  <option value="todo">À revoir</option>
                  <option value="approved">Validées</option>
                  <option value="redo">À refaire</option>
                  <option value="sketch">Esquisses</option>
                </select>
                {toFinish ? (
                  <button type="button" className="webtoon-mini studio-primary" onClick={() => void finishApproved()} disabled={!user} title="Les esquisses validées redessinées au propre en HD, même cadrage et même composition, sur le serveur">
                    Finir en HD ({toFinish})
                  </button>
                ) : null}
              </div>
            </div>
          );
        })()}
        <ol>
          {panels.map((panel, index) => (listFilter !== "all" && (listFilter === "sketch" ? !(panel.image.src && panel.image.quality === "low") : reviewOf(panel).status !== listFilter)) ? null : (
            <Fragment key={panel.panel_id}>
            {holeBefore(index) ? (
              <li className="studio-hole">
                <span>
                  Trou dans le film : {formatSeconds(holeBefore(index)!.from)} → {formatSeconds(holeBefore(index)!.to)} ({Math.round(holeBefore(index)!.to - holeBefore(index)!.from)} s sans case)
                </span>
                <span className="studio-hole-actions">
                  <button type="button" className="webtoon-mini" onClick={() => void fillHole(index)} disabled={busy} title="Écrit, dessine et traduit les cases qui manquent entre ces deux cases">
                    Combler
                  </button>
                  <button type="button" className="webtoon-mini" onClick={() => ignoreHole(index)} title="Laisser ce passage du film sans case, volontairement : le signal disparaît">
                    Ignorer
                  </button>
                </span>
              </li>
            ) : null}
            <li className={`studio-thumb-item ${checked.has(panel.panel_id) ? "is-checked" : ""} ${dropClass(listDrag, panel.panel_id)}`} {...listDrag.bind(panel.panel_id, "list")} title={busy ? undefined : "Maintenir le clic et glisser pour déplacer la case"}>
              <label className="studio-thumb-check" title="Cocher pour une action en lot (Maj+clic : plage)" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={checked.has(panel.panel_id)}
                  onChange={() => undefined}
                  onClick={(e) => toggleChecked(panel.panel_id, e.shiftKey)}
                  aria-label={`Cocher la case ${panel.panel_id}`}
                />
              </label>
              <button
                type="button"
                className={`studio-thumb ${panel.panel_id === selected.panel_id ? "is-active" : ""} ${job?.current === panel.panel_id || job?.running?.includes(panel.panel_id) ? "is-generating" : ""} ${job?.queue.includes(panel.panel_id) ? "is-queued" : ""}`}
                onClick={(e) => (e.shiftKey ? toggleChecked(panel.panel_id, true) : select(panel.panel_id))}
                style={{ background: panel.background === "white" ? "#f6f4ef" : "#020409" }}
              >
                {panel.image.src && panel.image.status !== "missing" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={panel.image.src} alt="" loading="lazy" style={{ objectPosition: `${panel.focal_point.x}% ${panel.focal_point.y}%` }} />
                ) : (
                  <span className="studio-thumb-empty">{panel.caption.some((c) => c.style === "title") ? panel.caption[0].text.en : "sans image"}</span>
                )}
                {job?.current === panel.panel_id || job?.running?.includes(panel.panel_id) || drawing.has(panel.panel_id) ? (
                  <span className="studio-thumb-overlay">
                    <span className="studio-spinner studio-spinner-lg" aria-hidden />
                    {drawing.get(panel.panel_id)?.kind === "retouch" ? "Retouche…" : "Génération…"}
                    {busyOf(panel.panel_id) ? <ProgressBar key={busyOf(panel.panel_id)!.started} startedAt={busyOf(panel.panel_id)!.started} estimateMs={busyOf(panel.panel_id)!.estimate} compact /> : null}
                  </span>
                ) : job?.queue.includes(panel.panel_id) ? (
                  <span className="studio-thumb-overlay studio-thumb-overlay-soft">en attente</span>
                ) : null}
                <span className="studio-thumb-meta">
                  <b>{panel.order}</b> {panel.panel_id}
                  {panel.fidelity !== "direct" ? <i> · {label(panel.fidelity)}</i> : null}
                  {panel.image.status === "stale" ? <i> · à regénérer</i> : panel.image.status === "missing" && !panel.caption.some((c) => c.style === "title") ? <i> · à générer</i> : null}
                  {reviewOf(panel).status === "approved" ? <i className="studio-thumb-ok" title={reviewOf(panel).note ?? "Validée"}> · validée</i> : reviewOf(panel).status === "redo" ? <i className="studio-thumb-warn" title={reviewOf(panel).note ?? "À refaire"}> · à refaire</i> : null}
                  {panel.image.src && panel.image.quality === "low" ? <i> · esquisse</i> : null}
                  {auditOf(panel)?.issues.length ? (
                    <i className={auditOf(panel)!.issues.some((i) => i.severity === "high") ? "studio-thumb-bad" : "studio-thumb-warn"} title={auditOf(panel)!.issues.map((i) => i.issue).join("\n")}>
                      {" "}· écart fiche
                    </i>
                  ) : null}
                  {letterIssues?.some((i) => i.panel_id === panel.panel_id) ? (
                    <i className="studio-thumb-warn" title={letterIssues.filter((i) => i.panel_id === panel.panel_id).map((i) => `${i.locale} : « ${i.text} » ${i.reason === "out" ? "dépasse de la case" : i.reason === "tall" ? "plus haute que la case" : "chevauche une autre bulle"}`).join("\n")}>
                      {" "}· bulles {[...new Set(letterIssues.filter((i) => i.panel_id === panel.panel_id).map((i) => i.locale))].join(", ")}
                    </i>
                  ) : null}
                </span>
              </button>
              <button
                type="button"
                className="studio-thumb-insert"
                title="Insérer une case vide ici"
                onClick={() => {
                  const next = insertAfter(panels, panel.panel_id);
                  setPanels(next);
                  const created = next.find((p) => !panels.some((q) => q.panel_id === p.panel_id));
                  if (created) select(created.panel_id);
                }}
              >
                +
              </button>
            </li>
            </Fragment>
          ))}
          {job?.phase === "writing"
            ? Array.from({ length: job.placeholders }, (_, i) => (
                <li key={`skeleton-${i}`}>
                  <div className="studio-thumb studio-thumb-skeleton" aria-hidden>
                    <span className="studio-thumb-empty">écriture de la case {panels.length + i + 1}…</span>
                  </div>
                </li>
              ))
            : null}
          <li>
            {!opensSeries && panels.length < 40 ? <EpisodeHandoffCard slug={script.slug} title={`${script.series} · Épisode ${script.episode}`} handoff={handoff} onChange={setHandoff} cast={CHARACTERS.map((c) => ({ id: c.id, name: c.name }))} headers={studioHeaders} notify={notify} /> : null}
            <div className="studio-next">
              <span className="studio-thumb-empty">Suite de l&apos;histoire</span>
              <p>
                Adapté jusqu&apos;à {coveredUntil(panels).toFixed(0)} s du film. Le studio lit les images suivantes et le scénario, écrit les cases, génère les images et traduit les textes.
              </p>
              <label>
                <input type="number" min={1} max={nextUnit === "seconds" ? 600 : 30} value={nextCount} onChange={(e) => setNextCount(Number(e.target.value))} disabled={busy} />
                <select value={nextUnit} onChange={(e) => setNextUnit(e.target.value as "panels" | "seconds")} disabled={busy} aria-label="Unité">
                  <option value="panels">cases</option>
                  <option value="seconds">secondes de film</option>
                </select>
              </label>
              <label>
                <span>Rythme</span>
                <select value={pace} onChange={(e) => setPace(e.target.value as "auto" | "calm" | "normal" | "action")} disabled={busy} title="Auto : le rythme de chaque séquence du guide du film (action, calme...). Normal : une case pour environ 3 s de film ; action : une pour 1,5 s, nerveuses ; calme : une pour 4,5 s, larges et silencieuses. Les temps forts ajoutent leurs cases.">
                  <option value="auto">Auto (guide du film)</option><option value="normal">Normal</option><option value="action">Action</option><option value="calm">Calme</option>
                </select>
              </label>
              {(() => {
                const next = sequenceAt(guide, coveredUntil(panels));
                if (!next) return pace === "auto" ? <p className="studio-next-guide">Le film n&apos;est pas encore lu : lancez la lecture dans « Images du film » pour que le rythme suive les scènes.</p> : null;
                return (
                  <p className="studio-next-guide">
                    À suivre : <b>{next.title}</b> · {SEQUENCE_LABEL[next.kind]}, intensité {next.intensity}/5
                    {pace === "auto" ? ` · rythme ${paceWord(paceOfKind(next.kind, next.intensity))}` : ""}
                  </p>
                );
              })()}
              <label className="studio-bg-toggle" title="Le serveur écrit, dessine et traduit sans cet onglet : vous pouvez le fermer et retrouver les cases plus tard. Vaut aussi pour « Générer les cases manquantes ».">
                <input type="checkbox" checked={background} onChange={(e) => chooseBackground(e.target.checked)} disabled={!user} />
                <span>Continuer même onglet fermé</span>
              </label>
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void continueStory()} disabled={busy}>
                {busy ? <><span className="studio-spinner" aria-hidden /> En cours…</> : nextUnit === "seconds" ? `Générer les ${Math.max(5, Math.min(600, Math.round(nextCount) || 30))} secondes suivantes` : (() => { const n = Math.max(1, Math.min(30, Math.round(nextCount) || 1)); return n === 1 ? "Générer la case suivante" : `Générer les ${n} cases suivantes`; })()}
              </button>
            </div>
          </li>
        </ol>
              <PanelDragGhost panel={panels.find((p) => p.panel_id === listDrag.dragId)} count={dragCount(listDrag.dragId)} pointer={listDrag.pointer} />
      </aside>

      <section className="studio-stage">
        <div className="studio-stage-bar">
          <div className="flex items-center gap-2">
            <button type="button" className="webtoon-mini" onClick={() => step(-1)} disabled={index <= 0} title="Case précédente">←</button>
            <span className="anime-label text-xs text-cyan-pale">{selected.panel_id} · case {selected.order}/{panels.length}</span>
            <button type="button" className="webtoon-mini" onClick={() => step(1)} disabled={index >= panels.length - 1} title="Case suivante">→</button>
          </div>
          <div className="flex items-center gap-3 text-xs text-ivory/70">
            <div className="studio-viewswitch" role="group" aria-label="Vue">
              <button type="button" className={`webtoon-mini ${view === "panel" ? "is-active" : ""}`} onClick={() => chooseView("panel")} title="La case sélectionnée seule, en grand">Case</button>
              <button type="button" className={`webtoon-mini ${view === "strip" ? "is-active" : ""}`} onClick={() => chooseView("strip")} title="Toute la bande comme le lecteur la voit, éditable directement">Bande</button>
              <button type="button" className={`webtoon-mini ${view === "review" ? "is-active" : ""}`} onClick={() => chooseView("review")} title="La bande face au film : chaque case à côté de l'image de sa seconde, les gestes et les passages sans case">Relecture</button>
              <button type="button" className={`webtoon-mini ${view === "phone" ? "is-active" : ""}`} onClick={() => chooseView("phone")} title="Le lecteur public sur un écran de téléphone, à sa vraie largeur">Téléphone</button>
            </div>
            <div className="studio-viewswitch" role="group" aria-label="Qualité des images">
              <button type="button" className={`webtoon-mini ${quality === "high" ? "is-active" : ""}`} onClick={() => chooseQuality("high")} title="Qualité haute, environ 0,09 $ par image">HD</button>
              <button type="button" className={`webtoon-mini ${quality === "medium" ? "is-active" : ""}`} onClick={() => chooseQuality("medium")} title="Qualité moyenne, même taille 1K : environ 0,03 $ de moins par case et deux fois plus rapide, un peu moins de détail">Éco</button>
              <button type="button" className={`webtoon-mini ${quality === "low" ? "is-active" : ""}`} onClick={() => chooseQuality("low")} title="Esquisse : quelques centimes par case, pour juger le cadrage et la mise en page. Validez les cases, puis « Finir en HD » les redessine au propre sans changer leur composition.">Esquisse</button>
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={showFocal} onChange={(e) => setShowFocal(e.target.checked)} /> Point focal</label>
            <div className="studio-gear" ref={panelMenuRef}>
              <button type="button" className={`webtoon-mini ${panelMenuOpen ? "is-active" : ""}`} onClick={() => setPanelMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={panelMenuOpen} title="Déplacer, insérer, couper, fusionner ou supprimer cette case">
                Case ▾
              </button>
              {panelMenuOpen ? (
                <div className="studio-gear-menu" role="menu">
                  <p className="studio-gear-title">Ordre</p>
                  <button type="button" role="menuitem" onClick={() => { setPanelMenuOpen(false); setPanels((c) => movePanel(c, selected.panel_id, -1)); }} disabled={index <= 0}><b>Monter</b><small>Échange avec la case précédente.</small></button>
                  <button type="button" role="menuitem" onClick={() => { setPanelMenuOpen(false); setPanels((c) => movePanel(c, selected.panel_id, 1)); }} disabled={index >= panels.length - 1}><b>Descendre</b><small>Échange avec la case suivante.</small></button>
                  <p className="studio-gear-title">Ajouter</p>
                  <button type="button" role="menuitem" onClick={() => { setPanelMenuOpen(false); setPanels((c) => insertAfter(c, selected.panel_id)); }}><b>Insérer une case vide après</b><small>Même monde que celle-ci, à décrire puis à générer.</small></button>
                  <label className="studio-gear-select">
                    <b>Nouvelle case après, depuis une image du film</b>
                    <select value="" onChange={(e) => { if (e.target.value) { setPanelMenuOpen(false); addFromFrame(e.target.value); } }}>
                      <option value="">Choisir une image…</option>
                      {FILM_FRAMES.map((f) => <option key={f.src} value={f.src}>{f.label}{selected.source_time_end !== null && f.seconds > selected.source_time_end ? "" : " (déjà adapté)"}</option>)}
                    </select>
                  </label>
                  <p className="studio-gear-title">Découper</p>
                  <button type="button" role="menuitem" onClick={() => { setPanelMenuOpen(false); setPanels((c) => splitPanel(c, selected.panel_id)); }}><b>Couper en deux</b><small>Deux cases de moitié de hauteur, même image.</small></button>
                  <button type="button" role="menuitem" onClick={() => { setPanelMenuOpen(false); setPanels((c) => mergeWithNext(c, selected.panel_id)); }} disabled={index >= panels.length - 1}><b>Fusionner avec la suivante</b><small>Une seule case plus haute, textes réunis.</small></button>
                  <p className="studio-gear-title">Retirer</p>
                  <button
                    type="button"
                    role="menuitem"
                    className="is-danger"
                    onClick={() => {
                      setPanelMenuOpen(false);
                      if (!window.confirm(`Supprimer la case ${selected.panel_id} ?`)) return;
                      const next = deletePanel(panels, selected.panel_id);
                      setPanels(next);
                      select(next[Math.min(index, next.length - 1)]?.panel_id ?? null);
                    }}
                  >
                    <b>Supprimer la case</b>
                    <small>Pour plusieurs cases à la fois, coche-les dans la liste.</small>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className={`studio-stage-wrap ${view === "strip" ? "is-strip" : ""}`}>
          {view === "phone" ? (
            <PhonePreview panels={panels} locale={locale} selectedId={selected.panel_id} onSelect={select} />
          ) : view === "review" ? (
            <StudioReview
              panels={panels}
              frames={ALL_FRAMES}
              guide={guide}
              selectedId={selected.panel_id}
              onSelect={select}
              onAdd={(input) => void addFromFilm(input)}
              busyIds={stripBusy}
              holeSeconds={HOLE_SECONDS}
            />
          ) : view === "strip" ? (
            <StripCanvas
              panels={panels}
              locale={locale}
              selectedId={selected.panel_id}
              onSelect={select}
              showFocal={showFocal}
              onChange={(id, changes) => setPanels((current) => updatePanel(current, id, changes))}
              onMove={dropPanels}
              dragDisabled={busy}
              checkedIds={checked}
              busyIds={stripBusy}
              onLayer={moveLayer}
              onDelete={(id) => {
                if (id !== selectedId) select(id);
                deleteSelected();
              }}
              frames={FILM_FRAMES}
              onInsertAfter={(id) => {
                const next = insertAfter(panels, id);
                setPanels(next);
                const created = next.find((p) => !panels.some((q) => q.panel_id === p.panel_id));
                if (created) select(created.panel_id);
              }}
              onInsertFrameAfter={(id, src) => {
                const frame = FILM_FRAMES.find((f) => f.src === src);
                if (!frame) return;
                const next = appendFromFrame(panels, frame, id);
                setPanels(next);
                const created = next.find((p) => !panels.some((q) => q.panel_id === p.panel_id));
                if (created) select(created.panel_id);
              }}
            />
          ) : (
            <PanelCanvas panel={selected} locale={locale} onChange={patch} showFocal={showFocal} />
          )}
          {view === "panel" && (job?.current === selected.panel_id || job?.running?.includes(selected.panel_id) || drawing.has(selected.panel_id)) ? (
            <div className="studio-stage-overlay" role="status">
              <span className="studio-spinner studio-spinner-lg" aria-hidden />
              <span>{drawing.get(selected.panel_id)?.kind === "retouch" ? "Retouche de l'image…" : "Génération de l'image…"}</span>
              {busyOf(selected.panel_id) ? <ProgressBar key={busyOf(selected.panel_id)!.started} startedAt={busyOf(selected.panel_id)!.started} estimateMs={busyOf(selected.panel_id)!.estimate} className="studio-stage-pbar" /> : null}
            </div>
          ) : null}
        </div>

        <div className={`studio-stage-actions ${view === "strip" ? "is-sticky" : ""}`} role="toolbar" aria-label="Actions sur l'image">
          <span className={`studio-status-chip ${selected.image.status === "stale" ? "is-stale" : selected.image.status === "missing" ? "is-missing" : ""}`}>
            {isTitleCard ? "Carte-titre, sans image" : selected.image.status === "generated" ? "Image générée" : selected.image.status === "stale" ? "Le texte a changé depuis l'image" : "Pas encore d'image"}
            {selected.image.cost_usd ? ` · ${selected.image.cost_usd.toFixed(3)} $` : ""}
            {selected.source_time_start !== null ? ` · film ${selected.source_time_start.toFixed(0)} s` : ""}
          </span>
          {!isTitleCard ? (
            <>
              <button type="button" className="webtoon-mini studio-primary" onClick={regenerate} disabled={drawing.has(selected.panel_id)} title={selected.image.src ? "Redessine la case à partir de sa description et de ses références ; d'autres cases peuvent être redessinées en même temps" : "Dessine la case à partir de sa description et de ses références"}>
                {drawing.get(selected.panel_id)?.kind === "generate" ? <><span className="studio-spinner" aria-hidden /> Dessin…</> : selected.image.src ? "Regénérer l'image" : "Générer l'image"}
              </button>
              <button type="button" className="webtoon-mini" onClick={() => setInpaintOpen(true)} disabled={drawing.has(selected.panel_id) || !selected.image.src} title="Modifie la case avec un prompt, toute l'image ou seulement une zone peinte">
                {drawing.get(selected.panel_id)?.kind === "retouch" ? <><span className="studio-spinner" aria-hidden /> Retouche…</> : "Modifier / retoucher"}
              </button>
              <button type="button" className="webtoon-mini" onClick={() => fileInput.current?.click()} disabled={busy} title="Remplace l'image par un fichier de ton ordinateur">Remplacer</button>
              <button type="button" className="webtoon-mini" onClick={copyPrompt} title="Copie la requête complète (prompt et références) dans le presse-papier">Copier la requête</button>
            </>
          ) : null}
          {!isTitleCard ? (
            <button type="button" className="webtoon-mini" onClick={() => setHistoryOpen(true)} disabled={!selected.image.src && !(selected.image_history ?? []).length} title="Toutes les images générées pour cette case, pour en remettre une">
              Historique
            </button>
          ) : null}
          <span className="studio-stage-actions-sep" aria-hidden />
          <button type="button" className="webtoon-mini" onClick={() => moveLayer(selected.panel_id, "front")} title="Passe cette case devant les cases voisines, là où elles se chevauchent">Mettre au-dessus</button>
          <button type="button" className="webtoon-mini" onClick={() => moveLayer(selected.panel_id, "back")} title="Passe cette case derrière les cases voisines, là où elles se chevauchent">Mettre en dessous</button>
          <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={deleteSelected} title="Supprime cette case (touche Suppr)">Supprimer</button>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void replaceImage(f); e.target.value = ""; }} />
        </div>
        {versions.length > 1 ? (
          <div className="studio-versions" role="group" aria-label="Historique des images de la case">
            <span className="studio-versions-label">Historique · {versions.length} images</span>
            <div className="studio-versions-row">
              {versions.map(({ image, current }, index) => {
                const when = image.generated_at ? new Date(image.generated_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "date inconnue";
                const title = `${originLabel(image)} · ${when}${image.note ? `\n« ${image.note} »` : ""}${image.cost_usd ? `\n${image.cost_usd.toFixed(3)} $` : ""}${current ? "\nImage actuelle" : "\nCliquer pour la remettre sur la case"}`;
                return (
                  <button
                    key={image.src}
                    type="button"
                    className={`studio-version ${current ? "is-current" : ""}`}
                    onClick={() => (current ? undefined : pickVersion(selected, image.src))}
                    disabled={drawing.has(selected.panel_id)}
                    title={title}
                    aria-pressed={current}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.src} alt="" loading="lazy" />
                    <span>{current ? "Actuelle" : index === 1 ? "Précédente" : originLabel(image)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <p className="studio-hint">
          {view === "strip" ? "Clique une case pour la sélectionner. " : ""}
          Glisse les poignées sur l&apos;image : rond = bulle, losange = pointe de la bulle, carré = son, pastille « Hauteur » en bas = hauteur de la case (l&apos;image est recadrée, pas étirée).
        </p>

        {historyOpen ? (
          <PanelHistory
            slug={script.slug}
            panel={selected}
            onClose={() => setHistoryOpen(false)}
            onPick={(image) => {
              setPanels((current) => current.map((p) => (p.panel_id === selected.panel_id ? withNewImage(p, image) : p)));
              onAutosave?.();
              notify(`Case ${selected.order} : version de l'historique remise`);
            }}
          />
        ) : null}
        {inpaintOpen && selected.image.src ? (
          <PanelInpaint
            panel={selected}
            notify={notify}
            onClose={() => setInpaintOpen(false)}
            onSubmit={(request) => void runRetouch(selected, request)}
            mentions={MENTIONS.filter((m) => !(m.kind === "panel" && m.id === selected.panel_id))}
          />
        ) : null}

      </section>

      <aside className="studio-inspector">
        <nav className="studio-tabs" aria-label="Réglages de la case">
          {(
            [
              ["scene", "Scène", "Ce que montre la case"],
              ["text", "Texte", "Bulles, sons, cartouches"],
              ["layout", "Mise en page", "Taille, rythme, cadrage"],
            ] as const
          ).map(([id, name, hint]) => (
            <button key={id} type="button" className={`studio-tab ${inspectorTab === id ? "is-active" : ""}`} onClick={() => setInspectorTab(id)} title={hint}>
              {name}
            </button>
          ))}
        </nav>

        {selected.image.src ? (
          <div className={`studio-rv-card is-${reviewOf(selected).status}`}>
            <div className="studio-rv-states" role="group" aria-label="Relecture de la case">
              {(["todo", "approved", "redo"] as ReviewState[]).map((state) => (
                <button key={state} type="button" className={`webtoon-mini ${reviewOf(selected).status === state ? "is-active" : ""}`} onClick={() => review(selected, state)} title={state === "approved" ? "Raccourci : V (valide et passe à la suivante)" : state === "redo" ? "Raccourci : X (à refaire et passe à la suivante)" : "Remet la case à revoir"}>
                  {REVIEW_LABEL[state]}
                </button>
              ))}
            </div>
            {reviewOf(selected).status !== "todo" ? (
              <input
                key={`${selected.panel_id}-${selected.review?.at ?? ""}`}
                className="studio-rv-note"
                defaultValue={reviewOf(selected).note ?? ""}
                placeholder={reviewOf(selected).status === "redo" ? "Ce qui ne va pas (pour vous, ou pour la retouche)" : "Une note, si besoin"}
                onBlur={(e) => {
                  if (e.target.value.trim() !== (reviewOf(selected).note ?? "")) review(selected, reviewOf(selected).status, e.target.value);
                }}
              />
            ) : null}
            {selected.image.quality === "low" ? <p className="studio-rv-hint">Esquisse : une fois validée, « Finir en HD » la redessine au propre sans changer sa composition.</p> : null}
          </div>
        ) : null}

        {auditOf(selected)?.issues.length ? (
          <div className="studio-audit-card" role="status">
            <b>Écarts à la fiche</b>
            <ul>
              {auditOf(selected)!.issues.map((issue, i) => (
                <li key={i} className={issue.severity === "high" ? "is-high" : ""}>
                  {issue.issue}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini studio-primary" onClick={() => fixFromAudit(selected)} disabled={drawing.has(selected.panel_id)} title="Une retouche de toute l'image qui applique ces remarques, avec la fiche des personnages en référence ; l'image actuelle reste dans l'historique">
                Retoucher avec ces remarques
              </button>
              <button type="button" className="webtoon-mini" onClick={() => patch({ audit: { ...auditOf(selected)!, issues: [] } })} title="L'image est juste : les remarques disparaissent jusqu'au prochain contrôle d'une nouvelle image">
                Ignorer
              </button>
            </div>
          </div>
        ) : null}

        {inspectorTab === "scene" ? (
          <div className="studio-section">
            <h3 className="studio-group-title">La case</h3>
            <label className="webtoon-field"><span>Description de la case</span><MentionTextarea rows={4} value={selected.description} placeholder="Ce que montre la case, en une ou deux phrases. C'est le cœur du prompt. Tapez @ pour appeler un personnage, un lieu, un objet ou une case." onChange={(value) => patch({ description: value })} items={MENTIONS} onMention={attachMention} /></label>
            <label className="webtoon-field"><span>Action</span><MentionTextarea rows={2} value={selected.action} onChange={(value) => patch({ action: value })} items={MENTIONS} onMention={attachMention} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="webtoon-field"><span>Émotion</span><input value={selected.emotion} onChange={(e) => patch({ emotion: e.target.value })} /></label>
              <label className="webtoon-field"><span>Rôle narratif</span>
                <select value={selected.narrative_role} onChange={(e) => patch({ narrative_role: e.target.value as NarrativeRole })}>{ROLES.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>
              </label>
            </div>
            <label className="webtoon-field"><span>Composition</span><MentionTextarea rows={2} value={selected.composition} placeholder="Où est le sujet dans le cadre, ce qui est au premier plan, où va l'œil." onChange={(value) => patch({ composition: value })} items={MENTIONS} onMention={attachMention} /></label>
            <h3 className="studio-group-title">Personnages <small>leurs fiches sont jointes au prompt</small></h3>
            <CastPicker items={CHARACTERS} selected={selected.characters} onToggle={(id, on) => setCharacters(id, on)} />
            <input
              placeholder="Autres, séparés par des virgules (sans fiche, décrits dans le texte)"
              value={selected.characters.filter((c) => !CHARACTERS.some((k) => k.id === c)).join(", ")}
              onChange={(e) => {
                const known = selected.characters.filter((c) => CHARACTERS.some((k) => k.id === c));
                const others = e.target.value.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
                patch({ characters: [...known, ...others] });
              }}
            />
            {OBJECTS.length ? (
              <>
                <h3 className="studio-group-title">Objets <small>visibles dans la case</small></h3>
                <CastPicker
                  items={OBJECTS}
                  selected={selected.objects ?? []}
                  mode="cover"
                  onToggle={(id, on) => {
                    const current = selected.objects ?? [];
                    patch({ objects: on ? [...current, id] : current.filter((o) => o !== id) });
                  }}
                />
              </>
            ) : null}
            <h3 className="studio-group-title">Lieu</h3>
            <CastPicker items={LOCATIONS} selected={[selected.location]} mode="cover" onToggle={(id) => patch({ location: id })} />
            <input placeholder="Autre lieu : un identifiant en minuscules avec des tirets, décrit dans la case" value={LOCATIONS.some((l) => l.id === selected.location) ? "" : selected.location} onChange={(e) => patch({ location: e.target.value.trim().toLowerCase() })} />
            <h3 className="studio-group-title">Caméra</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="webtoon-field"><span>Type de plan</span>
                <select value={selected.shot_type} onChange={(e) => patch({ shot_type: e.target.value as ShotType })}>{SHOT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
              </label>
              <label className="webtoon-field"><span>Angle</span>
                <select value={selected.camera_angle} onChange={(e) => patch({ camera_angle: e.target.value as CameraAngle })}>{ANGLES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
              </label>
            </div>
            <h3 className="studio-group-title">Images du film</h3>
            <div>
              <div className="studio-section-head">
                <span className="webtoon-field-label">Jointes à cette case</span>
                <select value="" onChange={(e) => { if (e.target.value) setPanels((c) => toggleFrame(c, selected.panel_id, e.target.value)); }}>
                  <option value="">+ Joindre une image du film…</option>
                  {FILM_FRAMES.filter((f) => !frames.includes(f.src)).map((f) => <option key={f.src} value={f.src}>{f.label}</option>)}
                </select>
              </div>
              {frames.length ? (
                <ul className="mt-1 flex flex-wrap gap-2">
                  {frames.map((src) => (
                    <li key={src} className="webtoon-ref">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" loading="lazy" />
                      <span>{panelReferenceNumber(src) !== null ? `Case ${panelReferenceNumber(src)}` : FILM_FRAMES.find((f) => f.src === src)?.label ?? src.split("/").pop()}</span>
                      <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => setPanels((c) => toggleFrame(c, selected.panel_id, src))}>Retirer</button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-ivory/50">Aucune image du film jointe à cette case.</p>}
            </div>
            <details className="studio-details">
              <summary>Prompt envoyé au modèle et références jointes</summary>
              <div className="studio-section">
                <div className="studio-section-head">
                  <label className="flex items-center gap-1 text-xs text-ivory/70" title="Le prompt est recomposé depuis les champs ci-dessus à chaque génération">
                    <input type="checkbox" checked={selected.prompt_auto === true} onChange={(e) => (e.target.checked ? recompose() : patch({ prompt_auto: false }))} /> Composé depuis les champs
                  </label>
                  <button type="button" className="webtoon-mini" onClick={recompose}>Recomposer</button>
                </div>
                <MentionTextarea
                  rows={12}
                  value={needsComposition(selected) ? preview.generation_prompt : selected.generation_prompt}
                  onChange={(value) => patch({ generation_prompt: value, prompt_auto: false })}
                  items={MENTIONS}
                  onMention={attachMention}
                />
                {needsComposition(selected) ? <p className="text-xs text-ivory/50">Aperçu du prompt composé. Le modifier à la main fige le texte ; « Recomposer » repart des champs.</p> : null}
                <span className="webtoon-field-label">Références jointes, dans l&apos;ordre</span>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {referencesForPanel(preview, library).map((ref) => (
                    <li key={ref.id} className="webtoon-ref">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ref.image} alt={ref.name} loading="lazy" />
                      <span>{ref.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        ) : null}

        {inspectorTab === "text" ? (
          <div className="studio-section">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini" onClick={() => void translatePanels([selected], false)} disabled={busy} title="Écris dans une langue, les trois autres sont remplies en langage parlé">
                Traduire les langues vides
              </button>
              <button type="button" className="webtoon-mini" onClick={() => { if (window.confirm("Retraduire tous les textes de cette case ? Les traductions existantes sont remplacées, la langue d'origine est gardée.")) void translatePanels([selected], true); }} disabled={busy}>
                Tout retraduire
              </button>
            </div>
            <div className="studio-section-head">
              <span className="webtoon-field-label">Bulles</span>
              <button type="button" className="webtoon-mini" onClick={() => patch({ dialogue: [...selected.dialogue, { speaker: "", text: { en: "" }, style: "speech", anchor: { x: 30, y: 20 }, tail: { x: 50, y: 50 } }] })}>+ Bulle</button>
            </div>
            {selected.dialogue.map((line, i) => (
              <div key={i} className="webtoon-subcard">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Qui parle" value={line.speaker} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, speaker: e.target.value } : l)) })} />
                  <select value={line.style} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, style: e.target.value as BubbleStyle } : l)) })}>
                    {BUBBLES.map((v) => <option key={v} value={v}>{label(v)}</option>)}
                  </select>
                </div>
                {textInputs(line.text, (text) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, text } : l)) }))}
                <div className="studio-numbers">
                  <label><span>x</span><input type="number" value={line.anchor.x} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, anchor: { ...l.anchor, x: Number(e.target.value) } } : l)) })} /></label>
                  <label><span>y</span><input type="number" value={line.anchor.y} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, anchor: { ...l.anchor, y: Number(e.target.value) } } : l)) })} /></label>
                  <label><span>pointe x</span><input type="number" value={line.tail?.x ?? 50} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, tail: { x: Number(e.target.value), y: l.tail?.y ?? 50 } } : l)) })} /></label>
                  <label><span>pointe y</span><input type="number" value={line.tail?.y ?? 50} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, tail: { x: l.tail?.x ?? 50, y: Number(e.target.value) } } : l)) })} /></label>
                </div>
                <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => patch({ dialogue: selected.dialogue.filter((_, k) => k !== i) })}>Supprimer la bulle</button>
              </div>
            ))}

            <div className="studio-section-head mt-4">
              <span className="webtoon-field-label">Sons (SFX)</span>
              <button type="button" className="webtoon-mini" onClick={() => patch({ sfx: [...selected.sfx, { text: { en: "whoosh" }, anchor: freeSpot(selected), style: "soft", rotate: -10, size: 90 }] })}>+ Son libre</button>
            </div>
            <div className={`studio-sfx-library ${sfxFont.variable}`} role="group" aria-label="Bibliothèque de sons">
              {SFX_LIBRARY.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="studio-sfx-chip"
                  title={`${preset.hint} · ${preset.effect.text.fr} / ${preset.effect.text.en} / ${preset.effect.text.ja} / ${preset.effect.text.ko}`}
                  onClick={() => {
                    patch({ sfx: [...selected.sfx, { ...preset.effect, text: { ...preset.effect.text }, anchor: freeSpot(selected) }] });
                    notify(`Son « ${preset.effect.text.fr} » posé : glissez-le sur l'image pour le placer`);
                  }}
                >
                  <span className={`studio-sfx-chip-sample webtoon-sfx-${preset.effect.style}`}>{preset.effect.text.fr}</span>
                  <small>{preset.label}</small>
                </button>
              ))}
            </div>
            {selected.sfx.map((effect, i) => (
              <div key={i} className="webtoon-subcard">
                {textInputs(effect.text, (text) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, text } : s)) }))}
                <div className="grid grid-cols-2 gap-2">
                  <select value={effect.style} onChange={(e) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, style: e.target.value as SfxStyle } : s)) })}>
                    {SFX_STYLES.map((v) => <option key={v} value={v}>{SFX_STYLE_LABEL[v]}</option>)}
                  </select>
                  <label className="webtoon-field"><span>Taille {effect.size ?? 96}</span><input type="range" min={30} max={260} value={effect.size ?? 96} onChange={(e) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, size: Number(e.target.value) } : s)) })} /></label>
                </div>
                <label className="webtoon-field"><span>Rotation {effect.rotate ?? 0}°</span><input type="range" min={-90} max={90} value={effect.rotate ?? 0} onChange={(e) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, rotate: Number(e.target.value) } : s)) })} /></label>
                <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => patch({ sfx: selected.sfx.filter((_, k) => k !== i) })}>Supprimer le son</button>
              </div>
            ))}

            <div className="studio-section-head mt-4">
              <span className="webtoon-field-label">Cartouches</span>
              <button type="button" className="webtoon-mini" onClick={() => patch({ caption: [...selected.caption, { text: { en: "" }, anchor: { x: 8, y: 8 }, style: "narration" }] })}>+ Cartouche</button>
            </div>
            {selected.caption.map((box, i) => (
              <div key={i} className="webtoon-subcard">
                {textInputs(box.text, (text) => patch({ caption: selected.caption.map((c, k) => (k === i ? { ...c, text } : c)) }))}
                <select value={box.style} onChange={(e) => patch({ caption: selected.caption.map((c, k) => (k === i ? { ...c, style: e.target.value as "narration" | "location" | "time" | "title" } : c)) })}>
                  <option value="narration">Narration</option><option value="location">Lieu</option><option value="time">Temps</option><option value="title">Titre (carte-titre, sans image)</option>
                </select>
                <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => patch({ caption: selected.caption.filter((_, k) => k !== i) })}>Supprimer</button>
              </div>
            ))}
          </div>
        ) : null}

        {inspectorTab === "layout" ? (
          <div className="studio-section">
            <label className="webtoon-field">
              <span>Hauteur : {selected.panel_height} px (ratio {selected.aspect_ratio})</span>
              <input type="range" min={240} max={2600} step={10} value={selected.panel_height} onChange={(e) => patch({ panel_height: Number(e.target.value) })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="webtoon-field webtoon-field-row"><input type="checkbox" checked={selected.bleed} onChange={(e) => patch({ bleed: e.target.checked })} /><span>Pleine largeur</span></label>
              <label className="webtoon-field webtoon-field-row"><input type="checkbox" checked={selected.border} onChange={(e) => patch({ border: e.target.checked })} /><span>Bordure</span></label>
              <label className="webtoon-field"><span>Fond de page</span>
                <select value={selected.background} onChange={(e) => patch({ background: e.target.value as PanelBackground })}>{BACKGROUNDS.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>
              </label>
              <label className="webtoon-field"><span>Point focal x, y</span>
                <div className="flex gap-2">
                  <input type="number" min={0} max={100} value={selected.focal_point.x} onChange={(e) => patch({ focal_point: { ...selected.focal_point, x: Number(e.target.value) } })} />
                  <input type="number" min={0} max={100} value={selected.focal_point.y} onChange={(e) => patch({ focal_point: { ...selected.focal_point, y: Number(e.target.value) } })} />
                </div>
              </label>
              <label className="webtoon-field"><span>Transition (espace avant)</span>
                <select value={selected.transition_type} onChange={(e) => setPanels((c) => setTransition(c, selected.panel_id, e.target.value as TransitionType))}>
                  {TRANSITIONS.map((v) => <option key={v} value={v}>{label(v)} · {SPACING_BY_TRANSITION[v]} px</option>)}
                </select>
              </label>
              <label className="webtoon-field"><span>Fidélité au film</span>
                <select value={selected.fidelity} onChange={(e) => patch({ fidelity: e.target.value as Fidelity })}>{FIDELITIES.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>
              </label>
              <label className="webtoon-field"><span>Espace avant (px)</span><input type="number" min={0} max={4000} step={10} value={selected.spacing_before} onChange={(e) => patch({ spacing_before: Number(e.target.value) })} /></label>
              <label className="webtoon-field"><span>Espace après (px)</span><input type="number" min={0} max={4000} step={10} value={selected.spacing_after} onChange={(e) => patch({ spacing_after: Number(e.target.value) })} /></label>
            </div>
            <div className="studio-section-head mt-3">
              <span className="webtoon-field-label">Forme de la case sur la bande</span>
              <button type="button" className="webtoon-mini" onClick={() => patch({ frame: undefined })} disabled={!selected.frame} title="Revenir à la case pleine largeur ou encadrée simple">Réinitialiser</button>
            </div>
            {(() => {
              const frame: PanelFrame = selected.frame ?? {};
              const setFrame = (changes: Partial<PanelFrame>) => patch({ frame: { ...frame, ...changes } });
              const width = frame.width ?? (selected.bleed ? 100 : 92);
              return (
                <div className="grid grid-cols-2 gap-3">
                  <label className="webtoon-field"><span>Largeur · {width} %</span>
                    <input type="range" min={40} max={100} step={2} value={width} onChange={(e) => setFrame({ width: Number(e.target.value) })} />
                  </label>
                  <label className="webtoon-field"><span>Côté</span>
                    <select value={typeof frame.x === "number" ? "free" : frame.align ?? "center"} onChange={(e) => e.target.value !== "free" && setFrame({ align: e.target.value as PanelFrame["align"], x: undefined })} disabled={width >= 100}>
                      {typeof frame.x === "number" ? <option value="free">Placée à la main</option> : null}
                      <option value="left">À gauche</option><option value="center">Centrée</option><option value="right">À droite</option>
                    </select>
                  </label>
                  <label className="webtoon-field"><span>Forme</span>
                    <select value={frame.shape ?? "rect"} onChange={(e) => setFrame({ shape: e.target.value as PanelFrame["shape"] })}>
                      <option value="rect">Droite</option><option value="rounded">Angles arrondis</option><option value="slant">Bords inclinés</option><option value="slant-reverse">Bords inclinés (inverse)</option><option value="wedge">Bas en biseau</option><option value="wedge-reverse">Bas en biseau (inverse)</option>
                    </select>
                  </label>
                  <label className="webtoon-field"><span>Chevauche la case du dessus · {frame.overlap ?? 0} px</span>
                    <input type="range" min={0} max={400} step={10} value={frame.overlap ?? 0} onChange={(e) => setFrame({ overlap: Number(e.target.value) })} />
                  </label>
                  <label className="webtoon-field"><span>Inclinaison · {frame.tilt ?? 0}°</span>
                    <input type="range" min={-6} max={6} step={1} value={frame.tilt ?? 0} onChange={(e) => setFrame({ tilt: Number(e.target.value) })} />
                  </label>
                  <label className="webtoon-field webtoon-field-row"><input type="checkbox" checked={frame.shadow ?? width < 100} onChange={(e) => setFrame({ shadow: e.target.checked })} /><span>Ombre portée</span></label>
                </div>
              );
            })()}
            <p className="text-xs text-ivory/60">Temps {selected.beat_id} · plans {selected.source_shots.join(", ") || "aucun"}{selected.source_time_start !== null ? ` · film ${selected.source_time_start.toFixed(1)} s à ${selected.source_time_end?.toFixed(1)} s` : ""}{selected.image.model ? ` · ${selected.image.model}` : ""}</p>
          </div>
        ) : null}
      </aside>
      <StudioDirector ask={askDirector} busy={busy} mentions={MENTIONS} />
    </div>
  );
}
