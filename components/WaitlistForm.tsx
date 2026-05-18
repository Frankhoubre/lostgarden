"use client";

import { useState, type FormEvent } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormStatus = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setFieldError("Email is required.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setFieldError("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      const db = getDb();
      const waitlistRef = collection(db, "waitlist");
      const existing = await getDocs(
        query(waitlistRef, where("email", "==", trimmed)),
      );

      if (existing.empty) {
        await addDoc(waitlistRef, {
          email: trimmed,
          createdAt: serverTimestamp(),
          source: "lost-garden-landing",
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : null,
          locale:
            typeof navigator !== "undefined" ? navigator.language : null,
        });
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-lg"
      noValidate
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <label htmlFor="waitlist-email" className="sr-only">
          Email address
        </label>
        <input
          id="waitlist-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(null);
            if (status === "error") setStatus("idle");
          }}
          placeholder="your@email.com"
          disabled={status === "loading" || status === "success"}
          className="glass-input min-h-12 flex-1 rounded-xl px-4 py-3 font-body text-base text-lily placeholder:text-lily/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/60 disabled:opacity-60"
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={
            fieldError
              ? "waitlist-email-error"
              : status === "success"
                ? "waitlist-success"
                : status === "error"
                  ? "waitlist-error"
                  : undefined
          }
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="btn-waitlist min-h-12 shrink-0 rounded-xl px-6 py-3 font-body text-sm font-medium tracking-wide text-deep transition focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/70 focus-visible:ring-offset-2 focus-visible:ring-offset-deep disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[11rem]"
        >
          {status === "loading" ? "Joining…" : "Join the waitlist"}
        </button>
      </div>

      {fieldError ? (
        <p
          id="waitlist-email-error"
          role="alert"
          className="mt-3 text-center text-sm text-red-300/90"
        >
          {fieldError}
        </p>
      ) : null}

      {status === "success" ? (
        <p
          id="waitlist-success"
          role="status"
          className="mt-4 text-center font-display text-lg tracking-wide text-magic"
        >
          You&apos;re on the list. The Garden will remember you.
        </p>
      ) : null}

      {status === "error" ? (
        <p
          id="waitlist-error"
          role="alert"
          className="mt-4 text-center text-sm text-red-300/90"
        >
          Something went wrong. Please try again.
        </p>
      ) : null}

      <p className="mt-6 text-center text-xs text-ivory/45">
        No spam. Only rare updates about Lost Garden.
      </p>
    </form>
  );
}
