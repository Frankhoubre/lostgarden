"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { readScreenplayFile } from "@/lib/webtoon/screenplay-file";
import type { StudioProject } from "@/lib/webtoon/project";
import { saveProject } from "@/lib/webtoon/projects-client";

/**
 * The text of a project: the synopsis (given to the detectors and to the
 * writer) and the screenplay, pasted or read from a file (text, Fountain,
 * Final Draft). The writer reads both with the frames of the film.
 */
export function StudioProjectText({ project, notify, onSaved }: { project: StudioProject; notify: (message: string) => void; onSaved?: (next: StudioProject) => void }) {
  const { user } = useAuth();
  const [synopsis, setSynopsis] = useState(project.synopsis);
  const [screenplay, setScreenplay] = useState(project.screenplay);
  const [busy, setBusy] = useState(false);
  const changed = synopsis !== project.synopsis || screenplay !== project.screenplay;

  const save = async () => {
    if (!user) return notify("Pas de compte connecté : rien n'est enregistré.");
    setBusy(true);
    try {
      const next = await saveProject({ ...project, synopsis, screenplay }, user);
      onSaved?.(next);
      notify("Texte du projet enregistré");
    } catch (error) {
      notify(`Enregistrement impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="studio-card space-y-3">
        <p className="anime-label text-xs text-cyan-pale">Synopsis</p>
        <p className="text-xs text-ivory/60">Quelques lignes sur l&apos;histoire, les personnages et le ton : la détection de la bible et l&apos;écriture des cases les lisent.</p>
        <textarea className="studio-textarea" rows={5} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} placeholder="Une jeune cartographe découvre qu'une ville entière a disparu de ses cartes…" />
      </section>
      <section className="studio-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="anime-label text-xs text-cyan-pale">Scénario</p>
            <p className="text-xs text-ivory/60">Collez le texte, ou lisez un fichier texte, Fountain ou Final Draft (.fdx). Le studio suit le film et le scénario ensemble.</p>
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
                  setScreenplay(await readScreenplayFile(file));
                  notify(`${file.name} lu`);
                } catch (error) {
                  notify(error instanceof Error ? error.message : "Fichier illisible");
                }
              }}
            />
          </label>
        </div>
        <textarea className="studio-textarea studio-textarea-mono" rows={18} value={screenplay} onChange={(e) => setScreenplay(e.target.value)} placeholder="INT. FORÊT, NUIT…" />
        <p className="text-xs text-ivory/50">{screenplay.length.toLocaleString("fr-FR")} caractères</p>
      </section>
      <div className="flex justify-end">
        <button type="button" className="webtoon-mini studio-primary" onClick={() => void save()} disabled={busy || !changed}>
          {busy ? "Enregistrement…" : "Enregistrer le texte"}
        </button>
      </div>
    </div>
  );
}
