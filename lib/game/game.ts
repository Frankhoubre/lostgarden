/**
 * The Lantern's Oath: the episode 1 stage of Lost Garden as a tile-based
 * platformer. One big map (see world.ts), the creatures of the Below, the
 * lighting stack, the Machine, and an in-game pause menu.
 * Everything is drawn on a 480x288 canvas with nearest-neighbour scaling.
 */
import { GameAudio, type SongName } from "./audio";
import type { InputName } from "./engine";
import { STRINGS, type GameStrings, type HintId, type Lang } from "./strings";
import { buildWorld, EMPTY, MAP_H, MAP_W, ONEWAY, SOLID, TILE, tileAt, type Spawn, type World, type Zone } from "./world";

const VIEW_W = 480;
const VIEW_H = 288;

const GRAVITY = 0.46;
const MAX_FALL = 10;
const WALK = 3.2;
const CROUCH_WALK = 1.6;
const JUMP_VY = -10;
const ACCEL = 0.45;
const AIR_ACCEL = 0.16;
const ROLL_T = 18;
const ROLL_SPEED = 4.6;
const CHARGE_T = 40;
const PLAYER_HP = 3;
const MAX_HP_CAP = 5;
const BOSS_HP = 28;
const EYE_HP = 7;
const WOLF_HP = 3;
const DORMANT_HP = 8;
const HALF_W = 8;
const ACTIVE_R = 640;

type Light = { x: number; y: number; r: number; a: number; color?: string; parallax: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; parallax: number };
type BgLight = { x: number; y: number; r: number };
type Cell = { w: number; h: number };
type AnimMeta = { cell: Cell; walk: number; jump: number; idle: number; throw: number; throwCellW: number; hurt: number };
type ExtraMeta = { crouch: { n: number; cell: Cell }; roll: { n: number; cell: Cell }; charge: { n: number; cell: Cell } };
type ReptileMeta = { cell: { h: number }; walk: { n: number; w: number }; attack: { n: number; w: number }; die: { n: number; w: number } };
type MachineMeta = { cell: Cell; walk: number; stomp: number; blast: number; die: number; idle: number };
type PlatformMeta = { gate: Cell };
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
type Lore2Meta = {
  wolf: { run: number; die: number; cell: Cell };
  dormant: { walk: number; act: number; cell: Cell };
  moth: { n: number; cell: Cell };
  jelly: { n: number; cell: Cell };
  machine: Cell;
  stone: Cell;
  lantern: Cell;
  cocoons: Cell;
};
type BgMeta = { width: number; height: number; ground: { top: number; height: number }; lights: BgLight[]; groundLights: BgLight[] };

type Shot = { x: number; y: number; vx: number; life: number; dead: boolean; power: number; hits: number; hitList: object[] };
type BossShot = { x: number; y: number; vx: number; vy: number; w: number; h: number; life: number; dead: boolean; kind: "bolt" | "shard"; fy: number };
type Pop = { x: number; y: number; text: string; life: number; color: string };
type Ghost = { x: number; y: number; sheet: HTMLImageElement; frame: number; cw: number; ch: number; flip: boolean; life: number };
type Pose = { sheet: HTMLImageElement; frame: number; cw: number; ch: number };

type Beetle = { x: number; y: number; dir: 1 | -1; t: number; state: "crawl" | "dead"; home: number; vx: number };
type WolfState = "sleep" | "prowl" | "hunt" | "tell" | "lunge" | "retreat" | "hurt" | "dead";
type Wolf = { x: number; y: number; dir: 1 | -1; t: number; state: WolfState; hp: number; flash: number; home: number; range: number; vx: number; hitDone: boolean; lost: number };
type DormantState = "cocoon" | "wake" | "walk" | "windup" | "swipe" | "hurt" | "dying" | "dead";
type Dormant = { x: number; y: number; dir: 1 | -1; t: number; state: DormantState; hp: number; flash: number; hitDone: boolean; wakeT: number; home: number };
type Moth = { x: number; y: number; dir: 1 | -1; t: number; state: "fly" | "dead"; home: number; hy: number; vx: number; vy: number };
type EyeState = "hover" | "charge" | "slam" | "landed" | "rise" | "dying" | "dead";
type Eye = { x: number; y: number; fy: number; dir: 1 | -1; state: EyeState; t: number; hp: number; flash: number; home: number };
type RootState = "dormant" | "warn" | "rise" | "up" | "recede";
type Root = { x: number; y: number; state: RootState; t: number };
type Jelly = { x: number; y: number; home: number; range: number; t: number; phase: number; vy: number };
type Watcher = { x: number; y: number; dir: 1 | -1; t: number; state: "still" | "flee" | "gone"; vx: number };
type ItemKind = "lily" | "light";
type Item = { x: number; y: number; vy: number; kind: ItemKind; t: number; dead: boolean; rest: number };
type Prop = { kind: "stone" | "lantern" | "cocoons" | "machineProp"; x: number; y: number };
type Hint = { x: number; y: number; id: HintId };
type BossState = "asleep" | "enter" | "idle" | "walk" | "stomp" | "blast" | "stagger" | "dying" | "dead";
type Boss = { x: number; dir: 1 | -1; state: BossState; t: number; hp: number; flash: number; hits: number; vx: number; summoned: boolean };
type MenuPage = "pause" | "controls";
type Settings = { lang: Lang; music: boolean; sfx: boolean };

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

const SETTINGS_KEY = "lostgarden-game-settings";

function loadSettings(): Settings {
  const base: Settings = { lang: "fr", music: true, sfx: true };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { lang: parsed.lang === "en" ? "en" : "fr", music: parsed.music !== false, sfx: parsed.sfx !== false };
  } catch {
    return base;
  }
}

