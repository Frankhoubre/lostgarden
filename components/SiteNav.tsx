const navLinks = [
  { label: "World", href: "#world" },
  { label: "Characters", href: "#characters" },
  { label: "Creatures", href: "#creatures" },
  { label: "Episode One", href: "#episode-one" },
  { label: "Discover", href: "#discover" },
  { label: "Experience", href: "/experience" },
] as const;

export function SiteNav() {
  return (
    <nav
      className="site-nav sticky top-0 z-50 border-b border-glow/5 bg-abyss/75 backdrop-blur-md"
      aria-label="Page sections"
    >
      <div className="mx-auto max-w-6xl px-4">
        <ul className="flex items-center gap-1 overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center sm:gap-2 [&::-webkit-scrollbar]:hidden">
          {navLinks.map((link) => (
            <li key={link.href} className="shrink-0">
              <a
                href={link.href}
                className="inline-block rounded-md px-3 py-1.5 font-body text-xs tracking-[0.12em] text-sol-ivory/55 transition hover:bg-cavern/50 hover:text-magic focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/50 sm:text-sm"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
