import { panelAlt } from "./alt-text";
import type { WebtoonPanel } from "./types";

/**
 * The panels as the public reader needs them. A studio panel carries its
 * whole making (the composed prompt, the references, the image history, the
 * check against the sheets, the review): about 7 MB for the 600 panels of
 * episode 1, all sent to every reader's browser. The reader only draws the
 * frame, the image and the lettering; the description becomes its alt text.
 */
export function forReader(panels: readonly WebtoonPanel[]): WebtoonPanel[] {
  return panels.map((panel) => {
    const {
      generation_prompt: _prompt,
      negative_constraints: _negative,
      visual_references: _references,
      image_history: _history,
      audit: _audit,
      review: _review,
      purpose: _purpose,
      composition: _composition,
      action: _action,
      emotion: _emotion,
      source_shots: _shots,
      objects: _objects,
      prompt_auto: _auto,
      ...kept
    } = panel;
    void [_prompt, _negative, _references, _history, _audit, _review, _purpose, _composition, _action, _emotion, _shots, _objects, _auto];
    const { model: _model, job_id: _job, cost_usd: _cost, note: _note, origin: _origin, quality: _quality, ...image } = panel.image;
    void [_model, _job, _cost, _note, _origin, _quality];
    return {
      ...kept,
      description: panelAlt(panel.description),
      image,
      generation_prompt: "",
      negative_constraints: [],
      visual_references: [],
      purpose: "",
      composition: "",
      action: "",
      emotion: "",
      source_shots: [],
      objects: [],
    } as WebtoonPanel;
  });
}
