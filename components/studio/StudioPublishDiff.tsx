"use client";

import { useEffect, useRef, useState } from "react";
import type { PublishDiff } from "@/lib/webtoon/publish-diff";
import type { WebtoonPanel } from "@/lib/webtoon/types";

type StudioPublishDiffProps = {
  diff: PublishDiff | null;
  /** The online version could not be read: publishing still works, without the list. */
  error?: string | null;
  onPublish: () => void;
  onClose: () => void;
  onOpenPanel: (id: string) => void;
};

const thumb = (panel: WebtoonPanel) => panel.image.web?.of === panel.image.src ? panel.image.web.src : panel.image.src;

/**
 * "Publier": what the publication changes, before it replaces the version
 * online (lib/webtoon/publish-diff.ts). Nothing leaves before "Publier".
 */
export function StudioPublishDiff({ diff, error, onPublish, onClose, onOpenPanel }: StudioPublishDiffProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [limit, setLimit] = useState(24);
  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);
  const open = (id: string) => {
    onOpenPanel(id);
    onClose();
  };
  return (
    <dialog ref={dialog} className="studio-lightbox studio-publish" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="studio-publish-body">
        <h2>Ce que la publication change</h2>
        {!diff ? (
          <p className="studio-publish-muted">{error ? `La version en ligne n'a pas pu être lue (${error}) : la publication la remplacera sans comparaison.` : "Comparaison avec la version en ligne…"}</p>
        ) : diff.empty ? (
          <p className="studio-publish-muted">Rien n&apos;a changé depuis la dernière publication.</p>
        ) : (
          <>
            <ul className="studio-publish-summary">
              {diff.added.length ? <li><b>{diff.added.length}</b> case{diff.added.length > 1 ? "s" : ""} ajoutée{diff.added.length > 1 ? "s" : ""}</li> : null}
              {diff.removed.length ? <li><b>{diff.removed.length}</b> case{diff.removed.length > 1 ? "s" : ""} retirée{diff.removed.length > 1 ? "s" : ""}</li> : null}
              {diff.images.length ? <li><b>{diff.images.length}</b> image{diff.images.length > 1 ? "s" : ""} redessinée{diff.images.length > 1 ? "s" : ""}</li> : null}
              {diff.texts.length ? <li><b>{diff.texts.length}</b> case{diff.texts.length > 1 ? "s" : ""} au texte modifié</li> : null}
              {diff.layout ? <li><b>{diff.layout}</b> case{diff.layout > 1 ? "s" : ""} à la mise en page modifiée</li> : null}
              {diff.reordered ? <li>Ordre des cases changé</li> : null}
            </ul>
            {diff.images.length ? (
              <section>
                <h3>Images</h3>
                <div className="studio-publish-images">
                  {diff.images.slice(0, limit).map(({ before, after }) => (
                    <button key={after.panel_id} type="button" className="studio-publish-pair" onClick={() => open(after.panel_id)} title="Ouvrir la case">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {before.image.src ? <img src={thumb(before)} alt="" loading="lazy" /> : <span className="studio-publish-none">sans image</span>}
                      <span aria-hidden="true">→</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {after.image.src ? <img src={thumb(after)} alt="" loading="lazy" /> : <span className="studio-publish-none">sans image</span>}
                      <small>Case {after.order}</small>
                    </button>
                  ))}
                </div>
                {diff.images.length > limit ? <button type="button" className="webtoon-mini" onClick={() => setLimit((n) => n + 48)}>Voir plus ({diff.images.length - limit})</button> : null}
              </section>
            ) : null}
            {diff.texts.length ? (
              <section>
                <h3>Textes</h3>
                <ul className="studio-publish-texts">
                  {diff.texts.slice(0, 60).map((change) => (
                    <li key={change.panel.panel_id}>
                      <button type="button" className="studio-publish-link" onClick={() => open(change.panel.panel_id)}>Case {change.panel.order}</button>
                      {change.before.filter((l) => !change.after.includes(l)).map((l, i) => <del key={`b${i}`}>{l}</del>)}
                      {change.after.filter((l) => !change.before.includes(l)).map((l, i) => <ins key={`a${i}`}>{l}</ins>)}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {diff.added.length ? (
              <section>
                <h3>Cases ajoutées</h3>
                <p className="studio-publish-muted">{diff.added.slice(0, 40).map((p) => `case ${p.order}`).join(", ")}{diff.added.length > 40 ? "…" : ""}</p>
              </section>
            ) : null}
            {diff.removed.length ? (
              <section>
                <h3>Cases retirées</h3>
                <p className="studio-publish-muted">{diff.removed.slice(0, 40).map((p) => p.panel_id).join(", ")}{diff.removed.length > 40 ? "…" : ""}</p>
              </section>
            ) : null}
          </>
        )}
        <p className="studio-publish-muted">La version en ligne actuelle est gardée dans les points de sauvegarde avant d&apos;être remplacée.</p>
        <div className="studio-publish-actions">
          <button type="button" className="webtoon-mini" onClick={onClose}>Annuler</button>
          <button type="button" className="webtoon-mini studio-primary" onClick={onPublish} disabled={!diff && !error}>Publier sur lostgarden.world</button>
        </div>
      </div>
    </dialog>
  );
}
