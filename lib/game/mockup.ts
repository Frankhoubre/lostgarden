/**
 * Visual mockup: one painted backdrop from the series, one controllable
 * Lanterne, and the lighting / atmosphere stack. Everything is drawn on a
 * 480x288 canvas with nearest-neighbour scaling.
 */
import { GameAudio, type SongName } from "./audio";
import type { InputName } from "./engine";

const VIEW_W = 480;
const VIEW_H = 288;

const GRAVITY = 0.46;
const MAX_FALL = 9.5;
const WALK = 3.1;
const JUMP_VY = -8.9;
const ACCEL = 0.45;
const AIR_ACCEL = 0.1;

/** Level layout (world units), following the road of episode 1. */
const LEVEL_W = 3900;
const GONG_X = 1600;
const TAVERN_X = 2330;
const ARENA_L = 3060;
const ARENA_R = ARENA_L + VIEW_W;
const GATE_X = ARENA_R + 90;
const BOSS_HP = 28;
const EYE_HP = 7;

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
type BossShot = { x: number; y: number; vx: number; vy: number; w: number; h: number; life: number; dead: boolean; kind: "bolt" | "shard" };
type Platform = { x: number; y: number; w: number; kind: PlatformKind };
type PlatformKind = "small" | "wide" | "log" | "ledge";
type PlatformMeta = Record<PlatformKind, { w: number; h: number; top: number }> & { gate: { w: number; h: number } };
type MachineMeta = { cell: { w: number; h: number }; walk: number; stomp: number; blast: number; die: number; idle: number };
type SpawnKind = "reptile" | "beetle" | "eye";
type Zone = { x: number; spawns: { kind: SpawnKind; dx: number; dir: 1 | -1 }[]; done: boolean };
type BossState = "asleep" | "enter" | "idle" | "walk" | "stomp" | "blast" | "stagger" | "dying" | "dead";
type Boss = { x: number; dir: 1 | -1; state: BossState; t: number; hp: number; flash: number; hits: number; vx: number; done: boolean; summoned: boolean };

/** Glowing beetles: small crawlers that burst into light. */
type Beetle = { x: number; dir: 1 | -1; t: number; state: "crawl" | "dead"; home: number; vx: number };
/** The one-eyed tentacle machine: hovers, curls up, slams down, then lies stunned. */
type EyeState = "hover" | "charge" | "slam" | "landed" | "rise" | "dying" | "dead";
type Eye = { x: number; y: number; dir: 1 | -1; state: EyeState; t: number; hp: number; flash: number; home: number };
/** Roots of the Source Tree, rising from the moss when something walks by. */
type RootState = "dormant" | "warn" | "rise" | "up" | "recede";
type Root = { x: number; state: RootState; t: number };
type ItemKind = "lily" | "light";
type Item = { x: number; y: number; vy: number; kind: ItemKind; t: number; dead: boolean; rest: number };
type Checkpoint = { x: number; kind: "gong" | "tavern"; done: boolean; t: number };
type Cell = { w: number; h: number };
type LoreMeta = {
  beetle: { n: number; cell: Cell };
  root: { n: number; cell: Cell };
  eye: { n: number; die: number; cell: Cell };
  serrure: { n: number; cell: Cell };
  pilgrim: { n: number; cell: Cell };
  gong: Cell;
  seal: Cell;
  tavern: Cell;
  lily: Cell;
  light: Cell;
  medallion: Cell;
};

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

let assetBase = "/game";

/** Where the generated assets live (default: the site's /game folder). */
export function setAssetBase(base: string) {
  assetBase = base;
}

