/**
 * Tiny pixel-art toolkit: sprites are authored as ASCII rows, each character
 * mapped to a colour through a palette. Everything is rasterised once into
 * offscreen canvases so drawing is a plain drawImage.
 */

export type Palette = Record<string, string>;

export type PixelArt = {
  rows: readonly string[];
  palette: Palette;
  /** Draw a 1px dark outline around the silhouette (default true). */
  outline?: boolean;
  /** Brighten top edges and darken bottom edges for volume (default true). */
  rim?: boolean;
  outlineColor?: string;
};

export type Sprite = {
  canvas: HTMLCanvasElement;
  flipped: HTMLCanvasElement;
  width: number;
  height: number;
  /** Outline padding added around the authored art. */
  pad: number;
};

const spriteCache = new Map<string, Sprite>();

export function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  return canvas;
}

function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rasterize(art: PixelArt): HTMLCanvasElement {
  const outline = art.outline ?? true;
  const rim = art.rim ?? true;
  const pad = outline ? 1 : 0;
  const width = art.rows.reduce((max, row) => Math.max(max, row.length), 0) + pad * 2;
  const height = art.rows.length + pad * 2;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const img = ctx.createImageData(width, height);
  const data = img.data;
  const opaque = new Uint8Array(width * height);
  const put = (x: number, y: number, r: number, g: number, b: number, a = 255) => {
    const i = (y * width + x) * 4;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  };
  for (let y = 0; y < art.rows.length; y += 1) {
    const row = art.rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const color = art.palette[ch];
      if (!color) continue;
      const [r, g, b] = parseHex(color);
      put(x + pad, y + pad, r, g, b);
      opaque[(y + pad) * width + x + pad] = 1;
    }
  }
  if (rim) {
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!opaque[y * width + x]) continue;
        const above = y > 0 && opaque[(y - 1) * width + x];
        const below = y < height - 1 && opaque[(y + 1) * width + x];
        const left = x > 0 && opaque[y * width + x - 1];
        const i = (y * width + x) * 4;
        if (!above || !left) {
          data[i] = clamp(data[i] + 28);
          data[i + 1] = clamp(data[i + 1] + 26);
          data[i + 2] = clamp(data[i + 2] + 22);
        } else if (!below) {
          data[i] = clamp(data[i] - 26);
          data[i + 1] = clamp(data[i + 1] - 26);
          data[i + 2] = clamp(data[i + 2] - 20);
        }
      }
    }
  }
  if (outline) {
    const [orr, og, ob] = parseHex(art.outlineColor ?? "#0b0b12");
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (opaque[y * width + x]) continue;
        const n =
          (y > 0 && opaque[(y - 1) * width + x]) ||
          (y < height - 1 && opaque[(y + 1) * width + x]) ||
          (x > 0 && opaque[y * width + x - 1]) ||
          (x < width - 1 && opaque[y * width + x + 1]);
        if (n) put(x, y, orr, og, ob, 230);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function flipCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = makeCanvas(source.width, source.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.translate(source.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

/** Build (and memoise) a sprite from ASCII art. `key` must be unique per art + palette. */
export function sprite(key: string, art: PixelArt): Sprite {
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const canvas = rasterize(art);
  const built: Sprite = {
    canvas,
    flipped: flipCanvas(canvas),
    width: canvas.width,
    height: canvas.height,
    pad: art.outline ?? true ? 1 : 0,
  };
  spriteCache.set(key, built);
  return built;
}

/** Overlay several ASCII layers of identical size. Later layers win where non-transparent. */
export function overlay(...layers: readonly (readonly string[])[]): string[] {
  const height = layers.reduce((max, l) => Math.max(max, l.length), 0);
  const width = layers.reduce(
    (max, l) => Math.max(max, ...l.map((r) => r.length)),
    0,
  );
  const out: string[] = [];
  for (let y = 0; y < height; y += 1) {
    let row = "";
    for (let x = 0; x < width; x += 1) {
      let ch = ".";
      for (const layer of layers) {
        const c = layer[y]?.[x];
        if (c && c !== "." && c !== " ") ch = c;
      }
      row += ch;
    }
    out.push(row);
  }
  return out;
}

/** Replace characters in ASCII art (e.g. hide a cape by mapping "c" to "."). */
export function remap(rows: readonly string[], map: Record<string, string>): string[] {
  return rows.map((row) =>
    row
      .split("")
      .map((ch) => (ch in map ? map[ch] : ch))
      .join(""),
  );
}

/** Tint helper: returns a darker/lighter hex variant. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (n & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
