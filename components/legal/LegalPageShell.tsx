import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL_PUBLISHER } from "@/lib/legal";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <>
      <header className="site-nav border-b border-glow/20 px-5 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link
            href="/"
            className="anime-heading font-display text-lg text-lily transition hover:text-magic"
          >
            {LEGAL_PUBLISHER.project}
          </Link>
          <Link
            href="/"
            className="font-body text-sm font-medium text-cyan-pale/80 underline-offset-4 transition hover:text-magic hover:underline"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <h1 className="anime-heading font-display text-3xl text-lily sm:text-4xl">
          {title}
        </h1>
        <article className="legal-prose mt-10 space-y-8 font-body text-sm leading-relaxed text-ivory/85 sm:text-base">
          {children}
        </article>
      </main>

      <SiteFooter />
    </>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="anime-heading font-display text-xl text-lily">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export { LegalSection };
