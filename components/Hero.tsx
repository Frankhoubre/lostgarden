"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CaveBackground } from "./CaveBackground";

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  const fade = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-24"
    >
      <CaveBackground />

      <motion.div
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center"
        {...fade}
      >
        <h1 className="font-display text-[clamp(2.75rem,12vw,6.5rem)] font-medium leading-[0.95] tracking-[0.18em] text-lily drop-shadow-[0_0_40px_rgba(56,189,248,0.15)]">
          LOST
          <br />
          GARDEN
        </h1>

        <p className="mt-8 max-w-xl font-body text-base leading-relaxed text-ivory/75 sm:text-lg">
          A hollow knight. A sleeping child. A world waiting beneath the earth.
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <a href="#waitlist" className="btn-primary">
            Join the waitlist
          </a>
          <a href="#world" className="btn-secondary">
            Discover the world
          </a>
        </div>

        <p className="mt-12 text-xs tracking-wide text-ivory/40 sm:text-sm">
          The official Lost Garden project is currently in development.
        </p>
      </motion.div>
    </section>
  );
}
