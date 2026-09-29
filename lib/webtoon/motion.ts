import type { PanelMotion, WebtoonPanel } from "./types";

/**
 * Animated panels ("cases animées"): a short muted loop made from the
 * panel's own image, played by the public reader while the panel is on
 * screen. Shared by the studio and the `animate` route.
 *
 * Model: Seedance 1.5 Pro through Vercel AI Gateway, image to video with
 * the panel image as both first and last frame, so the loop closes on
 * itself without a jump. 720p without sound, 4 s at least (the model's
 * shortest clip).
 */
export const MOTION_MODEL = "bytedance/seedance-v1.5-pro";
export const MOTION_RESOLUTION = "720p";
/** Gateway price of the model at 720p without audio, per second of video. */
export const MOTION_USD_PER_SECOND = 0.0259;
export const MOTION_SECONDS = [4, 5, 6] as const;
export const MOTION_DEFAULT_SECONDS = 4;

export function motionSeconds(value: unknown): number {
  const n = Math.round(Number(value));
  return (MOTION_SECONDS as readonly number[]).includes(n) ? n : MOTION_DEFAULT_SECONDS;
}

export function motionEstimate(seconds: number): number {
  return Math.round(seconds * MOTION_USD_PER_SECOND * 1000) / 1000;
}

/** A motion made from the image the panel shows now; a new image makes it stale. */
export function freshMotion(panel: Pick<WebtoonPanel, "motion" | "image">): PanelMotion | null {
  const motion = panel.motion;
  if (!motion?.src || !panel.image.src || panel.image.status === "missing") return null;
  return motion.of === panel.image.src ? motion : null;
}

/** The default motion prompt: what the panel shows, animated as little as possible. */
export function defaultMotionPrompt(panel: Pick<WebtoonPanel, "description" | "action" | "emotion">): string {
  const scene = [panel.description, panel.action].map((part) => part.trim()).filter(Boolean).join(" ");
  return [
    scene ? `Scene: ${scene}` : "",
    "Animate this exact webtoon panel with subtle, slow, ambient motion only: hair, cloth, petals, light, particles, breathing, a blink.",
    "Camera mostly still, at most a very slow push in. Keep the drawing, line art, colours and framing exactly as they are.",
    "No new characters, objects or elements, no text, no speech bubbles, no cuts, no morphing. The last frame returns to the first image so the clip loops.",
  ]
    .filter(Boolean)
    .join("\n");
}
