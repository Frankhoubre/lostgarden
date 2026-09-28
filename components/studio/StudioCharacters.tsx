"use client";

import { StudioLibrary } from "@/components/studio/StudioLibrary";
import type { LibraryOverlay, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

type Props = { script: WebtoonScript; panels: WebtoonPanel[]; setPanels?: (next: WebtoonPanel[]) => void; library: LibraryOverlay; setLibrary: (next: LibraryOverlay) => void; notify: (message: string) => void };

/** The cast as an editable library: one turnaround sheet per character (front, side, back, on white). */
export function StudioCharacters(props: Props) {
  return <StudioLibrary kind="character" {...props} />;
}
