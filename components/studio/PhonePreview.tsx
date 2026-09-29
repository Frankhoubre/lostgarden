"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { WebtoonPanel } from "@/lib/webtoon/types";
import { WebtoonReader } from "@/components/webtoon/WebtoonReader";

/** Screen widths in CSS px of the phones most readers hold: a small Android, an iPhone, a large one. */
const PHONES = [
  { width: 360, height: 740, label: "360" },
  { width: 390, height: 780, label: "390" },
  { width: 430, height: 860, label: "430" },
] as const;

type PhonePreviewProps = {
  panels: WebtoonPanel[];
  locale: Locale;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * The strip at the width most readers see it: the public reader itself (not
 * the editable canvas) in a phone screen of real CSS size, scrolled to the
 * selected panel. A bubble that reads well at 1080 can be tiny on a phone,
 * a gap that breathes on a monitor can be a whole screen of nothing; this is
 * where it shows. A tap on a panel selects it in the studio.
 */
export function PhonePreview({ panels, locale, selectedId, onSelect }: PhonePreviewProps) {
  const [phone, setPhone] = useState<(typeof PHONES)[number]>(() => {
    try {
      const stored = Number(window.localStorage.getItem("studio.phone"));
      return PHONES.find((p) => p.width === stored) ?? PHONES[1];
    } catch {
      return PHONES[1];
    }
  });
  const screen = useRef<HTMLDivElement>(null);
  const lastScrolled = useRef<string | null>(null);

  useEffect(() => {
    // Only when the selection changes from elsewhere: a tap inside the phone already has the panel in view.
    if (!selectedId || lastScrolled.current === selectedId) return;
    const host = screen.current;
    const node = host?.querySelector<HTMLElement>(`[data-panel-id="${CSS.escape(selectedId)}"]`);
    if (!host || !node) return;
    lastScrolled.current = selectedId;
    host.scrollTo({ top: Math.max(0, node.offsetTop - 60), behavior: "smooth" });
  }, [selectedId, phone]);

  const choose = (next: (typeof PHONES)[number]) => {
    setPhone(next);
    lastScrolled.current = null;
    try {
      window.localStorage.setItem("studio.phone", String(next.width));
    } catch {
      // The choice just does not persist.
    }
  };

  return (
    <div className="studio-phone-wrap">
      <div className="studio-viewswitch" role="group" aria-label="Largeur du téléphone">
        {PHONES.map((p) => (
          <button key={p.width} type="button" className={`webtoon-mini ${p.width === phone.width ? "is-active" : ""}`} onClick={() => choose(p)} title={`Écran de ${p.width} px de large`}>
            {p.label} px
          </button>
        ))}
      </div>
      <div className="studio-phone" style={{ width: phone.width + 24 }}>
        <div className="studio-phone-notch" aria-hidden="true" />
        <div ref={screen} className="studio-phone-screen" style={{ width: phone.width, height: phone.height }}>
          <WebtoonReader
            panels={panels}
            locale={locale}
            selectedId={selectedId}
            onSelect={(id) => {
              lastScrolled.current = id;
              onSelect(id);
            }}
          />
        </div>
      </div>
      <p className="studio-phone-note">Le lecteur public, tel qu&apos;il s&apos;affiche sur un téléphone de {phone.width} px de large. Touchez une case pour la sélectionner.</p>
    </div>
  );
}
