"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import type { Locale } from "@/lib/i18n/config";
import { glossaryMisses, type CharacterVoice, type Glossary, type GlossaryTerm } from "@/lib/webtoon/glossary";
import { loadGlossary, saveGlossary } from "@/lib/webtoon/glossary-client";
import { studioHeaders } from "@/lib/webtoon/studio-headers";
import { applyTranslations, itemsToTranslate } from "@/lib/webtoon/translate";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type VoiceIssue = { key: string; locale: Locale; problem: string; suggestion: string };

type StudioGlossaryProps = {
  slug: string;
  series: string;
  user: User | null;
  panels: WebtoonPanel[];
  setPanels: (update: (current: WebtoonPanel[]) => WebtoonPanel[]) => void;
  characters: { id: string; name: string }[];
  onClose: () => void;
  onOpenPanel: (id: string) => void;
  notify: (message: string) => void;
};

/** The canon voices of Lost Garden, proposed when the series has none written yet. */
const CANON_VOICES: Record<string, string> = {
  lanterne: "Ne parle jamais.",
  serrure: "Posé et inquiet : ses plaisanteries sont un bouclier au-dessus de l'inquiétude. Phrases courtes, jamais tonitruant.",
  rose: "Petite fille calme : parle doucement et simplement, phrases courtes, mots d'enfant.",
};

const LOCALES: Locale[] = ["fr", "en", "ja", "ko"];

/**
 * "Glossaire et voix": the terms every translation keeps and the voice of each
 * character (lib/webtoon/glossary.ts), shared by the episodes of the series;
 * the lettering checked against the glossary, and a reading of every line of
 * dialogue against the voices, with rewrites to apply or leave.
 */
