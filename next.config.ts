import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
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
