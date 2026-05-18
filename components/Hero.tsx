"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

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
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-24"
    >
      <div className="hero-scene absolute inset-0">
        <Image
          src="/images/hero-banner.png"
          alt=""
          fill
          priority
          className="hero-reference-layer"
          sizes="100vw"
        />
        <div className="hero-reference-veil absolute inset-0" />
      </div>

      <motion.div
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-2 text-center"
        {...fade}
      >
        <h1 className="hero-logo-wrap relative mx-auto w-[min(92vw,34rem)]">
          <Image
            src="/images/logo-lost-garden.png"
            alt="Lost Garden"
            width={1024}
            height={576}
            priority
            unoptimized
            className="hero-logo-img"
            sizes="(max-width: 768px) 92vw, 34rem"
          />
        </h1>

        <div className="hero-content-veil mt-8 flex w-full flex-col items-center">
        <p className="max-w-xl font-body text-base font-medium leading-relaxed text-ivory sm:text-lg">
          Some things wake beneath the earth. A hollow knight. A child in the
          mist. A forest that remembers.
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <a href="#discover" className="btn-primary">
            Discover the experience
          </a>
          <a href="#world" className="btn-secondary">
            The World Beneath
          </a>
        </div>

        <p className="anime-label mt-12 font-display text-sm text-cyan-pale/70 sm:text-base">
          Not every guardian was meant to protect.
        </p>
        </div>
      </motion.div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-t from-abyss/90 to-transparent"
        aria-hidden="true"
      />
    </section>
  );
}
