"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { bubbleFont, sfxFont } from "@/components/webtoon/fonts";
import { ProgressBar } from "@/components/studio/ProgressBar";
import { PanelLettering } from "@/components/webtoon/PanelLettering";
import type { Locale } from "@/lib/i18n/config";
import { frameCenter, frameClass, frameStyle, frameWidth, imageStyle } from "@/lib/webtoon/frame";
import { freshMotion } from "@/lib/webtoon/motion";
import { WEBTOON_WIDTH, type Anchor, type WebtoonPanel } from "@/lib/webtoon/types";
import { ActionIcon } from "@/components/studio/ActionIcon";

type Drag =
  | { kind: "dialogue" | "tail" | "sfx" | "caption"; index: number }
  | { kind: "focal" }
  | { kind: "resize"; startY: number; startHeight: number; width: number }
  /** The whole panel dragged sideways on the strip. */
  | { kind: "move"; startX: number; startCenter: number; width: number; rootWidth: number }
  /** One side of the panel dragged: the other side stays where it is. */
  | { kind: "edge"; side: "left" | "right"; startX: number; startLeft: number; startRight: number; rootWidth: number }
  /** The image dragged inside its frame (reframing). */
  | { kind: "pan"; startX: number; startY: number; startFocal: Anchor; overflowX: number; overflowY: number };

type PanelCanvasProps = {
  panel: WebtoonPanel;
  locale: Locale;
  onChange: (changes: Partial<WebtoonPanel>) => void;
  /** Show the focal point handle (the crop centre of the image). */
  showFocal?: boolean;
  /** `strip`: one panel of the full strip, edge to edge, no frame around it. */
  variant?: "single" | "strip";
  selected?: boolean;
  /** A click on the panel (not on a handle) selects it. */
  onSelect?: () => void;
  /** Set while the panel's image is being drawn, retouched or waits its turn: a loader covers it. */
  busy?: PanelBusy;
  /** On the strip: in front of or behind the panels around it. */
  onLayer?: (direction: "front" | "back") => void;
  /** On the strip: delete this panel. */
  onDelete?: () => void;
  /** "Dupliquer": a copy of the panel right after it. */
  onDuplicate?: () => void;
};

/** What covers a panel while its image is made: the word shown, and the timing of its progress bar. */
export type PanelBusy = { label: string; started?: number; estimate?: number };

const BG: Record<WebtoonPanel["background"], string> = { white: "#f6f4ef", black: "#020409", abyss: "#020817" };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;
/** The width of the whole canvas (the strip), from any control inside it. */
const canvasWidth = (from: HTMLElement) => from.closest<HTMLElement>(".studio-canvas")?.offsetWidth || 1;

/**
 * The selected panel at working size, with the real lettering on top and a
 * handle on every movable thing: bubble, tail tip, SFX, caption, focal point.
 * Drag a handle to move it; drag the bottom edge to change the panel height.
 * On the strip, the selected panel also moves sideways ("Déplacer"), and its
 * left and right edges widen or narrow it; "Recadrer" pans and zooms the
 * image inside its frame (drag, wheel, slider), in both views.
 */
