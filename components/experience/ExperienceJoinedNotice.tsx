"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import { EPISODE_ONE } from "@/lib/episode";
import { localePath } from "@/lib/i18n/navigation";

const JOINED_STORAGE_KEY = "lostgarden-joined-notice";

/**
 * The "you just joined" flag lives in sessionStorage and is read through an
 * external store, so visibility is derived rather than set inside an effect.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readJoined(): boolean {
  return sessionStorage.getItem(JOINED_STORAGE_KEY) === "1";
}

function serverJoined(): boolean {
  return false;
}

function writeJoined(value: boolean) {
  if (value) sessionStorage.setItem(JOINED_STORAGE_KEY, "1");
  else sessionStorage.removeItem(JOINED_STORAGE_KEY);
  for (const listener of listeners) listener();
}

export function ExperienceJoinedNotice() {
  const searchParams = useSearchParams();
  const { locale, dict } = useLocale();
  const experiencePath = localePath(locale, "/experience");
  const visible = useSyncExternalStore(subscribe, readJoined, serverJoined);
  const justJoined = searchParams.get("joined") === "1";

  useEffect(() => {
    if (!justJoined) return;
    writeJoined(true);
    window.history.replaceState(null, "", experiencePath);
  }, [justJoined, experiencePath]);

  if (!visible) return null;

  const { postSignup } = dict.experience;

  function dismiss() {
    writeJoined(false);
  }

  return (
    <aside
      className="experience-joined-notice mt-10 rounded-xl border border-magic/35 bg-cavern/80 p-6 shadow-[0_0_40px_rgba(56,189,248,0.12)] backdrop-blur-sm sm:p-8"
      role="status"
      aria-live="polite"
    >
      <p className="anime-label episode-release-badge inline-block rounded-md border border-magic/40 bg-abyss/60 px-3 py-1.5 font-display text-xs tracking-[0.16em] text-lily">
        {dict.episodeOne.badge}
      </p>
      <p className="anime-label mt-3 font-display text-xs tracking-[0.2em] text-magic">
        {postSignup.title}
      </p>
      <p className="mt-2 font-body text-sm leading-relaxed text-ivory/85 sm:text-base">
        {postSignup.lead}
      </p>
      <div className="mt-5 rounded-lg border border-glow/20 bg-abyss/50 px-4 py-4">
        <p className="font-display text-sm font-semibold tracking-wide text-lily">
          {postSignup.supportHeading}
        </p>
        <p className="mt-2 font-body text-sm leading-relaxed text-ivory/75">
          {postSignup.supportBody}
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={EPISODE_ONE.watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary min-h-11 text-center"
        >
          {dict.episodeOne.openOnYouTube}
        </a>
        <button type="button" onClick={dismiss} className="btn-secondary min-h-11">
          {dict.common.gotIt}
        </button>
      </div>
    </aside>
  );
}
