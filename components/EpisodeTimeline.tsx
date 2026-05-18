"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO, staggerContainer } from "@/lib/motion";

type TimelineStep = {
  title: string;
  line: string;
};

type EpisodeTimelineProps = {
  steps: TimelineStep[];
};

export function EpisodeTimeline({ steps }: EpisodeTimelineProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <ol className="episode-timeline mx-auto mt-12 max-w-3xl">
        {steps.map((step, index) => (
          <li key={step.title} className="episode-timeline-step group">
            <span className="episode-timeline-marker" aria-hidden="true" />
            <div className="episode-timeline-content">
              <span className="anime-label font-display text-xs text-glow/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="anime-heading mt-1 font-display text-lg text-lily sm:text-xl">
                {step.title}
              </h3>
              <p className="mt-2 font-body text-sm font-bold leading-relaxed text-magic">
                {step.line}
              </p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <motion.ol
      className="episode-timeline mx-auto mt-12 max-w-3xl"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-48px" }}
      variants={staggerContainer(0.12, 0.05)}
    >
      {steps.map((step, index) => (
        <motion.li
          key={step.title}
          className="episode-timeline-step group"
          variants={{
            hidden: { opacity: 0, x: -20, filter: "blur(4px)" },
            visible: {
              opacity: 1,
              x: 0,
              filter: "blur(0px)",
              transition: { duration: 0.75, ease: EASE_OUT_EXPO },
            },
          }}
        >
          <motion.span
            className="episode-timeline-marker"
            aria-hidden="true"
            variants={{
              hidden: { scale: 0, opacity: 0 },
              visible: {
                scale: 1,
                opacity: 1,
                transition: { duration: 0.5, ease: EASE_OUT_EXPO },
              },
            }}
          />
          <div className="episode-timeline-content">
            <span className="anime-label font-display text-xs text-glow/70">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="anime-heading mt-1 font-display text-lg text-lily transition-colors group-hover:text-magic sm:text-xl">
              {step.title}
            </h3>
            <p className="mt-2 font-body text-sm font-bold leading-relaxed text-magic transition-[letter-spacing] duration-500 group-hover:tracking-wide">
              {step.line}
            </p>
          </div>
        </motion.li>
      ))}
    </motion.ol>
  );
}
