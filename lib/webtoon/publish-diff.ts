import type { WebtoonPanel } from "./types";

/**
 * WHAT A PUBLICATION CHANGES: the draft against the version online, before
 * it replaces it. Panels added and removed, images redrawn (old and new side
 * by side), lettering rewritten (in French, the reference language), and a
 * count of what else moved (sizes, frames, order).
 */

export type TextChange = { panel: WebtoonPanel; before: string[]; after: string[] };
export type PublishDiff = {
  added: WebtoonPanel[];
  removed: WebtoonPanel[];
  images: { before: WebtoonPanel; after: WebtoonPanel }[];
  texts: TextChange[];
  /** Panels whose size, frame, gaps or background changed, without a new image or text. */
  layout: number;
  reordered: boolean;
  empty: boolean;
};

function lines(panel: WebtoonPanel): string[] {
  return [
    ...panel.dialogue.map((d) => `${d.speaker} : ${d.text.fr ?? d.text.en}`),
    ...panel.caption.map((c) => c.text.fr ?? c.text.en),
    ...panel.sfx.map((s) => `(${s.text.fr ?? s.text.en})`),
  ];
}

const LAYOUT_KEYS = ["panel_height", "frame", "spacing_before", "spacing_after", "background", "bleed", "border", "focal_point", "image_zoom"] as const;

export function publishDiff(online: readonly WebtoonPanel[], draft: readonly WebtoonPanel[]): PublishDiff {
  const before = new Map(online.map((p) => [p.panel_id, p]));
  const after = new Map(draft.map((p) => [p.panel_id, p]));
  const added = draft.filter((p) => !before.has(p.panel_id));
  const removed = online.filter((p) => !after.has(p.panel_id));
  const images: PublishDiff["images"] = [];
  const texts: TextChange[] = [];
  let layout = 0;
  for (const panel of draft) {
    const old = before.get(panel.panel_id);
    if (!old) continue;
    const imageChanged = (old.image.src || "") !== (panel.image.src || "");
    if (imageChanged) images.push({ before: old, after: panel });
    const a = lines(old);
    const b = lines(panel);
    const textChanged = a.join("\n") !== b.join("\n");
    if (textChanged) texts.push({ panel, before: a, after: b });
    if (!imageChanged && !textChanged && LAYOUT_KEYS.some((k) => JSON.stringify(old[k]) !== JSON.stringify(panel[k]))) layout += 1;
  }
  const common = draft.filter((p) => before.has(p.panel_id)).map((p) => p.panel_id);
  const commonOnline = online.filter((p) => after.has(p.panel_id)).map((p) => p.panel_id);
  const reordered = common.join("|") !== commonOnline.join("|");
  return { added, removed, images, texts, layout, reordered, empty: !added.length && !removed.length && !images.length && !texts.length && !layout && !reordered };
}
