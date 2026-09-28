"use client";

import { useState } from "react";
import { Avatar } from "@/components/studio/Avatar";
import type { ReferenceAsset } from "@/lib/webtoon/types";

export type CastItem = { id: string; name: string; image?: string; avatar?: ReferenceAsset["avatar"] };

type CastPickerProps = {
  items: CastItem[];
  selected: string[];
  onToggle: (id: string, on: boolean) => void;
  /** Faces cropped from a sheet (characters) or the whole image (objects, places). */
  mode?: "face" | "cover";
  /** Past this many, the ones not in the panel fold behind "Tout afficher". */
  fold?: number;
};

/**
 * Who or what is in the panel, as a tidy grid of cards: the ones in the
 * panel first, marked, then the others; a long library folds behind a
 * button instead of piling up.
 */
export function CastPicker({ items, selected, onToggle, mode = "face", fold = 6 }: CastPickerProps) {
  const [all, setAll] = useState(false);
  const on = items.filter((item) => selected.includes(item.id));
  const off = items.filter((item) => !selected.includes(item.id));
  const shown = all || items.length <= fold ? [...on, ...off] : [...on, ...off.slice(0, Math.max(0, fold - on.length))];
  const hidden = items.length - shown.length;
  return (
    <div className="studio-cast">
      <div className="studio-cast-grid">
        {shown.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`studio-cast-card ${active ? "is-on" : ""}`}
              onClick={() => onToggle(item.id, !active)}
              aria-pressed={active}
              title={active ? `${item.name} : dans la case (cliquer pour retirer)` : `Ajouter ${item.name} à la case`}
            >
              <span className="studio-cast-face">
                <Avatar image={item.image} name={item.name} crop={mode === "face" ? item.avatar : undefined} mode={mode === "cover" ? "cover" : undefined} size={40} />
                {active ? (
                  <span className="studio-cast-check" aria-hidden>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  </span>
                ) : null}
              </span>
              <span className="studio-cast-name">{item.name}</span>
            </button>
          );
        })}
      </div>
      {items.length > fold ? (
        <button type="button" className="studio-cast-more" onClick={() => setAll((v) => !v)}>
          {all ? "Replier" : `Tout afficher (${hidden} de plus)`}
        </button>
      ) : null}
    </div>
  );
}
