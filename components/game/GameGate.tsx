"use client";

import { Press_Start_2P } from "next/font/google";
import { signOut } from "firebase/auth";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { GameShell } from "@/components/game/GameShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getFirebaseAuth } from "@/lib/firebase";
import { formatMessage } from "@/lib/i18n/format";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const subscribeNever = () => () => undefined;
const getDevBypass = () => process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("dev");

/** Spores drifting up through the login scene; fixed seeds so the markup is stable. */
const SPORES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  delay: ((i * 7) % 10) * -1.3,
  duration: 9 + (i % 5) * 2.2,
  size: i % 4 === 0 ? 3 : 2,
}));

export function GameGate() {
  const { user, loading } = useAuth();
  const { locale, dict } = useLocale();
  const copy = dict.game.gate;
  const [leaving, setLeaving] = useState(false);
  // Local playtests only: the dev server can skip the gate with ?dev=1.
  const devBypass = useSyncExternalStore(subscribeNever, getDevBypass, () => false);

  if (devBypass) return <GameShell />;

  if (loading) {
    return (
      <GateScene title={copy.title} eyebrow={copy.eyebrow} lead={copy.lead} pixel={locale === "fr" || locale === "en"}>
        <p className="game-gate-status" role="status">
          {copy.loading}
        </p>
      </GateScene>
    );
  }

  if (!user) {
    return (
      <GateScene title={copy.title} eyebrow={copy.eyebrow} lead={copy.lead} pixel={locale === "fr" || locale === "en"}>
        <AuthForm onSuccess={() => undefined} />
        <p className="game-gate-hint">{copy.hint}</p>
      </GateScene>
    );
  }

  const name = user.displayName ?? user.email?.split("@")[0] ?? dict.common.traveler;

  async function leave() {
    setLeaving(true);
    try {
      await signOut(getFirebaseAuth());
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="game-gate-open">
      <div className="game-welcome">
        <p className="font-body text-sm text-ivory/85">{formatMessage(copy.welcome, { name })}</p>
        <button type="button" className="game-tool" onClick={leave} disabled={leaving}>
          {leaving ? dict.auth.signingOut : dict.auth.signOut}
        </button>
      </div>
      <GameShell />
    </div>
  );
}

function GateScene({
  title,
  eyebrow,
  lead,
  pixel,
  children,
}: {
  title: string;
  eyebrow: string;
  lead: string;
  pixel: boolean;
  children: ReactNode;
}) {
  return (
    <div className="game-gate">
      <div className="game-gate-scene" aria-hidden="true">
        <div className="game-gate-bg" />
        <div className="game-gate-shafts" />
        <div className="game-gate-ground" />
        {SPORES.map((sp, i) => (
          <span
            key={i}
            className="game-gate-spore"
            style={{
              left: `${sp.left}%`,
              animationDelay: `${sp.delay}s`,
              animationDuration: `${sp.duration}s`,
              width: sp.size,
              height: sp.size,
            }}
          />
        ))}
        <div className="game-gate-glow" />
        <div className="game-gate-lanterne" />
        <div className="game-gate-fog" />
        <div className="game-gate-vignette" />
        <div className="game-gate-caption">
          <p className="game-gate-eyebrow">{eyebrow}</p>
          <h2 className={`game-gate-title ${pixel ? pixelFont.className : "font-display"}`}>{title}</h2>
        </div>
      </div>
      <div className="game-gate-panel">
        <p className="game-gate-lead">{lead}</p>
        {children}
      </div>
    </div>
  );
}