export function StudioGlossary({ slug, series, user, panels, setPanels, characters, onClose, onOpenPanel, notify }: StudioGlossaryProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [glossary, setGlossary] = useState<Glossary | null>(null);
  const [saved, setSaved] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [issues, setIssues] = useState<VoiceIssue[] | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  // The speakers of the strip and the characters of the library, each with a voice to write.
  const speakers = useMemo(() => {
    const ids = new Map<string, string>();
    for (const c of characters) ids.set(c.id, c.name);
    for (const p of panels) for (const d of p.dialogue) if (d.speaker && d.speaker !== "voice" && !ids.has(d.speaker)) ids.set(d.speaker, d.speaker);
    return [...ids].map(([id, name]) => ({ id, name }));
  }, [characters, panels]);

  useEffect(() => {
    let cancelled = false;
    void loadGlossary(series).then((value) => {
      if (cancelled) return;
      const voices: CharacterVoice[] = speakers.map((s) => value.voices.find((v) => v.id === s.id) ?? { id: s.id, name: s.name, voice: CANON_VOICES[s.id] ?? "" });
      const next = { ...value, voices: [...voices, ...value.voices.filter((v) => !voices.some((w) => w.id === v.id))] };
      setGlossary(next);
      setSaved(JSON.stringify(value));
    });
    return () => {
      cancelled = true;
    };
  }, [series, speakers]);

  const dirty = glossary !== null && JSON.stringify(glossary) !== saved;
  const misses = useMemo(() => (glossary && checked ? glossaryMisses(panels, glossary) : []), [glossary, panels, checked]);

  const save = async () => {
    if (!user || !glossary) return;
    setWorking("save");
    try {
      await saveGlossary(series, glossary, user);
      setSaved(JSON.stringify(glossary));
      notify("Glossaire et voix enregistrés : les prochaines traductions les suivent");
    } catch (error) {
      notify(`Glossaire non enregistré : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  };

  const setTerm = (index: number, patch: Partial<GlossaryTerm>) => setGlossary((g) => (g ? { ...g, terms: g.terms.map((t, i) => (i === index ? { ...t, ...patch } : t)) } : g));

  const suggest = async () => {
    if (!glossary) return;
    setWorking("suggest");
    try {
      const seen = new Set<string>();
      const lines = panels
        .flatMap((p) => [...p.dialogue.map((d) => d.text), ...p.caption.map((c) => c.text)])
        .filter((t) => {
          const key = t.fr ?? t.en;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 500);
      const response = await fetch(`/api/webtoon/${slug}/glossary`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ action: "suggest", lines, names: speakers.map((s) => s.name), known: glossary.terms }),
      });
      const payload = (await response.json().catch(() => ({}))) as { terms?: GlossaryTerm[]; error?: string };
      if (!response.ok || !payload.terms) throw new Error(payload.error ?? `erreur ${response.status}`);
      setGlossary((g) => (g ? { ...g, terms: [...g.terms, ...payload.terms!] } : g));
      notify(`${payload.terms.length} terme${payload.terms.length > 1 ? "s" : ""} proposé${payload.terms.length > 1 ? "s" : ""} : relisez-les, puis enregistrez`);
    } catch (error) {
      notify(`Propositions impossibles : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  };

  /** The panels whose translation drifted, translated again in every language with the glossary saved. */
  const retranslate = async () => {
    if (dirty && !window.confirm("Le glossaire a des changements non enregistrés : la traduction suit la version enregistrée. Continuer ?")) return;
    const ids = new Set(misses.map((m) => m.panel_id));
    const targets = panels.filter((p) => ids.has(p.panel_id));
    const items = targets.flatMap((panel) => itemsToTranslate(panel, true).map((item) => ({ ...item, key: `${panel.panel_id}|${item.key}` })));
    if (!items.length) return;
    setWorking("retranslate");
    try {
      const response = await fetch(`/api/webtoon/${slug}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
        body: JSON.stringify({ items, scene: `${targets.length} panels translated again with the glossary.` }),
      });
      const payload = (await response.json().catch(() => ({}))) as { translations?: Record<string, Record<string, string>>; error?: string };
      if (!response.ok || !payload.translations) throw new Error(payload.error ?? `erreur ${response.status}`);
      const byPanel = new Map<string, Record<string, Record<string, string>>>();
      for (const [key, value] of Object.entries(payload.translations)) {
        const [panelId, itemKey] = key.split("|");
        if (panelId && itemKey) byPanel.set(panelId, { ...(byPanel.get(panelId) ?? {}), [itemKey]: value });
      }
      // The French stays the author's: only the other languages are replaced.
      const withoutFr = (map: Record<string, Record<string, string>>) => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).filter(([l]) => l !== "fr"))]));
      setPanels((current) => current.map((p) => (byPanel.has(p.panel_id) ? applyTranslations(p, withoutFr(byPanel.get(p.panel_id)!), true) : p)));
      notify(`${targets.length} case${targets.length > 1 ? "s" : ""} retraduite${targets.length > 1 ? "s" : ""} avec le glossaire`);
    } catch (error) {
      notify(`Retraduction impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  };

  /** Every line of dialogue read against the voices and the glossary, 60 at a time, in strip order. */
  const reviewVoices = async () => {
    if (!glossary) return;
    const items = panels.flatMap((p) => p.dialogue.map((d, i) => ({ key: `${p.panel_id}|dialogue.${i}`, speaker: d.speaker, style: d.style, text: { fr: d.text.fr, en: d.text.en, ja: d.text.ja, ko: d.text.ko } })));
    if (!items.length) return;
    if (!window.confirm(`Relire ${items.length} répliques contre les voix et le glossaire ? Environ ${Math.ceil(items.length / 60)} appels, ${(Math.ceil(items.length / 60) * 0.05).toFixed(2)} $.`)) return;
    setWorking("voices");
    setIssues([]);
    try {
      for (let i = 0; i < items.length; i += 60) {
        const response = await fetch(`/api/webtoon/${slug}/glossary`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await studioHeaders()) },
          body: JSON.stringify({ action: "voices", items: items.slice(i, i + 60), glossary }),
        });
        const payload = (await response.json().catch(() => ({}))) as { issues?: VoiceIssue[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? `erreur ${response.status}`);
        setIssues((current) => [...(current ?? []), ...(payload.issues ?? [])]);
        setWorking(`voices:${Math.min(items.length, i + 60)}/${items.length}`);
      }
    } catch (error) {
      notify(`Relecture interrompue : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  };

  const lineOf = (key: string, locale: Locale) => {
    const [panelId, item] = key.split("|");
    const index = Number(item?.split(".")[1]);
    const panel = panels.find((p) => p.panel_id === panelId);
    const line = panel?.dialogue[index];
    return { panel, line, text: line ? line.text[locale] ?? "" : "" };
  };

  const apply = (list: VoiceIssue[]) => {
    const byPanel = new Map<string, Record<string, Record<string, string>>>();
    for (const issue of list) {
      const [panelId, item] = issue.key.split("|");
      byPanel.set(panelId, { ...(byPanel.get(panelId) ?? {}), [item]: { ...(byPanel.get(panelId)?.[item] ?? {}), [issue.locale]: issue.suggestion } });
    }
    setPanels((current) => current.map((p) => (byPanel.has(p.panel_id) ? applyTranslations(p, byPanel.get(p.panel_id)!, true) : p)));
    setIssues((current) => (current ?? []).filter((i) => !list.includes(i)));
    notify(`${list.length} réplique${list.length > 1 ? "s" : ""} réécrite${list.length > 1 ? "s" : ""}`);
  };

  return (
    <dialog ref={dialog} className="studio-lightbox studio-publish" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="studio-publish-body">
        <h2>Glossaire et voix · {series}</h2>
        <p className="studio-publish-muted">Communs à tous les épisodes de la série. Chaque traduction suit le glossaire enregistré et les voix des personnages.</p>
        {!glossary ? (
          <p className="studio-publish-muted">Chargement…</p>
        ) : (
          <>
            <section>
              <h3>Termes</h3>
              <div className="studio-glossary-table">
                <div className="studio-glossary-row is-head">
                  {LOCALES.map((l) => <span key={l}>{l}</span>)}
                  <span>note</span>
                  <span />
                </div>
                {glossary.terms.map((term, index) => (
                  <div key={index} className="studio-glossary-row">
                    {LOCALES.map((l) => (
                      <input key={l} value={term[l] ?? ""} onChange={(e) => setTerm(index, { [l]: e.target.value })} aria-label={`${l} ${term.fr}`} />
                    ))}
                    <input value={term.note ?? ""} onChange={(e) => setTerm(index, { note: e.target.value })} aria-label="note" />
                    <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => setGlossary((g) => (g ? { ...g, terms: g.terms.filter((_, i) => i !== index) } : g))} aria-label="Retirer le terme">×</button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="webtoon-mini" onClick={() => setGlossary((g) => (g ? { ...g, terms: [...g.terms, { fr: "" }] } : g))}>+ Terme</button>
                <button type="button" className="webtoon-mini" onClick={() => void suggest()} disabled={working !== null} title="Le studio lit les bulles et les noms de la bibliothèque et propose les termes à fixer, avec les traductions déjà les plus employées">
                  {working === "suggest" ? "Lecture des bulles…" : "Proposer des termes"}
                </button>
              </div>
            </section>
            <section>
              <h3>Voix des personnages</h3>
              <div className="studio-glossary-voices">
                {glossary.voices.map((voice, index) => (
                  <label key={voice.id}>
                    <b>{voice.name}</b>
                    <input value={voice.voice} onChange={(e) => setGlossary((g) => (g ? { ...g, voices: g.voices.map((v, i) => (i === index ? { ...v, voice: e.target.value } : v)) } : g))} placeholder="Comment il parle : registre, longueur des phrases, ce qu'il ne dit jamais" />
                  </label>
                ))}
              </div>
            </section>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini studio-primary" onClick={() => void save()} disabled={!user || !dirty || working !== null}>
                {working === "save" ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}
              </button>
            </div>
            <section>
              <h3>Vérifier la bande</h3>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="webtoon-mini" onClick={() => setChecked(true)} disabled={!glossary.terms.length}>Vérifier le glossaire</button>
                <button type="button" className="webtoon-mini" onClick={() => void reviewVoices()} disabled={working !== null} title="Chaque réplique lue dans les quatre langues contre la voix de son personnage et le glossaire ; seules celles qui s'en écartent ou sonnent traduites reviennent, avec une réécriture">
                  {working?.startsWith("voices") ? `Relecture ${working.split(":")[1] ?? "…"}` : "Relire les voix"}
                </button>
              </div>
              {checked ? (
                misses.length ? (
                  <div className="studio-glossary-results">
                    <p>
                      <b>{misses.length}</b> écart{misses.length > 1 ? "s" : ""} au glossaire dans {new Set(misses.map((m) => m.panel_id)).size} cases.{" "}
                      <button type="button" className="webtoon-mini studio-primary" onClick={() => void retranslate()} disabled={working !== null}>
                        {working === "retranslate" ? "Retraduction…" : "Retraduire ces cases"}
                      </button>
                    </p>
                    <ul>
                      {misses.slice(0, 40).map((m, i) => (
                        <li key={i}>
                          <button type="button" className="studio-publish-link" onClick={() => { onOpenPanel(m.panel_id); onClose(); }}>Case {m.order}</button> {m.locale} : « {m.text} », attendu « {m.expected} » pour « {m.term} »
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="studio-publish-muted">Toutes les bulles suivent le glossaire.</p>
                )
              ) : null}
              {issues?.length ? (
                <div className="studio-glossary-results">
                  <p>
                    <b>{issues.length}</b> réplique{issues.length > 1 ? "s" : ""} à reprendre.{" "}
                    <button type="button" className="webtoon-mini studio-primary" onClick={() => apply(issues)}>Tout appliquer</button>
                  </p>
                  <ul>
                    {issues.map((issue) => {
                      const { panel, line, text } = lineOf(issue.key, issue.locale);
                      return (
                        <li key={`${issue.key}-${issue.locale}`}>
                          <button type="button" className="studio-publish-link" onClick={() => { if (panel) onOpenPanel(panel.panel_id); onClose(); }}>Case {panel?.order ?? "?"}</button> {line?.speaker} · {issue.locale} · {issue.problem}
                          <div className="studio-glossary-change">
                            <del>{text}</del>
                            <ins>{issue.suggestion}</ins>
                            <span>
                              <button type="button" className="webtoon-mini" onClick={() => apply([issue])}>Appliquer</button>
                              <button type="button" className="webtoon-mini" onClick={() => setIssues((current) => (current ?? []).filter((i) => i !== issue))}>Laisser</button>
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : issues && !working ? (
                <p className="studio-publish-muted">Toutes les répliques relues tiennent leur voix.</p>
              ) : null}
            </section>
          </>
        )}
        <div className="studio-publish-actions">
          <button type="button" className="webtoon-mini" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </dialog>
  );
}
