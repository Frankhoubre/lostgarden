"use client";

import { doc, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { getDb } from "@/lib/firebase";

export type StripCost = {
  total_usd: number;
  images_usd?: number;
  sheets_usd?: number;
  writer_usd?: number;
  translate_usd?: number;
  count?: number;
  images_count?: number;
  sheets_count?: number;
  writer_count?: number;
  translate_count?: number;
  /** Part of the total estimated: what was generated before the counter existed, and what scripts did not record. */
  estimated_usd?: number;
  /** The budget of the episode, set by the author; alerts at 80 % and 100 %. */
  budget_usd?: number;
};

const usd = (value: number | undefined) => `${(value ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

/** Where the spending stands against the budget: none, close (80 %), over. */
export function budgetLevel(cost: StripCost | null): "none" | "ok" | "close" | "over" {
  if (!cost?.budget_usd) return "none";
  const ratio = cost.total_usd / cost.budget_usd;
  return ratio >= 1 ? "over" : ratio >= 0.8 ? "close" : "ok";
}

/**
 * The spending of the episode in the bar: its total, a click for the detail
 * (images, sheets, writing, translation, the estimated part) and the budget,
 * which the author sets here; the chip turns orange at 80 % of it, red past it.
 */
export function StudioCost({ slug, cost, notify }: { slug: string; cost: StripCost; notify: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const host = useRef<HTMLDivElement>(null);
  const level = budgetLevel(cost);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (host.current && !host.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const saveBudget = async () => {
    const value = Number(draft.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) return notify("Budget : un montant en dollars, par exemple 150");
    try {
      await setDoc(doc(getDb(), "webtoon_costs", slug), { budget_usd: value || null }, { merge: true });
      notify(value ? `Budget de l'épisode : ${usd(value)}` : "Budget retiré");
      setDraft("");
    } catch (error) {
      notify(`Budget non enregistré : ${error instanceof Error ? error.message : "erreur"}`);
    }
  };

  const lines: [string, number | undefined, number | undefined][] = [
    ["Images", cost.images_usd, cost.images_count],
    ["Fiches", cost.sheets_usd, cost.sheets_count],
    ["Écriture, guide, contrôles", cost.writer_usd, cost.writer_count],
    ["Traductions", cost.translate_usd, cost.translate_count],
  ];

  return (
    <div className="studio-cost-host" ref={host}>
      <button type="button" className={`studio-cost is-${level}`} onClick={() => setOpen((v) => !v)} title="Dépenses de cet épisode et budget">
        {usd(cost.total_usd)}
        {cost.budget_usd ? <small> / {usd(cost.budget_usd)}</small> : null}
      </button>
      {open ? (
        <div className="studio-cost-panel" role="dialog" aria-label="Dépenses">
          <p className="studio-gear-title">Dépenses de l&apos;épisode</p>
          <table>
            <tbody>
              {lines.map(([label, value, count]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{usd(value)}</td>
                  <td>{count ? `${count}` : ""}</td>
                </tr>
              ))}
              {cost.estimated_usd ? (
                <tr className="is-estimated">
                  <td>Estimé</td>
                  <td>{usd(cost.estimated_usd)}</td>
                  <td title="Ce qui a été généré avant le compteur, et ce que des scripts ont lancé sans le compter">?</td>
                </tr>
              ) : null}
              <tr className="is-total">
                <td>Total</td>
                <td>{usd(cost.total_usd)}</td>
                <td />
              </tr>
            </tbody>
          </table>
          {cost.budget_usd ? (
            <div className={`studio-cost-meter is-${level}`}>
              <i style={{ width: `${Math.min(100, (cost.total_usd / cost.budget_usd) * 100)}%` }} />
              <span>
                {Math.round((cost.total_usd / cost.budget_usd) * 100)} % du budget de {usd(cost.budget_usd)}
                {level === "over" ? ` · dépassé de ${usd(cost.total_usd - cost.budget_usd)}` : ` · reste ${usd(cost.budget_usd - cost.total_usd)}`}
              </span>
            </div>
          ) : null}
          <label className="studio-cost-budget">
            <span>Budget de l&apos;épisode ($)</span>
            <input value={draft} placeholder={cost.budget_usd ? String(cost.budget_usd) : "par exemple 150"} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void saveBudget()} inputMode="decimal" />
            <button type="button" className="webtoon-mini" onClick={() => void saveBudget()} disabled={!draft.trim()}>Enregistrer</button>
          </label>
          <small className="studio-cost-note">Alerte à 80 % et à 100 %. Une fois le budget dépassé, le studio demande confirmation avant d&apos;écrire la suite ou de générer en lot.</small>
        </div>
      ) : null}
    </div>
  );
}
