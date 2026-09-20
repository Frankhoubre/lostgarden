"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { WebtoonReader } from "@/components/webtoon/WebtoonReader";
import { localePath } from "@/lib/i18n/navigation";
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
import { fill } from "@/lib/webtoon/text";
import type {
  BubbleStyle,
  Dialogue,
  PanelBackground,
  ShotType,
  TransitionType,
  WebtoonPanel,
  WebtoonScript,
} from "@/lib/webtoon/types";

const SHOT_TYPES: ShotType[] = [
  "extreme_wide", "wide", "full", "medium", "medium_close_up", "close_up", "extreme_close_up", "detail", "void",
];
const TRANSITIONS = Object.keys(SPACING_BY_TRANSITION) as TransitionType[];
const BACKGROUNDS: PanelBackground[] = ["white", "black", "abyss"];
const BUBBLES: BubbleStyle[] = ["speech", "whisper", "thought", "shout", "off"];

type WebtoonEditorProps = { script: WebtoonScript };

function storageKey(slug: string) {
  return `lostgarden.webtoon.${slug}.panels`;
}

export function WebtoonEditor({ script }: WebtoonEditorProps) {
  const { locale, dict } = useLocale();
  const t = dict.webtoon.editor;
  const [panels, setPanels] = useState<WebtoonPanel[]>(script.panels);
  const [selectedId, setSelectedId] = useState<string | null>(script.panels[0]?.panel_id ?? null);
  const [showIds, setShowIds] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Restore a draft kept in this browser, if any. The read happens in a
  // deferred callback so the server-rendered strip hydrates untouched first.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(storageKey(script.slug));
        if (raw) {
          const parsed = JSON.parse(raw) as WebtoonPanel[];
          if (Array.isArray(parsed) && parsed.length) setPanels(parsed);
        }
      } catch {
        // Storage unavailable: the editor still works, edits just do not persist.
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [script.slug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey(script.slug), JSON.stringify(panels));
    } catch {
      // ignore
    }
  }, [panels, hydrated, script.slug]);

  const selected = useMemo(
    () => panels.find((p) => p.panel_id === selectedId) ?? panels[0] ?? null,
    [panels, selectedId],
  );
  const layout = useMemo(() => computeLayout(panels), [panels]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 1800);
  }, []);

  const patch = (changes: Partial<WebtoonPanel>) => {
    if (!selected) return;
    setPanels((current) => updatePanel(current, selected.panel_id, changes));
  };

  const exportJson = () => {
    const payload = { ...script, panels, layout, generated_at: new Date().toISOString() };
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
        }
      } catch {
        // Not a storyboard JSON: ignore.
      }
    });
  };

  /**
   * Regenerate the selected panel through /api/webtoon/<slug>/generate
   * (Vercel AI Gateway, GPT Image 2.5 Sunburst, sheets attached). The result
   * replaces the panel image in this browser session; the batch script
   * persists final choices into the repository.
   */
  const regenerate = async () => {
    if (!selected || busyId) return;
    setBusyId(selected.panel_id);
    try {
      const response = await fetch(`/api/webtoon/${script.slug}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panel_id: selected.panel_id, panel: selected }),
      });
      const payload = (await response.json()) as { data_url?: string; model?: string; error?: string };
      if (!response.ok || !payload.data_url) {
        flash(payload.error ?? `HTTP ${response.status}`);
        setPanels((current) => markForRegeneration(current, selected.panel_id));
        return;
      }
      setPanels((current) =>
        updatePanel(current, selected.panel_id, {
          image: {
            src: payload.data_url as string,
            width: 1080,
            height: selected.panel_height,
            model: payload.model,
            generated_at: new Date().toISOString(),
            status: "generated",
          },
        }),
      );
      flash(t.generated);
    } catch (error) {
      flash(error instanceof Error ? error.message : "error");
    } finally {
      setBusyId(null);
    }
  };

  const copyPrompt = () => {
    if (!selected) return;
    const request = buildGenerationRequest(selected);
    navigator.clipboard.writeText(JSON.stringify(request, null, 2)).then(() => flash(t.copied));
  };

  const updateDialogue = (index: number, changes: Partial<Dialogue>) => {
    if (!selected) return;
    const dialogue = selected.dialogue.map((line, i) => (i === index ? { ...line, ...changes } : line));
    patch({ dialogue });
  };

  const imageStatus = (panel: WebtoonPanel) =>
    panel.image.status === "generated" ? t.generated : panel.image.status === "stale" ? t.stale : t.missing;

  return (
    <div className="webtoon-editor">
      <aside className="webtoon-editor-side">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary webtoon-btn" onClick={exportJson}>{t.exportJson}</button>
          <button type="button" className="btn-secondary webtoon-btn" onClick={() => fileInput.current?.click()}>{t.importJson}</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importJson(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn-secondary webtoon-btn"
            onClick={() => {
              setPanels(script.panels);
              setSelectedId(script.panels[0]?.panel_id ?? null);
            }}
          >
            {t.reset}
          </button>
        </div>
        <p className="mt-2 text-xs text-ivory/60">
          {fill(t.total, { px: layout.total_height, count: panels.length })} · {t.saved}
          {notice ? <span className="ml-2 text-magic">{notice}</span> : null}
        </p>

        <h2 className="anime-label mt-5 text-xs text-cyan-pale">{t.panelsList}</h2>
        <ol className="mt-2 space-y-1">
          {panels.map((panel) => (
            <li key={panel.panel_id}>
              <button
                type="button"
                onClick={() => setSelectedId(panel.panel_id)}
                className={`webtoon-list-item ${selected?.panel_id === panel.panel_id ? "webtoon-list-item-active" : ""}`}
              >
                <span className="font-display text-xs">{panel.order}. {panel.panel_id}</span>
                <span className="text-[0.7rem] text-ivory/60">
                  {panel.shot_type} · {panel.panel_height}px · {panel.image.status}
                </span>
              </button>
            </li>
          ))}
        </ol>

        {selected ? (
          <div className="mt-6 space-y-4">
            <h2 className="anime-label text-xs text-cyan-pale">{t.selected}: {selected.panel_id}</h2>
            <p className="text-xs text-ivory/60">{imageStatus(selected)}</p>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => movePanel(c, selected.panel_id, -1))}>{t.moveUp}</button>
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => movePanel(c, selected.panel_id, 1))}>{t.moveDown}</button>
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => insertAfter(c, selected.panel_id))}>{t.insertAfter}</button>
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => mergeWithNext(c, selected.panel_id))}>{t.merge}</button>
              <button type="button" className="webtoon-mini" onClick={() => setPanels((c) => splitPanel(c, selected.panel_id))}>{t.split}</button>
              <button
                type="button"
                className="webtoon-mini webtoon-mini-danger"
                onClick={() => {
                  const index = panels.findIndex((p) => p.panel_id === selected.panel_id);
                  const next = deletePanel(panels, selected.panel_id);
                  setPanels(next);
                  setSelectedId(next[Math.min(index, next.length - 1)]?.panel_id ?? null);
                }}
              >
                {t.delete}
              </button>
            </div>

            <label className="webtoon-field">
              <span>{t.height}: {selected.panel_height}</span>
              <input
                type="range"
                min={240}
                max={2600}
                step={10}
                value={selected.panel_height}
                onChange={(e) => patch({ panel_height: Number(e.target.value) })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="webtoon-field">
                <span>{t.spacingBefore}</span>
                <input type="number" min={0} max={4000} step={10} value={selected.spacing_before} onChange={(e) => patch({ spacing_before: Number(e.target.value) })} />
              </label>
              <label className="webtoon-field">
                <span>{t.spacingAfter}</span>
                <input type="number" min={0} max={4000} step={10} value={selected.spacing_after} onChange={(e) => patch({ spacing_after: Number(e.target.value) })} />
              </label>
              <label className="webtoon-field">
                <span>{t.transition}</span>
                <select value={selected.transition_type} onChange={(e) => setPanels((c) => setTransition(c, selected.panel_id, e.target.value as TransitionType))}>
                  {TRANSITIONS.map((v) => <option key={v} value={v}>{v} ({SPACING_BY_TRANSITION[v]})</option>)}
                </select>
              </label>
              <label className="webtoon-field">
                <span>{t.shotType}</span>
                <select value={selected.shot_type} onChange={(e) => patch({ shot_type: e.target.value as ShotType })}>
                  {SHOT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="webtoon-field">
                <span>{t.background}</span>
                <select value={selected.background} onChange={(e) => patch({ background: e.target.value as PanelBackground })}>
                  {BACKGROUNDS.map((v) => <option key={v} value={v}>{t[v]}</option>)}
                </select>
              </label>
              <label className="webtoon-field webtoon-field-row">
                <input type="checkbox" checked={selected.border} onChange={(e) => patch({ border: e.target.checked })} />
                <span>{t.border}</span>
              </label>
              <label className="webtoon-field">
                <span>{t.focal}</span>
                <div className="flex gap-2">
                  <input type="number" min={0} max={100} value={selected.focal_point.x} onChange={(e) => patch({ focal_point: { ...selected.focal_point, x: Number(e.target.value) } })} />
                  <input type="number" min={0} max={100} value={selected.focal_point.y} onChange={(e) => patch({ focal_point: { ...selected.focal_point, y: Number(e.target.value) } })} />
                </div>
              </label>
            </div>

            <label className="webtoon-field">
              <span>{t.purpose}</span>
              <textarea rows={3} value={selected.purpose} onChange={(e) => patch({ purpose: e.target.value })} />
            </label>
            <label className="webtoon-field">
              <span>{t.description}</span>
              <textarea rows={4} value={selected.description} onChange={(e) => patch({ description: e.target.value })} />
            </label>

            <div>
              <div className="flex items-center justify-between">
                <span className="webtoon-field-label">{t.dialogue}</span>
                <button
                  type="button"
                  className="webtoon-mini"
                  onClick={() =>
                    patch({
                      dialogue: [
                        ...selected.dialogue,
                        { speaker: "", text: { en: "" }, style: "speech", anchor: { x: 30, y: 20 }, tail: { x: 50, y: 50 } },
                      ],
                    })
                  }
                >
                  {t.add}
                </button>
              </div>
              {selected.dialogue.map((line, index) => (
                <div key={index} className="webtoon-subcard">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder={t.speaker} value={line.speaker} onChange={(e) => updateDialogue(index, { speaker: e.target.value })} />
                    <select value={line.style} onChange={(e) => updateDialogue(index, { style: e.target.value as BubbleStyle })}>
                      {BUBBLES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <input
                    placeholder={`${t.text} (${locale})`}
                    value={line.text[locale] ?? line.text.en}
                    onChange={(e) => updateDialogue(index, { text: { ...line.text, [locale]: e.target.value } })}
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <input type="number" title={t.anchor} value={line.anchor.x} onChange={(e) => updateDialogue(index, { anchor: { ...line.anchor, x: Number(e.target.value) } })} />
                    <input type="number" title={t.anchor} value={line.anchor.y} onChange={(e) => updateDialogue(index, { anchor: { ...line.anchor, y: Number(e.target.value) } })} />
                    <input type="number" title="tail x" value={line.tail?.x ?? 50} onChange={(e) => updateDialogue(index, { tail: { x: Number(e.target.value), y: line.tail?.y ?? 50 } })} />
                    <input type="number" title="tail y" value={line.tail?.y ?? 50} onChange={(e) => updateDialogue(index, { tail: { x: line.tail?.x ?? 50, y: Number(e.target.value) } })} />
                  </div>
                  <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => patch({ dialogue: selected.dialogue.filter((_, i) => i !== index) })}>{t.remove}</button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="webtoon-field-label">{t.caption}</span>
                <button type="button" className="webtoon-mini" onClick={() => patch({ caption: [...selected.caption, { text: { en: "" }, anchor: { x: 8, y: 8 }, style: "narration" }] })}>{t.add}</button>
              </div>
              {selected.caption.map((box, index) => (
                <div key={index} className="webtoon-subcard">
                  <input
                    placeholder={`${t.text} (${locale})`}
                    value={box.text[locale] ?? box.text.en}
                    onChange={(e) => patch({ caption: selected.caption.map((c, i) => (i === index ? { ...c, text: { ...c.text, [locale]: e.target.value } } : c)) })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={box.anchor.x} onChange={(e) => patch({ caption: selected.caption.map((c, i) => (i === index ? { ...c, anchor: { ...c.anchor, x: Number(e.target.value) } } : c)) })} />
                    <input type="number" value={box.anchor.y} onChange={(e) => patch({ caption: selected.caption.map((c, i) => (i === index ? { ...c, anchor: { ...c.anchor, y: Number(e.target.value) } } : c)) })} />
                  </div>
                  <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => patch({ caption: selected.caption.filter((_, i) => i !== index) })}>{t.remove}</button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="webtoon-field-label">{t.sfx}</span>
                <button type="button" className="webtoon-mini" onClick={() => patch({ sfx: [...selected.sfx, { text: { en: "" }, anchor: { x: 70, y: 70 }, style: "soft", rotate: -8, size: 96 }] })}>{t.add}</button>
              </div>
              {selected.sfx.map((effect, index) => (
                <div key={index} className="webtoon-subcard">
                  <input
                    placeholder={`${t.text} (${locale})`}
                    value={effect.text[locale] ?? effect.text.en}
                    onChange={(e) => patch({ sfx: selected.sfx.map((s, i) => (i === index ? { ...s, text: { ...s.text, [locale]: e.target.value } } : s)) })}
                  />
                  <div className="grid grid-cols-4 gap-2">
                    <input type="number" value={effect.anchor.x} onChange={(e) => patch({ sfx: selected.sfx.map((s, i) => (i === index ? { ...s, anchor: { ...s.anchor, x: Number(e.target.value) } } : s)) })} />
                    <input type="number" value={effect.anchor.y} onChange={(e) => patch({ sfx: selected.sfx.map((s, i) => (i === index ? { ...s, anchor: { ...s.anchor, y: Number(e.target.value) } } : s)) })} />
                    <input type="number" title="rotate" value={effect.rotate ?? 0} onChange={(e) => patch({ sfx: selected.sfx.map((s, i) => (i === index ? { ...s, rotate: Number(e.target.value) } : s)) })} />
                    <input type="number" title="size" value={effect.size ?? 96} onChange={(e) => patch({ sfx: selected.sfx.map((s, i) => (i === index ? { ...s, size: Number(e.target.value) } : s)) })} />
                  </div>
                  <button type="button" className="webtoon-mini webtoon-mini-danger" onClick={() => patch({ sfx: selected.sfx.filter((_, i) => i !== index) })}>{t.remove}</button>
                </div>
              ))}
            </div>

            <label className="webtoon-field">
              <span>{t.prompt}</span>
              <textarea rows={10} value={selected.generation_prompt} onChange={(e) => patch({ generation_prompt: e.target.value })} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="webtoon-mini" onClick={copyPrompt}>{t.copyPrompt}</button>
              <button type="button" className="webtoon-mini" onClick={regenerate} disabled={busyId !== null}>
                {busyId === selected.panel_id ? "…" : t.regenerate}
              </button>
            </div>
            <div>
              <span className="webtoon-field-label">{t.references}</span>
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
        ) : null}
      </aside>

      <section className="webtoon-editor-main">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="anime-label text-xs text-cyan-pale">{t.preview}</span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-ivory/70">
              <input type="checkbox" checked={showIds} onChange={(e) => setShowIds(e.target.checked)} />
              {t.showIds}
            </label>
            <Link href={localePath(locale, `/webtoon/${script.slug}`)} className="text-xs text-cyan-pale/80 underline-offset-4 hover:underline">
              {dict.webtoon.backToReader}
            </Link>
          </div>
        </div>
        <div className="webtoon-editor-preview">
          <WebtoonReader panels={panels} showIds={showIds} onSelect={setSelectedId} selectedId={selected?.panel_id ?? null} />
        </div>
      </section>
    </div>
  );
}
