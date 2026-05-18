import type { CSSProperties } from "react";

export function CaveBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="cave-gradient absolute inset-0" />

      <div className="absolute inset-0 opacity-40">
        <div className="root-strand root-strand-1" />
        <div className="root-strand root-strand-2" />
        <div className="root-strand root-strand-3" />
      </div>

      <div className="mushroom-glow mushroom-1" />
      <div className="mushroom-glow mushroom-2" />
      <div className="mushroom-glow mushroom-3" />
      <div className="mushroom-glow mushroom-4" />

      <div className="mist-layer mist-1" />
      <div className="mist-layer mist-2" />

      <div className="particles absolute inset-0">
        {Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            className="particle"
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </div>

      <div className="cave-vignette absolute inset-0" />
    </div>
  );
}
