"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO, staggerContainer } from "@/lib/motion";

type SectionTitleProps = {
  children: React.ReactNode;
  subtitle?: string;
  as?: "h2" | "h3";
  className?: string;
};

export function SectionTitle({
  children,
  subtitle,
  as: Tag = "h2",
  className = "",
}: SectionTitleProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <header className={`text-center ${className}`}>
        <Tag className="anime-heading font-display text-3xl text-lily sm:text-4xl md:text-5xl">
          {children}
        </Tag>
        {subtitle ? (
          <p className="mx-auto mt-4 max-w-xl font-body text-base font-medium leading-relaxed text-ivory/90 sm:text-lg">
            {subtitle}
          </p>
        ) : null}
      </header>
    );
  }

  return (
    <motion.header
      className={`text-center ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-64px" }}
      variants={staggerContainer(0.14, 0.05)}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
          visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 1, ease: EASE_OUT_EXPO },
          },
        }}
      >
        <Tag className="anime-heading font-display text-3xl text-lily sm:text-4xl md:text-5xl">
          {children}
        </Tag>
      </motion.div>
      {subtitle ? (
        <motion.p
          className="mx-auto mt-4 max-w-xl font-body text-base font-medium leading-relaxed text-ivory/90 sm:text-lg"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.85, ease: EASE_OUT_EXPO },
            },
          }}
        >
          {subtitle}
        </motion.p>
      ) : null}
    </motion.header>
  );
}
