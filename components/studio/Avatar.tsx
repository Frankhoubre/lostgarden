"use client";

import { useState } from "react";
import { DEFAULT_AVATAR } from "@/lib/webtoon/references";

type AvatarProps = {
  image?: string;
  name: string;
  /** Centre of the face in percent of the image and zoom factor; the turnaround default otherwise. */
  crop?: { x: number; y: number; zoom: number };
  /** `cover` shows the whole image cropped to the circle (for a place); `face` zooms on the face. */
  mode?: "face" | "cover";
  size?: number;
};

/** A round thumbnail of a character's face or a place, cut from its sheet without any extra file. */
export function Avatar({ image, name, crop, mode = "face", size = 36 }: AvatarProps) {
  const [ratio, setRatio] = useState(0.66);
  const c = crop ?? DEFAULT_AVATAR;
  if (!image) {
    return (
      <span className="studio-avatar studio-avatar-empty" style={{ width: size, height: size }} aria-hidden>
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  if (mode === "cover") {
    return (
      <span className="studio-avatar" style={{ width: size, height: size }} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
      </span>
    );
  }
  // The image is zoomed `c.zoom` times the circle; the face point (x%, y%) lands at the centre.
  const width = c.zoom * 100;
  const left = 50 - c.x * c.zoom;
  const top = 50 - c.y * c.zoom * ratio;
  return (
    <span className="studio-avatar" style={{ width: size, height: size }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        loading="lazy"
        onLoad={(e) => setRatio(e.currentTarget.naturalHeight / Math.max(1, e.currentTarget.naturalWidth))}
        style={{ position: "absolute", width: `${width}%`, maxWidth: "none", left: `${left}%`, top: `${top}%` }}
      />
    </span>
  );
}
