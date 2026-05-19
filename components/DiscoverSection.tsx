"use client";

import Link from "next/link";
import { AnimatedInView } from "./AnimatedInView";
import { EXPERIENCE_COPY } from "@/lib/experience-copy";
import { ExperiencePitch } from "./experience/ExperiencePitch";
import { AuthForm } from "./auth/AuthForm";
import { SignOutButton } from "./auth/SignOutButton";
import { SectionTitle } from "./SectionTitle";
import { useAuth } from "./providers/AuthProvider";

export function DiscoverSection() {
  const { user, loading } = useAuth();

  return (
    <section id="discover" className="section-pad section-discover scroll-mt-14">
      <AnimatedInView>
        <SectionTitle subtitle={EXPERIENCE_COPY.sectionSubtitle}>
          Join the experience
        </SectionTitle>
      </AnimatedInView>

      <AnimatedInView className="mt-10" delay={0.08}>
        <ExperiencePitch />
      </AnimatedInView>

      <AnimatedInView className="mt-10" delay={0.12}>
        {loading ? (
          <p className="text-center font-body text-sm text-ivory/50" role="status">
            Opening the gate…
          </p>
        ) : user ? (
          <div className="auth-card glass-card mx-auto max-w-md p-8 text-center">
            <p className="anime-heading font-display text-xl text-lily">
              You are in
              {user.displayName ? `, ${user.displayName}` : ""}.
            </p>
            <p className="mt-3 font-body text-sm leading-relaxed text-ivory/60">
              {EXPERIENCE_COPY.welcomeBack}
            </p>
            {user.email ? (
              <p className="mt-2 font-body text-xs text-cyan-pale/70">
                Episode One link → <span className="text-lily">{user.email}</span>
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/experience" className="btn-primary">
                Enter the experience
              </Link>
              <SignOutButton />
            </div>
          </div>
        ) : (
          <AuthForm redirectTo="/experience" />
        )}
      </AnimatedInView>
    </section>
  );
}
