"use client";

import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { StudioCharacters } from "@/components/studio/StudioCharacters";
import { StudioEditor } from "@/components/studio/StudioEditor";
import { StudioFrames } from "@/components/studio/StudioFrames";
import { StudioExport } from "@/components/studio/StudioExport";
import { StudioCost, budgetLevel, type StripCost } from "@/components/studio/StudioCost";
import { useFilmGuide } from "@/components/studio/useFilmGuide";
import { studioFilmFramesDense } from "@/lib/webtoon/studio-assets";
import { StudioLocations } from "@/components/studio/StudioLocations";
import { StudioNotifications } from "@/components/studio/StudioNotifications";
import { ProgressBar } from "@/components/studio/ProgressBar";
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
import { NOTIFICATION_LIMIT, loadNotifications, looksLikeError, saveNotifications, type StudioNotification, type TrackTask } from "@/lib/webtoon/notifications";
import { libraryWith } from "@/lib/webtoon/references";
import { studioHeaders } from "@/lib/webtoon/studio-headers";
import { localizedText } from "@/lib/webtoon/text";
import type { LibraryOverlay, WebtoonPanel, WebtoonScript } from "@/lib/webtoon/types";

const PREVIEW_LOCALES: { id: Locale; label: string }[] = [
  { id: "fr", label: "FR" },
  { id: "en", label: "EN" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
];

/** Running cost of the strip's generations, as the routes record it in Firestore. */

/** What the editor reports about its running job, shown in the bar from every tab. */
export type JobSummary = { label: string; done: number; total: number; deadline: number; started?: number } | null;

type Tab = "webtoon" | "scenario" | "personnages" | "objets" | "decors" | "film";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "webtoon", label: "Webtoon", hint: "Cases, bulles, sons, tailles" },
  { id: "scenario", label: "Scénario", hint: "Le PDF et le découpage du film" },
  { id: "personnages", label: "Personnages", hint: "Fiches et planches modèles" },
  { id: "objets", label: "Objets", hint: "Pendentif, casque, ce que la main tient" },
  { id: "decors", label: "Décors", hint: "Lieux, ancres de style, bible" },
  { id: "film", label: "Images du film", hint: "Une image toutes les 5 s" },
];

