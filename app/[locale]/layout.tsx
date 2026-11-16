import type { Metadata, Viewport } from "next";
import { Oswald, Zen_Kaku_Gothic_New } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { isLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SITE } from "@/lib/seo";
import "../globals.css";

const display = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/**
 * The Japanese face ships as about 120 unicode-range slices per weight. Preloading
 * it pushed 190 font files (2 MB) into every page: the browser now fetches only the
 * slices a page really uses.
 */
const body = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020817",
  colorScheme: "dark",
};

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * This is the root layout: the locale comes from the URL segment, never from request
 * headers, so every editorial page is prerendered and served from the cache.
 */
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
