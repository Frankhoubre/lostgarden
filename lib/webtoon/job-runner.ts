import "server-only";

import sharp from "sharp";
import { withNewImage } from "./image-history";
import { uploadToStorage } from "./storage-server";
import { coveredUntil } from "./continuity";
import { guideSlice } from "./film-guide";
import {
  idTokenFrom,
  loadDraft,
  loadGuideDoc,
  loadJob,
  loadLibraryOverlay,
  loadOpening,
  openToken,
  saveDraft,
  saveJob,
  saveLibraryOverlay,
  sealToken,
  stepSignature,
} from "./job-server";
import { libraryWith } from "./references";
import { applyRhythm } from "./rhythm";
import { JOB_SESSION_PREFIX, applyGenerated, previousInStrip, slimForContinue, type GenerateAnswer, type StudioJob } from "./studio-job";
import { applyTranslations, itemsToTranslate } from "./translate";
import type { LibraryOverlay, ReferenceAsset, WebtoonPanel } from "./types";

/**
 * The steps of a background job (lib/webtoon/studio-job.ts), run by
 * `app/api/webtoon/[slug]/job/route.ts`: one bounded piece of work per step
 * (a batch of panels written, three images, a sheet, the translation), then
 * the next step is started as its own invocation.
 */

/** Silent this long, a running job has lost its chain: a tab that opens resumes it. */
export const STALE_MS = 6 * 60_000;
const IMAGES_PER_STEP = 3;

export function log(job: StudioJob, line: string) {
  const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  job.log.push(`${time} ${line}`);
}

/** Starts the next step: its own invocation, signed, which answers at once. Retried, a lost call would stop the job. */
export async function chain(origin: string, slug: string, jobId: string, sealed: string): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(`${origin}/api/webtoon/${encodeURIComponent(slug)}/job`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-job-signature": stepSignature(slug, jobId) },
        body: JSON.stringify({ action: "step", job_id: jobId, sealed }),
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return;
    } catch {
      // Retried below.
    }
    await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
  }
  console.error("[webtoon job] the next step could not be started", slug, jobId);
}

