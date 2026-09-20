"use client";

import { useEffect, useMemo, useRef } from "react";
import { PanelCanvas } from "@/components/studio/PanelCanvas";
import type { Locale } from "@/lib/i18n/config";
import { computeLayout } from "@/lib/webtoon/layout";
import { WEBTOON_WIDTH, type WebtoonPanel } from "@/lib/webtoon/types";

type StripCanvasProps = {
  panels: WebtoonPanel[];
  locale: Locale;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (id: string, changes: Partial<WebtoonPanel>) => void;
  showFocal?: boolean;
  /** Film frames offered when inserting a panel between two others. */
  frames?: { src: string; seconds: number; label: string }[];
  onInsertAfter?: (id: string) => void;
  onInsertFrameAfter?: (id: string, src: string) => void;
};

const BG: Record<WebtoonPanel["background"], string> = { white: "#f6f4ef", black: "#020409", abyss: "#020817" };

/**
 * The final strip as a workspace: the same stacking, gaps and backgrounds
 * the reader shows, each panel being the editable canvas (handles on
 * bubbles, sounds, captions, focal point, bottom edge for the height). A
 * click selects a panel; the inspector and the image actions follow.
 */
export function StripCanvas({ panels, locale, selectedId, onSelect, onChange, showFocal, frames = [], onInsertAfter, onInsertFrameAfter }: StripCanvasProps) {
  const layout = useMemo(() => computeLayout(panels), [panels]);
  const host = useRef<HTMLDivElement>(null);
  const lastScrolled = useRef<string | null>(null);

  // Keep the selected panel in view when the selection comes from the list or the arrows.
  useEffect(() => {
    if (!selectedId || lastScrolled.current === selectedId) return;
    lastScrolled.current = selectedId;
    const node = host.current?.querySelector<HTMLElement>(`[data-panel-id="${CSS.escape(selectedId)}"]`);
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const pct = (px: number) => `${(px / WEBTOON_WIDTH) * 100}%`;

  return (
    <div ref={host} className="studio-strip">
      {layout.placements.map((placement, index) => {
        const panel = panels[index];
        if (!panel) return null;
        return (
          <div key={panel.panel_id} className="studio-strip-item" style={{ background: BG[placement.background] }}>
            <div style={{ paddingTop: pct(placement.gap_before) }} aria-hidden="true" />
            <PanelCanvas
              variant="strip"
              panel={panel}
              locale={locale}
              showFocal={showFocal}
              selected={panel.panel_id === selectedId}
              onSelect={() => {
                lastScrolled.current = panel.panel_id;
                onSelect(panel.panel_id);
              }}
              onChange={(changes) => onChange(panel.panel_id, changes)}
            />
            <div style={{ paddingTop: pct(placement.gap_after) }} aria-hidden="true" />
            {onInsertAfter ? (
              <div className="studio-strip-insert" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="webtoon-mini" onClick={() => onInsertAfter(panel.panel_id)} title="Insérer une case vide ici, à décrire puis à générer">+ Case</button>
                {onInsertFrameAfter && frames.length ? (
                  <select value="" onChange={(e) => { if (e.target.value) onInsertFrameAfter(panel.panel_id, e.target.value); }} title="Insérer ici une case tirée d'une image du film">
                    <option value="">+ Depuis le film…</option>
                    {frames.map((f) => <option key={f.src} value={f.src}>{f.label}</option>)}
                  </select>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
