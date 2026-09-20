"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SiteFooter } from "@/components/SiteFooter";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";

type WebtoonPageShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export function WebtoonPageShell({ children, wide = false }: WebtoonPageShellProps) {
  const { locale, dict } = useLocale();
  const homePath = localePath(locale, "/");

  return (
    <>
      <header className="site-nav sticky top-0 z-50 border-b border-glow/20 px-4 py-3 sm:px-5">
        <div className={`mx-auto flex items-center justify-between gap-4 ${wide ? "max-w-[1600px]" : "max-w-4xl"}`}>
          <Link href={homePath} className="anime-heading font-display text-lg text-lily transition hover:text-magic">
            {dict.common.siteName}
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={localePath(locale, "/webtoon")}
              className="font-body text-sm font-medium text-cyan-pale/80 underline-offset-4 transition hover:text-magic hover:underline"
            >
              {dict.webtoon.breadcrumbWebtoon}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 py-8 sm:px-5 sm:py-10 ${wide ? "max-w-[1600px]" : "max-w-4xl"}`}>{children}</main>
      <SiteFooter />
    </>
  );
}
