"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { ProgressBar } from "@/components/studio/ProgressBar";
import { getFirebaseAuth } from "@/lib/firebase";
import { MOTION_DEFAULT_SECONDS, MOTION_SECONDS, defaultMotionPrompt, freshMotion, motionEstimate } from "@/lib/webtoon/motion";
import { studioHeaders } from "@/lib/webtoon/studio-headers";
import { readFileAsDataUrl, uploadPanelMotion } from "@/lib/webtoon/studio";
import type { PanelMotion as Motion, WebtoonPanel } from "@/lib/webtoon/types";

type PanelMotionProps = {
  slug: string;
  panel: WebtoonPanel;
  notify: (message: string) => void;
  /** Applies changes to a panel by id: the loop may arrive after another panel was selected. */
  onPatch: (panelId: string, changes: Partial<WebtoonPanel>) => void;
};

/** How long a loop usually takes to come back, for the progress bar. */
const ESTIMATE_MS = 90_000;
const POLL_MS = 5_000;
const GIVE_UP_MS = 12 * 60_000;
const MAX_IMPORT_BYTES = 30 * 1024 * 1024;

const usd = (value: number) => `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

/**
 * Generations running, by panel. Kept outside the component so a loop goes
 * on (and lands on its panel) when the author selects another panel or
 * switches tab in the inspector.
 */
type Running = { startedAt: number; seconds: number };
let running = new Map<string, Running>();
const listeners = new Set<() => void>();
function setRunning(key: string, value: Running | null) {
  running = new Map(running);
  if (value) running.set(key, value);
  else running.delete(key);
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function call(slug: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/webtoon/${slug}/animate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as { status?: string; operation?: unknown; motion?: Motion; error?: string };
  if (!response.ok) throw new Error(payload.error ?? `erreur ${response.status}`);
  return payload;
}

/** Starts the loop of a panel, then asks every few seconds until the video is stored. */
async function animate(slug: string, panel: WebtoonPanel, prompt: string, seconds: number): Promise<Motion> {
  const request = { panel_id: panel.panel_id, image: panel.image.src, prompt, seconds };
  const { operation } = await call(slug, { action: "start", ...request });
  const until = Date.now() + GIVE_UP_MS;
  while (Date.now() < until) {
    await new Promise((resolve) => window.setTimeout(resolve, POLL_MS));
    let answer: Awaited<ReturnType<typeof call>>;
    try {
      answer = await call(slug, { action: "status", operation, ...request });
    } catch (error) {
      // A network hiccup or a call cut short while the model works: ask again. A failure the gateway reports ends it.
      if (error instanceof TypeError || (error instanceof Error && /^erreur 5\d\d$/.test(error.message))) continue;
      throw error;
    }
    if (answer.status === "completed" && answer.motion) return answer.motion;
  }
  throw new Error("pas de vidéo au bout de 12 minutes");
}

function videoDuration(src: string): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => resolve(Number.isFinite(video.duration) ? Math.round(video.duration * 10) / 10 : 0);
    video.onerror = () => resolve(0);
    video.src = src;
  });
}

/**
 * "Case animée" in the inspector: a short muted loop made from the panel's
 * image (Seedance 1.5 Pro through the gateway, first and last frame on the
 * image so it loops), or a video of one's own. The public reader plays it
 * while the panel is on screen and shows the still otherwise.
 */
export function PanelMotion({ slug, panel, notify, onPatch }: PanelMotionProps) {
  const key = `${slug}/${panel.panel_id}`;
  const job = useSyncExternalStore(subscribe, () => running.get(key) ?? null, () => null);
  const [form, setForm] = useState<{ prompt: string; seconds: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const motion = panel.motion ?? null;
  const fresh = freshMotion(panel);
  const hasImage = Boolean(panel.image.src) && panel.image.status !== "missing";
  const number = panel.order;

  const launch = async () => {
    if (!form) return;
    const { prompt, seconds } = form;
    setForm(null);
    setRunning(key, { startedAt: Date.now(), seconds });
    try {
      const made = await animate(slug, panel, prompt.trim(), seconds);
      onPatch(panel.panel_id, { motion: made });
      notify(`Case ${number} animée (${made.seconds} s, ${usd(made.cost_usd ?? motionEstimate(made.seconds))}).`);
    } catch (error) {
      notify(`Animation de la case ${number} impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setRunning(key, null);
    }
  };

  const importVideo = async (file: File) => {
    if (!/^video\/(mp4|webm)$/.test(file.type)) return notify("Une vidéo MP4 ou WebM, s'il vous plaît.");
    if (file.size > MAX_IMPORT_BYTES) return notify("Vidéo trop lourde : 30 Mo au plus (quelques secondes suffisent).");
    setImporting(true);
    try {
      const src = getFirebaseAuth().currentUser ? await uploadPanelMotion(slug, panel.panel_id, file) : await readFileAsDataUrl(file);
      const seconds = await videoDuration(src);
      onPatch(panel.panel_id, { motion: { src, of: panel.image.src, prompt: "", seconds, model: "import", created_at: new Date().toISOString() } });
      notify(file.size > 8 * 1024 * 1024 ? `Vidéo importée sur la case ${number}. Elle pèse ${Math.round(file.size / 1e6)} Mo : lourde pour un téléphone.` : `Vidéo importée sur la case ${number}.`);
    } catch (error) {
      notify(`Import impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setImporting(false);
    }
  };

  const remove = () => {
    onPatch(panel.panel_id, { motion: undefined });
    notify(`Animation retirée de la case ${number}.`);
  };

  return (
    <div className="studio-motion">
      <h3 className="studio-group-title">Case animée <small>une boucle muette de quelques secondes, jouée dans le lecteur quand la case est à l&apos;écran</small></h3>

      {job ? (
        <div className="studio-motion-running" role="status">
          <ProgressBar key={job.startedAt} startedAt={job.startedAt} estimateMs={ESTIMATE_MS} label={`Animation de ${job.seconds} s en cours`} />
          <p className="text-xs text-ivory/50">Vous pouvez continuer ailleurs dans le studio : la boucle se pose sur la case à son arrivée. Gardez l&apos;onglet ouvert.</p>
        </div>
      ) : null}

      {fresh ? (
        <div className="studio-motion-preview">
          <video src={fresh.src} poster={panel.image.src} muted loop autoPlay playsInline />
          <p className="text-xs text-ivory/60">
            {fresh.seconds ? `${fresh.seconds} s` : "Durée inconnue"}
            {fresh.model === "import" ? " · vidéo importée" : fresh.model ? " · Seedance 1.5 Pro" : ""}
            {fresh.cost_usd ? ` · ${usd(fresh.cost_usd)}` : ""}
          </p>
          {fresh.prompt ? <p className="studio-motion-prompt">{fresh.prompt}</p> : null}
        </div>
      ) : motion ? (
        <p className="text-xs text-amber-200/80">L&apos;animation a été faite sur une autre image de la case : le lecteur montre l&apos;image fixe. Refaites-la ou retirez-la.</p>
      ) : null}

      {form ? (
        <div className="studio-motion-form">
          <label className="webtoon-field">
            <span>Mouvement voulu</span>
            <textarea rows={6} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-xs text-ivory/70">
              Durée
              <select value={form.seconds} onChange={(e) => setForm({ ...form, seconds: Number(e.target.value) })}>
                {MOTION_SECONDS.map((s) => <option key={s} value={s}>{s} s</option>)}
              </select>
            </label>
            <span className="text-xs text-ivory/60">Coût estimé : {usd(motionEstimate(form.seconds))} · Seedance 1.5 Pro, 720p, sans son, environ 1 min 30</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void launch()} disabled={!form.prompt.trim()}>
              Lancer ({usd(motionEstimate(form.seconds))})
            </button>
            <button type="button" className="webtoon-mini" onClick={() => setForm({ ...form, prompt: defaultMotionPrompt(panel) })}>Prompt par défaut</button>
            <button type="button" className="webtoon-mini" onClick={() => setForm(null)}>Annuler</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="webtoon-mini"
            disabled={!hasImage || Boolean(job)}
            title={hasImage ? "Une boucle de quelques secondes faite depuis l'image de la case : cheveux, tissu, lumière, caméra presque fixe" : "La case n'a pas encore d'image"}
            onClick={() => setForm({ prompt: motion?.prompt || defaultMotionPrompt(panel), seconds: motion?.seconds && (MOTION_SECONDS as readonly number[]).includes(motion.seconds) ? motion.seconds : MOTION_DEFAULT_SECONDS })}
          >
            {motion ? "Refaire l'animation" : "Animer la case"}
          </button>
          <button type="button" className="webtoon-mini" disabled={!hasImage || importing || Boolean(job)} onClick={() => fileInput.current?.click()} title="Une vidéo MP4 ou WebM de quelques secondes, muette, au cadrage de l'image">
            {importing ? "Import…" : "Importer une vidéo"}
          </button>
          {motion ? <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={remove} disabled={Boolean(job)}>Retirer l&apos;animation</button> : null}
          <input
            ref={fileInput}
            type="file"
            accept="video/mp4,video/webm"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void importVideo(file);
            }}
          />
        </div>
      )}
    </div>
  );
}
