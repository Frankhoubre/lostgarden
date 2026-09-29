import { after } from "next/server";
import { STALE_MS, chain, log, runStep } from "@/lib/webtoon/job-runner";
import { loadJob, saveJob, sealToken, validStep } from "@/lib/webtoon/job-server";
import { verifyStudioRequest } from "@/lib/webtoon/studio-server";
import type { StudioJob } from "@/lib/webtoon/studio-job";

/**
 * POST /api/webtoon/<slug>/job
 *
 * Background jobs (lib/webtoon/studio-job.ts). From the studio:
 * - `start` { kind, params, panel_ids?, refresh_token }: creates the job and runs its first step;
 * - `cancel`: stops it after the step in progress;
 * - `kick`: resumes a job whose chain broke (no step for several minutes).
 * Between steps, the server calls itself with `step` { job_id, sealed },
 * signed; the step answers at once and works after the response.
 *
 * One step is one bounded piece of work (a batch of panels written, three
 * images, a sheet, the translation), well under the function's limit, then
 * the next step is started: the job never depends on one long invocation.
 */

export const maxDuration = 800;

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const origin = new URL(request.url).origin;
  const body = (await request.json().catch(() => ({}))) as {
    action?: "start" | "step" | "cancel" | "kick";
    job_id?: string;
    sealed?: string;
    kind?: StudioJob["kind"];
    params?: Partial<StudioJob["params"]>;
    panel_ids?: string[];
    prompts?: Record<string, string>;
    refresh_token?: string;
    label?: string;
  };

  if (body.action === "step") {
    if (!body.job_id || !body.sealed || !validStep(slug, body.job_id, request.headers.get("x-job-signature"))) return Response.json({ error: "step refused" }, { status: 403 });
    const { job_id, sealed } = body;
    after(() => runStep(origin, slug, job_id, sealed).catch((error: unknown) => console.error("[webtoon job] step failed", error)));
    return Response.json({ ok: true }, { status: 202 });
  }

  const identity = await verifyStudioRequest(request);
  if (!identity) return Response.json({ error: "studio access required" }, { status: 401 });
  if (!identity.idToken) return Response.json({ error: "Connectez-vous au studio : un travail en arrière-plan agit au nom du compte." }, { status: 400 });
  const current = await loadJob(slug, identity.idToken).catch(() => null);

  if (body.action === "cancel") {
    if (!current || current.job.status !== "running") return Response.json({ ok: true });
    current.job.status = "cancelled";
    current.job.phase = "done";
    log(current.job, "Arrêté depuis le studio");
    await saveJob(current.job, current.sealed, identity.idToken);
    return Response.json({ ok: true, job: current.job });
  }

  if (body.action === "kick") {
    if (!current || current.job.status !== "running") return Response.json({ ok: true, resumed: false });
    const silent = Date.now() - Date.parse(current.job.heartbeat_at);
    // A step still holding its lease is working, however long: only a lost chain is resumed.
    const leased = current.job.lease_until && Date.parse(current.job.lease_until) > Date.now();
    if (silent < STALE_MS || leased) return Response.json({ ok: true, resumed: false });
    current.job.lease_until = undefined;
    log(current.job, "Reprise après une interruption");
    await saveJob(current.job, current.sealed, identity.idToken);
    after(() => chain(origin, slug, current.job.id, current.sealed));
    return Response.json({ ok: true, resumed: true });
  }

  if (body.action === "start") {
    if (current?.job.status === "running" && Date.now() - Date.parse(current.job.heartbeat_at) < STALE_MS) {
      return Response.json({ error: "Un travail tourne déjà en arrière-plan sur ce webtoon : attendez sa fin ou arrêtez-le." }, { status: 409 });
    }
    if (!body.refresh_token || !["continue", "images", "finalize", "retouch"].includes(String(body.kind))) return Response.json({ error: "demande incomplète" }, { status: 400 });
    const now = new Date().toISOString();
    const p = body.params ?? {};
    const todo = body.kind === "continue" ? [] : [...new Set(body.panel_ids ?? [])];
    if (body.kind !== "continue" && !todo.length) return Response.json({ error: "aucune case à générer" }, { status: 400 });
    const job: StudioJob = {
      id: `j${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      slug,
      status: "running",
      kind: body.kind as StudioJob["kind"],
      phase: body.kind === "continue" ? "write" : "images",
      label: body.label ?? (body.kind === "images" ? `${todo.length} images` : "La suite"),
      created_at: now,
      updated_at: now,
      heartbeat_at: now,
      by: identity.email,
      params: {
        count: Math.max(1, Math.min(200, Math.round(Number(p.count) || 1))),
        until: typeof p.until === "number" && Number.isFinite(p.until) ? p.until : null,
        pace: p.pace === "calm" || p.pace === "normal" || p.pace === "action" ? p.pace : "auto",
        insert_after: typeof p.insert_after === "string" ? p.insert_after : null,
        quality: p.quality === "medium" || p.quality === "low" ? p.quality : "high",
      },
      created: [],
      todo,
      made: [],
      failed: [],
      pending_assets: [],
      write_failures: 0,
      log: [],
      cost_usd: 0,
      ...(body.kind === "retouch" && body.prompts ? { prompts: Object.fromEntries(Object.entries(body.prompts).filter(([id]) => todo.includes(id)).map(([id, text]) => [id, String(text).slice(0, 1500)])) } : {}),
    };
    log(job, "Lancé depuis le studio");
    let sealed: string;
    try {
      sealed = sealToken(body.refresh_token);
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "secret du serveur absent" }, { status: 503 });
    }
    await saveJob(job, sealed, identity.idToken);
    after(() => chain(origin, slug, job.id, sealed));
    return Response.json({ ok: true, job });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
