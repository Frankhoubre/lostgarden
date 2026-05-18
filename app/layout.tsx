import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      className={`${cinzel.variable} ${inter.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-abyss text-lily antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
