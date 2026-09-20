"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { bubbleFont, sfxFont } from "@/components/webtoon/fonts";
import { PanelLettering } from "@/components/webtoon/PanelLettering";
import type { Locale } from "@/lib/i18n/config";
import { WEBTOON_WIDTH, type Anchor, type WebtoonPanel } from "@/lib/webtoon/types";

type Drag =
  | { kind: "dialogue" | "tail" | "sfx" | "caption"; index: number }
  | { kind: "focal" }
  | { kind: "resize"; startY: number; startHeight: number; width: number };

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
};

const BG: Record<WebtoonPanel["background"], string> = { white: "#f6f4ef", black: "#020409", abyss: "#020817" };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * The selected panel at working size, with the real lettering on top and a
 * handle on every movable thing: bubble, tail tip, SFX, caption, focal point.
 * Drag a handle to move it; drag the bottom edge to change the panel height.
 */
export function PanelCanvas({ panel, locale, onChange, showFocal = false, variant = "single", selected = false, onSelect }: PanelCanvasProps) {
  const surface = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

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
      className={`studio-canvas ${variant === "strip" ? "studio-canvas-strip" : ""} ${selected ? "is-selected" : ""} ${bubbleFont.variable} ${sfxFont.variable}`}
      style={{ background: BG[panel.background] }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onClick={onSelect}
      data-panel-id={panel.panel_id}
    >
      <div
        ref={surface}
        className={`webtoon-panel ${variant === "strip" && !panel.bleed ? "webtoon-panel-framed" : "webtoon-panel-bleed"} studio-canvas-panel ${panel.background === "white" ? "webtoon-panel-on-light" : "webtoon-panel-on-dark"} ${variant === "strip" && panel.border ? "webtoon-panel-bordered" : ""}`}
        style={{ aspectRatio: `${WEBTOON_WIDTH} / ${panel.panel_height}` }}
      >
        {panel.image.src && panel.image.status !== "missing" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={panel.image.src}
            alt={panel.description}
            width={panel.image.width || WEBTOON_WIDTH}
            height={panel.image.height || panel.panel_height}
            draggable={false}
            style={{ objectPosition: `${panel.focal_point.x}% ${panel.focal_point.y}%` }}
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

        <div className="studio-handles" aria-hidden="true">
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
      <button
        type="button"
        className="studio-resize"
        title="Glisser pour changer la hauteur de la case"
        onPointerDown={(event) => {
          const width = surface.current?.getBoundingClientRect().width ?? WEBTOON_WIDTH;
          start({ kind: "resize", startY: event.clientY, startHeight: panel.panel_height, width })(event);
        }}
      >
        <span>{panel.panel_height} px</span>
      </button>
    </div>
  );
}
