/**
 * The icons of the studio's action bars: one line-drawn glyph per action,
 * drawn on a 24 grid with the current colour, so a button reads at a glance
 * and its label can stay short.
 */

export type ActionIconName = "generate" | "retouch" | "draw" | "replace" | "history" | "copy" | "duplicate" | "front" | "back" | "delete";

const PATHS: Record<ActionIconName, React.ReactNode> = {
  // Two arrows turning: draw again.
  generate: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 3v5h5" />
      <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 21v-5h-5" />
    </>
  ),
  // A magic wand with a spark.
  retouch: (
    <>
      <path d="M4 20L15 9" />
      <path d="M13.5 7.5l3 3" />
      <path d="M18 3v3M16.5 4.5h3M20.5 9v2M19.5 10h2M8 3v2M7 4h2" />
    </>
  ),
  // A pencil.
  draw: (
    <>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
      <path d="M14.5 5.5l3 3" />
    </>
  ),
  // A picture with an arrow coming in.
  replace: (
    <>
      <rect x="3" y="5" width="13" height="14" rx="2" />
      <path d="M3 15l4-4 4 4 2-2 3 3" />
      <path d="M19 4v8M16 9l3 3 3-3" />
    </>
  ),
  // A clock turned back.
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  // A clipboard.
  copy: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 10h6M9 14h6" />
    </>
  ),
  // Two panels, one over the other.
  duplicate: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      <path d="M14 11v6M11 14h6" />
    </>
  ),
  front: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 16l9 5 9-5" opacity="0.45" />
    </>
  ),
  back: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" opacity="0.45" />
      <path d="M3 16l9 5 9-5" />
    </>
  ),
  // A bin.
  delete: (
    <>
      <path d="M4 7h16M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
};

export function ActionIcon({ name, size = 15 }: { name: ActionIconName; size?: number }) {
  return (
    <svg className="studio-action-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
