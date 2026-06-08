"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { replaceLocaleInPath } from "@/lib/i18n/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";

const PRESS_LOCALES: Array<{ code: Locale; label: string }> = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "ja", label: "JP" },
  { code: "ko", label: "KR" },
];

export function PressLangSwitcher() {
  const { locale, dict } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function onSelect(nextLocale: Locale) {
    if (nextLocale === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.push(replaceLocaleInPath(pathname, nextLocale));
  }

  return (
    <nav
      className="press-lang-switcher flex items-center gap-1 rounded-lg border border-glow/25 bg-cavern/60 p-1 backdrop-blur-sm"
      aria-label={dict.lang.switcherLabel}
    >
      {PRESS_LOCALES.map(({ code, label }) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className={`press-lang-pill min-w-[2.5rem] rounded-md px-2.5 py-1.5 font-display text-[0.7rem] font-bold tracking-[0.12em] transition ${
              active
                ? "bg-glow/20 text-lily shadow-[0_0_16px_rgba(56,189,248,0.2)]"
                : "text-cyan-pale/55 hover:bg-cave-night/80 hover:text-cyan-pale"
            }`}
            aria-current={active ? "true" : undefined}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
