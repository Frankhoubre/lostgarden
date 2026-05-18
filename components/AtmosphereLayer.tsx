import type { CSSProperties } from "react";

type AtmosphereLayerProps = {
  variant?: "default" | "dense";
};

export function AtmosphereLayer({ variant = "default" }: AtmosphereLayerProps) {
  return (
    <div
      className={`section-atmosphere pointer-events-none absolute inset-x-0 bottom-0 ${variant === "dense" ? "section-atmosphere--dense" : ""}`}
      aria-hidden="true"
    >
      <div className="section-mist-floor" />
      <div className="section-mist-glow" />
      <div className="section-particles absolute inset-0">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className="section-particle"
            style={{ "--p": i } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
