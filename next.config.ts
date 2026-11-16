import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // The dev filesystem cache (on by default in Next 16) kept serving a stale
    // globals.css after edits, three times in one day; a cold start is cheap here.
    turbopackFileSystemCacheForDev: false,
  },
  async headers() {
    return [
      {
        // Stills, press images and stickers rarely change: let browsers and the CDN keep them
        // for a day and refresh in the background, instead of revalidating on every view.
        source: "/:dir(images|press|stickers|game)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/mentions-legales",
        destination: "/fr/legal-notice",
        permanent: true,
      },
      {
        source: "/politique-de-confidentialite",
        destination: "/fr/privacy-policy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
