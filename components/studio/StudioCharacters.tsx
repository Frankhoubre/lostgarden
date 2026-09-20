"use client";

import { StudioLibrary } from "@/components/studio/StudioLibrary";
import { characterDocs } from "@/lib/webtoon/studio-assets";
import type { LibraryOverlay, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

type Props = { script: WebtoonScript; panels: WebtoonPanel[]; library: LibraryOverlay; setLibrary: (next: LibraryOverlay) => void; notify: (message: string) => void };

/** The cast as an editable library: sheets, design locks, production notes. */
export function StudioCharacters(props: Props) {
  return <StudioLibrary kind="character" docs={characterDocs()} {...props} />;
}
