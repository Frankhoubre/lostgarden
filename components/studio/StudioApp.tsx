"use client";

import { signOut } from "firebase/auth";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { StudioCharacters } from "@/components/studio/StudioCharacters";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { StudioFrames } from "@/components/studio/StudioFrames";
import { StudioLocations } from "@/components/studio/StudioLocations";
import { StudioScreenplay } from "@/components/studio/StudioScreenplay";
import { getFirebaseAuth } from "@/lib/firebase";
import { localePath } from "@/lib/i18n/navigation";
import { appendFromFrame } from "@/lib/webtoon/editor-ops";
import { computeLayout } from "@/lib/webtoon/layout";
import { EMPTY_LIBRARY, loadLibrary, saveLibrary } from "@/lib/webtoon/library";
import { DRAFTS_COLLECTION, PUBLISHED_COLLECTION, loadStrip, saveStrip } from "@/lib/webtoon/studio";
import { localizedText } from "@/lib/webtoon/text";
import type { LibraryOverlay, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

const PREVIEW_LOCALES: { id: Locale; label: string }[] = [
  { id: "fr", label: "FR" },
  { id: "en", label: "EN" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
];

/** What the editor reports about its running job, shown in the bar from every tab. */
export type JobSummary = { label: string; done: number; total: number; deadline: number } | null;

type Tab = "webtoon" | "scenario" | "personnages" | "decors" | "film";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "webtoon", label: "Webtoon", hint: "Cases, bulles, sons, tailles" },
  { id: "scenario", label: "Scénario", hint: "Le PDF et le découpage du film" },
  { id: "personnages", label: "Personnages", hint: "Fiches et planches modèles" },
  { id: "decors", label: "Décors", hint: "Lieux, ancres de style, bible" },
  { id: "film", label: "Images du film", hint: "Une image toutes les 5 s" },
];

type StudioAppProps = { script: WebtoonScript };

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/**
 * The private workspace. It keeps the working copy of the strip, loads and
 * saves it in Firestore, publishes it for the public reader, and hosts the
 * reference tabs. Everything else is delegated to the tab components.
 */
