"use client";

import { signOut } from "firebase/auth";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { getFirebaseAuth } from "@/lib/firebase";
import { isStudioUser } from "@/lib/webtoon/studio";

const subscribeNever = () => () => undefined;
const getDevBypass = () =>
  process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("dev");

/**
 * The door of the private studio: a Google sign-in, then an allowlist check.
 * Anyone else sees a closed door and a way to switch account. Local work can
 * skip the door with ?dev=1 on the dev server, like the game gate.
 */
export function StudioGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const devBypass = useSyncExternalStore(subscribeNever, getDevBypass, () => false);

  if (devBypass) return <>{children}</>;

  if (loading) {
    return (
      <StudioDoor>
        <p className="studio-door-status" role="status">Vérification de l&apos;accès…</p>
      </StudioDoor>
    );
  }

  if (!user) {
    return (
      <StudioDoor>
        <p className="studio-door-lead">Espace privé. Connecte-toi avec le compte Google autorisé.</p>
        <AuthForm onSuccess={() => undefined} />
      </StudioDoor>
    );
  }

  if (!isStudioUser(user.email)) {
    return (
      <StudioDoor>
        <p className="studio-door-lead">
          Le compte <strong>{user.email}</strong> n&apos;a pas accès au studio.
        </p>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signOut(getFirebaseAuth());
            } finally {
              setBusy(false);
            }
          }}
        >
          Changer de compte
        </button>
      </StudioDoor>
    );
  }

  return <>{children}</>;
}

function StudioDoor({ children }: { children: ReactNode }) {
  return (
    <div className="studio-door">
      <div className="studio-door-card">
        <p className="anime-label text-xs text-cyan-pale">Lost Garden · Studio webtoon</p>
        <h1 className="anime-heading mt-2 font-display text-2xl text-lily">Convertir la vidéo en webtoon</h1>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}
