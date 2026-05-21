"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_KEY,
  type CookieConsent,
} from "@/lib/legal";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";

function readConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

function storeConsent(value: CookieConsent) {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
}

export function CookieBanner() {
  const { locale, dict } = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readConsent()) {
      setVisible(true);
    }
  }, []);

  function dismiss(choice: CookieConsent) {
    storeConsent(choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="cookie-banner fixed inset-x-0 bottom-0 z-[100] border-t-2 border-glow/30 bg-abyss/95 p-4 shadow-[0_-8px_32px_rgba(2,8,23,0.85)] backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p
            id="cookie-banner-title"
            className="anime-label font-display text-sm text-lily"
          >
            {dict.cookies.title}
          </p>
          <p
            id="cookie-banner-desc"
            className="mt-2 font-body text-sm leading-relaxed text-ivory/85"
          >
            {dict.cookies.bodyBefore}{" "}
            <Link
              href={localePath(locale, "/privacy-policy")}
              className="text-magic underline-offset-2 hover:underline"
            >
              {dict.cookies.privacyLink}
            </Link>
            {dict.cookies.bodyAfter}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => dismiss("rejected")}
            className="btn-secondary min-h-11 px-4 py-2 text-xs sm:text-sm"
          >
            {dict.cookies.decline}
          </button>
          <button
            type="button"
            onClick={() => dismiss("accepted")}
            className="btn-primary min-h-11 px-4 py-2 text-xs sm:text-sm"
          >
            {dict.cookies.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
