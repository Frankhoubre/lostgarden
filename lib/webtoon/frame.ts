import type { CSSProperties } from "react";
import { WEBTOON_WIDTH, type PanelFrame, type WebtoonPanel } from "./types";

/**
 * The look of a panel on the strip, from its `frame`: width and side,
 * shape (slanted or wedged edges, rounded corners), overlap of the previous
 * panel, tilt, shadow. Shared by the public reader and the studio so both
 * show the same thing.
 */

const SHAPES: Record<NonNullable<PanelFrame["shape"]>, string | null> = {
  rect: null,
  rounded: null,
  slant: "polygon(0 0, 100% 4.5%, 100% 100%, 0 95.5%)",
  "slant-reverse": "polygon(0 4.5%, 100% 0, 100% 95.5%, 0 100%)",
  wedge: "polygon(0 0, 100% 0, 100% 100%, 0 91%)",
  "wedge-reverse": "polygon(0 0, 100% 0, 100% 91%, 0 100%)",
};

export function frameClass(panel: Pick<WebtoonPanel, "bleed" | "frame">): string {
  const width = panel.frame?.width ?? (panel.bleed ? 100 : 92);
  const classes = [width >= 100 ? "webtoon-panel-bleed" : "webtoon-panel-framed"];
  if (panel.frame?.shape === "rounded" || (width < 100 && !panel.frame?.shape)) classes.push("webtoon-panel-rounded");
  if (panel.frame?.shadow ?? width < 100) classes.push("webtoon-panel-shadow");
  if (panel.frame?.overlap) classes.push("webtoon-panel-over");
  return classes.join(" ");
}

export function frameStyle(panel: Pick<WebtoonPanel, "bleed" | "frame">): CSSProperties {
  const frame = panel.frame ?? {};
  const width = Math.min(100, Math.max(40, frame.width ?? (panel.bleed ? 100 : 92)));
  const style: CSSProperties = { width: `${width}%` };
  if (width < 100 && typeof frame.x === "number" && Number.isFinite(frame.x)) {
    // A free place, dragged in the studio: the centre moves, the panel never leaves the strip.
    const left = Math.min(100 - width, Math.max(0, 50 + frame.x - width / 2));
    style.marginLeft = `${left}%`;
    style.marginRight = "auto";
  } else if (width < 100) {
    const side = frame.align ?? "center";
    const margin = `${(100 - width) / 2}%`;
    if (side === "left") {
      style.marginLeft = "3%";
      style.marginRight = "auto";
    } else if (side === "right") {
      style.marginLeft = "auto";
      style.marginRight = "3%";
    } else {
      style.marginLeft = margin;
      style.marginRight = margin;
    }
  }
  const clip = frame.shape ? SHAPES[frame.shape] : null;
  if (clip) style.clipPath = clip;
  if (frame.overlap) style.marginTop = `-${(frame.overlap / WEBTOON_WIDTH) * 100}%`;
  if (frame.tilt) style.transform = `rotate(${Math.max(-6, Math.min(6, frame.tilt))}deg)`;
  // Every panel of the strip has its plane: 3 by default, one more for a panel laid over the previous one,
  // the author's choice otherwise. Always positive, so a panel set behind never slips under the page.
  style.zIndex = 3 + frameLayer(panel);
  return style;
}

/** The plane of a panel on the strip, -2 to 6 (the higher in front where panels overlap). */
export function frameLayer(panel: Pick<WebtoonPanel, "frame">): number {
  const z = panel.frame?.z;
  if (typeof z === "number" && Number.isFinite(z)) return Math.max(-2, Math.min(6, Math.round(z)));
  return panel.frame?.overlap ? 1 : 0;
}

/** The panel's centre, in percent of the strip from its middle, whatever set it (free place or side). */
export function frameCenter(panel: Pick<WebtoonPanel, "bleed" | "frame">): number {
  const frame = panel.frame ?? {};
  const width = Math.min(100, Math.max(40, frame.width ?? (panel.bleed ? 100 : 92)));
  if (width >= 100) return 0;
  if (typeof frame.x === "number" && Number.isFinite(frame.x)) return Math.min(50 - width / 2, Math.max(width / 2 - 50, frame.x));
  if (frame.align === "left") return 3 + width / 2 - 50;
  if (frame.align === "right") return 50 - 3 - width / 2;
  return 0;
}

/** The width of the panel on the strip, in percent. */
export function frameWidth(panel: Pick<WebtoonPanel, "bleed" | "frame">): number {
  return Math.min(100, Math.max(40, panel.frame?.width ?? (panel.bleed ? 100 : 92)));
}

/**
 * The image inside its frame: covered, placed on the focal point, zoomed
 * around it when the author reframed it. The zoomed box is the frame scaled
 * by the zoom and shifted by the same focal fractions, so the focal point
 * stays where object-position puts it and a drag moves the image under the
 * pointer (see PanelCanvas).
 */
export function imageStyle(panel: Pick<WebtoonPanel, "focal_point" | "image_zoom">): CSSProperties {
  const fx = panel.focal_point?.x ?? 50;
  const fy = panel.focal_point?.y ?? 50;
  const zoom = Math.min(3, Math.max(1, panel.image_zoom ?? 1));
  const style: CSSProperties = { objectPosition: `${fx}% ${fy}%` };
  if (zoom > 1.001) {
    style.inset = "auto";
    style.width = `${zoom * 100}%`;
    style.height = `${zoom * 100}%`;
    style.left = `${-(zoom - 1) * fx}%`;
    style.top = `${-(zoom - 1) * fy}%`;
    style.maxWidth = "none";
  }
  return style;
}
