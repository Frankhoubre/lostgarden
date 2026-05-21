"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthField } from "@/components/auth/AuthField";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { isNewFirebaseUser } from "@/lib/firebase-user";
import { getFirebaseAuth } from "@/lib/firebase";
import { syncUserProfile } from "@/lib/sync-user-profile";

type AuthMode = "signin" | "signup";

type AuthFormProps = {
  redirectTo?: string;
  onSuccess?: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthForm({
  redirectTo = "/experience",
  onSuccess,
}: AuthFormProps) {
  const { dict } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function clearMessages() {
    setError(null);
    setInfo(null);
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    clearMessages();
  }

  async function afterAuth(justJoined = false) {
    if (onSuccess) {
      onSuccess();
      return;
    }
    const [path, query] = redirectTo.split("?");
    const next = justJoined
      ? `${path}?joined=1${query ? `&${query}` : ""}`
      : redirectTo;
    router.push(next);
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError(dict.auth.validation.invalidEmail);
      return;
    }
    if (password.length < 8) {
      setError(dict.auth.validation.passwordMin);
      return;
    }
    if (mode === "signup" && !displayName.trim()) {
      setError(dict.auth.validation.nameRequired);
      return;
    }

    setLoading(true);
    const justJoined = mode === "signup";
    try {
      const auth = getFirebaseAuth();
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          password,
        );
        await updateProfile(credential.user, {
          displayName: displayName.trim(),
        });
        await syncUserProfile(credential.user);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
      await afterAuth(justJoined);
    } catch (err) {
      setError(getAuthErrorMessage(err, dict.auth.errors));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    clearMessages();
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user);
      await afterAuth(isNewFirebaseUser(result.user));
    } catch (err) {
      setError(getAuthErrorMessage(err, dict.auth.errors));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    clearMessages();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError(dict.auth.validation.resetEmailHint);
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), trimmedEmail);
      setInfo(dict.auth.resetSent);
    } catch (err) {
      setError(getAuthErrorMessage(err, dict.auth.errors));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card glass-card mx-auto w-full max-w-md p-6 sm:p-8">
      <div
        className="auth-tabs flex rounded-lg border border-glow/15 bg-cavern/40 p-1"
        role="tablist"
        aria-label={dict.auth.tabsAria}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`auth-tab flex-1 rounded-md py-2 font-body text-sm tracking-wide transition ${mode === "signin" ? "auth-tab--active" : ""}`}
          onClick={() => switchMode("signin")}
          disabled={loading}
        >
          {dict.auth.signIn}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`auth-tab flex-1 rounded-md py-2 font-body text-sm tracking-wide transition ${mode === "signup" ? "auth-tab--active" : ""}`}
          onClick={() => switchMode("signup")}
          disabled={loading}
        >
          {dict.auth.createAccount}
        </button>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="btn-google mt-6 flex w-full min-h-12 items-center justify-center gap-3 rounded-xl px-4 py-3 font-body text-sm font-medium tracking-wide text-lily transition disabled:opacity-60"
      >
        <GoogleIcon />
        {dict.auth.continueGoogle}
      </button>

      <div className="auth-divider my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-glow/15" aria-hidden="true" />
        <span className="font-body text-xs tracking-wide text-ivory/40">{dict.common.or}</span>
        <span className="h-px flex-1 bg-glow/15" aria-hidden="true" />
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
        {mode === "signup" ? (
          <AuthField
            id="auth-name"
            label={dict.auth.nameLabel}
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={setDisplayName}
            disabled={loading}
            placeholder={dict.auth.namePlaceholder}
          />
        ) : null}

        <AuthField
          id="auth-email"
          label={dict.auth.emailLabel}
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          disabled={loading}
          placeholder={dict.auth.emailPlaceholder}
        />

        <AuthField
          id="auth-password"
          label={dict.auth.passwordLabel}
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={setPassword}
          disabled={loading}
          placeholder={dict.auth.passwordPlaceholder}
        />

        {mode === "signin" ? (
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
            className="font-body text-xs text-cyan-pale/55 underline-offset-2 transition hover:text-magic hover:underline"
          >
            {dict.auth.forgotPassword}
          </button>
        ) : null}

        <button type="submit" disabled={loading} className="btn-primary w-full min-h-12">
          {loading
            ? dict.common.pleaseWait
            : mode === "signup"
              ? dict.auth.signupSubmit
              : dict.auth.signIn}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-red-300/90">
          {error}
        </p>
      ) : null}

      {info ? (
        <p role="status" className="mt-4 text-center text-sm text-magic">
          {info}
        </p>
      ) : null}

      <p className="mt-6 text-center text-xs leading-relaxed text-ivory/40">
        {dict.auth.consent}
      </p>
    </div>
  );
}
