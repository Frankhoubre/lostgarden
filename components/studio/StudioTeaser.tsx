"use client";

import { strToU8, zip } from "fflate";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ProgressBar } from "@/components/studio/ProgressBar";
import { openRowCapture, panelBox, readyStrip, wait } from "@/components/studio/strip-capture";
import { WebtoonReader } from "@/components/webtoon/WebtoonReader";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { PANEL_BACKGROUND_COLORS, type NarrativeRole, type WebtoonPanel } from "@/lib/webtoon/types";

/** The reel: vertical 1080 x 1920. The carousel: 4:5, 1080 x 1350. */
const WIDTH = 1080;
const REEL_HEIGHT = 1920;
const SLIDE_HEIGHT = 1350;
/** Panels of the reel at most, and of the suggested run. */
const MAX_REEL = 24;
const SUGGESTED = 8;
/** Panels shown one per slide in the carousel, between the cover and the teased next panel. */
const PANEL_SLIDES = 6;
/** Reading pace, in ms: pause on a centred panel, glide to the next one, last hold, final card. */
const HOLD = 1600;
const GLIDE = 700;
const LAST_HOLD = 1500;
const CARD = 2000;
const FPS = 30;
const BITRATE = 12_000_000;
const SITE = "lostgarden.world";

const COPY: Record<Locale, { episode: (n: number) => string; read: string; more: string }> = {
  fr: { episode: (n) => `Épisode ${n}`, read: `Lire sur ${SITE}`, more: `La suite sur ${SITE}` },
  en: { episode: (n) => `Episode ${n}`, read: `Read on ${SITE}`, more: `Continue on ${SITE}` },
  ja: { episode: (n) => `第${n}話`, read: `${SITE} で読む`, more: `続きは ${SITE} で` },
  ko: { episode: (n) => `제${n}화`, read: `${SITE}에서 읽기`, more: `다음 이야기는 ${SITE}에서` },
};

/** How much a panel sells the episode: action and reveals first, a sound effect adds a little. */
const ROLE_WEIGHT: Partial<Record<NarrativeRole, number>> = { action: 3, reveal: 3, cliffhanger: 3, tension: 2, reaction: 1, character_intro: 1 };
const drawn = (p: WebtoonPanel) => Boolean(p.image.src) && p.image.status !== "missing";
const strength = (p: WebtoonPanel) => (drawn(p) ? (ROLE_WEIGHT[p.narrative_role] ?? 0) + Math.min(2, p.sfx.length) * 0.5 : -10);

/** The run of consecutive drawn panels with the most action (0-based, inclusive). */
export function suggestRun(panels: WebtoonPanel[], size = SUGGESTED): { from: number; to: number } {
  if (panels.length <= size) return { from: 0, to: Math.max(0, panels.length - 1) };
  let best = { from: 0, score: -Infinity };
  for (let start = 0; start + size <= panels.length; start += 1) {
    // A panel without an image costs more than any action earns: the run stays drawn when it can.
    const score = panels.slice(start, start + size).reduce((sum, p) => sum + (drawn(p) ? 10 + strength(p) : 0), 0);
    if (score > best.score) best = { from: start, score };
  }
  return { from: best.from, to: best.from + size - 1 };
}

