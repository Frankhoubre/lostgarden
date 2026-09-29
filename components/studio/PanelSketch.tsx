"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { fit, loadImage, studioHeaders } from "@/components/studio/PanelInpaint";
import type { LibraryOverlay, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * A SMALL DRAWING TABLE IN THE STUDIO. The author draws the panel as he sees
 * it (a few lines, silhouettes, arrows), on a blank page, over the panel's
 * image to show a change, or over an imported rough (a photo of a paper
 * sketch, another image), and the studio turns the drawing into the final
 * panel: same framing, same poses and places, the characters as on their
 * sheets, in the style of the series. The drawing itself stays in the
 * panel's history. Pencil pressure works with a stylus (Apple Pencil on an
 * iPad); a palm resting on the screen is ignored once a stylus has drawn.
 */

export type SketchMode = "blank" | "over";

export type SketchRequest = {
  /** The drawing flattened with its background, as a PNG data URL, at the size of the canvas. */
  composite: string;
  mode: SketchMode;
  /** What the panel shows, in the author's words; the panel's description when empty. */
  prompt: string;
  /** "Garder mon dessin tel quel": the drawing becomes the image, nothing is generated. */
  keepOnly: boolean;
};

type Tool = "pencil" | "marker" | "brush" | "eraser";

const TOOLS: { id: Tool; label: string; key: string; hint: string }[] = [
  { id: "pencil", label: "Crayon", key: "P", hint: "Trait fin, sensible à la pression du stylet" },
  { id: "marker", label: "Feutre", key: "M", hint: "Trait plein et régulier" },
  { id: "brush", label: "Pinceau", key: "B", hint: "Large et doux, pour les masses et les ombres" },
  { id: "eraser", label: "Gomme", key: "E", hint: "Efface le dessin, jamais le fond" },
];

const COLORS = ["#111418", "#6b7280", "#ffffff", "#e03131", "#1c7ed6", "#f08c00", "#2f9e44"];
const HISTORY = 40;

type PanelSketchProps = {
  panel: WebtoonPanel;
  notify: (message: string) => void;
  onSubmit: (request: SketchRequest) => void;
  onClose: () => void;
};