/** The icons of the left bar: the name of each tab is in its tooltip. */
function NavIcon({ tab }: { tab: Tab }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (tab) {
    case "webtoon":
      // A vertical strip of three panels.
      return (
        <svg {...common}>
          <rect x="6" y="2.5" width="12" height="5.5" rx="1.2" />
          <rect x="6" y="9.5" width="12" height="5.5" rx="1.2" />
          <rect x="6" y="16.5" width="12" height="5" rx="1.2" />
        </svg>
      );
    case "scenario":
      // A page of script.
      return (
        <svg {...common}>
          <path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5z" />
          <path d="M14 2.5v5h5M9 12h6M9 15.5h6M9 8.5h2" />
        </svg>
      );
    case "personnages":
      // A figure.
      return (
        <svg {...common}>
          <circle cx="12" cy="7.5" r="3.5" />
          <path d="M5 21v-1.5a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6V21" />
        </svg>
      );
    case "objets":
      // A pendant on its chain.
      return (
        <svg {...common}>
          <path d="M8 3.5l4 6 4-6" />
          <circle cx="12" cy="15" r="5.5" />
          <circle cx="12" cy="15" r="2" />
        </svg>
      );
    case "decors":
      // Mountains under a moon.
      return (
        <svg {...common}>
          <path d="M2.5 20l6.5-10 4.5 6.5 3-4 5 7.5z" />
          <circle cx="17.5" cy="6" r="2" />
        </svg>
      );
    default:
      // A film strip.
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16M17 4v16M3 8.5h4M3 15.5h4M17 8.5h4M17 15.5h4" />
        </svg>
      );
  }
}

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
  // Alerts once per session when the spending reaches 80 % then 100 % of the episode's budget.
  const budgetAlerted = useRef<{ close: boolean; over: boolean }>({ close: false, over: false });
  const costRef = useRef<StripCost | null>(null);
  useEffect(() => {
    costRef.current = cost;
  }, [cost]);
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

  const [working, setWorking] = useState<"save" | "publish" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
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

  /** The notification center (the bell at the top right): every message and every task of the session. */
  const [notifications, setNotifications] = useState<StudioNotification[]>([]);
  const notificationsLoaded = useRef(false);
  // Read after the first render (the server has no storage), merged under what this visit already added.
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const stored = loadNotifications(script.slug);
      notificationsLoaded.current = true;
      if (stored.length) setNotifications((current) => [...current, ...stored.filter((entry) => !current.some((c) => c.id === entry.id))].slice(0, NOTIFICATION_LIMIT));
    });
    return () => {
      cancelled = true;
    };
  }, [script.slug]);
  useEffect(() => {
    if (notificationsLoaded.current) saveNotifications(script.slug, notifications);
  }, [script.slug, notifications]);

  const toast = useCallback((message: string) => {
    setNotice(message);
    // An error stays long enough to be read; a confirmation goes away quickly.
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), looksLikeError(message) ? 12000 : 2600);
  }, []);

  const notify = useCallback(
    (message: string) => {
      toast(message);
      const at = Date.now();
      setNotifications((current) =>
        [{ id: `n${at}-${Math.random().toString(36).slice(2, 7)}`, title: message, status: looksLikeError(message) ? ("error" as const) : ("info" as const), started_at: at, ended_at: at, read: false }, ...current].slice(0, NOTIFICATION_LIMIT),
      );
    },
    [toast],
  );

  /** A task that shows as running in the center until the editor ends it. */
  const track = useCallback<TrackTask>(
    (title, panelId, estimateMs) => {
      const id = `t${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setNotifications((current) => [{ id, title, status: "running" as const, panel_id: panelId, started_at: Date.now(), estimate_ms: estimateMs, read: false }, ...current].slice(0, NOTIFICATION_LIMIT));
      let ended = false;
      const end = (status: "done" | "error", detail?: string, thumb?: string) => {
        if (ended) return;
        ended = true;
        setNotifications((current) => current.map((entry) => (entry.id === id ? { ...entry, status, detail, thumb, ended_at: Date.now(), read: false } : entry)));
        toast(detail ? `${title} : ${detail}` : title);
      };
      return { done: (detail, thumb) => end("done", detail ?? "terminé", thumb), fail: (detail) => end("error", detail) };
    },
    [toast],
  );
  // The film guide: the whole film read once by the AI, sequence by sequence; the film tab shows it, the writer follows it.
  const filmDuration = useMemo(() => {
    const list = frames ?? studioFilmFramesDense();
    return list.length ? list[list.length - 1].seconds : 0;
  }, [frames]);
  const filmGuide = useFilmGuide({ slug: script.slug, user, duration: filmDuration, notify, track });

  useEffect(() => {
    const level = budgetLevel(cost);
    if (!cost?.budget_usd) return;
    const spent = `${cost.total_usd.toFixed(2)} $ sur ${cost.budget_usd.toFixed(2)} $`;
    if (level === "over" && !budgetAlerted.current.over) {
      budgetAlerted.current = { close: true, over: true };
      notify(`Budget de l'épisode dépassé : ${spent}`);
    } else if (level === "close" && !budgetAlerted.current.close) {
      budgetAlerted.current.close = true;
      notify(`80 % du budget de l'épisode atteint : ${spent}`);
    }
  }, [cost, notify]);
  /** Before a batch or a continuation: past the budget, the author confirms. */
  const checkBudget = useCallback(() => {
    const current = costRef.current;
    if (budgetLevel(current) !== "over" || !current?.budget_usd) return true;
    return window.confirm(`Le budget de l'épisode est dépassé (${current.total_usd.toFixed(2)} $ dépensés sur ${current.budget_usd.toFixed(2)} $). Lancer quand même ?`);
  }, []);

  const markNotificationsRead = useCallback(
    () =>
      setNotifications((current) =>
        current.some((entry) => !entry.read && entry.status !== "running") ? current.map((entry) => (entry.status === "running" ? entry : { ...entry, read: true })) : current,
      ),
    [],
  );
  const clearNotifications = useCallback(() => setNotifications((current) => current.filter((entry) => entry.status === "running")), []);

  // The studio's library of characters and locations, saved a moment after
  // each change so a sheet edit or a new character never needs a click.
  const [library, setLibraryState] = useState<LibraryOverlay>(project ? EMPTY_PROJECT_LIBRARY : EMPTY_LIBRARY);
  /** Who is in the film, for the close re-reading: the name and the look of each character sheet. */
  const castForGuide = useMemo(
    () => libraryWith(library).filter((a) => a.kind === "character" && a.image && (a.priority ?? 1) === 1).map((a) => ({ name: a.name.split(",")[0], looks: a.must_keep })),
    [library],
  );
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

  /**
   * The light versions the public reader loads (WebP at reading width), made for every image that has none
   * or whose image changed since, a dozen per call and three calls at once.
   */
  const optimizeForReader = async (list: WebtoonPanel[]): Promise<WebtoonPanel[]> => {
    const todo = list.filter((p) => p.image.src && p.image.status !== "missing" && (!p.image.web || p.image.web.of !== p.image.src));
    if (!todo.length) return list;
    const task = track(`Images légères pour le lecteur · ${todo.length}`, undefined, Math.ceil(todo.length / 36) * 9000);
    const made = new Map<string, NonNullable<WebtoonPanel["image"]["web"]>>();
    let before = 0;
    let after = 0;
    const batches: WebtoonPanel[][] = [];
    for (let i = 0; i < todo.length; i += 12) batches.push(todo.slice(i, i + 12));
    let next = 0;
    const worker = async () => {
      while (next < batches.length) {
        const batch = batches[next];
        next += 1;
        try {
          const response = await fetch(`/api/webtoon/${script.slug}/optimize`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
            body: JSON.stringify({ items: batch.map((p) => ({ panel_id: p.panel_id, src: p.image.src })) }),
          });
          const payload = (await response.json().catch(() => ({}))) as { results?: { panel_id: string; of: string; web?: NonNullable<WebtoonPanel["image"]["web"]>; original_bytes?: number }[] };
          for (const r of payload.results ?? []) {
            if (!r.web) continue;
            made.set(r.panel_id, r.web);
            before += r.original_bytes ?? 0;
            after += r.web.bytes;
          }
        } catch {
          // A batch that failed keeps its full images; the next publication tries again.
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    const mb = (n: number) => `${(n / 1e6).toFixed(0)} Mo`;
    task.done(`${made.size} images allégées, ${mb(before)} → ${mb(after)}`);
    return list.map((p) => {
      const web = made.get(p.panel_id);
      return web && web.of === p.image.src ? { ...p, image: { ...p.image, web } } : p;
    });
  };

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
      // The reader loads light WebP versions: made now for the images that have none yet.
      const ready = await optimizeForReader(panels);
      if (ready !== panels) setPanels(ready);
      const at = await saveStrip(DRAFTS_COLLECTION, script.slug, ready, user);
      syncedAt.current = at;
      await saveStrip(PUBLISHED_COLLECTION, script.slug, ready, user);
      setSavedAt(at);
      setPublishedAt(at);
      setBaseline(ready);
      notify("Publié. Le lecteur public se met à jour dans la minute.");
    } catch (error) {
      notify(`Publication impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  };

  /**
   * Undo and redo on the strip (Cmd+Z, Cmd+Shift+Z): every change of the panels is a step, changes less
   * than 0.7 s apart are one (typing a description is one step, not one per letter). The history starts
   * when the draft is loaded; inside a text field, Cmd+Z stays the field's own.
   */
  const past = useRef<WebtoonPanel[][]>([]);
  const future = useRef<WebtoonPanel[][]>([]);
  const lastPanels = useRef<WebtoonPanel[] | null>(null);
  const lastChange = useRef(0);
  const restoring = useRef(false);
  const [steps, setSteps] = useState({ undo: 0, redo: 0 });
  // Without an account (local work) there is no draft to load: the history starts at once.
  const historyOn = loaded || !user;
  useEffect(() => {
    if (!historyOn) return;
    const previous = lastPanels.current;
    lastPanels.current = panels;
    if (!previous || previous === panels) return;
    if (restoring.current) {
      restoring.current = false;
      return;
    }
    const now = Date.now();
    if (now - lastChange.current > 700) {
      past.current = [...past.current, previous].slice(-80);
      future.current = [];
      setSteps({ undo: past.current.length, redo: 0 });
    }
    lastChange.current = now;
  }, [panels, historyOn]);
  const undo = useCallback(() => {
    const previous = past.current[past.current.length - 1];
    if (!previous) return;
    past.current = past.current.slice(0, -1);
    future.current = [...future.current, panels].slice(-80);
    restoring.current = true;
    lastChange.current = 0;
    setPanels(previous);
    setSteps({ undo: past.current.length, redo: future.current.length });
    requestAutosave();
  }, [panels, requestAutosave]);
  const redo = useCallback(() => {
    const next = future.current[future.current.length - 1];
    if (!next) return;
    future.current = future.current.slice(0, -1);
    past.current = [...past.current, panels].slice(-80);
    restoring.current = true;
    lastChange.current = 0;
    setPanels(next);
    setSteps({ undo: past.current.length, redo: future.current.length });
    requestAutosave();
  }, [panels, requestAutosave]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
        return;
      }
      const z = (event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === "z" || event.key.toLowerCase() === "y");
      if (!z) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      if (event.key.toLowerCase() === "y" || event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, undo, redo]);

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
          {cost ? <StudioCost slug={script.slug} cost={cost} notify={notify} /> : null}
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
              <span className="studio-jobpill-row">
                <span className="studio-spinner" aria-hidden />
                <span className="studio-jobpill-label">{job.label}</span>
              </span>
              <ProgressBar key={job.started ?? 0} startedAt={job.started ?? job.deadline - 60_000} estimateMs={Math.max(5_000, job.deadline - (job.started ?? job.deadline - 60_000))} compact />
            </button>
          ) : null}
          <span className={`studio-status ${dirty ? "is-dirty" : ""}`}>{status}</span>
          {publishedAt ? <span className="studio-status">Publié le {formatTime(publishedAt)}</span> : null}
          {notice ? <span className="studio-notice">{notice}</span> : null}
          <StudioNotifications
            items={notifications}
            onOpenPanel={(panelId) => {
              setSelectedId(panelId);
              setTab("webtoon");
            }}
            onMarkRead={markNotificationsRead}
            onClear={clearNotifications}
          />
          <span className="studio-undo" role="group" aria-label="Annuler, rétablir">
            <button type="button" className="webtoon-mini" onClick={undo} disabled={!steps.undo} title="Annuler la dernière modification (Cmd+Z)" aria-label="Annuler">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 14L4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
              </svg>
            </button>
            <button type="button" className="webtoon-mini" onClick={redo} disabled={!steps.redo} title="Rétablir (Cmd+Maj+Z)" aria-label="Rétablir">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 14l5-5-5-5" />
                <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
              </svg>
            </button>
          </span>
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
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setExportOpen(true); }}>
                  <b>Exporter pour les plateformes</b>
                  <small>WEBTOON Canvas, Tapas, archive : la bande découpée aux bons formats, dans chaque langue, en un ZIP.</small>
                </button>
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
            <button
              key={entry.id}
              type="button"
              className={`studio-nav-item studio-nav-icon ${tab === entry.id ? "is-active" : ""}`}
              onClick={() => setTab(entry.id)}
              title={`${entry.label} · ${entry.hint}`}
              aria-label={entry.label}
              aria-current={tab === entry.id ? "page" : undefined}
            >
              <NavIcon tab={entry.id} />
            </button>
          ))}
        </nav>
        {exportOpen ? <StudioExport slug={script.slug} title={project ? project.title : localizedText(script.title, locale)} panels={panels} onClose={() => setExportOpen(false)} /> : null}
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
              track={track}
              checkBudget={checkBudget}
              onAutosave={requestAutosave}
              library={library}
              setLibrary={setLibrary}
              previewLocale={previewLocale}
              onJob={setJob}
              filmFrames={frames ? sparseFrames(frames) : undefined}
              allFrames={frames}
              guide={filmGuide.guide}
            />
          </div>
          {tab === "scenario" ? (project ? <StudioProjectText project={project} notify={notify} /> : <StudioScreenplay panels={panels} />) : null}
          {tab === "personnages" ? <StudioCharacters script={script} panels={panels} setPanels={setPanels} library={library} setLibrary={setLibrary} notify={notify} /> : null}
          {tab === "objets" ? <StudioObjects script={script} panels={panels} setPanels={setPanels} library={library} setLibrary={setLibrary} notify={notify} /> : null}
          {tab === "decors" ? <StudioLocations script={script} panels={panels} setPanels={setPanels} library={library} setLibrary={setLibrary} notify={notify} /> : null}
          {tab === "film" ? (
            <StudioFrames
              panels={panels}
              onCreatePanel={createFromFrame}
              frames={frames}
              guide={filmGuide.guide}
              run={filmGuide.run}
              onRead={(fromScratch) => void filmGuide.start(fromScratch)}
              onStop={filmGuide.stop}
              onRefine={() => void filmGuide.refine(castForGuide)}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
