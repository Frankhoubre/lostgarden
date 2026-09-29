"use client";

import { collection, getDocs, type Timestamp } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDb } from "@/lib/firebase";
import { READS_COLLECTION, READS_SESSIONS, computeReadStats, type ReadDevice, type ReadSession } from "@/lib/webtoon/reads";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type Period = 7 | 30 | 0;

const PERIODS: { id: Period; label: string }[] = [
  { id: 7, label: "7 jours" },
  { id: 30, label: "30 jours" },
  { id: 0, label: "Tout" },
];

const pct = (share: number) => `${Math.round(share * 100)} %`;

type StudioReadsProps = {
  slug: string;
  /** The studio's panels, for the thumbnails of the drops (matched by panel_id, else by position). */
  panels: WebtoonPanel[];
  /** Opens a panel in the Webtoon tab. */
  onOpenPanel: (panelId: string) => void;
};

/** A stored session, or null when the document is not one (the rules make that rare). */
function toSession(id: string, data: Record<string, unknown>): ReadSession | null {
  const millis = (value: unknown) => (value && typeof (value as Timestamp).toMillis === "function" ? (value as Timestamp).toMillis() : 0);
  if (typeof data.max_index !== "number" || typeof data.total !== "number") return null;
  return {
    id,
    locale: String(data.locale ?? ""),
    max_index: data.max_index,
    total: data.total,
    panel_id: String(data.panel_id ?? ""),
    device: (data.device === "mobile" ? "mobile" : "desktop") as ReadDevice,
    started_at: millis(data.started_at),
    updated_at: millis(data.updated_at),
  };
}

/**
 * Where the readers of the published episode stop: the sessions the public
 * reader records (components/webtoon/ReadingStats.tsx), as a few numbers, a
 * retention curve over the panels and the panels readers leave on most.
 * Read once when the tab opens, and again on demand.
 */
