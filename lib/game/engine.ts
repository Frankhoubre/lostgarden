/**
 * Lost Garden: The Lantern's Oath.
 * A Ghouls'n Ghosts style platformer in a 320x192 pixel window.
 */
import { drawEntity, updateEntity, SPAWN, BOSS_STATS, NPC_SHAPES } from "./actors";
import { GameAudio } from "./audio";
import { drawBackground, drawForeground, rnd } from "./backgrounds";
import { LEVELS, type LevelDef } from "./levels";
import type { Sprite } from "./pixel";
import { getSprite, lanterneSprite } from "./sprites";
import { getGameText, type GameText } from "./text";
import {
  S,
  TILE,
  VIEW_H,
  VIEW_W,
  overlaps,
  type Entity,
  type EntityKind,
  type Particle,
  type PlayerState,
  type WeaponKind,
  type World,
} from "./types";
import type { Locale } from "@/lib/i18n/config";

/* ------------------------------------------------------------------ */
/* Tuning                                                               */
/* ------------------------------------------------------------------ */

const GRAVITY = 0.3 * S;
const MAX_FALL = 6.5 * S;
const WALK_SPEED = 1.4 * S;
const JUMP_VY = -5.8 * S;
const PLAYER_W = 14;
const PLAYER_H = 34;
const CROUCH_H = 22;
const INVULN = 100;
const START_LIVES = 3;

const WEAPON_ORDER: WeaponKind[] = ["lueur", "cle", "dague", "cloche"];

export type GameScreen =
  | "title"
  | "intro"
  | "play"
  | "clear"
  | "gameover"
  | "ending";

export type GameOptions = {
  locale: Locale;
  font: string;
  onScreenChange?: (screen: GameScreen) => void;
};

type Dialogue = { text: string; speaker: string; timer: number; color: string };
type Light = { x: number; y: number; r: number; a: number; color?: string };
type Deco = { name: string; x: number; y: number; light?: number; flicker?: boolean };

export type InputName = "left" | "right" | "up" | "down" | "jump" | "throw" | "pause" | "mute" | "any";

/* ------------------------------------------------------------------ */

export class Game implements World {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private text: GameText;
  private font: string;
  private options: GameOptions;
  private audio = new GameAudio();
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;

  screen: GameScreen = "title";
  private screenT = 0;
  time = 0;
  private paused = false;

  private held = new Set<InputName>();
  private pressed = new Set<InputName>();

  private level: LevelDef = LEVELS[0];
  private levelIndex = 0;
  private tiles: string[] = [];
  levelWidth = 0;
  cameraX = 0;
  private cameraLock: { l: number; r: number } | null = null;

  player: PlayerState = this.freshPlayer(0, 0);
  entities: Entity[] = [];
  private particlesList: Particle[] = [];
  private nextId = 1;

  private lives = START_LIVES;
  private score = 0;
  private hiScore = 0;
  private timeLeft = 0;
  private checkpoint = { x: 0, y: 0 };
  private bossAlive = false;
  private bossDefeated = false;
  private exitOpen = false;
  private dialogue: Dialogue | null = null;
  private shakeT = 0;
  private ambientT = 0;
  private fade = 1;
  private continueChoice = 0;
  private endingT = 0;
  private bossHp = { cur: 0, max: 0, name: "" };
  private lights: Light[] = [];
  private lightCanvas: HTMLCanvasElement | null = null;
  private decos: Deco[] = [];