export function PanelCanvas({ panel, locale, onChange, showFocal = false, variant = "single", selected = false, onSelect, busy, onLayer, onDelete, onDuplicate }: PanelCanvasProps) {
  const surface = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  /** Reframing: the image pans under the pointer and zooms, the lettering handles step aside. */
  const [cropping, setCropping] = useState(false);
  const zoom = clamp(panel.image_zoom ?? 1, 1, 3);
  const hasImage = Boolean(panel.image.src && panel.image.status !== "missing");
  const canPlace = variant === "strip" && selected;
  const width = frameWidth(panel);
  const center = frameCenter(panel);

  // The wheel zooms while reframing: a listener that may cancel the page scroll, so not React's passive one.
  const zoomRef = useRef(zoom);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    zoomRef.current = zoom;
    onChangeRef.current = onChange;
  }, [zoom, onChange]);
  useEffect(() => {
    const el = surface.current;
    if (!el || !cropping) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const next = clamp(Math.round((zoomRef.current * (event.deltaY < 0 ? 1.06 : 1 / 1.06)) * 100) / 100, 1, 3);
      onChangeRef.current({ image_zoom: next <= 1.01 ? undefined : next });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [cropping]);
  useEffect(() => {
    if (!cropping) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") setCropping(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [cropping]);
  // Leaving the panel (another one selected) ends the reframing.
  const [croppedFor, setCroppedFor] = useState(panel.panel_id);
  if (croppedFor !== panel.panel_id || (variant === "strip" && !selected && cropping)) {
    setCroppedFor(panel.panel_id);
    if (cropping) setCropping(false);
  }

  /** How far the image overflows its frame, in px, at the current zoom: what a drag of the image can move. */
  const overflow = () => {
    const el = surface.current;
    const img = image.current;
    if (!el || !img || !img.naturalWidth) return { x: 0, y: 0 };
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const cover = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    return { x: Math.max(0, img.naturalWidth * cover - w), y: Math.max(0, img.naturalHeight * cover - h) };
  };

  const placeFrame = (nextWidth: number, nextCenter: number) => {
    const w = clamp(Math.round(nextWidth * 10) / 10, 40, 100);
    const limit = 50 - w / 2;
    let x = clamp(Math.round(nextCenter * 10) / 10, -limit, limit);
    // Near the middle, the panel snaps back to centred.
    if (Math.abs(x) < 1.2) x = 0;
    const frame = { ...(panel.frame ?? {}), width: w };
    delete frame.align;
    if (w >= 100 || x === 0) delete frame.x;
    else frame.x = x;
    onChange({ frame, ...(w < 100 ? { bleed: false } : {}) });
  };

  const toPercent = useCallback((event: ReactPointerEvent): Anchor | null => {
    const rect = surface.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return {
      x: round1(clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100)),
      y: round1(clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)),
    };
  }, []);

  const start = (next: Drag) => (event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag(next);
  };

  const move = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag) return;
    if (drag.kind === "move") {
      placeFrame(drag.width, drag.startCenter + ((event.clientX - drag.startX) / drag.rootWidth) * 100);
      return;
    }
    if (drag.kind === "edge") {
      const delta = ((event.clientX - drag.startX) / drag.rootWidth) * 100;
      const left = drag.side === "left" ? clamp(drag.startLeft + delta, 0, drag.startRight - 40) : drag.startLeft;
      const right = drag.side === "right" ? clamp(drag.startRight + delta, drag.startLeft + 40, 100) : drag.startRight;
      placeFrame(right - left, (left + right) / 2 - 50);
      return;
    }
    if (drag.kind === "pan") {
      const fx = drag.overflowX > 1 ? clamp(drag.startFocal.x - ((event.clientX - drag.startX) / drag.overflowX) * 100, 0, 100) : drag.startFocal.x;
      const fy = drag.overflowY > 1 ? clamp(drag.startFocal.y - ((event.clientY - drag.startY) / drag.overflowY) * 100, 0, 100) : drag.startFocal.y;
      onChange({ focal_point: { x: round1(fx), y: round1(fy) } });
      return;
    }
    if (drag.kind === "resize") {
      const delta = ((event.clientY - drag.startY) / drag.width) * WEBTOON_WIDTH;
      onChange({ panel_height: Math.round(clamp(drag.startHeight + delta, 240, 2600) / 10) * 10 });
      return;
    }
    const point = toPercent(event);
    if (!point) return;
    if (drag.kind === "focal") {
      onChange({ focal_point: point });
    } else if (drag.kind === "dialogue") {
      onChange({ dialogue: panel.dialogue.map((line, i) => (i === drag.index ? { ...line, anchor: point } : line)) });
    } else if (drag.kind === "tail") {
      onChange({ dialogue: panel.dialogue.map((line, i) => (i === drag.index ? { ...line, tail: point } : line)) });
    } else if (drag.kind === "sfx") {
      onChange({ sfx: panel.sfx.map((effect, i) => (i === drag.index ? { ...effect, anchor: point } : effect)) });
    } else if (drag.kind === "caption") {
      onChange({ caption: panel.caption.map((box, i) => (i === drag.index ? { ...box, anchor: point } : box)) });
    }
  };

  const end = () => setDrag(null);

  const handleStyle = (anchor: Anchor) => ({ left: `${anchor.x}%`, top: `${anchor.y}%` });

  return (
    <div
      className={`studio-canvas ${variant === "strip" ? "studio-canvas-strip" : ""} ${selected ? "is-selected" : ""} ${cropping ? "is-cropping" : ""} ${bubbleFont.variable} ${sfxFont.variable}`}
      style={{ background: BG[panel.background] }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onClick={onSelect}
      data-panel-id={panel.panel_id}
    >
      <div
        ref={surface}
        className={`webtoon-panel ${variant === "strip" ? frameClass(panel) : "webtoon-panel-bleed"} studio-canvas-panel ${panel.background === "white" ? "webtoon-panel-on-light" : "webtoon-panel-on-dark"} ${variant === "strip" && panel.border ? "webtoon-panel-bordered" : ""}`}
        style={{ aspectRatio: `${WEBTOON_WIDTH} / ${panel.panel_height}`, ...(variant === "strip" ? frameStyle(panel) : {}) }}
      >
        {panel.image.src && panel.image.status !== "missing" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={image}
            src={panel.image.src}
            alt={panel.description}
            width={panel.image.width || WEBTOON_WIDTH}
            height={panel.image.height || panel.panel_height}
            draggable={false}
            style={imageStyle(panel)}
          />
        ) : panel.caption.some((c) => c.style === "title") ? (
          <div className="webtoon-title-card" aria-hidden="true" />
        ) : (
          <div className={`webtoon-placeholder ${panel.background === "white" ? "webtoon-placeholder-light" : ""}`}>
            <span className="anime-label">{panel.panel_id}</span>
            <span>Pas encore d&apos;image</span>
          </div>
        )}
        <PanelLettering dialogue={panel.dialogue} caption={panel.caption} sfx={panel.sfx} locale={locale} />
        {freshMotion(panel) ? <span className="studio-motion-badge" title="Case animée : une boucle joue dans le lecteur quand la case est à l'écran">animée</span> : null}
        {busy ? (
          <div className={`studio-panel-busy ${busy.started ? "" : "is-soft"}`} role="status">
            {busy.started ? <span className="studio-spinner studio-spinner-lg" aria-hidden /> : null}
            <span>{busy.label}</span>
            {busy.started && busy.estimate ? <ProgressBar key={busy.started} startedAt={busy.started} estimateMs={busy.estimate} className="studio-panel-pbar" /> : null}
          </div>
        ) : null}

        {cropping ? (
          <div
            className="studio-crop-layer"
            onPointerDown={(event) => {
              const o = overflow();
              start({ kind: "pan", startX: event.clientX, startY: event.clientY, startFocal: panel.focal_point, overflowX: o.x, overflowY: o.y })(event);
            }}
            title="Glisse l'image pour la recadrer, molette ou curseur pour zoomer"
          >
            <div className="studio-crop-bar" onPointerDown={(event) => event.stopPropagation()}>
              <span>Zoom</span>
              <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => onChange({ image_zoom: Number(e.target.value) <= 1.01 ? undefined : Number(e.target.value) })} aria-label="Zoom de l'image" />
              <b>{Math.round(zoom * 100)} %</b>
              <button type="button" className="webtoon-mini" onClick={() => onChange({ image_zoom: undefined, focal_point: { x: 50, y: 50 } })}>Réinitialiser</button>
              <button type="button" className="webtoon-mini studio-primary" onClick={() => setCropping(false)}>Terminé</button>
            </div>
          </div>
        ) : null}

        <div className="studio-handles" aria-hidden="true" hidden={cropping}>
          {panel.dialogue.map((line, index) => (
            <div key={`d${index}`}>
              <button
                type="button"
                className={`studio-handle studio-handle-bubble ${drag?.kind === "dialogue" && drag.index === index ? "is-active" : ""}`}
                style={handleStyle(line.anchor)}
                title={`Bulle ${index + 1}`}
                onPointerDown={start({ kind: "dialogue", index })}
              />
              {line.tail && line.style !== "off" ? (
                <button
                  type="button"
                  className={`studio-handle studio-handle-tail ${drag?.kind === "tail" && drag.index === index ? "is-active" : ""}`}
                  style={handleStyle(line.tail)}
                  title={`Pointe de la bulle ${index + 1}`}
                  onPointerDown={start({ kind: "tail", index })}
                />
              ) : null}
            </div>
          ))}
          {panel.sfx.map((effect, index) => (
            <button
              key={`s${index}`}
              type="button"
              className={`studio-handle studio-handle-sfx ${drag?.kind === "sfx" && drag.index === index ? "is-active" : ""}`}
              style={handleStyle(effect.anchor)}
              title={`Son ${index + 1}`}
              onPointerDown={start({ kind: "sfx", index })}
            />
          ))}
          {panel.caption.map((box, index) => (
            <button
              key={`c${index}`}
              type="button"
              className={`studio-handle studio-handle-caption ${drag?.kind === "caption" && drag.index === index ? "is-active" : ""}`}
              style={handleStyle(box.anchor)}
              title={`Cartouche ${index + 1}`}
              onPointerDown={start({ kind: "caption", index })}
            />
          ))}
          {showFocal ? (
            <button
              type="button"
              className={`studio-handle studio-handle-focal ${drag?.kind === "focal" ? "is-active" : ""}`}
              style={handleStyle(panel.focal_point)}
              title="Point focal du cadrage"
              onPointerDown={start({ kind: "focal" })}
            />
          ) : null}
        </div>
      </div>
      {(canPlace || variant === "single") && !cropping ? (
        <div className="studio-place-bar" style={variant === "strip" ? { left: `${50 + center}%` } : undefined}>
          {canPlace ? (
            <button
              type="button"
              className={`studio-place-move ${drag?.kind === "move" ? "is-active" : ""}`}
              title="Glisse à gauche ou à droite pour déplacer la case sur la bande (elle se recentre près du milieu)"
              onPointerDown={(event) => start({ kind: "move", startX: event.clientX, startCenter: center, width, rootWidth: canvasWidth(event.currentTarget) })(event)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 9l-3 3 3 3M19 9l3 3-3 3M2 12h20" />
              </svg>
              Déplacer
            </button>
          ) : null}
          {canPlace && onLayer ? (
            <>
              <button type="button" className="studio-place-crop" title="Mettre au-dessus : devant les cases voisines, là où elles se chevauchent" onClick={(event) => { event.stopPropagation(); onLayer("front"); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3l9 5-9 5-9-5 9-5z" />
                  <path d="M3 16l9 5 9-5" opacity="0.45" />
                </svg>
                Au-dessus
              </button>
              <button type="button" className="studio-place-crop" title="Mettre en dessous : derrière les cases voisines, là où elles se chevauchent" onClick={(event) => { event.stopPropagation(); onLayer("back"); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3l9 5-9 5-9-5 9-5z" opacity="0.45" />
                  <path d="M3 16l9 5 9-5" />
                </svg>
                En dessous
              </button>
            </>
          ) : null}
          {hasImage ? (
            <button type="button" className="studio-place-crop" title="Recadrer l'image dans la case : glisser pour la déplacer, molette pour zoomer" onClick={(event) => { event.stopPropagation(); setCropping(true); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2" />
              </svg>
              Recadrer
            </button>
          ) : null}
          {canPlace && onDuplicate ? (
            <button type="button" className="studio-place-crop" title="Dupliquer cette case juste après elle (Cmd+D)" onClick={(event) => { event.stopPropagation(); onDuplicate(); }}>
              <ActionIcon name="duplicate" size={13} />
              Dupliquer
            </button>
          ) : null}
          {canPlace && onDelete ? (
            <button type="button" className="studio-place-crop studio-place-delete" title="Supprimer cette case (touche Suppr)" onClick={(event) => { event.stopPropagation(); onDelete(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
              </svg>
              Supprimer
            </button>
          ) : null}
        </div>
      ) : null}
      {canPlace && !cropping
        ? (["left", "right"] as const).map((side) => (
            <button
              key={side}
              type="button"
              className={`studio-edge studio-edge-${side} ${drag?.kind === "edge" && drag.side === side ? "is-active" : ""}`}
              style={{ left: `${side === "left" ? 50 + center - width / 2 : 50 + center + width / 2}%` }}
              title="Glisse ce bord pour élargir ou rétrécir la case"
              aria-label={side === "left" ? "Bord gauche de la case" : "Bord droit de la case"}
              onPointerDown={(event) =>
                start({ kind: "edge", side, startX: event.clientX, startLeft: 50 + center - width / 2, startRight: 50 + center + width / 2, rootWidth: canvasWidth(event.currentTarget) })(event)
              }
            />
          ))
        : null}
      <button
        type="button"
        className={`studio-resize ${drag?.kind === "resize" ? "is-active" : ""}`}
        title="Hauteur de la case : glisse vers le bas pour l'allonger, vers le haut pour la raccourcir. L'image est recadrée, jamais étirée."
        onPointerDown={(event) => {
          const surfaceWidth = surface.current?.offsetWidth || WEBTOON_WIDTH;
          start({ kind: "resize", startY: event.clientY, startHeight: panel.panel_height, width: surfaceWidth })(event);
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" />
        </svg>
        <span>Hauteur · {panel.panel_height} px</span>
      </button>
    </div>
  );
}
