"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { createSnapshot, deleteSnapshot, listSnapshots, loadSnapshot, renameSnapshot, type SnapshotEntry } from "@/lib/webtoon/snapshots-client";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type StudioSnapshotsProps = {
  slug: string;
  user: User | null;
  panels: WebtoonPanel[];
  /** The strip of a save point replaces the one on screen ("Annuler" brings it back). */
  onRestore: (panels: WebtoonPanel[], name: string) => void;
  onClose: () => void;
  notify: (message: string) => void;
};

const when = (at: string) => new Date(at).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** "Points de sauvegarde": the strip kept under a name, to come back to (lib/webtoon/snapshots-client.ts). */
export function StudioSnapshots({ slug, user, panels, onRestore, onClose, notify }: StudioSnapshotsProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [list, setList] = useState<SnapshotEntry[] | null>(null);
  const [name, setName] = useState("");
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  const refresh = useCallback(() => {
    void listSnapshots(slug)
      .then(setList)
      .catch(() => setList([]));
  }, [slug]);
  useEffect(refresh, [refresh]);

  const create = async () => {
    if (!user) return;
    setWorking("create");
    try {
      const entry = await createSnapshot(slug, name || `Point du ${when(new Date().toISOString())}`, panels, user);
      setName("");
      notify(`Point de sauvegarde « ${entry.name} » créé`);
      refresh();
    } catch (error) {
      notify(`Point de sauvegarde impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  };

  const restore = async (entry: SnapshotEntry) => {
    if (!window.confirm(`Revenir au point « ${entry.name} » (${when(entry.at)}, ${entry.panels} cases) ? La bande à l'écran est remplacée ; « Annuler » la ramène, et un point de sauvegarde de la version actuelle est créé avant.`)) return;
    setWorking(entry.id);
    try {
      const stored = await loadSnapshot(slug, entry.id);
      if (!stored?.length) {
        notify("Ce point de sauvegarde est vide ou illisible");
        return;
      }
      if (user) await createSnapshot(slug, `Avant le retour à « ${entry.name} »`, panels, user, true);
      onRestore(stored, entry.name);
      onClose();
    } catch (error) {
      notify(`Retour impossible : ${error instanceof Error ? error.message : "erreur"}`);
    } finally {
      setWorking(null);
    }
  };

  const remove = async (entry: SnapshotEntry) => {
    if (!user || !window.confirm(`Supprimer définitivement le point « ${entry.name} » ?`)) return;
    setWorking(entry.id);
    try {
      await deleteSnapshot(slug, entry.id, user);
      refresh();
    } finally {
      setWorking(null);
    }
  };

  return (
    <dialog ref={dialog} className="studio-lightbox studio-snapshots" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="studio-publish-body">
        <h2>Points de sauvegarde</h2>
        <p className="studio-publish-muted">La bande entière gardée sous un nom, pour y revenir des jours plus tard. Un point est aussi pris tout seul avant chaque publication (les 20 derniers automatiques sont gardés).</p>
        <div className="studio-snapshots-new">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du point, par exemple « Avant peaufinage »" maxLength={80} onKeyDown={(e) => e.key === "Enter" && void create()} />
          <button type="button" className="webtoon-mini studio-primary" onClick={() => void create()} disabled={!user || working !== null}>
            {working === "create" ? "Enregistrement…" : "Créer un point"}
          </button>
        </div>
        {!user ? <p className="studio-publish-muted">Connectez-vous pour créer ou rouvrir un point.</p> : null}
        <ul className="studio-snapshots-list">
          {list === null ? <li className="studio-publish-muted">Chargement…</li> : null}
          {list?.length === 0 ? <li className="studio-publish-muted">Aucun point de sauvegarde pour l&apos;instant.</li> : null}
          {list?.map((entry) => (
            <li key={entry.id}>
              <div>
                <b
                  contentEditable={Boolean(user)}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const next = e.currentTarget.textContent ?? "";
                    if (user && next.trim() && next.trim() !== entry.name) void renameSnapshot(slug, entry.id, next, user).then(refresh);
                  }}
                  title="Cliquer pour renommer"
                >
                  {entry.name}
                </b>
                <small>
                  {when(entry.at)} · {entry.panels} cases, {entry.images} images{entry.auto ? " · automatique" : ""}
                </small>
              </div>
              <span className="studio-snapshots-actions">
                <button type="button" className="webtoon-mini" onClick={() => void restore(entry)} disabled={working !== null}>
                  {working === entry.id ? "…" : "Revenir à ce point"}
                </button>
                <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => void remove(entry)} disabled={!user || working !== null}>
                  Supprimer
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div className="studio-publish-actions">
          <button type="button" className="webtoon-mini" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </dialog>
  );
}
