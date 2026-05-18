"use client";

import { LoginGate } from "@/components/auth/LoginGate";
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
    return <LoginGate />;
  }

  return <ExperienceContent user={user} />;
}
