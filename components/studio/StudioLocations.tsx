"use client";

import { StudioLibrary } from "@/components/studio/StudioLibrary";
import { locationDocs } from "@/lib/webtoon/studio-assets";
import type { LibraryOverlay, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

type Props = { script: WebtoonScript; panels: WebtoonPanel[]; setPanels?: (next: WebtoonPanel[]) => void; library: LibraryOverlay; setLibrary: (next: LibraryOverlay) => void; notify: (message: string) => void; /** The production notes of Lost Garden under each entry. */ withDocs?: boolean };

/** Locations and style anchors as an editable library. */
export function StudioLocations(props: Props) {
  const { withDocs = true, ...rest } = props;
  return <StudioLibrary kind="location" docs={withDocs ? locationDocs() : {}} {...rest} />;
}
