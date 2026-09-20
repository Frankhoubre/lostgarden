"use client";

import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { PanelCanvas } from "@/components/studio/PanelCanvas";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { WebtoonReader } from "@/components/webtoon/WebtoonReader";
import { getFirebaseAuth } from "@/lib/firebase";
import type { Locale } from "@/lib/i18n/config";
import { SPACING_BY_TRANSITION } from "@/lib/webtoon/adaptation";
import {
  deletePanel,
  insertAfter,
  markForRegeneration,
  mergeWithNext,
  movePanel,
  setTransition,
  splitPanel,
  updatePanel,
} from "@/lib/webtoon/editor-ops";
import { buildGenerationRequest } from "@/lib/webtoon/generation";
import { computeLayout } from "@/lib/webtoon/layout";
import { referencesForPanel } from "@/lib/webtoon/references";
import { imageSize, readFileAsDataUrl, uploadPanelImage } from "@/lib/webtoon/studio";
import type {
  BubbleStyle,
  CameraAngle,
  Fidelity,
  LocalizedText,
  PanelBackground,
  ShotType,
  TransitionType,
  WebtoonPanel,
  WebtoonScript,
} from "@/lib/webtoon/types";

const SHOT_TYPES: ShotType[] = ["extreme_wide", "wide", "full", "medium", "medium_close_up", "close_up", "extreme_close_up", "detail", "void"];
const ANGLES: CameraAngle[] = ["eye_level", "low", "high", "top_down", "dutch", "over_the_shoulder", "worm"];
const TRANSITIONS = Object.keys(SPACING_BY_TRANSITION) as TransitionType[];
const BACKGROUNDS: PanelBackground[] = ["white", "black", "abyss"];
const BUBBLES: BubbleStyle[] = ["speech", "whisper", "thought", "shout", "off"];
const FIDELITIES: Fidelity[] = ["direct", "reframe", "bridge"];

const LABEL: Record<string, string> = {
  white: "Blanc", black: "Noir", abyss: "Bleu abysse",
  speech: "Parole", whisper: "Chuchoté", thought: "Pensée", shout: "Cri", off: "Hors champ",
  soft: "Doux", hard: "Dur", rumble: "Grondement",
  direct: "Plan du film", reframe: "Même instant, recadré", bridge: "Pont",
  continuous: "Continu", cut: "Coupe", beat: "Temps", breath: "Respiration", hard_cut: "Coupe sèche", fall: "Chute",
  fade_to_black: "Fondu au noir", fade_to_white: "Fondu au blanc", time_skip: "Ellipse",
};
const label = (value: string) => LABEL[value] ?? value;

