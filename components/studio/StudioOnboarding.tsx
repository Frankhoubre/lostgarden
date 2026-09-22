"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StudioBibleStep } from "@/components/studio/StudioBibleStep";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { assetStep, BIBLE_STEPS, type BibleStep } from "@/lib/webtoon/bible";
import { extractFrames, formatDuration, loadVideo } from "@/lib/webtoon/extract-frames";
import { localePath } from "@/lib/i18n/navigation";
import { loadLibrary, saveLibrary } from "@/lib/webtoon/library";
import { EMPTY_PROJECT_LIBRARY, frameLabel, labelledFrames, ONBOARDING_STEPS, sparseFrames, type OnboardingStep, type ProjectFrame, type ProjectSource, type StudioProject } from "@/lib/webtoon/project";
import { saveFrames, saveProject, uploadFrame } from "@/lib/webtoon/projects-client";
import { libraryWith } from "@/lib/webtoon/references";
import { readScreenplayFile } from "@/lib/webtoon/screenplay-file";
import type { LibraryOverlay } from "@/lib/webtoon/types";

type Props = {
  project: StudioProject;
  frames: ProjectFrame[];
  /** Step to open on (a finished project reopened from the editor lands on the bible). */
  initialStep?: OnboardingStep;
  /** The bible is complete: open the editor. */
  onDone: (project: StudioProject, frames: ProjectFrame[]) => void;
};

const STEP_LABEL: Record<OnboardingStep, string> = {
  source: "Le projet",
  frames: "Images du film",
  characters: "Personnages",
  objects: "Objets",
  locations: "Lieux",
  done: "Prêt",
};

const SOURCES: { id: ProjectSource; title: string; text: string }[] = [
  { id: "video", title: "Oui, j'ai la vidéo", text: "Le studio en tire une image par seconde, détecte les personnages, les objets et les lieux, puis suit le film case par case." },
  { id: "screenplay", title: "Non, j'ai un scénario", text: "Collez le texte ou lisez un fichier (texte, Fountain, Final Draft). La bible se construit depuis le scénario." },
  { id: "scratch", title: "Non, je pars de zéro", text: "Un synopsis suffit pour commencer. Vous créerez les personnages, les objets et les lieux à la main." },
];

const later = (a: OnboardingStep, b: OnboardingStep) => (ONBOARDING_STEPS.indexOf(a) >= ONBOARDING_STEPS.indexOf(b) ? a : b);

/**
 * THE ONBOARDING of a project, step by step, each one reopenable: the
 * project and its source (a video, a screenplay, nothing), the frames of
 * the film extracted in the browser, then the bible (characters, important
 * objects, locations and biomes: detected, validated, completed, drawn as
 * clean sheets), and the editor once the bible is complete. Everything is
 * saved as it happens: closing the tab loses nothing but a running
 * extraction, which picks up where it stopped.
 */
