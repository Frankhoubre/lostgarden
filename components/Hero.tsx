"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO, fadeUp, staggerContainer } from "@/lib/motion";

const SPARKLE_POSITIONS = [
  { left: "12%", top: "22%", delay: 0 },
  { left: "78%", top: "18%", delay: 1.2 },
  { left: "88%", top: "55%", delay: 2.4 },
  { left: "22%", top: "68%", delay: 0.8 },
  { left: "52%", top: "38%", delay: 1.8 },
  { left: "65%", top: "72%", delay: 3 },
] as const;

export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 pb-20 pt-24"
    >
      <motion.div
        className="hero-scene absolute inset-0"
        initial={prefersReducedMotion ? false : { scale: 1.06 }}
        animate={prefersReducedMotion ? undefined : { scale: 1 }}
        transition={{ duration: 2.2, ease: EASE_OUT_EXPO }}
      >
        <Image
          src="/images/hero-banner.png"
          alt=""
          fill
          priority
          unoptimized
          className="hero-reference-layer"
          sizes="100vw"
        />
        <motion.div
          className="hero-reference-veil absolute inset-0"
          initial={prefersReducedMotion ? false : { opacity: 0.85 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
        {!prefersReducedMotion ? (
          <motion.div
            className="hero-aurora pointer-events-none absolute inset-0"
            aria-hidden="true"
            animate={{ opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}
      </motion.div>

      {!prefersReducedMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1.5 }}
        >
          {SPARKLE_POSITIONS.map((sparkle, i) => (
            <span
              key={i}
              className="hero-sparkle"
              style={
                {
                  left: sparkle.left,
                  top: sparkle.top,
                  "--sparkle-delay": `${sparkle.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </motion.div>
      ) : null}

      <motion.div
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-2 text-center"
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
        variants={staggerContainer(0.14, 0.15)}
      >
        <motion.h1
          className="hero-logo-wrap hero-logo-float relative mx-auto w-[min(92vw,34rem)]"
          variants={fadeUp}
        >
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
        </motion.h1>

        <div className="hero-content-veil mt-8 flex w-full flex-col items-center">
          <motion.p
            className="max-w-xl font-body text-base font-medium leading-relaxed text-ivory sm:text-lg"
            variants={fadeUp}
          >
            Some things wake beneath the earth. A hollow knight. A child in the
            mist. A forest that remembers.
          </motion.p>

          <motion.div
            className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center"
            variants={fadeUp}
          >
            <a href="#discover" className="btn-primary btn-shimmer">
              Join the experience
            </a>
            <a href="#characters" className="btn-secondary">
              Characters
            </a>
          </motion.div>

          <motion.p
            className="anime-label anime-label-glow mt-12 font-display text-sm text-cyan-pale/70 sm:text-base"
            variants={fadeUp}
          >
            Not every guardian was meant to protect.
          </motion.p>
        </div>
      </motion.div>

      {!prefersReducedMotion ? (
        <motion.a
          href="#characters"
          className="scroll-hint absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-cyan-pale/50 transition-colors hover:text-magic"
          aria-label="Scroll to explore"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8, ease: EASE_OUT_EXPO }}
        >
          <span className="anime-label font-display text-[0.65rem] tracking-[0.2em]">
            Descend
          </span>
          <span className="scroll-hint-chevron" aria-hidden="true" />
        </motion.a>
      ) : null}

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-t from-abyss/90 to-transparent"
        aria-hidden="true"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1 }}
        transition={{ delay: 0.4, duration: 1.2 }}
      />
    </section>
  );
}