export function StudioApp({ script }: StudioAppProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const [tab, setTabState] = useState<Tab>("webtoon");
  const [panels, setPanels] = useState<WebtoonPanel[]>(script.panels);
  const [selectedId, setSelectedId] = useState<string | null>(script.panels[0]?.panel_id ?? null);
  /** The last loaded, saved or published panels: anything else is unsaved work. */
  const [baseline, setBaseline] = useState<WebtoonPanel[]>(script.panels);
  const dirty = panels !== baseline;
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // The tab lives in the URL hash, so a reload or a shared link lands on the same section.
  const setTab = useCallback((next: Tab) => {
    setTabState(next);
    window.history.replaceState(null, "", `#${next}`);
  }, []);
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const [hashTab, hashPanel] = window.location.hash.replace("#", "").split("/") as [Tab, string | undefined];
      if (TABS.some((entry) => entry.id === hashTab)) setTabState(hashTab);
      if (hashPanel) setSelectedId((current) => (script.panels.some((p) => p.panel_id === hashPanel) ? hashPanel : current));
    }, 0);
    return () => window.clearTimeout(handle);
  }, [script.panels]);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  /** Language of the lettering shown in the editor and the strip preview. */
  const [previewLocale, setPreviewLocale] = useState<Locale>(locale);
  const [job, setJob] = useState<JobSummary>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!job) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [job]);

  const [working, setWorking] = useState<"save" | "publish" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const notify = useCallback((message: string) => {
    setNotice(message);
    // An error stays long enough to be read; a confirmation goes away quickly.
    const isError = /erreur|impossible|Storage|Gateway|\d{3}\b|refus|échec/i.test(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), isError ? 12000 : 2600);
  }, []);

  // The studio's library of characters and locations, saved a moment after
  // each change so a sheet edit or a new character never needs a click.
  const [library, setLibraryState] = useState<LibraryOverlay>(EMPTY_LIBRARY);
  const librarySave = useRef<number | null>(null);
  const setLibrary = useCallback(
    (next: LibraryOverlay) => {
      setLibraryState(next);
      if (!user) return;
      if (librarySave.current) window.clearTimeout(librarySave.current);
      librarySave.current = window.setTimeout(() => {
        saveLibrary(script.slug, next, user).catch((error: unknown) => notify(`Bibliothèque non enregistrée : ${error instanceof Error ? error.message : "erreur"}`));
      }, 800);
    },
    [user, script.slug, notify],
  );

  // Load the draft and the published state once a studio account is signed
  // in. Without an account (local work behind ?dev=1) the engine version is
  // the draft and nothing is read or written.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const withTimeout = <T,>(promise: Promise<T>): Promise<T> =>
      Promise.race([promise, new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error("timeout")), 8000))]);
    const run = async () => {
      try {
        const [draft, published, storedLibrary] = await Promise.all([
          withTimeout(loadStrip(DRAFTS_COLLECTION, script.slug)),
          withTimeout(loadStrip(PUBLISHED_COLLECTION, script.slug)),
          withTimeout(loadLibrary(script.slug)).catch(() => null),
        ]);
        if (cancelled) return;
        if (storedLibrary) setLibraryState(storedLibrary);
        if (draft) {
          setPanels(draft.panels);
          setBaseline(draft.panels);
          setSelectedId((current) => (draft.panels.some((p) => p.panel_id === current) ? current : draft.panels[0]?.panel_id ?? null));
          setSavedAt(draft.updated_at);
        }
        if (published) setPublishedAt(published.updated_at);
      } catch {
        // No Firestore (local work or rules not deployed yet): the engine version is the draft.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [script.slug, user]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Automatic save asked by the editor after each panel written or generated,
  // so a reload in the middle of a long job loses nothing. The flag is read
  // once the new panels are rendered, then the draft is written silently.
  const wantAutosave = useRef(false);
  const requestAutosave = useCallback(() => {
    wantAutosave.current = true;
  }, []);
  useEffect(() => {
    if (!wantAutosave.current) return;
    wantAutosave.current = false;
    if (!user) return;
    let cancelled = false;
    saveStrip(DRAFTS_COLLECTION, script.slug, panels, user)
      .then((at) => {
        if (cancelled) return;
        setSavedAt(at);
        setBaseline(panels);
      })
      .catch((error: unknown) => {
        if (!cancelled) notify(`Enregistrement automatique impossible : ${error instanceof Error ? error.message : "erreur"}`);
      });
    return () => {
      cancelled = true;
    };
  }, [panels, user, script.slug, notify]);

  const save = useCallback(async () => {
    if (!user) {
      notify("Pas de compte connecté : rien n'est enregistré (mode local).");
      return;
    }
    setWorking("save");
    try {
      const at = await saveStrip(DRAFTS_COLLECTION, script.slug, panels, user);
      setSavedAt(at);
      setBaseline(panels);
      notify("Brouillon enregistré");
    } catch (error) {
      notify(`Enregistrement impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  }, [user, panels, script.slug, notify]);

  const publish = async () => {
    if (!user) {
      notify("Pas de compte connecté : publication impossible.");
      return;
    }
    if (!window.confirm("Publier cette version sur lostgarden.world/webtoon ? Elle remplace la version en ligne.")) return;
    setWorking("publish");
    try {
      const at = await saveStrip(DRAFTS_COLLECTION, script.slug, panels, user);
      await saveStrip(PUBLISHED_COLLECTION, script.slug, panels, user);
      setSavedAt(at);
      setPublishedAt(at);
      setBaseline(panels);
      notify("Publié. Le lecteur public se met à jour dans la minute.");
    } catch (error) {
      notify(`Publication impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  /** From the film tab: a new panel at the end of the strip, then straight to the editor on it. */
  const createFromFrame = (frame: { src: string; seconds: number }) => {
    const next = appendFromFrame(panels, frame, null);
    const created = next[next.length - 1];
    setPanels(next);
    setSelectedId(created.panel_id);
    setTab("webtoon");
    notify(`Case ${created.panel_id} créée. Écris sa description, puis Générer.`);
  };

  const exportJson = () => {
    const payload = { ...script, panels, layout: computeLayout(panels), generated_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.slug}.webtoon.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as { panels?: WebtoonPanel[] } | WebtoonPanel[];
        const next = Array.isArray(parsed) ? parsed : parsed.panels;
        if (next && next.length) {
          setPanels(next);
          setSelectedId(next[0].panel_id);
          notify("JSON importé");
        }
      } catch {
        notify("Ce fichier n'est pas un storyboard JSON");
      }
    });
  };

  const status = working === "save" ? "Enregistrement…" : working === "publish" ? "Publication…" : dirty ? "Modifications non enregistrées" : savedAt ? `Brouillon enregistré le ${formatTime(savedAt)}` : loaded || !user ? "Version du moteur" : "Chargement…";

  return (
    <div className="studio">
      <header className="studio-bar">
        <div className="studio-bar-title">
          <Link href={localePath(locale, "/")} className="anime-heading font-display text-base text-lily hover:text-magic">Lost Garden</Link>
          <span className="studio-bar-sep">/</span>
          <span className="anime-label text-xs text-cyan-pale">Studio webtoon</span>
          <span className="studio-bar-sep">/</span>
          <span className="text-sm text-ivory/85">{localizedText(script.title, locale)} · {localizedText(script.subtitle, locale)}</span>
        </div>
        <div className="studio-bar-actions">
          <div className="studio-langswitch" role="group" aria-label="Langue d'affichage">
            {PREVIEW_LOCALES.map((entry) => (
              <button key={entry.id} type="button" className={`webtoon-mini ${previewLocale === entry.id ? "is-active" : ""}`} onClick={() => setPreviewLocale(entry.id)} title="Langue des bulles affichées dans l'éditeur et l'aperçu">
                {entry.label}
              </button>
            ))}
          </div>
          {job ? (
            <button type="button" className="studio-jobpill" onClick={() => setTab("webtoon")} title="Revenir à l'éditeur">
              <span className="studio-spinner" aria-hidden />
              {job.label}
              {job.deadline > now ? ` · ≈ ${Math.max(1, Math.round((job.deadline - now) / 60000))} min` : ""}
            </button>
          ) : null}
          <span className={`studio-status ${dirty ? "is-dirty" : ""}`}>{status}</span>
          {publishedAt ? <span className="studio-status">Publié le {formatTime(publishedAt)}</span> : null}
          {notice ? <span className="studio-notice">{notice}</span> : null}
          <button type="button" className="webtoon-mini" onClick={() => void save()} disabled={working !== null}>Enregistrer</button>
          <button type="button" className="webtoon-mini studio-primary" onClick={() => void publish()} disabled={working !== null}>Publier</button>
          <button type="button" className="webtoon-mini" onClick={exportJson}>Exporter JSON</button>
          <button type="button" className="webtoon-mini" onClick={() => fileInput.current?.click()}>Importer JSON</button>
          <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
          <button
            type="button"
            className="webtoon-mini"
            onClick={() => {
              if (!window.confirm("Revenir à la version du moteur ? Le brouillon en cours est remplacé (il reste enregistré tant que tu n'enregistres pas).")) return;
              setPanels(script.panels);
              setSelectedId(script.panels[0]?.panel_id ?? null);
            }}
          >
            Version du moteur
          </button>
          <Link href={localePath(locale, `/webtoon/${script.slug}`)} className="webtoon-mini" target="_blank">Voir en ligne</Link>
          {user ? (
            <button type="button" className="webtoon-mini" title={user.email ?? ""} onClick={() => signOut(getFirebaseAuth())}>
              Déconnexion
            </button>
          ) : null}
        </div>
      </header>

      <div className="studio-body">
        <nav className="studio-nav" aria-label="Sections du studio">
          {TABS.map((entry) => (
            <button key={entry.id} type="button" className={`studio-nav-item ${tab === entry.id ? "is-active" : ""}`} onClick={() => setTab(entry.id)}>
              <span>{entry.label}</span>
              <small>{entry.hint}</small>
            </button>
          ))}
        </nav>
        <main className="studio-main">
          {/* The editor stays mounted behind the other tabs: a running generation goes on and its progress is still there when coming back. */}
          <div className="studio-editor-host" style={{ display: tab === "webtoon" ? "contents" : "none" }} aria-hidden={tab !== "webtoon"}>
            <StudioEditor
              script={script}
              panels={panels}
              setPanels={setPanels}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              notify={notify}
              onAutosave={requestAutosave}
              library={library}
              previewLocale={previewLocale}
              onJob={setJob}
            />
          </div>
          {tab === "scenario" ? <StudioScreenplay panels={panels} /> : null}
          {tab === "personnages" ? <StudioCharacters script={script} panels={panels} library={library} setLibrary={setLibrary} notify={notify} /> : null}
          {tab === "decors" ? <StudioLocations script={script} panels={panels} library={library} setLibrary={setLibrary} notify={notify} /> : null}
          {tab === "film" ? <StudioFrames panels={panels} onCreatePanel={createFromFrame} /> : null}
        </main>
      </div>
    </div>
  );
}
