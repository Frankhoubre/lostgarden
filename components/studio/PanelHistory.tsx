"use client";

import { getDownloadURL, getMetadata, getStorage, listAll, ref } from "firebase/storage";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { getFirebaseApp } from "@/lib/firebase";
import { originLabel } from "@/lib/webtoon/image-history";
import type { PanelImage, WebtoonPanel } from "@/lib/webtoon/types";

type Version = { src: string; path: string; at: string | null; image?: PanelImage; current: boolean };

type PanelHistoryProps = {
  slug: string;
  panel: WebtoonPanel;
  onClose: () => void;
  /** Put this image back on the panel; the current one goes to its history. */
  onPick: (image: PanelImage) => void;
};

/** The Storage path of an image URL (`webtoon/<slug>/<panel>/<ts>.png`), to recognise the same file twice. */
function storagePath(src: string): string {
  const match = /\/o\/([^?#]+)/.exec(src);
  return match ? decodeURIComponent(match[1]) : src.split("#")[0];
}

/**
 * Two versions over each other, cut by a line the author drags: the version
 * looked at on the left of the line, the one it is compared with on the
 * right. Both are fitted in the same box, so a retouch lines up pixel for
 * pixel and the change shows where the line crosses it.
 */
function CompareSlider({ left, right, leftLabel, rightLabel }: { left: string; right: string; leftLabel: string; rightLabel: string }) {
  const [split, setSplit] = useState(50);
  const [ratio, setRatio] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const moveTo = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect?.width) return;
    setSplit(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveTo(e.clientX);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") setSplit((v) => Math.max(0, v - 5));
    else if (e.key === "ArrowRight") setSplit((v) => Math.min(100, v + 5));
    else return;
    e.preventDefault();
  };
  return (
    <div
      ref={box}
      className="studio-compare"
      style={{ aspectRatio: ratio ?? undefined }}
      onPointerDown={onDown}
      onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      onKeyDown={onKey}
      role="slider"
      tabIndex={0}
      aria-label="Ligne de comparaison"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(split)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={right} alt="" draggable={false} onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || null)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={left} alt="" draggable={false} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
      <span className="studio-compare-line" style={{ left: `${split}%` }} aria-hidden="true" />
      <span className="studio-compare-tag is-left">{leftLabel}</span>
      <span className="studio-compare-tag is-right">{rightLabel}</span>
    </div>
  );
}

/**
 * Every image a panel has ever had: the files the studio stored for it (each
 * drawing, retouch and import since the panel exists, even before the
 * history was kept), merged with its recorded history (what made each one,
 * the instruction of a retouch, the cost). Newest first; one is shown large,
 * and "Utiliser cette version" puts it back on the panel.
 */
export function PanelHistory({ slug, panel, onClose, onPick }: PanelHistoryProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);
  /** Compare the version shown with another one: the current image, or the previous one when the current is shown. */
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const known = [panel.image, ...(panel.image_history ?? [])].filter((image) => image?.src && image.status !== "missing");
    const byPath = new Map(known.map((image) => [storagePath(image.src), image]));
    const currentPath = panel.image?.src ? storagePath(panel.image.src) : "";
    const run = async () => {
      let stored: Version[] = [];
      try {
        const folder = await listAll(ref(getStorage(getFirebaseApp()), `webtoon/${slug}/${panel.panel_id}`));
        stored = await Promise.all(
          folder.items.map(async (item) => {
            const [src, meta] = await Promise.all([getDownloadURL(item), getMetadata(item).catch(() => null)]);
            const image = byPath.get(item.fullPath);
            return { src, path: item.fullPath, at: image?.generated_at ?? meta?.timeCreated ?? null, image, current: item.fullPath === currentPath };
          }),
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "stockage illisible");
      }
      // What the history records but Storage does not hold (an image of the code, a film frame).
      const extra = known
        .filter((image) => !stored.some((v) => v.path === storagePath(image.src)))
        .map((image) => ({ src: image.src, path: storagePath(image.src), at: image.generated_at ?? null, image, current: storagePath(image.src) === currentPath }));
      const all = [...stored, ...extra].sort((a, b) => (b.current ? 1 : 0) - (a.current ? 1 : 0) || String(b.at ?? "").localeCompare(String(a.at ?? "")));
      if (!cancelled) {
        setVersions(all);
        setShown(all[0]?.src ?? null);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [slug, panel.panel_id, panel.image, panel.image_history]);

  const selected = versions?.find((v) => v.src === shown) ?? versions?.[0];
  const when = (at: string | null) => (at ? new Date(at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "date inconnue");
  const other = selected && versions ? (selected.current ? versions.find((v) => !v.current) : versions.find((v) => v.current) ?? versions.find((v) => v !== selected)) : undefined;
  const label = (v: Version) => (v.current ? "Actuelle" : when(v.at));

  return (
    <dialog ref={dialog} className="studio-lightbox studio-history" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="studio-history-body">
        <div className="studio-history-stage">
          {selected && comparing && other ? (
            <CompareSlider left={selected.src} right={other.src} leftLabel={label(selected)} rightLabel={label(other)} />
          ) : selected ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.src} alt="" />
          ) : (
            <p className="studio-history-empty">{versions ? "Aucune image pour cette case." : "Chargement de l'historique…"}</p>
          )}
        </div>
        <aside className="studio-history-side">
          <div className="studio-history-head">
            <b>Historique de la case {panel.order}</b>
            <span>{versions ? `${versions.length} image${versions.length > 1 ? "s" : ""}` : "…"}</span>
          </div>
          {error ? <p className="studio-history-error">Le stockage n&apos;a pas pu être lu ({error}) : seules les versions enregistrées sont montrées.</p> : null}
          {selected ? (
            <div className="studio-history-info">
              <span>
                {selected.current ? "Image actuelle · " : ""}
                {selected.image ? originLabel(selected.image) : "Générée"} · {when(selected.at)}
                {selected.image?.cost_usd ? ` · ${selected.image.cost_usd.toFixed(3)} $` : ""}
              </span>
              {selected.image?.note ? <q>{selected.image.note}</q> : null}
              {other ? (
                <button type="button" className={`webtoon-mini ${comparing ? "is-on" : ""}`} onClick={() => setComparing((v) => !v)} title="Glissez la ligne sur l'image pour voir ce qui a changé">
                  {comparing ? "Arrêter la comparaison" : `Comparer avec ${other.current ? "l'actuelle" : "la précédente"}`}
                </button>
              ) : null}
              {!selected.current ? (
                <button
                  type="button"
                  className="webtoon-mini studio-primary"
                  onClick={() => {
                    onPick(selected.image ? { ...selected.image, src: selected.src, status: "generated" } : { src: selected.src, width: panel.image?.width || 1536, height: panel.image?.height || 1024, status: "generated", origin: "generate", generated_at: selected.at ?? undefined });
                    onClose();
                  }}
                >
                  Utiliser cette version
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="studio-history-grid">
            {(versions ?? []).map((v) => (
              <button key={v.path} type="button" className={`studio-history-thumb ${v.src === selected?.src ? "is-on" : ""} ${v.current ? "is-current" : ""}`} onClick={() => setShown(v.src)} title={`${v.image ? originLabel(v.image) : "Générée"} · ${when(v.at)}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.src} alt="" loading="lazy" />
                <span>{v.current ? "Actuelle" : when(v.at)}</span>
              </button>
            ))}
          </div>
          <button type="button" className="webtoon-mini" onClick={onClose}>Fermer</button>
        </aside>
      </div>
    </dialog>
  );
}