export function PanelSketch({ panel, notify, onSubmit, onClose }: PanelSketchProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const background = useRef<HTMLCanvasElement>(null);
  const ink = useRef<HTMLCanvasElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const hasImage = Boolean(panel.image.src && panel.image.status !== "missing");
  const [mode, setMode] = useState<SketchMode>(hasImage ? "over" : "blank");
  // A blank page has the panel's shape at 1080 wide; drawing over the image uses the image's own size, once loaded.
  const blank = { w: 1080, h: Math.max(400, Math.min(3000, panel.panel_height || 1350)) };
  const [overSize, setOverSize] = useState<{ w: number; h: number } | null>(null);
  const size = mode === "over" && overSize ? overSize : blank;
  const [bgOpacity, setBgOpacity] = useState(1);
  const [imported, setImported] = useState<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(6);
  const [zoom, setZoom] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const undo = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const stroke = useRef<{ id: number; last: { x: number; y: number; p: number } | null; mid: { x: number; y: number } | null } | null>(null);
  const penSeen = useRef(false);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  // The background: white for a blank page, the panel's whole image to draw over, or the imported rough.
  useEffect(() => {
    const canvas = background.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let cancelled = false;
    if (mode === "over" && hasImage) {
      loadImage(panel.image.src)
        .then((image) => {
          if (cancelled) return;
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          ctx.drawImage(image, 0, 0);
          setOverSize({ w: image.naturalWidth, h: image.naturalHeight });
        })
        .catch(() => {
          if (cancelled) return;
          notify("L'image de la case n'a pas pu être chargée : page blanche à la place");
          setMode("blank");
        });
      return () => {
        cancelled = true;
      };
    }
    const w = 1080;
    const h = Math.max(400, Math.min(3000, panel.panel_height || 1350));
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    if (imported) {
      // Covered like a panel image: the rough fills the frame, centred.
      const scale = Math.max(w / imported.naturalWidth, h / imported.naturalHeight);
      const dw = imported.naturalWidth * scale;
      const dh = imported.naturalHeight * scale;
      ctx.drawImage(imported, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
  }, [mode, hasImage, panel.image.src, panel.panel_height, imported, notify]);
  const loading = mode === "over" && !overSize;

  // The ink layer follows the size of the background; a change of page clears it (after asking).
  // Resizing a canvas clears it: the history of the old page goes with it.
  useEffect(() => {
    const canvas = ink.current;
    if (!canvas) return;
    if (canvas.width === size.w && canvas.height === size.h) return;
    canvas.width = size.w;
    canvas.height = size.h;
    undo.current = [];
    redo.current = [];
  }, [size.w, size.h]);

  const snapshot = () => {
    const canvas = ink.current;
    if (!canvas) return;
    undo.current = [...undo.current, canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height)].slice(-HISTORY);
    redo.current = [];
    setUndoCount(undo.current.length);
    setRedoCount(0);
  };

  const step = useCallback((back: boolean) => {
    const canvas = ink.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const from = back ? undo : redo;
    const to = back ? redo : undo;
    const state = from.current.pop();
    if (!state) return;
    to.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.putImageData(state, 0, 0);
    setUndoCount(undo.current.length);
    setRedoCount(redo.current.length);
  }, []);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea")) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        step(!event.shiftKey);
        return;
      }
      const found = TOOLS.find((t) => t.key.toLowerCase() === event.key.toLowerCase());
      if (found && !event.metaKey && !event.ctrlKey) setTool(found.id);
      if (event.key === "[") setWidth((w) => Math.max(1, w - 2));
      if (event.key === "]") setWidth((w) => Math.min(80, w + 2));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [step]);

  const point = (event: PointerEvent | ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = ink.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height, p: event.pointerType === "mouse" ? 0.5 : event.pressure || 0.5 };
  };

  const lineWidth = (p: number) => {
    // Scaled to the canvas: the slider is in screen pixels at 100 %.
    const scale = (ink.current?.width ?? 1080) / 700;
    if (tool === "pencil") return Math.max(0.6, width * scale * (0.25 + p * 1.1));
    if (tool === "brush") return width * scale * 3 * (0.6 + p * 0.6);
    if (tool === "eraser") return width * scale * 3;
    return width * scale;
  };

  const drawTo = (next: { x: number; y: number; p: number }) => {
    const current = stroke.current;
    const ctx = ink.current?.getContext("2d");
    if (!current?.last || !ctx) return;
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = color;
    ctx.globalAlpha = tool === "brush" ? 0.35 : tool === "pencil" ? 0.92 : 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth((current.last.p + next.p) / 2);
    // Smoothed through the midpoints: a quick stroke stays a curve, not a polyline.
    const mid = { x: (current.last.x + next.x) / 2, y: (current.last.y + next.y) / 2 };
    ctx.beginPath();
    const start = current.mid ?? current.last;
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(current.last.x, current.last.y, mid.x, mid.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    current.mid = mid;
    current.last = next;
  };

  const onDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "pen") penSeen.current = true;
    // A palm on an iPad: once a stylus has drawn, fingers do not.
    if (event.pointerType === "touch" && penSeen.current) return;
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    snapshot();
    const start = point(event);
    stroke.current = { id: event.pointerId, last: start, mid: null };
    // A dot for a tap.
    drawTo({ ...start, x: start.x + 0.01 });
  };

  const onMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!stroke.current || stroke.current.id !== event.pointerId) return;
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
    for (const e of events.length ? events : [event.nativeEvent]) drawTo(point(e));
  };

  const onUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (stroke.current?.id === event.pointerId) stroke.current = null;
  };

  const clear = () => {
    const canvas = ink.current;
    if (!canvas) return;
    snapshot();
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const importFile = async (file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      setImported(image);
      setMode("blank");
      setBgOpacity(0.55);
      notify("Image importée comme fond : dessinez par-dessus, puis transformez-la en case");
    } catch {
      notify("Cette image n'a pas pu être lue");
    }
  };

  const flatten = (): string => {
    const out = document.createElement("canvas");
    out.width = size.w;
    out.height = size.h;
    const ctx = out.getContext("2d")!;
    // The background at full strength (its dimming is only a help to draw), the ink on top.
    if (background.current) ctx.drawImage(background.current, 0, 0);
    if (ink.current) ctx.drawImage(ink.current, 0, 0);
    return out.toDataURL("image/png");
  };

  const submit = (keepOnly: boolean) => {
    if (!undoCount && !imported && mode === "blank") {
      notify("La page est vide : dessinez d'abord la case");
      return;
    }
    onSubmit({ composite: flatten(), mode, prompt: prompt.trim(), keepOnly });
    onClose();
  };

  const changeMode = (next: SketchMode) => {
    if (next === mode) return;
    if (undoCount && !window.confirm("Changer de fond efface le dessin en cours. Continuer ?")) return;
    setMode(next);
    setUndoCount(0);
    setRedoCount(0);
    if (next === "over") setImported(null);
    setBgOpacity(next === "over" ? 0.75 : 1);
  };

  return (
    <dialog ref={dialog} className="studio-lightbox studio-sketch" onClose={onClose}>
      <div className="studio-sketch-body">
        <div className="studio-sketch-tools" role="toolbar" aria-label="Outils de dessin">
          <div className="studio-viewswitch" role="group" aria-label="Fond">
            <button type="button" className={`webtoon-mini ${mode === "blank" && !imported ? "is-active" : ""}`} onClick={() => { changeMode("blank"); setImported(null); setBgOpacity(1); }} title="Une page blanche au format de la case">Page blanche</button>
            <button type="button" className={`webtoon-mini ${mode === "over" ? "is-active" : ""}`} onClick={() => changeMode("over")} disabled={!hasImage} title="Dessiner par-dessus l'image de la case pour montrer ce qui doit changer">Sur l&apos;image</button>
            <button type="button" className={`webtoon-mini ${imported ? "is-active" : ""}`} onClick={() => importInput.current?.click()} title="Une photo de croquis papier ou une autre image, comme fond à reprendre">Importer…</button>
          </div>
          <div className="studio-viewswitch" role="group" aria-label="Outil">
            {TOOLS.map((t) => (
              <button key={t.id} type="button" className={`webtoon-mini ${tool === t.id ? "is-active" : ""}`} onClick={() => setTool(t.id)} title={`${t.hint} (touche ${t.key})`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="studio-sketch-colors" role="group" aria-label="Couleur">
            {COLORS.map((c) => (
              <button key={c} type="button" className={`studio-sketch-color ${color === c ? "is-active" : ""}`} style={{ background: c }} onClick={() => { setColor(c); if (tool === "eraser") setTool("pencil"); }} aria-label={`Couleur ${c}`} />
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Autre couleur" />
          </div>
          <label className="studio-sketch-range" title="Touches [ et ]">
            <span>Taille {width}</span>
            <input type="range" min={1} max={80} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
          </label>
          <label className="studio-sketch-range" title="Atténue le fond pour mieux voir le dessin ; la case finale part du fond entier">
            <span>Fond {Math.round(bgOpacity * 100)} %</span>
            <input type="range" min={0.1} max={1} step={0.05} value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} />
          </label>
          <div className="studio-viewswitch" role="group" aria-label="Zoom">
            {[1, 1.5, 2].map((z) => (
              <button key={z} type="button" className={`webtoon-mini ${zoom === z ? "is-active" : ""}`} onClick={() => setZoom(z)}>
                {Math.round(z * 100)} %
              </button>
            ))}
          </div>
          <span className="studio-sketch-history">
            <button type="button" className="webtoon-mini" onClick={() => step(true)} disabled={!undoCount} title="Annuler (Cmd+Z)">↶</button>
            <button type="button" className="webtoon-mini" onClick={() => step(false)} disabled={!redoCount} title="Rétablir (Cmd+Maj+Z)">↷</button>
            <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={clear} title="Efface tout le dessin, pas le fond">Effacer</button>
          </span>
        </div>

        <div className="studio-sketch-stage">
          <div className="studio-sketch-paper" style={{ aspectRatio: `${size.w} / ${size.h}`, width: `min(${zoom * 100}%, ${zoom * 72 * (size.w / size.h)}vh)` }}>
            <canvas ref={background} className="studio-sketch-bg" style={{ opacity: bgOpacity }} aria-hidden="true" />
            <canvas
              ref={ink}
              className={`studio-sketch-ink is-${tool}`}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onContextMenu={(e) => e.preventDefault()}
              aria-label="Zone de dessin"
            />
            {loading ? <span className="studio-sketch-loading">Chargement de l&apos;image…</span> : null}
          </div>
        </div>

        <div className="studio-sketch-foot">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode === "over" ? "Ce que vos traits veulent dire, si besoin (« il tient le médaillon dans la main droite »)" : "Ce que montre la case, si besoin. Par défaut, la description de la case ; les fiches de ses personnages sont jointes."}
          />
          <div className="studio-sketch-actions">
            <button type="button" className="webtoon-mini" onClick={onClose}>Annuler</button>
            <button type="button" className="webtoon-mini" onClick={() => submit(true)} title="Le dessin devient l'image de la case, tel quel">Garder mon dessin tel quel</button>
            <button type="button" className="webtoon-mini studio-primary" onClick={() => submit(false)} title={mode === "over" ? "Applique ce que montrent vos traits, puis les efface ; le reste de l'image ne bouge pas" : "Redessine votre croquis en case finale : même cadrage, mêmes poses, les personnages comme sur leurs fiches"}>
              {mode === "over" ? "Appliquer mes traits" : "Transformer en case finale"}
            </button>
          </div>
        </div>
        <input ref={importInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importFile(f); e.target.value = ""; }} />
      </div>
    </dialog>
  );
}

/**
 * The drawing turned into the panel: letterboxed to the model's size, sent
 * to the inpaint route in its sketch mode (with the panel's sheets), the
 * letterbox cropped away. Returns a PNG data URL at the drawing's size.
 */
export async function transformSketch(input: { slug: string; panel: WebtoonPanel; library: LibraryOverlay; quality: "high" | "medium"; composite: string; mode: SketchMode; prompt: string }): Promise<string> {
  const image = await loadImage(input.composite);
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const { sw, sh, dw, dh, ox, oy } = fit(w, h);
  const source = document.createElement("canvas");
  source.width = sw;
  source.height = sh;
  const sctx = source.getContext("2d")!;
  sctx.fillStyle = "#000";
  sctx.fillRect(0, 0, sw, sh);
  sctx.drawImage(image, ox, oy, dw, dh);
  const description = input.panel.description.split("STATE TO KEEP")[0].trim().slice(0, 700);
  const response = await fetch(`/api/webtoon/${input.slug}/inpaint`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
    body: JSON.stringify({
      panel: input.panel,
      image: source.toDataURL("image/jpeg", 0.92),
      prompt: input.prompt || (input.mode === "blank" ? description : ""),
      size: `${sw}x${sh}`,
      library: input.library,
      quality: input.quality,
      sketch: input.mode,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as { data_url?: string; error?: string };
  if (!response.ok || !payload.data_url) throw new Error(payload.error ?? `erreur ${response.status}`);
  const result = await loadImage(payload.data_url);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")!.drawImage(result, ox, oy, dw, dh, 0, 0, w, h);
  return out.toDataURL("image/png");
}
