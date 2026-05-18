import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Discover the Experience",
  description:
    "Sign in to explore early Lost Garden visuals, episode notes, and lore from the world beneath the earth. Members-only preview.",
  path: "/experience",
  noIndex: true,
});

export default function ExperienceLayout({ children }: { children: ReactNode }) {
  return children;
}
