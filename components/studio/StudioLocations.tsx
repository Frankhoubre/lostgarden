"use client";

import { StudioLibrary } from "@/components/studio/StudioLibrary";
import { locationDocs } from "@/lib/webtoon/studio-assets";
import type { LibraryOverlay, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

type Props = { script: WebtoonScript; panels: WebtoonPanel[]; library: LibraryOverlay; setLibrary: (next: LibraryOverlay) => void; notify: (message: string) => void };

/** Locations and style anchors as an editable library. */
export function StudioLocations(props: Props) {
  return <StudioLibrary kind="location" docs={locationDocs()} {...props} />;
}
