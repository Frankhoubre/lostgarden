import { CharactersSection } from "@/components/CharactersSection";
import { Hero } from "@/components/Hero";
import { SiteFooter } from "@/components/SiteFooter";
import { TrailerSection } from "@/components/TrailerSection";
import { UniverseSection } from "@/components/UniverseSection";
import { WaitlistSection } from "@/components/WaitlistSection";
import { WorldSection } from "@/components/WorldSection";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-mist focus:px-4 focus:py-2 focus:text-lily"
      >
        Skip to content
      </a>

      <main id="main">
        <Hero />
        <WorldSection />
        <CharactersSection />
        <UniverseSection />
        <TrailerSection />
        <WaitlistSection />
      </main>

      <SiteFooter />
    </>
  );
}
