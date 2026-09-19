/**
 * Layered parallax backdrops and foreground overlays, one set per theme.
 * Everything is drawn with canvas primitives; no image assets.
 */
import { VIEW_H, VIEW_W } from "./types";

export type BackgroundTheme = "forest" | "chains" | "castle" | "white" | "title";

/** Deterministic pseudo-random for stable scenery. */
export function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function gradient(ctx: CanvasRenderingContext2D, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function radial(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, inner: string, outer: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Soft horizontal fog bands drifting slowly. */
function fog(ctx: CanvasRenderingContext2D, camX: number, time: number, color: string, baseY: number, strength: number) {
  for (let i = 0; i < 3; i += 1) {
    const y = baseY + i * 14 + Math.sin(time / 90 + i) * 4;
    const g = ctx.createLinearGradient(0, y - 18, 0, y + 18);
    g.addColorStop(0, `rgba(${color}, 0)`);
    g.addColorStop(0.5, `rgba(${color}, ${strength * (0.6 + 0.4 * Math.sin(time / 70 + i * 2))})`);
    g.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = g;
    const shift = ((camX * (0.2 + i * 0.1) + time * (0.15 + i * 0.05)) % 160);
    for (let x = -160 - shift; x < VIEW_W + 160; x += 160) {
      const w = 120 + rnd(i * 7 + Math.floor((x + shift) / 160)) * 80;
      ctx.fillRect(x, y - 18, w, 36);
    }
  }
}

export function drawBackground(ctx: CanvasRenderingContext2D, theme: BackgroundTheme, camX: number, time: number) {
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
      drawForest(ctx, time * 0.4, time);
      break;
    default:
      break;
  }
}

/** Foreground silhouettes drawn after the actors, parallax faster than the world. */
export function drawForeground(ctx: CanvasRenderingContext2D, theme: BackgroundTheme, camX: number, time: number) {
  switch (theme) {
    case "forest":
    case "title":
      foregroundForest(ctx, camX, time);
      break;
    case "chains":
      foregroundChains(ctx, camX, time);
      break;
    case "castle":
      foregroundCastle(ctx, camX, time);
      break;
    default:
      break;
  }
}

/* ------------------------------------------------------------------ */
/* Forest of blue mushrooms                                             */
/* ------------------------------------------------------------------ */

function trunk(ctx: CanvasRenderingContext2D, x: number, w: number, color: string, rootColor: string, seed: number) {
  ctx.fillStyle = color;
  ctx.fillRect(x, 0, w, VIEW_H);
  // Bark ridges.
  for (let y = 10 + rnd(seed) * 20; y < VIEW_H; y += 22 + rnd(seed + y) * 14) {
    ctx.fillRect(x + w * 0.3, y, 1, 6 + rnd(seed + y * 3) * 8);
  }
  // Roots flaring at the bottom.
  ctx.fillStyle = rootColor;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.8, VIEW_H - 40);
  ctx.lineTo(x, VIEW_H - 70);
  ctx.lineTo(x + w, VIEW_H - 70);
  ctx.lineTo(x + w * 1.8, VIEW_H - 40);
  ctx.closePath();
  ctx.fill();
}

