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
