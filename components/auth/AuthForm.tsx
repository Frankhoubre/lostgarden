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
import { getAuthErrorMessage } from "@/lib/auth-errors";
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

  async function afterAuth() {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(redirectTo);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "signup" && !displayName.trim()) {
      setError("Please enter a name.");
      return;
    }

    setLoading(true);
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
      await afterAuth();
    } catch (err) {
      setError(getAuthErrorMessage(err));
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
      await afterAuth();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    clearMessages();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Enter your email above, then request a reset link.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), trimmedEmail);
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card glass-card mx-auto w-full max-w-md p-6 sm:p-8">
      <div
        className="auth-tabs flex rounded-lg border border-glow/15 bg-cavern/40 p-1"
        role="tablist"
        aria-label="Authentication mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`auth-tab flex-1 rounded-md py-2 font-body text-sm tracking-wide transition ${mode === "signin" ? "auth-tab--active" : ""}`}
          onClick={() => switchMode("signin")}
          disabled={loading}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`auth-tab flex-1 rounded-md py-2 font-body text-sm tracking-wide transition ${mode === "signup" ? "auth-tab--active" : ""}`}
          onClick={() => switchMode("signup")}
          disabled={loading}
        >
          Create account
        </button>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="btn-google mt-6 flex w-full min-h-12 items-center justify-center gap-3 rounded-xl px-4 py-3 font-body text-sm font-medium tracking-wide text-lily transition disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="auth-divider my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-glow/15" aria-hidden="true" />
        <span className="font-body text-xs tracking-wide text-ivory/40">or</span>
        <span className="h-px flex-1 bg-glow/15" aria-hidden="true" />
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
        {mode === "signup" ? (
          <AuthField
            id="auth-name"
            label="Name"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={setDisplayName}
            disabled={loading}
            placeholder="Your name"
          />
        ) : null}

        <AuthField
          id="auth-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          disabled={loading}
          placeholder="you@email.com"
        />

        <AuthField
          id="auth-password"
          label="Password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={setPassword}
          disabled={loading}
          placeholder="At least 8 characters"
        />

        {mode === "signin" ? (
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
            className="font-body text-xs text-cyan-pale/55 underline-offset-2 transition hover:text-magic hover:underline"
          >
            Forgot password?
          </button>
        ) : null}

        <button type="submit" disabled={loading} className="btn-primary w-full min-h-12">
          {loading
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
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
        By continuing, you agree to receive updates about Lost Garden. No spam.
      </p>
    </div>
  );
}
