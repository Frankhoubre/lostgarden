"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n/types";
import { PRESS_GALLERY_IMAGES } from "@/lib/press";

type PressGalleryProps = {
  dict: Dictionary["press"]["gallery"];
};

export function PressGallery({ dict }: PressGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);

  const showPrev = useCallback(() => {
    setActiveIndex((index) =>
      index === null
        ? null
        : (index - 1 + PRESS_GALLERY_IMAGES.length) % PRESS_GALLERY_IMAGES.length,
    );
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((index) =>
      index === null ? null : (index + 1) % PRESS_GALLERY_IMAGES.length,
    );
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, close, showNext, showPrev]);

  return (
    <>
      <div className="press-gallery-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRESS_GALLERY_IMAGES.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="press-gallery-item group relative aspect-[4/3] overflow-hidden rounded-xl border border-glow/20 bg-cave-night/50 text-left transition hover:border-glow/45"
          >
            <Image
              src={image.src}
              alt={dict.alts[image.altKey]}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-abyss/80 via-transparent to-transparent opacity-80" />
            <span className="absolute bottom-3 left-3 right-3 font-body text-xs font-medium text-ivory/90">
              {dict.alts[image.altKey]}
            </span>
          </button>
        ))}
      </div>

      {activeIndex !== null ? (
        <div
          className="press-lightbox fixed inset-0 z-[80] flex items-center justify-center bg-abyss/92 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={dict.alts[PRESS_GALLERY_IMAGES[activeIndex].altKey]}
          onClick={close}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded-md border border-glow/30 bg-cavern/80 px-3 py-2 font-display text-xs tracking-widest text-lily transition hover:border-glow/55"
            onClick={close}
          >
            {dict.close}
          </button>

          <button
            type="button"
            className="press-lightbox-nav absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-md border border-glow/30 bg-cavern/80 px-3 py-4 font-display text-lg text-lily sm:block"
            onClick={(event) => {
              event.stopPropagation();
              showPrev();
            }}
            aria-label={dict.prev}
          >
            ‹
          </button>

          <button
            type="button"
            className="press-lightbox-nav absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-md border border-glow/30 bg-cavern/80 px-3 py-4 font-display text-lg text-lily sm:block"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            aria-label={dict.next}
          >
            ›
          </button>

          <div
            className="relative max-h-[85vh] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-glow/30 shadow-[0_0_80px_rgba(56,189,248,0.15)]">
              <Image
                src={PRESS_GALLERY_IMAGES[activeIndex].src}
                alt={dict.alts[PRESS_GALLERY_IMAGES[activeIndex].altKey]}
                fill
                unoptimized
                className="object-contain bg-cave-night"
                sizes="100vw"
                priority
              />
            </div>
            <p className="mt-4 text-center font-body text-sm text-ivory/80">
              {dict.alts[PRESS_GALLERY_IMAGES[activeIndex].altKey]}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
