const socialLinks = [
  { label: "Instagram", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "Contact", href: "mailto:contact@lostgarden.app" },
] as const;

const legalLinks = [
  { label: "Legal notice", href: "/legal-notice" },
  { label: "Privacy", href: "/privacy-policy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer relative px-5 py-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <p className="anime-heading font-display text-2xl text-lily sm:text-3xl">
          LOST GARDEN
        </p>
        <p className="font-body text-sm font-medium text-ivory/75">
          An original anime project by Frank Houbre.
        </p>
        <nav aria-label="Social and contact links">
          <ul className="flex flex-wrap items-center justify-center gap-6">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="font-display text-sm font-semibold uppercase tracking-wider text-ivory/80 underline-offset-4 transition hover:text-magic hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss rounded-sm"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal links">
          <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-body text-xs font-medium text-ivory/55 underline-offset-4 transition hover:text-cyan-pale hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 rounded-sm sm:text-sm"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-ivory/30">
          © {new Date().getFullYear()} Lost Garden — Frank Houbre. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