function saveSettings(s: Settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* storage may be unavailable */
  }
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private running = false;
  private last = 0;
  private acc = 0;
  private time = 0;
  private held = new Set<InputName>();
  private pressed = new Set<InputName>();

  // Art.
  private bg!: HTMLImageElement;
  private groundImg!: HTMLImageElement;
  private tiles!: HTMLImageElement;
  private trunk: HTMLImageElement | null = null;
  private meta!: BgMeta;
  private walkSheet!: HTMLImageElement;
  private jumpSheet!: HTMLImageElement;
  private idleSheet!: HTMLImageElement;
  private throwSheet!: HTMLImageElement;
  private hurtSheet!: HTMLImageElement;
  private crouchSheet!: HTMLImageElement;
  private rollSheet!: HTMLImageElement;
  private chargeSheet!: HTMLImageElement;
  private anim!: AnimMeta;
  private extra!: ExtraMeta;
  private rWalk!: HTMLImageElement;
  private rDie!: HTMLImageElement;
  private rMeta!: ReptileMeta;
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
  private wolfRun!: HTMLImageElement;
  private wolfDie!: HTMLImageElement;
  private dormantWalk!: HTMLImageElement;
  private dormantAct!: HTMLImageElement;
  private mothSheet!: HTMLImageElement;
  private jellySheet!: HTMLImageElement;
  private machinePropImg!: HTMLImageElement;
  private stoneImg!: HTMLImageElement;
  private lanternImg!: HTMLImageElement;
  private cocoonsImg!: HTMLImageElement;
  private lore2!: Lore2Meta;

  private lightCanvas: HTMLCanvasElement;
  private fxCanvas: HTMLCanvasElement;
  private flashCanvas: HTMLCanvasElement;
  private audio = new GameAudio();
  private song: SongName | null = null;
  private ready = false;
  private settings: Settings = { lang: "fr", music: true, sfx: true };
  private menu: MenuPage | null = null;
  private menuIndex = 0;

  // World.
  private world!: World;
  private grid!: Uint8Array;
  private beetles: Beetle[] = [];
  private wolves: Wolf[] = [];
  private dormants: Dormant[] = [];
  private moths: Moth[] = [];
  private eyes: Eye[] = [];
  private roots: Root[] = [];
  private jellies: Jelly[] = [];
  private watchers: Watcher[] = [];
  private items: Item[] = [];
  private props: Prop[] = [];
  private hints: Hint[] = [];
  private lilyTotal = 0;
  private boss: Boss | null = null;
  private bossShots: BossShot[] = [];
  private shots: Shot[] = [];
  private particles: Particle[] = [];
  private lights: Light[] = [];
  private pops: Pop[] = [];
  private ghosts: Ghost[] = [];
  private checkpoint = { x: 0, y: 0 };
  private gongDone = false;
  private gongT = 0;
  private tavernDone = false;
  private tavernT = 0;
  private nearSerrure = false;
  private caption: { title: string; lines: string[]; t: number } | null = null;
  private zoneId = "";
  private zoneCardT = 0;
  private cameraLock: { l: number; r: number } | null = null;
  private camX = 0;
  private camY = 0;
  private cleared = 0;
  private gateOpen = false;
  private shake = 0;
  private hitStop = 0;
  private lastHurt = "";

  // Lanterne.
  private px = 0;
  private py = 0;
  private vx = 0;
  private vy = 0;
  private dir: 1 | -1 = 1;
  private onGround = false;
  private onOneway = false;
  private onJelly: Jelly | null = null;
  private dropT = 0;
  private jumpT = 0;
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
  private maxHp = PLAYER_HP;
  private deadT = 0;
  private lilies = 0;
  private coyote = 0;
  private jumpBuffer = 0;
  private jumpCut = false;
  private crouching = false;
  private crouchT = 0;
  private rollT = 0;
  private rollCooldown = 0;
  private chargeT = 0;
  private bigThrowT = 0;
  private squash = 0;
  private stretch = 0;
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
    this.flashCanvas = document.createElement("canvas");
    this.flashCanvas.width = 256;
    this.flashCanvas.height = 192;
    this.settings = loadSettings();
    (canvas as HTMLCanvasElement & { lostGardenGame?: Game }).lostGardenGame = this;
  }

  private get S(): GameStrings {
    return STRINGS[this.settings.lang];
  }

  async load() {
    const img = (name: string) => loadImage(asset(name));
    const json = <T,>(name: string) => fetch(asset(name)).then((r) => r.json() as Promise<T>);
    const [bg, groundImg, tiles, trunk, meta, walk, jump, idle, throwS, hurtS, crouch, roll, charge, anim, extra] = await Promise.all([
      img("bg-forest.png"),
      img("ground-forest.png"),
      img("tiles.png"),
      img("fg-trunk.png").catch(() => null),
      json<BgMeta>("bg-forest.json"),
      img("lanterne-walk.png"),
      img("lanterne-jump.png"),
      img("lanterne-idle.png"),
      img("lanterne-throw.png"),
      img("lanterne-hurt.png"),
      img("lanterne-crouch.png"),
      img("lanterne-roll.png"),
      img("lanterne-charge.png"),
      json<AnimMeta>("lanterne-anim.json"),
      json<ExtraMeta>("lanterne-extra.json"),
    ]);
    const [rWalk, rDie, rMeta, gateImg, pMeta, mIdle, mWalk, mStomp, mBlast, mDie, mMeta] = await Promise.all([
      img("reptile-walk.png"),
      img("reptile-die.png"),
      json<ReptileMeta>("reptile-anim.json"),
      img("gate.png"),
      json<PlatformMeta>("level-assets.json"),
      img("machine-idle.png"),
      img("machine-walk.png"),
      img("machine-stomp.png"),
      img("machine-blast.png"),
      img("machine-die.png"),
      json<MachineMeta>("machine-anim.json"),
    ]);
    const [beetleSheet, rootSheet, eyeSheet, eyeDieSheet, serrureSheet, pilgrimSheet, gongImg, sealImg, tavernImg, lilyImg, lightImg, medallionImg, lore] = await Promise.all([
      img("fx-beetle.png"),
      img("fx-root.png"),
      img("eye-anim.png"),
      img("eye-die.png"),
      img("serrure-idle.png"),
      img("pilgrim-idle.png"),
      img("prop-gong.png"),
      img("prop-seal.png"),
      img("prop-tavern.png"),
      img("item-lily.png"),
      img("item-light.png"),
      img("item-medallion.png"),
      json<LoreMeta>("lore-assets.json"),
    ]);
    const [wolfRun, wolfDie, dormantWalk, dormantAct, mothSheet, jellySheet, machinePropImg, stoneImg, lanternImg, cocoonsImg, lore2] = await Promise.all([
      img("wolf-run.png"),
      img("wolf-die.png"),
      img("dormant-walk.png"),
      img("dormant-act.png"),
      img("fx-moth.png"),
      img("fx-jelly.png"),
      img("prop-machine.png"),
      img("prop-stone.png"),
      img("prop-lantern.png"),
      img("prop-cocoons.png"),
      json<Lore2Meta>("lore2-assets.json"),
    ]);
    Object.assign(this, {
      bg, groundImg, tiles, trunk, meta, walkSheet: walk, jumpSheet: jump, idleSheet: idle, throwSheet: throwS, hurtSheet: hurtS, crouchSheet: crouch, rollSheet: roll, chargeSheet: charge, anim, extra,
      rWalk, rDie, rMeta, gateImg, pMeta, mIdle, mWalk, mStomp, mBlast, mDie, mMeta,
      beetleSheet, rootSheet, eyeSheet, eyeDieSheet, serrureSheet, pilgrimSheet, gongImg, sealImg, tavernImg, lilyImg, lightImg, medallionImg, lore,
      wolfRun, wolfDie, dormantWalk, dormantAct, mothSheet, jellySheet, machinePropImg, stoneImg, lanternImg, cocoonsImg, lore2,
    });
    this.world = buildWorld();
    this.grid = this.world.grid;
    this.audio.setMusicOn(this.settings.music);
    this.audio.setSfxOn(this.settings.sfx);
    this.resetLevel();
    this.ready = true;
  }

  private music(name: SongName | null) {
    if (this.song === name) return;
    this.song = name;
    if (name) this.audio.playSong(name);
    else this.audio.stopSong();
  }

  /* ---------------- world population ---------------- */

  private resetLevel() {
    const w = this.world;
    this.px = w.start.x;
    this.py = w.start.y;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.maxHp = PLAYER_HP;
    this.hp = this.maxHp;
    this.checkpoint = { x: w.start.x, y: w.start.y };
    this.shots = [];
    this.bossShots = [];
    this.pops = [];
    this.ghosts = [];
    this.rollT = 0;
    this.chargeT = 0;
    this.bigThrowT = 0;
    this.deadT = 0;
    this.invuln = 60;
    this.lilies = 0;
    this.caption = null;
    this.cleared = 0;
    this.gateOpen = false;
    this.gongDone = false;
    this.tavernDone = false;
    this.cameraLock = null;
    this.zoneId = "";
    this.boss = { x: w.arena.r - 150, dir: -1, state: "asleep", t: 0, hp: BOSS_HP, flash: 0, hits: 0, vx: 0, summoned: false };
    this.beetles = [];
    this.wolves = [];
    this.dormants = [];
    this.moths = [];
    this.eyes = [];
    this.roots = [];
    this.jellies = [];
    this.watchers = [];
    this.items = [];
    this.props = [];
    this.hints = w.hints.map((h) => ({ x: h.x, y: h.y, id: h.id as HintId }));
    for (const sp of w.spawns) this.spawn(sp);
    this.lilyTotal = this.items.filter((it) => it.kind === "lily").length;
    this.camX = Math.max(0, this.px - VIEW_W / 2);
    this.camY = this.py - 170;
    this.clampCamera();
    this.music("forest");
  }

  private spawn(sp: Spawn) {
    const { x, y, dir } = sp;
    switch (sp.kind) {
      case "beetle":
        this.beetles.push({ x, y, dir, t: Math.floor(rnd(x) * 60), state: "crawl", home: x, vx: 0 });
        break;
      case "wolf":
        this.wolves.push({ x, y, dir, t: 0, state: sp.range ? "sleep" : "prowl", hp: WOLF_HP, flash: 0, home: x, range: sp.range ?? 240, vx: 0, hitDone: false, lost: 0 });
        break;
      case "dormant":
        this.dormants.push({ x, y, dir, t: 0, state: "cocoon", hp: DORMANT_HP, flash: 0, hitDone: false, wakeT: 0, home: x });
        break;
      case "moth":
        this.moths.push({ x, y, dir, t: Math.floor(rnd(x) * 100), state: "fly", home: x, hy: y, vx: 0, vy: 0 });
        break;
      case "eye":
        this.eyes.push({ x, y: y - 16, fy: y, dir, state: "hover", t: 0, hp: EYE_HP, flash: 0, home: x });
        break;
      case "root":
        this.roots.push({ x, y, state: "dormant", t: 0 });
        break;
      case "jelly":
        this.jellies.push({ x, y, home: y, range: sp.range ?? 50, t: 0, phase: rnd(x) * 6.28, vy: 0 });
        break;
      case "watcher":
        this.watchers.push({ x, y, dir, t: 0, state: "still", vx: 0 });
        break;
      case "lily":
      case "light":
        this.items.push({ x, y, vy: 0, kind: sp.kind, t: 0, dead: false, rest: y });
        break;
      default:
        this.props.push({ kind: sp.kind, x, y });
        break;
    }
  }

  /** Creatures around a point come back to their posts (after a death). */
  private respawnAround(x: number, radius: number) {
    const near = (e: { x: number }) => Math.abs(e.x - x) < radius;
    this.beetles = this.beetles.filter((e) => !near(e));
    this.wolves = this.wolves.filter((e) => !near(e) || e.state === "dead");
    this.dormants = this.dormants.filter((e) => !near(e) || e.state === "dead");
    this.moths = this.moths.filter((e) => !near(e));
    this.eyes = this.eyes.filter((e) => !near(e) || e.state === "dead");
    for (const r of this.roots) {
      r.state = "dormant";
      r.t = 0;
    }
    const deadHere = new Set<number>();
    for (const e of [...this.wolves, ...this.dormants, ...this.eyes]) if (e.state === "dead") deadHere.add(Math.round(e.x));
    for (const sp of this.world.spawns) {
      if (!near(sp)) continue;
      if (sp.kind === "beetle" || sp.kind === "moth") this.spawn(sp);
      else if ((sp.kind === "wolf" || sp.kind === "dormant" || sp.kind === "eye") && !deadHere.has(Math.round(sp.x))) this.spawn(sp);
    }
  }

  /* ---------------- loop and input ---------------- */

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

  /** A pointer press on the canvas, in canvas pixels. Drives the menu; otherwise it opens it from the corner button. */
  pointer(x: number, y: number) {
    this.audio.unlock();
    if (this.menu) {
      const idx = this.menuItemAt(y);
      if (idx >= 0) {
        this.menuIndex = idx;
        this.menuActivate(1);
      } else if (this.menu === "controls") {
        this.menu = "pause";
      }
      return;
    }
    if (x > VIEW_W - 26 && y < 22) {
      this.openMenu();
      return;
    }
    this.pressed.add("throw");
    this.held.add("throw");
    window.setTimeout(() => this.held.delete("throw"), 40);
  }

  debug() {
    return {
      x: this.px,
      y: this.py,
      onGround: this.onGround,
      camX: this.camX,
      camY: this.camY,
      ready: this.ready,
      hp: this.hp,
      maxHp: this.maxHp,
      lilies: this.lilies,
      zone: this.zoneId,
      checkpoint: this.checkpoint,
      menu: this.menu,
      lang: this.settings.lang,
      wolves: this.wolves.map((w) => ({ x: Math.round(w.x), state: w.state, hp: w.hp })),
      dormants: this.dormants.map((d) => ({ x: Math.round(d.x), state: d.state, hp: d.hp })),
      moths: this.moths.length,
      beetles: this.beetles.map((b) => ({ x: Math.round(b.x), state: b.state })),
      eyes: this.eyes.map((e) => ({ x: Math.round(e.x), state: e.state, hp: e.hp })),
      watchers: this.watchers.map((w) => w.state),
      jellies: this.jellies.map((j) => Math.round(j.y)),
      boss: this.boss ? { x: Math.round(this.boss.x), state: this.boss.state, hp: this.boss.hp } : null,
      cleared: this.cleared,
      gateOpen: this.gateOpen,
      lastHurt: this.lastHurt,
      rolling: this.rollT > 0,
      crouching: this.crouching,
      caption: this.caption?.title ?? null,
    };
  }

  debugWarp(x: number, y?: number) {
    this.px = x;
    this.py = y ?? this.floorBelow(x, this.py - 200) ?? this.py;
    this.vy = 0;
    this.camX = x - VIEW_W / 2;
    this.camY = this.py - 170;
    this.clampCamera();
  }

  debugKillBoss() {
    if (this.boss) this.boss.hp = 1;
  }

  debugGive(lilies: number) {
    this.lilies += lilies;
  }

  /* ---------------- tiles ---------------- */

  private tile(px: number, py: number): number {
    return tileAt(this.grid, Math.floor(px / TILE), Math.floor(py / TILE));
  }

  private solidAt(px: number, py: number): boolean {
    return this.tile(px, py) === SOLID;
  }

  /** Any solid tile along a vertical span at x. */
  private solidSpan(x: number, y0: number, y1: number): boolean {
    for (let y = y0; y <= y1 + TILE; y += TILE) if (this.solidAt(x, Math.min(y, y1))) return true;
    return false;
  }

  /** Walkable top under a point (solid or ledge), scanning down a few tiles. */
  private floorBelow(x: number, y: number, tiles = 6): number | null {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    for (let k = 0; k < tiles; k += 1) {
      if (tileAt(this.grid, tx, ty + k) !== EMPTY) return (ty + k) * TILE;
    }
    return null;
  }

  private zoneAt(x: number): Zone {
    const tx = Math.floor(x / TILE);
    return this.world.zones.find((z) => tx >= z.x0 && tx < z.x1) ?? this.world.zones[0];
  }

  private clampCamera() {
    this.camX = Math.max(0, Math.min(MAP_W * TILE - VIEW_W, this.camX));
    this.camY = Math.max(0, Math.min(MAP_H * TILE - VIEW_H, this.camY));
  }

  /** The player box: 16 wide, 84 tall above the feet, half that when crouched or rolling. */
  private boxH(): number {
    return this.crouching || this.rollT > 0 ? 44 : 84;
  }

  private playerBoxHits(x0: number, x1: number, y0: number, y1: number): boolean {
    return this.px + HALF_W > x0 && this.px - HALF_W < x1 && this.py > y0 && this.py - this.boxH() < y1;
  }

  /** Room to stand up straight where Lanterne is. */
  private canStand(): boolean {
    const y0 = this.py - 84 + 1;
    const y1 = this.py - 44;
    return !this.solidSpan(this.px - HALF_W + 1, y0, y1) && !this.solidSpan(this.px + HALF_W - 1, y0, y1);
  }

  /* ---------------- simulation ---------------- */

  private tick() {
    if (!this.ready) return;
    this.time += 1;
    if (this.pressed.has("pause")) {
      if (this.menu) this.closeMenu();
      else this.openMenu();
      this.pressed.clear();
      return;
    }
    if (this.menu) {
      this.tickMenu();
      this.pressed.clear();
      return;
    }
    if (this.hitStop > 0) {
      this.hitStop -= 1;
      this.pressed.clear();
      return;
    }
    if (this.shake > 0) this.shake -= 1;
    if (this.cleared > 0) {
      this.cleared += 1;
      this.tickParticlesOnly();
      if (this.cleared > 90 && (this.pressed.has("throw") || this.pressed.has("jump"))) this.resetLevel();
      this.pressed.clear();
      return;
    }
    if (this.deadT > 0) {
      this.deadT += 1;
      if (this.deadT > 150) this.respawn();
      this.tickParticlesOnly();
      this.pressed.clear();
      return;
    }
    if (this.zoneCardT > 0) this.zoneCardT -= 1;
    if (this.caption && this.caption.t > 0) this.caption.t -= 1;

    const rolling = this.rollT > 0;
    const busy = this.hurtT > 0 || rolling || this.bigThrowT > 0;
    // Crouch: hold down on the ground, or a ceiling too low to stand under. The light dims, the glimmer skims the moss.
    const wantCrouch = this.held.has("down") || !this.canStand();
    this.crouching = this.onGround && wantCrouch && !busy;
    this.crouchT = this.crouching ? this.crouchT + 1 : 0;
    const left = this.held.has("left") && !busy;
    const right = this.held.has("right") && !busy;
    const speed = this.crouching ? CROUCH_WALK : WALK;
    const target = left ? -speed : right ? speed : 0;
    if (rolling) {
      this.vx = this.dir * ROLL_SPEED * (this.rollT > 4 ? 1 : 0.5);
    } else if (this.onGround) {
      this.vx += (target - this.vx) * ACCEL;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    } else {
      this.vx += (target - this.vx) * AIR_ACCEL;
    }
    if (left && !right) this.dir = -1;
    if (right && !left) this.dir = 1;
    if (this.dropT > 0) this.dropT -= 1;
    if (this.coyote > 0) this.coyote -= 1;
    if (this.jumpBuffer > 0) this.jumpBuffer -= 1;
    if (this.pressed.has("jump") || this.pressed.has("up")) this.jumpBuffer = 7;
    const canJump = (this.onGround || this.coyote > 0) && !busy && (!this.crouching || this.canStand());
    if (this.jumpBuffer > 0 && canJump) {
      this.jumpBuffer = 0;
      if (this.held.has("down") && (this.onOneway || this.onJelly)) {
        // Drop through the ledge.
        this.dropT = 12;
        this.onGround = false;
        this.onJelly = null;
        this.py += 2;
        this.vy = 1;
      } else {
        this.vy = JUMP_VY;
        this.onGround = false;
        this.onJelly = null;
        this.coyote = 0;
        this.jumpT = 0;
        this.jumpCut = false;
        this.stretch = 5;
        this.crouching = false;
        this.puff(6, "#7fa9b8", 1.4);
        this.audio.sfx("jump");
      }
    }
    if (!this.onGround && !this.jumpCut && !this.held.has("jump") && !this.held.has("up") && this.vy < -2.5) {
      this.vy *= 0.5;
      this.jumpCut = true;
    }
    if (!this.onGround) this.jumpT += 1;
    if (this.rollCooldown > 0) this.rollCooldown -= 1;
    if (this.pressed.has("roll") && this.onGround && this.rollCooldown <= 0 && !busy) {
      this.rollT = ROLL_T;
      this.rollCooldown = ROLL_T + 22;
      this.throwT = 0;
      this.chargeT = 0;
      this.crouching = false;
      this.puff(8, "#7fa9b8", 1.8);
      this.audio.sfx("roll");
    }
    if (rolling) {
      this.rollT -= 1;
      if (this.time % 3 === 0) this.ghosts.push(this.ghostOf());
      if (this.rollT === 0) this.puff(4, "#7fa9b8", 1.2);
    }
    if (this.throwCooldown > 0) this.throwCooldown -= 1;
    if (this.pressed.has("throw") && this.throwCooldown <= 0 && !busy) {
      this.throwT = 1;
      this.throwCooldown = 26;
      this.throwLow = this.crouching || this.held.has("down");
      this.chargeT = 1;
    }
    if (this.chargeT > 0) {
      if (this.held.has("throw") && !busy) {
        this.chargeT += 1;
        if (this.chargeT === CHARGE_T) this.audio.sfx("charge");
        if (this.chargeT > 14 && this.time % 2 === 0) {
          const hx = this.px + this.dir * 8;
          const hy = this.py - (this.crouching ? 34 : 70);
          const a = Math.random() * Math.PI * 2;
          const d = 18 + Math.random() * 22;
          this.particles.push({ x: hx + Math.cos(a) * d, y: hy + Math.sin(a) * d, vx: (-Math.cos(a) * d) / 9, vy: (-Math.sin(a) * d) / 9, life: 9, max: 9, color: this.chargeT >= CHARGE_T ? "#ffffff" : "#ffd27a", size: 1, parallax: 1 });
        }
      } else {
        if (this.chargeT >= CHARGE_T && !busy) {
          this.bigThrowT = 1;
          this.throwT = 0;
        }
        this.chargeT = 0;
      }
    }
    if (this.bigThrowT > 0) {
      this.bigThrowT += 1;
      if (this.bigThrowT === 8) {
        const sy = this.py - (this.crouching ? 20 : 54);
        this.shots.push({ x: this.px + this.dir * 34, y: sy, vx: this.dir * 6.4, life: 110, dead: false, power: 3, hits: 0, hitList: [] });
        this.flare = 60;
        this.shake = 5;
        this.hitStop = 2;
        this.audio.sfx("big");
        this.burst(this.px + this.dir * 34, sy, 18, "#fff1a8", 3);
      }
      if (this.bigThrowT > 22) this.bigThrowT = 0;
    }
    if (this.throwT > 0) {
      this.throwT += 1;
      if (this.throwT === 9) {
        this.shots.push({ x: this.px + this.dir * 22, y: this.py - (this.throwLow ? 16 : 52), vx: this.dir * 5.2, life: 90, dead: false, power: 1, hits: 0, hitList: [] });
        this.flare = 30;
        this.audio.sfx("throw");
      }
      if (this.throwT > 24) this.throwT = 0;
    }
    if (this.hurtT > 0) this.hurtT -= 1;
    if (this.invuln > 0) this.invuln -= 1;
    if (this.flare > 0) this.flare -= 1;

    this.tickShots();
    this.tickJellies();
    this.tickBeetles();
    this.tickWolves();
    this.tickDormants();
    this.tickMoths();
    this.tickEyes();
    this.tickRoots();
    this.tickWatchers();
    this.tickItems();
    this.tickCheckpoints();
    this.tickZones();
    this.tickBoss();
    this.tickBossShots();
    this.tickGate();

    this.movePlayer();

    const moving = Math.abs(this.vx) > 0.3 && this.onGround;
    if (moving) {
      const step = Math.abs(this.vx) * 0.55;
      this.walkT += step;
      this.idleT = 0;
      if (Math.floor(this.walkT / 10) !== Math.floor((this.walkT - step) / 10)) this.puff(2, "#6f95a3", 0.8);
    } else if (this.onGround) {
      this.idleT += 1;
    } else {
      this.idleT = 0;
    }

    // Camera: leads the player, eases, locked in the arena.
    const lock = this.cameraLock;
    const targetX = lock ? lock.l : this.px - VIEW_W / 2 + this.dir * 40;
    const targetY = lock ? this.world.arena.y - 214 : this.py - 176;
    this.camX += (targetX - this.camX) * 0.08;
    this.camY += (targetY - this.camY) * 0.1;
    this.clampCamera();

    // Ambient spores and fireflies.
    if (this.time % 6 === 0) {
      this.particles.push({ x: this.camX + Math.random() * (VIEW_W + 80) - 40, y: this.camY - 4, vx: (Math.random() - 0.5) * 0.2, vy: 0.15 + Math.random() * 0.25, life: 900, max: 900, color: Math.random() < 0.3 ? "#e8f8ff" : "#8fe3ff", size: Math.random() < 0.2 ? 2 : 1, parallax: 0.6 + Math.random() * 0.6 });
    }
    if (this.time % 25 === 0) {
      this.particles.push({ x: this.camX + Math.random() * VIEW_W, y: this.camY + 120 + Math.random() * 150, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.15, life: 240, max: 240, color: "#bff4ff", size: 1, parallax: 1 });
    }
    this.tickParticlesOnly();
    this.pressed.clear();
  }

  /** Move Lanterne and resolve the tiles: walls first, then floors and ceilings. */
  private movePlayer() {
    const rolling = this.rollT > 0;
    const diving = !this.onGround && this.held.has("down") && this.vy > 0 && !rolling;
    this.vy = Math.min(diving ? 12 : MAX_FALL, this.vy + (diving ? GRAVITY * 1.7 : GRAVITY));
    const prevFeet = this.py;
    const prevJelly = this.onJelly;
    const h = this.boxH();

    // Horizontal.
    this.px += this.vx;
    const top = this.py - h + 2;
    const bottom = this.py - 2;
    if (this.vx > 0 && this.solidSpan(this.px + HALF_W, top, bottom)) {
      this.px = Math.floor((this.px + HALF_W) / TILE) * TILE - HALF_W - 0.01;
      this.vx = 0;
    } else if (this.vx < 0 && this.solidSpan(this.px - HALF_W, top, bottom)) {
      this.px = (Math.floor((this.px - HALF_W) / TILE) + 1) * TILE + HALF_W + 0.01;
      this.vx = 0;
    }
    if (this.cameraLock) {
      this.px = Math.max(this.cameraLock.l + 16, Math.min(this.cameraLock.r - 16, this.px));
    }

    // Vertical.
    this.py += this.vy;
    const wasGround = this.onGround;
    this.onGround = false;
    this.onOneway = false;
    this.onJelly = null;
    const xl = this.px - HALF_W + 2;
    const xr = this.px + HALF_W - 2;
    if (this.vy >= 0) {
      // Jellyfish first: their bells are ledges that drift.
      for (const j of this.jellies) {
        const jt = j.y;
        if (Math.abs(this.px - j.x) < 36 && this.py >= jt && prevFeet <= jt + 1 + Math.max(0, j.vy) + (prevJelly === j ? 6 : 0) && this.dropT <= 0) {
          this.py = jt;
          this.vy = 0;
          this.onGround = true;
          this.onJelly = j;
        }
      }
      if (!this.onGround) {
        const ty = Math.floor(this.py / TILE);
        const tileTop = ty * TILE;
        for (const x of [xl, xr]) {
          const v = tileAt(this.grid, Math.floor(x / TILE), ty);
          if (v === SOLID || (v === ONEWAY && this.dropT <= 0 && prevFeet <= tileTop + 0.5)) {
            this.py = tileTop;
            this.vy = 0;
            this.onGround = true;
            this.onOneway = v === ONEWAY;
            break;
          }
        }
      }
    } else {
      const head = this.py - h;
      for (const x of [xl, xr]) {
        if (this.solidAt(x, head)) {
          this.py = (Math.floor(head / TILE) + 1) * TILE + h;
          this.vy = 0;
          this.jumpCut = true;
          break;
        }
      }
    }
    if (this.py > MAP_H * TILE) {
      this.py = MAP_H * TILE;
      this.onGround = true;
    }
    if (!wasGround && this.onGround) {
      this.landT = 8;
      this.squash = 6;
      this.jumpCut = false;
      this.puff(8, "#7fa9b8", 1.8);
    }
    if (wasGround && !this.onGround && this.vy < GRAVITY * 2) this.coyote = 6;
    if (this.landT > 0) this.landT -= 1;
    if (this.squash > 0) this.squash -= 1;
    if (this.stretch > 0) this.stretch -= 1;
  }

  private tickParticlesOnly() {
    for (const pt of this.particles) {
      pt.x += pt.vx + Math.sin((this.time + pt.max) / 50) * 0.05;
      pt.y += pt.vy;
      if (pt.max <= 36) pt.vy += 0.08;
      pt.life -= 1;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0 && pt.y < this.camY + VIEW_H + 40 && pt.y > this.camY - 60);
    for (const pop of this.pops) {
      pop.life -= 1;
      pop.y -= pop.life > 20 ? 0.6 : 0.2;
    }
    this.pops = this.pops.filter((pop) => pop.life > 0);
    for (const g of this.ghosts) g.life -= 1;
    this.ghosts = this.ghosts.filter((g) => g.life > 0);
  }

  private pop(x: number, y: number, text: string, color: string) {
    this.pops.push({ x, y, text, life: 34, color });
  }

  /* ---------------- zones, checkpoints, gate ---------------- */

  private tickZones() {
    const z = this.zoneAt(this.px);
    if (z.id !== this.zoneId) {
      this.zoneId = z.id;
      this.zoneCardT = 170;
      if (!(this.boss && this.boss.state !== "asleep" && this.boss.state !== "dead")) {
        this.music(z.id === "taverne" ? "lullaby" : z.id === "racines" || z.id === "chemin" ? "chains" : "forest");
      }
    }
    const b = this.boss;
    const arena = this.world.arena;
    if (b && b.state === "asleep" && this.px > arena.l + 40) {
      b.state = "enter";
      b.t = 0;
      b.x = arena.r + 120;
      this.cameraLock = { l: arena.l, r: arena.r };
      this.checkpoint = { x: arena.l + 40, y: arena.y };
      this.wolves = this.wolves.filter((w) => w.state === "dead" || Math.abs(w.x - this.px) > 700);
      this.caption = null;
      this.music("boss");
      this.audio.sfx("boss");
      this.shake = 12;
    }
  }

  private tickCheckpoints() {
    const S = this.S;
    const gong = this.world.gong;
    if (!this.gongDone && this.px > gong.x - 40 && Math.abs(this.py - gong.y) < 80) {
      this.gongDone = true;
      this.gongT = 0;
      this.checkpoint = { x: gong.x - 40, y: gong.y };
      this.hp = this.maxHp;
      this.flare = 50;
      this.audio.sfx("bell");
      this.shake = 4;
      this.burst(gong.x, gong.y - 60, 24, "#8fe3ff", 2.2);
      this.caption = { title: S.gong.title, lines: S.gong.lines, t: 260 };
    }
    if (this.gongDone) this.gongT += 1;
    const tav = this.world.tavern;
    if (!this.tavernDone && this.px > tav.x - 70 && Math.abs(this.py - tav.y) < 80) {
      this.tavernDone = true;
      this.tavernT = 0;
      this.checkpoint = { x: tav.x - 70, y: tav.y };
      this.hp = this.maxHp;
      this.flare = 50;
      this.audio.sfx("checkpoint");
      this.burst(tav.x - 20, tav.y - 60, 16, "#ffd27a", 1.8);
      this.caption = { title: S.serrure.title, lines: S.serrure.lines, t: 420 };
    }
    if (this.tavernDone) this.tavernT += 1;
    // Serrure trades three lilies for one more heart.
    const serrureX = tav.x - 44;
    this.nearSerrure = this.tavernDone && Math.abs(this.px - serrureX) < 54 && Math.abs(this.py - tav.y) < 40 && this.onGround && this.deadT === 0;
    if (this.nearSerrure && this.pressed.has("down") && this.lilies >= 3 && this.maxHp < MAX_HP_CAP) {
      this.lilies -= 3;
      this.maxHp += 1;
      this.hp = this.maxHp;
      this.flare = 60;
      this.audio.sfx("chest");
      this.burst(this.px, this.py - 60, 30, "#ffffff", 2.6);
      this.pop(this.px, this.py - 100, "+1", "#bff4ff");
      this.caption = { title: S.serrure.title, lines: S.serrure.trade, t: 300 };
    }
  }

  private tickGate() {
    if (!this.gateOpen || this.cleared > 0) return;
    const g = this.world.gate;
    if (Math.abs(this.px - g.x) < 26 && this.onGround && Math.abs(this.py - g.y) < 40) {
      this.cleared = 1;
      this.music(null);
      this.audio.sfx("clear");
      this.burst(g.x, g.y - 70, 40, "#bff4ff", 2.5);
    }
  }

  private respawn() {
    this.deadT = 0;
    this.hp = this.maxHp;
    this.invuln = 90;
    this.hurtT = 0;
    this.vx = 0;
    this.vy = 0;
    this.rollT = 0;
    this.chargeT = 0;
    this.bigThrowT = 0;
    this.ghosts = [];
    this.shots = [];
    this.bossShots = [];
    this.caption = null;
    this.px = this.checkpoint.x;
    this.py = this.checkpoint.y;
    this.respawnAround(this.px, 900);
    const b = this.boss;
    const arena = this.world.arena;
    if (b && b.state !== "asleep" && b.state !== "dead") {
      b.state = "idle";
      b.t = 0;
      b.x = arena.r - 150;
      b.dir = -1;
      this.px = arena.l + 40;
      this.py = arena.y;
      this.cameraLock = { l: arena.l, r: arena.r };
      this.music("boss");
    } else {
      this.zoneId = "";
    }
    this.camX = this.cameraLock ? this.cameraLock.l : this.px - VIEW_W / 2;
    this.camY = this.py - 176;
    this.clampCamera();
  }

  /* ---------------- menu ---------------- */

  private openMenu() {
    this.menu = "pause";
    this.menuIndex = 0;
    this.releaseAll();
    this.audio.sfx("select");
  }

  private closeMenu() {
    this.menu = null;
    this.audio.sfx("select");
  }

  private menuCount(): number {
    return 6;
  }

  private tickMenu() {
    if (this.menu === "controls") {
      if (this.pressed.has("throw") || this.pressed.has("jump") || this.pressed.has("left")) this.menu = "pause";
      return;
    }
    if (this.pressed.has("up")) this.menuIndex = (this.menuIndex + this.menuCount() - 1) % this.menuCount();
    if (this.pressed.has("down")) this.menuIndex = (this.menuIndex + 1) % this.menuCount();
    if (this.pressed.has("up") || this.pressed.has("down")) this.audio.sfx("timer");
    if (this.pressed.has("throw") || this.pressed.has("jump") || this.pressed.has("right")) this.menuActivate(1);
    else if (this.pressed.has("left")) this.menuActivate(-1);
  }

  private menuActivate(dirn: 1 | -1) {
    if (this.menu === "controls") {
      this.menu = "pause";
      return;
    }
    switch (this.menuIndex) {
      case 0:
        this.closeMenu();
        break;
      case 1:
        this.settings.music = !this.settings.music;
        this.audio.setMusicOn(this.settings.music);
        break;
      case 2:
        this.settings.sfx = !this.settings.sfx;
        this.audio.setSfxOn(this.settings.sfx);
        break;
      case 3:
        this.settings.lang = this.settings.lang === "fr" ? "en" : "fr";
        break;
      case 4:
        this.menu = "controls";
        break;
      case 5:
        this.resetLevel();
        this.closeMenu();
        break;
      default:
        break;
    }
    void dirn;
    saveSettings(this.settings);
    this.audio.sfx("select");
  }

  /** Which pause item sits under a canvas y, or -1. */
  private menuItemAt(y: number): number {
    if (this.menu !== "pause") return -1;
    const idx = Math.floor((y - 84) / 24);
    return idx >= 0 && idx < this.menuCount() ? idx : -1;
  }

  /* ---------------- shots and items ---------------- */

  private tickShots() {
    for (const sh of this.shots) {
      sh.x += sh.vx;
      sh.y += Math.sin(sh.life / 3) * 0.3;
      sh.life -= 1;
      if (sh.life <= 0 || this.solidAt(sh.x, sh.y)) {
        sh.dead = true;
        this.burst(sh.x, sh.y, 6, "#fff1a8", 1.4);
        continue;
      }
      if (this.time % 2 === 0) {
        this.particles.push({ x: sh.x - sh.vx, y: sh.y + (Math.random() - 0.5) * 4, vx: -sh.vx * 0.05, vy: (Math.random() - 0.5) * 0.3, life: 14, max: 14, color: Math.random() < 0.5 ? "#fff1a8" : "#ffb347", size: 1, parallax: 1 });
      }
      // A charged glimmer pierces: it goes through up to three targets, once each.
      const land = (target: object): boolean => {
        if (sh.power > 1) {
          if (sh.hitList.includes(target)) return false;
          sh.hitList.push(target);
          sh.hits += 1;
          if (sh.hits >= 3) sh.dead = true;
        } else {
          sh.dead = true;
        }
        return true;
      };
      const knock: 1 | -1 = sh.vx > 0 ? 1 : -1;
      for (const w of this.wolves) {
        if (sh.dead || w.state === "dead") continue;
        if (Math.abs(sh.x - w.x) < 30 && sh.y > w.y - 52 && sh.y < w.y + 2 && land(w)) {
          // Caught asleep: the blow lands twice as hard.
          this.hitWolf(w, knock, w.state === "sleep" ? sh.power * 2 : sh.power);
          this.burst(sh.x, sh.y, 14, "#fff1a8", 2.2);
        }
      }
      for (const d of this.dormants) {
        if (sh.dead || d.state === "dead" || d.state === "dying") continue;
        if (Math.abs(sh.x - d.x) < 26 && sh.y > d.y - 126 && sh.y < d.y && land(d)) {
          this.hitDormant(d, knock, sh.power);
          this.burst(sh.x, sh.y, 14, "#fff1a8", 2.2);
        }
      }
      for (const m of this.moths) {
        if (sh.dead || m.state !== "fly") continue;
        if (Math.abs(sh.x - m.x) < 16 && Math.abs(sh.y - m.y) < 14 && land(m)) {
          this.killMoth(m);
        }
      }
      for (const be of this.beetles) {
        if (be.state !== "crawl" || sh.dead) continue;
        if (Math.abs(sh.x - be.x) < 22 && sh.y > be.y - (sh.power > 1 ? 60 : 44) && sh.y < be.y + 2 && land(be)) {
          this.pop(be.x, be.y - 40, "1", "#bff4ff");
          this.killBeetle(be);
        }
      }
      for (const e of this.eyes) {
        if (sh.dead || e.state === "dead" || e.state === "dying") continue;
        const ch = this.lore.eye.cell.h;
        if (Math.abs(sh.x - e.x) < 36 && sh.y > e.y - ch + 10 && sh.y < e.y && land(e)) {
          this.hitEye(e, sh.power);
          this.burst(sh.x, sh.y, 14, "#fff1a8", 2.2);
        }
      }
      const b = this.boss;
      const fy = this.world.arena.y;
      if (b && !sh.dead && (b.state === "idle" || b.state === "walk" || b.state === "stomp" || b.state === "blast" || b.state === "stagger")) {
        if (sh.x > b.x - 70 && sh.x < b.x + 70 && sh.y > fy - 165 && sh.y < fy && land(b)) {
          this.hitBoss(b, sh.power);
          this.burst(sh.x, sh.y, 16, "#fff1a8", 2.4);
        }
      }
    }
    this.shots = this.shots.filter((sh) => !sh.dead);
  }

  private dropItem(x: number, y: number, kind: ItemKind) {
    const rest = this.floorBelow(x, y - 4, 8) ?? y;
    this.items.push({ x, y: y - 6, vy: -2.6, kind, t: 0, dead: false, rest });
  }

  private tickItems() {
    for (const it of this.items) {
      it.t += 1;
      if (Math.abs(it.x - this.px) > ACTIVE_R * 2) continue;
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
          this.hp = Math.min(this.maxHp, this.hp + 1);
          this.flare = 40;
          this.audio.sfx("chest");
          this.burst(it.x, it.y - 10, 16, "#fff1a8", 2);
        }
      }
    }
    this.items = this.items.filter((it) => !it.dead);
  }

  private hurtPlayer(from: number, source = "?") {
    if (this.invuln > 0 || this.deadT > 0 || this.rollT > 3) return;
    this.hp -= 1;
    this.lastHurt = `${source}@${Math.round(from)}`;
    this.rollT = 0;
    this.chargeT = 0;
    this.bigThrowT = 0;
    this.pop(this.px, this.py - 96, "-1", "#ff6b6b");
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

  private burst(x: number, y: number, count: number, color: string, speed: number) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.3 + Math.random()) * speed;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6, life: 18 + Math.random() * 16, max: 34, color, size: Math.random() < 0.4 ? 2 : 1, parallax: 1 });
    }
  }

  private puffAt(x: number, y: number, count: number, color: string, speed: number) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.PI + Math.random() * Math.PI;
      const sp = (0.4 + Math.random()) * speed;
      this.particles.push({ x: x + (Math.random() - 0.5) * 30, y: y - 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, life: 22 + Math.random() * 14, max: 36, color, size: Math.random() < 0.4 ? 2 : 1, parallax: 1 });
    }
  }

  private puff(count: number, color: string, speed: number) {
    this.puffAt(this.px, this.py, count, color, speed);
  }

  /* ---------------- creatures ---------------- */

  private active(e: { x: number; y: number }): boolean {
    return Math.abs(e.x - this.px) < ACTIVE_R && Math.abs(e.y - this.py) < 420;
  }

  /** Walk a ground creature: stops at walls and at edges, follows the floor down small steps. */
  private walk(e: { x: number; y: number; dir: 1 | -1 }, vx: number, hw: number, hh: number): boolean {
    const nx = e.x + vx;
    const ahead = nx + Math.sign(vx) * hw;
    if (this.solidSpan(ahead, e.y - hh + 2, e.y - 2)) return false;
    const floor = this.floorBelow(ahead, e.y - 8, 2);
    if (floor === null) return false;
    e.x = nx;
    e.y = floor;
    return true;
  }

  /** How far Lanterne's light reaches: crouching hides it. */
  private lightReach(): number {
    if (this.deadT > 0) return 0;
    return (this.crouching ? 40 : 210) + (this.flare > 0 ? 60 : 0) + (this.chargeT > 14 ? 80 : 0);
  }

  private killBeetle(be: Beetle) {
    be.state = "dead";
    be.t = 0;
    be.vx = 0;
    this.hitStop = 2;
    this.audio.sfx("die");
    this.burst(be.x, be.y - 16, 18, "#8fe3ff", 2.4);
    this.burst(be.x, be.y - 16, 6, "#ffffff", 1.4);
    if (Math.random() < 0.34 && this.hp < this.maxHp) this.dropItem(be.x, be.y, "light");
  }

  private tickBeetles() {
    for (const be of this.beetles) {
      if (!this.active(be)) continue;
      be.t += 1;
      if (be.state === "dead") continue;
      if (be.t % 150 === 0) be.dir = Math.random() < 0.5 ? -1 : 1;
      if (Math.abs(be.x - be.home) > 130) be.dir = be.x > be.home ? -1 : 1;
      const near = Math.abs(this.px - be.x) < 90 && Math.abs(this.py - be.y) < 60 && this.deadT === 0;
      if (near && be.t % 90 < 45) be.dir = this.px > be.x ? 1 : -1;
      be.vx = be.dir * (near ? 1.0 : 0.6);
      if (!this.walk(be, be.vx, 14, 20)) be.dir = (be.dir * -1) as 1 | -1;
      if (this.vy > 0 && this.invuln === 0 && Math.abs(this.px - be.x) < 20 && this.py > be.y - 36 && this.py < be.y - 6) {
        this.killBeetle(be);
        this.vy = -5.6;
        this.onGround = false;
        this.puffAt(be.x, be.y - 20, 4, "#bff4ff", 1.2);
        continue;
      }
      if (this.playerBoxHits(be.x - 14, be.x + 14, be.y - 28, be.y)) this.hurtPlayer(be.x, "beetle");
    }
    this.beetles = this.beetles.filter((be) => !(be.state === "dead" && be.t > 16));
  }

  private hitWolf(w: Wolf, knock: 1 | -1, dmg: number) {
    w.hp -= dmg;
    w.flash = 8;
    this.hitStop = dmg > 1 ? 5 : 3;
    this.shake = 4;
    this.pop(w.x, w.y - 64, String(dmg), dmg > 1 ? "#ffffff" : "#fff1a8");
    if (w.hp <= 0) {
      w.state = "dead";
      w.t = 0;
      w.vx = knock * 1.5;
      this.audio.sfx("die");
      this.burst(w.x, w.y - 26, 22, "#9a9a9a", 2.4);
      this.burst(w.x, w.y - 26, 8, "#ff8a3a", 2);
      if (Math.random() < 0.25 && this.hp < this.maxHp) this.dropItem(w.x, w.y, "light");
      return;
    }
    w.state = "hurt";
    w.t = 0;
    w.vx = knock * 2.6;
    this.audio.sfx("enemy");
  }

  /** The Pack: sleeps in the dark, wakes to a shown light, hunts in bursts, loses a hidden lantern. */
  private tickWolves() {
    for (const w of this.wolves) {
      if (!this.active(w)) continue;
      w.t += 1;
      if (w.flash > 0) w.flash -= 1;
      const dx = this.px - w.x;
      const dist = Math.abs(dx);
      const sameLevel = Math.abs(this.py - w.y) < 90;
      const seesLight = sameLevel && dist < this.lightReach() + 60 && this.deadT === 0;
      switch (w.state) {
        case "sleep": {
          // Only a shown light, or a step too close, wakes it.
          if ((seesLight && dist < w.range) || (sameLevel && dist < 24)) {
            w.state = "hunt";
            w.t = 0;
            w.lost = 0;
            this.audio.sfx("enemy");
            this.burst(w.x, w.y - 30, 8, "#ff8a3a", 1.4);
          }
          break;
        }
        case "prowl": {
          if (w.t % 100 === 1) w.dir = Math.random() < 0.5 ? -1 : 1;
          if (Math.abs(w.x - w.home) > 140) w.dir = w.x > w.home ? -1 : 1;
          if (!this.walk(w, w.dir * 0.8, 20, 40)) w.dir = (w.dir * -1) as 1 | -1;
          if (seesLight && dist < 240) {
            w.state = "hunt";
            w.t = 0;
            w.lost = 0;
          }
          break;
        }
        case "hunt": {
          w.dir = dx > 0 ? 1 : -1;
          if (!this.walk(w, w.dir * 2.4, 20, 40)) {
            // Blocked: pace and wait.
            w.t += 2;
          }
          if (seesLight) w.lost = 0;
          else w.lost += 1;
          if (dist < 76 && sameLevel && w.t > 12) {
            w.state = "tell";
            w.t = 0;
            w.hitDone = false;
          } else if (w.lost > 70 || dist > 520) {
            // The light is gone: the pack goes back to its posts.
            w.state = "prowl";
            w.t = 0;
            w.home = w.x;
          }
          break;
        }
        case "tell": {
          // Crouched, ember eyes flaring: the tell before the lunge.
          if (w.t > 18) {
            w.state = "lunge";
            w.t = 0;
            w.dir = dx > 0 ? 1 : -1;
            this.audio.sfx("throw");
          }
          break;
        }
        case "lunge": {
          if (w.t < 12) this.walk(w, w.dir * 5, 20, 40);
          if (!w.hitDone && w.t < 14 && this.playerBoxHits(w.x - 26, w.x + 26, w.y - 46, w.y)) {
            w.hitDone = true;
            this.hurtPlayer(w.x, "wolf");
          }
          if (w.t > 26) {
            w.state = "retreat";
            w.t = 0;
          }
          break;
        }
        case "retreat": {
          // Backs off after a bite, then comes again.
          this.walk(w, -w.dir * 1.6, 20, 40);
          if (w.t > 28) {
            w.state = "hunt";
            w.t = 0;
          }
          break;
        }
        case "hurt": {
          w.vx *= 0.85;
          this.walk(w, w.vx, 20, 40);
          if (w.t > 20) {
            w.state = "hunt";
            w.t = 0;
          }
          break;
        }
        case "dead": {
          w.vx *= 0.9;
          this.walk(w, w.vx, 20, 40);
          break;
        }
        default:
          break;
      }
    }
    this.wolves = this.wolves.filter((w) => !(w.state === "dead" && w.t > 480));
  }

  private hitDormant(d: Dormant, knock: 1 | -1, dmg: number) {
    if (d.state === "cocoon") {
      // Struck in its sleep: it wakes, and it is not pleased.
      d.state = "wake";
      d.t = 0;
      this.audio.sfx("armor");
      this.burst(d.x, d.y - 70, 12, "#6fb3a8", 1.8);
      return;
    }
    d.hp -= dmg;
    d.flash = 8;
    this.hitStop = dmg > 1 ? 5 : 3;
    this.shake = 4;
    this.pop(d.x, d.y - 136, String(dmg), dmg > 1 ? "#ffffff" : "#fff1a8");
    if (d.hp <= 0) {
      d.state = "dying";
      d.t = 0;
      this.audio.sfx("die");
      this.burst(d.x, d.y - 60, 30, "#6fb3a8", 2.6);
      this.dropItem(d.x, d.y, "light");
      return;
    }
    if (d.state !== "swipe") {
      d.state = "hurt";
      d.t = 0;
      d.x += knock * 4;
    }
    this.audio.sfx("enemy");
  }

  /** The Sleepers: cocooned in roots, woken by a blow or by a light lingering too close. */
  private tickDormants() {
    for (const d of this.dormants) {
      if (!this.active(d)) continue;
      d.t += 1;
      if (d.flash > 0) d.flash -= 1;
      const dx = this.px - d.x;
      const dist = Math.abs(dx);
      const sameLevel = Math.abs(this.py - d.y) < 100;
      switch (d.state) {
        case "cocoon": {
          if (sameLevel && dist < this.lightReach() - 100 && this.deadT === 0) d.wakeT += 1;
          else d.wakeT = Math.max(0, d.wakeT - 2);
          if (d.wakeT > 90) {
            d.state = "wake";
            d.t = 0;
            this.audio.sfx("armor");
          }
          break;
        }
        case "wake": {
          if (d.t > 50) {
            d.state = "walk";
            d.t = 0;
          }
          break;
        }
        case "walk": {
          d.dir = dx > 0 ? 1 : -1;
          if (!this.walk(d, d.dir * 0.6, 18, 120)) d.t += 1;
          if (dist < 64 && sameLevel) {
            d.state = "windup";
            d.t = 0;
            d.hitDone = false;
          }
          break;
        }
        case "windup": {
          if (d.t > 26) {
            d.state = "swipe";
            d.t = 0;
            this.audio.sfx("throw");
          }
          break;
        }
        case "swipe": {
          if (d.t > 4 && d.t < 16 && !d.hitDone) {
            const x0 = d.dir > 0 ? d.x : d.x - 70;
            const x1 = d.dir > 0 ? d.x + 70 : d.x;
            if (this.playerBoxHits(x0, x1, d.y - 110, d.y)) {
              d.hitDone = true;
              this.hurtPlayer(d.x, "dormant");
            }
          }
          if (d.t > 40) {
            d.state = "walk";
            d.t = 0;
          }
          break;
        }
        case "hurt": {
          if (d.t > 16) {
            d.state = "walk";
            d.t = 0;
          }
          break;
        }
        case "dying": {
          if (d.t > 40) {
            d.state = "dead";
            d.t = 0;
          }
          break;
        }
        default:
          break;
      }
    }
  }

  private killMoth(m: Moth) {
    m.state = "dead";
    m.t = 0;
    this.pop(m.x, m.y - 14, "1", "#ffd27a");
    this.audio.sfx("enemy");
    this.burst(m.x, m.y, 12, "#ff8a3a", 1.8);
    this.burst(m.x, m.y, 6, "#9a9a9a", 1.2);
  }

  /** Ash moths: drawn to the lantern, they drift in and burn out on contact. */
  private tickMoths() {
    for (const m of this.moths) {
      if (!this.active(m)) continue;
      m.t += 1;
      if (m.state === "dead") continue;
      const dx = this.px - m.x;
      const dy = this.py - 60 - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist < this.lightReach() + 120 && this.deadT === 0) {
        m.vx += (dx / Math.max(1, dist)) * 0.06;
        m.vy += (dy / Math.max(1, dist)) * 0.05;
      } else {
        m.vx += ((m.home - m.x) * 0.002 + Math.sin(m.t / 30)) * 0.03;
        m.vy += (m.hy - m.y) * 0.003;
      }
      m.vx = Math.max(-1.3, Math.min(1.3, m.vx * 0.97));
      m.vy = Math.max(-1, Math.min(1, m.vy * 0.97 + Math.sin(m.t / 8) * 0.03));
      m.x += m.vx;
      m.y += m.vy;
      m.dir = m.vx > 0 ? 1 : -1;
      if (this.solidAt(m.x, m.y)) {
        m.vx *= -0.5;
        m.vy *= -0.5;
        m.x -= m.vx * 2;
        m.y -= m.vy * 2;
      }
      if (this.playerBoxHits(m.x - 10, m.x + 10, m.y - 8, m.y + 8)) {
        this.hurtPlayer(m.x, "moth");
        this.killMoth(m);
      }
    }
    this.moths = this.moths.filter((m) => !(m.state === "dead" && m.t > 20));
  }

  private hitEye(e: Eye, dmg = 1) {
    e.hp -= dmg;
    e.flash = 6;
    this.hitStop = dmg > 1 ? 5 : 2;
    this.shake = 4;
    this.pop(e.x, e.y - this.lore.eye.cell.h - 6, String(dmg), dmg > 1 ? "#ffffff" : "#fff1a8");
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
      if (!this.active(e)) continue;
      e.t += 1;
      if (e.flash > 0) e.flash -= 1;
      const dist = this.px - e.x;
      const hoverY = e.fy - 16 + Math.sin(e.t / 22) * 6;
      switch (e.state) {
        case "hover": {
          e.dir = dist > 0 ? 1 : -1;
          const target = Math.max(e.home - 160, Math.min(e.home + 160, this.px));
          e.x += Math.max(-0.7, Math.min(0.7, (target - e.x) * 0.02));
          e.y += (hoverY - e.y) * 0.1;
          if (e.t > 80 && Math.abs(dist) < 46 && Math.abs(this.py - e.fy) < 60 && this.deadT === 0) {
            e.state = "charge";
            e.t = 0;
            this.audio.sfx("timer");
          }
          break;
        }
        case "charge": {
          e.y += (e.fy - 56 - e.y) * 0.1;
          e.x += Math.sin(e.t * 1.7) * 0.8;
          if (e.t > 44) {
            e.state = "slam";
            e.t = 0;
          }
          break;
        }
        case "slam": {
          e.y += 9;
          if (e.y >= e.fy) {
            e.y = e.fy;
            e.state = "landed";
            e.t = 0;
            this.shake = 10;
            this.audio.sfx("boss");
            this.puffAt(e.x, e.fy, 16, "#8fa9b8", 2.4);
            if (Math.abs(dist) < 40 && this.py > e.fy - 30 && this.py <= e.fy + 2) this.hurtPlayer(e.x, "slam");
            this.bossShots.push({ x: e.x + 30, y: e.fy - 10, vx: 3.2, vy: 0, w: 14, h: 10, life: 70, dead: false, kind: "shard", fy: e.fy });
            this.bossShots.push({ x: e.x - 30, y: e.fy - 10, vx: -3.2, vy: 0, w: 14, h: 10, life: 70, dead: false, kind: "shard", fy: e.fy });
          }
          break;
        }
        case "landed": {
          if (e.t > 4 && this.playerBoxHits(e.x - 30, e.x + 30, e.fy - 60, e.fy)) this.hurtPlayer(e.x, "claws");
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
          e.y = Math.min(e.fy, e.y + 3);
          if (e.t % 8 === 0) {
            this.burst(e.x + (Math.random() - 0.5) * 60, e.y - 20 - Math.random() * (ch - 40), 8, Math.random() < 0.5 ? "#ffd27a" : "#ff5a2a", 2.2);
            this.audio.sfx("enemy");
          }
          if (e.t > 48) {
            e.state = "dead";
            e.t = 0;
            e.y = e.fy;
            this.shake = 6;
            this.burst(e.x, e.fy - 30, 24, "#9fb0bd", 2.6);
          }
          break;
        }
        default:
          break;
      }
    }
  }

  private tickRoots() {
    for (const r of this.roots) {
      if (!this.active(r)) continue;
      r.t += 1;
      const near = Math.abs(this.px - r.x) < 150 && Math.abs(this.py - r.y) < 80;
      switch (r.state) {
        case "dormant":
          if (r.t > 70 && near && this.deadT === 0) {
            r.state = "warn";
            r.t = 0;
          }
          break;
        case "warn":
          if (r.t % 4 === 0) this.puffAt(r.x, r.y, 1, "#6f95a3", 0.9);
          if (r.t > 40) {
            r.state = "rise";
            r.t = 0;
            this.audio.sfx("armor");
            this.puffAt(r.x, r.y, 10, "#6f95a3", 1.8);
          }
          break;
        case "rise":
          if (r.t > 4 && this.playerBoxHits(r.x - 20, r.x + 20, r.y - 70, r.y)) this.hurtPlayer(r.x, "root");
          if (r.t > 9) {
            r.state = "up";
            r.t = 0;
          }
          break;
        case "up":
          if (this.playerBoxHits(r.x - 22, r.x + 22, r.y - 92, r.y)) this.hurtPlayer(r.x, "root");
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

  /** Polite jellyfish: they drift up and down and carry whatever stands on their bell. */
  private tickJellies() {
    for (const j of this.jellies) {
      j.t += 1;
      const ny = j.home + Math.sin(j.t / 90 + j.phase) * j.range;
      j.vy = ny - j.y;
      j.y = ny;
      if (this.onJelly === j) this.py = j.y;
    }
  }

  /** The Scaled Ones: they hold perfect stillness, then are gone in a breath. Never a threat. */
  private tickWatchers() {
    for (const w of this.watchers) {
      if (!this.active(w)) continue;
      w.t += 1;
      const dist = Math.abs(this.px - w.x);
      if (w.state === "still") {
        w.dir = this.px > w.x ? 1 : -1;
        if (dist < 110 && Math.abs(this.py - w.y) < 60) {
          w.state = "flee";
          w.t = 0;
          w.dir = this.px > w.x ? -1 : 1;
          this.puffAt(w.x, w.y, 6, "#6f95a3", 1.6);
        }
      } else if (w.state === "flee") {
        if (!this.walk(w, w.dir * 4.2, 14, 80)) w.dir = (w.dir * -1) as 1 | -1;
        if (w.t > 70) w.state = "gone";
      }
    }
    this.watchers = this.watchers.filter((w) => w.state !== "gone");
  }

  /* ---------------- the Machine ---------------- */

  private hitBoss(b: Boss, dmg = 1) {
    const fy = this.world.arena.y;
    b.hp -= dmg;
    b.flash = 6;
    b.hits += dmg;
    this.hitStop = dmg > 1 ? 5 : 2;
    this.pop(b.x + (Math.random() - 0.5) * 40, fy - 130, String(dmg), dmg > 1 ? "#ffffff" : "#fff1a8");
    this.audio.sfx("bossHit");
    if (!b.summoned && b.hp <= BOSS_HP / 2) {
      b.summoned = true;
      const a = this.world.arena;
      this.spawn({ kind: "beetle", x: a.l + 40, y: fy, dir: 1 });
      this.spawn({ kind: "beetle", x: a.r - 40, y: fy, dir: -1 });
      this.puffAt(a.l + 40, fy, 8, "#8fe3ff", 1.6);
      this.puffAt(a.r - 40, fy, 8, "#8fe3ff", 1.6);
    }
    if (b.hp <= 0) {
      b.state = "dying";
      b.t = 0;
      b.vx = 0;
      this.bossShots = [];
      this.beetles = this.beetles.filter((be) => Math.abs(be.x - b.x) > 600);
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
    const arena = this.world.arena;
    const fy = arena.y;
    b.t += 1;
    if (b.flash > 0) b.flash -= 1;
    const dist = this.px - b.x;
    const front = b.x + b.dir * 84;
    switch (b.state) {
      case "enter": {
        b.vx = -1.1;
        if (b.x < arena.r - 150) {
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
          this.puffAt(b.x - b.dir * 40, fy, 5, "#6f95a3", 1.4);
        }
        if (Math.abs(dist) < 130 || b.t > 110) {
          b.state = "idle";
          b.t = 26;
          b.vx = 0;
        }
        break;
      }
      case "stomp": {
        b.vx = 0;
        if (b.t === 34) {
          this.shake = 14;
          this.audio.sfx("boss");
          this.puffAt(front, fy, 18, "#8fa9b8", 2.6);
          if (Math.abs(this.px - front) < 60 && this.py > fy - 30) this.hurtPlayer(b.x, "stomp");
          this.bossShots.push({ x: front, y: fy - 10, vx: b.dir * 3.6, vy: 0, w: 14, h: 10, life: 140, dead: false, kind: "shard", fy });
          this.bossShots.push({ x: b.x - b.dir * 60, y: fy - 10, vx: -b.dir * 3.2, vy: 0, w: 14, h: 10, life: 140, dead: false, kind: "shard", fy });
        }
        if (b.t > 70) {
          b.state = "idle";
          b.t = 10;
        }
        break;
      }
      case "blast": {
        b.vx = 0;
        if (b.t === 44) {
          this.audio.sfx("throw");
          this.shake = 6;
          const ey = fy - 118;
          this.bossShots.push({ x: b.x + b.dir * 70, y: ey, vx: b.dir * 5.4, vy: 0.55, w: 36, h: 10, life: 120, dead: false, kind: "bolt", fy });
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
          this.burst(b.x + (Math.random() - 0.5) * 140, fy - 30 - Math.random() * 120, 12, Math.random() < 0.5 ? "#ffd27a" : "#ff5a2a", 2.8);
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
          this.burst(b.x, fy - 80, 60, "#fff1a8", 4);
          this.shake = 16;
        }
        break;
      }
      default:
        break;
    }
    b.x += b.vx;
    b.x = Math.max(arena.l + 90, Math.min(arena.r - 90, b.x));
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
      if (s.kind === "shard" && s.y > s.fy - 10) s.y = s.fy - 10;
      if (s.kind === "bolt" && s.y > s.fy - 24) s.vy = 0;
      s.life -= 1;
      if (s.life <= 0 || this.solidAt(s.x + Math.sign(s.vx) * s.w * 0.5, s.y) || Math.abs(s.x - this.px) > 700) s.dead = true;
      if (this.time % 3 === 0) {
        this.particles.push({ x: s.x, y: s.y + (Math.random() - 0.5) * s.h, vx: -s.vx * 0.1, vy: (Math.random() - 0.5) * 0.4, life: 12, max: 12, color: s.kind === "bolt" ? "#ffd27a" : "#9fb0bd", size: s.kind === "bolt" ? 2 : 1, parallax: 1 });
      }
      if (!s.dead && this.playerBoxHits(s.x - s.w / 2, s.x + s.w / 2, s.y - s.h / 2, s.y + s.h / 2)) {
        this.hurtPlayer(s.x, s.kind);
        s.dead = true;
      }
    }
    this.bossShots = this.bossShots.filter((s) => !s.dead);
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
    const cam = Math.round(this.camX) + (this.shake > 0 ? Math.round((Math.random() - 0.5) * 6) : 0);
    const camY = Math.round(this.camY) + (this.shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0);
    const zone = this.zoneAt(this.px);

    this.drawBackground(cam, camY, zone);
    this.drawTiles(cam, camY);
    this.drawProps(cam, camY);
    this.drawGate(cam, camY);
    this.drawParticles(cam, camY, (p) => p.parallax < 1);
    for (const w of this.wolves) if (w.state === "dead") this.drawWolf(w, cam, camY);
    for (const e of this.eyes) if (e.state === "dead") this.drawEye(e, cam, camY);
    for (const d of this.dormants) if (d.state === "dead") this.drawDormant(d, cam, camY);
    if (this.boss && (this.boss.state === "dead" || this.boss.state === "dying")) this.drawBoss(this.boss, cam, camY);
    for (const j of this.jellies) this.drawJelly(j, cam, camY);
    this.drawItems(cam, camY);
    for (const be of this.beetles) this.drawBeetle(be, cam, camY);
    for (const w of this.watchers) this.drawWatcher(w, cam, camY);
    this.drawGhosts(cam, camY);
    this.drawPlayer(cam, camY);
    for (const w of this.wolves) if (w.state !== "dead") this.drawWolf(w, cam, camY);
    for (const d of this.dormants) if (d.state !== "dead") this.drawDormant(d, cam, camY);
    for (const e of this.eyes) if (e.state !== "dead") this.drawEye(e, cam, camY);
    for (const m of this.moths) this.drawMoth(m, cam, camY);
    for (const r of this.roots) this.drawRoot(r, cam, camY);
    if (this.boss && this.boss.state !== "dead" && this.boss.state !== "dying" && this.boss.state !== "asleep") this.drawBoss(this.boss, cam, camY);
    this.drawShots(cam, camY);
    this.drawBossShots(cam, camY);
    this.drawParticles(cam, camY, (p) => p.parallax >= 1);
    this.drawPops(cam, camY);

    this.renderLighting(0.5 + zone.dark);
    this.drawForeground(cam, camY);
    const fx = this.fxCanvas.getContext("2d");
    if (fx) {
      fx.globalCompositeOperation = "source-over";
      fx.clearRect(0, 0, VIEW_W, VIEW_H);
      this.drawFog(fx, cam, camY);
      this.drawVignette(fx);
      this.ditherAlpha(this.fxCanvas, 8, false);
      ctx.drawImage(this.fxCanvas, 0, 0);
    }
    this.drawHud();
    if (this.menu) this.drawMenu();
  }

  /** The painted forest, parallaxed on both axes, with the dark of the canopy above and the deep below. */
  private drawBackground(cam: number, camY: number, zone: Zone) {
    const ctx = this.ctx;
    ctx.fillStyle = "#041022";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const baseY = this.world.start.y - 176;
    const bgY = Math.round(52 - (camY - baseY) * 0.3);
    // Above the painting: the canopy fades to black; below: deep rock.
    const g = ctx.createLinearGradient(0, bgY - 200, 0, bgY + 20);
    g.addColorStop(0, "#02060f");
    g.addColorStop(1, "#08203c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, Math.max(0, bgY + 20));
    this.drawTiled(this.bg, 0.45, bgY, cam);
    const g2 = ctx.createLinearGradient(0, bgY + this.bg.height - 30, 0, bgY + this.bg.height + 120);
    g2.addColorStop(0, "rgba(4, 16, 34, 0)");
    g2.addColorStop(1, "#02060f");
    ctx.fillStyle = g2;
    ctx.fillRect(0, bgY + this.bg.height - 30, VIEW_W, VIEW_H);
    const fx = this.fxCanvas.getContext("2d");
    if (fx) {
      fx.globalCompositeOperation = "source-over";
      fx.clearRect(0, 0, VIEW_W, VIEW_H);
      const hazeY = bgY + this.bg.height - 100;
      const haze = fx.createLinearGradient(0, hazeY, 0, hazeY + 110);
      haze.addColorStop(0, "rgba(60, 140, 220, 0)");
      haze.addColorStop(1, "rgba(60, 140, 220, 0.25)");
      fx.fillStyle = haze;
      fx.fillRect(0, hazeY, VIEW_W, 110);
      if (!zone.cave) this.drawLightShafts(fx, cam);
      this.ditherAlpha(this.fxCanvas, 8, true);
      ctx.drawImage(this.fxCanvas, 0, 0);
    }
    this.collectBackgroundLights(cam, bgY);
  }

  private drawTiles(cam: number, camY: number) {
    const ctx = this.ctx;
    const tx0 = Math.max(0, Math.floor(cam / TILE));
    const tx1 = Math.min(MAP_W - 1, Math.floor((cam + VIEW_W) / TILE) + 1);
    const ty0 = Math.max(0, Math.floor(camY / TILE));
    const ty1 = Math.min(MAP_H - 1, Math.floor((camY + VIEW_H) / TILE) + 1);
    for (let ty = ty0; ty <= ty1; ty += 1) {
      for (let tx = tx0; tx <= tx1; tx += 1) {
        const v = tileAt(this.grid, tx, ty);
        if (v === EMPTY) continue;
        const seed = (tx * 7 + ty * 13) % 4;
        let col: number;
        if (v === ONEWAY) {
          col = 16 + ((tx * 5) % 4);
        } else {
          const up = tileAt(this.grid, tx, ty - 1) !== SOLID ? 1 : 0;
          const right = tileAt(this.grid, tx + 1, ty) !== SOLID ? 2 : 0;
          const down = tileAt(this.grid, tx, ty + 1) !== SOLID ? 4 : 0;
          const left = tileAt(this.grid, tx - 1, ty) !== SOLID ? 8 : 0;
          col = up | right | down | left;
        }
        const sx = tx * TILE - cam;
        const sy = ty * TILE - camY;
        ctx.drawImage(this.tiles, col * TILE, seed * TILE, TILE, TILE, sx, sy, TILE, TILE);
        if (v === SOLID && col === 0) {
          // Deep rock: the further from any open air, the darker.
          let depth = 1;
          while (depth < 4 && tileAt(this.grid, tx, ty - depth) === SOLID && tileAt(this.grid, tx - depth, ty) === SOLID && tileAt(this.grid, tx + depth, ty) === SOLID && tileAt(this.grid, tx, ty + depth) === SOLID) depth += 1;
          ctx.fillStyle = `rgba(2, 6, 18, ${0.12 + depth * 0.13})`;
          ctx.fillRect(sx, sy, TILE, TILE);
        }
        // Mushrooms on open tops glow a little.
        if (v === SOLID && (col & 1) && (tx * 31 + ty * 17) % 5 === 0) {
          this.lights.push({ x: sx + 16, y: sy + 2, r: 26, a: 0.5, color: "rgba(90, 190, 255, 0.1)", parallax: 1 });
        }
      }
    }
  }

  private drawProps(cam: number, camY: number) {
    const ctx = this.ctx;
    const L = this.lore;
    const L2 = this.lore2;
    for (const p of this.props) {
      const sx = p.x - cam;
      if (sx < -320 || sx > VIEW_W + 320) continue;
      switch (p.kind) {
        case "machineProp": {
          ctx.globalAlpha = 0.9;
          ctx.drawImage(this.machinePropImg, Math.round(sx - L2.machine.w / 2), Math.round(p.y - L2.machine.h + 10 - camY));
          ctx.globalAlpha = 1;
          this.lights.push({ x: sx - 90, y: p.y - 70 - camY, r: 30, a: 0.4, color: "rgba(255, 120, 40, 0.06)", parallax: 1 });
          break;
        }
        case "stone":
          ctx.drawImage(this.stoneImg, Math.round(sx - L2.stone.w / 2), Math.round(p.y - L2.stone.h + 4 - camY));
          this.lights.push({ x: sx, y: p.y - 30 - camY, r: 26, a: 0.5, color: "rgba(90, 190, 255, 0.12)", parallax: 1 });
          break;
        case "lantern":
          ctx.drawImage(this.lanternImg, Math.round(sx - L2.lantern.w / 2), Math.round(p.y - L2.lantern.h + 4 - camY));
          this.lights.push({ x: sx + 10, y: p.y - 46 - camY, r: 22, a: 0.4, color: "rgba(120, 180, 255, 0.08)", parallax: 1 });
          break;
        case "cocoons":
          ctx.drawImage(this.cocoonsImg, Math.round(sx - L2.cocoons.w / 2), Math.round(p.y - camY));
          this.lights.push({ x: sx, y: p.y + 70 - camY, r: 40, a: 0.6, color: "rgba(90, 190, 255, 0.14)", parallax: 1 });
          break;
        default:
          break;
      }
    }
    // The pilgrims' gong and its blue seal.
    const gong = this.world.gong;
    const gx = gong.x - cam;
    const gy = gong.y - camY;
    if (gx > -200 && gx < VIEW_W + 200) {
      const rung = this.gongDone && this.gongT < 40;
      ctx.drawImage(this.sealImg, Math.round(gx - 60 - L.seal.w / 2), Math.round(gy - L.seal.h + 6));
      const pulse = 0.85 + 0.15 * Math.sin(this.time / 12);
      this.lights.push({ x: gx - 60, y: gy - 58, r: (this.gongDone ? 70 : 34) * pulse, a: 1, color: `rgba(90, 190, 255, ${this.gongDone ? 0.42 : 0.16})`, parallax: 1 });
      ctx.drawImage(this.gongImg, Math.round(gx - L.gong.w / 2) + (rung ? Math.round(Math.sin(this.gongT * 1.5) * 2) : 0), Math.round(gy - L.gong.h + 4));
      if (rung) this.lights.push({ x: gx, y: gy - 70, r: 90 * (1 - this.gongT / 40), a: 1, color: "rgba(143, 227, 255, 0.4)", parallax: 1 });
      const pc = L.pilgrim.cell;
      const sway = (k: number) => Math.floor((this.time / 40 + k) % 2);
      this.drawSprite(this.pilgrimSheet, rung ? 2 : sway(0), pc.w, pc.h, Math.round(gx - 108 - pc.w / 2), Math.round(gy - pc.h + 4), false);
      this.drawSprite(this.pilgrimSheet, sway(1), pc.w, pc.h, Math.round(gx + 74 - pc.w / 2), Math.round(gy - pc.h + 4), true);
      this.lights.push({ x: gx - 108, y: gy - 88, r: 16, a: 0.5, color: "rgba(220, 235, 255, 0.1)", parallax: 1 });
      this.lights.push({ x: gx + 74, y: gy - 88, r: 16, a: 0.5, color: "rgba(220, 235, 255, 0.1)", parallax: 1 });
    }
    // Serrure's tavern, dug into the roots.
    const tav = this.world.tavern;
    const tx = tav.x - cam;
    const ty = tav.y - camY;
    if (tx > -200 && tx < VIEW_W + 200) {
      ctx.drawImage(this.tavernImg, Math.round(tx - L.tavern.w / 2), Math.round(ty - L.tavern.h + 8));
      const flick = 0.9 + 0.1 * Math.sin(this.time / 5);
      this.lights.push({ x: tx + 6, y: ty - 46, r: 64 * flick, a: 1, color: "rgba(255, 190, 110, 0.3)", parallax: 1 });
      this.lights.push({ x: tx - 60, y: ty - 100, r: 30, a: 0.6, color: "rgba(90, 190, 255, 0.12)", parallax: 1 });
      const sc = L.serrure.cell;
      const waving = this.tavernDone && this.tavernT < 140;
      const frame = waving ? (Math.floor(this.tavernT / 12) % 2 === 0 ? 2 : 1) : Math.floor(this.time / 45) % 2;
      this.drawSprite(this.serrureSheet, frame, sc.w, sc.h, Math.round(tx - 44 - sc.w / 2), Math.round(ty - sc.h + 4), false);
    }
  }

  private drawGate(cam: number, camY: number) {
    const ctx = this.ctx;
    const g = this.pMeta.gate;
    const gate = this.world.gate;
    const sx = Math.round(gate.x - g.w / 2 - cam);
    if (sx + g.w < -10 || sx > VIEW_W + 10) return;
    const sy = Math.round(gate.y - g.h + 8 - camY);
    ctx.drawImage(this.gateImg, sx, sy);
    const pulse = 0.6 + 0.4 * Math.sin(this.time / 14);
    if (this.gateOpen) {
      this.lights.push({ x: gate.x - cam, y: gate.y - 70 - camY, r: 120 * (0.9 + 0.1 * pulse), a: 1, color: "rgba(143, 227, 255, 0.35)", parallax: 1 });
      if (this.time % 4 === 0) this.particles.push({ x: gate.x + (Math.random() - 0.5) * 40, y: gate.y - 10 - Math.random() * 100, vx: (Math.random() - 0.5) * 0.3, vy: -0.4 - Math.random() * 0.4, life: 60, max: 60, color: "#bff4ff", size: 1, parallax: 1 });
    } else {
      ctx.fillStyle = "rgba(2, 6, 18, 0.55)";
      ctx.fillRect(sx + 30, sy + 40, g.w - 60, g.h - 50);
      this.lights.push({ x: gate.x - cam, y: gate.y - 70 - camY, r: 40, a: 0.4, color: "rgba(143, 227, 255, 0.08)", parallax: 1 });
    }
  }

  private drawItems(cam: number, camY: number) {
    const ctx = this.ctx;
    for (const it of this.items) {
      const meta = it.kind === "lily" ? this.lore.lily : this.lore.light;
      const img = it.kind === "lily" ? this.lilyImg : this.lightImg;
      const bob = Math.round(Math.sin(this.time / 18 + it.x) * 2);
      const x = Math.round(it.x - meta.w / 2 - cam);
      const y = Math.round(it.y - meta.h - 3 - camY) + bob;
      if (x + meta.w < 0 || x > VIEW_W || y < -40 || y > VIEW_H + 40) continue;
      ctx.drawImage(img, x, y);
      const warm = it.kind === "light";
      this.lights.push({ x: it.x - cam, y: y + meta.h / 2, r: warm ? 40 : 26, a: 0.9, color: warm ? "rgba(255, 210, 120, 0.3)" : "rgba(220, 240, 255, 0.16)", parallax: 1 });
    }
  }

  private shadow(x: number, y: number, rx: number) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(2, 6, 18, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + 1, rx, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private onScreen(x: number, y: number, margin = 80): boolean {
    return x > -margin && x < VIEW_W + margin && y > -margin - 80 && y < VIEW_H + margin;
  }

  private drawBeetle(be: Beetle, cam: number, camY: number) {
    const { w: cw, h: ch } = this.lore.beetle.cell;
    const frame = be.state === "dead" ? 3 : Math.floor(be.t / 7) % 3;
    const x = Math.round(be.x - cw / 2 - cam);
    const y = Math.round(be.y - ch + 6 - camY);
    if (!this.onScreen(x, y)) return;
    const glow = be.state === "dead" ? 1.6 - be.t / 14 : 0.8 + 0.2 * Math.sin(this.time / 9 + be.home);
    this.lights.push({ x: be.x - cam, y: be.y - 16 - camY, r: 34 * Math.max(0.2, glow), a: 0.9, color: `rgba(120, 220, 255, ${0.18 * Math.max(0, glow)})`, parallax: 1 });
    this.ctx.globalAlpha = be.state === "dead" ? Math.max(0, 1 - be.t / 16) : 1;
    this.drawSprite(this.beetleSheet, frame, cw, ch, x, y, be.dir > 0);
    this.ctx.globalAlpha = 1;
  }

  private drawWolf(w: Wolf, cam: number, camY: number) {
    const { w: cw, h: ch } = this.lore2.wolf.cell;
    let sheet = this.wolfRun;
    let frame = 0;
    let alpha = 1;
    switch (w.state) {
      case "sleep":
        frame = 4;
        break;
      case "prowl":
        frame = Math.floor(w.t / 10) % 4;
        break;
      case "hunt":
      case "retreat":
        frame = Math.floor(w.t / 5) % 4;
        break;
      case "tell":
        frame = 4;
        break;
      case "lunge":
        frame = 5;
        break;
      case "hurt":
        sheet = this.wolfDie;
        frame = 0;
        break;
      case "dead":
        sheet = this.wolfDie;
        frame = Math.min(3, 1 + Math.floor(w.t / 9));
        if (w.t > 360) alpha = Math.max(0, 1 - (w.t - 360) / 120);
        break;
      default:
        break;
    }
    const flip = w.dir > 0;
    const x = Math.round(w.x - cw / 2 - cam);
    const y = Math.round(w.y - ch + 6 - camY);
    if (!this.onScreen(x, y)) return;
    if (w.state !== "dead") {
      this.shadow(w.x - cam, w.y - camY, 22);
      const hot = w.state === "tell" || w.state === "lunge" || w.state === "hunt";
      const ember = w.state === "sleep" ? 0.06 + 0.04 * Math.sin(this.time / 20 + w.home) : hot ? 0.3 : 0.14;
      this.lights.push({ x: w.x - cam + w.dir * 16, y: w.y - 36 - camY, r: hot ? 30 : 16, a: 0.8, color: `rgba(255, 120, 40, ${ember})`, parallax: 1 });
    }
    this.ctx.globalAlpha = alpha;
    if (w.flash > 0 && w.flash % 2 === 0) this.drawFlashed(sheet, frame, cw, ch, x, y, flip, 0.85);
    else this.drawSprite(sheet, frame, cw, ch, x, y, flip);
    this.ctx.globalAlpha = 1;
    if (w.state !== "dead" && w.state !== "sleep" && w.hp < WOLF_HP) this.healthBar(w.x - cam, w.y - 60 - camY, w.hp / WOLF_HP, "#ff8a3a");
  }

  private drawDormant(d: Dormant, cam: number, camY: number) {
    const { w: cw, h: ch } = this.lore2.dormant.cell;
    let sheet = this.dormantWalk;
    let frame = 0;
    let alpha = 1;
    switch (d.state) {
      case "cocoon":
        frame = 0;
        break;
      case "wake":
        frame = d.t < 25 ? 1 : 2;
        break;
      case "walk":
        frame = 3 + (Math.floor(d.t / 14) % 3);
        break;
      case "windup":
        sheet = this.dormantAct;
        frame = 0;
        break;
      case "swipe":
        sheet = this.dormantAct;
        frame = 1;
        break;
      case "hurt":
        sheet = this.dormantAct;
        frame = 2;
        break;
      case "dying":
      case "dead":
        sheet = this.dormantAct;
        frame = 3;
        if (d.state === "dead" && d.t > 300) alpha = Math.max(0, 1 - (d.t - 300) / 120);
        break;
      default:
        break;
    }
    const flip = d.dir > 0;
    const x = Math.round(d.x - cw / 2 - cam);
    const y = Math.round(d.y - ch + 6 - camY);
    if (!this.onScreen(x, y, 120)) return;
    if (d.state !== "dead") this.shadow(d.x - cam, d.y - camY, 18);
    const eye = d.state === "cocoon" ? 0.06 + (d.wakeT / 90) * 0.2 : 0.22;
    this.lights.push({ x: d.x - cam + d.dir * 6, y: d.y - 118 - camY, r: 26, a: 0.7, color: `rgba(90, 220, 255, ${eye})`, parallax: 1 });
    this.ctx.globalAlpha = alpha;
    if (d.flash > 0 && d.flash % 2 === 0) this.drawFlashed(sheet, frame, cw, ch, x, y, flip, 0.8);
    else this.drawSprite(sheet, frame, cw, ch, x, y, flip);
    this.ctx.globalAlpha = 1;
    if (d.state !== "dead" && d.state !== "dying" && d.state !== "cocoon" && d.hp < DORMANT_HP) this.healthBar(d.x - cam, d.y - 138 - camY, d.hp / DORMANT_HP, "#6fd3c8");
  }

  private drawMoth(m: Moth, cam: number, camY: number) {
    const { w: cw, h: ch } = this.lore2.moth.cell;
    const x = Math.round(m.x - cw / 2 - cam);
    const y = Math.round(m.y - ch / 2 - camY);
    if (!this.onScreen(x, y)) return;
    if (m.state === "dead") {
      this.ctx.globalAlpha = Math.max(0, 1 - m.t / 20);
      this.drawSprite(this.mothSheet, 2, cw, ch, x, y + m.t, m.dir > 0);
      this.ctx.globalAlpha = 1;
      return;
    }
    this.lights.push({ x: m.x - cam, y: m.y - camY, r: 22, a: 0.7, color: "rgba(255, 140, 60, 0.16)", parallax: 1 });
    this.drawSprite(this.mothSheet, Math.floor(m.t / 5) % 4, cw, ch, x, y, m.dir > 0);
  }

  private drawJelly(j: Jelly, cam: number, camY: number) {
    const { w: cw, h: ch } = this.lore2.jelly.cell;
    const x = Math.round(j.x - cw / 2 - cam);
    const y = Math.round(j.y - 6 - camY);
    if (!this.onScreen(x, y)) return;
    const pulse = 0.85 + 0.15 * Math.sin(j.t / 30 + j.phase);
    this.lights.push({ x: j.x - cam, y: j.y + 24 - camY, r: 70 * pulse, a: 1, color: "rgba(120, 220, 255, 0.28)", parallax: 1 });
    this.drawSprite(this.jellySheet, Math.floor(j.t / 16) % 3, cw, ch, x, y, false);
  }

  private drawWatcher(w: Watcher, cam: number, camY: number) {
    const ch = this.rMeta.cell.h;
    const cw = this.rMeta.walk.w;
    const frame = w.state === "flee" ? Math.floor(w.t / 4) % this.rMeta.walk.n : 0;
    const x = Math.round(w.x - cw / 2 - cam);
    const y = Math.round(w.y - ch + 4 - camY);
    if (!this.onScreen(x, y)) return;
    // Barely lit: a silhouette at the edge of the light, and two golden slit eyes.
    this.ctx.globalAlpha = w.state === "still" ? 0.55 : 0.8;
    this.drawSprite(this.rWalk, frame, cw, ch, x, y, w.dir > 0);
    this.ctx.globalAlpha = 1;
    const blink = w.state === "still" ? 0.22 + 0.08 * Math.sin(this.time / 40 + w.x) : 0.1;
    this.lights.push({ x: w.x - cam + w.dir * 10, y: w.y - 84 - camY, r: 14, a: 0.7, color: `rgba(242, 193, 78, ${blink})`, parallax: 1 });
  }

  private drawEye(e: Eye, cam: number, camY: number) {
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
    const flip = e.dir > 0;
    const x = Math.round(e.x - cw / 2 - cam);
    const y = Math.round(e.y - ch - camY);
    if (!this.onScreen(x, y, 120)) return;
    if (e.state !== "dead") {
      const charge = e.state === "charge" ? e.t / 44 : 0;
      this.shadow(e.x - cam, e.fy - camY, 30);
      this.lights.push({ x: e.x - cam + e.dir * 14, y: e.y - ch + 30 - camY, r: 40 + charge * 40, a: 1, color: `rgba(255, ${charge > 0 ? 120 : 200}, ${charge > 0 ? 60 : 150}, ${0.25 + charge * 0.35})`, parallax: 1 });
    }
    this.ctx.globalAlpha = alpha;
    if (e.flash > 0 && e.flash % 2 === 0) this.drawFlashed(sheet, frame, cw, ch, x, y, flip, 0.8);
    else this.drawSprite(sheet, frame, cw, ch, x, y, flip);
    this.ctx.globalAlpha = 1;
    if (e.state !== "dead" && e.state !== "dying" && e.hp < EYE_HP) this.healthBar(e.x - cam, e.y - ch - 8 - camY, e.hp / EYE_HP, "#ff7a2a");
  }

  private drawRoot(r: Root, cam: number, camY: number) {
    const { w: cw, h: ch } = this.lore.root.cell;
    let frame = 0;
    if (r.state === "rise") frame = 1;
    else if (r.state === "up") frame = 2;
    else if (r.state === "recede") frame = 3;
    const jitter = r.state === "warn" ? Math.round(Math.sin(r.t * 2.5) * 1.5) : 0;
    const x = Math.round(r.x - cw / 2 - cam) + jitter;
    const y = Math.round(r.y - ch + 6 - camY);
    if (!this.onScreen(x, y)) return;
    this.drawSprite(this.rootSheet, frame, cw, ch, x, y, false);
    if (r.state === "up" || r.state === "rise") this.lights.push({ x: r.x - cam, y: r.y - 70 - camY, r: 36, a: 0.6, color: "rgba(90, 190, 255, 0.1)", parallax: 1 });
  }

  private healthBar(sx: number, sy: number, frac: number, color: string) {
    const ctx = this.ctx;
    const bx = Math.round(sx) - 14;
    const by = Math.round(sy);
    ctx.fillStyle = "rgba(2, 6, 18, 0.8)";
    ctx.fillRect(bx - 1, by - 1, 30, 4);
    ctx.fillStyle = color;
    ctx.fillRect(bx, by, Math.round(28 * Math.max(0, frac)), 2);
  }

  private drawBossShots(cam: number, camY: number) {
    const ctx = this.ctx;
    for (const s of this.bossShots) {
      const x = Math.round(s.x - cam);
      const y = Math.round(s.y - camY);
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

  private drawBoss(b: Boss, cam: number, camY: number) {
    const { w: cw, h: ch } = this.mMeta.cell;
    const fy = this.world.arena.y;
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
    const flip = b.dir > 0;
    const x = Math.round(b.x - cw / 2 - cam);
    const y = Math.round(fy - ch + 10 - camY);
    if (b.state !== "dead" && b.state !== "dying") {
      const charge = b.state === "blast" ? Math.min(1, b.t / 44) : 0;
      this.lights.push({ x: b.x - cam + b.dir * 62, y: fy - 118 - camY, r: 44 + charge * 50, a: 1, color: `rgba(255, 160, 50, ${0.28 + charge * 0.4})`, parallax: 1 });
    } else if (b.state === "dying") {
      this.lights.push({ x: b.x - cam, y: fy - 90 - camY, r: 90, a: 1, color: `rgba(255, 120, 40, ${0.3 * (1 - b.t / 130)})`, parallax: 1 });
    }
    if (b.state !== "dead") {
      this.ctx.fillStyle = "rgba(2, 6, 18, 0.4)";
      this.ctx.beginPath();
      this.ctx.ellipse(b.x - cam, fy + 2 - camY, 80, 6, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
    if (b.flash > 0 && b.flash % 2 === 0) this.drawFlashed(sheet, frame, cw, ch, x, y, flip, 0.7);
    else this.drawSprite(sheet, frame, cw, ch, x, y, flip);
  }

  private drawShots(cam: number, camY: number) {
    const ctx = this.ctx;
    for (const sh of this.shots) {
      const x = Math.round(sh.x - cam);
      const y = Math.round(sh.y - camY);
      if (sh.power > 1) {
        const k = 0.9 + 0.1 * Math.sin(this.time);
        this.lights.push({ x, y, r: 110 * k, a: 1, color: "rgba(255, 230, 160, 0.5)", parallax: 1 });
        ctx.fillStyle = "#ffb347";
        ctx.fillRect(x - 9, y - 5, 18, 10);
        ctx.fillRect(x - 5, y - 9, 10, 18);
        ctx.fillStyle = "#fff1a8";
        ctx.fillRect(x - 7, y - 3, 14, 6);
        ctx.fillRect(x - 3, y - 7, 6, 14);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 4, y - 2, 8, 4);
        ctx.fillRect(x - 2, y - 4, 4, 8);
        if (this.time % 2 === 0) this.particles.push({ x: sh.x - sh.vx * 2, y: sh.y + (Math.random() - 0.5) * 10, vx: -sh.vx * 0.1, vy: (Math.random() - 0.5) * 0.6, life: 16, max: 16, color: "#ffd27a", size: 2, parallax: 1 });
        continue;
      }
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

  /** Which sheet and frame Lanterne shows right now. */
  private pose(): Pose {
    const { w: cw, h: ch } = this.anim.cell;
    const moving = Math.abs(this.vx) > 0.3 && this.onGround;
    let sheet = this.idleSheet;
    let frame = Math.floor(this.time / 9) % this.anim.idle;
    let cellW = cw;
    let cellH = ch;
    if (this.deadT > 0) {
      sheet = this.hurtSheet;
      frame = 1;
    } else if (this.hurtT > 0) {
      sheet = this.hurtSheet;
      frame = this.hurtT > 16 ? 0 : this.hurtT > 6 ? 1 : 2;
    } else if (this.rollT > 0) {
      sheet = this.rollSheet;
      cellW = this.extra.roll.cell.w;
      frame = Math.min(this.extra.roll.n - 1, Math.floor(((ROLL_T - this.rollT) * this.extra.roll.n) / ROLL_T));
    } else if (this.bigThrowT > 0) {
      sheet = this.chargeSheet;
      cellW = this.extra.charge.cell.w;
      cellH = this.extra.charge.cell.h;
      frame = this.bigThrowT < 6 ? 2 : 3;
    } else if (this.chargeT > 16 && this.onGround && this.throwT === 0 && !moving && !this.crouching) {
      sheet = this.chargeSheet;
      cellW = this.extra.charge.cell.w;
      cellH = this.extra.charge.cell.h;
      frame = this.chargeT >= CHARGE_T ? 2 : this.chargeT > 28 ? 1 : 0;
    } else if (this.crouching || (this.throwT > 0 && this.throwLow && this.onGround)) {
      sheet = this.crouchSheet;
      cellW = this.extra.crouch.cell.w;
      frame = this.throwT > 0 ? (this.throwT < 12 ? 2 : 3) : this.crouchT < 4 ? 0 : 1;
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
    return { sheet, frame, cw: cellW, ch: cellH };
  }

  private ghostOf(): Ghost {
    const p = this.pose();
    return { x: this.px, y: this.py, sheet: p.sheet, frame: p.frame, cw: p.cw, ch: p.ch, flip: this.dir < 0, life: 12 };
  }

  private drawSprite(sheet: HTMLImageElement, frame: number, cw: number, ch: number, x: number, y: number, flip: boolean) {
    const ctx = this.ctx;
    if (flip) {
      ctx.save();
      ctx.translate(x + cw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, frame * cw, 0, cw, ch, 0, y, cw, ch);
      ctx.restore();
    } else {
      ctx.drawImage(sheet, frame * cw, 0, cw, ch, x, y, cw, ch);
    }
  }

  /** A frame washed white on a scratch canvas: only the sprite's own pixels light up. */
  private drawFlashed(sheet: HTMLImageElement, frame: number, cw: number, ch: number, x: number, y: number, flip: boolean, alpha: number) {
    const fc = this.flashCanvas.getContext("2d");
    if (!fc) return;
    fc.imageSmoothingEnabled = false;
    fc.globalCompositeOperation = "source-over";
    fc.clearRect(0, 0, cw, ch);
    fc.drawImage(sheet, frame * cw, 0, cw, ch, 0, 0, cw, ch);
    fc.globalCompositeOperation = "source-atop";
    fc.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    fc.fillRect(0, 0, cw, ch);
    const ctx = this.ctx;
    if (flip) {
      ctx.save();
      ctx.translate(x + cw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.flashCanvas, 0, 0, cw, ch, 0, y, cw, ch);
      ctx.restore();
    } else {
      ctx.drawImage(this.flashCanvas, 0, 0, cw, ch, x, y, cw, ch);
    }
  }

  private drawGhosts(cam: number, camY: number) {
    const ctx = this.ctx;
    for (const g of this.ghosts) {
      ctx.globalAlpha = (g.life / 12) * 0.45;
      this.drawSprite(g.sheet, g.frame, g.cw, g.ch, Math.round(g.x - g.cw / 2 - cam), Math.round(g.y - g.ch - camY), g.flip);
    }
    ctx.globalAlpha = 1;
  }

  private drawPops(cam: number, camY: number) {
    for (const pop of this.pops) {
      this.ctx.globalAlpha = Math.min(1, pop.life / 12);
      this.text(pop.text, Math.round(pop.x - cam), Math.round(pop.y - camY), pop.color, pop.text.length > 2 ? 7 : 8, "center");
    }
    this.ctx.globalAlpha = 1;
  }

  private drawPlayer(cam: number, camY: number) {
    const ctx = this.ctx;
    const pose = this.pose();
    const { sheet, frame, cw: cellW, ch } = pose;
    const flip = this.dir < 0;
    const low = this.crouching || this.rollT > 0;
    const sx = this.px - cam;
    const sy = this.py - camY;
    const x = Math.round(sx - cellW / 2);
    const y = Math.round(sy - ch);
    if (this.invuln > 0 && this.deadT === 0 && Math.floor(this.time / 4) % 3 === 0) {
      this.lights.push({ x: sx, y: sy - (low ? 30 : 66), r: 90, a: 1, color: "rgba(255, 190, 110, 0.22)", parallax: 1 });
      return;
    }
    // Lantern light: warm, flickering; hidden when crouched; swelling with a charged glimmer.
    const flick = 0.94 + 0.06 * Math.sin(this.time / 3) + 0.03 * Math.sin(this.time / 7);
    const charge = this.chargeT > 14 ? Math.min(1, (this.chargeT - 14) / (CHARGE_T - 14)) : 0;
    const flare = (this.flare > 0 ? 1 + (this.flare / 40) * 0.8 : 1) + charge * 0.6;
    const hide = this.crouching ? 0.45 : 1;
    const headY = low ? sy - 40 : sy - 78 + (sheet === this.jumpSheet && (frame === 0 || frame === 5) ? 14 : 0);
    this.lights.push({ x: sx + this.dir * 2, y: headY, r: 105 * flick * flare * hide, a: 1, color: `rgba(255, ${190 + charge * 40}, ${110 + charge * 60}, ${0.28 * flare * hide})`, parallax: 1 });
    if (charge > 0) this.lights.push({ x: sx + this.dir * 8, y: sy - (this.crouching ? 34 : 70), r: 20 + charge * 40, a: 1, color: `rgba(255, 240, 200, ${0.3 + charge * 0.4})`, parallax: 1 });
    this.shadow(sx, sy, this.onGround ? 13 : 9);
    const sxs = this.squash > 0 ? 1 + 0.14 * (this.squash / 6) : this.stretch > 0 ? 1 - 0.08 * (this.stretch / 5) : 1;
    const sys = this.squash > 0 ? 1 - 0.14 * (this.squash / 6) : this.stretch > 0 ? 1 + 0.1 * (this.stretch / 5) : 1;
    ctx.save();
    if (sxs !== 1 || sys !== 1) {
      ctx.translate(sx, sy);
      ctx.scale(sxs, sys);
      ctx.translate(-sx, -sy);
    }
    this.drawSprite(sheet, frame, cellW, ch, x, y, flip);
    ctx.restore();
    if (this.chargeT > 10) {
      const bx = Math.round(sx) - 12;
      const by = Math.round(sy) + 5;
      const full = this.chargeT >= CHARGE_T;
      ctx.fillStyle = "rgba(2, 6, 18, 0.8)";
      ctx.fillRect(bx - 1, by - 1, 26, 4);
      ctx.fillStyle = full ? (Math.floor(this.time / 3) % 2 === 0 ? "#ffffff" : "#ffd27a") : "#ffb347";
      ctx.fillRect(bx, by, Math.round(24 * Math.min(1, this.chargeT / CHARGE_T)), 2);
    }
    if (this.nearSerrure && this.lilies >= 3 && this.maxHp < MAX_HP_CAP) {
      const tav = this.world.tavern;
      this.text(this.S.serrure.offer, Math.round(tav.x - 44 - cam), Math.round(tav.y - 118 - camY) + Math.round(Math.sin(this.time / 10) * 2), "#bff4ff", 7, "center");
    }
  }

  private drawParticles(cam: number, camY: number, filter: (p: Particle) => boolean) {
    const ctx = this.ctx;
    for (const pt of this.particles) {
      if (!filter(pt)) continue;
      const a = Math.min(1, pt.life / 40) * (0.5 + 0.5 * Math.abs(Math.sin(this.time / 20 + pt.max)));
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      const x = Math.round(pt.x - cam * pt.parallax);
      const y = Math.round(pt.y - camY * (pt.parallax < 1 ? 0.6 : 1));
      ctx.fillRect(x, y, pt.size, pt.size);
      if (pt.size === 1 && pt.parallax >= 1) this.lights.push({ x, y, r: 6, a: 0.5, parallax: 1 });
    }
    ctx.globalAlpha = 1;
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

  private collectBackgroundLights(cam: number, bgY: number) {
    const offset = Math.round(cam * 0.45);
    const imgW = this.bg.width;
    const period = imgW * 2;
    const base = -(((offset % period) + period) % period);
    for (const l of this.meta.lights) {
      for (let k = -1; k <= 2; k += 1) {
        const tileX = base + k * period;
        for (const sx of [tileX + l.x, tileX + imgW * 2 - l.x]) {
          if (sx < -80 || sx > VIEW_W + 80) continue;
          const pulse = 0.75 + 0.25 * Math.sin(this.time / 28 + l.x * 0.13 + l.y * 0.07);
          this.lights.push({ x: sx, y: l.y + bgY, r: Math.min(24, l.r * 0.7) * pulse, a: 0.55, color: "rgba(90, 190, 255, 0.08)", parallax: 0.45 });
        }
      }
    }
  }

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

  private renderLighting(darkness: number) {
    const lc = this.lightCanvas.getContext("2d");
    if (!lc) return;
    lc.globalCompositeOperation = "source-over";
    lc.clearRect(0, 0, VIEW_W, VIEW_H);
    const g = lc.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, `rgba(2, 6, 20, ${darkness * 0.8})`);
    g.addColorStop(1, `rgba(2, 6, 20, ${darkness})`);
    lc.fillStyle = g;
    lc.fillRect(0, 0, VIEW_W, VIEW_H);
    lc.globalCompositeOperation = "destination-out";
    for (const l of this.lights) {
      if (l.x < -l.r || l.x > VIEW_W + l.r || l.y < -l.r || l.y > VIEW_H + l.r) continue;
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
    const fx = this.fxCanvas.getContext("2d");
    if (!fx) return;
    fx.globalCompositeOperation = "source-over";
    fx.clearRect(0, 0, VIEW_W, VIEW_H);
    for (const l of this.lights) {
      if (!l.color || l.x < -l.r || l.x > VIEW_W + l.r || l.y < -l.r || l.y > VIEW_H + l.r) continue;
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

  private drawForeground(cam: number, camY: number) {
    const ctx = this.ctx;
    if (!this.trunk) return;
    const fg = cam * 1.5;
    const period = 1100;
    ctx.globalAlpha = 0.7;
    for (let i = -1; i < 3; i += 1) {
      const idx = Math.floor(fg / period) + i;
      const base = idx * period - (fg % period) + 320 + rnd(idx + 900) * 200;
      const scale = VIEW_H / this.trunk.height;
      const w = Math.round(this.trunk.width * scale);
      const yOff = Math.round(-((camY * 1.2) % 60)) - 30;
      ctx.drawImage(this.trunk, Math.round(base), yOff, w, VIEW_H + 60);
    }
    ctx.globalAlpha = 1;
  }

  private drawFog(ctx: CanvasRenderingContext2D, cam: number, camY: number) {
    for (let i = 0; i < 3; i += 1) {
      const y = VIEW_H - 22 - i * 14 + Math.sin(this.time / 80 + i) * 3;
      const a = 0.12 + 0.05 * Math.sin(this.time / 60 + i * 2);
      const period = 200 + i * 40;
      const shift = (cam * (0.9 + i * 0.2) + camY * 0.3 + this.time * (0.25 + i * 0.05)) % period;
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

  private drawHud() {
    const ctx = this.ctx;
    const S = this.S;
    const cam = Math.round(this.camX);
    const camY = Math.round(this.camY);
    // Hearts: little lantern heads.
    for (let i = 0; i < this.maxHp; i += 1) {
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
    // Lilies and the pause button.
    ctx.drawImage(this.lilyImg, VIEW_W - 12 - this.lore.lily.w - 54, 6);
    this.text(`${this.lilies}/${this.lilyTotal}`, VIEW_W - 34, 12, "#d8d2c2", 8, "right");
    ctx.fillStyle = "rgba(216, 210, 194, 0.7)";
    ctx.fillRect(VIEW_W - 20, 8, 3, 10);
    ctx.fillRect(VIEW_W - 14, 8, 3, 10);
    // Pilgrim stones: their words appear when Lanterne stands close.
    for (const h of this.hints) {
      if (Math.abs(this.px - h.x) < 70 && Math.abs(this.py - h.y) < 60) {
        this.text(S.hints[h.id], Math.round(h.x - cam), Math.round(h.y - 80 - camY), "#bff4ff", 7, "center");
      }
    }
    // Zone card.
    if (this.zoneCardT > 0 && this.deadT === 0) {
      const a = Math.min(1, this.zoneCardT / 20, (170 - this.zoneCardT + 1) / 20);
      ctx.globalAlpha = Math.max(0, a);
      this.text(S.zones[this.zoneId] ?? "", VIEW_W / 2, 34, "#eef1f5", 10, "center");
      ctx.fillStyle = "#8fe3ff";
      ctx.fillRect(VIEW_W / 2 - 30, 50, 60, 1);
      ctx.globalAlpha = 1;
    }
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
      this.text(S.boss, VIEW_W / 2, VIEW_H - 36, "#f8fafc", 8, "center");
    }
    if (this.deadT > 0) {
      const a = Math.min(0.85, this.deadT / 60);
      ctx.fillStyle = `rgba(2, 6, 18, ${a})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      if (this.deadT > 40) this.text(S.death, VIEW_W / 2, 130, "#d8d2c2", 7, "center");
    }
    if (this.cleared > 0) {
      const a = Math.min(0.7, this.cleared / 50);
      ctx.fillStyle = `rgba(2, 6, 18, ${a})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      if (this.cleared > 30) {
        this.text(S.clear.title, VIEW_W / 2, 96, "#8fe3ff", 16, "center");
        this.text(S.clear.sub, VIEW_W / 2, 124, "#d8d2c2", 8, "center");
        this.text(S.clear.line, VIEW_W / 2, 142, "#d8d2c2", 7, "center");
        ctx.drawImage(this.medallionImg, VIEW_W / 2 - this.lore.medallion.w - 30, 160);
        ctx.drawImage(this.lilyImg, VIEW_W / 2 + 14, 160);
        this.text(`${this.lilies}/${this.lilyTotal}`, VIEW_W / 2 + 36, 166, "#d8d2c2", 8, "left");
        if (this.cleared > 90 && Math.floor(this.time / 30) % 2 === 0) this.text(S.clear.replay, VIEW_W / 2, 190, "#ffb347", 8, "center");
      }
    }
  }

  private drawMenu() {
    const ctx = this.ctx;
    const S = this.S.menu;
    ctx.fillStyle = "rgba(2, 6, 18, 0.82)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#3a5c7a";
    ctx.fillRect(60, 60, VIEW_W - 120, 1);
    ctx.fillRect(60, VIEW_H - 40, VIEW_W - 120, 1);
    if (this.menu === "controls") {
      this.text(S.controls.toUpperCase(), VIEW_W / 2, 36, "#8fe3ff", 10, "center");
      this.S.controls.forEach((line, i) => this.text(line, VIEW_W / 2, 78 + i * 18, "#eef1f5", 7, "center"));
      this.text(S.back, VIEW_W / 2, VIEW_H - 30, "#ffb347", 7, "center");
      return;
    }
    this.text(S.title, VIEW_W / 2, 36, "#8fe3ff", 12, "center");
    const set = this.settings;
    const items: [string, string | null][] = [
      [S.resume, null],
      [S.music, set.music ? S.on : S.off],
      [S.sfx, set.sfx ? S.on : S.off],
      [S.lang, set.lang === "fr" ? "Francais" : "English"],
      [S.controls, null],
      [S.restart, null],
    ];
    items.forEach(([label, value], i) => {
      const y = 84 + i * 24;
      const sel = i === this.menuIndex;
      if (sel) {
        ctx.fillStyle = "rgba(143, 227, 255, 0.12)";
        ctx.fillRect(100, y - 6, VIEW_W - 200, 20);
        this.text(">", 110, y, "#ffb347", 8, "left");
      }
      this.text(label, 130, y, sel ? "#ffffff" : "#d8d2c2", 8, "left");
      if (value) this.text(`< ${value} >`, VIEW_W - 110, y, sel ? "#8fe3ff" : "#8fa9b8", 8, "right");
    });
    this.text(S.hint, VIEW_W / 2, VIEW_H - 30, "#8fa9b8", 6, "center");
  }
}