  constructor(canvas: HTMLCanvasElement, options: GameOptions) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable");
    this.ctx = ctx;
    this.options = options;
    this.text = getGameText(options.locale);
    this.font = options.font;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    ctx.imageSmoothingEnabled = false;
    this.hiScore = this.loadHiScore();
    (canvas as HTMLCanvasElement & { lostGardenGame?: Game }).lostGardenGame = this;
  }

  /** Debug helpers (used by the automated playtest). */
  debug() {
    return {
      screen: this.screen,
      level: this.levelIndex,
      x: this.player.x,
      y: this.player.y,
      lives: this.lives,
      score: this.score,
      armor: this.player.armor,
      entities: this.entities.filter((e) => !e.dead).map((e) => `${e.kind}:${e.sub}:${e.state}@${Math.round(e.x)},${Math.round(e.y)}`),
      bossAlive: this.bossAlive,
      exitOpen: this.exitOpen,
      cameraX: this.cameraX,
    };
  }

  debugWarp(x: number) {
    const p = this.player;
    p.x = x;
    const gy = this.groundBelow(x + p.w / 2, TILE * 2);
    p.y = (gy ?? 160) - p.h;
    p.vy = 0;
    this.cameraX = Math.max(0, Math.min(this.levelWidth - VIEW_W, x - VIEW_W / 2));
  }

  debugKillBoss() {
    for (const e of this.entities) {
      if (e.kind === "boss" && !e.dead) e.hp = 1;
    }
  }

  debugGoto(screen: GameScreen, level = this.levelIndex) {
    this.levelIndex = level;
    this.setScreen(screen);
  }

  /* ---------------- lifecycle ---------------- */

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

  /* ---------------- input ---------------- */

  setInput(name: InputName, down: boolean) {
    if (down) {
      if (!this.held.has(name)) this.pressed.add(name);
      this.held.add(name);
      this.pressed.add("any");
      this.audio.unlock();
    } else {
      this.held.delete(name);
    }
  }

  releaseAll() {
    this.held.clear();
  }

  toggleMute(): boolean {
    this.audio.setMuted(!this.audio.muted);
    return this.audio.muted;
  }

  get muted() {
    return this.audio.muted;
  }

  /* ---------------- world helpers (World interface) ---------------- */

  sfx(name: string) {
    this.audio.sfx(name);
  }

  sprite(name: string): Sprite {
    return getSprite(name);
  }

  shake(frames: number) {
    this.shakeT = Math.max(this.shakeT, frames);
  }

  sayBoss(kind: string) {
    this.say(this.text.dialogue[kind] ?? "", this.text.bossNames[kind] ?? "", "#ff9a2a", 200);
  }

  tileAt(tx: number, ty: number): string {
    if (ty < 0) return ".";
    if (ty >= this.level.height) return "#";
    if (tx < 0 || tx >= this.levelWidth / TILE) return "#";
    return this.tiles[ty][tx] ?? ".";
  }

  solidAt(px: number, py: number): boolean {
    return this.tileAt(Math.floor(px / TILE), Math.floor(py / TILE)) === "#";
  }

  private platformAt(px: number, py: number): boolean {
    return this.tileAt(Math.floor(px / TILE), Math.floor(py / TILE)) === "-";
  }

  private hazardAt(px: number, py: number): boolean {
    const ty = Math.floor(py / TILE);
    if (this.tileAt(Math.floor(px / TILE), ty) !== "^") return false;
    return py - ty * TILE >= 8;
  }

  groundBelow(px: number, py: number): number | null {
    for (let y = Math.floor(py / TILE); y < this.level.height; y += 1) {
      const t = this.tileAt(Math.floor(px / TILE), y);
      if (t === "#" || t === "-") return y * TILE;
    }
    return null;
  }

  /** Axis-separated tile collision for any moving box. */
  private moveBox(
    b: { x: number; y: number; w: number; h: number; vx: number; vy: number; onGround: boolean },
    dropThrough = false,
  ) {
    // Horizontal.
    b.x += b.vx;
    if (b.vx > 0) {
      const edge = b.x + b.w;
      if (this.solidAt(edge, b.y + 1) || this.solidAt(edge, b.y + b.h / 2) || this.solidAt(edge, b.y + b.h - 1)) {
        b.x = Math.floor(edge / TILE) * TILE - b.w - 0.01;
        b.vx = 0;
      }
    } else if (b.vx < 0) {
      const edge = b.x;
      if (this.solidAt(edge, b.y + 1) || this.solidAt(edge, b.y + b.h / 2) || this.solidAt(edge, b.y + b.h - 1)) {
        b.x = Math.floor(edge / TILE) * TILE + TILE + 0.01;
        b.vx = 0;
      }
    }
    // Vertical.
    const prevBottom = b.y + b.h;
    b.y += b.vy;
    b.onGround = false;
    if (b.vy >= 0) {
      const bottom = b.y + b.h;
      const xs = [b.x + 1, b.x + b.w / 2, b.x + b.w - 1];
      for (const x of xs) {
        const ty = Math.floor(bottom / TILE);
        const t = this.tileAt(Math.floor(x / TILE), ty);
        const top = ty * TILE;
        if (t === "#" || (t === "-" && !dropThrough && prevBottom <= top + 0.5)) {
          b.y = top - b.h;
          b.vy = 0;
          b.onGround = true;
          break;
        }
      }
    } else {
      const top = b.y;
      const xs = [b.x + 1, b.x + b.w / 2, b.x + b.w - 1];
      for (const x of xs) {
        if (this.solidAt(x, top)) {
          b.y = Math.floor(top / TILE) * TILE + TILE;
          b.vy = 0;
          break;
        }
      }
    }
  }

  moveEntity(e: Entity) {
    if (e.gravity) {
      e.vy = Math.min(MAX_FALL, e.vy + GRAVITY);
    }
    if (e.solid) {
      this.moveBox(e);
    } else {
      e.x += e.vx;
      e.y += e.vy;
    }
    if (e.y > this.level.height * TILE + 40) e.dead = true;
  }

  spawn(kind: EntityKind, x: number, y: number, sub = ""): Entity {
    const def = SPAWN[kind];
    const e: Entity = {
      id: this.nextId++,
      kind,
      x,
      y,
      w: def.w,
      h: def.h,
      vx: 0,
      vy: 0,
      dir: -1,
      hp: def.hp,
      maxHp: def.hp,
      onGround: false,
      gravity: def.gravity,
      solid: kind !== "shot" && kind !== "enemyShot" && kind !== "meduse" && kind !== "exit",
      dead: false,
      age: 0,
      timer: 0,
      state: "",
      flash: 0,
      points: def.points,
      harmful: def.harmful,
      ox: def.ox,
      oy: def.oy,
      data: {},
      sub,
      alpha: 1,
    };
    if (kind === "golem") e.state = "dormant";
    if (kind === "meduse") {
      e.data.baseY = y;
      e.data.targetY = y;
      e.state = "float";
    }
    if (kind === "colosse") e.state = "walk";
    if (kind === "reptile") e.state = "run";
    if (kind === "boss") {
      const stats = BOSS_STATS[sub];
      e.w = stats.w;
      e.h = stats.h;
      e.hp = stats.hp;
      e.maxHp = stats.hp;
      e.points = stats.points;
      e.ox = stats.ox;
      e.oy = stats.oy;
      e.state = "intro";
      e.alpha = 0;
    }
    if (kind === "npc") {
      const shape = NPC_SHAPES[sub];
      if (shape) {
        e.w = shape.w;
        e.h = shape.h;
        e.ox = shape.ox;
        e.oy = shape.oy;
      }
    }
    this.entities.push(e);
    return e;
  }

  enemyShot(x: number, y: number, vx: number, vy: number, sub: string): Entity {
    const e = this.spawn("enemyShot", x, y, sub);
    e.vx = vx;
    e.vy = vy;
    if (sub === "scythe") {
      e.w = 18;
      e.h = 18;
    } else if (sub === "shard") {
      e.w = 5;
      e.h = 5;
    } else {
      e.w = 5;
      e.h = 5;
    }
    return e;
  }

  particles(x: number, y: number, count: number, color: string, speed = 1) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const s = (0.4 + Math.random()) * speed;
      this.particlesList.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.5,
        life: 20 + Math.random() * 25,
        maxLife: 45,
        color,
        size: Math.random() < 0.3 ? 2 : 1,
        gravity: 0.05 * S,
      });
    }
  }

  drawSprite(s: Sprite, x: number, y: number, flip: boolean, alpha = 1) {
    const ctx = this.ctx;
    if (alpha <= 0) return;
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    ctx.drawImage(flip ? s.flipped : s.canvas, Math.round(x - this.cameraX) - s.pad, Math.round(y) - s.pad);
    ctx.globalAlpha = prev;
  }

  /** Register a light source for this frame's lighting pass (world coordinates). */
  light(x: number, y: number, r: number, a: number, color?: string) {
    this.lights.push({ x, y, r, a, color });
  }

  hurtPlayer() {
    const p = this.player;
    if (p.dead || p.invuln > 0 || this.screen !== "play") return;
    if (p.armor === 2) {
      p.armor = 1;
      p.invuln = INVULN;
      this.sfx("armor");
      this.particles(p.x + p.w / 2, p.y + 12, 16, "#c3ad84", 2.2);
      this.shake(4);
      p.vy = -3 * S;
      p.vx = -p.dir * 1.2 * S;
      p.jumping = true;
      p.onGround = false;
      return;
    }
    this.killPlayer();
  }

  private killPlayer() {
    const p = this.player;
    if (p.dead) return;
    p.dead = true;
    p.deadT = 0;
    p.vx = 0;
    p.vy = 0;
    this.sfx("die");
    this.audio.stopSong();
    this.shake(8);
  }

  /* ---------------- level setup ---------------- */

  private freshPlayer(x: number, y: number): PlayerState {
    return {
      x,
      y,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      dir: 1,
      onGround: false,
      crouch: false,
      jumping: false,
      armor: 2,
      invuln: 0,
      throwT: 0,
      cooldown: 0,
      weapon: "lueur",
      dead: false,
      deadT: 0,
      walkT: 0,
      frame: "idle",
      landT: 0,
    };
  }

  private loadLevel(index: number, fromCheckpoint = false) {
    this.level = LEVELS[index];
    this.levelIndex = index;
    this.levelWidth = this.level.width * TILE;
    this.entities = [];
    this.particlesList = [];
    this.cameraLock = null;
    this.bossAlive = false;
    this.bossDefeated = false;
    this.exitOpen = false;
    this.dialogue = null;
    this.ambientT = 0;

    const tiles: string[] = [];
    let startX = TILE * 2;
    let startY = TILE * 9 - PLAYER_H;
    /** Place an actor standing on the bottom of its map tile, centred. */
    const place = (kind: EntityKind, tx: number, ty: number, sub = ""): Entity => {
      const def = SPAWN[kind];
      const shape = kind === "npc" ? NPC_SHAPES[sub] : undefined;
      const w = shape?.w ?? def.w;
      const h = shape?.h ?? def.h;
      return this.spawn(kind, tx * TILE + (TILE - w) / 2, ty * TILE + TILE - h, sub);
    };
    for (let y = 0; y < this.level.height; y += 1) {
      let row = "";
      for (let x = 0; x < this.level.width; x += 1) {
        const ch = this.level.map[y][x];
        let tile = ".";
        switch (ch) {
          case "#":
          case "-":
          case "^":
            tile = ch;
            break;
          case "P":
            startX = x * TILE + (TILE - PLAYER_W) / 2;
            startY = y * TILE + TILE - PLAYER_H;
            break;
          case "c":
            place("chest", x, y);
            break;
          case "E": {
            const ex = this.spawn("exit", x * TILE, y * TILE - TILE, "");
            ex.h = TILE * 2;
            ex.w = TILE;
            break;
          }
          case "X": {
            const ex = this.spawn("exit", x * TILE, y * TILE, "bossTrigger");
            ex.w = 6;
            ex.h = TILE;
            break;
          }
          case "S":
            place("npc", x, y, "serrure");
            break;
          case "B":
            place("npc", x, y, "bourdon");
            break;
          case "s":
            place("spore", x, y).state = "hop";
            break;
          case "j":
            place("meduse", x, y);
            break;
          case "p":
            place("penitent", x, y);
            break;
          case "a":
            place("rouage", x, y);
            break;
          case "w":
            place("loup", x, y);
            break;
          case "r":
            place("reptile", x, y);
            break;
          case "k":
            place("colosse", x, y);
            break;
          case "g":
            place("golem", x, y);
            break;
          case "m":
            place("souris", x, y);
            break;
          case "l":
            place("item", x, y, "lys");
            break;
          case "d":
            place("item", x, y, "medaillon");
            break;
          default:
            break;
        }
        row += tile;
      }
      tiles.push(row);
    }
    this.tiles = tiles;
    this.buildDecorations();

    const weapon = this.player.weapon;
    if (fromCheckpoint) {
      this.player = this.freshPlayer(this.checkpoint.x, this.checkpoint.y);
      // Remove spawns sitting on top of the checkpoint so respawn is fair.
      this.entities = this.entities.filter(
        (e) => !e.harmful || Math.abs(e.x - this.checkpoint.x) > 48,
      );
    } else {
      this.checkpoint = { x: startX, y: startY };
      this.player = this.freshPlayer(startX, startY);
      this.timeLeft = this.level.timeLimit * 60;
    }
    this.player.weapon = weapon;
    this.cameraX = Math.max(0, Math.min(this.levelWidth - VIEW_W, this.player.x - VIEW_W / 2));
    this.audio.playSong(this.level.song);
    this.fade = 1;
  }

  /** Scatter grass, mushrooms, bones, candles and banners along the level using a stable hash. */
  private buildDecorations() {
    const decos: Deco[] = [];
    const theme = this.level.theme;
    const W = this.level.width;
    const H = this.level.height;
    for (let ty = 0; ty < H; ty += 1) {
      for (let tx = 0; tx < W; tx += 1) {
        if (this.tileAt(tx, ty) !== "#") continue;
        const x = tx * TILE;
        const y = ty * TILE;
        const r = rnd(tx * 31 + ty * 7);
        const r2 = rnd(tx * 13 + ty * 101);
        const topFree = this.tileAt(tx, ty - 1) === ".";
        const belowFree = this.tileAt(tx, ty + 1) === "." && ty < H - 1;
        if (topFree) {
          if (theme === "forest") {
            if (r < 0.45) decos.push({ name: "decoGrass", x: x + Math.floor(r2 * 10), y: y - 5 });
            else if (r < 0.62) decos.push({ name: "decoMushroomSmall", x: x + 4 + Math.floor(r2 * 10), y: y - 7, light: 22 });
            else if (r < 0.7) decos.push({ name: "decoMushroomTall", x: x + 6 + Math.floor(r2 * 6), y: y - 10, light: 30 });
          } else if (theme === "chains") {
            if (r < 0.2) decos.push({ name: "decoBones", x: x + Math.floor(r2 * 10), y: y - 4 });
            else if (r < 0.3) decos.push({ name: "decoSkull", x: x + 4 + Math.floor(r2 * 10), y: y - 6 });
          } else if (theme === "castle") {
            if (r < 0.14) decos.push({ name: "decoCandle", x: x + 4 + Math.floor(r2 * 12), y: y - 8, light: 26, flicker: true });
            else if (r < 0.2) decos.push({ name: "decoCandelabra", x: x + 2 + Math.floor(r2 * 6), y: y - 12, light: 38, flicker: true });
            else if (r < 0.25) decos.push({ name: "decoSkull", x: x + 6 + Math.floor(r2 * 8), y: y - 6 });
          }
        }
        if (belowFree) {
          if (theme === "chains" && r2 < 0.12) decos.push({ name: "decoChainHook", x: x + 8, y: y + TILE });
          if (theme === "castle" && r2 < 0.16) decos.push({ name: "decoBanner", x: x + 7, y: y + TILE });
          if (theme === "forest" && r2 < 0.1) decos.push({ name: "decoMushroomSmall", x: x + 8, y: y + TILE - 1 });
        }
      }
    }
    this.decos = decos;
  }

  private setScreen(screen: GameScreen) {
    this.screen = screen;
    this.screenT = 0;
    this.options.onScreenChange?.(screen);
  }

  private startGame() {
    this.lives = START_LIVES;
    this.score = 0;
    this.player.weapon = "lueur";
    this.levelIndex = 0;
    this.setScreen("intro");
    this.audio.stopSong();
  }

  /* ---------------- tick ---------------- */

  private tick() {
    this.time += 1;
    this.screenT += 1;
    if (this.pressed.has("mute")) {
      this.toggleMute();
    }

    switch (this.screen) {
      case "title":
        this.tickTitle();
        break;
      case "intro":
        this.tickIntro();
        break;
      case "play":
        this.tickPlay();
        break;
      case "clear":
        this.tickClear();
        break;
      case "gameover":
        this.tickGameOver();
        break;
      case "ending":
        this.tickEnding();
        break;
      default:
        break;
    }
    this.pressed.clear();
  }

  private tickTitle() {
    if (this.screenT === 1) this.audio.playSong("lullaby");
    if (this.screenT > 30 && this.pressed.has("any") && !this.pressed.has("mute")) {
      this.sfx("select");
      this.startGame();
    }
  }

  private tickIntro() {
    if (this.screenT === 1) this.loadLevel(this.levelIndex);
    const done = this.screenT > 60 && (this.pressed.has("jump") || this.pressed.has("throw") || this.pressed.has("any"));
    if (this.screenT > 360 || done) {
      this.setScreen("play");
      this.audio.playSong(this.level.song);
    }
  }

  private tickClear() {
    if (this.screenT === 1) {
      this.audio.stopSong();
      this.sfx("clear");
    }
    // Count down time bonus.
    if (this.screenT > 60 && this.timeLeft > 0) {
      const step = Math.min(this.timeLeft, 60);
      this.timeLeft -= step;
      this.score += 10;
      if (this.screenT % 4 === 0) this.sfx("timer");
    }
    if (this.screenT > 120 && this.timeLeft <= 0 && (this.pressed.has("any") || this.screenT > 360)) {
      if (this.levelIndex + 1 < LEVELS.length) {
        this.levelIndex += 1;
        this.setScreen("intro");
      } else {
        this.setScreen("ending");
      }
    }
  }

  private tickGameOver() {
    if (this.screenT === 1) {
      this.audio.stopSong();
      this.continueChoice = 0;
      this.saveHiScore();
    }
    if (this.pressed.has("left") || this.pressed.has("right")) {
      this.continueChoice = this.continueChoice === 0 ? 1 : 0;
      this.sfx("select");
    }
    if (this.screenT > 40 && (this.pressed.has("jump") || this.pressed.has("throw"))) {
      if (this.continueChoice === 0) {
        this.lives = START_LIVES;
        this.score = 0;
        this.setScreen("intro");
      } else {
        this.setScreen("title");
      }
    }
  }

  private tickEnding() {
    if (this.screenT === 1) {
      this.audio.playSong("lullaby");
      this.saveHiScore();
      this.endingT = 0;
    }
    this.endingT += 1;
    if (this.endingT > 1500 || (this.endingT > 900 && this.pressed.has("any"))) {
      this.setScreen("title");
    }
  }

  private tickPlay() {
    if (this.pressed.has("pause")) {
      this.paused = !this.paused;
      this.sfx("select");
    }
    if (this.paused) return;

    if (this.fade > 0) this.fade = Math.max(0, this.fade - 0.05);
    if (this.shakeT > 0) this.shakeT -= 1;
    if (this.dialogue) {
      this.dialogue.timer -= 1;
      if (this.dialogue.timer <= 0) this.dialogue = null;
    }

    // Timer.
    if (!this.player.dead && !this.bossDefeated) {
      this.timeLeft -= 1;
      if (this.timeLeft === 10 * 60) this.sfx("timer");
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.say(this.text.timeOut, "", "#ff9a2a", 120);
        this.killPlayer();
      }
    }

    this.tickPlayer();
    this.tickEntities();
    this.tickParticles();
    this.tickAmbient();
    this.tickCamera();
  }

  /* ---------------- player ---------------- */

  private tickPlayer() {
    const p = this.player;
    if (p.dead) {
      p.deadT += 1;
      p.vy = Math.min(MAX_FALL, p.vy + GRAVITY);
      this.moveBox(p);
      if (p.deadT === 30) this.particles(p.x + 5, p.y + 20, 10, "#9aa3b1", 1.2);
      if (p.deadT > 110) {
        this.lives -= 1;
        if (this.lives < 0) {
          this.setScreen("gameover");
        } else {
          this.loadLevel(this.levelIndex, true);
        }
      }
      return;
    }

    if (p.invuln > 0) p.invuln -= 1;
    if (p.cooldown > 0) p.cooldown -= 1;
    if (p.throwT > 0) p.throwT -= 1;

    const left = this.held.has("left");
    const right = this.held.has("right");
    const down = this.held.has("down");

    if (p.onGround) {
      p.jumping = false;
      // Crouch toggles hitbox height.
      const wantCrouch = down && !left && !right;
      if (wantCrouch && !p.crouch) {
        p.crouch = true;
        p.y += PLAYER_H - CROUCH_H;
        p.h = CROUCH_H;
      } else if (!wantCrouch && p.crouch) {
        // Only stand if there is head room.
        const ny = p.y - (PLAYER_H - CROUCH_H);
        if (!this.solidAt(p.x + 1, ny) && !this.solidAt(p.x + p.w - 1, ny)) {
          p.crouch = false;
          p.y = ny;
          p.h = PLAYER_H;
        }
      }
      if (p.crouch) {
        p.vx = 0;
      } else if (left) {
        p.vx = -WALK_SPEED;
        p.dir = -1;
      } else if (right) {
        p.vx = WALK_SPEED;
        p.dir = 1;
      } else {
        p.vx = 0;
      }
      if (this.pressed.has("jump") && !p.crouch) {
        p.vy = JUMP_VY;
        p.jumping = true;
        p.onGround = false;
        this.sfx("jump");
        this.particles(p.x + p.w / 2, p.y + p.h, 5, "#8fa9b8", 1.2);
      } else if (this.pressed.has("jump") && p.crouch && down) {
        // Drop through a one-way platform.
        const below = p.y + p.h + 1;
        if (this.platformAt(p.x + p.w / 2, below) && !this.solidAt(p.x + p.w / 2, below)) {
          p.y += 2;
          p.vy = 1;
          p.onGround = false;
          p.jumping = true;
        }
      }
    }
    // Committed jump: no air control, as the old knights intended.

    if (this.pressed.has("throw") && p.cooldown <= 0) {
      this.throwWeapon();
    }

    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY);
    const wasGround = p.onGround;
    this.moveBox(p, p.crouch && down && this.pressed.has("jump"));
    if (!wasGround && p.onGround) {
      this.particles(p.x + p.w / 2, p.y + p.h, 6, "#7fa9b8", 1);
      p.landT = 8;
    }
    if (p.landT > 0) p.landT -= 1;

    // Level bounds.
    if (p.x < 0) p.x = 0;
    if (this.cameraLock) {
      p.x = Math.max(this.cameraLock.l, Math.min(this.cameraLock.r - p.w, p.x));
    }
    if (p.x + p.w > this.levelWidth) p.x = this.levelWidth - p.w;

    // Pits and thorns.
    if (p.y > this.level.height * TILE + 12) this.killPlayer();
    if (this.hazardAt(p.x + p.w / 2, p.y + p.h - 1) || this.hazardAt(p.x + 2, p.y + p.h - 1) || this.hazardAt(p.x + p.w - 2, p.y + p.h - 1)) {
      this.hurtPlayer();
    }

    // Animation frame.
    if (p.crouch) {
      p.frame = p.throwT > 0 ? "crouchThrow" : "crouch";
    } else if (!p.onGround) {
      p.frame = p.throwT > 0 ? "throwAir" : "jump";
    } else if (p.throwT > 0) {
      p.frame = "throw";
    } else if (p.vx !== 0) {
      p.walkT += 1;
      p.frame = `walk${Math.floor(p.walkT / 7) % 4}`;
    } else {
      p.walkT = 0;
      p.frame = "idle";
    }
  }

  private throwWeapon() {
    const p = this.player;
    const active = this.entities.filter((e) => e.kind === "shot" && !e.dead).length;
    const max = p.weapon === "dague" ? 3 : 2;
    if (active >= max) return;
    p.throwT = 12;
    p.cooldown = p.weapon === "dague" ? 8 : 14;
    const y = p.crouch ? p.y + 6 : p.y + 12;
    const x = p.dir > 0 ? p.x + p.w : p.x - 12;
    const s = this.spawn("shot", x, y, p.weapon);
    s.dir = p.dir;
    switch (p.weapon) {
      case "lueur":
        s.w = 12;
        s.h = 5;
        s.vx = p.dir * 4 * S;
        break;
      case "cle":
        s.w = 12;
        s.h = 12;
        s.vx = p.dir * 3.2 * S;
        s.data.pierce = true;
        break;
      case "dague":
        s.w = 14;
        s.h = 3;
        s.vx = p.dir * 6 * S;
        break;
      case "cloche":
        s.w = 12;
        s.h = 12;
        s.vx = p.dir * 2.2 * S;
        s.vy = -3.4 * S;
        break;
      default:
        break;
    }
    this.sfx("throw");
  }

  /* ---------------- entities ---------------- */

  private tickEntities() {
    const p = this.player;
    const camL = this.cameraX - 64;
    const camR = this.cameraX + VIEW_W + 64;

    for (const e of this.entities) {
      if (e.dead) continue;
      const onScreen = e.x + e.w > camL && e.x < camR;
      const isShot = e.kind === "shot" || e.kind === "enemyShot";
      if (!onScreen && !isShot && e.kind !== "boss") continue;
      updateEntity(e, this);

      if (e.dead || p.dead) continue;

      // Player projectile hits.
      if (e.kind === "shot") {
        for (const t of this.entities) {
          if (t.dead || t === e) continue;
          if (t.kind === "shot" || t.kind === "enemyShot" || t.kind === "item" || t.kind === "npc" || t.kind === "exit" || t.kind === "souris") continue;
          if (t.kind === "golem" && t.state === "dormant") continue;
          if (t.kind === "boss" && (t.state === "intro" || t.state === "dying" || t.alpha < 0.5)) continue;
          if (!overlaps(e, t)) continue;
          this.damage(t, e);
          if (!e.data.pierce) {
            e.dead = true;
            break;
          }
        }
        continue;
      }

      // Enemy projectiles.
      if (e.kind === "enemyShot") {
        if (overlaps(e, p)) {
          this.hurtPlayer();
          if (e.sub !== "scythe") e.dead = true;
        }
        continue;
      }

      // Contact with the player.
      if (!overlaps(e, p)) continue;
      switch (e.kind) {
        case "item":
          this.pickup(e);
          break;
        case "souris":
          e.dead = true;
          this.score += e.points;
          this.sfx("bell");
          this.particles(e.x + 4, e.y + 4, 6, "#e0b04a", 1);
          this.floatScore(e.x, e.y, e.points);
          break;
        case "npc":
          this.touchNpc(e);
          break;
        case "exit":
          this.touchExit(e);
          break;
        case "chest":
          break;
        default:
          if (e.harmful && !(e.kind === "boss" && (e.state === "intro" || e.state === "dying" || e.alpha < 0.5))) {
            this.hurtPlayer();
          }
          break;
      }
    }

    // Boss HP for the HUD, and boss death.
    const boss = this.entities.find((e) => e.kind === "boss" && !e.dead);
    if (boss) {
      this.bossHp = { cur: Math.max(0, boss.hp), max: boss.maxHp, name: this.text.bossNames[boss.sub] ?? "" };
    } else if (this.bossAlive && !this.bossDefeated) {
      this.onBossDefeated();
    }

    this.entities = this.entities.filter((e) => !e.dead);
  }

  private damage(t: Entity, shot: Entity) {
    if (t.kind === "chest") {
      if (t.state !== "open") {
        t.state = "open";
        this.sfx("chest");
        this.score += t.points;
        this.spawnChestItem(t);
      }
      return;
    }
    t.hp -= 1;
    t.flash = 10;
    if (t.kind === "boss") {
      this.sfx("bossHit");
      this.particles(shot.x, shot.y, 3, "#ffd27a", 1);
      if (t.hp <= 0) {
        t.state = "dying";
        t.timer = 0;
        t.harmful = false;
        this.score += t.points;
        this.floatScore(t.x, t.y - 8, t.points);
        this.shake(12);
      }
      return;
    }
    if (t.hp <= 0) {
      t.dead = true;
      this.score += t.points;
      this.sfx("enemy");
      this.particles(t.x + t.w / 2, t.y + t.h / 2, 8, t.kind === "meduse" ? "#7fd8ff" : "#c8ccd8", 1.3);
      this.floatScore(t.x, t.y, t.points);
    } else {
      this.sfx("bossHit");
    }
  }

  private spawnChestItem(chest: Entity) {
    // Chest loot: mostly weapons, sometimes the cape, sometimes the medallion.
    const roll = Math.random();
    let sub: string;
    if (this.player.armor === 1 && roll < 0.45) {
      sub = "cape";
    } else if (roll < 0.6) {
      const idx = WEAPON_ORDER.indexOf(this.player.weapon);
      const options = WEAPON_ORDER.filter((_, i) => i !== idx);
      sub = options[Math.floor(Math.random() * options.length)];
    } else if (roll < 0.8) {
      sub = "medaillon";
    } else {
      sub = "cape";
    }
    const item = this.spawn("item", chest.x + 4, chest.y - 12, sub);
    item.vy = -3 * S;
    item.vx = 0.4 * S;
    this.particles(chest.x + 10, chest.y + 6, 12, "#d9b24a", 1.8);
  }

  private pickup(e: Entity) {
    e.dead = true;
    const p = this.player;
    switch (e.sub) {
      case "lueur":
      case "cle":
      case "dague":
      case "cloche":
        p.weapon = e.sub;
        this.sfx("item");
        this.say(this.text.weapons[e.sub], "", "#fff1a8", 90);
        break;
      case "cape":
        if (p.armor === 1) {
          p.armor = 2;
          this.sfx("checkpoint");
          this.particles(p.x + p.w / 2, p.y + 8, 12, "#c3ad84", 1.2);
        } else {
          this.score += 1000;
          this.floatScore(e.x, e.y, 1000);
          this.sfx("item");
        }
        break;
      case "medaillon":
        this.score += 500;
        this.floatScore(e.x, e.y, 500);
        this.sfx("item");
        break;
      default:
        this.score += 200;
        this.floatScore(e.x, e.y, 200);
        this.sfx("item");
        break;
    }
  }

  private touchNpc(e: Entity) {
    if (e.state === "done") return;
    e.state = "done";
    this.checkpoint = { x: e.x + e.w + 12, y: this.player.y };
    this.sfx("checkpoint");
    let key = "serrure1";
    let color = "#8fe3ff";
    if (e.sub === "serrure") key = this.levelIndex === 0 ? "serrure1" : "serrure2";
    if (e.sub === "bourdon") {
      key = "bourdon";
      color = "#f5c04a";
    }
    const speaker = e.sub === "serrure" ? "SERRURE" : "BOURDON";
    this.say(this.text.dialogue[key], speaker, color, 300);
    // A checkpoint also mends the armour.
    if (this.player.armor === 1) {
      this.player.armor = 2;
      this.particles(this.player.x + 5, this.player.y + 8, 12, "#c3ad84", 1.2);
    }
  }

  private touchExit(e: Entity) {
    if (e.sub === "bossTrigger") {
      if (this.bossAlive || this.bossDefeated) return;
      this.startBoss(e);
      return;
    }
    if (!this.exitOpen) return;
    e.state = "used";
    this.exitOpen = false;
    this.setScreen("clear");
  }

  private startBoss(trigger: Entity) {
    this.bossAlive = true;
    trigger.dead = true;
    const arenaL = Math.floor((trigger.x - 8 * TILE + 2) / TILE) * TILE;
    const arenaR = Math.min(this.levelWidth, arenaL + VIEW_W);
    this.cameraLock = { l: arenaL, r: arenaR };
    this.checkpoint = { x: arenaL + 16, y: this.player.y };
    const stats = BOSS_STATS[this.level.boss];
    const bx = arenaR - stats.w - 36;
    const ground = this.groundBelow(bx + stats.w / 2, TILE * 2) ?? 160;
    const boss = this.spawn("boss", bx, ground - stats.h, this.level.boss);
    boss.data.arenaL = arenaL;
    boss.data.arenaR = arenaR;
    boss.dir = -1;
    this.audio.playSong("boss");
    this.sfx("boss");
    this.shake(10);
  }

  private onBossDefeated() {
    this.bossDefeated = true;
    this.bossAlive = false;
    this.exitOpen = true;
    this.audio.playSong(this.level.song);
    this.sfx("clear");
    // Clean the arena.
    for (const e of this.entities) {
      if (e.kind === "enemyShot" || e.kind === "golem") e.dead = true;
    }
    const exit = this.entities.find((e) => e.kind === "exit" && e.sub !== "bossTrigger");
    if (exit) this.particles(exit.x + 12, exit.y + 24, 30, "#8fe3ff", 2);
  }

  /* ---------------- ambience / camera / particles ---------------- */

  private tickAmbient() {
    if (this.bossAlive || this.bossDefeated || this.player.dead) return;
    this.ambientT += 1;
    const period = this.level.theme === "forest" ? 300 : this.level.theme === "chains" ? 360 : 0;
    if (!period || this.ambientT < period) return;
    this.ambientT = 0;
    const p = this.player;
    const x = p.x + p.dir * (90 + Math.random() * 60) * S;
    if (x < TILE || x > this.levelWidth - TILE) return;
    if (this.level.theme === "forest") {
      const gy = this.groundBelow(x, p.y);
      if (gy === null || gy > this.level.height * TILE - 12) return;
      const s = this.spawn("spore", x, gy - SPAWN.spore.h);
      s.state = "rise";
      s.alpha = 0;
      this.particles(x + 7, gy, 8, "#3fa9e8", 0.9);
    } else {
      const m = this.spawn("meduse", x, VIEW_H + 16);
      m.state = "rise";
      m.data.baseY = VIEW_H + 16;
      m.data.targetY = 90 + Math.random() * 120;
    }
  }

  private tickCamera() {
    const p = this.player;
    const target = p.x + p.w / 2 - VIEW_W / 2 + p.dir * 36;
    let cx = this.cameraX + (target - this.cameraX) * 0.12;
    if (this.cameraLock) {
      cx = this.cameraLock.l;
    }
    this.cameraX = Math.max(0, Math.min(this.levelWidth - VIEW_W, cx));
  }

  private tickParticles() {
    for (const pt of this.particlesList) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += pt.gravity;
      pt.life -= 1;
    }
    this.particlesList = this.particlesList.filter((pt) => pt.life > 0);
  }

  private floats: { x: number; y: number; text: string; life: number }[] = [];

  private floatScore(x: number, y: number, points: number) {
    this.floats.push({ x, y, text: String(points), life: 40 });
  }

  private say(text: string, speaker: string, color: string, frames: number) {
    this.dialogue = { text, speaker, timer: frames, color };
  }

  /* ---------------- persistence ---------------- */

  private loadHiScore(): number {
    try {
      const v = window.localStorage.getItem("lostgarden-hiscore");
      return v ? Number(v) || 0 : 0;
    } catch {
      return 0;
    }
  }

  private saveHiScore() {
    if (this.score > this.hiScore) this.hiScore = this.score;
    try {
      window.localStorage.setItem("lostgarden-hiscore", String(this.hiScore));
    } catch {
      /* private mode */
    }
  }

  /* ================================================================ */
  /* Rendering                                                         */
  /* ================================================================ */

  private render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    switch (this.screen) {
      case "title":
        this.renderTitle();
        break;
      case "intro":
        this.renderIntro();
        break;
      case "play":
      case "clear":
        this.renderPlay();
        break;
      case "gameover":
        this.renderGameOver();
        break;
      case "ending":
        this.renderEnding();
        break;
      default:
        break;
    }
    ctx.restore();
  }

  private setFont(size: number) {
    this.ctx.font = `${size}px ${this.font}`;
    this.ctx.textBaseline = "top";
  }

  private drawText(text: string, x: number, y: number, color = "#f8fafc", size = 8, align: CanvasTextAlign = "left", shadow = true) {
    const ctx = this.ctx;
    this.setFont(size);
    ctx.textAlign = align;
    if (shadow) {
      ctx.fillStyle = "#020817";
      ctx.fillText(text, x + 1, y + 1);
      ctx.fillText(text, x + 1, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  /** Word-wrapped text block; returns the number of lines drawn. */
  private drawParagraph(text: string, x: number, y: number, maxWidth: number, color: string, size = 8, lineHeight = 11, align: CanvasTextAlign = "left"): number {
    const ctx = this.ctx;
    this.setFont(size);
    const hasSpaces = text.includes(" ");
    const units = hasSpaces ? text.split(" ") : text.split("");
    const lines: string[] = [];
    let line = "";
    for (const unit of units) {
      const candidate = line ? (hasSpaces ? `${line} ${unit}` : line + unit) : unit;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = unit;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => this.drawText(l, x, y + i * lineHeight, color, size, align));
    return lines.length;
  }

  /* ---------------- lighting ---------------- */

  private renderLighting(darkness: number) {
    if (!this.lightCanvas) {
      this.lightCanvas = document.createElement("canvas");
      this.lightCanvas.width = VIEW_W;
      this.lightCanvas.height = VIEW_H;
    }
    const lc = this.lightCanvas.getContext("2d");
    if (!lc) return;
    lc.globalCompositeOperation = "source-over";
    lc.clearRect(0, 0, VIEW_W, VIEW_H);
    lc.fillStyle = `rgba(2, 6, 18, ${darkness})`;
    lc.fillRect(0, 0, VIEW_W, VIEW_H);
    lc.globalCompositeOperation = "destination-out";
    for (const l of this.lights) {
      const x = l.x - this.cameraX;
      if (x < -l.r || x > VIEW_W + l.r) continue;
      const g = lc.createRadialGradient(x, l.y, 0, x, l.y, l.r);
      g.addColorStop(0, `rgba(0, 0, 0, ${l.a})`);
      g.addColorStop(0.45, `rgba(0, 0, 0, ${l.a * 0.6})`);
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      lc.fillStyle = g;
      lc.fillRect(x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    this.ctx.drawImage(this.lightCanvas, 0, 0);
    // Coloured glow, additive.
    const ctx = this.ctx;
    ctx.globalCompositeOperation = "lighter";
    for (const l of this.lights) {
      if (!l.color) continue;
      const x = l.x - this.cameraX;
      if (x < -l.r || x > VIEW_W + l.r) continue;
      const g = ctx.createRadialGradient(x, l.y, 0, x, l.y, l.r * 0.8);
      g.addColorStop(0, l.color);
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  private themeDarkness(): number {
    switch (this.level.theme) {
      case "forest":
        return 0.5;
      case "chains":
        return 0.58;
      case "castle":
        return 0.5;
      default:
        return 0.4;
    }
  }

  /* ---------------- title ---------------- */

  private renderTitle() {
    const ctx = this.ctx;
    this.lights = [];
    this.cameraX = 0;
    drawBackground(ctx, "title", this.time, this.time);
    const groundY = VIEW_H - 48;
    const ground = getSprite("tileForestGround");
    const rock = getSprite("tileForestRock");
    for (let x = 0; x < VIEW_W; x += TILE) {
      ctx.drawImage(ground.canvas, x, groundY);
      ctx.drawImage(rock.canvas, x, groundY + TILE);
    }
    const grass = getSprite("decoGrass");
    for (let x = 6; x < VIEW_W; x += 52) ctx.drawImage(grass.canvas, x, groundY - 5);

    // Lanterne and Serrure on the road.
    const bob = Math.floor(this.time / 30) % 2;
    const lx = 78;
    const spr = lanterneSprite(Math.floor(this.time / 40) % 2 ? "idle1" : "idle", false);
    this.light(lx + 14, groundY - 37, 70, 0.9, "rgba(255, 200, 120, 0.35)");
    ctx.drawImage(spr.canvas, lx - spr.pad, groundY - 44 - spr.pad);
    const ser = getSprite("serrure");
    ctx.drawImage(ser.flipped, 124 - ser.pad, groundY - 44 + bob - ser.pad);
    drawForeground(ctx, "title", this.time * 0.4, this.time);
    this.renderLighting(0.35);

    this.drawText(this.text.title, VIEW_W / 2 + 2, 44, "#020817", 26, "center", false);
    this.drawText(this.text.title, VIEW_W / 2, 42, "#f8fafc", 26, "center");
    this.drawText(this.text.subtitle, VIEW_W / 2, 80, "#8fe3ff", 10, "center");
    if (Math.floor(this.time / 30) % 2 === 0) {
      this.drawText(this.text.pressStart, VIEW_W / 2, 140, "#f8fafc", 10, "center");
    }
    this.drawText(`${this.text.hiScore} ${String(this.hiScore).padStart(6, "0")}`, VIEW_W / 2, 168, "#c8b48a", 7, "center");
    ctx.fillStyle = "rgba(2, 8, 23, 0.7)";
    ctx.fillRect(0, VIEW_H - 32, VIEW_W, 32);
    this.drawParagraph(this.text.controlsHint, VIEW_W / 2, VIEW_H - 26, VIEW_W - 30, "#b9c0ca", 6, 10, "center");
  }

  private renderIntro() {
    const ctx = this.ctx;
    ctx.fillStyle = "#020817";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const lv = this.text.levels[this.levelIndex];
    const alpha = Math.min(1, this.screenT / 40);
    ctx.globalAlpha = alpha;
    // A faint vignette of the level colour.
    const tint = this.level.theme === "forest" ? "56, 189, 248" : this.level.theme === "chains" ? "120, 90, 60" : "200, 90, 60";
    const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 20, VIEW_W / 2, VIEW_H / 2, 300);
    g.addColorStop(0, `rgba(${tint}, 0.18)`);
    g.addColorStop(1, "rgba(2, 8, 23, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.drawText(`${this.text.stage} ${this.levelIndex + 1}`, VIEW_W / 2, 50, "#8fe3ff", 10, "center");
    this.drawParagraph(lv.title, VIEW_W / 2, 72, VIEW_W - 60, "#f8fafc", 16, 22, "center");
    this.drawParagraph(lv.intro, 40, 136, VIEW_W - 80, "#d8d2c2", 8, 13, "left");
    if (this.screenT > 60 && Math.floor(this.time / 30) % 2 === 0) {
      this.drawText(this.text.ready, VIEW_W / 2, VIEW_H - 36, "#ff9a2a", 10, "center");
    }
    ctx.globalAlpha = 1;
  }

  /* ---------------- play ---------------- */

  private renderPlay() {
    const ctx = this.ctx;
    this.lights = [];
    const shakeX = this.shakeT > 0 ? Math.round((Math.random() - 0.5) * 6) : 0;
    const shakeY = this.shakeT > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawBackground(ctx, this.level.theme, this.cameraX, this.time);
    this.renderTiles();
    this.renderDecorations();

    for (const e of this.entities) {
      if (e.kind === "npc" || e.kind === "chest" || e.kind === "item" || e.kind === "exit") this.renderEntity(e);
    }
    this.renderPlayer();
    for (const e of this.entities) {
      if (!(e.kind === "npc" || e.kind === "chest" || e.kind === "item" || e.kind === "exit")) this.renderEntity(e);
    }
    this.renderParticles();
    this.collectEntityLights();
    this.renderLighting(this.themeDarkness());
    drawForeground(ctx, this.level.theme, this.cameraX, this.time);
    ctx.restore();

    this.renderHud();
    if (this.dialogue) this.renderDialogue(this.dialogue);
    if (this.paused) {
      ctx.fillStyle = "rgba(2, 8, 23, 0.6)";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      this.drawText(this.text.pause, VIEW_W / 2, 120, "#f8fafc", 18, "center");
      this.drawText(this.text.resume, VIEW_W / 2, 152, "#b9c0ca", 8, "center");
    }
    if (this.screen === "clear") this.renderClearOverlay();
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(2, 8, 23, ${this.fade})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  private collectEntityLights() {
    for (const e of this.entities) {
      if (e.dead) continue;
      const cx = e.x + e.w / 2;
      const cy = e.y + e.h / 2;
      switch (e.kind) {
        case "spore":
          this.light(cx, e.y + 4, 34, 0.8, "rgba(63, 169, 232, 0.16)");
          break;
        case "meduse":
          this.light(cx, cy, 36, 0.9 * e.alpha, "rgba(127, 216, 255, 0.18)");
          break;
        case "rouage":
          this.light(cx, e.y + 5, 18, 0.7, "rgba(255, 154, 42, 0.25)");
          break;
        case "golem":
          if (e.state !== "dormant") this.light(cx, e.y + 5, 22, 0.8, "rgba(255, 154, 42, 0.25)");
          break;
        case "shot":
          this.light(cx, cy, e.sub === "lueur" ? 40 : 22, 0.9, e.sub === "lueur" ? "rgba(255, 241, 168, 0.3)" : undefined);
          break;
        case "enemyShot":
          this.light(cx, cy, 20, 0.8, "rgba(255, 154, 42, 0.3)");
          break;
        case "item":
          this.light(cx, cy, 26, 0.8, "rgba(255, 241, 168, 0.18)");
          break;
        case "chest":
          if (e.state === "open") this.light(cx, cy, 30, 0.6, "rgba(217, 178, 74, 0.2)");
          break;
        case "exit":
          if (e.sub !== "bossTrigger" && this.exitOpen) this.light(cx, cy, 80, 1, "rgba(143, 227, 255, 0.3)");
          break;
        case "npc":
          if (e.sub === "bourdon") this.light(cx, e.y + 24, 70, 0.9, "rgba(255, 150, 60, 0.28)");
          else this.light(cx, cy, 40, 0.5);
          break;
        case "boss":
          if (e.sub === "machine") this.light(cx, e.y + 14, 60, 0.9 * e.alpha, "rgba(255, 154, 42, 0.25)");
          else if (e.sub === "sombre") this.light(cx, cy, 44, 0.6 * e.alpha);
          else this.light(cx, e.y + 12, 40, 0.5 * e.alpha, "rgba(232, 228, 216, 0.12)");
          break;
        default:
          break;
      }
    }
    // Ambient light from the background mushrooms so the forest floor reads.
    if (this.level.theme === "forest") {
      for (let i = 0; i < 6; i += 1) {
        const x = this.cameraX + ((i * 97 + Math.floor(this.cameraX * 0.4)) % VIEW_W);
        this.light(x, VIEW_H - 60, 50, 0.35);
      }
    }
  }

  private renderEntity(e: Entity) {
    if (e.kind === "exit") {
      this.renderExit(e);
      return;
    }
    drawEntity(e, this);
  }

  private renderExit(e: Entity) {
    if (e.sub === "bossTrigger") return;
    const ctx = this.ctx;
    const x = Math.round(e.x - this.cameraX);
    const y = Math.round(e.y);
    // A wooden door set in the rock, lit in blue when the way is open.
    ctx.fillStyle = "#1b1208";
    ctx.fillRect(x - 2, y - 2, TILE + 4, TILE * 2 + 2);
    ctx.fillStyle = "#3a2a1e";
    ctx.fillRect(x, y, TILE, TILE * 2);
    ctx.fillStyle = "#5a4530";
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE * 2 - 2);
    ctx.fillStyle = "#3a2a1e";
    for (let i = 0; i < 4; i += 1) ctx.fillRect(x + 4 + i * 5, y + 2, 1, TILE * 2 - 2);
    ctx.fillStyle = "#2a1d10";
    ctx.fillRect(x + 2, y + 14, TILE - 4, 2);
    ctx.fillRect(x + 2, y + 34, TILE - 4, 2);
    ctx.fillStyle = "#d1a043";
    ctx.fillRect(x + 17, y + 26, 3, 3);
    ctx.beginPath();
    ctx.fillStyle = "#1b1208";
    ctx.arc(x + TILE / 2, y, TILE / 2 + 2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#5a4530";
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + 2, TILE / 2 - 2, Math.PI, 0);
    ctx.fill();
    if (this.exitOpen) {
      const pulse = 0.5 + 0.5 * Math.sin(this.time / 10);
      ctx.fillStyle = `rgba(185, 243, 255, ${0.55 + pulse * 0.4})`;
      ctx.fillRect(x + 3, y + 3, TILE - 6, TILE * 2 - 4);
    }
  }

  private renderTiles() {
    const ctx = this.ctx;
    const theme = this.level.theme;
    const ground = getSprite(theme === "forest" ? "tileForestGround" : theme === "chains" ? "tileBoneGround" : "tileCastleFloor");
    const rockA = getSprite(theme === "forest" ? "tileForestRock" : theme === "chains" ? "tileBoneRock" : "tileCastleStone");
    const rockB = getSprite(theme === "forest" ? "tileForestRockB" : theme === "chains" ? "tileBoneRockB" : "tileCastleStone");
    const platform = getSprite(theme === "forest" ? "tileMushroom" : theme === "chains" ? "tileChain" : "tileBeam");
    const thorns = getSprite("tileThorns");
    const startTx = Math.floor(this.cameraX / TILE);
    const endTx = startTx + Math.ceil(VIEW_W / TILE) + 1;
    for (let ty = 0; ty < this.level.height; ty += 1) {
      for (let tx = startTx; tx <= endTx; tx += 1) {
        const t = this.tileAt(tx, ty);
        if (t === ".") continue;
        const x = Math.round(tx * TILE - this.cameraX);
        const y = ty * TILE;
        if (t === "#") {
          const above = this.tileAt(tx, ty - 1);
          if (above !== "#") ctx.drawImage(ground.canvas, x, y);
          else ctx.drawImage((rnd(tx * 3 + ty * 11) < 0.5 ? rockA : rockB).canvas, x, y);
          // Soft shadow under overhangs and on the left of walls.
          if (this.tileAt(tx, ty + 1) === ".") {
            ctx.fillStyle = "rgba(2, 6, 18, 0.35)";
            ctx.fillRect(x, y + TILE, TILE, 6);
          }
          if (this.tileAt(tx + 1, ty) === "." && this.tileAt(tx + 1, ty - 1) === ".") {
            ctx.fillStyle = "rgba(2, 6, 18, 0.25)";
            ctx.fillRect(x + TILE, y, 5, TILE);
          }
        } else if (t === "-") {
          ctx.drawImage(platform.canvas, x - platform.pad, y - platform.pad);
        } else if (t === "^") {
          ctx.drawImage(thorns.canvas, x, y);
        }
      }
    }
  }

  private renderDecorations() {
    const camL = this.cameraX - 40;
    const camR = this.cameraX + VIEW_W + 40;
    for (const d of this.decos) {
      if (d.x < camL || d.x > camR) continue;
      const spr = getSprite(d.name);
      this.drawSprite(spr, d.x, d.y, false, 1);
      if (d.light) {
        const flick = d.flicker ? 0.75 + 0.25 * Math.sin(this.time / 4 + d.x) : 1;
        const warm = d.flicker;
        this.light(d.x + spr.width / 2 - spr.pad, d.y + (warm ? 1 : 3), d.light * flick, 0.85, warm ? "rgba(255, 180, 70, 0.25)" : "rgba(63, 169, 232, 0.16)");
      }
    }
  }

  private renderPlayer() {
    const p = this.player;
    const ctx = this.ctx;
    const squash = p.landT > 0 ? 1 : 0;
    const sx = Math.round(p.x - 9 - this.cameraX);
    const sy = Math.round(p.y + p.h - 44) + squash;
    const headY = p.crouch ? sy + 17 : sy + 7;
    const headX = sx + 14;
    const flick = 0.95 + 0.05 * Math.sin(this.time / 4);
    this.light(headX + this.cameraX, p.dead ? sy + 30 : headY, p.dead ? 50 : 96 * flick, 1, "rgba(255, 200, 120, 0.22)");

    let frame = p.frame;
    if (p.dead) frame = p.deadT < 30 ? "deadA" : "deadB";
    if (p.invuln > 0 && !p.dead && Math.floor(p.invuln / 3) % 2 === 0) return;
    const spr = lanterneSprite(frame, p.armor === 1);
    ctx.drawImage(p.dir < 0 ? spr.flipped : spr.canvas, sx - spr.pad, sy - spr.pad);
  }

  private renderParticles() {
    const ctx = this.ctx;
    for (const pt of this.particlesList) {
      ctx.globalAlpha = Math.max(0, Math.min(1, pt.life / 20));
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.round(pt.x - this.cameraX), Math.round(pt.y), pt.size, pt.size);
    }
    ctx.globalAlpha = 1;
    for (const f of this.floats) {
      f.y -= 0.5;
      f.life -= 1;
      this.drawText(f.text, Math.round(f.x - this.cameraX), Math.round(f.y), "#fff1a8", 7, "left");
    }
    this.floats = this.floats.filter((f) => f.life > 0);
  }

  private renderHud() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, 30);
    g.addColorStop(0, "rgba(2, 8, 23, 0.85)");
    g.addColorStop(1, "rgba(2, 8, 23, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, 30);
    this.drawText(String(this.score).padStart(6, "0"), 8, 5, "#f8fafc", 10);
    this.drawText(`HI ${String(this.hiScore).padStart(6, "0")}`, 8, 17, "#c8b48a", 6);

    // Timer.
    const sec = Math.ceil(this.timeLeft / 60);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const timerColor = sec <= 10 && Math.floor(this.time / 15) % 2 === 0 ? "#ff9a2a" : "#f8fafc";
    this.drawText(`${m}:${String(s).padStart(2, "0")}`, VIEW_W / 2, 6, timerColor, 12, "center");

    // Lives: lantern heads.
    for (let i = 0; i < Math.max(0, this.lives); i += 1) {
      const x = VIEW_W - 12 - i * 11;
      ctx.fillStyle = "#586170";
      ctx.fillRect(x - 1, 5, 8, 10);
      ctx.fillStyle = "#eef1f5";
      ctx.fillRect(x, 6, 6, 8);
      ctx.fillStyle = "#12121a";
      ctx.fillRect(x + 1, 9, 1, 2);
      ctx.fillRect(x + 4, 9, 1, 2);
      ctx.fillStyle = "#c4cbd5";
      ctx.fillRect(x + 1, 4, 4, 1);
      ctx.fillRect(x + 2, 3, 2, 1);
    }
    // Armour and weapon.
    const cape = getSprite("itemCape");
    ctx.drawImage(cape.canvas, VIEW_W - 100, 4);
    if (this.player.armor === 1) {
      ctx.fillStyle = "rgba(2, 8, 23, 0.75)";
      ctx.fillRect(VIEW_W - 100, 4, 14, 14);
      ctx.fillStyle = "#ff5a2a";
      ctx.fillRect(VIEW_W - 99, 17, 12, 1);
    }
    const wIcon = getSprite({ lueur: "itemLueur", cle: "itemCle", dague: "itemDague", cloche: "itemCloche" }[this.player.weapon]);
    ctx.drawImage(wIcon.canvas, VIEW_W - 80, 4);

    // Medallion: glows bluer as Rose gets closer.
    const progress = Math.min(1, this.player.x / Math.max(1, this.levelWidth - VIEW_W));
    const mx = VIEW_W / 2 + 56;
    const mg = ctx.createRadialGradient(mx + 7, 11, 1, mx + 7, 11, 8 + progress * 14);
    mg.addColorStop(0, `rgba(143, 227, 255, ${0.25 + progress * 0.7})`);
    mg.addColorStop(1, "rgba(143, 227, 255, 0)");
    ctx.fillStyle = mg;
    ctx.fillRect(mx - 16, -12, 46, 46);
    ctx.drawImage(getSprite("itemMedaillon").canvas, mx, 4);

    // Boss bar.
    if (this.bossAlive && this.bossHp.max > 0) {
      const w = 180;
      const x = VIEW_W / 2 - w / 2;
      ctx.fillStyle = "rgba(2, 8, 23, 0.75)";
      ctx.fillRect(x - 2, VIEW_H - 22, w + 4, 11);
      ctx.fillStyle = "#4a1616";
      ctx.fillRect(x, VIEW_H - 20, w, 7);
      ctx.fillStyle = "#ff9a2a";
      ctx.fillRect(x, VIEW_H - 20, Math.round((w * this.bossHp.cur) / this.bossHp.max), 7);
      ctx.fillStyle = "#ffd27a";
      ctx.fillRect(x, VIEW_H - 20, Math.round((w * this.bossHp.cur) / this.bossHp.max), 2);
      this.drawText(this.bossHp.name, VIEW_W / 2, VIEW_H - 34, "#f8fafc", 8, "center");
    }
  }

  private renderDialogue(d: Dialogue) {
    const ctx = this.ctx;
    const alpha = Math.min(1, d.timer / 20);
    ctx.globalAlpha = alpha;
    const h = 50;
    const x = 12;
    const w = VIEW_W - 24;
    const y = VIEW_H - h - 12;
    ctx.fillStyle = "rgba(2, 8, 23, 0.88)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = d.color;
    ctx.fillRect(x + 4, y + 4, 2, h - 8);
    let ty = y + 6;
    if (d.speaker) {
      this.drawText(d.speaker, x + 12, ty, d.color, 8);
      ty += 13;
    }
    this.drawParagraph(d.text, x + 12, ty, w - 24, "#f8fafc", 7, 11);
    ctx.globalAlpha = 1;
  }

  private renderClearOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(2, 8, 23, 0.6)";
    ctx.fillRect(0, 70, VIEW_W, 110);
    this.drawText(this.text.stageClear, VIEW_W / 2, 84, "#8fe3ff", 16, "center");
    const sec = Math.ceil(this.timeLeft / 60);
    this.drawText(`${this.text.timeBonus} ${sec} x 10`, VIEW_W / 2, 120, "#f8fafc", 9, "center");
    this.drawText(`${this.text.score} ${String(this.score).padStart(6, "0")}`, VIEW_W / 2, 142, "#c8b48a", 9, "center");
  }

  private renderGameOver() {
    const ctx = this.ctx;
    this.lights = [];
    this.cameraX = 0;
    ctx.fillStyle = "#020817";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const spr = lanterneSprite("deadB", this.player.armor === 1);
    ctx.drawImage(spr.canvas, VIEW_W / 2 - 16 - spr.pad, 84 - spr.pad);
    this.light(VIEW_W / 2 + 6, 104, 40, 0.5, "rgba(255, 200, 120, 0.15)");
    this.renderLighting(0.2);
    this.drawParagraph(this.text.gameOver, VIEW_W / 2, 140, VIEW_W - 60, "#d8d2c2", 9, 13, "center");
    this.drawText(this.text.continueQ, VIEW_W / 2, 180, "#f8fafc", 11, "center");
    const yesColor = this.continueChoice === 0 ? "#ff9a2a" : "#b9c0ca";
    const noColor = this.continueChoice === 1 ? "#ff9a2a" : "#b9c0ca";
    this.drawText(this.text.yes, VIEW_W / 2 - 44, 206, yesColor, 11, "center");
    this.drawText(this.text.no, VIEW_W / 2 + 44, 206, noColor, 11, "center");
    this.drawText(`${this.text.score} ${String(this.score).padStart(6, "0")}`, VIEW_W / 2, 250, "#c8b48a", 8, "center");
  }

  private renderEnding() {
    const ctx = this.ctx;
    const t = this.endingT;
    this.lights = [];
    this.cameraX = 0;
    drawBackground(ctx, "white", t * 0.6, this.time);
    const ground = getSprite("tileWhiteGround");
    const groundY = VIEW_H - 48;
    for (let x = -(Math.floor(t * 0.6) % TILE); x < VIEW_W + TILE; x += TILE) {
      ctx.drawImage(ground.canvas, x, groundY);
      ctx.drawImage(ground.canvas, x, groundY + TILE);
    }

    // Lanterne and Serrure walking, then Barrik dropping in, then Rose.
    const walk = `walk${Math.floor(t / 7) % 4}`;
    const lx = Math.min(180, 30 + t * 0.6);
    const walking = t < 250;
    const spr = lanterneSprite(walking ? walk : "idle", false);
    this.light(lx + 14, groundY - 37, 70, 0.8, "rgba(255, 200, 120, 0.2)");
    ctx.drawImage(spr.canvas, lx - spr.pad, groundY - 44 - spr.pad);
    const ser = getSprite("serrure");
    ctx.drawImage(ser.canvas, lx - 40 - ser.pad, groundY - 44 + (walking ? Math.floor(t / 8) % 2 : 0) - ser.pad);

    if (t > 300) {
      const fall = Math.min(1, (t - 300) / 40);
      const by = -50 + fall * (groundY - 39 + 50);
      const bounce = t > 340 && t < 352 ? -6 : 0;
      const bar = getSprite("barrik");
      ctx.drawImage(bar.flipped, 290 - bar.pad, by + bounce - bar.pad);
      if (t === 341) {
        this.shake(6);
        this.sfx("hit");
      }
    }
    if (t > 620) {
      const alpha = Math.min(1, (t - 620) / 60);
      ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(410, groundY - 30, 2, 410, groundY - 30, 60);
      g.addColorStop(0, "rgba(242, 167, 200, 0.6)");
      g.addColorStop(1, "rgba(242, 167, 200, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(350, groundY - 90, 120, 120);
      const rose = getSprite("rose");
      ctx.drawImage(rose.flipped, 400 - rose.pad, groundY - 35 - rose.pad);
      ctx.globalAlpha = 1;
    }
    this.renderLighting(0.12);

    const lines = this.text.ending;
    const idx = Math.floor(t / 220);
    ctx.fillStyle = "rgba(2, 8, 23, 0.7)";
    ctx.fillRect(0, 22, VIEW_W, 70);
    if (idx < lines.length) {
      const local = t % 220;
      ctx.globalAlpha = local < 30 ? local / 30 : local > 190 ? (220 - local) / 30 : 1;
      this.drawParagraph(lines[idx], VIEW_W / 2, 36, VIEW_W - 60, "#f8fafc", 9, 14, "center");
      ctx.globalAlpha = 1;
    } else {
      this.drawParagraph(this.text.thanks, VIEW_W / 2, 32, VIEW_W - 60, "#f8fafc", 8, 12, "center");
      this.drawText(`${this.text.score} ${String(this.score).padStart(6, "0")}`, VIEW_W / 2, 70, "#c8b48a", 9, "center");
    }
    if (t > 340 && t < 600) {
      this.renderDialogue({ text: this.text.dialogue.barrik, speaker: "BARRIK", timer: 600 - t, color: "#a8733c" });
    } else if (t > 700 && t < 900) {
      this.renderDialogue({ text: this.text.dialogue.rose, speaker: "ROSE", timer: 900 - t, color: "#f2a7c8" });
    }
  }
}