type StudioEditorProps = {
  script: WebtoonScript;
  panels: WebtoonPanel[];
  setPanels: Dispatch<SetStateAction<WebtoonPanel[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  notify: (message: string) => void;
};

/**
 * The working view of the strip: the list on the left, the selected panel
 * at working size in the middle with draggable lettering, the inspector on
 * the right. Every change goes through the pure editor operations, so the
 * public reader renders exactly what is edited here.
 */
export function StudioEditor({ script, panels, setPanels, selectedId, setSelectedId, notify }: StudioEditorProps) {
  const { locale } = useLocale();
  const { user } = useAuth();
  const [showStrip, setShowStrip] = useState(false);
  const [showFocal, setShowFocal] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => panels.find((p) => p.panel_id === selectedId) ?? panels[0] ?? null, [panels, selectedId]);
  const layout = useMemo(() => computeLayout(panels), [panels]);
  const index = selected ? panels.findIndex((p) => p.panel_id === selected.panel_id) : -1;

  const patch = (changes: Partial<WebtoonPanel>) => {
    if (!selected) return;
    setPanels((current) => updatePanel(current, selected.panel_id, changes));
  };

  const select = (id: string | null) => {
    setSelectedId(id);
  };

  const step = (delta: number) => {
    const next = panels[index + delta];
    if (next) select(next.panel_id);
  };

  const setImage = async (dataUrl: string, model?: string) => {
    if (!selected) return;
    let src = dataUrl;
    if (user) {
      try {
        src = await uploadPanelImage(script.slug, selected.panel_id, dataUrl);
      } catch (error) {
        notify(`Image gardée dans la session seulement : ${error instanceof Error ? error.message : "envoi impossible"}`);
      }
    }
    const size = await imageSize(dataUrl).catch(() => ({ width: 1080, height: selected.panel_height }));
    patch({ image: { src, width: size.width, height: size.height, model, generated_at: new Date().toISOString(), status: "generated" } });
  };

  const regenerate = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const token = (await getFirebaseAuth().currentUser?.getIdToken()) ?? "";
      const response = await fetch(`/api/webtoon/${script.slug}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ panel_id: selected.panel_id, panel: selected }),
      });
      const payload = (await response.json()) as { data_url?: string; model?: string; error?: string };
      if (!response.ok || !payload.data_url) {
        notify(payload.error ?? `Erreur ${response.status}`);
        setPanels((current) => markForRegeneration(current, selected.panel_id));
        return;
      }
      await setImage(payload.data_url, payload.model);
      notify("Image regénérée");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Erreur de génération");
    } finally {
      setBusy(false);
    }
  };

  const replaceImage = async (file: File) => {
    setBusy(true);
    try {
      await setImage(await readFileAsDataUrl(file), "manual-upload");
      notify("Image remplacée");
    } finally {
      setBusy(false);
    }
  };

  const copyPrompt = () => {
    if (!selected) return;
    navigator.clipboard.writeText(JSON.stringify(buildGenerationRequest(selected), null, 2)).then(() => notify("Prompt copié"));
  };

  const textInputs = (value: LocalizedText, onText: (next: LocalizedText) => void) => (
    <div className="studio-langs">
      {(["fr", "en", "ja", "ko"] as Locale[]).map((code) => (
        <label key={code}>
          <span>{code}</span>
          <input value={value[code] ?? ""} placeholder={value.en} onChange={(e) => onText({ ...value, [code]: e.target.value })} />
        </label>
      ))}
    </div>
  );

  if (!selected) return <p className="text-sm text-ivory/70">Aucune case.</p>;

  return (
    <div className="studio-editor webtoon-editor">
      <aside className="studio-list">
        <p className="studio-list-total">{panels.length} cases · {layout.total_height.toLocaleString("fr-FR")} px</p>
        <ol>
          {panels.map((panel) => (
            <li key={panel.panel_id}>
              <button
                type="button"
                className={`studio-thumb ${panel.panel_id === selected.panel_id ? "is-active" : ""}`}
                onClick={() => select(panel.panel_id)}
                style={{ background: panel.background === "white" ? "#f6f4ef" : "#020409" }}
              >
                {panel.image.src && panel.image.status !== "missing" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={panel.image.src} alt="" loading="lazy" style={{ objectPosition: `${panel.focal_point.x}% ${panel.focal_point.y}%` }} />
                ) : (
                  <span className="studio-thumb-empty">sans image</span>
                )}
                <span className="studio-thumb-meta">
                  <b>{panel.order}</b> {panel.panel_id}
                  {panel.fidelity !== "direct" ? <i> · {label(panel.fidelity)}</i> : null}
                  {panel.image.status === "stale" ? <i> · à regénérer</i> : null}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <section className="studio-stage">
        <div className="studio-stage-bar">
          <div className="flex items-center gap-2">
            <button type="button" className="webtoon-mini" onClick={() => step(-1)} disabled={index <= 0}>← Précédente</button>
            <span className="anime-label text-xs text-cyan-pale">{selected.panel_id} · case {selected.order}/{panels.length}</span>
            <button type="button" className="webtoon-mini" onClick={() => step(1)} disabled={index >= panels.length - 1}>Suivante →</button>
          </div>
          <div className="flex items-center gap-3 text-xs text-ivory/70">
            <label className="flex items-center gap-2"><input type="checkbox" checked={showFocal} onChange={(e) => setShowFocal(e.target.checked)} /> Point focal</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={showStrip} onChange={(e) => setShowStrip(e.target.checked)} /> Bande complète</label>
          </div>
        </div>
        <p className="studio-hint">Glisse les poignées : rond = bulle, losange = pointe de la bulle, carré = son, barre du bas = hauteur de la case.</p>
        <PanelCanvas panel={selected} locale={locale} onChange={patch} showFocal={showFocal} />
        {showStrip ? (
          <div className="studio-strip-preview">
            <WebtoonReader panels={panels} showIds onSelect={select} selectedId={selected.panel_id} />
          </div>
        ) : null}
      </section>

      <aside className="studio-inspector">
        <details open>
          <summary>Texte</summary>
          <div className="studio-section">
            <div className="studio-section-head">
              <span className="webtoon-field-label">Bulles</span>
              <button type="button" className="webtoon-mini" onClick={() => patch({ dialogue: [...selected.dialogue, { speaker: "", text: { en: "" }, style: "speech", anchor: { x: 30, y: 20 }, tail: { x: 50, y: 50 } }] })}>+ Bulle</button>
            </div>
            {selected.dialogue.map((line, i) => (
              <div key={i} className="webtoon-subcard">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Qui parle" value={line.speaker} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, speaker: e.target.value } : l)) })} />
                  <select value={line.style} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, style: e.target.value as BubbleStyle } : l)) })}>
                    {BUBBLES.map((v) => <option key={v} value={v}>{label(v)}</option>)}
                  </select>
                </div>
                {textInputs(line.text, (text) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, text } : l)) }))}
                <div className="studio-numbers">
                  <label><span>x</span><input type="number" value={line.anchor.x} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, anchor: { ...l.anchor, x: Number(e.target.value) } } : l)) })} /></label>
                  <label><span>y</span><input type="number" value={line.anchor.y} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, anchor: { ...l.anchor, y: Number(e.target.value) } } : l)) })} /></label>
                  <label><span>pointe x</span><input type="number" value={line.tail?.x ?? 50} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, tail: { x: Number(e.target.value), y: l.tail?.y ?? 50 } } : l)) })} /></label>
                  <label><span>pointe y</span><input type="number" value={line.tail?.y ?? 50} onChange={(e) => patch({ dialogue: selected.dialogue.map((l, k) => (k === i ? { ...l, tail: { x: l.tail?.x ?? 50, y: Number(e.target.value) } } : l)) })} /></label>
                </div>
                <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => patch({ dialogue: selected.dialogue.filter((_, k) => k !== i) })}>Supprimer la bulle</button>
              </div>
            ))}

            <div className="studio-section-head mt-4">
              <span className="webtoon-field-label">Sons (SFX)</span>
              <button type="button" className="webtoon-mini" onClick={() => patch({ sfx: [...selected.sfx, { text: { en: "whoosh" }, anchor: { x: 60, y: 30 }, style: "soft", rotate: -10, size: 90 }] })}>+ Son</button>
            </div>
            {selected.sfx.map((effect, i) => (
              <div key={i} className="webtoon-subcard">
                {textInputs(effect.text, (text) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, text } : s)) }))}
                <div className="grid grid-cols-2 gap-2">
                  <select value={effect.style} onChange={(e) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, style: e.target.value as "soft" | "hard" | "rumble" } : s)) })}>
                    {(["soft", "hard", "rumble"] as const).map((v) => <option key={v} value={v}>{label(v)}</option>)}
                  </select>
                  <label className="webtoon-field"><span>Taille {effect.size ?? 96}</span><input type="range" min={30} max={260} value={effect.size ?? 96} onChange={(e) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, size: Number(e.target.value) } : s)) })} /></label>
                </div>
                <label className="webtoon-field"><span>Rotation {effect.rotate ?? 0}°</span><input type="range" min={-90} max={90} value={effect.rotate ?? 0} onChange={(e) => patch({ sfx: selected.sfx.map((s, k) => (k === i ? { ...s, rotate: Number(e.target.value) } : s)) })} /></label>
                <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => patch({ sfx: selected.sfx.filter((_, k) => k !== i) })}>Supprimer le son</button>
              </div>
            ))}

            <div className="studio-section-head mt-4">
              <span className="webtoon-field-label">Cartouches</span>
              <button type="button" className="webtoon-mini" onClick={() => patch({ caption: [...selected.caption, { text: { en: "" }, anchor: { x: 8, y: 8 }, style: "narration" }] })}>+ Cartouche</button>
            </div>
            {selected.caption.map((box, i) => (
              <div key={i} className="webtoon-subcard">
                {textInputs(box.text, (text) => patch({ caption: selected.caption.map((c, k) => (k === i ? { ...c, text } : c)) }))}
                <select value={box.style} onChange={(e) => patch({ caption: selected.caption.map((c, k) => (k === i ? { ...c, style: e.target.value as "narration" | "location" | "time" } : c)) })}>
                  <option value="narration">Narration</option><option value="location">Lieu</option><option value="time">Temps</option>
                </select>
                <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => patch({ caption: selected.caption.filter((_, k) => k !== i) })}>Supprimer</button>
              </div>
            ))}
          </div>
        </details>

        <details open>
          <summary>Cadre et rythme</summary>
          <div className="studio-section">
            <label className="webtoon-field">
              <span>Hauteur : {selected.panel_height} px (ratio {selected.aspect_ratio})</span>
              <input type="range" min={240} max={2600} step={10} value={selected.panel_height} onChange={(e) => patch({ panel_height: Number(e.target.value) })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="webtoon-field webtoon-field-row"><input type="checkbox" checked={selected.bleed} onChange={(e) => patch({ bleed: e.target.checked })} /><span>Pleine largeur</span></label>
              <label className="webtoon-field webtoon-field-row"><input type="checkbox" checked={selected.border} onChange={(e) => patch({ border: e.target.checked })} /><span>Bordure</span></label>
              <label className="webtoon-field"><span>Fond de page</span>
                <select value={selected.background} onChange={(e) => patch({ background: e.target.value as PanelBackground })}>{BACKGROUNDS.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>
              </label>
              <label className="webtoon-field"><span>Point focal x, y</span>
                <div className="flex gap-2">
                  <input type="number" min={0} max={100} value={selected.focal_point.x} onChange={(e) => patch({ focal_point: { ...selected.focal_point, x: Number(e.target.value) } })} />
                  <input type="number" min={0} max={100} value={selected.focal_point.y} onChange={(e) => patch({ focal_point: { ...selected.focal_point, y: Number(e.target.value) } })} />
                </div>
              </label>
              <label className="webtoon-field"><span>Transition (espace avant)</span>
                <select value={selected.transition_type} onChange={(e) => setPanels((c) => setTransition(c, selected.panel_id, e.target.value as TransitionType))}>
                  {TRANSITIONS.map((v) => <option key={v} value={v}>{label(v)} · {SPACING_BY_TRANSITION[v]} px</option>)}
                </select>
              </label>
              <label className="webtoon-field"><span>Espace avant (px)</span><input type="number" min={0} max={4000} step={10} value={selected.spacing_before} onChange={(e) => patch({ spacing_before: Number(e.target.value) })} /></label>
              <label className="webtoon-field"><span>Espace après (px)</span><input type="number" min={0} max={4000} step={10} value={selected.spacing_after} onChange={(e) => patch({ spacing_after: Number(e.target.value) })} /></label>
              <label className="webtoon-field"><span>Type de plan</span>
                <select value={selected.shot_type} onChange={(e) => patch({ shot_type: e.target.value as ShotType })}>{SHOT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
              </label>
              <label className="webtoon-field"><span>Angle</span>
                <select value={selected.camera_angle} onChange={(e) => patch({ camera_angle: e.target.value as CameraAngle })}>{ANGLES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
              </label>
              <label className="webtoon-field"><span>Fidélité</span>
                <select value={selected.fidelity} onChange={(e) => patch({ fidelity: e.target.value as Fidelity })}>{FIDELITIES.map((v) => <option key={v} value={v}>{label(v)}</option>)}</select>
              </label>
            </div>
          </div>
        </details>

        <details>
          <summary>Image et prompt</summary>
          <div className="studio-section">
            <p className="text-xs text-ivory/60">
              {selected.image.status === "generated" ? "Image générée" : selected.image.status === "stale" ? "Le prompt a changé depuis l'image" : "Pas d'image"}
              {selected.image.model ? ` · ${selected.image.model}` : ""}
              {selected.source_time_start !== null ? ` · film ${selected.source_time_start.toFixed(1)} s à ${selected.source_time_end?.toFixed(1)} s` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini" onClick={regenerate} disabled={busy}>{busy ? "…" : "Regénérer (GPT Image 2.5)"}</button>
              <button type="button" className="webtoon-mini" onClick={() => fileInput.current?.click()} disabled={busy}>Remplacer par un fichier</button>
              <button type="button" className="webtoon-mini" onClick={copyPrompt}>Copier la requête</button>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void replaceImage(f); e.target.value = ""; }} />
            </div>
            <label className="webtoon-field"><span>Description de la case</span><textarea rows={4} value={selected.description} onChange={(e) => patch({ description: e.target.value })} /></label>
            <label className="webtoon-field"><span>Action</span><textarea rows={2} value={selected.action} onChange={(e) => patch({ action: e.target.value })} /></label>
            <label className="webtoon-field"><span>Émotion</span><input value={selected.emotion} onChange={(e) => patch({ emotion: e.target.value })} /></label>
            <label className="webtoon-field"><span>Pourquoi cette case existe</span><textarea rows={3} value={selected.purpose} onChange={(e) => patch({ purpose: e.target.value })} /></label>
            <label className="webtoon-field"><span>Prompt de génération</span><textarea rows={12} value={selected.generation_prompt} onChange={(e) => patch({ generation_prompt: e.target.value })} /></label>
            <div>
              <span className="webtoon-field-label">Références jointes, dans l&apos;ordre</span>
              <ul className="mt-1 flex flex-wrap gap-2">
                {referencesForPanel(selected).map((ref) => (
                  <li key={ref.id} className="webtoon-ref">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ref.image} alt={ref.name} loading="lazy" />
                    <span>{ref.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>

        <details>
          <summary>Structure</summary>
          <div className="studio-section">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => movePanel(c, selected.panel_id, -1))}>Monter</button>
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => movePanel(c, selected.panel_id, 1))}>Descendre</button>
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => insertAfter(c, selected.panel_id))}>Insérer une case après</button>
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => splitPanel(c, selected.panel_id))}>Couper en deux</button>
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => mergeWithNext(c, selected.panel_id))}>Fusionner avec la suivante</button>
              <button
                type="button"
                className="webtoon-mini webtoon-mini-danger"
                onClick={() => {
                  if (!window.confirm(`Supprimer la case ${selected.panel_id} ?`)) return;
                  const next = deletePanel(panels, selected.panel_id);
                  setPanels(next);
                  select(next[Math.min(index, next.length - 1)]?.panel_id ?? null);
                }}
              >
                Supprimer la case
              </button>
            </div>
            <p className="text-xs text-ivory/60">Temps {selected.beat_id} · plans {selected.source_shots.join(", ") || "aucun"} · rôle {selected.narrative_role}</p>
          </div>
        </details>
      </aside>
    </div>
  );
}
