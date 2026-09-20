"use client";

import { useEffect, useRef } from "react";

type StudioLightboxProps = {
  src: string | null;
  label?: string;
  onClose: () => void;
  /** An extra button in the caption, for instance "make a panel from this frame". */
  action?: { label: string; onClick: () => void };
};

/** A full-screen look at one image, closed with Escape, a click outside, or the button. */
export function StudioLightbox({ src, label, onClose, action }: StudioLightboxProps) {
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
            {action ? <button type="button" className="webtoon-mini studio-primary" onClick={action.onClick}>{action.label}</button> : null}
            <button type="button" className="webtoon-mini" onClick={onClose}>Fermer</button>
          </figcaption>
        </figure>
      ) : null}
    </dialog>
  );
}
