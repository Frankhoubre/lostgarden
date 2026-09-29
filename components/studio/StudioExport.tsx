"use client";

import { strToU8, zip } from "fflate";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ProgressBar } from "@/components/studio/ProgressBar";
import { openRowCapture, readyStrip } from "@/components/studio/strip-capture";
import { WebtoonReader } from "@/components/webtoon/WebtoonReader";
import type { Locale } from "@/lib/i18n/config";
import type { WebtoonPanel } from "@/lib/webtoon/types";

/** The formats of the platforms: width, tallest piece, heaviest file. */
const PLATFORMS = [
  { id: "webtoon", label: "WEBTOON Canvas", width: 800, maxHeight: 1280, maxBytes: 2_000_000 },
  { id: "tapas", label: "Tapas", width: 940, maxHeight: 2000, maxBytes: 2_000_000 },
  { id: "archive", label: "Archive (GlobalComix, MANGA Plus Creators)", width: 1080, maxHeight: 2000, maxBytes: 4_000_000 },
] as const;
type PlatformId = (typeof PLATFORMS)[number]["id"];

const LANGUAGES: { id: Locale; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
];

type Props = { slug: string; title: string; panels: WebtoonPanel[]; onClose: () => void };

async function toJpeg(canvas: HTMLCanvasElement, maxBytes: number): Promise<Uint8Array> {
  for (const quality of [0.92, 0.85, 0.78, 0.7, 0.6]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && (blob.size <= maxBytes || quality === 0.6)) return new Uint8Array(await blob.arrayBuffer());
  }
  return new Uint8Array();
}

/**
 * Export for the platforms, from the studio: the strip exactly as the public
 * reader draws it (shapes, tilts, overlaps, lettering in each language) is
 * rendered off screen, captured row by row, and cut into the pieces each
 * platform accepts; everything comes down as one ZIP
 * (`<langue>/<plateforme>/001.jpg`).
 */
export function StudioExport({ slug, title, panels, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [platforms, setPlatforms] = useState<PlatformId[]>(["webtoon", "tapas"]);
  const [languages, setLanguages] = useState<Locale[]>(["fr", "en"]);
  const [rendering, setRendering] = useState<Locale | null>(null);
  const [progress, setProgress] = useState<{ started: number; estimate: number; done: number; total: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const stop = useRef(false);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const run = async () => {
    if (!platforms.length || !languages.length) return;
    stop.current = false;
    setError(null);
    const files: Record<string, Uint8Array> = {};
    const chosen = PLATFORMS.filter((p) => platforms.includes(p.id));
    const rowsTotal = panels.length * languages.length;
    const started = Date.now();
    let rowsDone = 0;
    try {
      for (const locale of languages) {
        setRendering(locale);
        // The strip in this language, its images loaded; one capture context for the whole language
        // (a fresh capture per row fetched the fonts every time: forty seconds a row).
        const { rows, capture, close } = await openRowCapture(await readyStrip(() => host.current));
        // One piece being filled per platform.
        const state = chosen.map((p) => ({ platform: p, canvas: null as HTMLCanvasElement | null, y: 0, count: 0 }));
        const flush = async (s: (typeof state)[number]) => {
          if (!s.canvas || s.y <= 0) return;
          const out = document.createElement("canvas");
          out.width = s.platform.width;
          out.height = Math.ceil(s.y);
          out.getContext("2d")!.drawImage(s.canvas, 0, 0);
          s.count += 1;
          files[`${slug}/${locale}/${s.platform.id}/${String(s.count).padStart(3, "0")}.jpg`] = await toJpeg(out, s.platform.maxBytes);
          s.canvas = null;
          s.y = 0;
        };
        for (const row of rows) {
          if (stop.current) throw new Error("export arrêté");
          const shot = await capture(row);
          for (const s of state) {
            const scale = s.platform.width / shot.width;
            const height = shot.height * scale;
            let done = 0;
            while (done < height - 0.5) {
              if (!s.canvas) {
                s.canvas = document.createElement("canvas");
                s.canvas.width = s.platform.width;
                s.canvas.height = s.platform.maxHeight;
                s.y = 0;
              }
              const room = s.platform.maxHeight - s.y;
              const part = Math.min(room, height - done);
              s.canvas.getContext("2d")!.drawImage(shot, 0, done / scale, shot.width, part / scale, 0, s.y, s.platform.width, part);
              s.y += part;
              done += part;
              if (s.y >= s.platform.maxHeight - 0.5) await flush(s);
            }
          }
          rowsDone += 1;
          const elapsed = Date.now() - started;
          setProgress({ started, estimate: rowsDone ? (elapsed / rowsDone) * rowsTotal : rowsTotal * 400, done: rowsDone, total: rowsTotal, label: `Rendu en ${LANGUAGES.find((l) => l.id === locale)?.label}` });
        }
        for (const s of state) await flush(s);
        close();
      }
      setRendering(null);
      files[`${slug}/LISEZ-MOI.txt`] = strToU8(
        `${title}\n\nExport du studio webtoon, ${new Date().toLocaleString("fr-FR")}.\n\n${chosen.map((p) => `${p.id}/ : ${p.label}, ${p.width} px de large, morceaux de ${p.maxHeight} px au plus`).join("\n")}\n\nLes morceaux se lisent dans l'ordre des numéros.`,
      );
      const archive = await new Promise<Uint8Array>((resolve, reject) => zip(files, { level: 0 }, (err, data) => (err ? reject(err) : resolve(data))));
      const url = URL.createObjectURL(new Blob([archive as BlobPart], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}-plateformes.zip`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "export impossible");
      setRendering(null);
      setProgress(null);
    }
  };

  return (
    <dialog ref={dialog} className="studio-lightbox studio-export" onClose={onClose}>
      <div className="studio-export-body">
        <b>Exporter pour les plateformes</b>
        <p className="text-xs text-ivory/70">La bande telle que le lecteur la montre (formes, superpositions, bulles dans chaque langue), découpée aux formats acceptés, dans un seul fichier ZIP.</p>
        <fieldset>
          <legend>Plateformes</legend>
          {PLATFORMS.map((p) => (
            <label key={p.id}>
              <input type="checkbox" checked={platforms.includes(p.id)} onChange={() => setPlatforms((l) => toggle(l, p.id))} disabled={Boolean(progress)} />
              {p.label} <small>{p.width} px, morceaux de {p.maxHeight} px</small>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Langues</legend>
          {LANGUAGES.map((l) => (
            <label key={l.id}>
              <input type="checkbox" checked={languages.includes(l.id)} onChange={() => setLanguages((list) => toggle(list, l.id))} disabled={Boolean(progress)} />
              {l.label}
            </label>
          ))}
        </fieldset>
        {progress ? <ProgressBar startedAt={progress.started} estimateMs={progress.estimate} label={progress.label} done={progress.done} total={progress.total} /> : null}
        {error ? <p className="studio-history-error">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          {progress ? (
            <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => { stop.current = true; }}>Arrêter</button>
          ) : (
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void run()} disabled={!platforms.length || !languages.length}>
              Exporter ({panels.length} cases × {languages.length} langue{languages.length > 1 ? "s" : ""})
            </button>
          )}
          <button type="button" className="webtoon-mini" onClick={onClose} disabled={Boolean(progress)}>Fermer</button>
        </div>
      </div>
      {rendering
        ? createPortal(
            <div ref={host} className="studio-export-stage" aria-hidden="true">
              <WebtoonReader panels={panels} locale={rendering} />
            </div>,
            document.body,
          )
        : null}
    </dialog>
  );
}
