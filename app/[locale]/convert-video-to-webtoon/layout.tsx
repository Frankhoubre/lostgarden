import { Inter } from "next/font/google";
import type { ReactNode } from "react";

/** The studio's own interface face: a plain, modern sans for a working tool, apart from the series' look. */
const ui = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-ui", display: "swap" });

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className={`${ui.variable} studio-theme`}>{children}</div>;
}