/** The recorder's best format here: H.264 in MP4 when the browser records it (recent Chrome, Safari), WebM otherwise. */
function pickVideoFormat(): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = ["video/mp4;codecs=avc1.640028", "video/mp4;codecs=avc1.4d0028", "video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  const mime = candidates.find((type) => MediaRecorder.isTypeSupported(type));
  return mime ? { mime, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" } : null;
}

/** The site's display face (Oswald, loaded by the root layout), with faces that carry Japanese and Korean. */
function displayFamily(): string {
  const site = getComputedStyle(document.documentElement).getPropertyValue("--font-oswald").trim();
  return `${site ? `${site}, ` : ""}"Arial Narrow", "Hiragino Sans", "Apple SD Gothic Neo", "Noto Sans CJK JP", sans-serif`;
}

const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "webtoon";

/** One captured row of the strip, and where its panel sits in it (canvas px, at 1 080 wide). */
type Shot = { canvas: HTMLCanvasElement; top: number; panel: { x: number; y: number; width: number; height: number }; bg: string; source: WebtoonPanel };

type Rect = { x: number; y: number; width: number; height: number };

/** Draws the source rect so it covers the target, keeping the focal point (percent of the rect) in view. */
function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, src: Rect, dst: Rect, focal = { x: 50, y: 50 }) {
  const scale = Math.max(dst.width / src.width, dst.height / src.height);
  const w = dst.width / scale;
  const h = dst.height / scale;
  const x = Math.min(src.x + src.width - w, Math.max(src.x, src.x + (src.width * focal.x) / 100 - w / 2));
  const y = Math.min(src.y + src.height - h, Math.max(src.y, src.y + (src.height * focal.y) / 100 - h / 2));
  ctx.drawImage(img, x, y, w, h, dst.x, dst.y, dst.width, dst.height);
}

/** Draws the source rect whole inside the target, centred, enlarged 1.5 times at most (the capture is at reading size). */
function drawContain(ctx: CanvasRenderingContext2D, img: CanvasImageSource, src: Rect, dst: Rect) {
  const scale = Math.min(1.5, dst.width / src.width, dst.height / src.height);
  const w = src.width * scale;
  const h = src.height * scale;
  ctx.drawImage(img, src.x, src.y, src.width, src.height, dst.x + (dst.width - w) / 2, dst.y + (dst.height - h) / 2, w, h);
}

/** A line of text centred on x, shrunk until it fits the width. */
function centredText(ctx: CanvasRenderingContext2D, text: string, y: number, weight: number, size: number, family: string, maxWidth = WIDTH - 120) {
  let px = size;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 18 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, WIDTH / 2, y);
}

function newCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  return [canvas, ctx];
}

/** A capture brought to the reel's width, whatever the capture scale was. */
function atWidth(capture: HTMLCanvasElement): HTMLCanvasElement {
  if (capture.width === WIDTH) return capture;
  const [canvas, ctx] = newCanvas(WIDTH, Math.round((capture.height * WIDTH) / capture.width));
  ctx.drawImage(capture, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const toPng = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("image du carrousel impossible"))), "image/png"));

/** The panel's own image, without lettering, for the cover; null when it cannot be read (the captured panel is used then). */
async function rawImage(panel: WebtoonPanel): Promise<ImageBitmap | null> {
  try {
    const response = await fetch(panel.image.src, { mode: "cors", cache: "force-cache" });
    if (!response.ok) return null;
    return await createImageBitmap(await response.blob());
  } catch {
    return null;
  }
}

/**
 * The carousel: the strongest image of the run under the title, then one
 * panel per slide with its lettering, then the next panel blurred with where
 * to read the rest.
 */
