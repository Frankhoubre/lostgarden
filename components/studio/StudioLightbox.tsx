"use client";

import { useEffect, useRef } from "react";

type StudioLightboxProps = {
  src: string | null;
  label?: string;
  onClose: () => void;
};

/** A full-screen look at one image, closed with Escape, a click outside, or the button. */
export function StudioLightbox({ src, label, onClose }: StudioLightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (src && !dialog.open) dialog.showModal();
    if (!src && dialog.open) dialog.close();
  }, [src]);

  return (
    <dialog
      ref={ref}
      className="studio-lightbox"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {src ? (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label ?? ""} />
          <figcaption>
            <span>{label}</span>
            <button type="button" className="webtoon-mini" onClick={onClose}>Fermer</button>
          </figcaption>
        </figure>
      ) : null}
    </dialog>
  );
}
