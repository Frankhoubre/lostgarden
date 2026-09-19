/**
 * Lost Garden: The Lantern's Oath.
 * A Ghouls'n Ghosts style platformer in a 320x192 pixel window.
 */
import { drawEntity, updateEntity, SPAWN, BOSS_STATS } from "./actors";
import { GameAudio } from "./audio";
import { drawBackground, type BackgroundTheme } from "./backgrounds";
import { LEVELS, type LevelDef, type Theme } from "./levels";
import type { Sprite } from "./pixel";
import { getSprite, lanterneSprite } from "./sprites";
import { getGameText, type GameText } from "./text";
import {
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

const GRAVITY = 0.3;
const MAX_FALL = 6.5;
const WALK_SPEED = 1.4;
const JUMP_VY = -5.8;
const PLAYER_W = 10;
const PLAYER_H = 22;
const CROUCH_H = 14;
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
  private lastTick = 0;

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
      e.state = "intro";
      e.alpha = 0;
    }
    this.entities.push(e);
    return e;
  }

  enemyShot(x: number, y: number, vx: number, vy: number, sub: string): Entity {
    const e = this.spawn("enemyShot", x, y, sub);
    e.vx = vx;
    e.vy = vy;
    if (sub === "scythe") {
      e.w = 12;
      e.h = 12;
    } else if (sub === "shard") {
      e.w = 3;
      e.h = 3;
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
        gravity: 0.05,
      });
    }
  }

  drawSprite(s: Sprite, x: number, y: number, flip: boolean, alpha = 1) {
    const ctx = this.ctx;
    if (alpha <= 0) return;
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    ctx.drawImage(flip ? s.flipped : s.canvas, Math.round(x - this.cameraX), Math.round(y));
    ctx.globalAlpha = prev;
  }

  hurtPlayer() {
    const p = this.player;
    if (p.dead || p.invuln > 0 || this.screen !== "play") return;
    if (p.armor === 2) {
      p.armor = 1;
      p.invuln = INVULN;
      this.sfx("armor");
      this.particles(p.x + p.w / 2, p.y + 8, 12, "#c3ad84", 1.6);
      this.shake(4);
      p.vy = -3;
      p.vx = -p.dir * 1.2;
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
    let startX = 32;
    let startY = 100;
    for (let y = 0; y < this.level.height; y += 1) {
      let row = "";
      for (let x = 0; x < this.level.width; x += 1) {
        const ch = this.level.map[y][x];
        const px = x * TILE;
        const py = y * TILE;
        let tile = ".";
        switch (ch) {
          case "#":
          case "-":
          case "^":
            tile = ch;
            break;
          case "P":
            startX = px + 3;
            startY = py + TILE - PLAYER_H;
            break;
          case "c":
            this.spawn("chest", px + 1, py + 4);
            break;
          case "E": {
            const ex = this.spawn("exit", px, py - 16);
            ex.h = 32;
            break;
          }
          case "X": {
            const ex = this.spawn("exit", px, py);
            ex.sub = "bossTrigger";
            ex.w = 4;
            ex.h = TILE;
            break;
          }
          case "S":
            this.spawn("npc", px, py - 10, "serrure");
            break;
          case "B":
            this.spawn("npc", px, py - 10, "bourdon");
            break;
          case "s":
            this.spawn("spore", px + 3, py + 5).state = "hop";
            break;
          case "j":
            this.spawn("meduse", px + 3, py + 2);
            break;
          case "p":
            this.spawn("penitent", px + 3, py - 8);
            break;
          case "a":
            this.spawn("rouage", px + 1, py + 5);
            break;
          case "w":
            this.spawn("loup", px, py + 5);
            break;
          case "r":
            this.spawn("reptile", px + 3, py - 8);
            break;
          case "k":
            this.spawn("colosse", px - 8, py - 6);
            break;
          case "g":
            this.spawn("golem", px + 2, py - 8);
            break;
          case "m":
            this.spawn("souris", px + 4, py + 8);
            break;
          case "l":
            this.spawn("item", px + 3, py + 6, "lys");
            break;
          case "d":
            this.spawn("item", px + 3, py + 6, "medaillon");
            break;
          default:
            break;
        }
        row += tile;
      }
      tiles.push(row);
    }
    this.tiles = tiles;

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
      this.particles(p.x + p.w / 2, p.y + p.h, 3, "#5fa88a", 0.5);
    }

    // Level bounds.
    if (p.x < 0) p.x = 0;
    if (this.cameraLock) {
      p.x = Math.max(this.cameraLock.l, Math.min(this.cameraLock.r - p.w, p.x));
    }
    if (p.x + p.w > this.levelWidth) p.x = this.levelWidth - p.w;

    // Pits and thorns.
    if (p.y > this.level.height * TILE + 8) this.killPlayer();
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
    const y = p.crouch ? p.y + 4 : p.y + 8;
    const x = p.dir > 0 ? p.x + p.w : p.x - 8;
    const s = this.spawn("shot", x, y, p.weapon);
    s.dir = p.dir;
    switch (p.weapon) {
      case "lueur":
        s.w = 8;
        s.h = 3;
        s.vx = p.dir * 4;
        break;
      case "cle":
        s.w = 8;
        s.h = 8;
        s.vx = p.dir * 3.2;
        s.data.pierce = true;
        break;
      case "dague":
        s.w = 9;
        s.h = 3;
        s.vx = p.dir * 6;
        break;
      case "cloche":
        s.w = 8;
        s.h = 8;
        s.vx = p.dir * 2.2;
        s.vy = -3.4;
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
    const item = this.spawn("item", chest.x + 2, chest.y - 8, sub);
    item.vy = -3;
    item.vx = 0.4;
    this.particles(chest.x + 7, chest.y + 4, 8, "#d9b24a", 1.2);
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
    this.checkpoint = { x: e.x + 24, y: this.player.y };
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
    const arenaL = Math.floor((trigger.x - 8 * TILE) / TILE) * TILE;
    const arenaR = Math.min(this.levelWidth, arenaL + VIEW_W);
    this.cameraLock = { l: arenaL, r: arenaR };
    this.checkpoint = { x: arenaL + 16, y: this.player.y };
    const stats = BOSS_STATS[this.level.boss];
    const bx = arenaR - stats.w - 24;
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
    if (exit) this.particles(exit.x + 8, exit.y + 16, 20, "#8fe3ff", 1.5);
  }

  /* ---------------- ambience / camera / particles ---------------- */

  private tickAmbient() {
    if (this.bossAlive || this.bossDefeated || this.player.dead) return;
    this.ambientT += 1;
    const period = this.level.theme === "forest" ? 300 : this.level.theme === "chains" ? 360 : 0;
    if (!period || this.ambientT < period) return;
    this.ambientT = 0;
    const p = this.player;
    const x = p.x + p.dir * (90 + Math.random() * 60);
    if (x < 16 || x > this.levelWidth - 16) return;
    if (this.level.theme === "forest") {
      const gy = this.groundBelow(x, p.y);
      if (gy === null || gy > this.level.height * TILE - 8) return;
      const s = this.spawn("spore", x, gy - 11);
      s.state = "rise";
      s.alpha = 0;
      this.particles(x + 5, gy, 5, "#3fa9e8", 0.6);
    } else {
      const m = this.spawn("meduse", x, VIEW_H + 10);
      m.state = "rise";
      m.data.baseY = VIEW_H + 10;
      m.data.targetY = 60 + Math.random() * 80;
    }
  }

  private tickCamera() {
    const p = this.player;
    const target = p.x + p.w / 2 - VIEW_W / 2 + p.dir * 24;
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

  private themeBackground(theme: Theme): BackgroundTheme {
    return theme;
  }

  private renderTitle() {
    const ctx = this.ctx;
    drawBackground(ctx, "title", this.time, this.time);
    // Ground strip.
    const tile = getSprite("tileForestGround");
    for (let x = 0; x < VIEW_W; x += TILE) ctx.drawImage(tile.canvas, x, VIEW_H - 32);
    for (let x = 0; x < VIEW_W; x += TILE) ctx.drawImage(getSprite("tileForestRock").canvas, x, VIEW_H - 16);

    // Lanterne standing, Serrure beside him.
    const bob = Math.floor(this.time / 30) % 2;
    this.cameraX = 0;
    this.drawGlow(60, VIEW_H - 32 - 20, 26, 0.5);
    ctx.drawImage(lanterneSprite("idle", false).canvas, 52, VIEW_H - 32 - 24);
    ctx.drawImage(getSprite("serrure").flipped, 84, VIEW_H - 32 - 26 + bob);

    this.drawText(this.text.title, VIEW_W / 2, 30, "#f8fafc", 20, "center");
    this.drawText(this.text.subtitle, VIEW_W / 2, 58, "#8fe3ff", 8, "center");
    if (Math.floor(this.time / 30) % 2 === 0) {
      this.drawText(this.text.pressStart, VIEW_W / 2, 100, "#f8fafc", 8, "center");
    }
    this.drawText(`${this.text.hiScore} ${String(this.hiScore).padStart(6, "0")}`, VIEW_W / 2, 122, "#c8b48a", 6, "center");
    ctx.fillStyle = "rgba(2, 8, 23, 0.7)";
    ctx.fillRect(0, VIEW_H - 30, VIEW_W, 30);
    this.drawParagraph(this.text.controlsHint, VIEW_W / 2, VIEW_H - 25, VIEW_W - 24, "#b9c0ca", 5, 8, "center");
  }

  private renderIntro() {
    const ctx = this.ctx;
    ctx.fillStyle = "#020817";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const lv = this.text.levels[this.levelIndex];
    const alpha = Math.min(1, this.screenT / 40);
    ctx.globalAlpha = alpha;
    this.drawText(`${this.text.stage} ${this.levelIndex + 1}`, VIEW_W / 2, 30, "#8fe3ff", 8, "center");
    this.drawParagraph(lv.title, VIEW_W / 2, 46, VIEW_W - 30, "#f8fafc", 12, 16, "center");
    this.drawParagraph(lv.intro, 20, 90, VIEW_W - 40, "#d8d2c2", 6, 9, "left");
    if (this.screenT > 60 && Math.floor(this.time / 30) % 2 === 0) {
      this.drawText(this.text.ready, VIEW_W / 2, VIEW_H - 24, "#ff9a2a", 8, "center");
    }
    ctx.globalAlpha = 1;
  }

  private renderPlay() {
    const ctx = this.ctx;
    const shakeX = this.shakeT > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
    const shakeY = this.shakeT > 0 ? Math.round((Math.random() - 0.5) * 3) : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawBackground(ctx, this.themeBackground(this.level.theme), this.cameraX, this.time);
    this.renderTiles();

    // Entities behind the player: NPCs, chests, items, exit.
    for (const e of this.entities) {
      if (e.kind === "npc" || e.kind === "chest" || e.kind === "item" || e.kind === "exit") this.renderEntity(e);
    }
    this.renderPlayer();
    for (const e of this.entities) {
      if (!(e.kind === "npc" || e.kind === "chest" || e.kind === "item" || e.kind === "exit")) this.renderEntity(e);
    }
    this.renderParticles();
    ctx.restore();

    this.renderHud();
    if (this.dialogue) this.renderDialogue(this.dialogue);
    if (this.paused) {
      ctx.fillStyle = "rgba(2, 8, 23, 0.6)";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      this.drawText(this.text.pause, VIEW_W / 2, 80, "#f8fafc", 14, "center");
      this.drawText(this.text.resume, VIEW_W / 2, 104, "#b9c0ca", 6, "center");
    }
    if (this.screen === "clear") this.renderClearOverlay();
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(2, 8, 23, ${this.fade})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
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
    // A wooden door in the cliff, lit in blue when the way is open.
    ctx.fillStyle = "#2a1d10";
    ctx.fillRect(x, y, 16, 32);
    ctx.fillStyle = "#5a4530";
    ctx.fillRect(x + 2, y + 2, 12, 30);
    ctx.fillStyle = "#3a2a1e";
    for (let i = 0; i < 3; i += 1) ctx.fillRect(x + 3 + i * 4, y + 2, 1, 30);
    ctx.fillStyle = "#d1a043";
    ctx.fillRect(x + 11, y + 17, 2, 2);
    if (this.exitOpen) {
      const pulse = 0.5 + 0.5 * Math.sin(this.time / 10);
      const g = ctx.createRadialGradient(x + 8, y + 16, 2, x + 8, y + 16, 30);
      g.addColorStop(0, `rgba(143, 227, 255, ${0.5 + pulse * 0.3})`);
      g.addColorStop(1, "rgba(143, 227, 255, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - 24, y - 16, 64, 64);
      ctx.fillStyle = `rgba(185, 243, 255, ${0.5 + pulse * 0.5})`;
      ctx.fillRect(x + 2, y + 2, 12, 30);
    }
  }

  private renderTiles() {
    const ctx = this.ctx;
    const theme = this.level.theme;
    const ground = getSprite(theme === "forest" ? "tileForestGround" : theme === "chains" ? "tileBoneGround" : "tileCastleFloor");
    const rock = getSprite(theme === "forest" ? "tileForestRock" : theme === "chains" ? "tileBoneRock" : "tileCastleStone");
    const platform = getSprite(theme === "forest" ? "tileMushroom" : theme === "chains" ? "tileChain" : "tileBeam");
    const thorns = getSprite("tileThorns");
    const startTx = Math.floor(this.cameraX / TILE);
    const endTx = startTx + Math.ceil(VIEW_W / TILE) + 1;
    for (let ty = 0; ty < this.level.height; ty += 1) {
      for (let tx = startTx; tx <= endTx; tx += 1) {
        const t = this.tileAt(tx, ty);
        if (t === ".") continue;
        const x = tx * TILE - this.cameraX;
        const y = ty * TILE;
        if (t === "#") {
          const above = this.tileAt(tx, ty - 1);
          ctx.drawImage(above === "#" ? rock.canvas : ground.canvas, Math.round(x), y);
        } else if (t === "-") {
          ctx.drawImage(platform.canvas, Math.round(x), y);
        } else if (t === "^") {
          ctx.drawImage(thorns.canvas, Math.round(x), y);
        }
      }
    }
  }

  private drawGlow(cx: number, cy: number, radius: number, strength: number) {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius);
    g.addColorStop(0, `rgba(255, 220, 150, ${strength})`);
    g.addColorStop(0.5, `rgba(255, 200, 120, ${strength * 0.35})`);
    g.addColorStop(1, "rgba(255, 200, 120, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }

  private renderPlayer() {
    const p = this.player;
    const ctx = this.ctx;
    const sx = Math.round(p.x - 3 - this.cameraX);
    const sy = Math.round(p.y + p.h - 24);
    // Lantern glow, flickering.
    const flick = 0.35 + 0.08 * Math.sin(this.time / 4) + (p.dead ? -0.2 : 0);
    const headY = p.crouch ? sy + 11 : sy + 5;
    const headX = sx + 7;
    this.drawGlow(headX, p.dead ? sy + 18 : headY, 28, Math.max(0.05, flick));

    let frame = p.frame;
    if (p.dead) frame = p.deadT < 30 ? "deadA" : "deadB";
    if (p.invuln > 0 && !p.dead && Math.floor(p.invuln / 3) % 2 === 0) return;
    const spr = lanterneSprite(frame, p.armor === 1);
    ctx.drawImage(p.dir < 0 ? spr.flipped : spr.canvas, sx, sy);
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
      f.y -= 0.4;
      f.life -= 1;
      this.drawText(f.text, Math.round(f.x - this.cameraX), Math.round(f.y), "#fff1a8", 5, "left");
    }
    this.floats = this.floats.filter((f) => f.life > 0);
  }

  private renderHud() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(2, 8, 23, 0.55)";
    ctx.fillRect(0, 0, VIEW_W, 18);
    this.drawText(`${String(this.score).padStart(6, "0")}`, 4, 3, "#f8fafc", 7);
    this.drawText(`HI ${String(this.hiScore).padStart(6, "0")}`, 4, 11, "#c8b48a", 5);

    // Timer.
    const sec = Math.ceil(this.timeLeft / 60);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const timerColor = sec <= 10 && Math.floor(this.time / 15) % 2 === 0 ? "#ff9a2a" : "#f8fafc";
    this.drawText(`${m}:${String(s).padStart(2, "0")}`, VIEW_W / 2, 5, timerColor, 8, "center");

    // Lives: small lantern heads.
    for (let i = 0; i < Math.max(0, this.lives); i += 1) {
      const x = VIEW_W - 8 - i * 8;
      ctx.fillStyle = "#e6e9ee";
      ctx.fillRect(x, 4, 5, 6);
      ctx.fillStyle = "#12121a";
      ctx.fillRect(x + 1, 6, 1, 1);
      ctx.fillRect(x + 3, 6, 1, 1);
      ctx.fillStyle = "#9aa3b1";
      ctx.fillRect(x + 1, 3, 3, 1);
    }
    // Weapon icon.
    const wIcon = getSprite(
      { lueur: "itemLueur", cle: "itemCle", dague: "itemDague", cloche: "itemCloche" }[this.player.weapon],
    );
    ctx.drawImage(wIcon.canvas, VIEW_W - 60, 3);
    // Armour state.
    ctx.drawImage(getSprite("itemCape").canvas, VIEW_W - 76, 3);
    if (this.player.armor === 1) {
      ctx.fillStyle = "rgba(2, 8, 23, 0.7)";
      ctx.fillRect(VIEW_W - 76, 3, 10, 10);
    }

    // Medallion: glows bluer as Rose gets closer (level progress).
    const progress = Math.min(1, this.player.x / Math.max(1, this.levelWidth - VIEW_W));
    const mx = VIEW_W / 2 + 40;
    const g = ctx.createRadialGradient(mx + 5, 8, 1, mx + 5, 8, 6 + progress * 10);
    g.addColorStop(0, `rgba(143, 227, 255, ${0.2 + progress * 0.7})`);
    g.addColorStop(1, "rgba(143, 227, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(mx - 12, -8, 34, 34);
    ctx.drawImage(getSprite("itemMedaillon").canvas, mx, 3);

    // Boss bar.
    if (this.bossAlive && this.bossHp.max > 0) {
      const w = 120;
      const x = VIEW_W / 2 - w / 2;
      ctx.fillStyle = "rgba(2, 8, 23, 0.7)";
      ctx.fillRect(x - 1, VIEW_H - 15, w + 2, 8);
      ctx.fillStyle = "#7d2323";
      ctx.fillRect(x, VIEW_H - 14, w, 6);
      ctx.fillStyle = "#ff9a2a";
      ctx.fillRect(x, VIEW_H - 14, Math.round((w * this.bossHp.cur) / this.bossHp.max), 6);
      this.drawText(this.bossHp.name, VIEW_W / 2, VIEW_H - 24, "#f8fafc", 6, "center");
    }
  }

  private renderDialogue(d: Dialogue) {
    const ctx = this.ctx;
    const alpha = Math.min(1, d.timer / 20);
    ctx.globalAlpha = alpha;
    const h = 34;
    ctx.fillStyle = "rgba(2, 8, 23, 0.85)";
    ctx.fillRect(8, VIEW_H - h - 8, VIEW_W - 16, h);
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(8.5, VIEW_H - h - 7.5, VIEW_W - 17, h - 1);
    let y = VIEW_H - h - 4;
    if (d.speaker) {
      this.drawText(d.speaker, 14, y, d.color, 6);
      y += 9;
    }
    this.drawParagraph(d.text, 14, y, VIEW_W - 30, "#f8fafc", 6, 8);
    ctx.globalAlpha = 1;
  }

  private renderClearOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(2, 8, 23, 0.55)";
    ctx.fillRect(0, 40, VIEW_W, 80);
    this.drawText(this.text.stageClear, VIEW_W / 2, 50, "#8fe3ff", 12, "center");
    const sec = Math.ceil(this.timeLeft / 60);
    this.drawText(`${this.text.timeBonus} ${sec} x 10`, VIEW_W / 2, 76, "#f8fafc", 7, "center");
    this.drawText(`${this.text.score} ${String(this.score).padStart(6, "0")}`, VIEW_W / 2, 92, "#c8b48a", 7, "center");
  }

  private renderGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = "#020817";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.drawImage(lanterneSprite("deadB", this.player.armor === 1).canvas, VIEW_W / 2 - 8, 60);
    this.drawGlow(VIEW_W / 2 + 4, 78, 20, 0.15);
    this.drawParagraph(this.text.gameOver, VIEW_W / 2, 96, VIEW_W - 40, "#d8d2c2", 7, 10, "center");
    this.drawText(this.text.continueQ, VIEW_W / 2, 124, "#f8fafc", 8, "center");
    const yesColor = this.continueChoice === 0 ? "#ff9a2a" : "#b9c0ca";
    const noColor = this.continueChoice === 1 ? "#ff9a2a" : "#b9c0ca";
    this.drawText(this.text.yes, VIEW_W / 2 - 30, 142, yesColor, 8, "center");
    this.drawText(this.text.no, VIEW_W / 2 + 30, 142, noColor, 8, "center");
    this.drawText(`${this.text.score} ${String(this.score).padStart(6, "0")}`, VIEW_W / 2, 168, "#c8b48a", 6, "center");
  }

  private renderEnding() {
    const ctx = this.ctx;
    const t = this.endingT;
    drawBackground(ctx, "white", t * 0.4, this.time);
    const ground = getSprite("tileWhiteGround");
    for (let x = -(Math.floor(t * 0.4) % TILE); x < VIEW_W + TILE; x += TILE) {
      ctx.drawImage(ground.canvas, x, VIEW_H - 32);
      ctx.drawImage(ground.canvas, x, VIEW_H - 16);
    }
    this.cameraX = 0;
    const groundY = VIEW_H - 32;

    // Lanterne and Serrure walking, then Barrik dropping in, then Rose.
    const walk = `walk${Math.floor(t / 7) % 4}`;
    const lx = Math.min(120, 20 + t * 0.4);
    const walking = t < 250;
    this.drawGlow(lx + 7, groundY - 19, 26, 0.4);
    ctx.drawImage(lanterneSprite(walking ? walk : "idle", false).canvas, lx, groundY - 24);
    ctx.drawImage(getSprite("serrure").canvas, lx - 26, groundY - 26 + (walking ? Math.floor(t / 8) % 2 : 0));

    if (t > 300) {
      // Barrik falls from above and lands with a bounce.
      const fall = Math.min(1, (t - 300) / 40);
      const by = -30 + fall * (groundY - 26 + 30);
      const bounce = t > 340 && t < 352 ? -4 : 0;
      ctx.drawImage(getSprite("barrik").flipped, 190, by + bounce);
      if (t === 341) {
        this.shake(6);
        this.sfx("hit");
      }
    }
    if (t > 620) {
      const alpha = Math.min(1, (t - 620) / 60);
      ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(272, groundY - 20, 2, 272, groundY - 20, 40);
      g.addColorStop(0, "rgba(242, 167, 200, 0.6)");
      g.addColorStop(1, "rgba(242, 167, 200, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(232, groundY - 60, 80, 80);
      ctx.drawImage(getSprite("rose").flipped, 266, groundY - 22);
      ctx.globalAlpha = 1;
    }

    // Text cards.
    const lines = this.text.ending;
    const idx = Math.floor(t / 220);
    ctx.fillStyle = "rgba(2, 8, 23, 0.65)";
    ctx.fillRect(0, 16, VIEW_W, 52);
    if (idx < lines.length) {
      const local = t % 220;
      ctx.globalAlpha = local < 30 ? local / 30 : local > 190 ? (220 - local) / 30 : 1;
      this.drawParagraph(lines[idx], VIEW_W / 2, 24, VIEW_W - 40, "#f8fafc", 7, 10, "center");
      ctx.globalAlpha = 1;
    } else {
      this.drawParagraph(this.text.thanks, VIEW_W / 2, 22, VIEW_W - 40, "#f8fafc", 6, 9, "center");
      this.drawText(`${this.text.score} ${String(this.score).padStart(6, "0")}`, VIEW_W / 2, 50, "#c8b48a", 7, "center");
    }
    if (t > 340 && t < 600) {
      this.renderDialogue({ text: this.text.dialogue.barrik, speaker: "BARRIK", timer: 600 - t, color: "#a8733c" });
    } else if (t > 700 && t < 900) {
      this.renderDialogue({ text: this.text.dialogue.rose, speaker: "ROSE", timer: 900 - t, color: "#f2a7c8" });
    }
  }
}
