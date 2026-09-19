"use client";

import { Press_Start_2P } from "next/font/google";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { GameScreen, InputName } from "@/lib/game/engine";
import { VIEW_H, VIEW_W } from "@/lib/game/types";

type Playable = {
  start: () => void;
  destroy: () => void;
  setInput: (name: InputName, down: boolean) => void;
  releaseAll: () => void;
  toggleMute: () => boolean;
  muted: boolean;
};

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const COARSE_QUERY = "(pointer: coarse)";

function subscribeCoarse(callback: () => void) {
  const mql = window.matchMedia(COARSE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getCoarse() {
  return window.matchMedia(COARSE_QUERY).matches;
}

const KEY_MAP: Record<string, InputName> = {
  ArrowLeft: "left",
  KeyA: "left",
  KeyQ: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  KeyZ: "jump",
  Space: "jump",
  ArrowDown: "down",
  KeyS: "down",
  KeyX: "throw",
  KeyK: "throw",
  Enter: "throw",
  KeyP: "pause",
  Escape: "pause",
  KeyM: "mute",
};

export function GameShell() {
  const { locale, dict } = useLocale();
  const copy = dict.game;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Playable | null>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [screen, setScreen] = useState<GameScreen>("title");
  const coarse = useSyncExternalStore(subscribeCoarse, getCoarse, () => false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let game: Playable | null = null;

    const boot = async () => {
      try {
        await document.fonts.load(`8px ${pixelFont.style.fontFamily}`);
      } catch {
        /* font fallback is fine */
      }
      const fullEngine = new URLSearchParams(window.location.search).get("engine") === "full";
      if (fullEngine) {
        const { Game: GameCtor } = await import("@/lib/game/engine");
        if (disposed) return;
        game = new GameCtor(canvas, {
          locale,
          font: `${pixelFont.style.fontFamily}, monospace`,
          onScreenChange: setScreen,
        });
      } else {
        const { Mockup } = await import("@/lib/game/mockup");
        const mock = new Mockup(canvas);
        await mock.load();
        if (disposed) return;
        game = mock;
        setScreen("play");
      }
      if (!game) return;
      gameRef.current = game;
      game.start();
      setReady(true);
    };
    void boot();

    const onKeyDown = (event: KeyboardEvent) => {
      const name = KEY_MAP[event.code];
      if (!name) return;
      event.preventDefault();
      if (event.repeat) return;
      gameRef.current?.setInput(name, true);
      if (name === "mute") setMuted(gameRef.current?.muted ?? false);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const name = KEY_MAP[event.code];
      if (!name) return;
      event.preventDefault();
      gameRef.current?.setInput(name, false);
    };
    const onBlur = () => gameRef.current?.releaseAll();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      disposed = true;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      game?.destroy();
      gameRef.current = null;
    };
  }, [locale]);

  const press = useCallback((name: InputName, down: boolean) => {
    gameRef.current?.setInput(name, down);
  }, []);

  const tapCanvas = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    game.setInput("any", true);
    window.setTimeout(() => game.setInput("any", false), 50);
  }, []);

  const toggleMute = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    setMuted(game.toggleMute());
  }, []);

  const fullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  }, []);

  const showTouch = coarse || screen === "title";

  return (
    <div ref={wrapperRef} className="game-shell">
      <div className="game-frame">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="game-canvas"
          role="img"
          aria-label={copy.headline}
          onPointerDown={tapCanvas}
          tabIndex={0}
        />
        {!ready ? (
          <div className="game-loading font-body text-sm text-cyan-pale/80" role="status">
            {copy.start}
          </div>
        ) : null}
      </div>

      <div className="game-toolbar">
        <button type="button" className="game-tool" onClick={toggleMute}>
          {muted ? copy.unmute : copy.mute}
        </button>
        <button type="button" className="game-tool" onClick={fullscreen}>
          {copy.fullscreen}
        </button>
      </div>

      {showTouch ? (
        <div className={`game-touch ${coarse ? "" : "game-touch-hidden"}`.trim()} aria-hidden={!coarse}>
          <div className="game-touch-group">
            <TouchButton label="◀" name="left" press={press} />
            <TouchButton label="▶" name="right" press={press} />
            <TouchButton label="▼" name="down" press={press} />
          </div>
          <div className="game-touch-group">
            <TouchButton label="✦" name="throw" press={press} wide />
            <TouchButton label="▲" name="jump" press={press} wide />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TouchButton({
  label,
  name,
  press,
  wide = false,
}: {
  label: string;
  name: InputName;
  press: (name: InputName, down: boolean) => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      className={`game-touch-btn ${wide ? "game-touch-btn-wide" : ""}`.trim()}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        press(name, true);
      }}
      onPointerUp={() => press(name, false)}
      onPointerCancel={() => press(name, false)}
      onPointerLeave={() => press(name, false)}
      onContextMenu={(event) => event.preventDefault()}
      aria-label={name}
    >
      {label}
    </button>
  );
}
