import type { Metadata } from "next";
import { Oswald, Zen_Kaku_Gothic_New } from "next/font/google";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { AuthProvider } from "@/components/providers/AuthProvider";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lostgarden.app";

export const metadata: Metadata = {
  title: "Lost Garden — Official Anime Project",
  description:
    "A poetic dark fantasy anime about a hollow knight, a mysterious child, and a hidden world beneath the earth.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Lost Garden — Official Anime Project",
    description:
      "A poetic dark fantasy anime about a hollow knight, a mysterious child, and a hidden world beneath the earth.",
    type: "website",
    locale: "en_US",
    siteName: "Lost Garden",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lost Garden — Official Anime Project",
    description:
      "A poetic dark fantasy anime about a hollow knight, a mysterious child, and a hidden world beneath the earth.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-abyss text-lily font-body font-medium antialiased">
        <AuthProvider>
          {children}
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
