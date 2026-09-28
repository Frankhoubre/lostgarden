"use client";

import { StudioLibrary } from "@/components/studio/StudioLibrary";
import type { LibraryOverlay, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

type Props = { script: WebtoonScript; panels: WebtoonPanel[]; setPanels?: (next: WebtoonPanel[]) => void; library: LibraryOverlay; setLibrary: (next: LibraryOverlay) => void; notify: (message: string) => void };

/** The locations as an editable library: one aerial establishing view per place. */
export function StudioLocations(props: Props) {
  return <StudioLibrary kind="location" {...props} />;
}
