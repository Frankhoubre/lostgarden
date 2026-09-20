"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { PanelCanvas } from "@/components/studio/PanelCanvas";
import { Avatar } from "@/components/studio/Avatar";
import { PanelInpaint } from "@/components/studio/PanelInpaint";
import { StripCanvas } from "@/components/studio/StripCanvas";
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
  insertAfter,
  markForRegeneration,
  mergeWithNext,
  movePanel,
  setTransition,
  splitPanel,
  toggleFrame,
  updatePanel,
} from "@/lib/webtoon/editor-ops";
import { buildGenerationRequest } from "@/lib/webtoon/generation";
import { computeLayout } from "@/lib/webtoon/layout";
import { libraryCharacters, libraryLocations, referencesForPanel } from "@/lib/webtoon/references";
import { imageSize, readFileAsDataUrl, uploadPanelImage } from "@/lib/webtoon/studio";
import { studioFilmFrames } from "@/lib/webtoon/studio-assets";
import { applyTranslations, itemsToTranslate, type LetteringItem } from "@/lib/webtoon/translate";
import type {
  BubbleStyle,
  CameraAngle,
  Fidelity,
  LibraryOverlay,
  LocalizedText,
  PanelFrame,
  NarrativeRole,
  PanelBackground,
  ShotType,
  TransitionType,
  WebtoonPanel,
  WebtoonScript,
} from "@/lib/webtoon/types";

const SHOT_TYPES: ShotType[] = ["extreme_wide", "wide", "full", "medium", "medium_close_up", "close_up", "extreme_close_up", "detail", "void"];
const ANGLES: CameraAngle[] = ["eye_level", "low", "high", "top_down", "dutch", "over_the_shoulder", "worm"];
const TRANSITIONS = Object.keys(SPACING_BY_TRANSITION) as TransitionType[];
const BACKGROUNDS: PanelBackground[] = ["white", "black", "abyss"];
const BUBBLES: BubbleStyle[] = ["speech", "whisper", "thought", "shout", "off"];
const FIDELITIES: Fidelity[] = ["direct", "reframe", "bridge"];
const ROLES: NarrativeRole[] = ["breath", "establishing", "character_intro", "action", "reaction", "dialogue", "detail", "reveal", "transition", "tension", "cliffhanger"];
const FILM_FRAMES = studioFilmFrames();

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
  /** Panel whose image is being generated right now. */
  current: string | null;
  /** Skeleton cards shown while the writer drafts the panels. */
  placeholders: number;
  /** When the current estimate says the job ends. */
  deadline: number;
};

const ESTIMATE = { writeBase: 25_000, writePer: 5_000, image: 50_000, translateBase: 10_000, translatePer: 1_000 };

/** A deadline `ms` from now, kept out of the component so the lint knows it is not render work. */
function deadlineIn(ms: number): number {
  return Date.now() + ms;
}

function remaining(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r >= 15 ? `${m} min ${r} s` : `${m} min`;
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
  /** Ask the studio to write the draft once the current panels are rendered. */
  onAutosave?: () => void;
  /** The studio's characters and locations, attached to every generation. */
  library: LibraryOverlay;
  /** Language of the lettering shown in the canvas and the strip preview. */
  previewLocale: Locale;
  /** Reports the running job so the bar can show it from every tab. */
  onJob?: (job: JobSummary) => void;
};

/**
 * The working view of the strip: the list on the left, the selected panel
 * at working size in the middle with draggable lettering, the inspector on
 * the right. Every change goes through the pure editor operations, so the
 * public reader renders exactly what is edited here.
 */
