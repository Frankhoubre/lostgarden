import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Discover the Experience",
  description:
    "Join the Lost Garden experience: early previews, lore, and episode watch links sent to your email when new chapters are released.",
  path: "/experience",
  noIndex: true,
});

export default function ExperienceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
