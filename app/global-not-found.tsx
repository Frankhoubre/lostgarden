import Link from "next/link";
import { Oswald } from "next/font/google";
import "./globals.css";

/**
 * Served when a URL matches no route, outside any layout. The locale proxy
 * redirects nearly every path into a locale first, so this mostly catches
 * file-like paths that bypass it. English only, by design: there is no
 * locale to read here.
 */

const display = Oswald({ subsets: ["latin"], weight: ["600"] });

export default function GlobalNotFound() {
  return (
    <html lang="en" className={display.className}>
      <head>
        <title>Page not found | Lost Garden</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="min-h-screen bg-abyss text-lily antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center">
          <p className="text-sm tracking-[0.2em] text-magic">404</p>
          <h1 className="mt-3 text-3xl text-lily">This page does not exist.</h1>
          <Link href="/en" className="btn-primary mt-10">
            Back to Lost Garden
          </Link>
        </main>
      </body>
    </html>
  );
}
