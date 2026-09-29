"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { imageStyle } from "@/lib/webtoon/frame";
import { WEBTOON_WIDTH, type WebtoonPanel } from "@/lib/webtoon/types";

const REDUCED = "(prefers-reduced-motion: reduce)";
/** Soft edge where the loop meets the still, in percent of the image. */
const EDGE = 3;

function subscribeReduced(listener: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/** Where the image lands inside its element under object-fit: cover, in percent of the element. */
function coverRect(imageRatio: number, boxRatio: number, fx: number, fy: number): CSSProperties {
  if (imageRatio > boxRatio) {
    const width = (imageRatio / boxRatio) * 100;
    return { top: 0, height: "100%", width: `${width}%`, left: `${((100 - width) * fx) / 100}%` };
  }
  const height = (boxRatio / imageRatio) * 100;
  return { left: 0, width: "100%", height: `${height}%`, top: `${((100 - height) * fy) / 100}%` };
}

/** A mask that fades the loop into the still where the video is narrower (or shorter) than the image. */
function edgeMask(videoRatio: number, imageRatio: number): CSSProperties {
  const share = videoRatio / imageRatio;
  const [direction, part] = share < 0.995 ? ["to right", share] : share > 1.005 ? ["to bottom", 1 / share] : [null, 1];
  if (!direction) return {};
  const a = ((1 - part) / 2) * 100;
  const b = 100 - a;
  const mask = `linear-gradient(${direction}, transparent ${a}%, #000 ${a + EDGE}%, #000 ${b - EDGE}%, transparent ${b}%)`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

type PanelMotionVideoProps = {
  src: string;
  poster: string;
  panel: Pick<WebtoonPanel, "focal_point" | "image_zoom" | "panel_height" | "image">;
};

/**
 * The loop of an animated panel, laid exactly over its still. The video
 * model returns the centre of the image at one of its own ratios (3:4 for
 * a 4:5 panel), so the video is fitted inside the rectangle where the still
 * is drawn, centred, and its edges fade into the still. Nothing loads until
 * the panel comes on screen; it plays while at least a third of it is
 * visible, pauses otherwise, and fades in on its first frame. Readers who
 * ask for reduced motion keep the still.
 */
export function PanelMotionVideo({ src, poster, panel }: PanelMotionVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [videoRatio, setVideoRatio] = useState<number | null>(null);
  const reduced = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(video.parentElement ?? video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [reduced, src]);

  if (reduced) return null;
  const imageRatio = panel.image.width && panel.image.height ? panel.image.width / panel.image.height : null;
  const boxRatio = WEBTOON_WIDTH / Math.max(1, panel.panel_height);
  const rect = imageRatio ? coverRect(imageRatio, boxRatio, panel.focal_point?.x ?? 50, panel.focal_point?.y ?? 50) : { inset: 0 };
  const mask = imageRatio && videoRatio ? edgeMask(videoRatio, imageRatio) : {};
  return (
    <div className={`webtoon-motion ${playing ? "is-playing" : ""}`} style={imageStyle(panel)} aria-hidden="true">
      <div className="webtoon-motion-rect" style={rect}>
        <video
          ref={ref}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          tabIndex={-1}
          style={{ objectFit: imageRatio ? "contain" : "cover", ...mask }}
          onLoadedMetadata={(event) => {
            const { videoWidth, videoHeight } = event.currentTarget;
            if (videoWidth && videoHeight) setVideoRatio(videoWidth / videoHeight);
          }}
          onPlaying={() => setPlaying(true)}
        />
      </div>
    </div>
  );
}
