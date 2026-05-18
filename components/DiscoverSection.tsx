"use client";

import Link from "next/link";
import { AnimatedInView } from "./AnimatedInView";
import { AuthForm } from "./auth/AuthForm";
import { SignOutButton } from "./auth/SignOutButton";
import { SectionTitle } from "./SectionTitle";
import { useAuth } from "./providers/AuthProvider";

export function DiscoverSection() {
  const { user, loading } = useAuth();

  return (
    <section id="discover" className="section-pad section-discover scroll-mt-14">
      <AnimatedInView>
        <SectionTitle subtitle="Sign in to enter the first chapter of the underground: early visuals, episode notes, and the world before the trailer.">
          Discover the experience
        </SectionTitle>
      </AnimatedInView>

      <AnimatedInView className="mt-12" delay={0.12}>
        {loading ? (
          <p className="text-center font-body text-sm text-ivory/50" role="status">
            Opening the gate…
          </p>
        ) : user ? (
          <div className="auth-card glass-card mx-auto max-w-md p-8 text-center">
            <p className="anime-heading font-display text-xl text-lily">
              Welcome back
              {user.displayName ? `, ${user.displayName}` : ""}.
            </p>
            <p className="mt-3 font-body text-sm text-ivory/60">
              The Garden remembers you. Continue into the experience.
            </p>
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
