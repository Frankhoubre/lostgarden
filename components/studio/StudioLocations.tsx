"use client";

import { useState } from "react";
import { StudioLightbox } from "@/components/studio/StudioLightbox";
import { studioLocations } from "@/lib/webtoon/studio-assets";

/** Locations: the ones the strip uses with their images and design locks, then the production sheets and the bible. */
export function StudioLocations() {
  const [open, setOpen] = useState<{ src: string; label: string } | null>(null);
  const locations = studioLocations();

  return (
    <div className="studio-grid">
      {locations.map((location) => (
        <article key={location.id} className="studio-card">
          <header>
            <p className="anime-label text-xs text-cyan-pale">Décor</p>
            <h2 className="font-display text-xl text-lily">{location.name}</h2>
          </header>
          {location.images.length ? (
            <div className="studio-images">
              {location.images.map((image) => (
                <button key={image.src} type="button" className="studio-image" onClick={() => setOpen({ src: image.src, label: `${location.name} · ${image.label}` })}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={`${location.name}, ${image.label}`} loading="lazy" />
                  <span>{image.label}</span>
                  {image.note ? <small>{image.note}</small> : null}
                </button>
              ))}
            </div>
          ) : null}
          {location.blocks.map((block) => (
            <details key={block.title} className="studio-details">
              <summary>{block.title}</summary>
              <pre className="studio-text">{block.text}</pre>
            </details>
          ))}
        </article>
      ))}
      <StudioLightbox src={open?.src ?? null} label={open?.label} onClose={() => setOpen(null)} />
    </div>
  );
}
