import { type NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  type Locale,
} from "@/lib/i18n/config";

const PUBLIC_FILE = /\.[^/]+$/;

function pickLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale;

  const preferences = header
    .split(",")
    .map((part) => {
      const [tag, q = "q=1"] = part.trim().split(";");
      const weight = Number.parseFloat(q.replace("q=", "")) || 1;
      return { tag: tag.toLowerCase(), weight };
    })
    .sort((a, b) => b.weight - a.weight);

  for (const { tag } of preferences) {
    if (tag.startsWith("fr")) return "fr";
    if (tag.startsWith("ja")) return "ja";
    if (tag.startsWith("ko")) return "ko";
    if (tag.startsWith("en")) return "en";
  }

  return defaultLocale;
}

function detectLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && isLocale(cookie)) return cookie;
  return pickLocaleFromAcceptLanguage(request.headers.get("accept-language"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const pathnameLocale = locales.find(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (pathnameLocale) {
    const afterLocale = pathname.slice(`/${pathnameLocale}`.length) || "/";
    const nestedLocale = afterLocale.split("/").filter(Boolean)[0];
    if (nestedLocale && isLocale(nestedLocale)) {
      const url = request.nextUrl.clone();
      url.pathname = afterLocale.startsWith("/") ? afterLocale : `/${afterLocale}`;
      const response = NextResponse.redirect(url);
      response.cookies.set(LOCALE_COOKIE, nestedLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    }

    const response = NextResponse.next();
    response.headers.set("x-locale", pathnameLocale);
    response.cookies.set(LOCALE_COOKIE, pathnameLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
