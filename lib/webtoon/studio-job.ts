import { needsComposition } from "./compose";
import { stateOf } from "./panel-state";
import { withNewImage } from "./image-history";
import type { PanelImage, ReferenceAsset, WebtoonPanel } from "./types";

/**
 * A JOB THAT RUNS WITHOUT THE TAB. "Générer les 60 cases suivantes" used to
 * need the studio open for the whole hour: the browser drove every call.
 * A background job does the same work on the server, one step at a time
 * (a batch of panels written, three images drawn, the lettering translated),
 * each step saving the draft and starting the next, so the author can launch
 * a long run in the evening and find it done. Stored in `webtoon_jobs/<slug>`,
 * one job per project at a time. See `app/api/webtoon/[slug]/job/route.ts`.
 *
 * Pure helpers shared by the route and the studio.
 */

export const JOBS_COLLECTION = "webtoon_jobs";

/** The session id a job saves the draft with: a tab that sees it merges instead of stopping its saves. */
export const JOB_SESSION_PREFIX = "job:";

export type JobKind = "continue" | "images";
export type JobPhase = "write" | "sheets" | "images" | "translate" | "done";
export type JobStatus = "running" | "done" | "failed" | "cancelled";

export type StudioJob = {
  id: string;
  slug: string;
  kind: JobKind;
  status: JobStatus;
  phase: JobPhase;
  label: string;
  created_at: string;
  updated_at: string;
  /** When a step last reported: a running job silent for minutes has lost its chain and is resumed. */
  heartbeat_at: string;
  by: string;
  params: {
    /** Panels to write (continue), or the target of a bounded span. */
    count: number;
    /** A bounded span of the film to cover to its end, or null for a plain count. */
    until: number | null;
    pace: "auto" | "calm" | "normal" | "action";
    /** Written after this panel, or at the end of the strip. */
    insert_after: string | null;
    quality: "high" | "medium";
  };
  /** Panels written by this job, in order. */
  created: string[];
  /** Panels whose image this job still has to draw. */
  todo: string[];
  made: string[];
  failed: { panel_id: string; reason: string }[];
  /** Things the writer found without a sheet: drawn before the images. */
  pending_assets: { asset: ReferenceAsset; frames: string[] }[];
  write_failures: number;
  /** The last lines of what happened, newest last, in French. */
  log: string[];
  cost_usd: number;
  /** Held by the step at work, so a resume never runs a second step beside it. */
  lease_until?: string;
  /** Panels whose image failed once and went back to the queue. */
  retried?: string[];
  /** Steps in a row that stopped on an error: past five, the job stops. */
  step_errors?: number;
};

/** What the progress bar says. */
export function jobProgress(job: StudioJob): { done: number; total: number; text: string } {
  if (job.phase === "write") {
    const total = Math.max(job.params.count, job.created.length);
    return { done: job.created.length, total, text: `Écriture : ${job.created.length}/${total} cases` };
  }
  if (job.phase === "sheets") return { done: 0, total: job.pending_assets.length, text: `Fiches à dessiner : ${job.pending_assets.length}` };
  const total = job.made.length + job.failed.length + job.todo.length;
  if (job.phase === "images") return { done: job.made.length + job.failed.length, total, text: `Images : ${job.made.length + job.failed.length}/${total}` };
  if (job.phase === "translate") return { done: total, total, text: "Traduction des textes" };
  return { done: total, total, text: job.status === "done" ? "Terminé" : job.status === "cancelled" ? "Arrêté" : "Échec" };
}

/**
 * What the continue route needs from the strip: every panel's id, order and
 * timecodes (to number the new panels and know where the film stops), and
 * the last panels in full (continuity, helmet, lines already lettered).
 * Sending the whole strip with every prompt made each call several MB at
 * 340 panels.
 */
export function slimForContinue(panels: readonly WebtoonPanel[]): WebtoonPanel[] {
  const full = 16;
  return panels.map((p, i) =>
    i >= panels.length - full
      ? p
      : ({ panel_id: p.panel_id, order: p.order, source_time_start: p.source_time_start, source_time_end: p.source_time_end, prompt_auto: p.prompt_auto, description: "", purpose: "", characters: [], objects: [], dialogue: [], caption: [], sfx: [], image: { status: p.image.status } } as unknown as WebtoonPanel),
  );
}

/** Where the episode before left the characters, as the first panels of an episode use it. */
export type OpeningState = { text: string; image?: string; from_title: string };

/** The first panels of an episode take the opening state while none of their own says the state. */
export const OPENING_PANELS = 12;

/**
 * The panel before in the strip, for the continuity of a generation: the
 * nearest earlier panel with an image, and the nearest earlier state line
 * (a helmet off stays off until a panel says otherwise). At the opening of
 * an episode after the first, the end of the episode before stands in.
 */
