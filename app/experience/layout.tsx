import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Discover the Experience — Lost Garden",
  description:
    "Sign in to explore early Lost Garden visuals, episode notes, and the world beneath the earth.",
  robots: { index: false, follow: false },
};

export default function ExperienceLayout({ children }: { children: ReactNode }) {
  return children;
}
