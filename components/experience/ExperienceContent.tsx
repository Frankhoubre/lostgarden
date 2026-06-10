"use client";

import Link from "next/link";
import { Suspense } from "react";
import type { User } from "firebase/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { EpisodeWatchBlock } from "@/components/EpisodeWatchBlock";
import { EpisodeTimeline } from "@/components/EpisodeTimeline";
import { ExperienceJoinedNotice } from "@/components/experience/ExperienceJoinedNotice";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatMessage } from "@/lib/i18n/format";
import { localePath } from "@/lib/i18n/navigation";

type ExperienceContentProps = {
  user: User;
};

export function ExperienceContent({ user }: ExperienceContentProps) {
  const { locale, dict } = useLocale();
  const name =
    user.displayName ?? user.email?.split("@")[0] ?? dict.common.traveler;

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
              {dict.experience.seriesLabel}
            </p>
            <h1 className="anime-heading mt-2 font-display text-3xl text-lily sm:text-4xl">
              {formatMessage(dict.experience.welcome, { name })}
            </h1>
            <p className="mt-3 max-w-lg font-body text-base font-medium leading-relaxed text-ivory/90">
              {dict.experience.memberWelcome}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href={localePath(locale, "/")} className="btn-secondary">
              {dict.experience.backToGate}
            </Link>
            <SignOutButton />
          </div>
        </header>

        <section className="mt-10">
          <h2 className="anime-heading font-display text-2xl text-lily">
            {dict.experience.watchTitle}
          </h2>
          <p className="mt-3 font-body text-sm font-medium leading-relaxed text-ivory/85">
            {dict.experience.watchLead}
          </p>
          <EpisodeWatchBlock
            className="mt-6"
            title={dict.trailer.embedTitle}
          />
        </section>

        <Suspense fallback={null}>
          <ExperienceJoinedNotice user={user} />
        </Suspense>

        <section className="mt-14">
          <h2 className="anime-heading font-display text-2xl text-lily">
            {dict.experience.notesTitle}
          </h2>
          <p className="mt-3 font-body text-sm font-medium leading-relaxed text-ivory/85">
            {dict.experience.notesLead}
          </p>
          <div className="mt-8">
            <EpisodeTimeline steps={dict.experience.timeline} />
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dict.experience.previews.map((block) => (
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

      </div>
    </div>
  );
}
