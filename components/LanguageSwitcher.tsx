"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, localeLabels, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { replaceLocaleInPath } from "@/lib/i18n/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, dict } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function onChange(nextLocale: Locale) {
    if (nextLocale === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.push(replaceLocaleInPath(pathname, nextLocale));
  }

  return (
    <label className={`lang-switcher flex items-center gap-2 ${className}`.trim()}>
      <span className="sr-only">{dict.lang.switcherLabel}</span>
      <span
        className="anime-label hidden font-display text-[0.65rem] tracking-[0.14em] text-cyan-pale/60 sm:inline"
        aria-hidden="true"
      >
        {dict.lang.switcherLabel}
      </span>
      <select
        value={locale}
        onChange={(event) => onChange(event.target.value as Locale)}
        className="lang-switcher-select rounded-md border border-glow/25 bg-cavern/70 px-2 py-1.5 font-body text-xs font-medium text-lily outline-none transition focus:border-magic/50 focus:ring-2 focus:ring-glow/30 sm:text-sm"
        aria-label={dict.lang.switcherLabel}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
