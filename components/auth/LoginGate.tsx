"use client";

import { ExperiencePitch } from "@/components/experience/ExperiencePitch";
import { AuthForm } from "@/components/auth/AuthForm";
import { LoginSceneBackground } from "@/components/auth/LoginSceneBackground";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";

export function LoginGate() {
  const { locale, dict } = useLocale();

  return (
    <div className="relative min-h-screen overflow-hidden px-5 py-28">
      <LoginSceneBackground fixed />

      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl tracking-[0.12em] text-lily drop-shadow-[0_2px_24px_rgba(2,8,23,0.9)]">
          {dict.discover.title}
        </h1>
        <p className="mt-4 font-body text-sm leading-relaxed text-ivory/75 drop-shadow-[0_1px_16px_rgba(2,8,23,0.85)]">
          {dict.auth.loginIntro}
        </p>
        <ExperiencePitch className="mt-8" />
        <div className="mt-8">
          <AuthForm redirectTo={localePath(locale, "/experience")} />
        </div>
      </div>
    </div>
  );
}
