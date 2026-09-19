/**
 * Procedural parallax backdrops, one per theme. Everything is drawn with
 * plain canvas primitives so no image assets are needed.
 */
import { VIEW_H, VIEW_W } from "./types";

export type BackgroundTheme = "forest" | "chains" | "castle" | "white" | "title";

/** Deterministic pseudo-random for stable scenery. */
function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  theme: BackgroundTheme,
  camX: number,
  time: number,
) {
  switch (theme) {
    case "forest":
      drawForest(ctx, camX, time);
      break;
    case "chains":
      drawChains(ctx, camX, time);
      break;
    case "castle":
      drawCastle(ctx, camX, time);
      break;
    case "white":
      drawWhite(ctx, camX, time);
      break;
    case "title":
      drawForest(ctx, time * 0.3, time);
      break;
    default:
      break;
  }
}

function gradient(ctx: CanvasRenderingContext2D, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawForest(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  gradient(ctx, [
    [0, "#03101f"],
    [0.6, "#082a4a"],
    [1, "#041a30"],
  ]);

  // Far trunks.
  const far = camX * 0.25;
  ctx.fillStyle = "#061d33";
  for (let i = -1; i < 12; i += 1) {
    const idx = Math.floor(far / 40) + i;
    const x = idx * 40 - (far % 40) + rnd(idx) * 12;
    const wdt = 6 + rnd(idx + 7) * 10;
    ctx.fillRect(x, 0, wdt, VIEW_H);
  }
  // Blue glow spots on trunks.
  for (let i = -1; i < 12; i += 1) {
    const idx = Math.floor(far / 40) + i;
    const x = idx * 40 - (far % 40) + rnd(idx) * 12 + 2;
    const glow = 0.4 + 0.3 * Math.sin(time / 30 + idx);
    ctx.fillStyle = `rgba(88, 199, 245, ${glow * 0.35})`;
    ctx.fillRect(x, 30 + rnd(idx + 3) * 100, 2, 6);
  }

  // Mid trunks.
  const mid = camX * 0.5;
  ctx.fillStyle = "#0a2340";
  for (let i = -1; i < 8; i += 1) {
    const idx = Math.floor(mid / 64) + i;
    const x = idx * 64 - (mid % 64) + rnd(idx + 50) * 20;
    const wdt = 10 + rnd(idx + 9) * 12;
    ctx.fillRect(x, 0, wdt, VIEW_H);
    // roots
    ctx.fillRect(x - 4, VIEW_H - 40, wdt + 8, 6);
  }

  // Glowing mushrooms on the mid layer.
  for (let i = -1; i < 12; i += 1) {
    const idx = Math.floor(mid / 32) + i;
    const x = idx * 32 - (mid % 32) + rnd(idx + 100) * 20;
    const y = VIEW_H - 38 - rnd(idx + 200) * 60;
    const r = 3 + rnd(idx + 300) * 4;
    const pulse = 0.5 + 0.5 * Math.sin(time / 20 + idx * 1.7);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, `rgba(125, 223, 255, ${0.35 + pulse * 0.25})`);
    g.addColorStop(1, "rgba(125, 223, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    ctx.fillStyle = "#5fc4ff";
    ctx.fillRect(x - r, y - 1, r * 2, 2);
    ctx.fillStyle = "#9ee8ff";
    ctx.fillRect(x - r + 1, y - 2, r * 2 - 2, 1);
    ctx.fillStyle = "#b8c6d0";
    ctx.fillRect(x - 1, y + 1, 2, 4);
  }

  // Drifting spores.
  ctx.fillStyle = "rgba(185, 243, 255, 0.6)";
  for (let i = 0; i < 24; i += 1) {
    const x = ((rnd(i) * 800 + time * (0.1 + rnd(i + 1) * 0.2) - camX * 0.7) % (VIEW_W + 40)) - 20;
    const y = (rnd(i + 2) * VIEW_H + Math.sin(time / 40 + i) * 6) % VIEW_H;
    ctx.fillRect(Math.floor(((x % (VIEW_W + 40)) + VIEW_W + 40) % (VIEW_W + 40)) - 20, Math.floor(y), 1, 1);
  }
}

function drawChains(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  gradient(ctx, [
    [0, "#020610"],
    [0.5, "#061428"],
    [1, "#030a18"],
  ]);

  // Blue lights (the wall of small lights).
  const far = camX * 0.15;
  for (let i = 0; i < 90; i += 1) {
    const x = ((rnd(i) * 1200 - far) % 1200 + 1200) % 1200 - 400;
    if (x < -2 || x > VIEW_W + 2) continue;
    const y = rnd(i + 500) * 150;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(time / 25 + i));
    ctx.fillStyle = `rgba(120, 200, 255, ${tw * 0.8})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1 + (i % 3 === 0 ? 1 : 0), 1 + (i % 3 === 0 ? 1 : 0));
  }

  // Giant rusted chains crossing the scene.
  const mid = camX * 0.45;
  for (let c = 0; c < 3; c += 1) {
    const offset = c * 220;
    const startX = -((mid + offset) % 660) + 660 - 300;
    const dir = c % 2 === 0 ? 1 : -1;
    for (let k = 0; k < 40; k += 1) {
      const x = startX + k * 14 * dir;
      const y = 20 + c * 40 + k * 4;
      if (x < -20 || x > VIEW_W + 20 || y > VIEW_H + 20) continue;
      ctx.fillStyle = k % 2 === 0 ? "#6f4526" : "#8a5a34";
      ctx.fillRect(x, y, 12, 6);
      ctx.fillStyle = "#3a2314";
      ctx.fillRect(x + 3, y + 2, 6, 2);
      if (k % 5 === 0) {
        ctx.fillStyle = "#7c9a4a";
        ctx.fillRect(x + 4, y + 6, 1, 3 + (k % 3));
      }
    }
  }

  // Hanging vertical chains near the camera.
  const near = camX * 0.7;
  for (let i = -1; i < 6; i += 1) {
    const idx = Math.floor(near / 90) + i;
    const x = idx * 90 - (near % 90) + rnd(idx + 40) * 30;
    const len = 40 + rnd(idx + 41) * 120;
    for (let y = 0; y < len; y += 6) {
      ctx.fillStyle = (y / 6) % 2 === 0 ? "#5a3a20" : "#3a2314";
      ctx.fillRect(x, y, 3, 5);
    }
  }
}

function drawCastle(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  gradient(ctx, [
    [0, "#0a0508"],
    [0.55, "#1a0f16"],
    [1, "#2b1218"],
  ]);

  // Arches, slightly tilted (the leaning castle).
  const far = camX * 0.3;
  for (let i = -1; i < 8; i += 1) {
    const idx = Math.floor(far / 56) + i;
    const x = idx * 56 - (far % 56);
    ctx.save();
    ctx.translate(x + 20, VIEW_H);
    ctx.rotate(-0.05);
    ctx.fillStyle = "#2a1e2c";
    ctx.fillRect(-20, -150, 40, 150);
    ctx.fillStyle = "#120b14";
    ctx.fillRect(-12, -128, 24, 128);
    ctx.beginPath();
    ctx.arc(0, -128, 12, Math.PI, 0);
    ctx.fill();
    ctx.restore();
    // Candle in the arch.
    const flick = 0.6 + 0.4 * Math.sin(time / 5 + idx * 2.3);
    const cx = x + 20;
    const cy = VIEW_H - 60 - rnd(idx + 9) * 40;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
    g.addColorStop(0, `rgba(255, 170, 60, ${0.35 * flick})`);
    g.addColorStop(1, "rgba(255, 170, 60, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - 18, cy - 18, 36, 36);
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(cx - 1, cy - 2, 2, 2);
    ctx.fillStyle = "#e8e4d8";
    ctx.fillRect(cx - 1, cy, 2, 6);
  }

  // Root piercing the castle.
  const mid = camX * 0.5;
  ctx.fillStyle = "#1b1418";
  for (let i = -1; i < 4; i += 1) {
    const idx = Math.floor(mid / 200) + i;
    const x = idx * 200 - (mid % 200);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 26, 0);
    ctx.lineTo(x + 60, VIEW_H);
    ctx.lineTo(x + 40, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }

  // Forge glow from below.
  const g = ctx.createLinearGradient(0, VIEW_H - 60, 0, VIEW_H);
  g.addColorStop(0, "rgba(255, 120, 40, 0)");
  g.addColorStop(1, `rgba(255, 120, 40, ${0.18 + 0.05 * Math.sin(time / 9)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, VIEW_H - 60, VIEW_W, 60);
}

function drawWhite(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  gradient(ctx, [
    [0, "#f6f4ee"],
    [0.6, "#e6e2d8"],
    [1, "#d3cec2"],
  ]);
  // Bone arches of the white tunnel.
  const far = camX * 0.4;
  for (let i = -1; i < 10; i += 1) {
    const idx = Math.floor(far / 44) + i;
    const x = idx * 44 - (far % 44);
    ctx.strokeStyle = "rgba(170, 164, 152, 0.7)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.quadraticCurveTo(x + 22, -40, x + 44, VIEW_H);
    ctx.stroke();
  }
  // Floating lily petals.
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  for (let i = 0; i < 30; i += 1) {
    const x = (((rnd(i) * 640 - time * (0.2 + rnd(i + 1) * 0.3)) % 640) + 640) % 640 - 160;
    const y = (rnd(i + 2) * VIEW_H + Math.sin(time / 30 + i) * 8 + time * 0.1) % VIEW_H;
    ctx.fillRect(Math.floor(x), Math.floor(y), 2, 1);
  }
  // Pink light on the right (Rose).
  const g = ctx.createRadialGradient(VIEW_W - 40, VIEW_H / 2, 0, VIEW_W - 40, VIEW_H / 2, 160);
  g.addColorStop(0, "rgba(242, 167, 200, 0.45)");
  g.addColorStop(1, "rgba(242, 167, 200, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}