export function StudioReads({ slug, panels, onOpenPanel }: StudioReadsProps) {
  const [sessions, setSessions] = useState<ReadSession[] | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<Period>(30);
  const [hover, setHover] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await getDocs(collection(getDb(), READS_COLLECTION, slug, READS_SESSIONS));
      setSessions(snapshot.docs.map((d) => toSession(d.id, d.data())).filter((s): s is ReadSession => s !== null));
      setLoadedAt(Date.now());
    } catch (err) {
      const denied = (err as { code?: string } | null)?.code === "permission-denied";
      setError(denied ? "seul le compte du studio peut les lire, connectez-vous" : err instanceof Error ? err.message : "erreur");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  const stats = useMemo(() => {
    if (!sessions) return null;
    const since = period ? loadedAt - period * 86_400_000 : 0;
    return computeReadStats(sessions.filter((s) => s.started_at >= since));
  }, [sessions, period, loadedAt]);

  const panelFor = (index: number, panelId: string | null) => (panelId ? panels.find((p) => p.panel_id === panelId) : undefined) ?? panels[index];

  // The curve: one point per panel, the share of sessions that reached it.
  const W = 1000;
  const H = 260;
  const pad = { left: 46, right: 14, top: 14, bottom: 30 };
  const total = stats?.total ?? 1;
  const x = (i: number) => pad.left + (total > 1 ? i / (total - 1) : 0.5) * (W - pad.left - pad.right);
  const y = (share: number) => pad.top + (1 - share) * (H - pad.top - pad.bottom);
  const line = stats ? stats.retention.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r).toFixed(1)}`).join(" ") : "";
  const area = stats ? `${line} L${x(total - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : "";
  const ticks = useMemo(() => {
    if (total <= 1) return [0];
    const step = Math.max(1, Math.round((total - 1) / 5));
    const list: number[] = [];
    for (let i = 0; i < total - 1; i += step) list.push(i);
    if (list.length > 1 && total - 1 - list[list.length - 1] < step / 2) list.pop();
    return [...list, total - 1];
  }, [total]);

  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const vx = ((event.clientX - box.left) / box.width) * W;
    const ratio = (vx - pad.left) / (W - pad.left - pad.right);
    setHover(Math.max(0, Math.min(total - 1, Math.round(ratio * (total - 1)))));
  };

  return (
    <section className="studio-reads">
      <header className="studio-reads-head">
        <div>
          <h2>Lecture</h2>
          <p>Jusqu&apos;où les lecteurs de l&apos;épisode publié descendent dans la bande. Anonyme : une lecture par onglet, sans cookie ni donnée personnelle.</p>
        </div>
        <div className="studio-reads-controls">
          <span className="studio-langswitch" role="group" aria-label="Période">
            {PERIODS.map((entry) => (
              <button key={entry.id} type="button" className={`webtoon-mini ${period === entry.id ? "is-active" : ""}`} onClick={() => setPeriod(entry.id)}>
                {entry.label}
              </button>
            ))}
          </span>
          <button type="button" className="webtoon-mini" onClick={() => void load()} disabled={loading}>
            {loading ? "Chargement…" : "Actualiser"}
          </button>
        </div>
      </header>

      {error ? <p className="studio-reads-empty">Statistiques illisibles : {error}</p> : null}
      {!error && sessions === null ? <p className="studio-reads-empty">Chargement des lectures…</p> : null}
      {!error && sessions !== null && !stats ? (
        <p className="studio-reads-empty">
          {sessions.length
            ? "Aucune lecture sur cette période : choisissez une période plus longue."
            : "Aucune lecture enregistrée pour l'instant. Les lectures apparaissent ici dès que l'épisode publié est lu."}
        </p>
      ) : null}

      {stats ? (
        <>
          <div className="studio-reads-tiles">
            <div className="studio-reads-tile">
              <span>Lectures</span>
              <b>{stats.sessions.toLocaleString("fr-FR")}</b>
            </div>
            <div className="studio-reads-tile">
              <span>Case médiane atteinte</span>
              <b>{stats.median_index + 1}</b>
              <small>sur {stats.total}</small>
            </div>
            <div className="studio-reads-tile">
              <span>Vont jusqu&apos;au bout</span>
              <b>{pct(stats.finished)}</b>
            </div>
            <div className="studio-reads-tile">
              <span>Sur mobile</span>
              <b>{pct(stats.mobile)}</b>
            </div>
          </div>

          <figure className="studio-reads-chart">
            <figcaption>Part des lectures qui atteignent chaque case</figcaption>
            <div className="studio-reads-plot">
              <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Courbe de rétention sur ${stats.total} cases`} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
                {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                  <g key={g}>
                    <line className="studio-reads-grid" x1={pad.left} x2={W - pad.right} y1={y(g)} y2={y(g)} />
                    <text className="studio-reads-axis" x={pad.left - 8} y={y(g) + 4} textAnchor="end">
                      {g * 100} %
                    </text>
                  </g>
                ))}
                {ticks.map((i) => (
                  <text key={i} className="studio-reads-axis" x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === total - 1 ? "end" : "middle"}>
                    {i + 1}
                  </text>
                ))}
                <path className="studio-reads-area" d={area} />
                <path className="studio-reads-line" d={line} />
                {stats.drops.map((d) => (
                  <circle key={d.index} className="studio-reads-dot" cx={x(d.index)} cy={y(stats.retention[d.index])} r={5} />
                ))}
                {hover !== null ? (
                  <g>
                    <line className="studio-reads-cross" x1={x(hover)} x2={x(hover)} y1={pad.top} y2={y(0)} />
                    <circle className="studio-reads-dot is-hover" cx={x(hover)} cy={y(stats.retention[hover])} r={5} />
                  </g>
                ) : null}
              </svg>
              {hover !== null ? (
                <div className="studio-reads-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(stats.retention[hover]) / H) * 100}%` }}>
                  <b>Case {hover + 1}</b>
                  <span>{pct(stats.retention[hover])} des lectures</span>
                </div>
              ) : null}
            </div>
          </figure>

          <div className="studio-reads-drops">
            <h3>Où ils décrochent</h3>
            {stats.drops.length ? (
              stats.drops.map((d) => {
                const panel = panelFor(d.index, d.panel_id);
                const src = panel?.image.web?.src ?? panel?.image.src;
                const hasImage = Boolean(src) && panel?.image.status !== "missing";
                return (
                  <button key={d.index} type="button" className="studio-reads-drop" onClick={() => panel && onOpenPanel(panel.panel_id)} disabled={!panel} title={panel ? "Ouvrir cette case dans l'éditeur" : "Cette case n'existe plus dans le brouillon"}>
                    <span className="studio-reads-thumb">
                      {hasImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt="" loading="lazy" />
                      ) : (
                        <span>{panel?.caption.some((c) => c.style === "title") ? "carte-titre" : "pas d'image"}</span>
                      )}
                    </span>
                    <span className="studio-reads-drop-text">
                      <b>
                        Case {d.index + 1} : -{pct(d.share)} des lecteurs
                      </b>
                      <small>
                        {`${pct(d.of_reached)} de ceux qui l'avaient atteinte s'arrêtent là`}
                        {panel && panel.panel_id !== d.panel_id && d.panel_id ? ` · case publiée ${d.panel_id}` : ""}
                      </small>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="studio-reads-empty">Toutes les lectures de la période vont jusqu&apos;au bout.</p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
