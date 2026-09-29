"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { LIBRARY_COLLECTION } from "@/lib/webtoon/library";

/**
 * WHERE THE EPISODE BEFORE LEFT THE CHARACTERS. Episode 2 starts from the
 * state of the last panels of episode 1 (a helmet off, a torn cape, the
 * pendant in a hand), the way one panel carries its state to the next. The
 * studio reads the end of the previous episode once, the author corrects the
 * lines, and the first panels of the new one are written and drawn with them
 * (unless the film shows a change, a time skip or a memory).
 *
 * Stored next to the project's library: `webtoon_library/<slug>~handoff`.
 */

export type EpisodeHandoff = {
  /** The episode it was read from. */
  from_slug: string;
  from_title: string;
  /** One short line per character, in English: what the generation keeps. */
  text: string;
  /** The last drawn panel of the episode before, for the continuity of the very first panel. */
  image?: string;
  updated_at: string;
};

export const handoffDocId = (slug: string) => `${slug}~handoff`;

/** The first panels of an episode take the handoff while none of their own says the state (a strip's opening). */
export const HANDOFF_PANELS = 12;

export async function loadHandoff(slug: string): Promise<EpisodeHandoff | null> {
  const snapshot = await getDoc(doc(getDb(), LIBRARY_COLLECTION, handoffDocId(slug)));
  if (!snapshot.exists()) return null;
  try {
    const value = JSON.parse((snapshot.data() as { handoff_json?: string }).handoff_json ?? "null") as EpisodeHandoff | null;
    return value && typeof value.text === "string" ? value : null;
  } catch {
    return null;
  }
}

export async function saveHandoff(slug: string, handoff: EpisodeHandoff, user: User): Promise<void> {
  await setDoc(doc(getDb(), LIBRARY_COLLECTION, handoffDocId(slug)), {
    handoff_json: JSON.stringify(handoff),
    updated_at_iso: new Date().toISOString(),
    updated_by: user.email ?? null,
    touched: serverTimestamp(),
  });
}
