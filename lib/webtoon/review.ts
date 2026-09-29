import type { WebtoonPanel } from "./types";

/**
 * THE AUTHOR'S REVIEW OF A PANEL. Every panel is to review until the author
 * approves it or sends it back ("À refaire", with a note). The review is
 * about one image: a new drawing puts the panel back to review, except the
 * HD finish of an approved sketch, which is the same image drawn clean.
 * Approved panels are never redrawn by a batch without saying so.
 */

export type ReviewState = "todo" | "approved" | "redo";

export const REVIEW_LABEL: Record<ReviewState, string> = { todo: "À revoir", approved: "Validée", redo: "À refaire" };

/** The review that holds for the panel's current image. */
export function reviewOf(panel: Pick<WebtoonPanel, "review" | "image">): { status: ReviewState; note?: string } {
  const review = panel.review;
  if (!review || !panel.image.src || review.of !== panel.image.src) return { status: "todo" };
  return { status: review.status, note: review.note };
}

export function withReview(panel: WebtoonPanel, status: ReviewState, note?: string): WebtoonPanel {
  if (status === "todo") {
    const { review: _review, ...rest } = panel;
    void _review;
    return rest;
  }
  return { ...panel, review: { status, ...(note?.trim() ? { note: note.trim() } : {}), at: new Date().toISOString(), of: panel.image.src } };
}

/** A sketch waiting for its HD finish: approved, drawn at low or medium quality. */
export function needsFinish(panel: Pick<WebtoonPanel, "review" | "image">): boolean {
  return reviewOf(panel).status === "approved" && (panel.image.quality === "low" || panel.image.quality === "medium");
}

/** Share of the strip approved, for the gauge (title cards without image count as done). */
export function reviewProgress(panels: readonly WebtoonPanel[]): { approved: number; redo: number; total: number } {
  let approved = 0;
  let redo = 0;
  let total = 0;
  for (const panel of panels) {
    if (!panel.image.src) continue;
    total += 1;
    const state = reviewOf(panel).status;
    if (state === "approved") approved += 1;
    else if (state === "redo") redo += 1;
  }
  return { approved, redo, total };
}
