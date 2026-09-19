import { SPACING_BY_TRANSITION } from "./adaptation";
import type { PanelImage, TransitionType, WebtoonPanel } from "./types";

/**
 * EDITOR OPERATIONS: pure functions over the panel list. The editor UI calls
 * these and never touches the array itself, so every operation is testable
 * and every result stays a valid panel list (orders renumbered, ids unique).
 */

const STALE: (image: PanelImage) => PanelImage = (image) =>
  image.status === "generated" ? { ...image, status: "stale" } : image;

export function renumber(panels: WebtoonPanel[]): WebtoonPanel[] {
  return panels.map((panel, index) => ({ ...panel, order: index + 1 }));
}

export function uniqueId(panels: readonly WebtoonPanel[], base: string): string {
  const taken = new Set(panels.map((p) => p.panel_id));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function updatePanel(
  panels: WebtoonPanel[],
  id: string,
  patch: Partial<WebtoonPanel>,
): WebtoonPanel[] {
  return panels.map((panel) => {
    if (panel.panel_id !== id) return panel;
    const next = { ...panel, ...patch };
    // A prompt or description change makes the current image stale.
    if (
      (patch.generation_prompt !== undefined &&
        patch.generation_prompt !== panel.generation_prompt) ||
      (patch.description !== undefined && patch.description !== panel.description)
    ) {
      next.image = STALE(panel.image);
    }
    return next;
  });
}

export function setTransition(
  panels: WebtoonPanel[],
  id: string,
  transition: TransitionType,
): WebtoonPanel[] {
  return updatePanel(panels, id, {
    transition_type: transition,
    spacing_before: SPACING_BY_TRANSITION[transition],
  });
}

export function movePanel(panels: WebtoonPanel[], id: string, delta: -1 | 1): WebtoonPanel[] {
  const index = panels.findIndex((p) => p.panel_id === id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= panels.length) return panels;
  const next = [...panels];
  [next[index], next[target]] = [next[target], next[index]];
  return renumber(next);
}

export function deletePanel(panels: WebtoonPanel[], id: string): WebtoonPanel[] {
  if (panels.length <= 1) return panels;
  return renumber(panels.filter((p) => p.panel_id !== id));
}

/** Insert an empty panel after `id`, inheriting beat, location and background. */
export function insertAfter(panels: WebtoonPanel[], id: string): WebtoonPanel[] {
  const index = panels.findIndex((p) => p.panel_id === id);
  if (index < 0) return panels;
  const from = panels[index];
  const blank: WebtoonPanel = {
    ...from,
    panel_id: uniqueId(panels, `${from.panel_id}-new`),
    fidelity: "bridge",
    narrative_role: "detail",
    purpose: "",
    description: "",
    action: "",
    emotion: "",
    composition: "",
    shot_type: "detail",
    aspect_ratio: "3:2",
    panel_height: 720,
    transition_type: "continuous",
    spacing_before: SPACING_BY_TRANSITION.continuous,
    spacing_after: 0,
    dialogue: [],
    caption: [],
    sfx: [],
    generation_prompt: "",
    image: { src: "", width: 0, height: 0, status: "missing" },
  };
  const next = [...panels];
  next.splice(index + 1, 0, blank);
  return renumber(next);
}

/** Merge a panel with the next one: one taller panel, texts concatenated. */
export function mergeWithNext(panels: WebtoonPanel[], id: string): WebtoonPanel[] {
  const index = panels.findIndex((p) => p.panel_id === id);
  if (index < 0 || index >= panels.length - 1) return panels;
  const a = panels[index];
  const b = panels[index + 1];
  const merged: WebtoonPanel = {
    ...a,
    source_time_start: a.source_time_start ?? b.source_time_start,
    source_time_end: b.source_time_end ?? a.source_time_end,
    source_shots: [...new Set([...a.source_shots, ...b.source_shots])],
    purpose: [a.purpose, b.purpose].filter(Boolean).join(" "),
    description: [a.description, b.description].filter(Boolean).join(" Then: "),
    action: [a.action, b.action].filter(Boolean).join(" "),
    characters: [...new Set([...a.characters, ...b.characters])],
    panel_height: a.panel_height + b.panel_height,
    aspect_ratio: `1080:${a.panel_height + b.panel_height}`,
    spacing_after: b.spacing_after,
    dialogue: [...a.dialogue, ...b.dialogue],
    caption: [...a.caption, ...b.caption],
    sfx: [...a.sfx, ...b.sfx],
    visual_references: [...new Set([...a.visual_references, ...b.visual_references])],
    generation_prompt: a.generation_prompt,
    image: STALE(a.image),
  };
  const next = [...panels];
  next.splice(index, 2, merged);
  return renumber(next);
}

/** Split a panel into two halves: same content, half the height each. */
export function splitPanel(panels: WebtoonPanel[], id: string): WebtoonPanel[] {
  const index = panels.findIndex((p) => p.panel_id === id);
  if (index < 0) return panels;
  const from = panels[index];
  const half = Math.max(300, Math.round(from.panel_height / 2));
  const first: WebtoonPanel = {
    ...from,
    panel_height: half,
    aspect_ratio: `1080:${half}`,
    focal_point: { x: from.focal_point.x, y: 25 },
    spacing_after: 0,
  };
  const second: WebtoonPanel = {
    ...from,
    panel_id: uniqueId(panels, `${from.panel_id}-b`),
    panel_height: half,
    aspect_ratio: `1080:${half}`,
    focal_point: { x: from.focal_point.x, y: 75 },
    transition_type: "continuous",
    spacing_before: SPACING_BY_TRANSITION.continuous,
    dialogue: [],
    caption: [],
    sfx: [],
  };
  const next = [...panels];
  next.splice(index, 1, first, second);
  return renumber(next);
}

export function markForRegeneration(panels: WebtoonPanel[], id: string): WebtoonPanel[] {
  return panels.map((p) =>
    p.panel_id === id ? { ...p, image: { ...p.image, status: p.image.src ? "stale" : "missing" } } : p,
  );
}
