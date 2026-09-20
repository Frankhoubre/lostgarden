"use client";

import { useState } from "react";
import { StudioLightbox } from "@/components/studio/StudioLightbox";
import { studioCharacters } from "@/lib/webtoon/studio-assets";

/** The cast: the two of the strip first, then the production sheets of the others. */
export function StudioCharacters() {
  const [open, setOpen] = useState<{ src: string; label: string } | null>(null);
  const characters = studioCharacters();

  return (
    <div className="studio-grid">
      {characters.map((character) => (
        <article key={character.id} className={`studio-card studio-character ${character.in_strip ? "is-in-strip" : ""}`}>
          <header>
            <p className="anime-label text-xs text-cyan-pale">{character.in_strip ? "Dans la bande" : "Fiche de production"}</p>
            <h2 className="font-display text-xl text-lily">{character.name}</h2>
            {character.role ? <p className="text-sm text-ivory/80">{character.role}</p> : null}
          </header>
          <div className="studio-images">
            {character.images.map((image) => (
              <button key={image.src} type="button" className="studio-image" onClick={() => setOpen({ src: image.src, label: `${character.name} · ${image.label}` })}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt={`${character.name}, ${image.label}`} loading="lazy" />
                <span>{image.label}</span>
                {image.note ? <small>{image.note}</small> : null}
              </button>
            ))}
          </div>
          {character.blocks.map((block) => (
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
