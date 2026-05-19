"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "firebase/auth";
import { EXPERIENCE_COPY } from "@/lib/experience-copy";

const JOINED_STORAGE_KEY = "lostgarden-joined-notice";

type ExperienceJoinedNoticeProps = {
  user: User;
};

export function ExperienceJoinedNotice({ user }: ExperienceJoinedNoticeProps) {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("joined") === "1") {
      setVisible(true);
      sessionStorage.setItem(JOINED_STORAGE_KEY, "1");
      window.history.replaceState(null, "", "/experience");
      return;
    }
    if (sessionStorage.getItem(JOINED_STORAGE_KEY) === "1") {
      setVisible(true);
    }
  }, [searchParams]);

  if (!visible) return null;

  const email = user.email ?? "your email";

  function dismiss() {
    setVisible(false);
    sessionStorage.removeItem(JOINED_STORAGE_KEY);
  }

  const { postSignup } = EXPERIENCE_COPY;

  return (
    <aside
      className="experience-joined-notice mb-10 rounded-xl border border-magic/35 bg-cavern/80 p-6 shadow-[0_0_40px_rgba(56,189,248,0.12)] backdrop-blur-sm sm:p-8"
      role="status"
      aria-live="polite"
    >
      <p className="anime-label font-display text-xs tracking-[0.2em] text-magic">
        {postSignup.title}
      </p>
      <p className="mt-2 font-body text-sm leading-relaxed text-ivory/85 sm:text-base">
        {postSignup.lead}
      </p>
      <div className="mt-5 rounded-lg border border-glow/20 bg-abyss/50 px-4 py-4">
        <p className="font-display text-sm font-semibold tracking-wide text-lily">
          {postSignup.emailHeading}
        </p>
        <p className="mt-2 font-body text-sm leading-relaxed text-ivory/75">
          {postSignup.emailBody}
        </p>
        {user.email ? (
          <p className="mt-3 font-body text-sm text-cyan-pale/90">
            Watch link will be sent to{" "}
            <strong className="font-medium text-lily">{email}</strong>
          </p>
        ) : null}
      </div>
      <button type="button" onClick={dismiss} className="btn-primary mt-6 min-h-11">
        {postSignup.dismiss}
      </button>
    </aside>
  );
}
