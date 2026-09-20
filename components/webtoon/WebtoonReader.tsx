"use client";

import { bubbleFont, sfxFont } from "@/components/webtoon/fonts";
import { PanelLettering } from "@/components/webtoon/PanelLettering";
import { useLocale } from "@/components/providers/LocaleProvider";
import { computeLayout } from "@/lib/webtoon/layout";
import { WEBTOON_WIDTH, type PanelBackground, type WebtoonPanel } from "@/lib/webtoon/types";

const BG: Record<PanelBackground, string> = {
  white: "#f6f4ef",
  black: "#020409",
  abyss: "#020817",
};

type WebtoonReaderProps = {
  panels: WebtoonPanel[];
  /** Print the panel id and shot in a corner, for the editor. */
  showIds?: boolean;
  /** Called when a panel is tapped, for the editor. */
  onSelect?: (panelId: string) => void;
  selectedId?: string | null;
  className?: string;
};

/**
 * The vertical strip. Widths are fluid up to the 1080 px canvas; heights and
 * gaps are expressed in percent of the width, so the strip keeps the exact
 * proportions the engine decided, on any phone.
 */
export function WebtoonReader({
  panels,
  showIds = false,
  onSelect,
  selectedId = null,
  className = "",
}: WebtoonReaderProps) {
  const { locale, dict } = useLocale();
  const layout = computeLayout(panels);
  const pct = (px: number) => `${(px / WEBTOON_WIDTH) * 100}%`;

  return (
    <div
      className={`webtoon-strip ${bubbleFont.variable} ${sfxFont.variable} ${className}`}
      style={{ background: BG[panels[0]?.background ?? "black"] }}
      role="list"
      aria-label={dict.webtoon.headline}
    >
      {panels.map((panel, index) => {
        const placement = layout.placements[index];
        const previous = index > 0 ? panels[index - 1] : null;
        const interactive = Boolean(onSelect);
        const selected = selectedId === panel.panel_id;
        const focal = `${panel.focal_point.x}% ${panel.focal_point.y}%`;
        const newBeat = previous !== null && previous.beat_id !== panel.beat_id;
        const worldChange = previous !== null && previous.background !== panel.background;
        // The gap before a panel: a soft fall when the world changes, a small
        // beat mark when a new beat starts, plain distance otherwise.
        const gapStyle: React.CSSProperties = { paddingTop: pct(placement.gap_before), position: "relative" };
        if (worldChange && previous) {
          gapStyle.background = `linear-gradient(to bottom, ${BG[previous.background]} 0%, ${BG[panel.background]} 38%, ${BG[panel.background]} 100%)`;
        }
        return (
          <div key={panel.panel_id} role="listitem" style={{ background: BG[panel.background] }}>
            <div style={gapStyle} aria-hidden="true">
              {newBeat && !worldChange ? (
                <span className={`webtoon-beat-mark ${panel.background === "white" ? "webtoon-beat-mark-light" : ""}`} />
              ) : null}
            </div>
            <div
              className={`webtoon-panel ${panel.bleed ? "webtoon-panel-bleed" : "webtoon-panel-framed"} ${
                panel.background === "white" ? "webtoon-panel-on-light" : "webtoon-panel-on-dark"
              } ${panel.border ? "webtoon-panel-bordered" : ""} ${selected ? "webtoon-panel-selected" : ""} ${
                interactive ? "webtoon-panel-interactive" : ""
              }`}
              style={{ aspectRatio: `${WEBTOON_WIDTH} / ${panel.panel_height}` }}
              onClick={interactive ? () => onSelect?.(panel.panel_id) : undefined}
              data-panel-id={panel.panel_id}
            >
              {panel.caption.some((c) => c.style === "title") && !panel.image.src ? (
                <div className="webtoon-title-card" aria-hidden="true" />
              ) : panel.image.status === "missing" || !panel.image.src ? (
                <div
                  className={`webtoon-placeholder ${
                    panel.background === "white" ? "webtoon-placeholder-light" : ""
                  }`}
                >
                  <span className="anime-label">{panel.panel_id}</span>
                  <span>{dict.webtoon.imagePending}</span>
                  <span className="webtoon-placeholder-desc">{panel.description}</span>
                </div>
              ) : (
                // Plain <img>: the strip is a single tall document and the
                // canvas is fixed, so the Next image pipeline adds nothing here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={panel.image.src}
                  alt={panel.description}
                  width={panel.image.width || WEBTOON_WIDTH}
                  height={panel.image.height || panel.panel_height}
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                  style={{ objectPosition: focal }}
                  className={panel.image.status === "stale" ? "webtoon-img-stale" : ""}
                />
              )}
              <PanelLettering
                dialogue={panel.dialogue}
                caption={panel.caption}
                sfx={panel.sfx}
                locale={locale}
              />
              {showIds ? (
                <div className="webtoon-panel-tag">
                  {panel.panel_id} · {panel.shot_type} · {panel.panel_height}px
                  {panel.image.status === "stale" ? " · stale" : ""}
                </div>
              ) : null}
            </div>
            <div style={{ paddingTop: pct(placement.gap_after) }} aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
}
