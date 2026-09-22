"use client";

import type { WebtoonPanel } from "@/lib/webtoon/types";

/** The panel that follows the pointer while it is dragged, with the size of the block when several move. */
export function PanelDragGhost({ panel, count, pointer }: { panel: WebtoonPanel | undefined; count: number; pointer: { x: number; y: number } | null }) {
  if (!panel || !pointer) return null;
  return (
    <div className="studio-drag-ghost" style={{ left: pointer.x + 14, top: pointer.y + 10 }} aria-hidden="true">
      {panel.image.src && panel.image.status !== "missing" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={panel.image.src} alt="" />
      ) : (
        <span className="studio-drag-ghost-empty">sans image</span>
      )}
      <span className="studio-drag-ghost-label">
        {count > 1 ? `${count} cases` : `Case ${panel.order}`}
      </span>
    </div>
  );
}
