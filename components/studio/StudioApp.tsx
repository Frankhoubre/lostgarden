"use client";

import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { StudioCharacters } from "@/components/studio/StudioCharacters";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { StudioFrames } from "@/components/studio/StudioFrames";
import { StudioLocations } from "@/components/studio/StudioLocations";
import { StudioObjects } from "@/components/studio/StudioObjects";
import { StudioProjectText } from "@/components/studio/StudioProjectText";
import { StudioScreenplay } from "@/components/studio/StudioScreenplay";
import { getDb, getFirebaseAuth } from "@/lib/firebase";
import { localePath } from "@/lib/i18n/navigation";
import { appendFromFrame } from "@/lib/webtoon/editor-ops";
import { computeLayout } from "@/lib/webtoon/layout";
import { EMPTY_LIBRARY, loadLibrary, saveLibrary } from "@/lib/webtoon/library";
import { EMPTY_PROJECT_LIBRARY, sparseFrames, type StudioProject } from "@/lib/webtoon/project";
import { DRAFTS_COLLECTION, PUBLISHED_COLLECTION, STUDIO_SESSION_ID, loadStrip, saveStrip, watchDraftMeta, type DraftMeta } from "@/lib/webtoon/studio";
import { localizedText } from "@/lib/webtoon/text";
import type { LibraryOverlay, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

const PREVIEW_LOCALES: { id: Locale; label: string }[] = [
  { id: "fr", label: "FR" },
  { id: "en", label: "EN" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
];

/** Running cost of the strip's generations, as the routes record it in Firestore. */
type StripCost = { total_usd: number; images_usd?: number; sheets_usd?: number; writer_usd?: number; translate_usd?: number; count?: number; images_count?: number; sheets_count?: number; writer_count?: number; translate_count?: number; /** Part of the total estimated for what was generated before the counter existed. */ estimated_usd?: number };

const usd = (value: number | undefined) => `${(value ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

/** What the editor reports about its running job, shown in the bar from every tab. */
export type JobSummary = { label: string; done: number; total: number; deadline: number } | null;

type Tab = "webtoon" | "scenario" | "personnages" | "objets" | "decors" | "film";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "webtoon", label: "Webtoon", hint: "Cases, bulles, sons, tailles" },
  { id: "scenario", label: "Scénario", hint: "Le PDF et le découpage du film" },
  { id: "personnages", label: "Personnages", hint: "Fiches et planches modèles" },
  { id: "objets", label: "Objets", hint: "Pendentif, casque, ce que la main tient" },
  { id: "decors", label: "Décors", hint: "Lieux, ancres de style, bible" },
  { id: "film", label: "Images du film", hint: "Une image toutes les 5 s" },
];

type StudioAppProps = {
  script: WebtoonScript;
  /** A project of its own (not Lost Garden): its film, its screenplay, its own empty library to start. */
  project?: StudioProject | null;
  /** The project's film, one frame per second. */
  frames?: { src: string; seconds: number; label: string }[];
};

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
export function StudioApp({ script, project = null, frames }: StudioAppProps) {
  const isProject = project !== null;
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
  // The cost of the strip so far, live: every generation adds what the gateway billed.
  const [cost, setCost] = useState<StripCost | null>(null);
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      doc(getDb(), "webtoon_costs", script.slug),
      (snapshot) => setCost(snapshot.exists() ? (snapshot.data() as StripCost) : null),
      () => setCost(null),
    );
    return unsubscribe;
  }, [user, script.slug]);
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);
  const [loaded, setLoaded] = useState(false);
  /**
   * The version of the stored draft this tab last loaded or saved. When
   * another tab (or another session) saves after it, this tab stops saving
   * on its own and asks which version to keep: two tabs on the same strip
   * used to overwrite each other in silence, and a generation made in one
   * of them vanished.
   */
  const syncedAt = useRef<string | null>(null);
  const [conflict, setConflict] = useState<DraftMeta | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const notify = useCallback((message: string) => {
    setNotice(message);
    // An error stays long enough to be read; a confirmation goes away quickly.
    const isError = /erreur|impossible|Storage|Gateway|\d{3}\b|refus|échec/i.test(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), isError ? 12000 : 2600);
  }, []);

  // The studio's library of characters and locations, saved a moment after
  // each change so a sheet edit or a new character never needs a click.
  const [library, setLibraryState] = useState<LibraryOverlay>(project ? EMPTY_PROJECT_LIBRARY : EMPTY_LIBRARY);
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
        // A project never sits on the Lost Garden library, even if its document says nothing about it.
        if (storedLibrary) setLibraryState(isProject ? { ...storedLibrary, base: "none" } : storedLibrary);
        if (draft) {
          setPanels(draft.panels);
          setBaseline(draft.panels);
          setSelectedId((current) => (draft.panels.some((p) => p.panel_id === current) ? current : draft.panels[0]?.panel_id ?? null));
          setSavedAt(draft.updated_at);
          syncedAt.current = draft.updated_at;
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
  }, [script.slug, user, isProject]);

  useEffect(() => {
    if (!user) return;
    return watchDraftMeta(DRAFTS_COLLECTION, script.slug, (meta) => {
      if (!meta?.updated_at || meta.session_id === STUDIO_SESSION_ID) return;
      if (syncedAt.current && meta.updated_at > syncedAt.current) setConflict(meta);
    });
  }, [user, script.slug]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Automatic save asked by the editor after each panel written or generated,
  // so a reload in the middle of a long job loses nothing. Requests are
  // gathered for a second and a half and only one save runs at a time: with
  // several images landing together, one save per image queued more writes
  // than Firestore accepts ("Write stream exhausted").
  const panelsRef = useRef(panels);
  const conflictRef = useRef<DraftMeta | null>(null);
  useEffect(() => {
    panelsRef.current = panels;
    conflictRef.current = conflict;
  }, [panels, conflict]);
  const autosaveTimer = useRef<number | null>(null);
  const autosaving = useRef(false);
  const autosaveAgain = useRef(false);
  const runAutosave = useCallback(async () => {
    if (!user || conflictRef.current) return;
    if (autosaving.current) {
      autosaveAgain.current = true;
      return;
    }
    autosaving.current = true;
    const snapshot = panelsRef.current;
    try {
      const at = await saveStrip(DRAFTS_COLLECTION, script.slug, snapshot, user);
      syncedAt.current = at;
      setSavedAt(at);
      setBaseline(snapshot);
    } catch (error) {
      notify(`Enregistrement automatique impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      autosaving.current = false;
      if (autosaveAgain.current) {
        autosaveAgain.current = false;
        void runAutosave();
      }
    }
  }, [user, script.slug, notify]);
  const requestAutosave = useCallback(() => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => void runAutosave(), 1500);
  }, [runAutosave]);
  useEffect(() => () => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
  }, []);

  const save = useCallback(async () => {
    if (!user) {
      notify("Pas de compte connecté : rien n'est enregistré (mode local).");
      return;
    }
    if (conflict && !window.confirm(`Un autre onglet a enregistré le brouillon à ${formatTime(conflict.updated_at)}. L'écraser avec la version de cet onglet ?`)) return;
    setWorking("save");
    try {
      const at = await saveStrip(DRAFTS_COLLECTION, script.slug, panels, user);
      syncedAt.current = at;
      setConflict(null);
      setSavedAt(at);
      setBaseline(panels);
      notify("Brouillon enregistré");
    } catch (error) {
      notify(`Enregistrement impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  }, [user, panels, script.slug, notify, conflict]);

  /** The other tab's version replaces this one's. */
  const loadLatest = useCallback(async () => {
    if (job) {
      notify("Un travail tourne dans cet onglet : attendez sa fin ou arrêtez-le avant de charger l'autre version.");
      return;
    }
    try {
      const draft = await loadStrip(DRAFTS_COLLECTION, script.slug);
      if (!draft) return;
      setPanels(draft.panels);
      setBaseline(draft.panels);
      setSavedAt(draft.updated_at);
      syncedAt.current = draft.updated_at;
      setConflict(null);
      notify(`Version de ${formatTime(draft.updated_at)} chargée (${draft.panels.length} cases)`);
    } catch (error) {
      notify(`Chargement impossible : ${error instanceof Error ? error.message : "erreur"}`);
    }
  }, [job, script.slug, notify]);

  const publish = async () => {
    if (!user) {
      notify("Pas de compte connecté : publication impossible.");
      return;
    }
    if (conflict) {
      notify("Un autre onglet a enregistré une autre version : choisissez d'abord laquelle garder.");
      return;
    }
    if (!window.confirm("Publier cette version sur lostgarden.world/webtoon ? Elle remplace la version en ligne.")) return;
    setWorking("publish");
    try {
      const at = await saveStrip(DRAFTS_COLLECTION, script.slug, panels, user);
      syncedAt.current = at;
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

  const status = working === "save" ? "Enregistrement…" : working === "publish" ? "Publication…" : dirty ? "Modifications non enregistrées" : savedAt ? `Brouillon enregistré le ${formatTime(savedAt)}` : loaded || !user ? "Version du code, rien d'enregistré" : "Chargement…";

  return (
    <div className="studio">
      <header className="studio-bar">
        <div className="studio-bar-title">
          <Link href={localePath(locale, "/")} className="anime-heading font-display text-base text-lily hover:text-magic">Lost Garden</Link>
          <span className="studio-bar-sep">/</span>
          <Link href={localePath(locale, "/convert-video-to-webtoon")} className="anime-label text-xs text-cyan-pale hover:text-magic" title="Tous les projets">Studio webtoon</Link>
          <span className="studio-bar-sep">/</span>
          <span className="text-sm text-ivory/85">{project ? project.title : `${localizedText(script.title, locale)} · ${localizedText(script.subtitle, locale)}`}</span>
          {project ? (
            <Link href={`${localePath(locale, `/convert-video-to-webtoon/${project.id}`)}?bible=1`} className="webtoon-mini" title="Personnages, objets et lieux du projet, les images du film">Bible du projet</Link>
          ) : null}
          {cost ? (
            <span
              className="studio-cost"
              title={`Coût des générations de ce webtoon, tel que facturé par le Gateway.\nImages : ${usd(cost.images_usd)} (${cost.images_count ?? 0})\nFiches : ${usd(cost.sheets_usd)} (${cost.sheets_count ?? 0})\nÉcriture de la suite : ${usd(cost.writer_usd)} (${cost.writer_count ?? 0} lots)\nTraductions : ${usd(cost.translate_usd)} (${cost.translate_count ?? 0})${cost.estimated_usd ? `\nDont ${usd(cost.estimated_usd)} estimés pour ce qui a été généré avant le compteur (20 septembre 2026).` : ""}`}
            >
              {usd(cost.total_usd)}
            </span>
          ) : null}
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
          <button type="button" className="webtoon-mini" onClick={() => void save()} disabled={working !== null} title="Enregistre le brouillon (Cmd+S)">Enregistrer</button>
          {project ? null : (
            <>
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void publish()} disabled={working !== null} title="Met cette version en ligne pour les lecteurs">Publier</button>
              <Link href={localePath(locale, `/webtoon/${script.slug}`)} className="webtoon-mini" target="_blank">Voir en ligne</Link>
            </>
          )}
          <div className="studio-gear" ref={menuRef}>
            <button type="button" className={`webtoon-mini studio-gear-button ${menuOpen ? "is-active" : ""}`} onClick={() => setMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={menuOpen} title="Autres actions">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
              <span className="sr-only">Autres actions</span>
            </button>
            {menuOpen ? (
              <div className="studio-gear-menu" role="menu">
                <p className="studio-gear-title">Fichier</p>
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); exportJson(); }}>
                  <b>Exporter la bande en JSON</b>
                  <small>Télécharge toutes les cases, textes et réglages : pour une sauvegarde ou pour repasser par le dépôt.</small>
                </button>
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); fileInput.current?.click(); }}>
                  <b>Importer un JSON</b>
                  <small>Remplace la bande en cours par le contenu d&apos;un fichier exporté.</small>
                </button>
                <p className="studio-gear-title">Bande</p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    if (!window.confirm(`Repartir des ${script.panels.length} cases écrites dans le code ? Tout ce qui a été fait dans le studio disparaît de l'écran (le brouillon enregistré reste tant que tu n'enregistres pas par-dessus).`)) return;
                    setPanels(script.panels);
                    setSelectedId(script.panels[0]?.panel_id ?? null);
                  }}
                >
                  <b>Repartir de la version du code</b>
                  <small>Les {script.panels.length} cases d&apos;origine, telles que le moteur les produit depuis le dépôt, sans les modifications du studio.</small>
                </button>
                {user ? (
                  <>
                    <p className="studio-gear-title">Compte</p>
                    <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void signOut(getFirebaseAuth()); }}>
                      <b>Déconnexion</b>
                      <small>{user.email}</small>
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
        </div>
      </header>
      {conflict ? (
        <div className="studio-conflict" role="alert">
          <p>
            <b>Un autre onglet a enregistré ce webtoon</b> le {formatTime(conflict.updated_at)}
            {conflict.updated_by ? ` (${conflict.updated_by})` : ""}. Cet onglet n&apos;enregistre plus rien tout seul, pour ne pas écraser ce travail.
            {job ? " Un travail tourne ici : ses cases restent dans cet onglet jusqu'à votre choix." : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="webtoon-mini studio-primary" onClick={() => void loadLatest()} disabled={Boolean(job)}>Charger la version de l&apos;autre onglet</button>
            <button type="button" className="webtoon-mini" onClick={() => void save()}>Garder la version de cet onglet</button>
          </div>
        </div>
      ) : null}

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
              setLibrary={setLibrary}
              previewLocale={previewLocale}
              onJob={setJob}
              filmFrames={frames ? sparseFrames(frames) : undefined}
            />
          </div>
          {tab === "scenario" ? (project ? <StudioProjectText project={project} notify={notify} /> : <StudioScreenplay panels={panels} />) : null}
          {tab === "personnages" ? <StudioCharacters script={script} panels={panels} library={library} setLibrary={setLibrary} notify={notify} withDocs={!project} /> : null}
          {tab === "objets" ? <StudioObjects script={script} panels={panels} library={library} setLibrary={setLibrary} notify={notify} /> : null}
          {tab === "decors" ? <StudioLocations script={script} panels={panels} library={library} setLibrary={setLibrary} notify={notify} withDocs={!project} /> : null}
          {tab === "film" ? <StudioFrames panels={panels} onCreatePanel={createFromFrame} frames={frames} /> : null}
        </main>
      </div>
    </div>
  );
}
