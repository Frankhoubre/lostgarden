"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT_EXPO, fadeUp, scaleIn, slideFromLeft } from "@/lib/motion";

type AnimatedVariant = "fadeUp" | "scaleIn" | "slideLeft";

const VARIANTS: Record<AnimatedVariant, Variants> = {
  fadeUp,
  scaleIn,
  slideLeft: slideFromLeft,
};

type AnimatedInViewProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: AnimatedVariant;
};

export function AnimatedInView({
  children,
  className,
  delay = 0,
  variant = "fadeUp",
}: AnimatedInViewProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <motion.div className={className}>{children}</motion.div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-72px" }}
      variants={VARIANTS[variant]}
      transition={{ delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
