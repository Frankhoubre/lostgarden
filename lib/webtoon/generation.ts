import { referencesForPanel } from "./references";
import type { LibraryOverlay, WebtoonPanel } from "./types";

/**
 * GENERATION REQUEST: the provider-neutral bundle for one panel. The
 * pipeline hands this to whichever image model is in use (the first strip
 * was made with Nano Banana Pro through Higgsfield, references attached in
 * this order). Nothing here depends on a vendor SDK.
 */
export type GenerationRequest = {
  panel_id: string;
  model: string;
  aspect_ratio: string;
  width: number;
  height: number;
  prompt: string;
  negative_constraints: string[];
  references: { id: string; name: string; image: string; role: string }[];
};

export const DEFAULT_IMAGE_MODEL = "nano_banana_pro";

export function buildGenerationRequest(
  panel: WebtoonPanel,
  model = DEFAULT_IMAGE_MODEL,
  overlay?: LibraryOverlay | null,
): GenerationRequest {
  return {
    panel_id: panel.panel_id,
    model,
    aspect_ratio: panel.aspect_ratio,
    width: 1080,
    height: panel.panel_height,
    prompt: panel.generation_prompt,
    negative_constraints: panel.negative_constraints,
    references: referencesForPanel(panel, overlay).map((r) => ({
      id: r.id,
      name: r.name,
      image: r.image,
      role: r.kind,
    })),
  };
}
