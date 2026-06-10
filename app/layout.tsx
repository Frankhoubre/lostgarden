import type { Metadata, Viewport } from "next";
import { Oswald, Zen_Kaku_Gothic_New } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { getLocaleFromHeaders } from "@/lib/i18n/config";
import { SITE } from "@/lib/seo";
import "./globals.css";

const display = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
  themeColor: "#020817",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromHeaders();

  return (
    <html
      lang={locale}
      className={`${display.variable} ${body.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-abyss text-lily font-body font-medium antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
