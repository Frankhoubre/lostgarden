"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import { ExperienceContent } from "@/components/experience/ExperienceContent";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ExperiencePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss px-5">
        <p className="font-body text-sm text-ivory/50" role="status">
          Opening the gate…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen px-5 py-28">
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.12),transparent_45%),linear-gradient(180deg,#020817,#06162f)]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-lg text-center">
          <h1 className="font-display text-3xl tracking-[0.12em] text-lily">
            Discover the experience
          </h1>
          <p className="mt-4 font-body text-sm leading-relaxed text-ivory/60">
            Sign in to enter the first chapter of the underground.
          </p>
          <div className="mt-10">
            <AuthForm redirectTo="/experience" />
          </div>
        </div>
      </div>
    );
  }

  return <ExperienceContent user={user} />;
}
