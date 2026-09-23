"use client";

import { useEffect, useRef, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import type { LibraryOverlay, WebtoonPanel } from "@/lib/webtoon/types";

type PanelInpaintProps = {
  slug: string;
  panel: WebtoonPanel;
  library: LibraryOverlay;
  notify: (message: string) => void;
  /** The quality chosen in the studio (HD or Éco). */
  quality?: "high" | "medium";
  /** The retouched panel as a PNG data URL, at the original size. */
  onDone: (dataUrl: string) => Promise<void> | void;
  onClose: () => void;
};

const SIZES: [number, number][] = [
  [1024, 1536],
  [1536, 1024],
  [1024, 1024],
];

async function studioHeaders(): Promise<Record<string, string>> {
  const token = (await getFirebaseAuth().currentUser?.getIdToken().catch(() => "")) ?? "";
  if (token) return { Authorization: `Bearer ${token}` };
  if (process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("dev")) return { "x-studio-dev": "1" };
  return {};
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!src.startsWith("data:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image inaccessible"));
    image.src = src;
  });
}

/** The OpenAI size closest to the panel's aspect, and where the panel sits inside it (letterboxed). */
function fit(width: number, height: number) {
  const ratio = width / height;
  const [sw, sh] = ratio < 0.85 ? SIZES[0] : ratio > 1.18 ? SIZES[1] : SIZES[2];
  const scale = Math.min(sw / width, sh / height);
  const dw = Math.round(width * scale);
  const dh = Math.round(height * scale);
  return { sw, sh, dw, dh, ox: Math.round((sw - dw) / 2), oy: Math.round((sh - dh) / 2) };
}

/**
 * Change a panel with the image model, two ways. Without painting: a prompt
 * edits the whole panel ("make it night", "he turns his head to the left"),
 * framing, characters and style kept. With a painted zone: only that zone
 * changes; the model redraws the image with the mask as guide, then the zone
 * alone is pasted back on the original with a soft edge. The result is shown
 * before it replaces the image: keep it, try again, or go back.
 */
