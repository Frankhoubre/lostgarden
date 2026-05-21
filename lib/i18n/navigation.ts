import { isLocale, type Locale } from "./config";

export function localePath(locale: Locale, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

/** Remove leading locale segment(s) (e.g. `/fr/experience` → `/experience`, `/ja/fr` → `/`). */
export function stripLocalePrefix(pathname: string): string {
  let rest = pathname === "" ? "/" : pathname;
  while (true) {
    const segments = rest.split("/");
    const leading = segments[1];
    if (!leading || !isLocale(leading)) break;
    const tail = segments.slice(2).join("/");
    rest = tail ? `/${tail}` : "/";
  }
  return rest;
}

export function replaceLocaleInPath(pathname: string, locale: Locale): string {
  const rest = stripLocalePrefix(pathname);
  return localePath(locale, rest === "" ? "/" : rest);
}
