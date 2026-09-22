"use client";

import { StudioLibrary } from "@/components/studio/StudioLibrary";
import type { LibraryOverlay, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

type Props = { script: WebtoonScript; panels: WebtoonPanel[]; library: LibraryOverlay; setLibrary: (next: LibraryOverlay) => void; notify: (message: string) => void };

/**
 * The objects as an editable library: the pendant, the fallen helmet, what
 * the story follows from hand to hand. The continuation adds a sheet here
 * for every object it meets in the film without one.
 */
export function StudioObjects(props: Props) {
  return <StudioLibrary kind="object" docs={{}} {...props} />;
}
