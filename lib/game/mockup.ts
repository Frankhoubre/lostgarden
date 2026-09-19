/**
 * Visual mockup: one painted backdrop from the series, one controllable
 * Lanterne, and the lighting / atmosphere stack. Everything is drawn on a
 * 480x288 canvas with nearest-neighbour scaling.
 */
import type { InputName } from "./engine";

const VIEW_W = 480;
const VIEW_H = 288;

const GRAVITY = 0.42;
const MAX_FALL = 9;
const WALK = 1.9;
const JUMP_VY = -8.2;
const ACCEL = 0.35;

type Light = { x: number; y: number; r: number; a: number; color?: string; parallax: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; parallax: number };

type BgMeta = {
  width: number;
  height: number;
  groundTop: number;
  feetY: number;
  lights: { x: number; y: number; r: number }[];
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export class Mockup {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private running = false;
  private last = 0;
  private acc = 0;
  private time = 0;

  private held = new Set<InputName>();
  private pressed = new Set<InputName>();

  private bg!: HTMLImageElement;
  private ground!: HTMLImageElement;
  private side!: HTMLImageElement;
  private front!: HTMLImageElement;
  private trunkL!: HTMLImageElement;
  private trunkR!: HTMLImageElement;
  private meta!: BgMeta;
  private lightCanvas: HTMLCanvasElement;
  private ready = false;

  // Player
  private px = 200;
  private py = 0;
  private vx = 0;
  private vy = 0;
  private dir: 1 | -1 = 1;
  private onGround = false;
  private walkT = 0;
  private idleT = 0;
  private landT = 0;
  private flare = 0;
  private cameraX = 0;
  private particles: Particle[] = [];
  private lights: Light[] = [];
  muted = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable");
    this.ctx = ctx;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    ctx.imageSmoothingEnabled = false;
    this.lightCanvas = document.createElement("canvas");
    this.lightCanvas.width = VIEW_W;
    this.lightCanvas.height = VIEW_H;
    (canvas as HTMLCanvasElement & { lostGardenMockup?: Mockup }).lostGardenMockup = this;
  }

  async load() {
    const [bg, ground, side, front, trunkL, trunkR, metaRes] = await Promise.all([
      loadImage("/game/bg-forest.png"),
      loadImage("/game/ground-forest.png"),
      loadImage("/game/lanterne-side.png"),
      loadImage("/game/lanterne-front.png"),
      loadImage("/game/fg-trunk-left.png"),
      loadImage("/game/fg-trunk-right.png"),
      fetch("/game/bg-forest.json").then((r) => r.json() as Promise<BgMeta>),
    ]);
    this.bg = bg;
    this.ground = ground;
    this.side = side;
    this.front = front;
    this.trunkL = trunkL;
    this.trunkR = trunkR;
    this.meta = metaRes;
    this.py = this.meta.feetY;
    this.ready = true;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.acc += dt;
      let steps = 0;
      while (this.acc >= 1 / 60 && steps < 4) {
        this.tick();
        this.acc -= 1 / 60;
        steps += 1;
      }
      if (steps === 4) this.acc = 0;
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  setInput(name: InputName, down: boolean) {
    if (down) {
      if (!this.held.has(name)) this.pressed.add(name);
      this.held.add(name);
    } else {
      this.held.delete(name);
    }
  }

  releaseAll() {
    this.held.clear();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  debug() {
    return { x: this.px, y: this.py, onGround: this.onGround, cameraX: this.cameraX, ready: this.ready };
  }

  /* ---------------- simulation ---------------- */

  private tick() {
    if (!this.ready) return;
    this.time += 1;
    const left = this.held.has("left");
    const right = this.held.has("right");
    const feetY = this.meta.feetY;

    // Horizontal motion with a little inertia (the armour is heavy).
    const target = left ? -WALK : right ? WALK : 0;
    if (this.onGround) {
      this.vx += (target - this.vx) * ACCEL;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    } else {
      this.vx += (target - this.vx) * 0.04;
    }
    if (left && !right) this.dir = -1;
    if (right && !left) this.dir = 1;

    if (this.pressed.has("jump") && this.onGround) {
      this.vy = JUMP_VY;
      this.onGround = false;
      this.puff(6, "#7fa9b8", 1.4);
    }
    if (this.pressed.has("throw")) this.flare = 40;
    if (this.flare > 0) this.flare -= 1;

    this.vy = Math.min(MAX_FALL, this.vy + GRAVITY);
    this.px += this.vx;
    this.py += this.vy;
    const wasGround = this.onGround;
    if (this.py >= feetY) {
      this.py = feetY;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
    if (!wasGround && this.onGround) {
      this.landT = 8;
      this.puff(8, "#7fa9b8", 1.8);
    }
    if (this.landT > 0) this.landT -= 1;
    if (this.px < 40) {
      this.px = 40;
      this.vx = 0;
    }

    const moving = Math.abs(this.vx) > 0.3 && this.onGround;
    if (moving) {
      this.walkT += Math.abs(this.vx) * 0.55;
      this.idleT = 0;
      // Footstep dust on each stride.
      if (Math.floor(this.walkT / 10) !== Math.floor((this.walkT - Math.abs(this.vx) * 0.55) / 10)) this.puff(2, "#6f95a3", 0.8);
    } else if (this.onGround) {
      this.idleT += 1;
    } else {
      this.idleT = 0;
    }

    // Camera: leads the player in its facing direction, eases smoothly.
    const targetCam = this.px - VIEW_W / 2 + this.dir * 40;
    this.cameraX += (targetCam - this.cameraX) * 0.08;
    if (this.cameraX < 0) this.cameraX = 0;

    // Ambient particles: spores drifting, fireflies near the ground.
    if (this.time % 6 === 0) {
      this.particles.push({
        x: this.cameraX + Math.random() * (VIEW_W + 80) - 40,
        y: -4,
        vx: (Math.random() - 0.5) * 0.2,
        vy: 0.15 + Math.random() * 0.25,
        life: 900,
        max: 900,
        color: Math.random() < 0.3 ? "#e8f8ff" : "#8fe3ff",
        size: Math.random() < 0.2 ? 2 : 1,
        parallax: 0.6 + Math.random() * 0.6,
      });
    }
    if (this.time % 25 === 0) {
      this.particles.push({
        x: this.cameraX + Math.random() * VIEW_W,
        y: this.meta.groundTop + 20 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.15,
        life: 240,
        max: 240,
        color: "#bff4ff",
        size: 1,
        parallax: 1,
      });
    }
    for (const pt of this.particles) {
      pt.x += pt.vx + Math.sin((this.time + pt.max) / 50) * 0.05;
      pt.y += pt.vy;
      pt.life -= 1;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0 && pt.y < VIEW_H + 10);
    this.pressed.clear();
  }

  private puff(count: number, color: string, speed: number) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.PI + Math.random() * Math.PI;
      const s = (0.4 + Math.random()) * speed;
      this.particles.push({
        x: this.px + (Math.random() - 0.5) * 10,
        y: this.py - 1,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s * 0.6,
        life: 22 + Math.random() * 14,
        max: 36,
        color,
        size: Math.random() < 0.4 ? 2 : 1,
        parallax: 1,
      });
    }
  }

  /* ---------------- rendering ---------------- */

  private render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    if (!this.ready) {
      ctx.fillStyle = "#020817";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      return;
    }
    this.lights = [];
    const cam = Math.round(this.cameraX);

    this.drawTiled(this.bg, 0.45, 0, cam);
    // Depth haze between the far layer and the near ground.
    const haze = ctx.createLinearGradient(0, this.meta.groundTop - 60, 0, this.meta.groundTop + 30);
    haze.addColorStop(0, "rgba(40, 110, 190, 0)");
    haze.addColorStop(1, "rgba(40, 110, 190, 0.28)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, this.meta.groundTop - 60, VIEW_W, 90);
    this.drawLightShafts(cam);
    this.drawTiled(this.ground, 1, this.meta.groundTop, cam);
    this.collectBackgroundLights(cam);

    this.drawParticles(cam, (p) => p.parallax < 1);
    this.drawPlayer(cam);
    this.drawParticles(cam, (p) => p.parallax >= 1);

    this.renderLighting(0.5);
    this.drawForeground(cam);
    this.drawFog(cam);
    this.drawVignette();
  }

  /** Draws an image tiled horizontally with mirrored repeats, at a parallax factor. */
  private drawTiled(img: HTMLImageElement, parallax: number, y: number, cam: number) {
    const ctx = this.ctx;
    const w = img.width;
    const offset = Math.round(cam * parallax);
    const period = w * 2;
    const start = -(((offset % period) + period) % period);
    for (let x = start; x < VIEW_W; x += period) {
      ctx.drawImage(img, x, y);
      ctx.save();
      ctx.translate(x + w * 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, y);
      ctx.restore();
    }
  }

  /** Light sources baked from the painted backdrop (glowing mushrooms). */
  private collectBackgroundLights(cam: number) {
    const w = this.bg.width;
    for (const l of this.meta.lights) {
      const near = l.y >= this.meta.groundTop;
      const parallax = near ? 1 : 0.45;
      const offset = Math.round(cam * parallax);
      const period = w * 2;
      const base = -(((offset % period) + period) % period);
      for (let k = -1; k <= 2; k += 1) {
        const tileX = base + k * period;
        // Normal copy, then mirrored copy.
        const xs = [tileX + l.x, tileX + w * 2 - l.x];
        for (const sx of xs) {
          if (sx < -80 || sx > VIEW_W + 80) continue;
          const pulse = 0.75 + 0.25 * Math.sin(this.time / 28 + l.x * 0.13 + l.y * 0.07);
          const r = Math.min(near ? 36 : 22, l.r * (near ? 0.9 : 0.55)) * pulse;
          this.lights.push({ x: sx, y: l.y, r, a: near ? 0.85 : 0.5, color: near ? "rgba(90, 190, 255, 0.16)" : undefined, parallax });
        }
      }
    }
  }

  private drawLightShafts(cam: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i += 1) {
      const x = ((i * 137 - cam * 0.3 + this.time * 0.05) % (VIEW_W + 200)) - 100;
      const a = 0.08 + 0.04 * Math.sin(this.time / 90 + i);
      const g = ctx.createLinearGradient(x, 0, x + 60, VIEW_H);
      g.addColorStop(0, `rgba(140, 200, 255, ${a})`);
      g.addColorStop(0.7, `rgba(140, 200, 255, ${a * 0.4})`);
      g.addColorStop(1, "rgba(140, 200, 255, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 26, 0);
      ctx.lineTo(x + 110, VIEW_H);
      ctx.lineTo(x + 40, VIEW_H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawPlayer(cam: number) {
    const ctx = this.ctx;
    const spr = this.side;
    const w = spr.width;
    const h = spr.height;
    const x = Math.round(this.px - w / 2 - cam);
    const y = Math.round(this.py - h);
    const moving = Math.abs(this.vx) > 0.3 && this.onGround;
    const idleFront = this.idleT > 240;

    // Lantern light: warm, flickering, brighter on a flare.
    const flick = 0.94 + 0.06 * Math.sin(this.time / 3) + 0.03 * Math.sin(this.time / 7);
    const flare = this.flare > 0 ? 1 + (this.flare / 40) * 0.8 : 1;
    const headX = this.px - cam;
    const headY = this.py - h + 10;
    this.lights.push({ x: headX, y: headY, r: 105 * flick * flare, a: 1, color: `rgba(255, 190, 110, ${0.28 * flare})`, parallax: 1 });
    // Contact shadow on the ground.
    ctx.fillStyle = "rgba(2, 6, 18, 0.35)";
    ctx.beginPath();
    ctx.ellipse(this.px - cam, this.py + 1, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (idleFront) {
      const f = this.front;
      const bob = Math.round(Math.sin(this.time / 40));
      ctx.drawImage(f, Math.round(this.px - f.width / 2 - cam), y + bob);
      return;
    }

    const headEnd = 19;
    const hip = 47;
    const bob = moving ? Math.round(Math.abs(Math.sin(this.walkT / 5)) * -2) : Math.round(Math.sin(this.time / 40) * 1);
    const squash = this.landT > 0 ? 2 : 0;
    const flip = this.dir < 0;

    const draw = (sy: number, sh: number, dx: number, dy: number, shear: number, alpha = 1, darken = false) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const cx = x + w / 2;
      ctx.translate(cx, 0);
      if (flip) ctx.scale(-1, 1);
      // Shear around the hip line so parts pivot from the body.
      ctx.transform(1, 0, shear, 1, -shear * (y + hip), 0);
      ctx.drawImage(spr, 0, sy, w, sh, -w / 2 + dx, y + sy + dy, w, sh);
      if (darken) {
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = "rgba(2, 6, 18, 0.35)";
        ctx.fillRect(-w / 2 + dx, y + sy + dy, w, sh);
      }
      ctx.restore();
    };

    // Legs: two copies swinging in opposite phases read as a stride.
    const legsH = h - hip;
    if (moving) {
      const swing = Math.sin(this.walkT / 5) * 0.45;
      draw(hip, legsH, -1, bob + squash, -swing * 0.9, 1, true);
      draw(hip, legsH, 1, bob + squash, swing);
    } else if (!this.onGround) {
      const tuck = this.vy < 0 ? -0.35 : 0.25;
      draw(hip, legsH, -1, 0, tuck * 0.7, 1, true);
      draw(hip, legsH, 1, 0, tuck);
    } else {
      draw(hip, legsH, 0, squash, 0);
    }
    // Torso and head, with a lean when moving or airborne.
    const lean = moving ? 0.07 * Math.sign(this.vx) * this.dir : !this.onGround ? 0.1 : 0;
    draw(headEnd, hip - headEnd, 0, bob + squash, lean);
    draw(0, headEnd, 0, bob + squash + (moving ? Math.round(Math.sin(this.walkT / 5 + 1)) : 0), lean);
  }

  private drawParticles(cam: number, filter: (p: Particle) => boolean) {
    const ctx = this.ctx;
    for (const pt of this.particles) {
      if (!filter(pt)) continue;
      const a = Math.min(1, pt.life / 40) * (0.5 + 0.5 * Math.abs(Math.sin(this.time / 20 + pt.max)));
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      const x = Math.round(pt.x - cam * pt.parallax);
      ctx.fillRect(x, Math.round(pt.y), pt.size, pt.size);
      if (pt.size === 1 && pt.parallax >= 1) this.lights.push({ x, y: pt.y, r: 6, a: 0.5, parallax: 1 });
    }
    ctx.globalAlpha = 1;
  }

  private renderLighting(darkness: number) {
    const lc = this.lightCanvas.getContext("2d");
    if (!lc) return;
    lc.globalCompositeOperation = "source-over";
    lc.clearRect(0, 0, VIEW_W, VIEW_H);
    // Darkness with a bluish tint, deeper at the bottom.
    const g = lc.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, `rgba(2, 6, 20, ${darkness * 0.8})`);
    g.addColorStop(1, `rgba(2, 6, 20, ${darkness})`);
    lc.fillStyle = g;
    lc.fillRect(0, 0, VIEW_W, VIEW_H);
    lc.globalCompositeOperation = "destination-out";
    for (const l of this.lights) {
      if (l.x < -l.r || l.x > VIEW_W + l.r) continue;
      const rg = lc.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      rg.addColorStop(0, `rgba(0, 0, 0, ${l.a})`);
      rg.addColorStop(0.4, `rgba(0, 0, 0, ${l.a * 0.55})`);
      rg.addColorStop(1, "rgba(0, 0, 0, 0)");
      lc.fillStyle = rg;
      lc.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    const ctx = this.ctx;
    ctx.drawImage(this.lightCanvas, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    for (const l of this.lights) {
      if (!l.color || l.x < -l.r || l.x > VIEW_W + l.r) continue;
      const rg = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.85);
      rg.addColorStop(0, l.color);
      rg.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rg;
      ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  private drawForeground(cam: number) {
    const ctx = this.ctx;
    const fg = cam * 1.5;
    // Painted trunks from the frame, spaced out along the road.
    const period = 760;
    for (let i = -1; i < 3; i += 1) {
      const idx = Math.floor(fg / period) + i;
      const base = idx * period - (fg % period);
      const jitter = rnd(idx + 900) * 120;
      ctx.drawImage(this.trunkL, Math.round(base + jitter), 0);
      ctx.drawImage(this.trunkR, Math.round(base + jitter + 420 + rnd(idx + 901) * 120), 0);
    }
    // Canopy silhouettes along the top, rim-lit by the blue haze.
    const canopy = cam * 1.25;
    for (let i = -1; i < 8; i += 1) {
      const idx = Math.floor(canopy / 120) + i;
      const x = idx * 120 - (canopy % 120) + rnd(idx + 700) * 40;
      const rx = 50 + rnd(idx + 701) * 40;
      const ry = 18 + rnd(idx + 702) * 22;
      ctx.fillStyle = "#020a17";
      ctx.beginPath();
      ctx.ellipse(x, -6 + Math.sin(this.time / 90 + idx) * 2, rx, ry, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = "#061426";
      ctx.beginPath();
      ctx.ellipse(x + rx * 0.3, -10 + Math.sin(this.time / 90 + idx) * 2, rx * 0.5, ry * 0.7, 0, 0, Math.PI);
      ctx.fill();
    }
    // Foreground mushroom caps at the bottom edge.
    const near = cam * 1.6;
    for (let i = -1; i < 5; i += 1) {
      const idx = Math.floor(near / 260) + i;
      const x = idx * 260 - (near % 260) + rnd(idx + 600) * 100;
      if (rnd(idx + 601) > 0.55) continue;
      const w = 50 + rnd(idx + 602) * 50;
      ctx.fillStyle = "#020a17";
      ctx.beginPath();
      ctx.ellipse(x, VIEW_H + 8, w / 2, 22, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(90, 190, 255, 0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, VIEW_H + 8, w / 2 - 3, 20, 0, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  }

  private drawFog(cam: number) {
    const ctx = this.ctx;
    for (let i = 0; i < 3; i += 1) {
      const y = VIEW_H - 26 - i * 16 + Math.sin(this.time / 80 + i) * 3;
      const g = ctx.createLinearGradient(0, y - 16, 0, y + 16);
      const a = 0.07 + 0.04 * Math.sin(this.time / 60 + i * 2);
      g.addColorStop(0, "rgba(120, 180, 240, 0)");
      g.addColorStop(0.5, `rgba(120, 180, 240, ${a})`);
      g.addColorStop(1, "rgba(120, 180, 240, 0)");
      ctx.fillStyle = g;
      const shift = (cam * (0.9 + i * 0.2) + this.time * (0.2 + i * 0.05)) % 220;
      for (let x = -220 - shift; x < VIEW_W + 220; x += 220) {
        ctx.fillRect(x, y - 16, 150 + rnd(i * 3 + Math.floor((x + shift) / 220)) * 90, 32);
      }
    }
  }

  private drawVignette() {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.75);
    g.addColorStop(0, "rgba(2, 6, 18, 0)");
    g.addColorStop(1, "rgba(2, 6, 18, 0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
