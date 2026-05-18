"use client";

import Image from "next/image";
import Link from "next/link";
import type { User } from "firebase/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { EpisodeTimeline } from "@/components/EpisodeTimeline";

const EPISODE_STEPS = [
  { title: "The Oath", line: "Words spoken where no one listens." },
  { title: "The Awakening", line: "Metal opens its eyes without a face." },
  { title: "The Blue Forest", line: "Mushrooms lit paths no sun ever touched." },
  { title: "The Eye in the Dark", line: "A giant remembers it is awake." },
  { title: "The Child in the Lilies", line: "White petals find her in the mist." },
] as const;

const PREVIEW_BLOCKS = [
  {
    title: "The Blue Forest",
    text: "A forest without sky. Bioluminescent mushrooms, pale flowers, and roots that drink the dark.",
  },
  {
    title: "Sol & Rose",
    text: "An empty armor and a quiet child — one made to obey, one who should have been protected.",
  },
  {
    title: "Sleeping Machines",
    text: "Colossal organic relics, half-buried in moss. Some eyes still open when the mist moves.",
  },
] as const;

type ExperienceContentProps = {
  user: User;
};

export function ExperienceContent({ user }: ExperienceContentProps) {
  const name = user.displayName ?? user.email?.split("@")[0] ?? "Traveler";

  return (
    <div className="relative min-h-screen">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(56,189,248,0.14),transparent_40%),linear-gradient(180deg,#020817,#06162f,#020817)]"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-4xl px-5 pb-20 pt-28">
        <header className="flex flex-col gap-6 border-b border-glow/10 pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="anime-label font-display text-xs text-cyan-pale/75">
              Lost Garden — First Light
            </p>
            <h1 className="anime-heading mt-2 font-display text-3xl text-lily sm:text-4xl">
              Welcome, {name}
            </h1>
            <p className="mt-3 max-w-lg font-body text-base font-medium leading-relaxed text-ivory/90">
              You have crossed the threshold. This is an early look at the world
              beneath — before the first episode reaches the surface.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/" className="btn-secondary">
              Back to the gate
            </Link>
            <SignOutButton />
          </div>
        </header>

        <section className="mt-14">
          <h2 className="anime-heading font-display text-2xl text-lily">
            Episode One — notes
          </h2>
          <p className="mt-3 font-body text-sm font-medium leading-relaxed text-ivory/85">
            Production diary fragments. More will appear as the caverns open.
          </p>
          <div className="mt-8">
            <EpisodeTimeline steps={[...EPISODE_STEPS]} />
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {PREVIEW_BLOCKS.map((block) => (
            <article key={block.title} className="glass-card p-6">
              <h3 className="anime-heading font-display text-lg text-lily">
                {block.title}
              </h3>
              <p className="mt-3 font-body text-sm leading-relaxed text-ivory/85">
                {block.text}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-16 overflow-hidden rounded-xl border-2 border-glow/30 shadow-[0_5px_0_rgba(2,8,23,0.75)]">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/images/blue-forest.png"
              alt="The Blue Forest — glowing mushrooms and mist beneath the earth"
              fill
              className="object-cover opacity-90"
              sizes="(max-width: 896px) 100vw, 896px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="anime-heading font-display text-xl text-lily sm:text-2xl">
                Trailer coming soon
              </p>
              <p className="mt-2 font-body text-sm font-medium text-ivory/85">
                You will be among the first to see it when the light returns.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
