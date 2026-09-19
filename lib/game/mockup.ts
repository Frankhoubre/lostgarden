/**
 * Visual mockup: one painted backdrop from the series, one controllable
 * Lanterne, and the lighting / atmosphere stack. Everything is drawn on a
 * 480x288 canvas with nearest-neighbour scaling.
 */
import { GameAudio } from "./audio";
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

type BgLight = { x: number; y: number; r: number };
type AnimMeta = { cell: { w: number; h: number }; walk: number; jump: number; idle: number; throw: number; throwCellW: number; hurt: number };
type ReptileMeta = { cell: { h: number }; walk: { n: number; w: number }; attack: { n: number; w: number }; die: { n: number; w: number } };

type ReptileState = "prowl" | "chase" | "attack" | "hurt" | "dead";
type Reptile = {
  x: number;
  dir: 1 | -1;
  state: ReptileState;
  t: number;
  hp: number;
  vx: number;
  hitDone: boolean;
  flash: number;
  home: number;
};
type Shot = { x: number; y: number; vx: number; life: number; dead: boolean };

const REPTILE_HP = 4;
const PLAYER_HP = 3;
type BgMeta = {
  width: number;
  height: number;
  ground: { top: number; height: number };
  lights: BgLight[];
  groundLights: BgLight[];
  lanterne: { w: number; h: number };
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
  private walkSheet!: HTMLImageElement;
  private jumpSheet!: HTMLImageElement;
  private idleSheet!: HTMLImageElement;
  private throwSheet!: HTMLImageElement;
  private hurtSheet!: HTMLImageElement;
  private anim!: AnimMeta;
  private rWalk!: HTMLImageElement;
  private rAttack!: HTMLImageElement;
  private rDie!: HTMLImageElement;
  private rMeta!: ReptileMeta;
  private audio = new GameAudio();
  private trunk: HTMLImageElement | null = null;
  private meta!: BgMeta;
  private jumpT = 0;
  private groundY = 0;
  private feetY = 0;
  private lightCanvas: HTMLCanvasElement;
  private fxCanvas: HTMLCanvasElement;
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
  private throwT = 0;
  private throwCooldown = 0;
  private hurtT = 0;
  private invuln = 0;
  private hp = PLAYER_HP;
  private deadT = 0;
  private shots: Shot[] = [];
  private reptiles: Reptile[] = [];
  private shake = 0;
  private hitStop = 0;
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
    this.fxCanvas = document.createElement("canvas");
    this.fxCanvas.width = VIEW_W;
    this.fxCanvas.height = VIEW_H;
    (canvas as HTMLCanvasElement & { lostGardenMockup?: Mockup }).lostGardenMockup = this;
  }

  async load() {
    const [bg, ground, walk, jump, idle, throwS, hurtS, metaRes, animRes, trunk, rWalk, rAttack, rDie, rMeta] = await Promise.all([
      loadImage("/game/bg-forest.png"),
      loadImage("/game/ground-forest.png"),
      loadImage("/game/lanterne-walk.png"),
      loadImage("/game/lanterne-jump.png"),
      loadImage("/game/lanterne-idle.png"),
      loadImage("/game/lanterne-throw.png"),
      loadImage("/game/lanterne-hurt.png"),
      fetch("/game/bg-forest.json").then((r) => r.json() as Promise<BgMeta>),
      fetch("/game/lanterne-anim.json").then((r) => r.json() as Promise<AnimMeta>),
      loadImage("/game/fg-trunk.png").catch(() => null),
      loadImage("/game/reptile-walk.png"),
      loadImage("/game/reptile-attack.png"),
      loadImage("/game/reptile-die.png"),
      fetch("/game/reptile-anim.json").then((r) => r.json() as Promise<ReptileMeta>),
    ]);
    this.bg = bg;
    this.ground = ground;
    this.walkSheet = walk;
    this.jumpSheet = jump;
    this.idleSheet = idle;
    this.throwSheet = throwS;
    this.hurtSheet = hurtS;
    this.anim = animRes;
    this.rWalk = rWalk;
    this.rAttack = rAttack;
    this.rDie = rDie;
    this.rMeta = rMeta;
    this.trunk = trunk;
    this.meta = metaRes;
    // The near ground strip sits at the bottom; its walkable line is the feet line.
    this.groundY = VIEW_H - this.meta.ground.height + 14;
    this.feetY = this.groundY + this.meta.ground.top;
    this.py = this.feetY;
    this.spawnReptile(this.px + 420, -1);
    this.spawnReptile(this.px + 760, -1);
    this.ready = true;
  }

  private spawnReptile(x: number, dir: 1 | -1) {
    this.reptiles.push({ x, dir, state: "prowl", t: 0, hp: REPTILE_HP, vx: 0, hitDone: false, flash: 0, home: x });
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
    this.audio.dispose();
  }

  setInput(name: InputName, down: boolean) {
    if (down) {
      if (!this.held.has(name)) this.pressed.add(name);
      this.held.add(name);
      this.audio.unlock();
    } else {
      this.held.delete(name);
    }
  }

  releaseAll() {
    this.held.clear();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
    return this.muted;
  }

  debug() {
    return {
      x: this.px,
      y: this.py,
      onGround: this.onGround,
      cameraX: this.cameraX,
      ready: this.ready,
      hp: this.hp,
      shots: this.shots.length,
      reptiles: this.reptiles.map((r) => ({ x: Math.round(r.x), state: r.state, hp: r.hp })),
    };
  }

  debugWarp(x: number) {
    this.px = x;
    this.cameraX = x - VIEW_W / 2;
  }

  /* ---------------- simulation ---------------- */

  private tick() {
    if (!this.ready) return;
    this.time += 1;
    if (this.hitStop > 0) {
      this.hitStop -= 1;
      this.pressed.clear();
      return;
    }
    if (this.shake > 0) this.shake -= 1;
    if (this.deadT > 0) {
      this.deadT += 1;
      if (this.deadT > 150) this.respawn();
      this.pressed.clear();
      return;
    }
    const busy = this.hurtT > 0;
    const left = this.held.has("left") && !busy;
    const right = this.held.has("right") && !busy;
    const feetY = this.feetY;

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

    if (this.pressed.has("jump") && this.onGround && !busy) {
      this.vy = JUMP_VY;
      this.onGround = false;
      this.jumpT = 0;
      this.puff(6, "#7fa9b8", 1.4);
      this.audio.sfx("jump");
    }
    if (!this.onGround) this.jumpT += 1;
    if (this.throwCooldown > 0) this.throwCooldown -= 1;
    if (this.pressed.has("throw") && this.throwCooldown <= 0 && !busy) {
      this.throwT = 1;
      this.throwCooldown = 26;
    }
    if (this.throwT > 0) {
      this.throwT += 1;
      // Release the glimmer on the third frame of the throw.
      if (this.throwT === 9) {
        this.shots.push({ x: this.px + this.dir * 22, y: this.py - 52, vx: this.dir * 5.2, life: 90, dead: false });
        this.flare = 30;
        this.audio.sfx("throw");
      }
      if (this.throwT > 24) this.throwT = 0;
    }
    if (this.hurtT > 0) this.hurtT -= 1;
    if (this.invuln > 0) this.invuln -= 1;
    if (this.flare > 0) this.flare -= 1;
    this.tickShots();
    this.tickReptiles();

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
        y: this.groundY - 40 + Math.random() * 60,
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
      if (pt.max <= 36) pt.vy += 0.08;
      pt.life -= 1;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0 && pt.y < VIEW_H + 10);
    this.pressed.clear();
  }

  private respawn() {
    this.deadT = 0;
    this.hp = PLAYER_HP;
    this.invuln = 90;
    this.hurtT = 0;
    this.vx = 0;
    this.vy = 0;
    this.reptiles = [];
    this.shots = [];
    this.spawnReptile(this.px + 420, -1);
    this.spawnReptile(this.px + 760, -1);
  }

  private tickShots() {
    for (const sh of this.shots) {
      sh.x += sh.vx;
      sh.y += Math.sin(sh.life / 3) * 0.3;
      sh.life -= 1;
      if (sh.life <= 0) sh.dead = true;
      // Trail.
      if (this.time % 2 === 0) {
        this.particles.push({ x: sh.x - sh.vx, y: sh.y + (Math.random() - 0.5) * 4, vx: -sh.vx * 0.05, vy: (Math.random() - 0.5) * 0.3, life: 14, max: 14, color: Math.random() < 0.5 ? "#fff1a8" : "#ffb347", size: 1, parallax: 1 });
      }
      for (const r of this.reptiles) {
        if (r.state === "dead" || sh.dead) continue;
        const { x0, x1 } = this.reptileBox(r);
        if (sh.x > x0 && sh.x < x1 && sh.y > this.feetY - 92 && sh.y < this.feetY) {
          sh.dead = true;
          this.hitReptile(r, sh.vx > 0 ? 1 : -1);
          this.burst(sh.x, sh.y, 14, "#fff1a8", 2.2);
        }
      }
    }
    this.shots = this.shots.filter((sh) => !sh.dead);
  }

  private reptileBox(r: Reptile) {
    return { x0: r.x - 20, x1: r.x + 20 };
  }

  private hitReptile(r: Reptile, knock: 1 | -1) {
    r.hp -= 1;
    r.flash = 8;
    this.hitStop = 3;
    this.shake = 5;
    if (r.hp <= 0) {
      r.state = "dead";
      r.t = 0;
      r.vx = knock * 1.2;
      this.audio.sfx("die");
      this.burst(r.x, this.feetY - 50, 22, "#dfe4ec", 2.6);
    } else {
      r.state = "hurt";
      r.t = 0;
      r.vx = knock * 2.4;
      r.dir = (knock * -1) as 1 | -1;
      this.audio.sfx("enemy");
    }
  }

  private hurtPlayer(from: number) {
    if (this.invuln > 0 || this.deadT > 0) return;
    this.hp -= 1;
    this.hurtT = 26;
    this.invuln = 70;
    this.throwT = 0;
    const knock = this.px < from ? -1 : 1;
    this.vx = knock * 3.2;
    this.vy = this.onGround ? -2.6 : this.vy;
    this.onGround = false;
    this.shake = 8;
    this.hitStop = 4;
    this.audio.sfx("hit");
    this.burst(this.px, this.py - 50, 12, "#c3ad84", 2);
    if (this.hp <= 0) {
      this.deadT = 1;
      this.audio.sfx("armor");
    }
  }

  private tickReptiles() {
    const dist = (r: Reptile) => this.px - r.x;
    for (const r of this.reptiles) {
      r.t += 1;
      if (r.flash > 0) r.flash -= 1;
      switch (r.state) {
        case "prowl": {
          // Wander around home, turn at the leash.
          if (r.t % 120 === 1) r.dir = Math.random() < 0.5 ? -1 : 1;
          if (Math.abs(r.x - r.home) > 90) r.dir = r.x > r.home ? -1 : 1;
          r.vx = r.dir * 0.55;
          if (Math.abs(dist(r)) < 200 && this.deadT === 0) {
            r.state = "chase";
            r.t = 0;
          }
          break;
        }
        case "chase": {
          r.dir = dist(r) > 0 ? 1 : -1;
          r.vx = r.dir * 1.1;
          if (Math.abs(dist(r)) < 60 && this.onGround && r.t > 20) {
            r.state = "attack";
            r.t = 0;
            r.hitDone = false;
            r.vx = 0;
          } else if (Math.abs(dist(r)) > 320 || this.deadT > 0) {
            r.state = "prowl";
            r.t = 0;
            r.home = r.x;
          }
          break;
        }
        case "attack": {
          // Windup (frames 0-1, 18 ticks, readable), lunge (frame 2), follow through, recover.
          const frame = this.reptileAttackFrame(r.t);
          r.vx = frame === 2 ? r.dir * 2.4 : 0;
          if (frame === 2 && !r.hitDone) {
            r.hitDone = true;
            const reach = r.x + r.dir * 44;
            if (Math.abs(this.px - reach) < 30 && Math.abs(this.px - r.x) < 70 && this.py > this.feetY - 40) {
              this.hurtPlayer(r.x);
            }
            this.audio.sfx("throw");
          }
          if (r.t > 62) {
            r.state = "chase";
            r.t = 0;
          }
          break;
        }
        case "hurt": {
          r.vx *= 0.85;
          if (r.t > 22) {
            r.state = "chase";
            r.t = 0;
          }
          break;
        }
        case "dead": {
          r.vx *= 0.9;
          break;
        }
        default:
          break;
      }
      r.x += r.vx;
      if (r.x < 30) r.x = 30;
    }
    // Remove bodies that faded away, keep the forest populated ahead of the player.
    this.reptiles = this.reptiles.filter((r) => !(r.state === "dead" && r.t > 420));
    const alive = this.reptiles.filter((r) => r.state !== "dead").length;
    if (alive < 2 && this.time % 180 === 0 && this.deadT === 0) {
      const side = Math.random() < 0.7 ? 1 : -1;
      const x = this.px + side * (VIEW_W / 2 + 120 + Math.random() * 200);
      if (x > 60) this.spawnReptile(x, side > 0 ? -1 : 1);
    }
  }

  private reptileAttackFrame(t: number): number {
    if (t < 9) return 0;
    if (t < 18) return 1;
    if (t < 26) return 2;
    if (t < 36) return 3;
    return 4;
  }

  private burst(x: number, y: number, count: number, color: string, speed: number) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.3 + Math.random()) * speed;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6, life: 18 + Math.random() * 16, max: 34, color, size: Math.random() < 0.4 ? 2 : 1, parallax: 1 });
    }
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
    const cam = Math.round(this.cameraX) + (this.shake > 0 ? Math.round((Math.random() - 0.5) * 6) : 0);
    const shakeY = this.shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
    ctx.save();
    ctx.translate(0, shakeY);

    this.drawTiled(this.bg, 0.45, 0, cam);
    // Depth haze and light shafts, posterised so they sit on the pixel grid.
    const fx = this.fxCanvas.getContext("2d");
    if (fx) {
      fx.globalCompositeOperation = "source-over";
      fx.clearRect(0, 0, VIEW_W, VIEW_H);
      const haze = fx.createLinearGradient(0, this.groundY - 80, 0, this.groundY + 20);
      haze.addColorStop(0, "rgba(60, 140, 220, 0)");
      haze.addColorStop(1, "rgba(60, 140, 220, 0.25)");
      fx.fillStyle = haze;
      fx.fillRect(0, this.groundY - 80, VIEW_W, 100);
      this.drawLightShafts(fx, cam);
      this.ditherAlpha(this.fxCanvas, 8, true);
      ctx.drawImage(this.fxCanvas, 0, 0);
    }
    this.drawTiled(this.ground, 1, this.groundY, cam);
    this.collectBackgroundLights(cam);

    this.drawParticles(cam, (p) => p.parallax < 1);
    for (const r of this.reptiles) if (r.state === "dead") this.drawReptile(r, cam);
    this.drawPlayer(cam);
    for (const r of this.reptiles) if (r.state !== "dead") this.drawReptile(r, cam);
    this.drawShots(cam);
    this.drawParticles(cam, (p) => p.parallax >= 1);

    this.renderLighting(0.5);
    this.drawForeground(cam);
    if (fx) {
      fx.globalCompositeOperation = "source-over";
      fx.clearRect(0, 0, VIEW_W, VIEW_H);
      this.drawFog(fx, cam);
      this.drawVignette(fx);
      this.ditherAlpha(this.fxCanvas, 8, false);
      ctx.drawImage(this.fxCanvas, 0, 0);
    }
    ctx.restore();
    this.drawHud();
  }

  private drawHud() {
    const ctx = this.ctx;
    // Lanterne's hearts: little lantern heads.
    for (let i = 0; i < PLAYER_HP; i += 1) {
      const x = 10 + i * 14;
      const y = 8;
      const on = i < this.hp;
      ctx.fillStyle = on ? "#586170" : "#232733";
      ctx.fillRect(x - 1, y + 1, 9, 12);
      ctx.fillStyle = on ? "#eef1f5" : "#3a3f4d";
      ctx.fillRect(x, y + 2, 7, 10);
      ctx.fillStyle = "#12121a";
      ctx.fillRect(x + 1, y + 6, 1, 2);
      ctx.fillRect(x + 5, y + 6, 1, 2);
      ctx.fillStyle = on ? "#c4cbd5" : "#3a3f4d";
      ctx.fillRect(x + 1, y, 5, 1);
      ctx.fillRect(x + 2, y - 1, 3, 1);
      if (on) {
        const g = ctx.createRadialGradient(x + 3, y + 7, 1, x + 3, y + 7, 12);
        g.addColorStop(0, "rgba(255, 200, 120, 0.35)");
        g.addColorStop(1, "rgba(255, 200, 120, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 9, y - 5, 24, 24);
      }
    }
    if (this.deadT > 0) {
      const a = Math.min(0.85, this.deadT / 60);
      ctx.fillStyle = `rgba(2, 6, 18, ${a})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  private drawShots(cam: number) {
    const ctx = this.ctx;
    for (const sh of this.shots) {
      const x = Math.round(sh.x - cam);
      const y = Math.round(sh.y);
      this.lights.push({ x, y, r: 46, a: 1, color: "rgba(255, 220, 140, 0.35)", parallax: 1 });
      ctx.fillStyle = "#ffb347";
      ctx.fillRect(x - 4, y - 2, 8, 4);
      ctx.fillRect(x - 2, y - 4, 4, 8);
      ctx.fillStyle = "#fff1a8";
      ctx.fillRect(x - 3, y - 1, 6, 2);
      ctx.fillRect(x - 1, y - 3, 2, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  private drawReptile(r: Reptile, cam: number) {
    const ctx = this.ctx;
    const ch = this.rMeta.cell.h;
    let sheet = this.rWalk;
    let cw = this.rMeta.walk.w;
    let frame = 0;
    let alpha = 1;
    switch (r.state) {
      case "prowl":
        frame = Math.floor(r.t / 9) % this.rMeta.walk.n;
        break;
      case "chase":
        frame = Math.floor(r.t / 5) % this.rMeta.walk.n;
        break;
      case "attack":
        sheet = this.rAttack;
        cw = this.rMeta.attack.w;
        frame = this.reptileAttackFrame(r.t);
        break;
      case "hurt":
        sheet = this.rDie;
        cw = this.rMeta.die.w;
        frame = r.t < 10 ? 0 : 1;
        break;
      case "dead":
        sheet = this.rDie;
        cw = this.rMeta.die.w;
        frame = Math.min(this.rMeta.die.n - 1, 2 + Math.floor(r.t / 8));
        if (r.t > 300) alpha = Math.max(0, 1 - (r.t - 300) / 120);
        break;
      default:
        break;
    }
    // Sheets face left; flip when the creature faces right.
    const flip = r.dir > 0;
    const x = Math.round(r.x - cw / 2 - cam);
    const y = Math.round(this.feetY - ch + 4);
    if (r.state !== "dead") {
      ctx.fillStyle = "rgba(2, 6, 18, 0.35)";
      ctx.beginPath();
      ctx.ellipse(r.x - cam, this.feetY + 1, 16, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Amber eyes glint.
      this.lights.push({ x: r.x - cam + r.dir * 10, y: this.feetY - 84, r: 22, a: 0.6, color: "rgba(242, 193, 78, 0.12)", parallax: 1 });
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    if (flip) {
      ctx.translate(x + cw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, frame * cw, 0, cw, ch, 0, y, cw, ch);
    } else {
      ctx.drawImage(sheet, frame * cw, 0, cw, ch, x, y, cw, ch);
    }
    if (r.flash > 0 && r.flash % 2 === 0) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillRect(flip ? 0 : x, y, cw, ch);
    }
    ctx.restore();
    // Small health bar while wounded.
    if (r.state !== "dead" && r.hp < REPTILE_HP) {
      const bx = Math.round(r.x - cam) - 14;
      const by = this.feetY - 100;
      ctx.fillStyle = "rgba(2, 6, 18, 0.8)";
      ctx.fillRect(bx - 1, by - 1, 30, 4);
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(bx, by, Math.round((28 * r.hp) / REPTILE_HP), 2);
    }
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

  /** Light sources baked from the painted layers (glowing mushrooms). */
  private collectBackgroundLights(cam: number) {
    const place = (lights: BgLight[], imgW: number, parallax: number, yOffset: number, near: boolean) => {
      const offset = Math.round(cam * parallax);
      const period = imgW * 2;
      const base = -(((offset % period) + period) % period);
      for (const l of lights) {
        for (let k = -1; k <= 2; k += 1) {
          const tileX = base + k * period;
          const xs = [tileX + l.x, tileX + imgW * 2 - l.x];
          for (const sx of xs) {
            if (sx < -80 || sx > VIEW_W + 80) continue;
            const pulse = 0.75 + 0.25 * Math.sin(this.time / 28 + l.x * 0.13 + l.y * 0.07);
            const r = Math.min(near ? 34 : 24, l.r * (near ? 1 : 0.7)) * pulse;
            this.lights.push({ x: sx, y: l.y + yOffset, r, a: near ? 0.85 : 0.55, color: near ? "rgba(90, 190, 255, 0.16)" : "rgba(90, 190, 255, 0.08)", parallax });
          }
        }
      }
    };
    place(this.meta.lights, this.bg.width, 0.45, 0, false);
    place(this.meta.groundLights, this.ground.width, 1, this.groundY, true);
  }

  /** Posterise a canvas's alpha into a few levels, optionally with a Bayer 4x4 ordered dither. */
  private ditherAlpha(canvas: HTMLCanvasElement, levels: number, dither = true) {
    const c = canvas.getContext("2d");
    if (!c) return;
    const img = c.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    const w = canvas.width;
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let i = 0, p = 0; i < d.length; i += 4, p += 1) {
      const a = d[i + 3];
      if (a === 0) continue;
      const x = p % w;
      const y = (p - x) / w;
      const t = dither ? (bayer[(y & 3) * 4 + (x & 3)] + 0.5) / 16 : 0.5;
      const q = Math.floor((a / 255) * levels + t) / levels;
      d[i + 3] = Math.max(0, Math.min(255, Math.round(q * 255)));
    }
    c.putImageData(img, 0, 0);
  }

  private drawLightShafts(ctx: CanvasRenderingContext2D, cam: number) {
    ctx.save();
    for (let i = 0; i < 6; i += 1) {
      const x = ((i * 137 - cam * 0.3 + this.time * 0.05) % (VIEW_W + 200)) - 100;
      const a = 0.07 + 0.03 * Math.sin(this.time / 90 + i);
      const g = ctx.createLinearGradient(x, 0, x + 60, VIEW_H);
      g.addColorStop(0, `rgba(150, 210, 255, ${a})`);
      g.addColorStop(0.7, `rgba(150, 210, 255, ${a * 0.4})`);
      g.addColorStop(1, "rgba(150, 210, 255, 0)");
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
    const { w: cw, h: ch } = this.anim.cell;
    const moving = Math.abs(this.vx) > 0.3 && this.onGround;
    const flip = this.dir < 0;

    // Pick the sheet and frame.
    let sheet = this.idleSheet;
    let frame = Math.floor(this.time / 9) % this.anim.idle;
    let cellW = cw;
    if (this.deadT > 0) {
      sheet = this.hurtSheet;
      frame = 1;
    } else if (this.hurtT > 0) {
      sheet = this.hurtSheet;
      frame = this.hurtT > 16 ? 0 : this.hurtT > 6 ? 1 : 2;
    } else if (this.throwT > 0) {
      sheet = this.throwSheet;
      cellW = this.anim.throwCellW;
      frame = Math.min(this.anim.throw - 1, Math.floor((this.throwT - 1) / 5));
    } else if (!this.onGround) {
      sheet = this.jumpSheet;
      if (this.vy < -3) frame = this.jumpT < 4 ? 1 : 2;
      else if (this.vy < 1.5) frame = 3;
      else frame = 4;
    } else if (this.landT > 0) {
      sheet = this.jumpSheet;
      frame = 5;
    } else if (moving) {
      sheet = this.walkSheet;
      frame = Math.floor(this.walkT / 4.2) % this.anim.walk;
    }

    const x = Math.round(this.px - cellW / 2 - cam);
    const y = Math.round(this.py - ch);
    if (this.invuln > 0 && this.deadT === 0 && Math.floor(this.time / 4) % 3 === 0) {
      // Still emit light while blinking.
      this.lights.push({ x: this.px - cam, y: this.py - 66, r: 90, a: 1, color: "rgba(255, 190, 110, 0.22)", parallax: 1 });
      return;
    }

    // Lantern light: warm, flickering, brighter on a flare.
    const flick = 0.94 + 0.06 * Math.sin(this.time / 3) + 0.03 * Math.sin(this.time / 7);
    const flare = this.flare > 0 ? 1 + (this.flare / 40) * 0.8 : 1;
    const headY = this.py - 78 + (sheet === this.jumpSheet && (frame === 0 || frame === 5) ? 14 : 0);
    this.lights.push({ x: this.px - cam + this.dir * 2, y: headY, r: 105 * flick * flare, a: 1, color: `rgba(255, 190, 110, ${0.28 * flare})`, parallax: 1 });

    // Contact shadow on the ground.
    ctx.fillStyle = "rgba(2, 6, 18, 0.35)";
    ctx.beginPath();
    ctx.ellipse(this.px - cam, this.feetY + 1, this.onGround ? 13 : 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (flip) {
      ctx.translate(x + cellW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, frame * cellW, 0, cellW, ch, 0, y, cellW, ch);
    } else {
      ctx.drawImage(sheet, frame * cellW, 0, cellW, ch, x, y, cellW, ch);
    }
    ctx.restore();
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
    this.ditherAlpha(this.lightCanvas, 16, true);
    const ctx = this.ctx;
    ctx.drawImage(this.lightCanvas, 0, 0);
    // Coloured glow, additive, posterised the same way.
    const fx = this.fxCanvas.getContext("2d");
    if (!fx) return;
    fx.globalCompositeOperation = "source-over";
    fx.clearRect(0, 0, VIEW_W, VIEW_H);
    for (const l of this.lights) {
      if (!l.color || l.x < -l.r || l.x > VIEW_W + l.r) continue;
      const rg = fx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.85);
      rg.addColorStop(0, l.color);
      rg.addColorStop(1, "rgba(0, 0, 0, 0)");
      fx.fillStyle = rg;
      fx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    this.ditherAlpha(this.fxCanvas, 8, true);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(this.fxCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  }

  private drawForeground(cam: number) {
    const ctx = this.ctx;
    const fg = cam * 1.5;
    // Generated foreground trunk, spaced out along the road.
    if (this.trunk) {
      const period = 1100;
      ctx.globalAlpha = 0.7;
      for (let i = -1; i < 3; i += 1) {
        const idx = Math.floor(fg / period) + i;
        const base = idx * period - (fg % period) + 320 + rnd(idx + 900) * 200;
        const scale = VIEW_H / this.trunk.height;
        const w = Math.round(this.trunk.width * scale);
        ctx.drawImage(this.trunk, Math.round(base), 0, w, VIEW_H);
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawFog(ctx: CanvasRenderingContext2D, cam: number) {
    // Elliptical fog puffs drifting along the ground, no hard edges.
    for (let i = 0; i < 3; i += 1) {
      const y = VIEW_H - 22 - i * 14 + Math.sin(this.time / 80 + i) * 3;
      const a = 0.14 + 0.06 * Math.sin(this.time / 60 + i * 2);
      const period = 200 + i * 40;
      const shift = (cam * (0.9 + i * 0.2) + this.time * (0.25 + i * 0.05)) % period;
      for (let x = -period - shift; x < VIEW_W + period; x += period) {
        const k = Math.floor((x + shift) / period);
        const rx = 90 + rnd(i * 3 + k) * 60;
        const ry = 14 + rnd(i * 5 + k) * 8;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
        g.addColorStop(0, `rgba(120, 180, 240, ${a})`);
        g.addColorStop(0.6, `rgba(120, 180, 240, ${a * 0.5})`);
        g.addColorStop(1, "rgba(120, 180, 240, 0)");
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, ry / rx);
        ctx.translate(-x, -y);
        ctx.fillStyle = g;
        ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
        ctx.restore();
      }
    }
  }

  private drawVignette(ctx: CanvasRenderingContext2D) {
    const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.45, VIEW_W / 2, VIEW_H / 2, VIEW_W * 0.75);
    g.addColorStop(0, "rgba(2, 6, 18, 0)");
    g.addColorStop(1, "rgba(2, 6, 18, 0.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