async function callRoute<T>(origin: string, slug: string, route: string, idToken: string, body: unknown): Promise<{ ok: boolean; status: number; payload: T }> {
  const response = await fetch(`${origin}/api/webtoon/${encodeURIComponent(slug)}/${route}`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as T;
  return { ok: response.ok, status: response.status, payload };
}

/** Where the job's panels go: after the last one it wrote, else after the chosen panel, else at the end. */
function insertionIndex(panels: WebtoonPanel[], job: StudioJob): number {
  for (let i = job.created.length - 1; i >= 0; i -= 1) {
    const at = panels.findIndex((p) => p.panel_id === job.created[i]);
    if (at >= 0) return at;
  }
  if (job.params.insert_after) {
    const at = panels.findIndex((p) => p.panel_id === job.params.insert_after);
    if (at >= 0) return at;
  }
  return panels.length - 1;
}

function upsert(library: LibraryOverlay, asset: ReferenceAsset): LibraryOverlay {
  const custom = { ...asset, custom: true };
  const exists = library.assets.some((a) => a.id === asset.id);
  return { ...library, hidden: library.hidden.filter((id) => id !== asset.id), assets: exists ? library.assets.map((a) => (a.id === asset.id ? custom : a)) : [...library.assets, custom] };
}

/** The OpenAI edit sizes: the one closest to the image's shape. */
function editSize(width: number, height: number): { sw: number; sh: number } {
  const ratio = width / height;
  if (ratio < 0.8) return { sw: 1024, sh: 1536 };
  if (ratio > 1.25) return { sw: 1536, sh: 1024 };
  return { sw: 1024, sh: 1024 };
}

/**
 * An edit of a whole panel on the server, as the studio's retouch does in the browser: the image letterboxed
 * to the model's size, sent to the inpaint route, the letterbox cropped away and the result stored at the
 * original size. `finish`: the HD finish of an approved sketch.
 */
async function editWhole(origin: string, slug: string, idToken: string, panel: WebtoonPanel, library: LibraryOverlay, prompt: string, finish: boolean): Promise<{ src: string; width: number; height: number; cost?: number }> {
  const response = await fetch(panel.image.src);
  if (!response.ok) throw new Error(`image ${response.status}`);
  const original = Buffer.from(await response.arrayBuffer());
  const meta = await sharp(original).metadata();
  const w = meta.width ?? 1024;
  const h = meta.height ?? 1536;
  const { sw, sh } = editSize(w, h);
  const scale = Math.min(sw / w, sh / h);
  const dw = Math.round(w * scale);
  const dh = Math.round(h * scale);
  const ox = Math.round((sw - dw) / 2);
  const oy = Math.round((sh - dh) / 2);
  const inner = await sharp(original).resize(dw, dh).toBuffer();
  const boxed = await sharp({ create: { width: sw, height: sh, channels: 3, background: "#000" } }).composite([{ input: inner, left: ox, top: oy }]).jpeg({ quality: 92 }).toBuffer();
  const answer = await callRoute<{ data_url?: string; cost_usd?: number; error?: string }>(origin, slug, "inpaint", idToken, {
    panel,
    image: `data:image/jpeg;base64,${boxed.toString("base64")}`,
    prompt,
    size: `${sw}x${sh}`,
    library,
    quality: "high",
    finish,
  });
  if (!answer.ok || !answer.payload.data_url) throw new Error(answer.payload.error ?? `erreur ${answer.status}`);
  const edited = Buffer.from(answer.payload.data_url.slice(answer.payload.data_url.indexOf(",") + 1), "base64");
  // Two pipelines: sharp keeps a single resize per pipeline, so the crop of the letterbox goes first on its own.
  const atSize = await sharp(edited).resize(sw, sh, { fit: "fill" }).toBuffer();
  const out = await sharp(atSize).extract({ left: ox, top: oy, width: dw, height: dh }).resize(w, h, { fit: "fill" }).png().toBuffer();
  const src = await uploadToStorage({ idToken, path: `webtoon/${slug}/${panel.panel_id}/${Date.now()}.png`, bytes: out, contentType: "image/png" });
  return { src, width: w, height: h, cost: answer.payload.cost_usd };
}

/** One step of the job, by phase. Returns once the job is saved. */
export async function runStep(origin: string, slug: string, jobId: string, sealedIn: string): Promise<void> {
  let refresh: string;
  try {
    refresh = openToken(sealedIn);
  } catch {
    console.error("[webtoon job] sealed token unreadable", slug);
    return;
  }
  const auth = await idTokenFrom(refresh);
  const idToken = auth.idToken;
  const sealed = auth.refreshToken === refresh ? sealedIn : sealToken(auth.refreshToken);
  const stored = await loadJob(slug, idToken);
  if (!stored || stored.job.id !== jobId || stored.job.status !== "running") return;
  const job = stored.job;
  // Another step of this job is working (a resume raced the chain): leave it alone.
  if (job.lease_until && Date.parse(job.lease_until) > Date.now()) return;
  job.lease_until = new Date(Date.now() + 12 * 60_000).toISOString();
  job.heartbeat_at = new Date().toISOString();
  await saveJob(job, sealed, idToken);
  const session = `${JOB_SESSION_PREFIX}${job.id}`;

  try {
    const [libraryDoc, opening] = await Promise.all([loadLibraryOverlay(slug, idToken).catch(() => null), loadOpening(slug, idToken)]);
    const library: LibraryOverlay = libraryDoc ?? { assets: [], hidden: [] };

    if (job.phase === "write") {
      const { until, count } = job.params;
      const cap = until === null ? count : Math.max(count * 2, count + 12);
      // Written to its end for a bounded span (a rewrite, a hole), to its count otherwise.
      const finished = (list: WebtoonPanel[]) => (until === null ? job.created.length >= count : coveredUntil(list.slice(0, insertionIndex(list, job) + 1)) >= until - 1 || job.created.length >= cap);
      const { panels } = await loadDraft(slug, idToken);
      if (!finished(panels)) {
        const head = panels.slice(0, insertionIndex(panels, job) + 1);
        const covered = coveredUntil(head);
        const guide = await loadGuideDoc(slug, idToken);
        const answer = await callRoute<{ panels?: WebtoonPanel[]; new_assets?: { asset: ReferenceAsset; frames: string[] }[]; error?: string }>(origin, slug, "continue", idToken, {
          count: until === null ? count - job.created.length : Math.max(8, count - job.created.length),
          panels: slimForContinue(head),
          library,
          pace: job.params.pace,
          until_seconds: until,
          guide: guideSlice(guide, Math.max(0, covered - 2), covered + 180),
          ...(opening?.text && head.length < 30 ? { handoff: opening.text } : {}),
        });
        const written = answer.payload.panels ?? [];
        if (!answer.ok || !written.length) {
          const reason = answer.payload.error ?? `réponse ${answer.status}`;
          const end = /Fin de l'épisode/.test(reason);
          job.write_failures += 1;
          log(job, end ? "Fin de l'épisode atteinte" : `Lot non écrit (${reason})`);
          if (end || job.write_failures > 2) {
            if (!job.created.length && !end) {
              job.status = "failed";
              job.phase = "done";
            } else {
              job.phase = job.pending_assets.length ? "sheets" : "images";
            }
          }
        } else {
          job.write_failures = 0;
          // The draft again: the tab may have saved while the writer worked.
          const fresh = await loadDraft(slug, idToken);
          const at = insertionIndex(fresh.panels, job);
          const added = written.filter((p) => !fresh.panels.some((q) => q.panel_id === p.panel_id));
          const merged = [...fresh.panels.slice(0, at + 1), ...added, ...fresh.panels.slice(at + 1)];
          const rhythmic = applyRhythm(merged, guide, new Set(added.map((p) => p.panel_id))).panels;
          await saveDraft(slug, rhythmic, fresh.chunks, session, job.by, idToken);
          job.created.push(...added.map((p) => p.panel_id));
          job.todo.push(...added.filter((p) => p.description.trim() || p.generation_prompt.trim()).map((p) => p.panel_id));
          for (const found of answer.payload.new_assets ?? []) if (!job.pending_assets.some((a) => a.asset.id === found.asset.id)) job.pending_assets.push(found);
          log(job, `${added.length} cases écrites (${job.created.length} en tout)`);
          if (finished(rhythmic)) job.phase = job.pending_assets.length ? "sheets" : "images";
        }
      } else {
        job.phase = job.pending_assets.length ? "sheets" : "images";
      }
    } else if (job.phase === "sheets") {
      const found = job.pending_assets.shift();
      if (found) {
        const known = libraryWith(library).find((a) => a.id === found.asset.id);
        if (!known?.image) {
          const target = known ?? found.asset;
          const next = upsert(library, target);
          const answer = await callRoute<{ src?: string; error?: string }>(origin, slug, "asset", idToken, { asset: target, library: next, frames: found.frames });
          if (answer.ok && answer.payload.src) {
            await saveLibraryOverlay(slug, upsert(next, { ...target, image: answer.payload.src }), job.by, idToken);
            log(job, `Fiche de ${target.name.split(",")[0]} dessinée`);
          } else {
            log(job, `Fiche de ${target.name.split(",")[0]} non dessinée (${answer.payload.error ?? answer.status})`);
          }
        }
      }
      if (!job.pending_assets.length) job.phase = "images";
    } else if (job.phase === "images" && (job.kind === "finalize" || job.kind === "retouch")) {
      // Edits of existing images: the HD finish of approved sketches, or the fixes the check asked for.
      const batch = job.todo.splice(0, IMAGES_PER_STEP);
      if (batch.length) {
        const { panels } = await loadDraft(slug, idToken);
        const results = await Promise.all(
          batch.map(async (id) => {
            const panel = panels.find((p) => p.panel_id === id);
            if (!panel?.image.src) return { id, error: null };
            const finish = job.kind === "finalize";
            const prompt = finish ? "" : job.prompts?.[id] ?? "";
            if (!finish && !prompt) return { id, error: null };
            try {
              return { id, of: panel.image.src, edit: await editWhole(origin, slug, idToken, panel, library, prompt, finish), note: finish ? "Finition HD de l'esquisse validée" : prompt };
            } catch (error) {
              return { id, error: error instanceof Error ? error.message : "erreur" };
            }
          }),
        );
        const fresh = await loadDraft(slug, idToken);
        let next = fresh.panels;
        for (const result of results) {
          if (!("edit" in result) || !result.edit) {
            if (result.error) job.failed.push({ panel_id: result.id, reason: result.error });
            continue;
          }
          const { edit, of, note } = result;
          next = next.map((p) => {
            // Redrawn meanwhile in the studio: that image wins, the edit goes to its history only through a new run.
            if (p.panel_id !== result.id || p.image.src !== of) return p;
            const updated = withNewImage(p, { src: edit.src, width: edit.width, height: edit.height, model: "inpaint", generated_at: new Date().toISOString(), status: "generated", origin: "inpaint", note, quality: "high", ...(edit.cost ? { cost_usd: edit.cost } : {}) });
            // The HD finish is the approved image drawn clean: the approval follows it.
            return job.kind === "finalize" && p.review?.of === of ? { ...updated, review: { ...p.review, of: edit.src } } : updated;
          });
          job.made.push(result.id);
          job.cost_usd += edit.cost ?? 0;
        }
        await saveDraft(slug, next, fresh.chunks, session, job.by, idToken);
        log(job, `${job.kind === "finalize" ? "Finitions HD" : "Corrections"} : ${job.made.length} faites${job.failed.length ? `, ${job.failed.length} en échec` : ""}, ${job.todo.length} restantes`);
      }
      if (!job.todo.length) job.phase = "done";
    } else if (job.phase === "images") {
      const batch = job.todo.splice(0, IMAGES_PER_STEP);
      if (batch.length) {
        const { panels } = await loadDraft(slug, idToken);
        const results = await Promise.all(
          batch.map(async (id) => {
            const panel = panels.find((p) => p.panel_id === id);
            if (!panel) return { id, skipped: true as const };
            const answer = await callRoute<GenerateAnswer>(origin, slug, "generate", idToken, { panel_id: id, panel, library, quality: job.params.quality, previous: previousInStrip(panels, id, opening) }).catch((error: unknown) => ({ ok: false, status: 0, payload: { error: error instanceof Error ? error.message : "erreur" } as GenerateAnswer }));
            return { id, answer };
          }),
        );
        const fresh = await loadDraft(slug, idToken);
        let next = fresh.panels;
        for (const result of results) {
          if ("skipped" in result) continue;
          const { answer } = result;
          const src = answer.payload.src;
          if (!answer.ok || !src) {
            // One more try at the end of the queue (a gateway hiccup), then it is left for "Générer les cases manquantes".
            if (!job.retried?.includes(result.id)) {
              job.retried = [...(job.retried ?? []), result.id];
              job.todo.push(result.id);
            } else {
              job.failed.push({ panel_id: result.id, reason: answer.payload.error ?? `erreur ${answer.status}` });
            }
            continue;
          }
          next = next.map((p) => (p.panel_id === result.id ? applyGenerated(p, answer.payload, src, { width: answer.payload.width ?? 1024, height: answer.payload.height ?? 1536 }, job.params.quality) : p));
          job.made.push(result.id);
          job.cost_usd += answer.payload.cost_usd ?? 0;
        }
        await saveDraft(slug, next, fresh.chunks, session, job.by, idToken);
        log(job, `Images : ${job.made.length} faites${job.failed.length ? `, ${job.failed.length} en échec` : ""}, ${job.todo.length} restantes`);
      }
      if (!job.todo.length) job.phase = job.kind === "continue" ? "translate" : "done";
    } else if (job.phase === "translate") {
      const { panels } = await loadDraft(slug, idToken);
      const targets = panels.filter((p) => job.created.includes(p.panel_id));
      const items = targets.flatMap((panel) => itemsToTranslate(panel, false).map((item) => ({ ...item, key: `${panel.panel_id}|${item.key}` })));
      if (items.length) {
        const answer = await callRoute<{ translations?: Record<string, Record<string, string>>; error?: string }>(origin, slug, "translate", idToken, { items, scene: `${targets.length} panels written in the background.` });
        if (answer.ok && answer.payload.translations) {
          const byPanel = new Map<string, Record<string, Record<string, string>>>();
          for (const [key, value] of Object.entries(answer.payload.translations)) {
            const [panelId, itemKey] = key.split("|");
            if (!panelId || !itemKey) continue;
            byPanel.set(panelId, { ...(byPanel.get(panelId) ?? {}), [itemKey]: value });
          }
          const fresh = await loadDraft(slug, idToken);
          await saveDraft(slug, fresh.panels.map((p) => (byPanel.has(p.panel_id) ? applyTranslations(p, byPanel.get(p.panel_id)!, false) : p)), fresh.chunks, session, job.by, idToken);
          log(job, `${items.length} textes traduits`);
        } else {
          log(job, `Traduction impossible (${answer.payload.error ?? answer.status}) : « Traduire toute la bande » la refera`);
        }
      }
      job.phase = "done";
    }
    if (job.phase === "done" && job.status === "running") {
      job.status = "done";
      log(job, job.kind === "continue" ? `Terminé : ${job.created.length} cases, ${job.made.length} images` : job.kind === "finalize" ? `Terminé : ${job.made.length} cases finies en HD` : job.kind === "retouch" ? `Terminé : ${job.made.length} cases corrigées` : `Terminé : ${job.made.length} images`);
    }
  } catch (error) {
    log(job, `Étape interrompue (${error instanceof Error ? error.message : "erreur"}), reprise à l'étape suivante`);
    job.step_errors = (job.step_errors ?? 0) + 1;
    if (job.step_errors > 5) {
      job.status = "failed";
      log(job, "Trop d'erreurs de suite : travail arrêté");
    }
  }

  // Cancelled from the studio while this step worked: the cancel wins.
  const latest = await loadJob(slug, idToken).catch(() => null);
  if (latest?.job.id === job.id && latest.job.status === "cancelled") {
    job.status = "cancelled";
    job.phase = "done";
  }
  job.lease_until = undefined;
  job.heartbeat_at = new Date().toISOString();
  await saveJob(job, sealed, idToken);
  if (job.status === "running") await chain(origin, slug, job.id, sealed);
}

