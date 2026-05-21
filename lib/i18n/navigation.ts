import type { Locale } from "./config";

export function localePath(locale: Locale, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/");
  if (segments.length > 2 && segments[1]) {
    return `/${segments.slice(2).join("/")}`.replace(/\/$/, "") || "/";
  }
  return pathname === "" ? "/" : pathname;
}

export function replaceLocaleInPath(pathname: string, locale: Locale): string {
  const rest = stripLocalePrefix(pathname);
  return localePath(locale, rest === "" ? "/" : rest);
}