export function StudioEditor({ script, panels, setPanels, selectedId, setSelectedId, notify, onAutosave, library, previewLocale, onJob }: StudioEditorProps) {
  useLocale();
  const locale = previewLocale;
  const CHARACTERS = useMemo(() => libraryCharacters(library), [library]);
  const LOCATIONS = useMemo(() => libraryLocations(library), [library]);
  const { user } = useAuth();
  /** `panel`: the selected panel alone; `strip`: the whole strip as the reader sees it, editable in place. */
  const [view, setView] = useState<"panel" | "strip">(() => {
    try {
      return window.localStorage.getItem("studio.view") === "strip" ? "strip" : "panel";
    } catch {
      return "panel";
    }
  });
  const chooseView = (next: "panel" | "strip") => {
    setView(next);
    try {
      window.localStorage.setItem("studio.view", next);
    } catch {
      // Storage may be unavailable; the choice just does not persist.
    }
  };
  const [showFocal, setShowFocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [nextCount, setNextCount] = useState(10);
  const [inpaintOpen, setInpaintOpen] = useState(false);
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
  const lastChecked = useRef<string | null>(null);
  const stopBatch = useRef(false);
  /** Measured image durations, so the estimate learns from the real speed. */
  const imageTimes = useRef<number[]>([]);

  useEffect(() => {
    if (!job) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [job]);
  useEffect(() => {
    onJob?.(job ? { label: job.label, done: job.done, total: job.total, deadline: job.deadline } : null);
  }, [job, onJob]);
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => panels.find((p) => p.panel_id === selectedId) ?? panels[0] ?? null, [panels, selectedId]);
  const layout = useMemo(() => computeLayout(panels), [panels]);
  const index = selected ? panels.findIndex((p) => p.panel_id === selected.panel_id) : -1;

  const patch = (changes: Partial<WebtoonPanel>) => {
    if (!selected) return;
    setPanels((current) => updatePanel(current, selected.panel_id, changes));
  };

  const select = (id: string | null) => {
    setSelectedId(id);
  };

  const step = (delta: number) => {
    const next = panels[index + delta];
    if (next) select(next.panel_id);
  };

  /** Store an image on a panel: uploaded to Storage when signed in, kept in the session otherwise. */
  const applyImage = async (panel: WebtoonPanel, dataUrl: string, model?: string, extra: Partial<WebtoonPanel> = {}, cost?: number) => {
    let src = dataUrl;
    if (user && dataUrl.startsWith("data:")) {
      try {
        src = await uploadPanelImage(script.slug, panel.panel_id, dataUrl);
      } catch (error) {
        notify(`Image gardée dans la session seulement : ${error instanceof Error ? error.message : "envoi impossible"}`);
      }
    }
    const size = await imageSize(dataUrl).catch(() => ({ width: 1080, height: panel.panel_height }));
    setPanels((current) =>
      current.map((p) =>
        p.panel_id === panel.panel_id
          ? { ...p, ...extra, image: { src, width: size.width, height: size.height, model, generated_at: new Date().toISOString(), status: "generated", ...(cost ? { cost_usd: cost } : {}) } }
          : p,
      ),
    );
  };

  /** One generation call for one panel; the composed prompt comes back with the image. */
  const generateOne = async (panel: WebtoonPanel): Promise<boolean> => {
    try {
      const response = await fetch(`/api/webtoon/${script.slug}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ panel_id: panel.panel_id, panel, library }),
      });
      const payload = (await response.json().catch(() => ({}))) as GeneratePayload;
      const received = payload.src ?? payload.data_url;
      if (!response.ok || !received) {
        notify(`${panel.panel_id} : ${payload.error ?? `erreur ${response.status}`}`);
        setPanels((current) => markForRegeneration(current, panel.panel_id));
        return false;
      }
      const composed: Partial<WebtoonPanel> =
        needsComposition(panel) && payload.generation_prompt
          ? { generation_prompt: payload.generation_prompt, negative_constraints: payload.negative_constraints ?? panel.negative_constraints, visual_references: payload.visual_references ?? panel.visual_references, prompt_auto: true }
          : {};
      await applyImage(panel, received, payload.model, composed, payload.cost_usd);
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur de génération");
      return false;
    }
  };

  const regenerate = async () => {
    if (!selected || busy) return;
    if (!selected.description.trim() && !selected.generation_prompt.trim()) {
      notify("Écris d'abord une description de la case");
      return;
    }
    setBusy(true);
    stopBatch.current = false;
    try {
      if (await runImages([selected])) notify(selected.image.src ? "Image regénérée" : "Image générée");
    } finally {
      setJob(null);
      setBusy(false);
    }
  };

  /** Generate every panel without a current image, one after the other, in strip order. */
  const generatePending = async () => {
    if (busy) return;
    const todo = pendingPanels(panels);
    if (!todo.length) {
      notify("Toutes les cases ont une image à jour");
      return;
    }
    if (!window.confirm(`Générer ${todo.length} case${todo.length > 1 ? "s" : ""} (${todo.map((p) => p.panel_id).join(", ")}) ?`)) return;
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
    let ok = 0;
    for (const [i, panel] of list.entries()) {
      if (stopBatch.current) break;
      const left = list.length - i;
      setJob({
        phase: "images",
        label: `Image ${i + 1}/${list.length} · ${panel.panel_id}`,
        done: i,
        total: list.length,
        queue: list.slice(i + 1).map((p) => p.panel_id),
        current: panel.panel_id,
        placeholders: 0,
        deadline: deadlineIn(left * imageEstimate()),
      });
      select(panel.panel_id);
      const started = Date.now();
      if (await generateOne(panel)) {
        ok += 1;
        imageTimes.current.push(Date.now() - started);
        onAutosave?.();
      }
    }
    return ok;
  };

  /**
   * Continue the story: the writer model drafts the next N panels from the
   * frames that follow the last one, the engine composes them, then the
   * images are generated one by one and the lettering is translated.
   */
  const continueStory = async () => {
    if (busy) return;
    const count = Math.max(1, Math.min(30, Math.round(nextCount) || 1));
    if (!window.confirm(`Écrire et générer ${count === 1 ? "la case suivante" : `les ${count} cases suivantes`} à partir de ${Math.max(0, ...panels.map((p) => p.source_time_end ?? 0)).toFixed(0)} s du film ?`)) return;
    setBusy(true);
    stopBatch.current = false;
    setJob({
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
      const created: WebtoonPanel[] = [];
      let current = panels;
      while (created.length < count && !stopBatch.current) {
        const ask = Math.min(8, count - created.length);
        setJob((job) => (job ? { ...job, label: `Écriture des cases ${panels.length + created.length + 1} à ${panels.length + created.length + ask}…`, placeholders: count - created.length } : job));
        const response = await fetch(`/api/webtoon/${script.slug}/continue`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
          body: JSON.stringify({ count: ask, panels: current, library }),
        });
        const payload = (await response.json().catch(() => ({}))) as { panels?: WebtoonPanel[]; error?: string };
        if (!response.ok || !payload.panels?.length) {
          notify(payload.error ?? `Erreur ${response.status}`);
          if (!created.length) return;
          break;
        }
        created.push(...payload.panels);
        current = [...current, ...payload.panels].map((p, i) => ({ ...p, order: i + 1 }));
        const snapshot = current;
        setPanels(snapshot);
        onAutosave?.();
        if (created.length === payload.panels.length) select(created[0].panel_id);
      }
      notify(`${created.length} cases écrites. Génération des images…`);
      // A title card has no image to make.
      const ok = await runImages(created.filter((p) => p.description.trim() || p.generation_prompt.trim()));
      if (!stopBatch.current) {
        setJob({ phase: "translating", label: "Traduction des textes…", done: created.length, total: created.length, queue: [], current: null, placeholders: 0, deadline: deadlineIn(ESTIMATE.translateBase + ESTIMATE.translatePer * created.length) });
        setBusy(false);
        await translatePanels(created, false);
      }
      notify(`Suite écrite : ${created.length} cases, ${ok} image${ok > 1 ? "s" : ""}. Pense à enregistrer.`);
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
  const polishStrip = async () => {
    if (busy) return;
    if (!window.confirm("Peaufiner la bande ? L'IA donne une forme de webtoon à chaque case (largeur, côté, bords, chevauchement) et ajoute les cases de liaison qui manquent, puis génère leurs images.")) return;
    setBusy(true);
    stopBatch.current = false;
    setJob({ phase: "writing", label: "Mise en page et cases de liaison…", done: 0, total: 1, queue: [], current: null, placeholders: 0, deadline: deadlineIn(90_000) });
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
          setJob({ phase: "translating", label: "Traduction des textes…", done: created.length, total: created.length, queue: [], current: null, placeholders: 0, deadline: deadlineIn(ESTIMATE.translateBase + ESTIMATE.translatePer * created.length) });
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

  const replaceImage = async (file: File) => {
    if (!selected) return;
    setBusy(true);
    try {
      await applyImage(selected, await readFileAsDataUrl(file), "manual-upload");
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
      setPanels((current) => current.map((p) => (byPanel.has(p.panel_id) ? applyTranslations(p, byPanel.get(p.panel_id)!, all) : p)));
      onAutosave?.();
      notify(`${batchItems.length} texte${batchItems.length > 1 ? "s" : ""} traduit${batchItems.length > 1 ? "s" : ""} en fr, en, ja, ko`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur de traduction");
    } finally {
      setBusy(false);
    }
  };

  const setCharacters = (id: string, on: boolean) => {
    if (!selected) return;
    const characters = on ? [...new Set([...selected.characters, id])] : selected.characters.filter((c) => c !== id);
    patch({ characters, image: selected.image.status === "generated" ? { ...selected.image, status: "stale" } : selected.image });
  };

  const toggleChecked = (id: string, shiftKey: boolean) => {
    // Read the anchor now: the state updater runs later, once the anchor has moved.
    const anchor = shiftKey ? lastChecked.current : null;
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

  const regenerateChecked = async () => {
    if (busy || !checkedPanels.length) return;
    const withText = checkedPanels.filter((p) => p.description.trim() || p.generation_prompt.trim());
    if (!withText.length) {
      notify("Aucune des cases cochées n'a de description");
      return;
    }
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

  if (!selected) return <p className="text-sm text-ivory/70">Aucune case.</p>;

  const pending = pendingPanels(panels).length;
  const isTitleCard = selected.caption.some((c) => c.style === "title") && !selected.image.src;
  const preview = panelForGeneration(selected, script, library);
  const frames = attachedFrames(selected);

  return (
    <div className="studio-editor webtoon-editor">
      <aside className="studio-list">
        <p className="studio-list-total">{panels.length} cases · {layout.total_height.toLocaleString("fr-FR")} px</p>
        <div className="studio-list-actions">
          {job ? (
            <div className="studio-job" role="status" aria-live="polite">
              <div className="studio-job-head">
                <span className="studio-spinner" aria-hidden />
                <span className="studio-job-label">{job.label}</span>
                <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => { stopBatch.current = true; }} disabled={job.phase !== "images"}>Arrêter</button>
              </div>
              <div className="studio-progress" aria-hidden>
                <i style={{ width: `${job.phase === "writing" ? 6 : job.phase === "translating" ? 96 : Math.round(8 + (88 * job.done) / Math.max(1, job.total))}%` }} />
              </div>
              <span className="studio-job-eta">
                {job.phase === "images" ? `${job.done}/${job.total} images faites · ` : ""}
                {job.deadline > now ? `≈ ${remaining(job.deadline - now)} restantes` : "encore quelques secondes…"}
              </span>
            </div>
          ) : checked.size ? (
            <div className="studio-selection" role="toolbar" aria-label="Cases cochées">
              <span className="text-xs text-ivory/85"><b>{checked.size}</b> case{checked.size > 1 ? "s" : ""} cochée{checked.size > 1 ? "s" : ""}</span>
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void regenerateChecked()} disabled={busy} title="Regénère les cases cochées, dans l'ordre de la bande">Regénérer</button>
              <button type="button" className="webtoon-mini" onClick={() => void translatePanels(checkedPanels, false)} disabled={busy} title="Remplit les langues vides des cases cochées">Traduire</button>
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
              <button type="button" className="webtoon-mini" onClick={() => void polishStrip()} disabled={busy} title="Donne une forme de webtoon à chaque case et ajoute les cases de liaison qui manquent">
                Peaufiner la bande
              </button>
            </>
          )}
        </div>
        <ol>
          {panels.map((panel) => (
            <li key={panel.panel_id} className={`studio-thumb-item ${checked.has(panel.panel_id) ? "is-checked" : ""}`}>
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
                className={`studio-thumb ${panel.panel_id === selected.panel_id ? "is-active" : ""} ${job?.current === panel.panel_id ? "is-generating" : ""} ${job?.queue.includes(panel.panel_id) ? "is-queued" : ""}`}
                onClick={(e) => (e.shiftKey ? toggleChecked(panel.panel_id, true) : select(panel.panel_id))}
                style={{ background: panel.background === "white" ? "#f6f4ef" : "#020409" }}
              >
                {panel.image.src && panel.image.status !== "missing" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={panel.image.src} alt="" loading="lazy" style={{ objectPosition: `${panel.focal_point.x}% ${panel.focal_point.y}%` }} />
                ) : (
                  <span className="studio-thumb-empty">{panel.caption.some((c) => c.style === "title") ? panel.caption[0].text.en : "sans image"}</span>
                )}
                {job?.current === panel.panel_id ? (
                  <span className="studio-thumb-overlay"><span className="studio-spinner studio-spinner-lg" aria-hidden />Génération…</span>
                ) : job?.queue.includes(panel.panel_id) ? (
                  <span className="studio-thumb-overlay studio-thumb-overlay-soft">en attente</span>
                ) : null}
                <span className="studio-thumb-meta">
                  <b>{panel.order}</b> {panel.panel_id}
                  {panel.fidelity !== "direct" ? <i> · {label(panel.fidelity)}</i> : null}
                  {panel.image.status === "stale" ? <i> · à regénérer</i> : panel.image.status === "missing" && !panel.caption.some((c) => c.style === "title") ? <i> · à générer</i> : null}
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
            <div className="studio-next">
              <span className="studio-thumb-empty">Suite de l&apos;histoire</span>
              <p>
                Adapté jusqu&apos;à {Math.max(0, ...panels.map((p) => p.source_time_end ?? 0)).toFixed(0)} s du film. Le studio lit les images suivantes et le scénario, écrit les cases, génère les images et traduit les textes.
              </p>
              <label>
                <input type="number" min={1} max={30} value={nextCount} onChange={(e) => setNextCount(Number(e.target.value))} disabled={busy} />
                <span>cases</span>
              </label>
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void continueStory()} disabled={busy}>
                {busy ? <><span className="studio-spinner" aria-hidden /> En cours…</> : (() => { const n = Math.max(1, Math.min(30, Math.round(nextCount) || 1)); return n === 1 ? "Générer la case suivante" : `Générer les ${n} cases suivantes`; })()}
              </button>
            </div>
          </li>
        </ol>
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
          {view === "strip" ? (
            <StripCanvas
              panels={panels}
              locale={locale}
              selectedId={selected.panel_id}
              onSelect={select}
              showFocal={showFocal}
              onChange={(id, changes) => setPanels((current) => updatePanel(current, id, changes))}
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
          {view === "panel" && job?.current === selected.panel_id ? (
            <div className="studio-stage-overlay" role="status">
              <span className="studio-spinner studio-spinner-lg" aria-hidden />
              <span>Génération de l&apos;image…</span>
              <small>{job.deadline > now ? `≈ ${remaining(job.deadline - now)}` : "presque fini"}</small>
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
              <button type="button" className="webtoon-mini studio-primary" onClick={regenerate} disabled={busy} title={selected.image.src ? "Redessine la case à partir de sa description et de ses références" : "Dessine la case à partir de sa description et de ses références"}>
                {busy ? "…" : selected.image.src ? "Regénérer l'image" : "Générer l'image"}
              </button>
              <button type="button" className="webtoon-mini" onClick={() => setInpaintOpen(true)} disabled={busy || !selected.image.src} title="Peins une zone de l'image et dis ce qui doit y apparaître : seule cette zone change">Retoucher une zone</button>
              <button type="button" className="webtoon-mini" onClick={() => fileInput.current?.click()} disabled={busy} title="Remplace l'image par un fichier de ton ordinateur">Remplacer</button>
              <button type="button" className="webtoon-mini" onClick={copyPrompt} title="Copie la requête complète (prompt et références) dans le presse-papier">Copier la requête</button>
            </>
          ) : null}
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void replaceImage(f); e.target.value = ""; }} />
        </div>
        <p className="studio-hint">
          {view === "strip" ? "Clique une case pour la sélectionner. " : ""}
          Glisse les poignées sur l&apos;image : rond = bulle, losange = pointe de la bulle, carré = son, barre du bas = hauteur de la case.
        </p>

        {inpaintOpen && selected.image.src ? (
          <PanelInpaint
            slug={script.slug}
            panel={selected}
            library={library}
            notify={notify}
            onClose={() => setInpaintOpen(false)}
            onDone={async (dataUrl) => {
              await applyImage(selected, dataUrl, "inpaint");
              onAutosave?.();
            }}
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

        {inspectorTab === "scene" ? (
          <div className="studio-section">
            <label className="webtoon-field"><span>Description de la case</span><textarea rows={4} value={selected.description} placeholder="Ce que montre la case, en une ou deux phrases. C'est le cœur du prompt." onChange={(e) => patch({ description: e.target.value })} /></label>
            <label className="webtoon-field"><span>Action</span><textarea rows={2} value={selected.action} onChange={(e) => patch({ action: e.target.value })} /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="webtoon-field"><span>Émotion</span><input value={selected.emotion} onChange={(e) => patch({ emotion: e.target.value })} /></label>
              <label className="webtoon-field"><span>Rôle narratif</span>
                <select value={selected.narrative_role} onChange={(e) => patch({ narrative_role: e.target.value as NarrativeRole })}>{ROLES.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>
              </label>
            </div>
            <label className="webtoon-field"><span>Composition</span><textarea rows={2} value={selected.composition} placeholder="Où est le sujet dans le cadre, ce qui est au premier plan, où va l'œil." onChange={(e) => patch({ composition: e.target.value })} /></label>
            <div>
              <span className="webtoon-field-label">Personnages présents (leurs fiches sont jointes)</span>
              <div className="studio-chips">
                {CHARACTERS.map((c) => {
                  const on = selected.characters.includes(c.id);
                  return (
                    <button key={c.id} type="button" className={`studio-chip ${on ? "is-on" : ""}`} onClick={() => setCharacters(c.id, !on)} aria-pressed={on} title={on ? `${c.name} est dans la case` : `Ajouter ${c.name} à la case`}>
                      <Avatar image={c.image} name={c.name} crop={c.avatar} />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
              <input
                className="mt-1"
                placeholder="Autres, séparés par des virgules (sans fiche, décrits dans le texte)"
                value={selected.characters.filter((c) => !CHARACTERS.some((k) => k.id === c)).join(", ")}
                onChange={(e) => {
                  const known = selected.characters.filter((c) => CHARACTERS.some((k) => k.id === c));
                  const others = e.target.value.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
                  patch({ characters: [...known, ...others] });
                }}
              />
            </div>
            <div>
              <span className="webtoon-field-label">Lieu (sa fiche est jointe)</span>
              <div className="studio-chips">
                {LOCATIONS.map((l) => {
                  const on = selected.location === l.id;
                  return (
                    <button key={l.id} type="button" className={`studio-chip ${on ? "is-on" : ""}`} onClick={() => patch({ location: l.id })} aria-pressed={on} title={l.name}>
                      <Avatar image={l.image} name={l.name} mode="cover" />
                      <span>{l.name}</span>
                    </button>
                  );
                })}
              </div>
              <input className="mt-1" placeholder="Autre lieu : un identifiant en minuscules avec des tirets, décrit dans la case" value={LOCATIONS.some((l) => l.id === selected.location) ? "" : selected.location} onChange={(e) => patch({ location: e.target.value.trim().toLowerCase() })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="webtoon-field"><span>Type de plan</span>
                <select value={selected.shot_type} onChange={(e) => patch({ shot_type: e.target.value as ShotType })}>{SHOT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
              </label>
              <label className="webtoon-field"><span>Angle</span>
                <select value={selected.camera_angle} onChange={(e) => patch({ camera_angle: e.target.value as CameraAngle })}>{ANGLES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
              </label>
            </div>
            <div>
              <div className="studio-section-head">
                <span className="webtoon-field-label">Images du film jointes</span>
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
                      <span>{FILM_FRAMES.find((f) => f.src === src)?.label ?? src.split("/").pop()}</span>
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
                <textarea
                  rows={12}
                  value={needsComposition(selected) ? preview.generation_prompt : selected.generation_prompt}
                  onChange={(e) => patch({ generation_prompt: e.target.value, prompt_auto: false })}
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
              <button type="button" className="webtoon-mini" onClick={() => patch({ sfx: [...selected.sfx, { text: { en: "whoosh" }, anchor: { x: 60, y: 30 }, style: "soft", rotate: -10, size: 90 }] })}>+ Son</button>
            </div>
            {selected.sfx.map((effect, i) => (
              <div key={i} className="webtoon-subcard">
                {textInputs(effect.text, (text) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, text } : s)) }))}
                <div className="grid grid-cols-2 gap-2">
                  <select value={effect.style} onChange={(e) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, style: e.target.value as "soft" | "hard" | "rumble" } : s)) })}>
                    {(["soft", "hard", "rumble"] as const).map((v) => <option key={v} value={v}>{label(v)}</option>)}
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
                    <select value={frame.align ?? "center"} onChange={(e) => setFrame({ align: e.target.value as PanelFrame["align"] })} disabled={width >= 100}>
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
    </div>
  );
}
