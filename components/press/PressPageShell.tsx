"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { PressLangSwitcher } from "@/components/press/PressLangSwitcher";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";
import { LEGAL_PUBLISHER } from "@/lib/legal";
import { PRESS_KIT } from "@/lib/press";

type PressPageShellProps = {
  children: ReactNode;
};

export function PressPageShell({ children }: PressPageShellProps) {
  const { locale, dict } = useLocale();
  const p = dict.press;

  return (
    <>
      <header className="press-nav site-nav sticky top-0 z-50 border-b border-glow/20 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link
            href={localePath(locale, "/")}
            className="anime-heading shrink-0 font-display text-base text-lily transition hover:text-magic sm:text-lg"
          >
            {LEGAL_PUBLISHER.project}
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <PressLangSwitcher />
            <Link
              href={localePath(locale, "/")}
              className="hidden font-body text-xs font-medium text-cyan-pale/70 underline-offset-4 transition hover:text-magic hover:underline sm:inline sm:text-sm"
            >
              {p.backToSite}
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <SiteFooter />

      <a
        href={`mailto:${PRESS_KIT.contactEmail}`}
        className="press-sticky-contact btn-secondary fixed bottom-5 right-5 z-40 hidden min-h-0 px-4 py-3 text-[0.7rem] shadow-[0_8px_32px_rgba(2,8,23,0.65)] sm:inline-flex"
      >
        {p.stickyContact}
      </a>
    </>
  );
}
