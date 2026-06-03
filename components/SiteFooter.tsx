"use client";

import Image from "next/image";
import Link from "next/link";
import { LEGAL_PUBLISHER } from "@/lib/legal";
import { SOCIAL_LINKS } from "@/lib/social";
import { AnimatedInView } from "./AnimatedInView";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { localePath } from "@/lib/i18n/navigation";

type FooterLink = { label: string; href: string };

function FooterLinkList({
  links,
  prominent = false,
}: {
  links: readonly FooterLink[];
  prominent?: boolean;
}) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className={
              prominent
                ? "font-display text-xs font-semibold uppercase tracking-wider text-ivory/85 underline-offset-4 transition hover:text-magic hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 rounded-sm sm:text-sm"
                : "font-body text-xs font-medium text-ivory/55 underline-offset-4 transition hover:text-cyan-pale hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 rounded-sm sm:text-sm"
            }
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter() {
  const { locale, dict } = useLocale();

  const socialLinks = [
    { label: dict.footer.instagram, href: SOCIAL_LINKS.instagram },
    { label: dict.footer.youtube, href: SOCIAL_LINKS.youtube },
    { label: dict.footer.tiktok, href: SOCIAL_LINKS.tiktok },
    { label: dict.footer.contact, href: `mailto:${LEGAL_PUBLISHER.email}` },
  ] as const;

  const projectLinks: FooterLink[] = [
    { label: dict.footer.process, href: localePath(locale, "/process") },
    { label: dict.footer.vision, href: localePath(locale, "/vision") },
    { label: dict.footer.episodeOne, href: localePath(locale, "/episode-1") },
    { label: dict.footer.press, href: localePath(locale, "/press") },
  ];

  const legalLinks: FooterLink[] = [
    { label: dict.footer.legalNotice, href: localePath(locale, "/legal-notice") },
    { label: dict.footer.privacy, href: localePath(locale, "/privacy-policy") },
  ];

  return (
    <footer className="site-footer relative px-5 py-16">
      <AnimatedInView className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <Link
          href={localePath(locale, "/")}
          className="footer-logo-wrap relative block w-[min(85vw,14rem)] sm:w-52"
        >
          <Image
            src="/images/logo-lost-garden.png"
            alt={dict.common.logoAlt}
            width={1024}
            height={576}
            unoptimized
            className="hero-logo-img h-auto w-full"
            sizes="(max-width: 640px) 85vw, 13rem"
          />
        </Link>
        <p className="font-body text-sm font-medium text-ivory/75">
          {dict.footer.byline}
        </p>
        <nav aria-label={dict.footer.socialAria}>
          <ul className="flex flex-wrap items-center justify-center gap-6">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.href.startsWith("http")
                    ? {
                        target: "_blank",
                        rel: "noopener noreferrer",
                      }
                    : {})}
                  className="font-display text-sm font-semibold uppercase tracking-wider text-ivory/80 underline-offset-4 transition hover:text-magic hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss rounded-sm"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <nav aria-label={dict.footer.projectAria}>
            <FooterLinkList links={projectLinks} prominent />
          </nav>
          <nav aria-label={dict.footer.legalAria}>
            <FooterLinkList links={legalLinks} />
          </nav>
        </div>
        <p className="text-xs text-ivory/30">
          {formatMessage(dict.footer.copyright, {
            year: String(new Date().getFullYear()),
          })}
        </p>
      </AnimatedInView>
    </footer>
  );
}
