"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  gifPreviewUrl,
  gifUrl,
  stickerUrl,
  type Sticker,
  type StickerGif,
} from "@/lib/stickers";

const COPY_FEEDBACK_MS = 2000;

const SMALL_BUTTON =
  "min-h-0 w-full px-3 py-2.5 text-center text-[0.65rem] leading-tight tracking-[0.08em] sm:text-xs";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or a page without clipboard permission: fall back below.
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  } catch {
    return false;
  }
}

function CopyLinkButton({ path }: { path: string }) {
  const { dict } = useLocale();
  const copy = dict.stickers;
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function onCopy() {
    const ok = await copyText(new URL(path, window.location.origin).href);
    setStatus(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), COPY_FEEDBACK_MS);
  }

  const label =
    status === "copied"
      ? copy.copied
      : status === "failed"
        ? copy.copyFailed
        : copy.copyLink;

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`btn-secondary ${SMALL_BUTTON} ${
        status === "copied" ? "border-magic/70 text-lily" : ""
      }`.trim()}
    >
      <span aria-live="polite">{label}</span>
    </button>
  );
}

/** Looping MP4 preview that only loads and plays while it is on screen. */
function GifPreview({ gif }: { gif: StickerGif }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // React does not always reflect `muted` as an attribute, and autoplay needs it.
    video.muted = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !seen) return;
    if (visible) {
      video.play().catch(() => {
        // Autoplay refused (power saving, data saver): the first frame stays.
      });
    } else {
      video.pause();
    }
  }, [seen, visible]);

  return (
    <div
      className="relative w-full overflow-hidden border-b border-glow/20 bg-abyss/70"
      style={{ aspectRatio: `${gif.width} / ${gif.height}` }}
    >
      <video
        ref={videoRef}
        src={seen ? gifPreviewUrl(gif.slug) : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={gif.title}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}

export function GifGrid({ gifs }: { gifs: readonly StickerGif[] }) {
  const { dict } = useLocale();
  const copy = dict.stickers;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {gifs.map((gif) => (
        <li key={gif.slug} className="glass-card flex flex-col overflow-hidden">
          <GifPreview gif={gif} />
          <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
            <h3 className="font-body text-sm font-medium leading-snug text-ivory/90 sm:text-base">
              {gif.title}
            </h3>
            <div className="mt-auto flex flex-col gap-2">
              <a
                href={gifUrl(gif.slug)}
                download={`${gif.slug}.gif`}
                className={`btn-primary ${SMALL_BUTTON}`}
              >
                {copy.downloadGif}
              </a>
              <CopyLinkButton path={gifUrl(gif.slug)} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StickerGrid({ stickers }: { stickers: readonly Sticker[] }) {
  const { dict } = useLocale();
  const copy = dict.stickers;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {stickers.map((sticker) => (
        <li key={sticker.slug} className="glass-card flex flex-col overflow-hidden">
          <div className="relative aspect-square w-full border-b border-glow/20 bg-abyss/40">
            <Image
              src={stickerUrl(sticker.slug)}
              alt={sticker.title}
              fill
              unoptimized
              loading="lazy"
              className="object-contain p-4"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
            <h3 className="font-body text-sm font-medium leading-snug text-ivory/90 sm:text-base">
              {sticker.title}
            </h3>
            <a
              href={stickerUrl(sticker.slug)}
              download={`${sticker.slug}.webp`}
              className={`btn-secondary mt-auto ${SMALL_BUTTON}`}
            >
              {copy.downloadSticker}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