async function buildCarousel(run: Shot[], next: Shot, copy: (typeof COPY)[Locale], series: string, episode: number, family: string): Promise<Blob[]> {
  const slides: Blob[] = [];
  const cover = run.reduce((best, shot) =>
    strength(shot.source) > strength(best.source) || (strength(shot.source) === strength(best.source) && shot.panel.height > best.panel.height) ? shot : best,
  );

  // 1. The cover: the image full frame, a dark fall at the bottom, the title and the episode.
  {
    const [canvas, ctx] = newCanvas(WIDTH, SLIDE_HEIGHT);
    ctx.fillStyle = PANEL_BACKGROUND_COLORS.abyss;
    ctx.fillRect(0, 0, WIDTH, SLIDE_HEIGHT);
    const frame = { x: 0, y: 0, width: WIDTH, height: SLIDE_HEIGHT };
    const raw = await rawImage(cover.source);
    if (raw) {
      drawCover(ctx, raw, { x: 0, y: 0, width: raw.width, height: raw.height }, frame, cover.source.focal_point);
      raw.close();
    } else {
      drawCover(ctx, cover.canvas, cover.panel, frame, cover.source.focal_point);
    }
    const fall = ctx.createLinearGradient(0, SLIDE_HEIGHT * 0.55, 0, SLIDE_HEIGHT);
    fall.addColorStop(0, "rgba(2, 8, 23, 0)");
    fall.addColorStop(1, "rgba(2, 8, 23, 0.94)");
    ctx.fillStyle = fall;
    ctx.fillRect(0, 0, WIDTH, SLIDE_HEIGHT);
    ctx.fillStyle = "#f6f4ef";
    ctx.shadowColor = "rgba(246, 244, 239, 0.35)";
    ctx.shadowBlur = 28;
    centredText(ctx, series, SLIDE_HEIGHT - 150, 700, 116, family);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(246, 244, 239, 0.78)";
    centredText(ctx, copy.episode(episode), SLIDE_HEIGHT - 82, 500, 40, family);
    slides.push(await toPng(canvas));
  }

  // 2 to 7. The strongest panels of the run, in reading order, the cover left out when others are enough.
  const pool = run.length > PANEL_SLIDES ? run.filter((shot) => shot !== cover) : run;
  const kept = new Set(
    [...pool]
      .map((shot, index) => ({ shot, index }))
      .sort((a, b) => strength(b.shot.source) - strength(a.shot.source) || a.index - b.index)
      .slice(0, PANEL_SLIDES)
      .map((entry) => entry.shot),
  );
  for (const shot of pool.filter((s) => kept.has(s))) {
    const [canvas, ctx] = newCanvas(WIDTH, SLIDE_HEIGHT);
    ctx.fillStyle = shot.bg;
    ctx.fillRect(0, 0, WIDTH, SLIDE_HEIGHT);
    drawContain(ctx, shot.canvas, shot.panel, { x: 40, y: 40, width: WIDTH - 80, height: SLIDE_HEIGHT - 80 });
    slides.push(await toPng(canvas));
  }

  // Last. The next panel, blurred, and where the rest is.
  {
    const [canvas, ctx] = newCanvas(WIDTH, SLIDE_HEIGHT);
    ctx.fillStyle = next.bg;
    ctx.fillRect(0, 0, WIDTH, SLIDE_HEIGHT);
    // Drawn past the edges, so the blur does not darken them.
    const over = { x: -90, y: -90, width: WIDTH + 180, height: SLIDE_HEIGHT + 180 };
    if (typeof ctx.filter === "string") {
      ctx.filter = "blur(38px)";
      drawCover(ctx, next.canvas, next.panel, over, next.source.focal_point);
      ctx.filter = "none";
    } else {
      // No canvas filter (older Safari): drawn small then enlarged in two steps.
      const [small, smallCtx] = newCanvas(Math.round(WIDTH / 16), Math.round(SLIDE_HEIGHT / 16));
      drawCover(smallCtx, next.canvas, next.panel, { x: 0, y: 0, width: small.width, height: small.height }, next.source.focal_point);
      const [middle, middleCtx] = newCanvas(Math.round(WIDTH / 4), Math.round(SLIDE_HEIGHT / 4));
      middleCtx.drawImage(small, 0, 0, middle.width, middle.height);
      ctx.drawImage(middle, 0, 0, WIDTH, SLIDE_HEIGHT);
    }
    ctx.fillStyle = "rgba(2, 8, 23, 0.5)";
    ctx.fillRect(0, 0, WIDTH, SLIDE_HEIGHT);
    ctx.fillStyle = "#f6f4ef";
    ctx.shadowColor = "rgba(246, 244, 239, 0.4)";
    ctx.shadowBlur = 30;
    centredText(ctx, copy.more, SLIDE_HEIGHT / 2 + 28, 700, 80, family);
    slides.push(await toPng(canvas));
  }
  return slides;
}

/** The camera stops of the reel: each panel centred, a panel taller than the frame read from its top to its bottom. */
function cameraStops(run: Shot[]): number[] {
  const stops: number[] = [];
  for (const shot of run) {
    const top = shot.top + shot.panel.y;
    const bottom = top + shot.panel.height;
    if (shot.panel.height + 120 <= REEL_HEIGHT) stops.push((top + bottom) / 2 - REEL_HEIGHT / 2);
    else stops.push(top - 60, bottom + 60 - REEL_HEIGHT);
  }
  return stops;
}

