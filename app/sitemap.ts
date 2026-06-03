import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return getSitemapEntries().map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
    alternates: entry.alternates,
  }));
}
