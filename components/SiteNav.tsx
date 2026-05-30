"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";
import { EASE_OUT_EXPO } from "@/lib/motion";

type NavLinkItem = {
  href: string;
  label: string;
  shortLabel: string;
};

export function SiteNav() {
  const prefersReducedMotion = useReducedMotion();
  const { locale, dict } = useLocale();
  const { nav } = dict;

  const navLinks: NavLinkItem[] = [
    { label: nav.characters, shortLabel: nav.characters, href: "#characters" },
    { label: nav.knights, shortLabel: nav.knights, href: "#knights" },
    { label: nav.trailer, shortLabel: nav.watchShort, href: "#trailer" },
    { label: nav.join, shortLabel: nav.joinShort, href: "#discover" },
    {
      label: nav.experience,
      shortLabel: nav.experienceShort,
      href: localePath(locale, "/experience"),
    },
  ];

  return (
    <motion.nav
      className="site-nav sticky top-0 z-50 backdrop-blur-md"
      aria-label={nav.ariaLabel}
      initial={prefersReducedMotion ? false : { y: -48, opacity: 0 }}
      animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
      transition={{ duration: 0.75, ease: EASE_OUT_EXPO, delay: 0.1 }}
    >
      <motion.div
        className="mx-auto flex max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-4"
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.05, delayChildren: 0.35 },
          },
        }}
      >
        <ul className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center sm:gap-2 sm:py-3 [&::-webkit-scrollbar]:hidden">
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
                <span className="sm:hidden">{link.shortLabel}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </a>
            </motion.li>
          ))}
        </ul>
        <LanguageSwitcher className="shrink-0 pb-1 sm:pb-0" />
      </motion.div>
    </motion.nav>
  );
}
