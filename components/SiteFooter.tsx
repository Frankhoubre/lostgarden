const links = [
  { label: "Instagram", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "Contact", href: "mailto:contact@lostgarden.app" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer relative px-5 py-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <p className="font-display text-2xl tracking-[0.2em] text-lily sm:text-3xl">
          LOST GARDEN
        </p>
        <p className="font-body text-sm text-ivory/50">
          An original anime project by Frank Houbre.
        </p>
        <nav aria-label="Social and contact links">
          <ul className="flex flex-wrap items-center justify-center gap-6">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="font-body text-sm text-ivory/60 underline-offset-4 transition hover:text-magic hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss rounded-sm"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-ivory/30">
          © {new Date().getFullYear()} Lost Garden. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
