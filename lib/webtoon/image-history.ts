import type { PanelImage, WebtoonPanel } from "@/lib/webtoon/types";

/**
 * Every image a panel had stays reachable: a new drawing, a retouch or an
 * import pushes the current image into `image_history` (newest first), and
 * any image of the history can become the current one again. Only the URL
 * and a few fields are kept, the files stay in Storage.
 */
export const IMAGE_HISTORY_LIMIT = 20;

function usable(image: PanelImage | undefined): image is PanelImage {
  return Boolean(image?.src) && image?.status !== "missing";
}

function trimmed(list: PanelImage[]): PanelImage[] {
  const seen = new Set<string>();
  return list.filter((image) => usable(image) && !seen.has(image.src) && seen.add(image.src)).slice(0, IMAGE_HISTORY_LIMIT);
}

/** The panel with a new current image, the previous one kept at the top of its history. */
export function withNewImage(panel: WebtoonPanel, image: PanelImage): WebtoonPanel {
  const previous = usable(panel.image) && panel.image.src !== image.src ? [{ ...panel.image, status: "generated" as const }] : [];
  return { ...panel, image, image_history: trimmed([...previous, ...(panel.image_history ?? [])].filter((entry) => entry.src !== image.src)) };
}

/** The panel with one image of its history made current again; the current one goes back into the history. */
export function restoreImage(panel: WebtoonPanel, src: string): WebtoonPanel {
  const chosen = panel.image_history?.find((entry) => entry.src === src);
  if (!chosen) return panel;
  return withNewImage({ ...panel, image_history: panel.image_history?.filter((entry) => entry.src !== src) }, { ...chosen, status: "generated" });
}

/** Every image of the panel, the current one first. */
export function imageVersions(panel: WebtoonPanel): { image: PanelImage; current: boolean }[] {
  return [
    ...(usable(panel.image) ? [{ image: panel.image, current: true }] : []),
    ...(panel.image_history ?? []).filter(usable).map((image) => ({ image, current: false })),
  ];
}

export function originLabel(image: PanelImage): string {
  if (image.origin === "inpaint") return "Retouchée";
  if (image.origin === "upload") return "Importée";
  return "Générée";
}
