import type { Sprite } from "./pixel";

export const TILE = 16;
export const VIEW_W = 320;
export const VIEW_H = 192;

export type WeaponKind = "lueur" | "cle" | "dague" | "cloche";

export type EntityKind =
  | "spore"
  | "meduse"
  | "penitent"
  | "rouage"
  | "loup"
  | "reptile"
  | "colosse"
  | "golem"
  | "souris"
  | "chest"
  | "item"
  | "npc"
  | "exit"
  | "boss"
  | "shot"
  | "enemyShot";

export type Entity = {
  id: number;
  kind: EntityKind;
  /** hitbox */
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  hp: number;
  maxHp: number;
  onGround: boolean;
  gravity: boolean;
  /** collides with tiles */
  solid: boolean;
  dead: boolean;
  /** frames since spawn */
  age: number;
  timer: number;
  state: string;
  flash: number;
  points: number;
  /** contact damage to player */
  harmful: boolean;
  /** sprite drawing offset relative to hitbox */
  ox: number;
  oy: number;
  /** arbitrary per-kind data */
  data: Record<string, number | string | boolean>;
  /** name for NPC / item / boss subtypes */
  sub: string;
  alpha: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
};

export type PlayerState = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  onGround: boolean;
  crouch: boolean;
  jumping: boolean;
  armor: 2 | 1;
  invuln: number;
  throwT: number;
  cooldown: number;
  weapon: WeaponKind;
  dead: boolean;
  deadT: number;
  walkT: number;
  frame: string;
};

export type Rect = { x: number; y: number; w: number; h: number };

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Interface the actor behaviours use to talk to the game world. */
export interface World {
  player: PlayerState;
  entities: Entity[];
  time: number;
  levelWidth: number;
  cameraX: number;
  solidAt(px: number, py: number): boolean;
  groundBelow(px: number, py: number): number | null;
  moveEntity(e: Entity): void;
  spawn(kind: EntityKind, x: number, y: number, sub?: string): Entity;
  enemyShot(x: number, y: number, vx: number, vy: number, sub: string): Entity;
  particles(x: number, y: number, count: number, color: string, speed?: number): void;
  sfx(name: string): void;
  hurtPlayer(): void;
  shake(frames: number): void;
  drawSprite(s: Sprite, x: number, y: number, flip: boolean, alpha?: number): void;
  sprite(name: string): Sprite;
  sayBoss(kind: string): void;
}
