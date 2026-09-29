"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";
import { SUBSCRIBE_PATH } from "@/lib/webtoon/alerts";

type Words = Dictionary["webtoon"]["alerts"];

/**
 * "Don't miss the next episode": an address and an explicit consent, sent to
 * the subscribe route, which answers with a confirmation email (double
 * opt-in). No third-party script, nothing stored in the browser. Rendered
 * only when the server can send email (see mailConfigured).
 */
export function EpisodeAlerts({ locale, words, privacyHref }: { locale: Locale; words: Words; privacyHref: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!consent) {
      setError(words.errorConsent);
      return;
    }
    setState("sending");
    setError(null);
    try {
      const response = await fetch(SUBSCRIBE_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, locale, consent, website }),
      });
      if (response.ok) {
        setState("done");
        return;
      }
      const { error: code } = (await response.json().catch(() => ({}))) as { error?: string };
      setError(code === "invalid_email" ? words.errorEmail : code === "consent_required" ? words.errorConsent : code === "too_many" ? words.errorTooMany : words.errorGeneric);
    } catch {
      setError(words.errorGeneric);
    }
    setState("idle");
  };

  return (
    <section className="webtoon-alerts" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="anime-heading font-display text-lg text-lily">{words.title}</h2>
      <p className="mt-1 text-sm text-ivory/75">{words.lead}</p>
      {state === "done" ? (
        <p className="webtoon-alerts-done" role="status">{words.success}</p>
      ) : (
        <form className="webtoon-alerts-form" onSubmit={(e) => void submit(e)} noValidate>
          <div className="webtoon-alerts-row">
            <label htmlFor={`${id}-email`} className="sr-only">{words.emailLabel}</label>
            <input
              id={`${id}-email`}
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={words.emailPlaceholder}
              disabled={state === "sending"}
            />
            <button type="submit" disabled={state === "sending" || !email.trim()}>
              {state === "sending" ? words.sending : words.submit}
            </button>
          </div>
          <label className="webtoon-alerts-consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={state === "sending"} required />
            <span>{words.consent}</span>
          </label>
          {/* Hidden from people; a bot that fills it is ignored by the server. */}
          <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="webtoon-alerts-trap" />
          {error ? <p className="webtoon-alerts-error" role="alert">{error}</p> : null}
          <p className="webtoon-alerts-privacy">
            {words.privacy}{" "}
            <Link href={privacyHref}>{words.privacyLink}</Link>
          </p>
        </form>
      )}
    </section>
  );
}
