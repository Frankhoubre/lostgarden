"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/navigation";
import { BUILT_IN_PROJECT_ID, blankProject, newProjectId, type OnboardingStep, type ProjectSummary } from "@/lib/webtoon/project";
import { listProjects, removeProject, saveProject } from "@/lib/webtoon/projects-client";

const STATE: Record<OnboardingStep, string> = {
  source: "À démarrer",
  frames: "Images du film à extraire",
  characters: "Bible : personnages",
  objects: "Bible : objets",
  locations: "Bible : lieux",
  done: "Prêt à générer",
};

const SOURCE: Record<ProjectSummary["source"], string> = { video: "Vidéo", screenplay: "Scénario", scratch: "De zéro" };

function when(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/**
 * The studio's front page: every webtoon project, Lost Garden first (built
 * in, its script lives in the code), then the projects created here, newest
 * first. A new project starts with its title and opens on its onboarding.
 */
export function StudioHome() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listProjects()
      .then(setProjects)
      .catch((e: unknown) => {
        setProjects([]);
        setError(e instanceof Error ? e.message : "Liste des projets illisible");
      });
  }, [user]);

  const create = async () => {
    const title = draft?.trim();
    if (!title || !user) return;
    setBusy(true);
    try {
      const project = blankProject({ id: newProjectId(title), title, source: "video" });
      await saveProject(project, user);
      router.push(localePath(locale, `/convert-video-to-webtoon/${project.id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible");
      setBusy(false);
    }
  };

  const remove = async (project: ProjectSummary) => {
    if (!user || !window.confirm(`Retirer « ${project.title} » de la liste ? Ses images et sa bible restent enregistrées.`)) return;
    await removeProject(project.id, user);
    setProjects((list) => (list ?? []).filter((p) => p.id !== project.id));
  };

  const open = (id: string) => localePath(locale, `/convert-video-to-webtoon/${id}`);

  return (
    <div className="studio-home">
      <header className="studio-bar">
        <div className="studio-bar-title">
          <Link href={localePath(locale, "/")} className="anime-heading font-display text-base text-lily hover:text-magic">Lost Garden</Link>
          <span className="studio-bar-sep">/</span>
          <span className="anime-label text-xs text-cyan-pale">Studio webtoon</span>
        </div>
      </header>
      <main className="studio-home-main">
        <section className="studio-home-head">
          <div>
            <h1 className="font-display text-2xl text-lily">Vos webtoons</h1>
            <p className="text-sm text-ivory/70">Un projet par webtoon : sa vidéo ou son scénario, sa bible (personnages, objets, lieux), sa bande.</p>
          </div>
          {draft === null ? (
            <button type="button" className="webtoon-mini studio-primary" onClick={() => setDraft("")}>+ Nouveau projet</button>
          ) : (
            <form
              className="studio-home-new"
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
            >
              <input className="studio-input" placeholder="Titre du webtoon" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus disabled={busy} />
              <button type="submit" className="webtoon-mini studio-primary" disabled={!draft.trim() || busy}>{busy ? "Création…" : "Créer"}</button>
              <button type="button" className="webtoon-mini" onClick={() => setDraft(null)} disabled={busy}>Annuler</button>
            </form>
          )}
        </section>
        {error ? <p className="studio-notice">{error}</p> : null}
        <div className="studio-project-grid">
          <Link href={open(BUILT_IN_PROJECT_ID)} className="studio-card studio-project">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/webtoon/references/lanterne-webtoon-sheet.png" alt="" />
            <div>
              <b>Lost Garden · Épisode 1</b>
              <span>Vidéo · bible du moteur · webtoon en cours</span>
            </div>
          </Link>
          {(projects ?? []).map((p) => (
            <article key={p.id} className="studio-card studio-project">
              <Link href={open(p.id)} className="studio-project-link">
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt="" />
                ) : (
                  <div className="studio-project-empty">{p.title.slice(0, 1).toUpperCase()}</div>
                )}
                <div>
                  <b>{p.title}</b>
                  <span>
                    {SOURCE[p.source]} · {STATE[p.onboarding]} · {when(p.updated_at)}
                  </span>
                </div>
              </Link>
              <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => void remove(p)} title="Retirer de la liste">×</button>
            </article>
          ))}
          {projects === null && user ? <p className="text-sm text-ivory/60">Chargement des projets…</p> : null}
        </div>
      </main>
    </div>
  );
}
