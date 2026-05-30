"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EpisodeWatchBlock } from "@/components/EpisodeWatchBlock";
import { useLocale } from "@/components/providers/LocaleProvider";
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
  const { dict } = useLocale();

  return (
    <section
      id="top"
      className="relative overflow-hidden px-5 pb-16 pt-24 sm:pb-20"
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
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-2 text-center"
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
        variants={staggerContainer(0.12, 0.12)}
      >
        <motion.h1
          className="hero-logo-wrap hero-logo-float relative mx-auto w-[min(88vw,22rem)] sm:w-[min(72vw,26rem)]"
          variants={fadeUp}
        >
          <Image
            src="/images/logo-lost-garden.png"
            alt={dict.common.logoAlt}
            width={1024}
            height={576}
            priority
            unoptimized
            className="hero-logo-img"
            sizes="(max-width: 768px) 88vw, 26rem"
          />
        </motion.h1>

        <div className="hero-content-veil mt-6 flex w-full flex-col items-center sm:mt-8">
          <motion.p
            className="anime-label episode-release-badge rounded-md border-2 border-magic/45 bg-cavern/75 px-4 py-2 font-display text-sm tracking-[0.14em] text-lily shadow-[0_0_28px_rgba(56,189,248,0.2)]"
            variants={fadeUp}
          >
            {dict.episodeOne.badge}
          </motion.p>

          <motion.div className="mt-6 w-full sm:mt-8" variants={fadeUp}>
            <EpisodeWatchBlock
              id="trailer"
              compact
              title={dict.trailer.embedTitle}
            />
          </motion.div>

          <motion.p
            className="mt-6 max-w-xl font-body text-base font-medium leading-relaxed text-ivory sm:text-lg"
            variants={fadeUp}
          >
            {dict.hero.tagline}
          </motion.p>

          <motion.div
            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center"
            variants={fadeUp}
          >
            <a href="#discover" className="btn-primary btn-shimmer">
              {dict.nav.experience}
            </a>
            <a href="#characters" className="btn-secondary">
              {dict.hero.characters}
            </a>
          </motion.div>

          <motion.p
            className="anime-label anime-label-glow mt-10 font-display text-sm text-cyan-pale/70 sm:text-base"
            variants={fadeUp}
          >
            {dict.hero.footerLine}
          </motion.p>
        </div>
      </motion.div>

      {!prefersReducedMotion ? (
        <motion.a
          href="#characters"
          className="scroll-hint absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-cyan-pale/50 transition-colors hover:text-magic sm:flex"
          aria-label={dict.hero.scrollLabel}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8, ease: EASE_OUT_EXPO }}
        >
          <span className="anime-label font-display text-[0.65rem] tracking-[0.2em]">
            {dict.hero.descend}
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
