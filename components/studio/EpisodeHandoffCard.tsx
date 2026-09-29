"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { BUILT_IN_PROJECT_ID } from "@/lib/webtoon/project";
import { listProjects } from "@/lib/webtoon/projects-client";
import { seriesOfTitle } from "@/lib/webtoon/series";
import { DRAFTS_COLLECTION, loadStrip } from "@/lib/webtoon/studio";
import { saveHandoff, type EpisodeHandoff } from "@/lib/webtoon/handoff-client";

type Source = { slug: string; title: string };

type EpisodeHandoffCardProps = {
  slug: string;
  title: string;
  handoff: EpisodeHandoff | null;
  onChange: (handoff: EpisodeHandoff | null) => void;
  cast: { id: string; name: string }[];
  headers: () => Promise<Record<string, string>>;
  notify: (message: string) => void;
};

const LOST_GARDEN_EP1: Source = { slug: BUILT_IN_PROJECT_ID, title: "Lost Garden · Épisode 1" };

/**
 * "Début de l'épisode": where the episode before left the characters. The
 * author picks that episode (the one numbered just before is proposed), the
 * studio reads its last panels and images, and the lines stay editable. The
 * first panels written and drawn in this episode start from them.
 */
export function EpisodeHandoffCard({ slug, title, handoff, onChange, cast, headers, notify }: EpisodeHandoffCardProps) {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [from, setFrom] = useState(handoff?.from_slug ?? "");
  const [text, setText] = useState(handoff?.text ?? "");
  const [reading, setReading] = useState(false);

  // A handoff loaded or read after the card was drawn replaces what the fields show.
  const [shown, setShown] = useState(handoff);
  if (shown !== handoff) {
    setShown(handoff);
    setText(handoff?.text ?? "");
    if (handoff?.from_slug) setFrom(handoff.from_slug);
  }

  useEffect(() => {
    let cancelled = false;
    void listProjects()
      .catch(() => [])
      .then((projects) => {
        if (cancelled) return;
        const list = [LOST_GARDEN_EP1, ...projects.filter((p) => p.id !== slug).map((p) => ({ slug: p.id, title: p.title }))];
        setSources(list);
        // The episode numbered just before this one, in the same series; the first episode otherwise.
        const own = seriesOfTitle(title, 2);
        const before = list.find((s) => {
          const other = seriesOfTitle(s.title, 1);
          return other.series === own.series && other.episode === own.episode - 1;
        });
        setFrom((current) => current || before?.slug || LOST_GARDEN_EP1.slug);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, title]);

  const read = async () => {
    const source = sources.find((s) => s.slug === from);
    if (!source || reading) return;
    setReading(true);
    try {
      const strip = await loadStrip(DRAFTS_COLLECTION, source.slug);
      const panels = strip?.panels ?? [];
      if (!panels.length) {
        notify(`${source.title} n'a pas encore de cases`);
        return;
      }
      const end = panels.slice(-14);
      const images = end.filter((p) => p.image.src && p.image.status !== "missing").map((p) => p.image.src).slice(-3);
      const response = await fetch(`/api/webtoon/${slug}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await headers()) },
        body: JSON.stringify({
          from_title: source.title,
          panels: end.map((p) => ({ order: p.order, description: p.description, characters: p.characters, lines: p.dialogue.map((d) => `${d.speaker}: ${d.text.en}`) })),
          images,
          cast,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!response.ok || !payload.text) {
        notify(`Fin de l'épisode non lue : ${payload.error ?? response.status}`);
        return;
      }
      const next: EpisodeHandoff = { from_slug: source.slug, from_title: source.title, text: payload.text, image: images[images.length - 1], updated_at: new Date().toISOString() };
      setText(next.text);
      onChange(next);
      if (user) await saveHandoff(slug, next, user);
      notify(`Fin de ${source.title} lue : les premières cases partiront de cet état`);
    } catch (error) {
      notify(`Fin de l'épisode non lue : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setReading(false);
    }
  };

  const save = async () => {
    const source = sources.find((s) => s.slug === from);
    const next: EpisodeHandoff = { from_slug: from, from_title: source?.title ?? handoff?.from_title ?? from, text: text.trim(), image: handoff?.from_slug === from ? handoff.image : undefined, updated_at: new Date().toISOString() };
    onChange(next.text ? next : null);
    if (user) await saveHandoff(slug, next, user);
    notify("État de départ enregistré");
  };

  return (
    <div className="studio-handoff">
      <span className="studio-thumb-empty">Début de l&apos;épisode</span>
      <p>Où l&apos;épisode précédent a laissé les personnages (casque, armure, blessures, ce qu&apos;ils tiennent). Les premières cases partent de cet état, sauf si le film montre un changement ou un souvenir.</p>
      <div className="flex flex-wrap items-center gap-2">
        <select value={from} onChange={(e) => setFrom(e.target.value)} disabled={reading} aria-label="Épisode précédent">
          {sources.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.title}
            </option>
          ))}
        </select>
        <button type="button" className="webtoon-mini studio-primary" onClick={() => void read()} disabled={reading || !from}>
          {reading ? <><span className="studio-spinner" aria-hidden /> Lecture…</> : handoff ? "Relire la fin" : "Lire la fin de l'épisode"}
        </button>
      </div>
      {handoff || text ? (
        <>
          <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Lanterne: helmet OFF, held under his left arm; cape torn at the hem…" />
          <button type="button" className="webtoon-mini" onClick={() => void save()} disabled={text.trim() === (handoff?.text ?? "")}>
            Enregistrer l&apos;état
          </button>
        </>
      ) : null}
    </div>
  );
}