function drawForest(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  gradient(ctx, [
    [0, "#02070f"],
    [0.45, "#061a33"],
    [0.8, "#0a2a4a"],
    [1, "#061a30"],
  ]);

  // Cave ceiling and far stalactites.
  const far = camX * 0.15;
  ctx.fillStyle = "#040e1c";
  for (let i = -1; i < 14; i += 1) {
    const idx = Math.floor(far / 40) + i;
    const x = idx * 40 - (far % 40);
    const h = 16 + rnd(idx + 900) * 34;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 40, 0);
    ctx.lineTo(x + 20 + rnd(idx) * 10, h);
    ctx.closePath();
    ctx.fill();
  }

  // Far trunks.
  for (let i = -1; i < 14; i += 1) {
    const idx = Math.floor(far / 44) + i;
    const x = idx * 44 - (far % 44) + rnd(idx) * 14;
    trunk(ctx, x, 8 + rnd(idx + 7) * 12, "#071c33", "#071c33", idx);
  }

  // Mid trunks with faint blue moss lights.
  const mid = camX * 0.4;
  for (let i = -1; i < 9; i += 1) {
    const idx = Math.floor(mid / 72) + i;
    const x = idx * 72 - (mid % 72) + rnd(idx + 50) * 24;
    const w = 14 + rnd(idx + 9) * 16;
    trunk(ctx, x, w, "#0b2542", "#0a2038", idx + 100);
    const glow = 0.4 + 0.3 * Math.sin(time / 30 + idx);
    ctx.fillStyle = `rgba(120, 210, 255, ${glow * 0.5})`;
    ctx.fillRect(x + 2, 40 + rnd(idx + 3) * 120, 2, 8);
    ctx.fillRect(x + w - 4, 90 + rnd(idx + 4) * 100, 2, 5);
  }

  // Glowing mushrooms in the mid layer.
  const near = camX * 0.6;
  for (let i = -1; i < 18; i += 1) {
    const idx = Math.floor(near / 30) + i;
    const x = idx * 30 - (near % 30) + rnd(idx + 100) * 24;
    const y = VIEW_H - 56 - rnd(idx + 200) * 90;
    const r = 4 + rnd(idx + 300) * 7;
    const pulse = 0.5 + 0.5 * Math.sin(time / 20 + idx * 1.7);
    radial(ctx, x, y, r * 5, `rgba(125, 223, 255, ${0.25 + pulse * 0.2})`, "rgba(125, 223, 255, 0)");
    ctx.fillStyle = "#3fa9e8";
    ctx.fillRect(x - r, y - 2, r * 2, 3);
    ctx.fillStyle = "#8fe3ff";
    ctx.fillRect(x - r + 2, y - 3, r * 2 - 4, 1);
    ctx.fillStyle = "#b8c6d0";
    ctx.fillRect(x - 1, y + 1, 3, 4 + r);
  }

  fog(ctx, camX, time, "88, 160, 220", VIEW_H - 70, 0.12);

  // Drifting spores.
  for (let i = 0; i < 40; i += 1) {
    const x = ((rnd(i) * 1200 + time * (0.12 + rnd(i + 1) * 0.25) - camX * 0.8) % (VIEW_W + 60) + VIEW_W + 60) % (VIEW_W + 60) - 30;
    const y = (rnd(i + 2) * VIEW_H + Math.sin(time / 40 + i) * 8 + time * 0.05 * rnd(i + 3)) % VIEW_H;
    const a = 0.3 + 0.5 * Math.abs(Math.sin(time / 25 + i));
    ctx.fillStyle = `rgba(185, 243, 255, ${a})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
}

function foregroundForest(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  const fg = camX * 1.35;
  ctx.globalAlpha = 0.85;
  for (let i = -1; i < 5; i += 1) {
    const idx = Math.floor(fg / 260) + i;
    const x = idx * 260 - (fg % 260) + rnd(idx + 600) * 80;
    const kind = rnd(idx + 601);
    if (kind < 0.5) {
      // Big mushroom cap silhouette in the foreground, bottom of the screen.
      const w = 70 + rnd(idx + 602) * 60;
      ctx.fillStyle = "#03101f";
      ctx.beginPath();
      ctx.ellipse(x, VIEW_H + 4, w / 2, 26, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x - 6, VIEW_H - 8, 12, 12);
      ctx.fillStyle = "rgba(63, 169, 232, 0.35)";
      ctx.fillRect(x - w / 2 + 8, VIEW_H - 18, w - 16, 2);
    } else {
      // Hanging roots from the ceiling.
      ctx.fillStyle = "#03101f";
      const len = 40 + rnd(idx + 603) * 70;
      ctx.beginPath();
      ctx.moveTo(x - 6, 0);
      ctx.lineTo(x + 6, 0);
      ctx.lineTo(x + 1 + Math.sin(time / 60 + idx) * 3, len);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* World of chains                                                      */
/* ------------------------------------------------------------------ */

function chainLink(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, light: string, dark: string) {
  ctx.fillStyle = dark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = light;
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
  ctx.fillStyle = "#0a0d16";
  ctx.fillRect(x + Math.floor(w * 0.3), y + Math.floor(h * 0.3), Math.ceil(w * 0.4), Math.ceil(h * 0.4));
}

function drawChains(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  gradient(ctx, [
    [0, "#01030a"],
    [0.5, "#04101f"],
    [1, "#020814"],
  ]);

  // Wall of small blue lights, very far.
  const far = camX * 0.1;
  for (let i = 0; i < 160; i += 1) {
    const x = ((rnd(i) * 1600 - far) % 1600 + 1600) % 1600 - 560;
    if (x < -2 || x > VIEW_W + 2) continue;
    const y = rnd(i + 500) * 220;
    const tw = 0.3 + 0.7 * Math.abs(Math.sin(time / 25 + i));
    const big = i % 7 === 0;
    if (big) radial(ctx, x, y, 8, `rgba(120, 200, 255, ${tw * 0.35})`, "rgba(120, 200, 255, 0)");
    ctx.fillStyle = `rgba(150, 215, 255, ${tw * 0.9})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), big ? 2 : 1, big ? 2 : 1);
  }

  // Giant rusted chains crossing the scene diagonally.
  const mid = camX * 0.4;
  for (let c = 0; c < 4; c += 1) {
    const period = 700;
    const startX = -((mid + c * 190) % period) + period - 360;
    const dir = c % 2 === 0 ? 1 : -1;
    const y0 = 10 + c * 46;
    for (let k = 0; k < 60; k += 1) {
      const x = startX + k * 18 * dir;
      const y = y0 + k * 3.2;
      if (x < -30 || x > VIEW_W + 30 || y > VIEW_H + 20) continue;
      const vertical = k % 2 === 1;
      if (vertical) chainLink(ctx, x + 5, y - 2, 8, 12, "#7a4e2c", "#4a2f1a");
      else chainLink(ctx, x, y, 18, 8, "#8a5a34", "#5a3820");
      if (k % 6 === 0) {
        ctx.fillStyle = "#6f8f3c";
        ctx.fillRect(x + 6, y + 8, 2, 4 + (k % 3) * 3);
      }
    }
  }

  // Hanging vertical chains nearer the camera.
  const near = camX * 0.7;
  for (let i = -1; i < 8; i += 1) {
    const idx = Math.floor(near / 110) + i;
    const x = idx * 110 - (near % 110) + rnd(idx + 40) * 40;
    const len = 60 + rnd(idx + 41) * 160;
    const sway = Math.sin(time / 80 + idx) * 2;
    for (let y = 0; y < len; y += 9) {
      const vertical = (y / 9) % 2 === 0;
      if (vertical) chainLink(ctx, x + sway * (y / len), y, 5, 10, "#5a3a20", "#2e1c10");
      else chainLink(ctx, x - 1 + sway * (y / len), y + 1, 7, 7, "#5a3a20", "#2e1c10");
    }
    ctx.fillStyle = "#3a2314";
    ctx.fillRect(x - 3 + sway, len, 11, 4);
  }

  fog(ctx, camX, time, "60, 110, 170", VIEW_H - 60, 0.14);

  // Falling rust flakes.
  for (let i = 0; i < 20; i += 1) {
    const x = ((rnd(i + 70) * 900 - camX * 0.9) % (VIEW_W + 40) + VIEW_W + 40) % (VIEW_W + 40) - 20;
    const y = (rnd(i + 71) * VIEW_H + time * (0.3 + rnd(i + 72) * 0.4)) % VIEW_H;
    ctx.fillStyle = "rgba(160, 100, 50, 0.6)";
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 2);
  }
}

