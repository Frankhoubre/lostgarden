"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/motion";

const navLinks = [
  { label: "World", href: "#world" },
  { label: "Characters", href: "#characters" },
  { label: "Episode One", href: "#episode-one" },
  { label: "Discover", href: "#discover" },
  { label: "Experience", href: "/experience" },
] as const;

export function SiteNav() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.nav
      className="site-nav sticky top-0 z-50 backdrop-blur-md"
      aria-label="Page sections"
      initial={prefersReducedMotion ? false : { y: -48, opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
      transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay: 0.1 }}
    >
      <motion.div
        className="mx-auto max-w-6xl px-4"
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.05, delayChildren: 0.35 },
          },
        }}
      >
        <ul className="flex items-center gap-1 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center sm:gap-2 [&::-webkit-scrollbar]:hidden">
          {navLinks.map((link) => (
            <motion.li
              key={link.href}
              className="shrink-0"
              variants={{
                hidden: { opacity: 0, y: -8 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.5, ease: EASE_OUT_EXPO },
                },
              }}
            >
              <a href={link.href} className="site-nav-link anime-label">
                {link.label}
              </a>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.nav>
  );
}