function asset(name: string): string {
  return `${assetBase}/${name}`;
}

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
  private pSmall!: HTMLImageElement;
  private pWide!: HTMLImageElement;
  private pLog!: HTMLImageElement;
  private pLedge!: HTMLImageElement;
  private gateImg!: HTMLImageElement;
  private pMeta!: PlatformMeta;
  private mIdle!: HTMLImageElement;
  private mWalk!: HTMLImageElement;
  private mStomp!: HTMLImageElement;
  private mBlast!: HTMLImageElement;
  private mDie!: HTMLImageElement;
  private mMeta!: MachineMeta;
  private beetleSheet!: HTMLImageElement;
  private rootSheet!: HTMLImageElement;
  private eyeSheet!: HTMLImageElement;
  private eyeDieSheet!: HTMLImageElement;
  private serrureSheet!: HTMLImageElement;
  private pilgrimSheet!: HTMLImageElement;
  private gongImg!: HTMLImageElement;
  private sealImg!: HTMLImageElement;
  private tavernImg!: HTMLImageElement;
  private lilyImg!: HTMLImageElement;
  private lightImg!: HTMLImageElement;
  private medallionImg!: HTMLImageElement;
  private lore!: LoreMeta;
  private beetles: Beetle[] = [];
  private eyes: Eye[] = [];
  private roots: Root[] = [];
  private items: Item[] = [];
  private checkpoints: Checkpoint[] = [];
  private lilies = 0;
  private lastHurt = "";
  private lilyTotal = 0;
  private caption: { title: string; lines: string[]; t: number } | null = null;
  private song: SongName | null = null;
  private audio = new GameAudio();
  private platforms: Platform[] = [];
  private zones: Zone[] = [];
  private boss: Boss | null = null;
  private bossShots: BossShot[] = [];
  private checkpoint = 120;
  private cameraLock: { l: number; r: number } | null = null;
  private cleared = 0;
  private gateOpen = false;
  private onPlatform: Platform | null = null;
  private dropT = 0;
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
  private throwLow = false;
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
    const [bg, ground, walk, jump, idle, throwS, hurtS, metaRes, animRes, trunk, rWalk, rAttack, rDie, rMeta, pSmall, pWide, pLog, pLedge, gateImg, pMeta, mIdle, mWalk, mStomp, mBlast, mDie, mMeta] = await Promise.all([
      loadImage(asset("bg-forest.png")),
      loadImage(asset("ground-forest.png")),
      loadImage(asset("lanterne-walk.png")),
      loadImage(asset("lanterne-jump.png")),
      loadImage(asset("lanterne-idle.png")),
      loadImage(asset("lanterne-throw.png")),
      loadImage(asset("lanterne-hurt.png")),
      fetch(asset("bg-forest.json")).then((r) => r.json() as Promise<BgMeta>),
      fetch(asset("lanterne-anim.json")).then((r) => r.json() as Promise<AnimMeta>),
      loadImage(asset("fg-trunk.png")).catch(() => null),
      loadImage(asset("reptile-walk.png")),
      loadImage(asset("reptile-attack.png")),
      loadImage(asset("reptile-die.png")),
      fetch(asset("reptile-anim.json")).then((r) => r.json() as Promise<ReptileMeta>),
      loadImage(asset("platform-small.png")),
      loadImage(asset("platform-wide.png")),
      loadImage(asset("platform-log.png")),
      loadImage(asset("platform-ledge.png")),
      loadImage(asset("gate.png")),
      fetch(asset("level-assets.json")).then((r) => r.json() as Promise<PlatformMeta>),
      loadImage(asset("machine-idle.png")),
      loadImage(asset("machine-walk.png")),
      loadImage(asset("machine-stomp.png")),
      loadImage(asset("machine-blast.png")),
      loadImage(asset("machine-die.png")),
      fetch(asset("machine-anim.json")).then((r) => r.json() as Promise<MachineMeta>),
    ]);
    const [beetleSheet, rootSheet, eyeSheet, eyeDieSheet, serrureSheet, pilgrimSheet, gongImg, sealImg, tavernImg, lilyImg, lightImg, medallionImg, lore] = await Promise.all([
      loadImage(asset("fx-beetle.png")),
      loadImage(asset("fx-root.png")),
      loadImage(asset("eye-anim.png")),
      loadImage(asset("eye-die.png")),
      loadImage(asset("serrure-idle.png")),
      loadImage(asset("pilgrim-idle.png")),
      loadImage(asset("prop-gong.png")),
      loadImage(asset("prop-seal.png")),
      loadImage(asset("prop-tavern.png")),
      loadImage(asset("item-lily.png")),
      loadImage(asset("item-light.png")),
      loadImage(asset("item-medallion.png")),
      fetch(asset("lore-assets.json")).then((r) => r.json() as Promise<LoreMeta>),
    ]);
    this.beetleSheet = beetleSheet;
    this.rootSheet = rootSheet;
    this.eyeSheet = eyeSheet;
    this.eyeDieSheet = eyeDieSheet;
    this.serrureSheet = serrureSheet;
    this.pilgrimSheet = pilgrimSheet;
    this.gongImg = gongImg;
    this.sealImg = sealImg;
    this.tavernImg = tavernImg;
    this.lilyImg = lilyImg;
    this.lightImg = lightImg;
    this.medallionImg = medallionImg;
    this.lore = lore;
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
    this.pSmall = pSmall;
    this.pWide = pWide;
    this.pLog = pLog;
    this.pLedge = pLedge;
    this.gateImg = gateImg;
    this.pMeta = pMeta;
    this.mIdle = mIdle;
    this.mWalk = mWalk;
    this.mStomp = mStomp;
    this.mBlast = mBlast;
    this.mDie = mDie;
    this.mMeta = mMeta;
    this.trunk = trunk;
    this.meta = metaRes;
    // The near ground strip sits at the bottom; its walkable line is the feet line.
    this.groundY = VIEW_H - this.meta.ground.height + 14;
    this.feetY = this.groundY + this.meta.ground.top;
    this.buildLevel();
    this.resetLevel();
    this.music("forest");
    this.ready = true;
  }

  private music(name: SongName | null) {
    if (this.song === name) return;
    this.song = name;
    if (name) this.audio.playSong(name);
    else this.audio.stopSong();
  }

  /**
   * The level follows episode 1: the blue forest and its pale reptiles, the
   * one-eyed machine over the mushroom ledges, the pilgrims' gong, the roots
   * of the Source Tree, Serrure's tavern, then the Machine's arena and the gate.
   */
  private buildLevel() {
    const g = this.feetY;
    const P = (x: number, dy: number, kind: PlatformKind): Platform => ({ x, y: g - dy, w: this.pMeta[kind].w, kind });
    this.platforms = [
      P(520, 62, "small"),
      P(640, 118, "small"),
      P(1010, 70, "log"),
      P(1180, 130, "small"),
      P(1330, 72, "ledge"),
      P(1850, 70, "small"),
      P(2070, 118, "small"),
      P(2540, 64, "small"),
      P(2700, 120, "ledge"),
      P(2900, 70, "log"),
      P(ARENA_L + 60, 78, "small"),
      P(ARENA_R - 130, 78, "small"),
    ];
    const R = (kind: SpawnKind, dx: number, dir: 1 | -1) => ({ kind, dx, dir });
    this.zones = [
      { x: 620, spawns: [R("reptile", 360, -1), R("reptile", 520, -1)], done: false },
      { x: 960, spawns: [R("beetle", 200, -1), R("beetle", 320, 1), R("eye", 330, -1)], done: false },
      { x: 1700, spawns: [R("beetle", 300, -1), R("beetle", 390, 1), R("beetle", 470, -1), R("reptile", 420, -1)], done: false },
      { x: 2440, spawns: [R("beetle", 120, -1), R("beetle", 200, 1), R("reptile", 340, -1), R("eye", 420, -1), R("reptile", 560, -1)], done: false },
    ];
    this.roots = [1760, 1990, 2200, 2680, 2840].map((x) => ({ x, state: "dormant" as RootState, t: 0 }));
    this.checkpoints = [
      { x: GONG_X - 40, kind: "gong", done: false, t: 0 },
      { x: TAVERN_X - 70, kind: "tavern", done: false, t: 0 },
    ];
  }

  private placeItems() {
    const at = (x: number, y: number, kind: ItemKind): Item => ({ x, y, vy: 0, kind, t: 0, dead: false, rest: y });
    const onPf = (x: number) => this.platforms.find((pf) => x >= pf.x && x <= pf.x + pf.w)?.y ?? this.feetY;
    this.items = [
      at(380, this.feetY, "lily"),
      at(679, onPf(679), "lily"),
      at(1219, onPf(1219), "lily"),
      at(1370, onPf(1370), "lily"),
      at(2109, onPf(2109), "lily"),
      at(2739, onPf(2739), "lily"),
      at(TAVERN_X + 44, this.feetY, "light"),
    ];
    this.lilyTotal = this.items.filter((it) => it.kind === "lily").length;
  }

  private resetLevel() {
    this.px = 120;
    this.py = this.feetY;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.hp = PLAYER_HP;
    this.checkpoint = 120;
    this.reptiles = [];
    this.beetles = [];
    this.eyes = [];
    this.shots = [];
    this.bossShots = [];
    this.boss = { x: ARENA_R - 150, dir: -1, state: "asleep", t: 0, hp: BOSS_HP, flash: 0, hits: 0, vx: 0, done: false, summoned: false };
    this.cameraLock = null;
    this.cameraX = 0;
    this.cleared = 0;
    this.gateOpen = false;
    this.deadT = 0;
    this.invuln = 60;
    this.lilies = 0;
    this.caption = null;
    for (const z of this.zones) z.done = false;
    for (const r of this.roots) {
      r.state = "dormant";
      r.t = 0;
    }
    for (const c of this.checkpoints) {
      c.done = false;
      c.t = 0;
    }
    this.placeItems();
  }

  private spawn(kind: SpawnKind, x: number, dir: 1 | -1) {
    if (kind === "reptile") this.spawnReptile(x, dir);
    else if (kind === "beetle") this.beetles.push({ x, dir, t: Math.floor(Math.random() * 60), state: "crawl", home: x, vx: 0 });
    else this.eyes.push({ x, y: this.feetY - 16, dir, state: "hover", t: 0, hp: EYE_HP, flash: 0, home: x });
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
      boss: this.boss ? { x: Math.round(this.boss.x), state: this.boss.state, hp: this.boss.hp } : null,
      beetles: this.beetles.map((b) => ({ x: Math.round(b.x), state: b.state })),
      eyes: this.eyes.map((e) => ({ x: Math.round(e.x), y: Math.round(e.y), state: e.state, hp: e.hp })),
      roots: this.roots.map((r) => ({ x: r.x, state: r.state })),
      items: this.items.length,
      lilies: this.lilies,
      checkpoints: this.checkpoints.map((c) => c.done),
      caption: this.caption?.title ?? null,
      lastHurt: this.lastHurt,
      cleared: this.cleared,
      gateOpen: this.gateOpen,
      checkpoint: this.checkpoint,
    };
  }

  debugKillBoss() {
    if (this.boss) this.boss.hp = 1;
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
    if (this.cleared > 0) {
      this.cleared += 1;
      this.tickParticlesOnly();
      if (this.cleared > 90 && (this.pressed.has("throw") || this.pressed.has("jump"))) {
        this.resetLevel();
        this.music("forest");
      }
      this.pressed.clear();
      return;
    }
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
      this.vx += (target - this.vx) * AIR_ACCEL;
    }
    if (left && !right) this.dir = -1;
    if (right && !left) this.dir = 1;

    if (this.dropT > 0) this.dropT -= 1;
    if (this.pressed.has("jump") && this.onGround && !busy) {
      if (this.held.has("down") && this.onPlatform) {
        // Drop through the platform.
        this.dropT = 12;
        this.onGround = false;
        this.py += 2;
        this.vy = 1;
      } else {
        this.vy = JUMP_VY;
        this.onGround = false;
        this.jumpT = 0;
        this.puff(6, "#7fa9b8", 1.4);
        this.audio.sfx("jump");
      }
    }
    if (!this.onGround) this.jumpT += 1;
    if (this.throwCooldown > 0) this.throwCooldown -= 1;
    if (this.pressed.has("throw") && this.throwCooldown <= 0 && !busy) {
      this.throwT = 1;
      this.throwCooldown = 26;
      // Holding down when the button is pressed throws low, along the moss: that is how you reach the beetles.
      this.throwLow = this.held.has("down");
    }
    if (this.throwT > 0) {
      this.throwT += 1;
      // Release the glimmer on the third frame of the throw.
      if (this.throwT === 9) {
        const low = this.throwLow;
        this.shots.push({ x: this.px + this.dir * 22, y: this.py - (low ? 16 : 52), vx: this.dir * 5.2, life: 90, dead: false });
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
    this.tickBeetles();
    this.tickEyes();
    this.tickRoots();
    this.tickItems();
    this.tickCheckpoints();
    this.tickZones();
    this.tickBoss();
    this.tickBossShots();
    this.tickGate();
    if (this.caption && this.caption.t > 0) this.caption.t -= 1;

    this.vy = Math.min(MAX_FALL, this.vy + GRAVITY);
    const prevFeet = this.py;
    this.px += this.vx;
    this.py += this.vy;
    const wasGround = this.onGround;
    this.onGround = false;
    this.onPlatform = null;
    if (this.py >= feetY) {
      this.py = feetY;
      this.vy = 0;
      this.onGround = true;
    } else if (this.vy >= 0 && this.dropT <= 0) {
      // One-way platforms: land only when falling onto the top edge.
      for (const pf of this.platforms) {
        if (this.px < pf.x + 6 || this.px > pf.x + pf.w - 6) continue;
        if (prevFeet <= pf.y + 0.5 && this.py >= pf.y) {
          this.py = pf.y;
          this.vy = 0;
          this.onGround = true;
          this.onPlatform = pf;
          break;
        }
      }
    }
    if (!wasGround && this.onGround) {
      this.landT = 8;
      this.puff(8, "#7fa9b8", 1.8);
    }
    if (this.landT > 0) this.landT -= 1;
    const minX = this.cameraLock ? this.cameraLock.l + 16 : 40;
    const maxX = this.cameraLock ? this.cameraLock.r - 16 : LEVEL_W - 40;
    if (this.px < minX) {
      this.px = minX;
      this.vx = 0;
    }
    if (this.px > maxX) {
      this.px = maxX;
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

    // Camera: leads the player in its facing direction, eases smoothly; locked in the arena.
    const targetCam = this.cameraLock ? this.cameraLock.l : this.px - VIEW_W / 2 + this.dir * 40;
    this.cameraX += (targetCam - this.cameraX) * 0.08;
    if (this.cameraX < 0) this.cameraX = 0;
    if (this.cameraX > LEVEL_W - VIEW_W) this.cameraX = LEVEL_W - VIEW_W;

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
    this.tickParticlesOnly();
    this.pressed.clear();
  }

  private tickParticlesOnly() {
    for (const pt of this.particles) {
      pt.x += pt.vx + Math.sin((this.time + pt.max) / 50) * 0.05;
      pt.y += pt.vy;
      if (pt.max <= 36) pt.vy += 0.08;
      pt.life -= 1;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0 && pt.y < VIEW_H + 10);
  }

  private tickZones() {
    for (const z of this.zones) {
      if (z.done || this.px < z.x) continue;
      z.done = true;
      this.checkpoint = Math.max(this.checkpoint, z.x - 60);
      for (const sp of z.spawns) this.spawn(sp.kind, z.x + sp.dx, sp.dir);
    }
    // Entering the arena wakes the Machine.
    const b = this.boss;
    if (b && b.state === "asleep" && this.px > ARENA_L + 40) {
      b.state = "enter";
      b.t = 0;
      b.x = ARENA_R + 120;
      this.cameraLock = { l: ARENA_L, r: ARENA_R };
      this.checkpoint = ARENA_L + 40;
      this.reptiles = this.reptiles.filter((r) => r.state === "dead");
      this.beetles = [];
      this.eyes = this.eyes.filter((e) => e.state === "dead");
      this.caption = null;
      this.music("boss");
      this.audio.sfx("boss");
      this.shake = 12;
    }
  }

  private tickGate() {
    if (!this.gateOpen || this.cleared > 0) return;
    if (Math.abs(this.px - GATE_X) < 26 && this.onGround) {
      this.cleared = 1;
      this.music(null);
      this.audio.sfx("clear");
      this.burst(GATE_X, this.feetY - 70, 40, "#bff4ff", 2.5);
    }
  }

  private respawn() {
    this.deadT = 0;
    this.hp = PLAYER_HP;
    this.invuln = 90;
    this.hurtT = 0;
    this.vx = 0;
    this.vy = 0;
    this.shots = [];
    this.bossShots = [];
    this.px = this.checkpoint;
    this.py = this.feetY;
    this.cameraX = Math.max(0, this.px - VIEW_W / 2);
    // Living creatures of the current stretch come back to their posts.
    this.reptiles = this.reptiles.filter((r) => r.state === "dead");
    this.beetles = [];
    this.eyes = this.eyes.filter((e) => e.state === "dead");
    this.caption = null;
    for (const r of this.roots) {
      r.state = "dormant";
      r.t = 0;
    }
    const zone = [...this.zones].reverse().find((z) => z.done);
    if (zone && this.boss && this.boss.state === "asleep" && zone.x + 200 > this.checkpoint) {
      for (const sp of zone.spawns) this.spawn(sp.kind, zone.x + sp.dx, sp.dir);
    }
    if (this.boss && this.boss.state !== "asleep" && this.boss.state !== "dead") {
      // Died to the Machine: it settles back at the far side, wounds kept.
      this.boss.state = "idle";
      this.boss.t = 0;
      this.boss.x = ARENA_R - 150;
      this.boss.dir = -1;
      this.px = ARENA_L + 40;
      this.cameraLock = { l: ARENA_L, r: ARENA_R };
      this.cameraX = ARENA_L;
      this.music("boss");
    } else {
      this.music("forest");
    }
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
      for (const be of this.beetles) {
        if (be.state !== "crawl" || sh.dead) continue;
        if (Math.abs(sh.x - be.x) < 22 && sh.y > this.feetY - 44 && sh.y < this.feetY + 2) {
          sh.dead = true;
          this.killBeetle(be);
        }
      }
      for (const e of this.eyes) {
        if (sh.dead || e.state === "dead" || e.state === "dying") continue;
        const ch = this.lore.eye.cell.h;
        if (Math.abs(sh.x - e.x) < 36 && sh.y > e.y - ch + 10 && sh.y < e.y) {
          sh.dead = true;
          this.hitEye(e);
          this.burst(sh.x, sh.y, 14, "#fff1a8", 2.2);
        }
      }
      const b = this.boss;
      if (b && !sh.dead && (b.state === "idle" || b.state === "walk" || b.state === "stomp" || b.state === "blast" || b.state === "stagger")) {
        const bx0 = b.x - 70;
        const bx1 = b.x + 70;
        if (sh.x > bx0 && sh.x < bx1 && sh.y > this.feetY - 165 && sh.y < this.feetY) {
          sh.dead = true;
          this.hitBoss(b);
          this.burst(sh.x, sh.y, 16, "#fff1a8", 2.4);
        }
      }
    }
    this.shots = this.shots.filter((sh) => !sh.dead);
  }

  /* ---------------- the Machine ---------------- */

  private hitBoss(b: Boss) {
    b.hp -= 1;
    b.flash = 6;
    b.hits += 1;
    this.hitStop = 2;
    this.audio.sfx("bossHit");
    if (!b.summoned && b.hp <= BOSS_HP / 2) {
      // Wounded, the Machine shakes the moss: beetles come crawling out of it.
      b.summoned = true;
      this.spawn("beetle", ARENA_L + 40, 1);
      this.spawn("beetle", ARENA_R - 40, -1);
      this.puffAt(ARENA_L + 40, this.feetY, 8, "#8fe3ff", 1.6);
      this.puffAt(ARENA_R - 40, this.feetY, 8, "#8fe3ff", 1.6);
    }
    if (b.hp <= 0) {
      b.state = "dying";
      b.t = 0;
      b.vx = 0;
      this.bossShots = [];
      this.beetles = [];
      this.music(null);
      this.audio.sfx("boss");
      this.shake = 14;
      return;
    }
    if (b.hits % 7 === 0 && b.state !== "stagger") {
      b.state = "stagger";
      b.t = 0;
      b.vx = 0;
      this.audio.sfx("enemy");
    }
  }

  private tickBoss() {
    const b = this.boss;
    if (!b || b.state === "asleep" || b.state === "dead") return;
    b.t += 1;
    if (b.flash > 0) b.flash -= 1;
    const dist = this.px - b.x;
    const front = b.x + b.dir * 84;
    switch (b.state) {
      case "enter": {
        b.vx = -1.1;
        if (b.x < ARENA_R - 150) {
          b.state = "idle";
          b.t = 0;
          b.vx = 0;
          this.shake = 8;
        }
        break;
      }
      case "idle": {
        b.vx = 0;
        b.dir = dist > 0 ? 1 : -1;
        if (b.t > 40) {
          const far = Math.abs(dist) > 190;
          const roll = Math.random();
          if (Math.abs(dist) < 150 && roll < 0.7) this.bossStart(b, "stomp");
          else if (far && roll < 0.55) this.bossStart(b, "blast");
          else if (roll < 0.35) this.bossStart(b, "blast");
          else this.bossStart(b, "walk");
        }
        break;
      }
      case "walk": {
        b.dir = dist > 0 ? 1 : -1;
        b.vx = b.dir * 0.95;
        if (b.t % 22 === 0) {
          this.shake = 3;
          this.puffAt(b.x - b.dir * 40, this.feetY, 5, "#6f95a3", 1.4);
        }
        if (Math.abs(dist) < 130 || b.t > 110) {
          b.state = "idle";
          b.t = 26;
          b.vx = 0;
        }
        break;
      }
      case "stomp": {
        // Rear (0-1) for 34 ticks, slam (2) at 34, settle (3).
        b.vx = 0;
        if (b.t === 34) {
          this.shake = 14;
          this.audio.sfx("boss");
          this.puffAt(front, this.feetY, 18, "#8fa9b8", 2.6);
          // Claw impact in front, then two shockwave shards racing along the ground.
          if (Math.abs(this.px - front) < 60 && this.py > this.feetY - 30) this.hurtPlayer(b.x, "stomp");
          this.bossShots.push({ x: front, y: this.feetY - 10, vx: b.dir * 3.6, vy: 0, w: 14, h: 10, life: 140, dead: false, kind: "shard" });
          this.bossShots.push({ x: b.x - b.dir * 60, y: this.feetY - 10, vx: -b.dir * 3.2, vy: 0, w: 14, h: 10, life: 140, dead: false, kind: "shard" });
        }
        if (b.t > 70) {
          b.state = "idle";
          b.t = 10;
        }
        break;
      }
      case "blast": {
        // Charge (0-1) for 44 ticks with the eyes swelling, fire (2) at 44.
        b.vx = 0;
        if (b.t === 44) {
          this.audio.sfx("throw");
          this.shake = 6;
          const ey = this.feetY - 118;
          this.bossShots.push({ x: b.x + b.dir * 70, y: ey, vx: b.dir * 5.4, vy: 0.55, w: 36, h: 10, life: 120, dead: false, kind: "bolt" });
          this.burst(b.x + b.dir * 70, ey, 14, "#ffd27a", 2.5);
        }
        if (b.t > 80) {
          b.state = "idle";
          b.t = 0;
        }
        break;
      }
      case "stagger": {
        b.vx = 0;
        if (b.t > 50) {
          b.state = "idle";
          b.t = 20;
        }
        break;
      }
      case "dying": {
        b.vx = 0;
        if (b.t % 9 === 0) {
          this.burst(b.x + (Math.random() - 0.5) * 140, this.feetY - 30 - Math.random() * 120, 12, Math.random() < 0.5 ? "#ffd27a" : "#ff5a2a", 2.8);
          this.audio.sfx("enemy");
          this.shake = 6;
        }
        if (b.t > 130) {
          b.state = "dead";
          b.t = 0;
          this.gateOpen = true;
          this.cameraLock = null;
          this.audio.sfx("clear");
          this.music("lullaby");
          this.burst(b.x, this.feetY - 80, 60, "#fff1a8", 4);
          this.shake = 16;
        }
        break;
      }
      default:
        break;
    }
    b.x += b.vx;
    b.x = Math.max(ARENA_L + 90, Math.min(ARENA_R - 90, b.x));
  }

  private bossStart(b: Boss, state: BossState) {
    b.state = state;
    b.t = 0;
    b.dir = this.px > b.x ? 1 : -1;
  }

  private tickBossShots() {
    for (const s of this.bossShots) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.kind === "shard" && s.y > this.feetY - 10) s.y = this.feetY - 10;
      if (s.kind === "bolt" && s.y > this.feetY - 24) s.vy = 0;
      s.life -= 1;
      if (s.life <= 0 || s.x < this.cameraX - 60 || s.x > this.cameraX + VIEW_W + 60) s.dead = true;
      if (this.time % 3 === 0) {
        this.particles.push({ x: s.x, y: s.y + (Math.random() - 0.5) * s.h, vx: -s.vx * 0.1, vy: (Math.random() - 0.5) * 0.4, life: 12, max: 12, color: s.kind === "bolt" ? "#ffd27a" : "#9fb0bd", size: s.kind === "bolt" ? 2 : 1, parallax: 1 });
      }
      // Player box: 16 wide, 84 tall above the feet.
      const px0 = this.px - 8;
      const px1 = this.px + 8;
      const py0 = this.py - 84;
      if (!s.dead && s.x + s.w / 2 > px0 && s.x - s.w / 2 < px1 && s.y + s.h / 2 > py0 && s.y - s.h / 2 < this.py) {
        this.hurtPlayer(s.x, s.kind);
        s.dead = true;
      }
    }
    this.bossShots = this.bossShots.filter((s) => !s.dead);
  }

  private puffAt(x: number, y: number, count: number, color: string, speed: number) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.PI + Math.random() * Math.PI;
      const sp = (0.4 + Math.random()) * speed;
      this.particles.push({ x: x + (Math.random() - 0.5) * 30, y: y - 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, life: 22 + Math.random() * 14, max: 36, color, size: Math.random() < 0.4 ? 2 : 1, parallax: 1 });
    }
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

  private hurtPlayer(from: number, source = "?") {
    if (this.invuln > 0 || this.deadT > 0) return;
    this.hp -= 1;
    this.lastHurt = `${source}@${Math.round(from)}`;
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
          if (Math.abs(dist(r)) < 60 && this.onGround && !this.onPlatform && r.t > 20) {
            r.state = "attack";
            r.t = 0;
            r.hitDone = false;
            r.vx = 0;
          } else if (Math.abs(dist(r)) > 320 || Math.abs(r.x - r.home) > 300 || this.deadT > 0) {
            // Lost the scent, or strayed too far from its post: back to prowling.
            r.state = "prowl";
            r.t = 0;
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
              this.hurtPlayer(r.x, "reptile");
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
      // Nothing hunts under Serrure's roof.
      if (r.state !== "dead" && r.home < TAVERN_X && r.x > TAVERN_X - 180) {
        r.x = TAVERN_X - 180;
        if (r.state === "chase") {
          r.state = "prowl";
          r.t = 0;
          r.dir = -1;
        }
      }
    }
    // Bodies fade away after a while.
    this.reptiles = this.reptiles.filter((r) => !(r.state === "dead" && r.t > 420));
  }


  /* ---------------- episode 1 creatures ---------------- */

  private playerBoxHits(x0: number, x1: number, y0: number, y1: number): boolean {
    // Player box: 16 wide, 84 tall above the feet.
    return this.px + 8 > x0 && this.px - 8 < x1 && this.py > y0 && this.py - 84 < y1;
  }

  private killBeetle(be: Beetle) {
    be.state = "dead";
    be.t = 0;
    be.vx = 0;
    this.hitStop = 2;
    this.audio.sfx("die");
    this.burst(be.x, this.feetY - 16, 18, "#8fe3ff", 2.4);
    this.burst(be.x, this.feetY - 16, 6, "#ffffff", 1.4);
    // Its light lingers: one beetle in three leaves a glimmer that mends the armour.
    if (Math.random() < 0.34 && this.hp < PLAYER_HP) this.items.push({ x: be.x, y: this.feetY - 20, vy: -2.6, kind: "light", t: 0, dead: false, rest: this.feetY });
  }

  private tickBeetles() {
    for (const be of this.beetles) {
      be.t += 1;
      if (be.state === "dead") continue;
      const lock = this.cameraLock;
      const minX = lock ? lock.l + 20 : 30;
      const maxX = lock ? lock.r - 20 : LEVEL_W - 30;
      if (be.t % 150 === 0) be.dir = Math.random() < 0.5 ? -1 : 1;
      if (Math.abs(be.x - be.home) > 130) be.dir = be.x > be.home ? -1 : 1;
      if (be.x < minX) be.dir = 1;
      if (be.x > maxX) be.dir = -1;
      // They creep, then scurry when the lantern comes close.
      const near = Math.abs(this.px - be.x) < 90 && this.deadT === 0;
      if (near && be.t % 90 < 45) be.dir = this.px > be.x ? 1 : -1;
      be.vx = be.dir * (near ? 1.0 : 0.6);
      be.x += be.vx;
      // Stomp: land on its shell and bounce off.
      if (this.vy > 0 && this.invuln === 0 && Math.abs(this.px - be.x) < 20 && this.py > this.feetY - 36 && this.py < this.feetY - 6) {
        this.killBeetle(be);
        this.vy = -5.6;
        this.onGround = false;
        this.puffAt(be.x, this.feetY - 20, 4, "#bff4ff", 1.2);
        continue;
      }
      if (this.playerBoxHits(be.x - 14, be.x + 14, this.feetY - 28, this.feetY)) this.hurtPlayer(be.x, "beetle");
    }
    this.beetles = this.beetles.filter((be) => !(be.state === "dead" && be.t > 16));
  }

  private hitEye(e: Eye) {
    e.hp -= 1;
    e.flash = 6;
    this.hitStop = 2;
    this.shake = 4;
    if (e.hp <= 0) {
      e.state = "dying";
      e.t = 0;
      this.audio.sfx("die");
      this.burst(e.x, e.y - 70, 26, "#ffd27a", 2.8);
      return;
    }
    this.audio.sfx("enemy");
    if (e.state === "landed") e.t = Math.min(e.t, 30);
  }

  private tickEyes() {
    const ch = this.lore.eye.cell.h;
    for (const e of this.eyes) {
      e.t += 1;
      if (e.flash > 0) e.flash -= 1;
      const dist = this.px - e.x;
      const hoverY = this.feetY - 16 + Math.sin(e.t / 22) * 6;
      switch (e.state) {
        case "hover": {
          e.dir = dist > 0 ? 1 : -1;
          // Drifts after the lantern, on its leash.
          const target = Math.max(e.home - 160, Math.min(e.home + 160, this.px));
          e.x += Math.max(-0.7, Math.min(0.7, (target - e.x) * 0.02));
          e.y += (hoverY - e.y) * 0.1;
          if (e.t > 80 && Math.abs(dist) < 46 && this.deadT === 0) {
            e.state = "charge";
            e.t = 0;
            this.audio.sfx("timer");
          }
          break;
        }
        case "charge": {
          // Curls up and shivers for most of a second: that is the tell.
          e.y += (this.feetY - 56 - e.y) * 0.1;
          e.x += Math.sin(e.t * 1.7) * 0.8;
          if (e.t > 44) {
            e.state = "slam";
            e.t = 0;
          }
          break;
        }
        case "slam": {
          e.y += 9;
          if (e.y >= this.feetY) {
            e.y = this.feetY;
            e.state = "landed";
            e.t = 0;
            this.shake = 10;
            this.audio.sfx("boss");
            this.puffAt(e.x, this.feetY, 16, "#8fa9b8", 2.4);
            if (Math.abs(dist) < 40 && this.py > this.feetY - 30) this.hurtPlayer(e.x, "slam");
            this.bossShots.push({ x: e.x + 30, y: this.feetY - 10, vx: 3.2, vy: 0, w: 14, h: 10, life: 70, dead: false, kind: "shard" });
            this.bossShots.push({ x: e.x - 30, y: this.feetY - 10, vx: -3.2, vy: 0, w: 14, h: 10, life: 70, dead: false, kind: "shard" });
          }
          break;
        }
        case "landed": {
          // Stunned on the moss: hit it now. Its claws still cut.
          if (e.t > 4 && this.playerBoxHits(e.x - 30, e.x + 30, this.feetY - 60, this.feetY)) this.hurtPlayer(e.x, "claws");
          if (e.t > 62) {
            e.state = "rise";
            e.t = 0;
          }
          break;
        }
        case "rise": {
          e.y -= 3;
          if (e.y <= hoverY) {
            e.state = "hover";
            e.t = 20;
          }
          break;
        }
        case "dying": {
          e.y = Math.min(this.feetY, e.y + 3);
          if (e.t % 8 === 0) {
            this.burst(e.x + (Math.random() - 0.5) * 60, e.y - 20 - Math.random() * (ch - 40), 8, Math.random() < 0.5 ? "#ffd27a" : "#ff5a2a", 2.2);
            this.audio.sfx("enemy");
          }
          if (e.t > 48) {
            e.state = "dead";
            e.t = 0;
            e.y = this.feetY;
            this.shake = 6;
            this.burst(e.x, this.feetY - 30, 24, "#9fb0bd", 2.6);
          }
          break;
        }
        default:
          break;
      }
    }
    this.eyes = this.eyes.filter((e) => !(e.state === "dead" && e.t > 420));
  }

  private tickRoots() {
    for (const r of this.roots) {
      r.t += 1;
      switch (r.state) {
        case "dormant":
          if (r.t > 70 && Math.abs(this.px - r.x) < 150 && this.deadT === 0) {
            r.state = "warn";
            r.t = 0;
          }
          break;
        case "warn":
          // The moss trembles for a moment before the root breaks through.
          if (r.t % 4 === 0) this.puffAt(r.x, this.feetY, 1, "#6f95a3", 0.9);
          if (r.t > 40) {
            r.state = "rise";
            r.t = 0;
            this.audio.sfx("armor");
            this.puffAt(r.x, this.feetY, 10, "#6f95a3", 1.8);
          }
          break;
        case "rise":
          if (r.t > 4 && this.playerBoxHits(r.x - 20, r.x + 20, this.feetY - 70, this.feetY)) this.hurtPlayer(r.x, "root");
          if (r.t > 9) {
            r.state = "up";
            r.t = 0;
          }
          break;
        case "up":
          if (this.playerBoxHits(r.x - 22, r.x + 22, this.feetY - 92, this.feetY)) this.hurtPlayer(r.x, "root");
          if (r.t > 50) {
            r.state = "recede";
            r.t = 0;
          }
          break;
        case "recede":
          if (r.t > 16) {
            r.state = "dormant";
            r.t = 0;
          }
          break;
        default:
          break;
      }
    }
  }

  private tickItems() {
    for (const it of this.items) {
      it.t += 1;
      if (it.y < it.rest || it.vy !== 0) {
        it.vy = Math.min(4, it.vy + 0.25);
        it.y += it.vy;
        if (it.y >= it.rest) {
          it.y = it.rest;
          it.vy = 0;
        }
      }
      if (this.deadT > 0) continue;
      if (Math.abs(this.px - it.x) < 14 && it.y > this.py - 90 && it.y - 22 < this.py + 2) {
        it.dead = true;
        if (it.kind === "lily") {
          this.lilies += 1;
          this.audio.sfx("item");
          this.burst(it.x, it.y - 10, 10, "#ffffff", 1.6);
        } else {
          this.hp = Math.min(PLAYER_HP, this.hp + 1);
          this.flare = 40;
          this.audio.sfx("chest");
          this.burst(it.x, it.y - 10, 16, "#fff1a8", 2);
        }
      }
    }
    this.items = this.items.filter((it) => !it.dead);
  }

  private tickCheckpoints() {
    for (const c of this.checkpoints) {
      if (c.done) {
        c.t += 1;
        continue;
      }
      if (this.px < c.x) continue;
      c.done = true;
      c.t = 0;
      this.checkpoint = c.x;
      this.hp = PLAYER_HP;
      this.flare = 50;
      if (c.kind === "gong") {
        this.audio.sfx("bell");
        this.shake = 4;
        this.burst(GONG_X, this.feetY - 60, 24, "#8fe3ff", 2.2);
        this.caption = { title: "LES PELERINS", lines: ["Le gong résonne dans l'abîme.", "L'armure se souvient d'elle-même."], t: 260 };
      } else {
        this.audio.sfx("checkpoint");
        this.burst(TAVERN_X - 20, this.feetY - 60, 16, "#ffd27a", 1.8);
        this.caption = { title: "SERRURE", lines: ["Oh ! Encore un chevalier !", "Suis la lumière bleue de ton pendentif,", "et tu trouveras Rose."], t: 420 };
      }
    }
    // The tavern has its own hush; the forest takes over again on the way out.
    const tavern = this.checkpoints[1];
    if (this.boss && this.boss.state === "asleep" && this.deadT === 0) {
      const inside = tavern.done && this.px > TAVERN_X - 120 && this.px < TAVERN_X + 150;
      this.music(inside ? "lullaby" : "forest");
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
    this.drawGate(cam);
    this.drawProps(cam);
    this.drawPlatforms(cam);

    this.drawParticles(cam, (p) => p.parallax < 1);
    for (const r of this.reptiles) if (r.state === "dead") this.drawReptile(r, cam);
    for (const e of this.eyes) if (e.state === "dead") this.drawEye(e, cam);
    if (this.boss && (this.boss.state === "dead" || this.boss.state === "dying")) this.drawBoss(this.boss, cam);
    this.drawItems(cam);
    for (const be of this.beetles) this.drawBeetle(be, cam);
    this.drawPlayer(cam);
    for (const r of this.reptiles) if (r.state !== "dead") this.drawReptile(r, cam);
    for (const e of this.eyes) if (e.state !== "dead") this.drawEye(e, cam);
    for (const r of this.roots) this.drawRoot(r, cam);
    if (this.boss && this.boss.state !== "dead" && this.boss.state !== "dying" && this.boss.state !== "asleep") this.drawBoss(this.boss, cam);
    this.drawShots(cam);
    this.drawBossShots(cam);
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
    // Lilies gathered along the road.
    const li = this.lore.lily;
    ctx.drawImage(this.lilyImg, VIEW_W - 12 - li.w - 30, 6);
    this.text(`${this.lilies}/${this.lilyTotal}`, VIEW_W - 10, 12, "#d8d2c2", 8, "right");
    // Dialogue or caption box.
    if (this.caption && this.caption.t > 0 && this.deadT === 0) {
      const cap = this.caption;
      const fade = Math.min(1, cap.t / 20, (cap.t > 400 ? 420 - cap.t : 20) / 20);
      const h = 18 + cap.lines.length * 11;
      const y = VIEW_H - h - 30;
      ctx.globalAlpha = Math.max(0, fade);
      ctx.fillStyle = "rgba(2, 6, 18, 0.82)";
      ctx.fillRect(24, y, VIEW_W - 48, h);
      ctx.fillStyle = "#3a5c7a";
      ctx.fillRect(24, y, VIEW_W - 48, 1);
      ctx.fillRect(24, y + h - 1, VIEW_W - 48, 1);
      this.text(cap.title, 34, y + 6, "#8fe3ff", 7, "left");
      cap.lines.forEach((line, i) => this.text(line, 34, y + 17 + i * 11, "#eef1f5", 7, "left"));
      ctx.globalAlpha = 1;
    }
    // Boss bar.
    const b = this.boss;
    if (b && b.state !== "asleep" && b.state !== "dead" && b.state !== "enter") {
      const w = 200;
      const x = VIEW_W / 2 - w / 2;
      ctx.fillStyle = "rgba(2, 6, 18, 0.75)";
      ctx.fillRect(x - 2, VIEW_H - 24, w + 4, 12);
      ctx.fillStyle = "#4a1616";
      ctx.fillRect(x, VIEW_H - 22, w, 8);
      const frac = Math.max(0, b.hp) / BOSS_HP;
      ctx.fillStyle = "#ff7a2a";
      ctx.fillRect(x, VIEW_H - 22, Math.round(w * frac), 8);
      ctx.fillStyle = "#ffd27a";
      ctx.fillRect(x, VIEW_H - 22, Math.round(w * frac), 2);
      this.text("LA MACHINE", VIEW_W / 2, VIEW_H - 36, "#f8fafc", 8, "center");
    }
    if (this.deadT > 0) {
      const a = Math.min(0.85, this.deadT / 60);
      ctx.fillStyle = `rgba(2, 6, 18, ${a})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (this.cleared > 0) {
      const a = Math.min(0.7, this.cleared / 50);
      ctx.fillStyle = `rgba(2, 6, 18, ${a})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      if (this.cleared > 30) {
        this.text("EPREUVE FRANCHIE", VIEW_W / 2, 96, "#8fe3ff", 16, "center");
        this.text("La forêt des champignons bleus", VIEW_W / 2, 124, "#d8d2c2", 8, "center");
        this.text("Le médaillon brûle de bleu. Rose est plus proche.", VIEW_W / 2, 142, "#d8d2c2", 7, "center");
        const md = this.lore.medallion;
        this.ctx.drawImage(this.medallionImg, VIEW_W / 2 - md.w - 30, 160);
        this.ctx.drawImage(this.lilyImg, VIEW_W / 2 + 14, 160);
        this.text(`${this.lilies}/${this.lilyTotal}`, VIEW_W / 2 + 36, 166, "#d8d2c2", 8, "left");
        if (this.cleared > 90 && Math.floor(this.time / 30) % 2 === 0) this.text("X pour rejouer", VIEW_W / 2, 190, "#ffb347", 8, "center");
      }
    }
  }

  private text(s: string, x: number, y: number, color: string, size: number, align: CanvasTextAlign) {
    const ctx = this.ctx;
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#020817";
    ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }

  private platformImage(kind: PlatformKind): HTMLImageElement {
    switch (kind) {
      case "wide":
        return this.pWide;
      case "log":
        return this.pLog;
      case "ledge":
        return this.pLedge;
      default:
        return this.pSmall;
    }
  }

  private drawPlatforms(cam: number) {
    const ctx = this.ctx;
    for (const pf of this.platforms) {
      const sx = pf.x - cam;
      if (sx + pf.w < -10 || sx > VIEW_W + 10) continue;
      const img = this.platformImage(pf.kind);
      const meta = this.pMeta[pf.kind];
      const bob = Math.round(Math.sin(this.time / 70 + pf.x) * 1);
      ctx.drawImage(img, Math.round(sx), Math.round(pf.y - meta.top) + bob);
      // Small mushrooms on the platform glow.
      this.lights.push({ x: sx + pf.w / 2, y: pf.y - 4, r: 30, a: 0.5, color: "rgba(90, 190, 255, 0.1)", parallax: 1 });
    }
  }

  private drawGate(cam: number) {
    const ctx = this.ctx;
    const g = this.pMeta.gate;
    const sx = Math.round(GATE_X - g.w / 2 - cam);
    if (sx + g.w < -10 || sx > VIEW_W + 10) return;
    const sy = Math.round(this.feetY - g.h + 8);
    ctx.drawImage(this.gateImg, sx, sy);
    const pulse = 0.6 + 0.4 * Math.sin(this.time / 14);
    if (this.gateOpen) {
      this.lights.push({ x: GATE_X - cam, y: this.feetY - 70, r: 120 * (0.9 + 0.1 * pulse), a: 1, color: "rgba(143, 227, 255, 0.35)", parallax: 1 });
      if (this.time % 4 === 0) {
        this.particles.push({ x: GATE_X + (Math.random() - 0.5) * 40, y: this.feetY - 10 - Math.random() * 100, vx: (Math.random() - 0.5) * 0.3, vy: -0.4 - Math.random() * 0.4, life: 60, max: 60, color: "#bff4ff", size: 1, parallax: 1 });
      }
    } else {
      // Sealed: dim, the light inside is barely breathing.
      ctx.fillStyle = "rgba(2, 6, 18, 0.55)";
      ctx.fillRect(sx + 30, sy + 40, g.w - 60, g.h - 50);
      this.lights.push({ x: GATE_X - cam, y: this.feetY - 70, r: 40, a: 0.4, color: "rgba(143, 227, 255, 0.08)", parallax: 1 });
    }
  }

  private drawBossShots(cam: number) {
    const ctx = this.ctx;
    for (const s of this.bossShots) {
      const x = Math.round(s.x - cam);
      const y = Math.round(s.y);
      if (s.kind === "bolt") {
        this.lights.push({ x, y, r: 60, a: 1, color: "rgba(255, 170, 60, 0.4)", parallax: 1 });
        ctx.fillStyle = "#ff7a2a";
        ctx.fillRect(x - 18, y - 4, 36, 8);
        ctx.fillStyle = "#ffd27a";
        ctx.fillRect(x - 14, y - 2, 30, 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x + (s.vx > 0 ? 6 : -14), y - 1, 8, 2);
      } else {
        this.lights.push({ x, y, r: 26, a: 0.8, color: "rgba(255, 170, 60, 0.2)", parallax: 1 });
        ctx.fillStyle = "#4a4a58";
        ctx.fillRect(x - 6, y - 3, 12, 8);
        ctx.fillStyle = "#ffb347";
        ctx.fillRect(x - 3, y - 5, 6, 6);
        ctx.fillStyle = "#fff1a8";
        ctx.fillRect(x - 1, y - 4, 2, 3);
      }
    }
  }

  private drawBoss(b: Boss, cam: number) {
    const ctx = this.ctx;
    const { w: cw, h: ch } = this.mMeta.cell;
    let sheet = this.mIdle;
    let frame = 0;
    switch (b.state) {
      case "enter":
      case "walk":
        sheet = this.mWalk;
        frame = Math.floor(b.t / 9) % this.mMeta.walk;
        break;
      case "stomp":
        sheet = this.mStomp;
        frame = b.t < 18 ? 0 : b.t < 34 ? 1 : b.t < 50 ? 2 : 3;
        break;
      case "blast":
        sheet = this.mBlast;
        frame = b.t < 26 ? 0 : b.t < 44 ? 1 : 2;
        break;
      case "stagger":
        sheet = this.mDie;
        frame = 0;
        break;
      case "dying":
        sheet = this.mDie;
        frame = Math.min(this.mMeta.die - 1, 1 + Math.floor(b.t / 32));
        break;
      case "dead":
        sheet = this.mDie;
        frame = this.mMeta.die - 1;
        break;
      default:
        break;
    }
    const flip = b.dir > 0; // sheets face left
    const x = Math.round(b.x - cw / 2 - cam);
    const y = Math.round(this.feetY - ch + 10);
    // Eyes glow, swelling while charging the blast.
    if (b.state !== "dead" && b.state !== "dying") {
      const charge = b.state === "blast" ? Math.min(1, b.t / 44) : 0;
      const ex = b.x - cam + b.dir * 62;
      const ey = this.feetY - 118;
      this.lights.push({ x: ex, y: ey, r: 44 + charge * 50, a: 1, color: `rgba(255, 160, 50, ${0.28 + charge * 0.4})`, parallax: 1 });
    } else if (b.state === "dying") {
      this.lights.push({ x: b.x - cam, y: this.feetY - 90, r: 90, a: 1, color: `rgba(255, 120, 40, ${0.3 * (1 - b.t / 130)})`, parallax: 1 });
    }
    if (b.state !== "dead") {
      ctx.fillStyle = "rgba(2, 6, 18, 0.4)";
      ctx.beginPath();
      ctx.ellipse(b.x - cam, this.feetY + 2, 80, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    if (flip) {
      ctx.translate(x + cw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, frame * cw, 0, cw, ch, 0, y, cw, ch);
    } else {
      ctx.drawImage(sheet, frame * cw, 0, cw, ch, x, y, cw, ch);
    }
    if (b.flash > 0 && b.flash % 2 === 0) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillRect(flip ? 0 : x, y, cw, ch);
    }
    ctx.restore();
  }

  private drawProps(cam: number) {
    const ctx = this.ctx;
    const L = this.lore;
    const g = this.feetY;
    const gong = this.checkpoints[0];
    const tavern = this.checkpoints[1];
    // The pilgrims' gong and its blue seal.
    if (GONG_X - cam > -200 && GONG_X - cam < VIEW_W + 200) {
      const rung = gong.done && gong.t < 40;
      const sealX = Math.round(GONG_X - 60 - L.seal.w / 2 - cam);
      ctx.drawImage(this.sealImg, sealX, Math.round(g - L.seal.h + 6));
      const sealA = gong.done ? 0.42 : 0.16;
      const pulse = 0.85 + 0.15 * Math.sin(this.time / 12);
      this.lights.push({ x: GONG_X - 60 - cam, y: g - 58, r: (gong.done ? 70 : 34) * pulse, a: 1, color: `rgba(90, 190, 255, ${sealA})`, parallax: 1 });
      const gx = Math.round(GONG_X - L.gong.w / 2 - cam) + (rung ? Math.round(Math.sin(gong.t * 1.5) * 2) : 0);
      ctx.drawImage(this.gongImg, gx, Math.round(g - L.gong.h + 4));
      if (rung) this.lights.push({ x: GONG_X - cam, y: g - 70, r: 90 * (1 - gong.t / 40), a: 1, color: "rgba(143, 227, 255, 0.4)", parallax: 1 });
      // Two hooded pilgrims, one with the mallet.
      const pc = L.pilgrim.cell;
      const sway = (k: number) => Math.floor((this.time / 40 + k) % 2);
      const striker = rung ? 2 : sway(0);
      ctx.drawImage(this.pilgrimSheet, striker * pc.w, 0, pc.w, pc.h, Math.round(GONG_X - 108 - pc.w / 2 - cam), Math.round(g - pc.h + 4), pc.w, pc.h);
      ctx.save();
      const p2x = Math.round(GONG_X + 74 - pc.w / 2 - cam);
      ctx.translate(p2x + pc.w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.pilgrimSheet, sway(1) * pc.w, 0, pc.w, pc.h, 0, Math.round(g - pc.h + 4), pc.w, pc.h);
      ctx.restore();
      // Their masks catch the light.
      this.lights.push({ x: GONG_X - 108 - cam, y: g - 88, r: 16, a: 0.5, color: "rgba(220, 235, 255, 0.1)", parallax: 1 });
      this.lights.push({ x: GONG_X + 74 - cam, y: g - 88, r: 16, a: 0.5, color: "rgba(220, 235, 255, 0.1)", parallax: 1 });
    }
    // Serrure's tavern, dug into the roots.
    if (TAVERN_X - cam > -200 && TAVERN_X - cam < VIEW_W + 200) {
      ctx.drawImage(this.tavernImg, Math.round(TAVERN_X - L.tavern.w / 2 - cam), Math.round(g - L.tavern.h + 8));
      const flick = 0.9 + 0.1 * Math.sin(this.time / 5);
      this.lights.push({ x: TAVERN_X + 6 - cam, y: g - 46, r: 64 * flick, a: 1, color: "rgba(255, 190, 110, 0.3)", parallax: 1 });
      this.lights.push({ x: TAVERN_X - 60 - cam, y: g - 100, r: 30, a: 0.6, color: "rgba(90, 190, 255, 0.12)", parallax: 1 });
      const sc = L.serrure.cell;
      const waving = tavern.done && tavern.t < 140;
      const frame = waving ? (Math.floor(tavern.t / 12) % 2 === 0 ? 2 : 1) : Math.floor(this.time / 45) % 2;
      ctx.drawImage(this.serrureSheet, frame * sc.w, 0, sc.w, sc.h, Math.round(TAVERN_X - 44 - sc.w / 2 - cam), Math.round(g - sc.h + 4), sc.w, sc.h);
    }
  }

  private drawItems(cam: number) {
    const ctx = this.ctx;
    for (const it of this.items) {
      const meta = it.kind === "lily" ? this.lore.lily : this.lore.light;
      const img = it.kind === "lily" ? this.lilyImg : this.lightImg;
      const bob = Math.round(Math.sin(this.time / 18 + it.x) * 2);
      const x = Math.round(it.x - meta.w / 2 - cam);
      const y = Math.round(it.y - meta.h - 3) + bob;
      if (x + meta.w < 0 || x > VIEW_W) continue;
      ctx.drawImage(img, x, y);
      const warm = it.kind === "light";
      this.lights.push({ x: it.x - cam, y: y + meta.h / 2, r: warm ? 40 : 26, a: 0.9, color: warm ? "rgba(255, 210, 120, 0.3)" : "rgba(220, 240, 255, 0.16)", parallax: 1 });
    }
  }

  private drawBeetle(be: Beetle, cam: number) {
    const ctx = this.ctx;
    const { w: cw, h: ch } = this.lore.beetle.cell;
    const frame = be.state === "dead" ? 3 : Math.floor(be.t / 7) % 3;
    const flip = be.dir > 0; // crawls left on the sheet
    const x = Math.round(be.x - cw / 2 - cam);
    const y = Math.round(this.feetY - ch + 6);
    if (x + cw < 0 || x > VIEW_W) return;
    const glow = be.state === "dead" ? 1.6 - be.t / 14 : 0.8 + 0.2 * Math.sin(this.time / 9 + be.home);
    this.lights.push({ x: be.x - cam, y: this.feetY - 16, r: 34 * Math.max(0.2, glow), a: 0.9, color: `rgba(120, 220, 255, ${0.18 * Math.max(0, glow)})`, parallax: 1 });
    ctx.save();
    if (be.state === "dead") ctx.globalAlpha = Math.max(0, 1 - be.t / 16);
    if (flip) {
      ctx.translate(x + cw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.beetleSheet, frame * cw, 0, cw, ch, 0, y, cw, ch);
    } else {
      ctx.drawImage(this.beetleSheet, frame * cw, 0, cw, ch, x, y, cw, ch);
    }
    ctx.restore();
  }

  private drawEye(e: Eye, cam: number) {
    const ctx = this.ctx;
    const { w: cw, h: ch } = this.lore.eye.cell;
    let sheet = this.eyeSheet;
    let frame = 0;
    let alpha = 1;
    switch (e.state) {
      case "hover":
      case "rise":
        frame = Math.floor(e.t / 8) % 3;
        break;
      case "charge":
      case "slam":
        frame = 3;
        break;
      case "landed":
        frame = e.flash > 0 ? 5 : 4;
        break;
      case "dying":
        sheet = this.eyeDieSheet;
        frame = Math.min(this.lore.eye.die - 1, Math.floor(e.t / 12));
        break;
      case "dead":
        sheet = this.eyeDieSheet;
        frame = this.lore.eye.die - 1;
        if (e.t > 300) alpha = Math.max(0, 1 - (e.t - 300) / 120);
        break;
      default:
        break;
    }
    const flip = e.dir > 0; // the eye looks left on the sheet
    const x = Math.round(e.x - cw / 2 - cam);
    const y = Math.round(e.y - ch);
    if (x + cw < -20 || x > VIEW_W + 20) return;
    if (e.state !== "dead") {
      // The eye burns; it swells while it charges.
      const charge = e.state === "charge" ? e.t / 44 : 0;
      const eyeY = e.y - ch + 30;
      ctx.fillStyle = "rgba(2, 6, 18, 0.35)";
      ctx.beginPath();
      ctx.ellipse(e.x - cam, this.feetY + 1, 30, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      this.lights.push({ x: e.x - cam + e.dir * 14, y: eyeY, r: 40 + charge * 40, a: 1, color: `rgba(255, ${charge > 0 ? 120 : 200}, ${charge > 0 ? 60 : 150}, ${0.25 + charge * 0.35})`, parallax: 1 });
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
    if (e.flash > 0 && e.flash % 2 === 0) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillRect(flip ? 0 : x, y, cw, ch);
    }
    ctx.restore();
    if (e.state !== "dead" && e.state !== "dying" && e.hp < EYE_HP) {
      const bx = Math.round(e.x - cam) - 16;
      const by = Math.round(e.y - ch) - 8;
      ctx.fillStyle = "rgba(2, 6, 18, 0.8)";
      ctx.fillRect(bx - 1, by - 1, 34, 4);
      ctx.fillStyle = "#ff7a2a";
      ctx.fillRect(bx, by, Math.round((32 * e.hp) / EYE_HP), 2);
    }
  }

  private drawRoot(r: Root, cam: number) {
    const ctx = this.ctx;
    const { w: cw, h: ch } = this.lore.root.cell;
    let frame = 0;
    if (r.state === "rise") frame = 1;
    else if (r.state === "up") frame = 2;
    else if (r.state === "recede") frame = 3;
    const jitter = r.state === "warn" ? Math.round(Math.sin(r.t * 2.5) * 1.5) : 0;
    const x = Math.round(r.x - cw / 2 - cam) + jitter;
    if (x + cw < 0 || x > VIEW_W) return;
    ctx.drawImage(this.rootSheet, frame * cw, 0, cw, ch, x, Math.round(this.feetY - ch + 6), cw, ch);
    if (r.state === "up" || r.state === "rise") this.lights.push({ x: r.x - cam, y: this.feetY - 70, r: 36, a: 0.6, color: "rgba(90, 190, 255, 0.1)", parallax: 1 });
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
