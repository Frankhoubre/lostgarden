"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StudioApp } from "@/components/studio/StudioApp";
import { StudioOnboarding } from "@/components/studio/StudioOnboarding";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";
import { labelledFrames, projectScript, type ProjectFrame, type StudioProject } from "@/lib/webtoon/project";
import { loadFrames, loadProject } from "@/lib/webtoon/projects-client";

/**
 * A project of the studio: its onboarding while the bible is not complete
 * (or when the editor asks for it with `?bible=1`), the editor after.
 */
export function StudioProjectLoader({ id, openBible }: { id: string; openBible: boolean }) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [state, setState] = useState<{ project: StudioProject; frames: ProjectFrame[] } | null | "missing">(null);
  const [mode, setMode] = useState<"bible" | "editor" | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([loadProject(id), loadFrames(id)])
      .then(([project, frames]) => {
        if (cancelled) return;
        if (!project) return setState("missing");
        setState({ project, frames });
        setMode(openBible || project.onboarding !== "done" ? "bible" : "editor");
      })
      .catch(() => {
        if (!cancelled) setState("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [id, user, openBible]);

  const script = useMemo(() => (state && state !== "missing" ? projectScript(state.project) : null), [state]);
  const frames = useMemo(() => (state && state !== "missing" ? labelledFrames(state.frames) : []), [state]);

  if (state === "missing") {
    return (
      <div className="studio-door">
        <div className="studio-door-card space-y-3">
          <p className="studio-door-lead">Ce projet n&apos;existe pas ou n&apos;est plus dans la liste.</p>
          <Link href={localePath(locale, "/convert-video-to-webtoon")} className="webtoon-mini">Tous les projets</Link>
        </div>
      </div>
    );
  }
  if (!state || !mode || !script) {
    return (
      <div className="studio-door">
        <p className="studio-door-status" role="status">Ouverture du projet…</p>
      </div>
    );
  }
  if (mode === "bible") {
    return (
      <StudioOnboarding
        project={state.project}
        frames={state.frames}
        initialStep={openBible && state.project.onboarding === "done" ? "characters" : undefined}
        onDone={(project, list) => {
          setState({ project, frames: list });
          setMode("editor");
          window.history.replaceState(null, "", localePath(locale, `/convert-video-to-webtoon/${project.id}`));
        }}
      />
    );
  }
  return <StudioApp key={state.project.updated_at} script={script} project={state.project} frames={frames} />;
}
