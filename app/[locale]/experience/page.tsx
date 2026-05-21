"use client";

import { LoginGate } from "@/components/auth/LoginGate";
import { ExperienceContent } from "@/components/experience/ExperienceContent";
import { useDictionary } from "@/components/providers/LocaleProvider";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ExperiencePage() {
  const { user, loading } = useAuth();
  const dict = useDictionary();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-abyss px-5">
        <p className="font-body text-sm text-ivory/50" role="status">
          {dict.common.loadingGate}
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginGate />;
  }

  return <ExperienceContent user={user} />;
}
