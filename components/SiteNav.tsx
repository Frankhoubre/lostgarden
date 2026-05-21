"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";
import { EASE_OUT_EXPO } from "@/lib/motion";

export function SiteNav() {
  const prefersReducedMotion = useReducedMotion();
  const { locale, dict } = useLocale();

  const navLinks = [
    { label: dict.nav.characters, href: "#characters" },
    { label: dict.nav.trailer, href: "#trailer" },
    { label: dict.nav.join, href: "#discover" },
    { label: dict.nav.experience, href: localePath(locale, "/experience") },
  ] as const;

  return (
    <motion.nav
      className="site-nav sticky top-0 z-50 backdrop-blur-md"
      aria-label={dict.nav.ariaLabel}
      initial={prefersReducedMotion ? false : { y: -48, opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
      transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay: 0.1 }}
    >
      <motion.div
        className="mx-auto flex max-w-6xl items-center gap-3 px-4"
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.05, delayChildren: 0.35 },
          },
        }}
      >
        <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center sm:gap-2 [&::-webkit-scrollbar]:hidden">
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
        <LanguageSwitcher className="shrink-0 pb-1 sm:pb-0" />
      </motion.div>
    </motion.nav>
  );
}
