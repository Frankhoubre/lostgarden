"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";
import { EASE_OUT_EXPO } from "@/lib/motion";

type NavLinkItem = {
  href: string;
  label: string;
};

export function SiteNav() {
  const prefersReducedMotion = useReducedMotion();
  const { locale, dict } = useLocale();
  const { nav } = dict;
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks: NavLinkItem[] = [
    { label: nav.characters, href: "#characters" },
    { label: nav.knights, href: "#knights" },
    { label: nav.trailer, href: "#trailer" },
    { label: nav.join, href: "#discover" },
    { label: nav.experience, href: localePath(locale, "/experience") },
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
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:py-2.5"
        initial={prefersReducedMotion ? false : "hidden"}
        animate={prefersReducedMotion ? undefined : "visible"}
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.05, delayChildren: 0.35 },
          },
        }}
      >
        <a
          href="#top"
          className="site-nav-logo shrink-0"
          aria-label={nav.home}
        >
          <Image
            src="/images/logo-lost-garden.png"
            alt={dict.common.logoAlt}
            width={1024}
            height={576}
            unoptimized
            className="h-9 w-auto sm:h-10"
            sizes="80px"
          />
        </a>

        <ul className="hidden flex-1 items-center justify-center gap-1 md:flex lg:gap-2">
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

        <div className="hidden shrink-0 md:block">
          <LanguageSwitcher />
        </div>

        <button
          type="button"
          className="site-nav-burger md:hidden"
          aria-expanded={menuOpen}
          aria-controls="site-nav-mobile"
          aria-label={menuOpen ? nav.closeMenu : nav.openMenu}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <motion.span
            className="site-nav-burger-line"
            animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
          />
          <motion.span
            className="site-nav-burger-line"
            animate={menuOpen ? { opacity: 0, scaleX: 0.4 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.2 }}
          />
          <motion.span
            className="site-nav-burger-line"
            animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
          />
        </button>
      </motion.div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            id="site-nav-mobile"
            className="site-nav-mobile md:hidden"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, height: "auto" }
            }
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          >
            <motion.ul
              className="flex flex-col gap-1 px-4 pb-4 pt-2"
              initial={prefersReducedMotion ? false : "hidden"}
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {navLinks.map((link) => (
                <motion.li
                  key={link.href}
                  variants={{
                    hidden: { opacity: 0, x: -12 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.4, ease: EASE_OUT_EXPO },
                    },
                  }}
                >
                  <a
                    href={link.href}
                    className="site-nav-mobile-link anime-label"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
              <motion.li
                className="mt-2 border-t border-glow/15 pt-3"
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.4, ease: EASE_OUT_EXPO },
                  },
                }}
              >
                <LanguageSwitcher />
              </motion.li>
            </motion.ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.nav>
  );
}
