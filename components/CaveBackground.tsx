import type { CSSProperties } from "react";

const ROOTS = [
  "root-strand-1",
  "root-strand-2",
  "root-strand-3",
  "root-strand-4",
  "root-strand-5",
];
const PLATFORMS = ["platform-1", "platform-2", "platform-3", "platform-4"];
const MUSHROOMS = [
  "mushroom-1",
  "mushroom-2",
  "mushroom-3",
  "mushroom-4",
  "mushroom-5",
  "mushroom-6",
];
const FLOWERS = [
  "flower-1",
  "flower-2",
  "flower-3",
  "flower-4",
  "flower-5",
  "flower-6",
  "flower-7",
  "flower-8",
];

type CaveBackgroundProps = {
  /** Lighter overlay when a hero illustration is already present */
  minimal?: boolean;
};

export function CaveBackground({ minimal = false }: CaveBackgroundProps) {
  if (minimal) {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="mist-layer mist-2 opacity-40" />
        <div className="particles absolute inset-0 opacity-50">
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              className="particle"
              style={{ "--i": i } as CSSProperties}
            />
          ))}
        </div>
        <div className="cave-vignette absolute inset-0 opacity-80" />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="cave-gradient absolute inset-0" />
      <div className="cave-depth-glow absolute inset-0" />
      <div className="cave-light-rays absolute inset-0" />
      <div className="cave-roots absolute inset-0">
        {ROOTS.map((id) => (
          <div key={id} className={`root-strand ${id}`} />
        ))}
      </div>
      <div className="cave-platforms absolute inset-0">
        {PLATFORMS.map((id) => (
          <div key={id} className={`floating-platform ${id}`} />
        ))}
      </div>
      <div className="cave-mushrooms absolute inset-0">
        {MUSHROOMS.map((id) => (
          <div key={id} className={`mushroom-glow ${id}`} />
        ))}
      </div>
      <div className="cave-flowers absolute inset-0">
        {FLOWERS.map((id) => (
          <span key={id} className={`bio-flower ${id}`} />
        ))}
      </div>
      <div className="mist-layer mist-1" />
      <div className="mist-layer mist-2" />
      <div className="mist-layer mist-3" />
      <div className="particles absolute inset-0">
        {Array.from({ length: 40 }, (_, i) => (
          <span
            key={i}
            className="particle"
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </div>
      <div className="cave-foreground-cliff absolute inset-x-0 bottom-0" />
      <div className="cave-vignette absolute inset-0" />
    </div>
  );
}
