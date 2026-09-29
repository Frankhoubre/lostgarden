"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { SubscribersSummary } from "@/lib/webtoon/alerts";
import { MAIL_WORDS } from "@/lib/webtoon/alerts-mail";
import { studioHeaders } from "@/lib/webtoon/studio-headers";
import { fill } from "@/lib/webtoon/text";

const LANGUAGES: { id: Locale; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
];

type Texts = Record<Locale, { subject: string; text: string }>;

const formatDate = (iso: string) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function prefill(titles: Record<string, string>): Texts {
  return Object.fromEntries(
    LANGUAGES.map(({ id }) => [id, { subject: fill(MAIL_WORDS[id].announceSubject, { title: titles[id] ?? "" }), text: fill(MAIL_WORDS[id].announceText, { title: titles[id] ?? "" }) }]),
  ) as Texts;
}

async function fetchSummary(): Promise<SubscribersSummary> {
  const response = await fetch("/api/webtoon/subscribers", { headers: await studioHeaders(), cache: "no-store" });
  const json = (await response.json()) as SubscribersSummary & { error?: string };
  if (!response.ok) throw new Error(json.error ?? `erreur ${response.status}`);
  return json;
}

/**
 * "Prévenir les abonnés" (studio gear menu): the confirmed subscribers of the
 * episode alerts, and the announcement of one published episode, in each
 * subscriber's language. Sent only from here, after an explicit confirmation;
 * publishing an episode never sends anything.
 */
