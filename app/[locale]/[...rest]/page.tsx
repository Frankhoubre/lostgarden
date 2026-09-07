import { notFound } from "next/navigation";

/**
 * Any path under a locale that matches no page lands here and gets the
 * localized 404 from the locale layout, with the right `lang` and copy.
 * Without this, unmatched paths fall through to the English global 404.
 */
export default function CatchAllNotFound(): never {
  notFound();
}