type Segment = { from: number; to: number; ms: number };

/** Holds and glides between the stops: a glide between panels at the reading pace, a slower pan inside a tall panel. */
function timeline(run: Shot[]): { segments: Segment[]; total: number } {
  const stops = cameraStops(run);
  const panelOfStop: number[] = [];
  run.forEach((shot, index) => {
    panelOfStop.push(index);
    if (shot.panel.height + 120 > REEL_HEIGHT) panelOfStop.push(index);
  });
  const segments: Segment[] = [];
  stops.forEach((stop, i) => {
    if (i > 0) {
      const distance = Math.abs(stop - stops[i - 1]);
      const inside = panelOfStop[i] === panelOfStop[i - 1];
      const ms = inside ? Math.min(3200, Math.max(1200, distance * 1.1)) : Math.min(1300, Math.max(GLIDE, distance * 0.35));
      segments.push({ from: stops[i - 1], to: stop, ms });
    }
    // Inside a tall panel, the top is only a short beat before the pan.
    const holdsTop = i + 1 < stops.length && panelOfStop[i + 1] === panelOfStop[i];
    segments.push({ from: stop, to: stop, ms: i === stops.length - 1 ? LAST_HOLD : holdsTop ? 900 : HOLD });
  });
  return { segments, total: segments.reduce((sum, s) => sum + s.ms, 0) + CARD };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Records the reel in real time: the strip scrolls in a 1080 x 1920 canvas
 * at the reading pace, then the final card. The canvas is the live preview.
 */
async function recordReel(
  canvas: HTMLCanvasElement,
  run: Shot[],
  format: { mime: string; ext: string },
  card: { series: string; episode: string; read: string; family: string },
  stopped: () => boolean,
): Promise<Blob> {
  canvas.width = WIDTH;
  canvas.height = REEL_HEIGHT;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  const { segments, total } = timeline(run);
  const scrollAt = (t: number): number | null => {
    let start = 0;
    for (const segment of segments) {
      if (t < start + segment.ms) return segment.from + (segment.to - segment.from) * easeInOut((t - start) / segment.ms);
      start += segment.ms;
    }
    return null;
  };
  const drawStrip = (y: number) => {
    // Above the first row and below the last, the strip's own background goes on.
    const middle = y + REEL_HEIGHT / 2;
    const around = run.find((shot) => middle >= shot.top && middle < shot.top + shot.canvas.height) ?? (middle < run[0].top ? run[0] : run[run.length - 1]);
    ctx.fillStyle = around.bg;
    ctx.fillRect(0, 0, WIDTH, REEL_HEIGHT);
    for (const shot of run) {
      if (shot.top + shot.canvas.height < y || shot.top > y + REEL_HEIGHT) continue;
      ctx.drawImage(shot.canvas, 0, Math.round(shot.top - y), WIDTH, shot.canvas.height);
    }
  };
  const drawCard = (t: number) => {
    ctx.fillStyle = PANEL_BACKGROUND_COLORS.abyss;
    ctx.fillRect(0, 0, WIDTH, REEL_HEIGHT);
    ctx.globalAlpha = Math.min(1, t / 300);
    ctx.fillStyle = "#f6f4ef";
    ctx.shadowColor = "rgba(246, 244, 239, 0.35)";
    ctx.shadowBlur = 36;
    centredText(ctx, card.series, 900, 700, 150, card.family);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(246, 244, 239, 0.8)";
    centredText(ctx, card.episode, 1000, 500, 60, card.family);
    centredText(ctx, card.read, 1560, 500, 50, card.family);
    ctx.globalAlpha = 1;
  };
  const draw = (t: number) => {
    const y = scrollAt(t);
    if (y === null) drawCard(t - (total - CARD));
    else drawStrip(y);
  };

  draw(0);
  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType: format.mime, videoBitsPerSecond: BITRATE });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  const ended = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });
  recorder.start(1000);
  try {
    await new Promise<void>((resolve, reject) => {
      const started = performance.now();
      const tick = () => {
        if (stopped()) return reject(new Error("teaser arrêté"));
        const t = performance.now() - started;
        draw(Math.min(t, total - 1));
        if (t >= total) return resolve();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    // The last frames reach the recorder before it stops.
    await wait(200);
  } finally {
    recorder.stop();
    await ended;
    for (const track of stream.getTracks()) track.stop();
  }
  return new Blob(chunks, { type: format.mime.split(";")[0] });
}

type Props = {
  slug: string;
  series: string;
  episode: number;
  panels: WebtoonPanel[];
  /** Panels ticked in the editor, in strip order: the run starts from them when there are some. */
  checkedIds: string[];
  onClose: () => void;
};

type Progress = { started: number; estimate: number; done: number; total: number; label: string };

/**
 * The social teaser, from the studio: for a run of panels, a vertical reel
 * that scrolls the strip at a reading pace (lettering in the chosen
 * language, a final card with where to read), and a 4:5 carousel, both from
 * the strip exactly as the reader draws it, in one ZIP. Nothing is published:
 * the files are for the author to post.
 */
export function StudioTeaser({ slug, series, episode, panels, checkedIds, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const reel = useRef<HTMLCanvasElement>(null);
  const stop = useRef(false);
  const [format] = useState(pickVideoFormat);
  const [locale, setLocale] = useState<Locale>("fr");
  const [origin, setOrigin] = useState<"checked" | "suggested" | "manual">(checkedIds.length ? "checked" : "suggested");
  const initial = () => {
    if (!checkedIds.length) return suggestRun(panels);
    const first = panels.findIndex((p) => p.panel_id === checkedIds[0]);
    const last = panels.findIndex((p) => p.panel_id === checkedIds[checkedIds.length - 1]);
    return { from: Math.max(0, first), to: Math.min(Math.max(0, first) + MAX_REEL - 1, Math.max(first, last)) };
  };
  const [range, setRange] = useState(initial);
  const [stage, setStage] = useState<{ panels: WebtoonPanel[]; locale: Locale } | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [recording, setRecording] = useState(false);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [download, setDownload] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  // The previews and the ZIP live as object URLs: freed when they are replaced or the window closes.
  useEffect(() => () => thumbs.forEach((url) => URL.revokeObjectURL(url)), [thumbs]);
  useEffect(() => () => {
    if (download) URL.revokeObjectURL(download.url);
  }, [download]);

  const count = range.to - range.from + 1;
  const valid = panels.length > 0 && range.from >= 0 && range.to < panels.length && count >= 1 && count <= MAX_REEL;
  const setBound = (bound: "from" | "to", value: number) => {
    if (!Number.isFinite(value)) return;
    const index = Math.min(panels.length - 1, Math.max(0, Math.round(value) - 1));
    setRange((current) => ({ ...current, [bound]: index }));
    setOrigin("manual");
  };
  const reset = (to: "checked" | "suggested") => {
    setOrigin(to);
    if (to === "suggested") setRange(suggestRun(panels));
    else setRange(initial());
  };

  const run = async () => {
    if (!valid || !format) return;
    stop.current = false;
    setError(null);
    setThumbs([]);
    setDownload(null);
    const chosen = panels.slice(range.from, range.to + 1);
    // The panel after the run, rendered with it for the teased last slide (the last of the run when there is none).
    const after = panels[range.to + 1] ?? null;
    const rendered = after ? [...chosen, after] : chosen;
    const copy = COPY[locale];
    const started = Date.now();
    const total = rendered.length + 2;
    const guessReel = chosen.length * (HOLD + GLIDE) + CARD + 1000;
    setProgress({ started, estimate: rendered.length * 1500 + 3000 + guessReel, done: 0, total, label: "Capture des cases" });
    try {
      setStage({ panels: rendered, locale });
      const strip = await readyStrip(() => host.current);
      const stripTop = strip.getBoundingClientRect().top;
      const { rows, capture, close } = await openRowCapture(strip);
      const shots: Shot[] = [];
      try {
        for (const [index, row] of rows.entries()) {
          if (stop.current) throw new Error("teaser arrêté");
          const canvas = atWidth(await capture(row));
          const rect = row.getBoundingClientRect();
          // Everything in px of the strip at 1 080 wide.
          const k = WIDTH / Math.max(1, rect.width);
          const box = panelBox(row);
          shots.push({
            canvas,
            top: (rect.top - stripTop) * k,
            panel: { x: box.x * k, y: box.y * k, width: box.width * k, height: box.height * k },
            bg: PANEL_BACKGROUND_COLORS[rendered[index].background],
            source: rendered[index],
          });
          const elapsed = Date.now() - started;
          setProgress({ started, estimate: elapsed + (elapsed / (index + 1)) * (rendered.length - index - 1) + 3000 + guessReel, done: index + 1, total, label: "Capture des cases" });
        }
      } finally {
        close();
        setStage(null);
      }
      const runShots = shots.slice(0, chosen.length);
      const nextShot = shots[chosen.length] ?? runShots[runShots.length - 1];

      const family = displayFamily();
      await Promise.all([document.fonts.load(`700 80px ${family}`, series), document.fonts.load(`500 40px ${family}`, copy.read)]).catch(() => undefined);
      const reelMs = timeline(runShots).total;
      setProgress({ started, estimate: Date.now() - started + 2500 + reelMs + 1000, done: rendered.length, total, label: "Carrousel" });
      const slides = await buildCarousel(runShots, nextShot, copy, series, episode, family);
      setThumbs(slides.map((blob) => URL.createObjectURL(blob)));

      if (stop.current) throw new Error("teaser arrêté");
      setProgress({ started, estimate: Date.now() - started + reelMs + 1500, done: rendered.length + 1, total, label: `Enregistrement de la vidéo (${Math.round(reelMs / 1000)} s, en temps réel)` });
      setRecording(true);
      // Let the preview canvas show before the recording starts.
      await wait(50);
      const canvas = reel.current;
      if (!canvas) throw new Error("aperçu de la vidéo introuvable");
      const video = await recordReel(canvas, runShots, format, { series, episode: copy.episode(episode), read: copy.read, family }, () => stop.current);

      const files: Record<string, Uint8Array> = {};
      files[`reel-${locale}.${format.ext}`] = new Uint8Array(await video.arrayBuffer());
      for (const [index, slide] of slides.entries()) files[`carrousel/${String(index + 1).padStart(2, "0")}.png`] = new Uint8Array(await slide.arrayBuffer());
      files["LISEZ-MOI.txt"] = strToU8(
        [
          `${series} · ${copy.episode(episode)} · teaser (${localeLabels[locale]})`,
          `Studio webtoon, ${new Date().toLocaleString("fr-FR")}, bande ${slug}.`,
          "",
          `Cases ${range.from + 1} à ${range.to + 1} (${chosen.map((p) => p.panel_id).join(", ")}).`,
          `reel-${locale}.${format.ext} : 1080 x 1920, ${Math.round(reelMs / 1000)} s, ${format.mime}, sans son.`,
          `carrousel/ : ${slides.length} images 1080 x 1350 (4:5), dans l'ordre des numéros.`,
        ].join("\n"),
      );
      const archive = await new Promise<Uint8Array>((resolve, reject) => zip(files, { level: 0 }, (err, data) => (err ? reject(err) : resolve(data))));
      const name = `${slugify(series)}-ep${episode}-teaser-${locale}.zip`;
      const url = URL.createObjectURL(new Blob([archive as BlobPart], { type: "application/zip" }));
      setDownload({ url, name });
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "teaser impossible");
    } finally {
      setStage(null);
      setProgress(null);
      setRecording(false);
    }
  };

  const busy = Boolean(progress);
  return (
    <dialog ref={dialog} className="studio-lightbox studio-export studio-teaser" onClose={onClose}>
      <div className="studio-export-body">
        <b>Teaser réseaux</b>
        <p className="text-xs text-ivory/70">
          Pour une suite de cases : un reel vertical qui fait défiler la bande au rythme de lecture, et un carrousel 4:5. Les deux dans un seul ZIP, rien n&apos;est publié.
        </p>
        <fieldset>
          <legend>Cases</legend>
          <div className="studio-teaser-range">
            <label>
              De la case
              <input type="number" min={1} max={panels.length} value={range.from + 1} onChange={(e) => setBound("from", e.target.valueAsNumber)} disabled={busy} />
            </label>
            <label>
              À la case
              <input type="number" min={1} max={panels.length} value={range.to + 1} onChange={(e) => setBound("to", e.target.valueAsNumber)} disabled={busy} />
            </label>
            <small>
              {count} case{count > 1 ? "s" : ""} · {panels[range.from]?.panel_id ?? "?"} à {panels[range.to]?.panel_id ?? "?"}
            </small>
          </div>
          <small>
            {origin === "checked" ? "D'après les cases cochées." : origin === "manual" ? "Choisies à la main." : "Suggestion : les 8 cases dessinées qui ont le plus d'action."}{" "}
            {checkedIds.length > 0 && origin !== "checked" ? (
              <button type="button" className="studio-teaser-link" onClick={() => reset("checked")} disabled={busy}>Reprendre les cases cochées</button>
            ) : null}
            {origin !== "suggested" ? (
              <button type="button" className="studio-teaser-link" onClick={() => reset("suggested")} disabled={busy}>Reprendre la suggestion</button>
            ) : null}
          </small>
          {count > MAX_REEL ? <small className="studio-history-error">{MAX_REEL} cases au plus pour le reel.</small> : null}
          {range.to < range.from ? <small className="studio-history-error">La dernière case vient avant la première.</small> : null}
        </fieldset>
        <fieldset>
          <legend>Langue des bulles et des textes</legend>
          <div className="flex flex-wrap gap-3">
            {locales.map((id) => (
              <label key={id}>
                <input type="radio" name="teaser-locale" checked={locale === id} onChange={() => setLocale(id)} disabled={busy} />
                {localeLabels[id]}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-xs text-ivory/70">
          {!format
            ? "Ce navigateur n'enregistre pas de vidéo : seul le carrousel pourrait sortir. Ouvrez le studio dans Chrome ou Safari."
            : format.ext === "mp4"
              ? "Vidéo en MP4 (H.264), 1080 x 1920, 30 images par seconde, sans son."
              : "Vidéo en WebM : ce navigateur n'enregistre pas le MP4 (Chrome récent et Safari le font). 1080 x 1920, sans son."}{" "}
          La vidéo s&apos;enregistre en temps réel : gardez cet onglet au premier plan.
        </p>
        {progress ? <ProgressBar startedAt={progress.started} estimateMs={progress.estimate} label={progress.label} done={progress.done} total={progress.total} /> : null}
        {error ? <p className="studio-history-error">{error}</p> : null}
        {recording || thumbs.length ? (
          <div className="studio-teaser-preview">
            <canvas ref={reel} className="studio-teaser-reel" width={WIDTH} height={REEL_HEIGHT} hidden={!recording} aria-label="Aperçu du reel" />
            {thumbs.length ? (
              <ol className="studio-teaser-slides" aria-label="Carrousel">
                {thumbs.map((url, index) => (
                  <li key={url}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Image ${index + 1} du carrousel`} width={WIDTH} height={SLIDE_HEIGHT} />
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {busy ? (
            <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => { stop.current = true; }}>Arrêter</button>
          ) : (
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void run()} disabled={!valid || !format}>
              Créer le teaser ({Math.max(0, count)} case{count > 1 ? "s" : ""}, {localeLabels[locale]})
            </button>
          )}
          {download && !busy ? (
            <a className="webtoon-mini" href={download.url} download={download.name}>Télécharger à nouveau</a>
          ) : null}
          <button type="button" className="webtoon-mini" onClick={onClose} disabled={busy}>Fermer</button>
        </div>
      </div>
      {stage
        ? createPortal(
            <div ref={host} className="studio-export-stage" aria-hidden="true">
              <WebtoonReader panels={stage.panels} locale={stage.locale} stills />
            </div>,
            document.body,
          )
        : null}
    </dialog>
  );
}