export function StudioSubscribers({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [summary, setSummary] = useState<SubscribersSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [texts, setTexts] = useState<Texts | null>(null);
  const [language, setLanguage] = useState<Locale>("fr");
  const [step, setStep] = useState<"edit" | "confirm" | "sending" | "done">("edit");
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  const apply = useCallback((json: SubscribersSummary) => {
    setError(null);
    setSummary(json);
    // The latest published episode by default.
    const latest = [...json.episodes].sort((a, b) => b.published_at.localeCompare(a.published_at))[0];
    if (latest) {
      setSlug((current) => current || latest.slug);
      setTexts((current) => current ?? prefill(latest.titles));
    }
  }, []);
  const load = useCallback(() => fetchSummary().then(apply, (e: unknown) => setError(e instanceof Error ? e.message : String(e))), [apply]);

  useEffect(() => {
    void load();
  }, [load]);

  const episode = summary?.episodes.find((e) => e.slug === slug) ?? null;
  const count = summary?.confirmed ?? 0;
  const byLocale = summary?.by_locale ?? {};
  // The languages that will actually receive this email must have a subject and a text.
  const missing = LANGUAGES.filter(({ id }) => (byLocale[id] ?? 0) > 0 && (!texts?.[id].subject.trim() || !texts?.[id].text.trim()));

  const send = async () => {
    if (!episode || !texts) return;
    setStep("sending");
    setResult(null);
    try {
      const response = await fetch("/api/webtoon/subscribers", {
        method: "POST",
        headers: { ...(await studioHeaders()), "content-type": "application/json" },
        body: JSON.stringify({
          slug: episode.slug,
          subjects: Object.fromEntries(LANGUAGES.map(({ id }) => [id, texts[id].subject])),
          texts: Object.fromEntries(LANGUAGES.map(({ id }) => [id, texts[id].text])),
          confirm: true,
          force: Boolean(episode.announced_at),
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { sent?: number; failed?: number; errors?: string[]; dry_run?: boolean; error?: string };
      if (!response.ok) throw new Error(json.error ?? `erreur ${response.status}`);
      const lines = [json.dry_run ? `Essai à blanc : ${json.sent} e-mails écrits dans le journal du serveur, aucun n'est parti.` : `Annonce envoyée à ${json.sent} abonné${json.sent === 1 ? "" : "s"}.`];
      if (json.failed) lines.push(`${json.failed} en échec : ${(json.errors ?? []).join(" ; ")}`);
      setResult(lines.join(" "));
      setStep("done");
      void load();
    } catch (e) {
      setResult(`Envoi impossible : ${e instanceof Error ? e.message : String(e)}`);
      setStep("edit");
    }
  };

  const edit = (field: "subject" | "text", value: string) => setTexts((t) => (t ? { ...t, [language]: { ...t[language], [field]: value } } : t));

  return (
    <dialog ref={dialog} className="studio-lightbox studio-export" onClose={onClose}>
      <div className="studio-export-body">
        <b>Prévenir les abonnés</b>
        <p className="text-xs text-ivory/70">
          Les lecteurs qui ont laissé leur adresse en bas d&apos;un épisode et confirmé leur inscription. L&apos;annonce part d&apos;ici seulement, jamais à la publication.
        </p>
        {error ? <p className="studio-history-error">{error}</p> : null}
        {!summary && !error ? <p className="text-sm text-ivory/70">Chargement…</p> : null}
        {summary && !summary.configured ? (
          <p className="studio-history-error">
            Envoi non configuré : il faut les variables RESEND_API_KEY et WEBTOON_MAIL_FROM sur Vercel (et un domaine vérifié chez Resend). Le formulaire des lecteurs reste caché d&apos;ici là.
          </p>
        ) : null}
        {summary ? (
          <>
            <p className="text-sm">
              <b>{count}</b> abonné{count === 1 ? "" : "s"} confirmé{count === 1 ? "" : "s"}
              {count ? ` (${LANGUAGES.filter(({ id }) => byLocale[id]).map(({ id }) => `${id} ${byLocale[id]}`).join(" · ")})` : ""}
              {summary.pending ? `, ${summary.pending} en attente de confirmation` : ""}
              {summary.dry_run ? " · essai à blanc (WEBTOON_MAIL_DRY_RUN) : rien ne part" : ""}
            </p>
            {summary.episodes.length ? (
              <fieldset disabled={step === "sending" || step === "confirm"}>
                <legend>Épisode à annoncer</legend>
                <select
                  className="studio-subscribers-select"
                  value={slug}
                  onChange={(e) => {
                    const next = summary.episodes.find((x) => x.slug === e.target.value);
                    setSlug(e.target.value);
                    if (next) setTexts(prefill(next.titles));
                    setStep("edit");
                    setResult(null);
                  }}
                >
                  {summary.episodes.map((e) => (
                    <option key={e.slug} value={e.slug}>
                      {e.label} · {e.titles.fr}
                      {e.announced_at ? ` (annoncé le ${formatDate(e.announced_at)})` : ""}
                    </option>
                  ))}
                </select>
                <div className="studio-langswitch mt-2" role="group" aria-label="Langue de l'annonce">
                  {LANGUAGES.map(({ id, label }) => (
                    <button key={id} type="button" className={`webtoon-mini ${language === id ? "is-active" : ""}`} onClick={() => setLanguage(id)} title={`${byLocale[id] ?? 0} abonné(s) dans cette langue`}>
                      {label} {byLocale[id] ? `(${byLocale[id]})` : ""}
                    </button>
                  ))}
                </div>
                {texts ? (
                  <div className="mt-2 grid gap-2">
                    <label className="studio-subscribers-field">
                      Objet
                      <input type="text" value={texts[language].subject} maxLength={200} onChange={(e) => edit("subject", e.target.value)} />
                    </label>
                    <label className="studio-subscribers-field">
                      Texte (le lien de l&apos;épisode et le lien de désinscription sont ajoutés dessous)
                      <textarea rows={3} value={texts[language].text} maxLength={2000} onChange={(e) => edit("text", e.target.value)} />
                    </label>
                  </div>
                ) : null}
              </fieldset>
            ) : (
              <p className="text-sm text-ivory/70">Aucun épisode publié dans la série.</p>
            )}
            {episode?.announced_at ? (
              <p className="text-xs text-amber-300">
                Déjà annoncé le {formatDate(episode.announced_at)} à {episode.announced_count} abonné(s) : un nouvel envoi leur arrivera une deuxième fois.
              </p>
            ) : null}
            {missing.length ? <p className="text-xs text-amber-300">Objet ou texte vide en {missing.map((m) => m.label).join(", ")}.</p> : null}
            {step === "confirm" && episode ? (
              <div className="studio-conflict" role="alertdialog" aria-label="Confirmer l'envoi">
                <p>
                  Envoyer l&apos;annonce de <b>{episode.label} · {episode.titles.fr}</b> à <b>{count}</b> abonné{count === 1 ? "" : "s"} confirmé{count === 1 ? "" : "s"}, chacun dans sa langue avec son lien de désinscription ?
                  {summary.dry_run ? " Essai à blanc : rien ne partira." : " Un e-mail envoyé ne se rattrape pas."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="webtoon-mini studio-primary" onClick={() => void send()}>Oui, envoyer maintenant</button>
                  <button type="button" className="webtoon-mini" onClick={() => setStep("edit")}>Annuler</button>
                </div>
              </div>
            ) : null}
            {step === "sending" ? <p className="text-sm text-ivory/70">Envoi en cours…</p> : null}
            {result ? <p className="text-sm">{result}</p> : null}
          </>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {summary?.configured && episode && step === "edit" ? (
            <button type="button" className="webtoon-mini studio-primary" disabled={!count || missing.length > 0} onClick={() => setStep("confirm")}>
              Envoyer à {count} abonné{count === 1 ? "" : "s"}…
            </button>
          ) : null}
          <button type="button" className="webtoon-mini" onClick={() => dialog.current?.close()} disabled={step === "sending"}>Fermer</button>
        </div>
      </div>
    </dialog>
  );
}