export function StudioOnboarding({ project: initialProject, frames: initialFrames, initialStep, onDone }: Props) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const [project, setProject] = useState<StudioProject>(initialProject);
  const [frames, setFrames] = useState<ProjectFrame[]>(initialFrames);
  const [library, setLibraryState] = useState<LibraryOverlay>(EMPTY_PROJECT_LIBRARY);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [step, setStep] = useState<OnboardingStep>(initialStep ?? (initialProject.onboarding === "done" ? "characters" : initialProject.onboarding));
  const [notice, setNotice] = useState<string | null>(null);
  const notify = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), /erreur|impossible|refus/i.test(message) ? 12000 : 3500);
  }, []);

  // Project and library are saved a moment after each change.
  const projectTimer = useRef<number | null>(null);
  const libraryTimer = useRef<number | null>(null);
  const latestProject = useRef(project);
  const latestLibrary = useRef(library);
  const flushProject = useCallback(async () => {
    if (projectTimer.current) window.clearTimeout(projectTimer.current);
    projectTimer.current = null;
    if (user) await saveProject(latestProject.current, user).catch((error: unknown) => notify(`Projet non enregistré : ${error instanceof Error ? error.message : "erreur"}`));
  }, [user, notify]);
  const flushLibrary = useCallback(async () => {
    if (libraryTimer.current) window.clearTimeout(libraryTimer.current);
    libraryTimer.current = null;
    if (user) await saveLibrary(latestProject.current.id, latestLibrary.current, user).catch((error: unknown) => notify(`Bible non enregistrée : ${error instanceof Error ? error.message : "erreur"}`));
  }, [user, notify]);
  const updateProject = useCallback(
    (change: (current: StudioProject) => StudioProject) => {
      setProject((current) => {
        const next = change(current);
        latestProject.current = next;
        return next;
      });
      if (projectTimer.current) window.clearTimeout(projectTimer.current);
      projectTimer.current = window.setTimeout(() => void flushProject(), 800);
    },
    [flushProject],
  );
  const updateLibrary = useCallback(
    (change: (current: LibraryOverlay) => LibraryOverlay) => {
      setLibraryState((current) => {
        const next = { ...change(current), base: "none" as const };
        latestLibrary.current = next;
        return next;
      });
      if (libraryTimer.current) window.clearTimeout(libraryTimer.current);
      libraryTimer.current = window.setTimeout(() => void flushLibrary(), 800);
    },
    [flushLibrary],
  );

  useEffect(() => {
    let cancelled = false;
    loadLibrary(initialProject.id)
      .then((stored) => {
        if (cancelled || !stored) return;
        const next = { ...stored, base: "none" as const };
        latestLibrary.current = next;
        setLibraryState(next);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLibraryLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [initialProject.id]);

  const go = (next: OnboardingStep) => {
    updateProject((current) => ({ ...current, onboarding: current.onboarding === "done" ? "done" : later(current.onboarding, next) }));
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const nextOf = (current: OnboardingStep): OnboardingStep => {
    const order = ONBOARDING_STEPS.filter((s) => s !== "frames" || project.source === "video");
    return order[Math.min(order.length - 1, order.indexOf(current) + 1)];
  };

  const counts = useMemo(() => {
    const all = libraryWith(library);
    const by = (s: BibleStep) => all.filter((a) => assetStep(a) === s && (a.kind !== "character" || (a.priority ?? 1) === 1));
    return Object.fromEntries(BIBLE_STEPS.map((s) => [s.id, { kept: by(s.id).length, sheets: by(s.id).filter((a) => a.image).length, pending: project.candidates?.[s.id]?.length ?? 0 }])) as Record<BibleStep, { kept: number; sheets: number; pending: number }>;
  }, [library, project.candidates]);

  const labelled = useMemo(() => labelledFrames(frames), [frames]);
  const visibleSteps = ONBOARDING_STEPS.filter((s) => s !== "frames" || project.source === "video");

  const finish = async () => {
    const done = { ...latestProject.current, onboarding: "done" as const };
    latestProject.current = done;
    setProject(done);
    await Promise.all([flushProject(), flushLibrary()]);
    onDone(done, frames);
  };

  return (
    <div className="studio-onboarding">
      <header className="studio-bar">
        <div className="studio-bar-title">
          <Link href={localePath(locale, "/convert-video-to-webtoon")} className="anime-label text-xs text-cyan-pale hover:text-magic">Studio webtoon</Link>
          <span className="studio-bar-sep">/</span>
          <span className="text-sm text-ivory/85">{project.title}</span>
        </div>
        <div className="studio-bar-actions">
          {notice ? <span className="studio-notice">{notice}</span> : null}
          {project.onboarding === "done" ? (
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void finish()}>Retour à l&apos;éditeur</button>
          ) : null}
        </div>
      </header>

      <nav className="studio-steps" aria-label="Étapes">
        {visibleSteps.map((s, i) => {
          const reached = ONBOARDING_STEPS.indexOf(s) <= ONBOARDING_STEPS.indexOf(project.onboarding);
          const info = s === "characters" || s === "objects" || s === "locations" ? counts[s] : null;
          return (
            <button key={s} type="button" className={`studio-step ${step === s ? "is-active" : ""} ${reached ? "is-reached" : ""}`} onClick={() => (reached || s === step ? setStep(s) : undefined)} disabled={!reached && s !== step}>
              <span className="studio-step-number">{i + 1}</span>
              <span>{STEP_LABEL[s]}</span>
              {s === "frames" && frames.length ? <small>{frames.length} images</small> : null}
              {info ? <small>{info.kept} · {info.sheets} fiche{info.sheets > 1 ? "s" : ""}{info.pending ? ` · ${info.pending} à valider` : ""}</small> : null}
            </button>
          );
        })}
      </nav>

      <main className="studio-onboarding-main">
        {step === "source" ? (
          <SourceStep project={project} updateProject={updateProject} notify={notify} onNext={() => go(nextOf("source"))} />
        ) : null}
        {step === "frames" ? (
          <FramesStep
            project={project}
            frames={frames}
            onFrames={(list) => setFrames(list)}
            updateProject={updateProject}
            notify={notify}
            onNext={() => go(nextOf("frames"))}
          />
        ) : null}
        {step === "characters" || step === "objects" || step === "locations" ? (
          libraryLoaded ? (
            <>
              <StudioBibleStep key={step} step={step} project={project} updateProject={updateProject} frames={labelled} library={library} updateLibrary={updateLibrary} notify={notify} />
              <div className="studio-onboarding-next">
                <button type="button" className="webtoon-mini studio-primary" onClick={() => go(nextOf(step))}>
                  {step === "locations" ? "Terminer la bible" : `Étape suivante : ${STEP_LABEL[nextOf(step)]}`}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-ivory/60">Chargement de la bible…</p>
          )
        ) : null}
        {step === "done" ? (
          <section className="studio-card space-y-4">
            <p className="anime-label text-xs text-cyan-pale">La bible est prête</p>
            <h2 className="font-display text-xl text-lily">{project.title}</h2>
            <ul className="studio-bible-summary">
              {BIBLE_STEPS.map((s) => (
                <li key={s.id}>
                  <b>{counts[s.id].kept}</b> {s.label.toLowerCase()} · {counts[s.id].sheets} fiche{counts[s.id].sheets > 1 ? "s" : ""}
                  {counts[s.id].kept > counts[s.id].sheets ? <em> · {counts[s.id].kept - counts[s.id].sheets} sans fiche</em> : null}
                </li>
              ))}
              {project.source === "video" ? <li><b>{frames.length}</b> images du film ({formatDuration(project.video?.duration ?? frames.length)})</li> : null}
            </ul>
            <div className="studio-sheet-wall">
              {libraryWith(library)
                .filter((a) => a.image && assetStep(a))
                .map((a) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={a.id} src={a.image} alt={a.name} title={a.name.split(",")[0]} />
                ))}
            </div>
            <p className="text-sm text-ivory/70">
              Dans l&apos;éditeur, « Suite de l&apos;histoire » écrit les cases à partir du film et du scénario, joint à chaque case les fiches de ce qu&apos;elle montre, puis dessine et traduit. La bible reste modifiable à tout moment depuis le bouton « Bible du projet ».
            </p>
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void finish()}>Ouvrir l&apos;éditeur et générer le webtoon</button>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function SourceStep({ project, updateProject, notify, onNext }: { project: StudioProject; updateProject: (change: (current: StudioProject) => StudioProject) => void; notify: (message: string) => void; onNext: () => void }) {
  return (
    <div className="space-y-5">
      <section className="studio-card space-y-3">
        <label className="webtoon-field">
          <span>Titre du projet</span>
          <input value={project.title} onChange={(e) => updateProject((p) => ({ ...p, title: e.target.value }))} />
        </label>
        <label className="webtoon-field">
          <span>Synopsis (quelques lignes : l&apos;histoire, les personnages, le ton)</span>
          <textarea rows={4} value={project.synopsis} onChange={(e) => updateProject((p) => ({ ...p, synopsis: e.target.value }))} />
        </label>
        <label className="webtoon-field">
          <span>Langue des textes</span>
          <select value={project.language} onChange={(e) => updateProject((p) => ({ ...p, language: e.target.value as "fr" | "en" }))}>
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
          </select>
        </label>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-lg text-lily">Avez-vous une vidéo de l&apos;histoire ?</h2>
        <div className="studio-source-grid">
          {SOURCES.map((s) => (
            <button key={s.id} type="button" className={`studio-card studio-source ${project.source === s.id ? "is-on" : ""}`} onClick={() => updateProject((p) => ({ ...p, source: s.id }))}>
              <b>{s.title}</b>
              <span>{s.text}</span>
            </button>
          ))}
        </div>
      </section>
      {project.source !== "scratch" ? (
        <section className="studio-card space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="anime-label text-xs text-cyan-pale">Scénario {project.source === "video" ? "(facultatif, mais il aide beaucoup)" : ""}</p>
              <p className="text-xs text-ivory/60">Le film et le scénario se lisent ensemble : le scénario dit ce que les images ne disent pas.</p>
            </div>
            <label className="webtoon-mini cursor-pointer">
              Lire un fichier…
              <input
                type="file"
                accept=".txt,.fountain,.fdx,.md,text/plain"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    const text = await readScreenplayFile(file);
                    updateProject((p) => ({ ...p, screenplay: text }));
                    notify(`${file.name} lu`);
                  } catch (error) {
                    notify(error instanceof Error ? error.message : "Fichier illisible");
                  }
                }}
              />
            </label>
          </div>
          <textarea className="studio-textarea studio-textarea-mono" rows={10} value={project.screenplay} onChange={(e) => updateProject((p) => ({ ...p, screenplay: e.target.value }))} placeholder="Collez ici le texte du scénario." />
        </section>
      ) : null}
      <div className="studio-onboarding-next">
        <button type="button" className="webtoon-mini studio-primary" onClick={onNext} disabled={!project.title.trim() || (project.source === "screenplay" && !project.screenplay.trim() && !project.synopsis.trim())}>
          Continuer
        </button>
      </div>
    </div>
  );
}

function FramesStep({
  project,
  frames,
  onFrames,
  updateProject,
  notify,
  onNext,
}: {
  project: StudioProject;
  frames: ProjectFrame[];
  onFrames: (frames: ProjectFrame[]) => void;
  updateProject: (change: (current: StudioProject) => StudioProject) => void;
  notify: (message: string) => void;
  onNext: () => void;
}) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<{ duration: number; width: number; height: number } | null>(null);
  const [progress, setProgress] = useState<{ read: number; sent: number; total: number; started: number; at: number } | null>(null);
  const stop = useRef(false);
  const collected = useRef<ProjectFrame[]>([]);

  const choose = async (picked: File) => {
    setFile(picked);
    setInfo(null);
    try {
      const loaded = await loadVideo(picked);
      setInfo(loaded.info);
      loaded.release();
    } catch (error) {
      setFile(null);
      notify(error instanceof Error ? error.message : "Vidéo illisible");
    }
  };

  const run = async () => {
    if (!file || !user) return notify(user ? "Choisissez d'abord la vidéo" : "Connectez-vous pour envoyer les images");
    stop.current = false;
    // Resume: the seconds already sent (same video) are kept and skipped.
    const sameVideo = project.video?.name === file.name;
    collected.current = sameVideo ? [...frames] : [];
    const skip = new Set(collected.current.map((f) => f.seconds));
    setProgress({ read: 0, sent: 0, total: 1, started: Date.now(), at: Date.now() });
    let lastSave = Date.now();
    try {
      const videoInfo = await extractFrames({
        file,
        skip,
        onFrame: async (seconds, blob) => {
          const src = await uploadFrame(project.id, seconds, blob);
          collected.current.push({ src, seconds });
          // The list is saved as it grows, so a stopped extraction resumes where it was.
          if (Date.now() - lastSave > 15000) {
            lastSave = Date.now();
            await saveFrames(project.id, collected.current, user);
          }
        },
        onProgress: (state) => setProgress((p) => ({ ...state, started: p?.started ?? Date.now(), at: Date.now() })),
        shouldStop: () => stop.current,
      });
      await saveFrames(project.id, collected.current, user);
      const sorted = [...collected.current].sort((a, b) => a.seconds - b.seconds);
      onFrames(sorted);
      const cover = sorted[Math.floor(sorted.length * 0.15)]?.src;
      updateProject((p) => ({ ...p, video: { name: file.name, duration: videoInfo.duration, width: videoInfo.width, height: videoInfo.height, interval: 1 }, frames_count: sorted.length, ...(cover ? { cover } : {}) }));
      notify(stop.current ? `Extraction arrêtée : ${sorted.length} images gardées, elle reprendra là` : `${sorted.length} images extraites`);
    } catch (error) {
      await saveFrames(project.id, collected.current, user).catch(() => undefined);
      onFrames([...collected.current].sort((a, b) => a.seconds - b.seconds));
      notify(`Extraction interrompue : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setProgress(null);
    }
  };

  // The time of the last progress report, not the clock of the render: the estimate stays pure.
  const eta = progress && progress.sent > 5 ? ((progress.at - progress.started) / progress.sent) * (progress.total - progress.sent) : null;
  const preview = sparseFrames(labelledFrames(frames), frames.length > 600 ? 20 : 10);

  return (
    <div className="space-y-5">
      <section className="studio-card space-y-3">
        <p className="anime-label text-xs text-cyan-pale">Images du film</p>
        <p className="text-sm text-ivory/80">
          Le studio lit la vidéo dans votre navigateur et en garde une image par seconde (640 px). La vidéo elle-même ne quitte pas votre ordinateur : seules les images partent, et c&apos;est sur elles que travaillent la détection de la bible et l&apos;écriture des cases.
        </p>
        {frames.length ? (
          <p className="text-sm text-lily">
            {frames.length} images déjà extraites{project.video ? ` de ${project.video.name} (${formatDuration(project.video.duration)})` : ""}.
          </p>
        ) : null}
        <label className="studio-drop">
          <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void choose(f); }} disabled={Boolean(progress)} />
          {file ? (
            <span>
              <b>{file.name}</b> · {(file.size / 1e6).toFixed(0)} Mo
              {info ? ` · ${formatDuration(info.duration)} · ${info.width}×${info.height} · ${Math.floor(info.duration)} images à extraire` : " · lecture…"}
            </span>
          ) : (
            <span>{frames.length ? "Choisir à nouveau la vidéo (pour compléter ou refaire)" : "Choisir la vidéo (MP4 de préférence)"}</span>
          )}
        </label>
        {progress ? (
          <div className="space-y-2">
            <div className="studio-progress"><span style={{ width: `${Math.round((progress.sent / Math.max(1, progress.total)) * 100)}%` }} /></div>
            <p className="text-xs text-ivory/70">
              {progress.read} lues · {progress.sent} envoyées sur {progress.total}
              {eta ? ` · ≈ ${formatDuration(eta / 1000)} restantes` : ""}
            </p>
            <p className="text-xs text-amber-200/80">Gardez cet onglet au premier plan : le navigateur ralentit la lecture de la vidéo dans un onglet caché.</p>
            <button type="button" className="webtoon-mini" onClick={() => { stop.current = true; }}>Arrêter (reprendra ici)</button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void run()} disabled={!file || !info}>
              {frames.length && project.video?.name === file?.name ? "Compléter l'extraction" : "Extraire une image par seconde"}
            </button>
            <button type="button" className="webtoon-mini" onClick={onNext} disabled={!frames.length}>Continuer : les personnages</button>
          </div>
        )}
      </section>
      {preview.length ? (
        <section className="studio-card">
          <p className="anime-label text-xs text-cyan-pale">Aperçu</p>
          <div className="studio-frames">
            {preview.slice(0, 60).map((f) => (
              <div key={f.src} className="studio-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.src} alt="" loading="lazy" />
                <span>{frameLabel(f.seconds)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
