import type { Metadata, Viewport } from "next";
import { Oswald, Zen_Kaku_Gothic_New } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { defaultLocale, isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localePath } from "@/lib/i18n/navigation";
import { absoluteUrl, SITE } from "@/lib/seo";
import "../globals.css";

/**
 * Root layout, nested under the locale segment so `<html lang>` comes from
 * the route parameter. Reading it from request headers made every page
 * dynamic and uncacheable; with params the whole site prerenders.
 */

const display = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/**
 * Japanese family, sliced by Google Fonts into dozens of unicode-range
 * files per weight. Preloading pushed 37 font files (about 460 KB) into
 * the head of every page in every language. With preload off the browser
 * fetches only the slices a given page actually uses.
 */
const body = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: false,
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: SITE.name,
      template: `%s | ${SITE.name}`,
    },
    applicationName: SITE.name,
    authors: [{ name: SITE.creator, url: SITE.url }],
    creator: SITE.creator,
    publisher: SITE.name,
    category: "entertainment",
    formatDetection: {
      telephone: false,
      address: false,
    },
    // The RSS link is emitted by buildPageMetadata on every page: a page's
    // `alternates` replaces the layout's, so it cannot live here.
    alternates: {
      types: {
        "application/rss+xml": absoluteUrl(localePath(locale, "/feed.xml")),
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#020817",
  colorScheme: "dark",
};

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-abyss text-lily font-body font-medium antialiased">
        <AuthProvider>
          <LocaleProvider locale={locale} dict={dict}>
            {children}
            <CookieBanner />
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
