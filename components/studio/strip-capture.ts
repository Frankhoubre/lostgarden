"use client";

import { createContext, destroyContext, domToCanvas } from "modern-screenshot";

/**
 * Capture of the strip exactly as the public reader draws it, shared by the
 * exports of the studio (platforms, social teaser). The strip is rendered off
 * screen at 1 080 px by the caller; this waits for its images and fonts, then
 * captures it row by row (one row = one panel with the gaps around it)
 * through a single capture context, so fonts, styles and images are read
 * once and not for every row.
 */

export const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * Waits for the strip rendered in the host (read after the wait: the host is
 * often mounted by the same state change that starts the export): every image
 * loaded (the reader loads them lazily), the fonts ready.
 */
export async function readyStrip(host: () => HTMLElement | null): Promise<HTMLElement> {
  // Let the strip render, its images start and its lettering settle.
  await wait(400);
  const strip = host()?.querySelector<HTMLElement>(".webtoon-strip");
  if (!strip) throw new Error("rendu de la bande introuvable");
  // Off screen, lazy images would never load: all of them now.
  const images = [...strip.querySelectorAll("img")];
  for (const img of images) img.loading = "eager";
  const loaded = (img: HTMLImageElement) =>
    img.complete && img.naturalWidth > 0
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
          window.setTimeout(resolve, 30_000);
        });
  await Promise.all(images.map(loaded));
  await document.fonts?.ready;
  await wait(300);
  return strip;
}

export type RowCapture = {
  /** The rows of the strip, in reading order. */
  rows: HTMLElement[];
  /** Captures one row at the strip's width (1 080 px at scale 1), on the row's own background. */
  capture: (row: HTMLElement) => Promise<HTMLCanvasElement>;
  close: () => void;
};

/** Opens the capture of a ready strip (see `readyStrip`). Close it once every row is captured. */
export async function openRowCapture(strip: HTMLElement): Promise<RowCapture> {
  const rows = [...strip.children] as HTMLElement[];
  if (!rows.length) throw new Error("la bande est vide");
  const context = await createContext(rows[0], {
    scale: 1,
    autoDestruct: false,
    backgroundColor: "#020409",
    fetch: { requestInit: { mode: "cors", cache: "force-cache" } },
  });
  return {
    rows,
    capture: async (row) => {
      context.node = row;
      context.backgroundColor = getComputedStyle(row).backgroundColor || "#020409";
      return domToCanvas(context);
    },
    close: () => destroyContext(context),
  };
}

/** Where the panel of a row sits inside the row, in px of the row (clamped to it). */
export function panelBox(row: HTMLElement): { x: number; y: number; width: number; height: number } {
  const outer = row.getBoundingClientRect();
  const panel = row.querySelector<HTMLElement>(".webtoon-panel");
  if (!panel) return { x: 0, y: 0, width: outer.width, height: outer.height };
  const inner = panel.getBoundingClientRect();
  const x = Math.max(0, inner.left - outer.left);
  const y = Math.max(0, inner.top - outer.top);
  return {
    x,
    y,
    width: Math.max(1, Math.min(outer.width - x, inner.width)),
    height: Math.max(1, Math.min(outer.height - y, inner.height)),
  };
}
