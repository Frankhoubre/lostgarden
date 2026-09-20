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
  if (width < 100) {
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
  return style;
}
