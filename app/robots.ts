import type { MetadataRoute } from "next";
import { SITE, absoluteUrl } from "@/lib/seo";

/**
 * AI / LLM crawlers explicitly welcomed so the project stays discoverable
 * in answer engines (ChatGPT, Claude, Perplexity, Gemini, Copilot…).
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "cohere-ai",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE.url,
  };
}
