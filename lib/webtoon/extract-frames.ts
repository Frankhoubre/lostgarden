"use client";

/**
 * FRAMES OF A FILM, in the browser: the video is read by a <video> element
 * and drawn on a canvas at every second, never uploaded. Each frame is a
 * 640 px JPEG handed to `onFrame` (which sends it to Storage) while the next
 * one is being read, a few uploads at a time. The engine works on one frame
 * per second: the continuity supervisor, the events, the bible detection.
 */

export type VideoInfo = { duration: number; width: number; height: number };

export function loadVideo(file: File): Promise<{ video: HTMLVideoElement; info: VideoInfo; release: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const release = () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };
    video.onloadedmetadata = () => {
      if (!Number.isFinite(video.duration) || !video.videoWidth) {
        release();
        reject(new Error("Cette vidéo ne se lit pas dans le navigateur. Exportez-la en MP4 (H.264) et réessayez."));
        return;
      }
      resolve({ video, info: { duration: video.duration, width: video.videoWidth, height: video.videoHeight }, release });
    };
    video.onerror = () => {
      window.clearTimeout(slow);
      release();
      reject(new Error("Cette vidéo ne se lit pas dans le navigateur. Exportez-la en MP4 (H.264) et réessayez."));
    };
    // Chrome does not load a video in a tab that has never been shown: say so rather than wait forever.
    const slow = window.setTimeout(() => {
      if (video.readyState > 0) return;
      release();
      reject(new Error(document.hidden ? "Le navigateur ne lit pas la vidéo tant que cet onglet est en arrière-plan : affichez l'onglet, puis choisissez à nouveau la vidéo." : "La vidéo ne se charge pas. Exportez-la en MP4 (H.264) et réessayez."));
    }, 15000);
    video.addEventListener("loadedmetadata", () => window.clearTimeout(slow), { once: true });
    video.src = url;
  });
}

function seek(video: HTMLVideoElement, seconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      video.removeEventListener("error", fail);
      resolve();
    };
    const fail = () => {
      video.removeEventListener("seeked", done);
      video.removeEventListener("error", fail);
      reject(new Error("Lecture de la vidéo interrompue"));
    };
    video.addEventListener("seeked", done);
    video.addEventListener("error", fail);
    video.currentTime = seconds;
  });
}

export async function extractFrames(input: {
  file: File;
  /** Seconds between two frames. */
  interval?: number;
  /** Width of the frames, in px. */
  width?: number;
  /** Seconds already extracted, skipped (a resumed extraction). */
  skip?: ReadonlySet<number>;
  onFrame: (seconds: number, blob: Blob) => Promise<void>;
  onProgress?: (state: { read: number; sent: number; total: number }) => void;
  shouldStop?: () => boolean;
}): Promise<VideoInfo> {
  const interval = input.interval ?? 1;
  const { video, info, release } = await loadVideo(input.file);
  const width = Math.min(input.width ?? 640, info.width);
  const height = Math.round((info.height * width) / info.width);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible");
  const times: number[] = [];
  for (let t = 0; t < info.duration - 0.05; t += interval) times.push(Math.round(t));
  const total = times.length;
  let read = 0;
  let sent = 0;
  const pending = new Set<Promise<void>>();
  const errors: Error[] = [];
  try {
    for (const seconds of times) {
      if (input.shouldStop?.()) break;
      if (input.skip?.has(seconds)) {
        read += 1;
        sent += 1;
        input.onProgress?.({ read, sent, total });
        continue;
      }
      // A little after the second, so a cut exactly on it shows the new shot.
      await seek(video, Math.min(info.duration - 0.05, seconds + 0.04));
      context.drawImage(video, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
      read += 1;
      input.onProgress?.({ read, sent, total });
      if (!blob) continue;
      const upload = input
        .onFrame(seconds, blob)
        .then(() => {
          sent += 1;
          input.onProgress?.({ read, sent, total });
        })
        .catch((error: unknown) => {
          errors.push(error instanceof Error ? error : new Error(String(error)));
        })
        .finally(() => pending.delete(upload));
      pending.add(upload);
      // A few uploads in flight while the next frames are read.
      if (pending.size >= 6) await Promise.race(pending);
      if (errors.length >= 5) throw errors[0];
    }
    await Promise.all(pending);
    if (errors.length) throw errors[0];
  } finally {
    release();
  }
  return info;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")} min` : m ? `${m} min ${String(r).padStart(2, "0")} s` : `${r} s`;
}