export function PanelInpaint({ slug, panel, library, notify, quality = "high", onDone, onClose }: PanelInpaintProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const painting = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brush, setBrush] = useState(90);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [painted, setPainted] = useState(false);
  /** The proposal waiting for a decision, at the original size. */
  const [proposal, setProposal] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadImage(panel.image.src)
      .then((image) => {
        if (cancelled) return;
        imageRef.current = image;
        const mask = document.createElement("canvas");
        mask.width = image.naturalWidth;
        mask.height = image.naturalHeight;
        maskRef.current = mask;
        const overlay = overlayRef.current;
        if (overlay) {
          overlay.width = image.naturalWidth;
          overlay.height = image.naturalHeight;
        }
        setReady(true);
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [panel.image.src]);

  const redraw = () => {
    const overlay = overlayRef.current;
    const mask = maskRef.current;
    if (!overlay || !mask) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(mask, 0, 0);
    ctx.globalAlpha = 1;
  };

  const paintAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const overlay = overlayRef.current;
    const mask = maskRef.current;
    if (!overlay || !mask) return;
    const rect = overlay.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * mask.width;
    const y = ((event.clientY - rect.top) / rect.height) * mask.height;
    const ctx = mask.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#7ddfff";
    ctx.strokeStyle = "#7ddfff";
    ctx.lineWidth = brush;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const last = lastPoint.current;
    if (last) {
      // A continuous stroke: join the previous point so fast moves leave no gaps.
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, brush / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPoint.current = { x, y };
    setPainted(true);
    redraw();
  };

  const clearMask = () => {
    const mask = maskRef.current;
    if (!mask) return;
    mask.getContext("2d")?.clearRect(0, 0, mask.width, mask.height);
    setPainted(false);
    redraw();
  };

  const retouch = async () => {
    const image = imageRef.current;
    const mask = maskRef.current;
    if (!image || !mask || busy) return;
    if (!prompt.trim()) {
      notify(painted ? "Dis ce qui doit apparaître dans la zone" : "Dis ce qui doit changer dans la case");
      return;
    }
    setBusy(true);
    try {
      const w = image.naturalWidth;
      const h = image.naturalHeight;
      const { sw, sh, dw, dh, ox, oy } = fit(w, h);

      // The panel letterboxed into the model's size, as a JPEG to keep the request small.
      const source = document.createElement("canvas");
      source.width = sw;
      source.height = sh;
      const sctx = source.getContext("2d")!;
      sctx.fillStyle = "#000";
      sctx.fillRect(0, 0, sw, sh);
      sctx.drawImage(image, ox, oy, dw, dh);

      // The mask the model expects: opaque everywhere, transparent where the zone is. None for a whole-panel edit.
      let apiMask: string | undefined;
      if (painted) {
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const mctx = canvas.getContext("2d")!;
        mctx.fillStyle = "#000";
        mctx.fillRect(0, 0, sw, sh);
        mctx.globalCompositeOperation = "destination-out";
        mctx.drawImage(mask, ox, oy, dw, dh);
        apiMask = canvas.toDataURL("image/png");
      }

      const response = await fetch(`/api/webtoon/${slug}/inpaint`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ panel, image: source.toDataURL("image/jpeg", 0.92), ...(apiMask ? { mask: apiMask } : {}), prompt: prompt.trim(), size: `${sw}x${sh}`, library, quality }),
      });
      const payload = (await response.json().catch(() => ({}))) as { data_url?: string; error?: string };
      if (!response.ok || !payload.data_url) {
        notify(payload.error ?? `Erreur ${response.status}`);
        return;
      }
      const result = await loadImage(payload.data_url);
      if (!painted) {
        // The whole panel: the letterbox cropped away, back at the original size.
        const whole = document.createElement("canvas");
        whole.width = w;
        whole.height = h;
        whole.getContext("2d")!.drawImage(result, ox, oy, dw, dh, 0, 0, w, h);
        setProposal(whole.toDataURL("image/png"));
        return;
      }

      // Paste only the painted zone, with a soft edge, onto the original.
      const layer = document.createElement("canvas");
      layer.width = w;
      layer.height = h;
      const lctx = layer.getContext("2d")!;
      lctx.drawImage(result, ox, oy, dw, dh, 0, 0, w, h);
      lctx.globalCompositeOperation = "destination-in";
      lctx.filter = `blur(${Math.max(4, Math.round(brush / 8))}px)`;
      lctx.drawImage(mask, 0, 0);
      lctx.filter = "none";

      const final = document.createElement("canvas");
      final.width = w;
      final.height = h;
      const fctx = final.getContext("2d")!;
      fctx.drawImage(image, 0, 0);
      fctx.drawImage(layer, 0, 0);
      setProposal(final.toDataURL("image/png"));
    } catch (e) {
      notify(e instanceof Error ? e.message : "Retouche impossible");
    } finally {
      setBusy(false);
    }
  };

  const keep = async () => {
    if (!proposal) return;
    setBusy(true);
    try {
      await onDone(proposal);
      notify(painted ? "Zone retouchée" : "Case modifiée");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="studio-lightbox studio-inpaint" onClose={onClose}>
      <div className="studio-inpaint-body">
        <div className="studio-inpaint-stage">
          {error ? <p className="text-sm text-ivory/80">{error}</p> : null}
          <div className="studio-inpaint-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={proposal ?? panel.image.src} alt={panel.description} draggable={false} />
          <canvas
            ref={overlayRef}
            className={busy ? "is-busy" : ""}
            hidden={Boolean(proposal)}
            onPointerDown={(e) => {
              if (!ready || busy) return;
              painting.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              paintAt(e);
            }}
            onPointerMove={(e) => {
              if (painting.current) paintAt(e);
            }}
            onPointerUp={() => {
              painting.current = false;
              lastPoint.current = null;
            }}
            onPointerLeave={() => {
              painting.current = false;
              lastPoint.current = null;
            }}
          />
          {busy ? (
            <div className="studio-stage-overlay">
              <span className="studio-spinner studio-spinner-lg" aria-hidden />
              <span>{painted ? "Retouche en cours…" : "Modification en cours…"}</span>
              <small>≈ 40 s</small>
            </div>
          ) : null}
          </div>
        </div>
        <aside className="studio-inpaint-side">
          <p className="anime-label text-xs text-cyan-pale">Modifier la case · {panel.panel_id}</p>
          <p className="text-xs text-ivory/70">
            {painted
              ? "Seule la zone peinte change, le reste de la case ne bouge pas."
              : "Sans rien peindre, le prompt modifie toute la case en gardant le cadrage, les personnages et le style. Pour ne toucher qu'un endroit, peins-le sur l'image."}
          </p>
          <label className="webtoon-field">
            <span>Pinceau · {brush} px</span>
            <input type="range" min={20} max={300} step={5} value={brush} onChange={(e) => setBrush(Number(e.target.value))} disabled={busy || Boolean(proposal)} />
          </label>
          <label className="webtoon-field">
            <span>{painted ? "Ce qui doit apparaître dans la zone" : "Ce qui doit changer dans la case"}</span>
            <textarea
              rows={5}
              value={prompt}
              placeholder={painted ? "Par exemple : le casque posé dans la mousse, vu de près, avec son anneau ; ou : retire la branche, ne laisse que la brume bleue." : "Par exemple : la scène de nuit, seulement la lueur des champignons ; ou : Lanterne tourne la tête vers la gauche ; ou : retire le deuxième lapin."}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={busy || Boolean(proposal)}
            />
          </label>
          {proposal ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void keep()} disabled={busy}>Garder</button>
              <button type="button" className="webtoon-mini" onClick={() => { setProposal(null); void retouch(); }} disabled={busy}>Réessayer</button>
              <button type="button" className="webtoon-mini" onClick={() => setProposal(null)} disabled={busy}>Revenir à l&apos;originale</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void retouch()} disabled={busy || !ready}>
                {busy ? "…" : painted ? "Retoucher la zone (IA)" : "Modifier la case (IA)"}
              </button>
              <button type="button" className="webtoon-mini" onClick={clearMask} disabled={busy || !painted}>Effacer le masque</button>
              <button type="button" className="webtoon-mini" onClick={onClose} disabled={busy}>Fermer</button>
            </div>
          )}
          {proposal ? <p className="text-xs text-ivory/70">Voici la proposition. L&apos;image de la case ne change que si tu cliques sur Garder.</p> : null}
        </aside>
      </div>
    </dialog>
  );
}
