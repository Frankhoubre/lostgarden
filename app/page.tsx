import { CharactersSection } from "@/components/CharactersSection";
import { CreaturesSection } from "@/components/CreaturesSection";
import { EpisodeSection } from "@/components/EpisodeSection";
import { Hero } from "@/components/Hero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { TrailerSection } from "@/components/TrailerSection";
import { VisualIdentitySection } from "@/components/VisualIdentitySection";
import { DiscoverSection } from "@/components/DiscoverSection";
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

      <SiteNav />

      <main id="main">
        <Hero />
        <WorldSection />
        <CharactersSection />
        <CreaturesSection />
        <EpisodeSection />
        <VisualIdentitySection />
        <TrailerSection />
        <DiscoverSection />
      </main>

      <SiteFooter />
    </>
  );
}