function foregroundChains(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  const fg = camX * 1.4;
  ctx.globalAlpha = 0.9;
  for (let i = -1; i < 4; i += 1) {
    const idx = Math.floor(fg / 320) + i;
    const x = idx * 320 - (fg % 320) + rnd(idx + 700) * 120;
    const sway = Math.sin(time / 70 + idx) * 3;
    // Thick chain in the foreground.
    for (let y = -10; y < VIEW_H + 10; y += 22) {
      const vertical = ((y + 10) / 22) % 2 === 0;
      if (vertical) chainLink(ctx, x + sway, y, 12, 24, "#1a1410", "#0a0806");
      else chainLink(ctx, x - 3 + sway, y + 2, 18, 18, "#1a1410", "#0a0806");
    }
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* The leaning castle                                                   */
/* ------------------------------------------------------------------ */

function drawCastle(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  gradient(ctx, [
    [0, "#08040a"],
    [0.5, "#1a0f18"],
    [0.85, "#2c1419"],
    [1, "#3a1a1c"],
  ]);

  // Stained glass window, far.
  const far = camX * 0.2;
  for (let i = -1; i < 4; i += 1) {
    const idx = Math.floor(far / 300) + i;
    const x = idx * 300 - (far % 300) + 120;
    const y = 40;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.06);
    ctx.fillStyle = "#1e1224";
    ctx.fillRect(-26, -6, 52, 110);
    const colors = ["#3b6ea8", "#7a2f38", "#b58a3a", "#3f7f6a"];
    for (let cy = 0; cy < 5; cy += 1) {
      for (let cx = 0; cx < 3; cx += 1) {
        ctx.fillStyle = colors[(cx + cy + idx) % colors.length];
        ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time / 50 + cx + cy);
        ctx.fillRect(-22 + cx * 15, 0 + cy * 20, 13, 18);
      }
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.fillStyle = "#1e1224";
    ctx.arc(0, -6, 26, Math.PI, 0);
    ctx.fill();
    ctx.restore();
  }

  // Tilted arches with candles.
  const mid = camX * 0.35;
  for (let i = -1; i < 9; i += 1) {
    const idx = Math.floor(mid / 66) + i;
    const x = idx * 66 - (mid % 66);
    ctx.save();
    ctx.translate(x + 24, VIEW_H);
    ctx.rotate(-0.05);
    ctx.fillStyle = "#2a1d2c";
    ctx.fillRect(-24, -230, 48, 230);
    ctx.fillStyle = "#3a2a3c";
    ctx.fillRect(-24, -230, 3, 230);
    ctx.fillStyle = "#100a14";
    ctx.fillRect(-15, -190, 30, 190);
    ctx.beginPath();
    ctx.arc(0, -190, 15, Math.PI, 0);
    ctx.fill();
    ctx.restore();
    const flick = 0.6 + 0.4 * Math.sin(time / 5 + idx * 2.3);
    const cx = x + 24;
    const cy = VIEW_H - 90 - rnd(idx + 9) * 60;
    radial(ctx, cx, cy, 26, `rgba(255, 170, 60, ${0.35 * flick})`, "rgba(255, 170, 60, 0)");
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(cx - 1, cy - 3, 2, 3);
    ctx.fillStyle = "#fff3c4";
    ctx.fillRect(cx, cy - 2, 1, 1);
    ctx.fillStyle = "#e8e4d8";
    ctx.fillRect(cx - 1, cy, 3, 9);
    ctx.fillStyle = "#5a4530";
    ctx.fillRect(cx - 3, cy + 9, 7, 2);
  }

  // Colossal root piercing the castle.
  const near = camX * 0.55;
  ctx.fillStyle = "#170f14";
  for (let i = -1; i < 4; i += 1) {
    const idx = Math.floor(near / 260) + i;
    const x = idx * 260 - (near % 260);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 40, 0);
    ctx.lineTo(x + 96, VIEW_H);
    ctx.lineTo(x + 66, VIEW_H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#231820";
    ctx.fillRect(x + 20 + (VIEW_H / 4) * 0.28, VIEW_H / 4, 3, 30);
    ctx.fillStyle = "#170f14";
  }

  // Forge glow from below and drifting embers.
  const g = ctx.createLinearGradient(0, VIEW_H - 90, 0, VIEW_H);
  g.addColorStop(0, "rgba(255, 120, 40, 0)");
  g.addColorStop(1, `rgba(255, 120, 40, ${0.2 + 0.06 * Math.sin(time / 9)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, VIEW_H - 90, VIEW_W, 90);
  for (let i = 0; i < 26; i += 1) {
    const x = ((rnd(i + 30) * 900 - camX * 0.9 + Math.sin(time / 30 + i) * 10) % (VIEW_W + 40) + VIEW_W + 40) % (VIEW_W + 40) - 20;
    const y = VIEW_H - ((rnd(i + 31) * VIEW_H + time * (0.4 + rnd(i + 32) * 0.5)) % VIEW_H);
    const a = 0.4 + 0.6 * Math.abs(Math.sin(time / 15 + i));
    ctx.fillStyle = `rgba(255, 160, 60, ${a})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
  }
  fog(ctx, camX, time, "120, 60, 40", VIEW_H - 40, 0.1);
}

function foregroundCastle(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  const fg = camX * 1.3;
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#050307";
  for (let i = -1; i < 4; i += 1) {
    const idx = Math.floor(fg / 340) + i;
    const x = idx * 340 - (fg % 340) + rnd(idx + 800) * 100;
    // Chandelier chain and ring from the ceiling.
    const sway = Math.sin(time / 90 + idx) * 4;
    ctx.fillRect(x + sway, 0, 3, 70);
    ctx.beginPath();
    ctx.ellipse(x + 1 + sway, 78, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let c = -2; c <= 2; c += 1) {
      ctx.fillRect(x + sway + c * 12, 66, 2, 8);
      const flick = 0.5 + 0.5 * Math.sin(time / 6 + c + idx);
      ctx.fillStyle = `rgba(255, 200, 90, ${0.7 * flick})`;
      ctx.fillRect(x + sway + c * 12, 63, 2, 3);
      ctx.fillStyle = "#050307";
    }
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* White tunnel                                                         */
/* ------------------------------------------------------------------ */

function drawWhite(ctx: CanvasRenderingContext2D, camX: number, time: number) {
  gradient(ctx, [
    [0, "#f6f4ee"],
    [0.6, "#e6e2d8"],
    [1, "#d3cec2"],
  ]);
  const far = camX * 0.4;
  for (let i = -1; i < 14; i += 1) {
    const idx = Math.floor(far / 66) + i;
    const x = idx * 66 - (far % 66);
    ctx.strokeStyle = "rgba(170, 164, 152, 0.7)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.quadraticCurveTo(x + 33, -60, x + 66, VIEW_H);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  for (let i = 0; i < 40; i += 1) {
    const x = (((rnd(i) * 900 - time * (0.2 + rnd(i + 1) * 0.3)) % 900) + 900) % 900 - 210;
    const y = (rnd(i + 2) * VIEW_H + Math.sin(time / 30 + i) * 8 + time * 0.1) % VIEW_H;
    ctx.fillRect(Math.floor(x), Math.floor(y), 2, 1);
  }
  radial(ctx, VIEW_W - 60, VIEW_H / 2, 240, "rgba(242, 167, 200, 0.45)", "rgba(242, 167, 200, 0)");
}
