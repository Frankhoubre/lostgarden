"use client";

import { useState } from "react";
import { jobProgress, type StudioJob } from "@/lib/webtoon/studio-job";

type StudioBackgroundJobProps = {
  job: StudioJob;
  onCancel: () => void;
  onDismiss: () => void;
};

/**
 * The background job of the project, under the bar: what it does, how far
 * it is, its last lines, "Arrêter". It keeps running with the tab closed;
 * this tab merges each of its saves into the strip on screen.
 */
export function StudioBackgroundJob({ job, onCancel, onDismiss }: StudioBackgroundJobProps) {
  const [open, setOpen] = useState(false);
  const progress = jobProgress(job);
  const running = job.status === "running";
  const share = progress.total ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;
  return (
    <div className={`studio-bgjob ${running ? "" : `is-${job.status}`}`} role="status">
      <div className="studio-bgjob-row">
        {running ? <span className="studio-spinner" aria-hidden /> : null}
        <b>{running ? "En arrière-plan" : job.status === "done" ? "Travail en arrière-plan terminé" : job.status === "cancelled" ? "Travail en arrière-plan arrêté" : "Travail en arrière-plan en échec"}</b>
        <span>
          {job.label} · {progress.text}
          {job.failed.length ? ` · ${job.failed.length} image${job.failed.length > 1 ? "s" : ""} en échec` : ""}
        </span>
        <span className="studio-bgjob-actions">
          <button type="button" className="webtoon-mini" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            Journal
          </button>
          {running ? (
            <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={onCancel} title="S'arrête après l'étape en cours ; ce qui est fait reste dans la bande">
              Arrêter
            </button>
          ) : (
            <button type="button" className="webtoon-mini" onClick={onDismiss}>
              Fermer
            </button>
          )}
        </span>
      </div>
      {running ? (
        <div className="studio-bgjob-bar" aria-hidden="true">
          <span style={{ width: `${Math.max(3, share)}%` }} />
        </div>
      ) : null}
      {open ? (
        <ol className="studio-bgjob-log">
          {job.log.slice().reverse().map((line, i) => (
            <li key={i}>{line}</li>
          ))}
          {job.failed.slice(-5).map((f) => (
            <li key={f.panel_id} className="is-failed">
              {f.panel_id} : {f.reason}
            </li>
          ))}
        </ol>
      ) : (
        <p className="studio-bgjob-last">{job.log[job.log.length - 1] ?? ""}{running ? " · Vous pouvez fermer l'onglet, le travail continue." : ""}</p>
      )}
    </div>
  );
}