export function previousInStrip(list: readonly WebtoonPanel[], id: string, opening?: OpeningState | null): { image?: string; state?: string; description?: string } | undefined {
  const at = list.findIndex((p) => p.panel_id === id);
  const before = at > 0 ? list.slice(Math.max(0, at - 8), at).reverse() : [];
  const withImage = before.find((p) => p.image.src && p.image.status !== "missing");
  const withState = before.find((p) => stateOf(p.description));
  if (opening?.text && at >= 0 && at < OPENING_PANELS && !withState) {
    return { image: withImage?.image.src ?? (at === 0 ? opening.image : undefined), state: opening.text, description: withImage?.description ?? `the last panel of ${opening.from_title}` };
  }
  if (!withImage && !withState) return undefined;
  return { image: withImage?.image.src, state: withState ? stateOf(withState.description) : undefined, description: withImage?.description };
}

/** What the generate route answers. */
export type GenerateAnswer = {
  src?: string;
  data_url?: string;
  width?: number;
  height?: number;
  cost_usd?: number;
  model?: string;
  error?: string;
  generation_prompt?: string;
  negative_constraints?: string[];
  visual_references?: string[];
  dialogue?: WebtoonPanel["dialogue"];
  sfx?: WebtoonPanel["sfx"];
  panel_height?: number;
  check?: { remaining: string[] };
};

/** The panel with the image a generation made, and what the generation composed or placed with it. */
export function applyGenerated(panel: WebtoonPanel, answer: GenerateAnswer, src: string, size: { width: number; height: number }): WebtoonPanel {
  const composed: Partial<WebtoonPanel> = {
    ...(needsComposition(panel) && answer.generation_prompt
      ? { generation_prompt: answer.generation_prompt, negative_constraints: answer.negative_constraints ?? panel.negative_constraints, visual_references: answer.visual_references ?? panel.visual_references, prompt_auto: true }
      : {}),
    ...(answer.dialogue ? { dialogue: answer.dialogue } : {}),
    ...(answer.sfx ? { sfx: answer.sfx } : {}),
    ...(answer.panel_height && answer.panel_height > panel.panel_height ? { panel_height: answer.panel_height } : {}),
  };
  const image: PanelImage = { src, width: size.width, height: size.height, model: answer.model, generated_at: new Date().toISOString(), status: "generated", origin: "generate", ...(answer.cost_usd ? { cost_usd: answer.cost_usd } : {}) };
  return withNewImage({ ...panel, ...composed }, image);
}

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * Three-way merge of a strip: what this tab had last saved or loaded (`base`),
 * what it has now (`local`), and what is stored now (`remote`, written by a
 * background job meanwhile). The order is the remote one, with the panels
 * this tab added put after the panel they followed; the panels this tab
 * deleted stay deleted. Inside a panel, a field the tab changed keeps the
 * tab's value and a field it did not change takes the stored one, so a
 * caption typed here and an image drawn by the job both survive.
 */
export function mergeStrips(base: readonly WebtoonPanel[], local: readonly WebtoonPanel[], remote: readonly WebtoonPanel[]): WebtoonPanel[] {
  const baseById = new Map(base.map((p) => [p.panel_id, p]));
  const localById = new Map(local.map((p) => [p.panel_id, p]));
  const remoteIds = new Set(remote.map((p) => p.panel_id));
  const merged: WebtoonPanel[] = [];
  for (const theirs of remote) {
    const was = baseById.get(theirs.panel_id);
    const mine = localById.get(theirs.panel_id);
    // Deleted here since the last save: gone, unless the job made it after that save.
    if (!mine) {
      if (!was) merged.push(theirs);
      continue;
    }
    if (!was || mine === was) {
      merged.push(was ? theirs : mine);
      continue;
    }
    const out: Record<string, unknown> = { ...theirs };
    for (const key of new Set([...Object.keys(mine), ...Object.keys(was)])) {
      const k = key as keyof WebtoonPanel;
      if (!same(mine[k], was[k])) out[key] = mine[k];
    }
    merged.push(out as WebtoonPanel);
  }
  // Panels added here: after the panel they follow in this tab.
  local.forEach((panel, index) => {
    if (remoteIds.has(panel.panel_id) || baseById.has(panel.panel_id)) return;
    const after = index > 0 ? local[index - 1].panel_id : null;
    const at = after ? merged.findIndex((p) => p.panel_id === after) : -1;
    merged.splice(at + 1, 0, panel);
  });
  return merged.map((p, i) => (p.order === i + 1 ? p : { ...p, order: i + 1 }));
}
