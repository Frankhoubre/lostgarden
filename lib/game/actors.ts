/**
 * Behaviours for enemies, bosses, NPCs, items and projectiles.
 */
import { TILE, overlaps, type Entity, type World } from "./types";

const dist = (a: number, b: number) => Math.abs(a - b);

function faceTo(e: Entity, targetX: number) {
  e.dir = targetX + 1 > e.x + e.w / 2 ? 1 : -1;
}

function edgeAhead(w: World, e: Entity): boolean {
  const px = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
  return !w.solidAt(px, e.y + e.h + 2);
}

function wallAhead(w: World, e: Entity): boolean {
  const px = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
  return w.solidAt(px, e.y + e.h - 2) || w.solidAt(px, e.y + 2);
}

/* ------------------------------------------------------------------ */
/* Spawn definitions                                                    */
/* ------------------------------------------------------------------ */

export type SpawnDef = {
  w: number;
  h: number;
  hp: number;
  points: number;
  gravity: boolean;
  harmful: boolean;
  ox: number;
  oy: number;
};

export const SPAWN: Record<string, SpawnDef> = {
  spore: { w: 10, h: 11, hp: 1, points: 100, gravity: true, harmful: true, ox: -1, oy: -1 },
  meduse: { w: 10, h: 12, hp: 1, points: 150, gravity: false, harmful: true, ox: -1, oy: -1 },
  penitent: { w: 10, h: 24, hp: 3, points: 200, gravity: true, harmful: true, ox: -1, oy: 0 },
  rouage: { w: 14, h: 11, hp: 2, points: 200, gravity: true, harmful: true, ox: -1, oy: -1 },
  loup: { w: 18, h: 11, hp: 2, points: 250, gravity: true, harmful: true, ox: -1, oy: -1 },
  reptile: { w: 10, h: 24, hp: 2, points: 300, gravity: true, harmful: true, ox: -2, oy: 0 },
  colosse: { w: 30, h: 22, hp: 10, points: 800, gravity: true, harmful: true, ox: -1, oy: -2 },
  golem: { w: 12, h: 24, hp: 3, points: 300, gravity: true, harmful: true, ox: -1, oy: 0 },
  souris: { w: 8, h: 8, hp: 1, points: 500, gravity: true, harmful: false, ox: 0, oy: 0 },
  chest: { w: 14, h: 12, hp: 1, points: 100, gravity: true, harmful: false, ox: -1, oy: -1 },
  item: { w: 10, h: 10, hp: 1, points: 0, gravity: true, harmful: false, ox: 0, oy: 0 },
  npc: { w: 16, h: 26, hp: 1, points: 0, gravity: true, harmful: false, ox: 0, oy: 0 },
  exit: { w: 16, h: 32, hp: 1, points: 0, gravity: false, harmful: false, ox: 0, oy: 0 },
  boss: { w: 40, h: 32, hp: 1, points: 0, gravity: true, harmful: true, ox: 0, oy: 0 },
  shot: { w: 8, h: 3, hp: 1, points: 0, gravity: false, harmful: false, ox: 0, oy: 0 },
  enemyShot: { w: 4, h: 4, hp: 1, points: 0, gravity: false, harmful: true, ox: 0, oy: 0 },
};

export const BOSS_STATS: Record<string, { w: number; h: number; hp: number; points: number }> = {
  machine: { w: 44, h: 30, hp: 28, points: 5000 },
  decrocheur: { w: 16, h: 40, hp: 30, points: 7000 },
  sombre: { w: 12, h: 26, hp: 36, points: 9000 },
};

/* ------------------------------------------------------------------ */
/* Update                                                               */
/* ------------------------------------------------------------------ */

export function updateEntity(e: Entity, w: World) {
  e.age += 1;
  if (e.flash > 0) e.flash -= 1;
  const p = w.player;
  const pcx = p.x + p.w / 2;
  const ecx = e.x + e.w / 2;

  switch (e.kind) {
    case "spore": {
      // Rises out of the ground, then hops toward the player.
      if (e.state === "rise") {
        e.timer += 1;
        e.alpha = Math.min(1, e.timer / 20);
        if (e.timer > 20) e.state = "hop";
        break;
      }
      if (e.onGround) {
        e.vx = 0;
        e.timer += 1;
        if (e.timer > 40) {
          e.timer = 0;
          faceTo(e, pcx);
          e.vy = -3.6;
          e.vx = e.dir * 1.1;
          e.onGround = false;
        }
      }
      w.moveEntity(e);
      break;
    }
    case "meduse": {
      // Floats on a sine wave and drifts toward the player.
      const baseY = e.data.baseY as number;
      e.timer += 1;
      e.y = baseY + Math.sin(e.timer / 25) * 10;
      if (e.state === "rise") {
        e.data.baseY = baseY - 0.5;
        if (baseY < (e.data.targetY as number)) e.state = "float";
      }
      const dx = pcx - ecx;
      e.vx += Math.sign(dx) * 0.01;
      e.vx = Math.max(-0.5, Math.min(0.5, e.vx));
      e.x += e.vx;
      e.dir = e.vx >= 0 ? 1 : -1;
      break;
    }
    case "penitent": {
      // Walks slowly, turns at walls and edges. Cannot be reasoned with.
      if (e.onGround) {
        if (wallAhead(w, e) || edgeAhead(w, e)) e.dir = e.dir > 0 ? -1 : 1;
        e.vx = e.dir * 0.35;
      }
      w.moveEntity(e);
      break;
    }
    case "rouage": {
      // Crawls fast, jumps at the player when close.
      if (e.onGround) {
        faceTo(e, pcx);
        e.vx = e.dir * 0.9;
        if (wallAhead(w, e)) e.vy = -3.5;
        if (dist(pcx, ecx) < 40 && e.timer <= 0) {
          e.vy = -3.8;
          e.vx = e.dir * 1.8;
          e.timer = 60;
        }
      }
      if (e.timer > 0) e.timer -= 1;
      w.moveEntity(e);
      break;
    }
    case "loup": {
      // Runs in a straight line, bounces off walls, leaps over gaps.
      if (e.onGround) {
        if (wallAhead(w, e)) e.dir = e.dir > 0 ? -1 : 1;
        if (edgeAhead(w, e)) e.vy = -4.2;
        e.vx = e.dir * 1.7;
      }
      w.moveEntity(e);
      break;
    }
    case "reptile": {
      // Pale lizard: sprints, lunges when close.
      if (e.state === "lunge") {
        if (e.onGround && e.timer > 5) {
          e.state = "run";
          e.timer = 0;
        }
        e.timer += 1;
      } else if (e.onGround) {
        faceTo(e, pcx);
        e.vx = e.dir * 1.2;
        if (edgeAhead(w, e) && !wallAhead(w, e)) e.vx = 0;
        if (wallAhead(w, e)) e.vy = -4;
        e.timer += 1;
        if (dist(pcx, ecx) < 56 && e.timer > 50) {
          e.state = "lunge";
          e.timer = 0;
          e.vy = -4.5;
          e.vx = e.dir * 2.2;
        }
      }
      w.moveEntity(e);
      break;
    }
    case "colosse": {
      // Armoured beast: slow walk, then a charge.
      if (e.state === "charge") {
        e.timer -= 1;
        e.vx = e.dir * 2.4;
        if (wallAhead(w, e) || e.timer <= 0) {
          e.state = "walk";
          e.timer = 90;
          w.shake(6);
        }
      } else {
        e.timer -= 1;
        if (e.onGround) {
          faceTo(e, pcx);
          e.vx = e.dir * 0.4;
          if (edgeAhead(w, e)) e.vx = 0;
        }
        if (e.timer <= 0 && dist(pcx, ecx) < 120) {
          e.state = "charge";
          e.timer = 50;
          w.sfx("boss");
        }
      }
      w.moveEntity(e);
      break;
    }
    case "golem": {
      // Empty armour: dormant until the player comes near.
      if (e.state === "dormant") {
        e.vx = 0;
        w.moveEntity(e);
        if (dist(pcx, ecx) < 72) {
          e.state = "wake";
          e.timer = 30;
          w.particles(ecx, e.y + 4, 6, "#ff9a2a", 0.6);
        }
        break;
      }
      if (e.state === "wake") {
        e.vx = 0;
        w.moveEntity(e);
        e.timer -= 1;
        if (e.timer <= 0) e.state = "walk";
        break;
      }
      if (e.onGround) {
        faceTo(e, pcx);
        e.vx = e.dir * 0.6;
        if (wallAhead(w, e)) e.vy = -3.8;
        if (edgeAhead(w, e)) e.vx = 0;
      }
      w.moveEntity(e);
      break;
    }
    case "souris": {
      // Bonus critter: runs away, squeaks.
      if (e.onGround) {
        e.dir = pcx > ecx ? -1 : 1;
        e.vx = e.dir * (dist(pcx, ecx) < 60 ? 1.3 : 0);
        if (wallAhead(w, e) || edgeAhead(w, e)) e.vx = 0;
      }
      w.moveEntity(e);
      break;
    }
    case "chest":
    case "npc": {
      w.moveEntity(e);
      break;
    }
    case "item": {
      w.moveEntity(e);
      if (e.onGround) e.vx *= 0.8;
      if (e.age > 600) e.dead = true;
      if (e.age > 480 && e.age % 8 < 4) e.alpha = 0.3;
      else e.alpha = 1;
      break;
    }
    case "exit":
      break;
    case "shot":
      updateShot(e, w);
      break;
    case "enemyShot":
      updateEnemyShot(e, w);
      break;
    case "boss":
      updateBoss(e, w);
      break;
    default:
      break;
  }
}

function updateShot(e: Entity, w: World) {
  const sub = e.sub;
  if (sub === "cloche") {
    e.vy += 0.22;
    e.x += e.vx;
    e.y += e.vy;
    // Bounce on solid ground once or twice.
    if (w.solidAt(e.x + e.w / 2, e.y + e.h)) {
      const bounces = (e.data.bounces as number) ?? 0;
      if (bounces >= 2) {
        e.dead = true;
        w.particles(e.x + 4, e.y + 4, 4, "#7fd8ff", 1);
      } else {
        e.data.bounces = bounces + 1;
        e.y = Math.floor((e.y + e.h) / TILE) * TILE - e.h - 0.1;
        e.vy = -3.2;
        w.sfx("bell");
      }
    }
  } else if (sub === "cle") {
    // Boomerang key: goes out, comes back to the player.
    e.timer += 1;
    if (e.timer > 22) e.vx -= e.dir * 0.35;
    e.x += e.vx;
    e.y += e.vy;
    if (e.timer > 22 && Math.sign(e.vx) !== e.dir) {
      const p = w.player;
      if (overlaps(e, { x: p.x - 4, y: p.y - 4, w: p.w + 8, h: p.h + 8 })) e.dead = true;
    }
    if (e.timer > 90) e.dead = true;
  } else {
    e.x += e.vx;
    e.y += e.vy;
    if (w.solidAt(e.x + (e.vx > 0 ? e.w : 0), e.y + e.h / 2)) {
      e.dead = true;
      w.particles(e.x + e.w / 2, e.y + e.h / 2, 3, "#fff1a8", 0.8);
    }
  }
  if (e.x < w.cameraX - 40 || e.x > w.cameraX + 360 || e.y > 220 || e.y < -40) e.dead = true;
}

function updateEnemyShot(e: Entity, w: World) {
  if (e.sub === "scythe") {
    // Boomerang scythe from the Decrocheur.
    e.timer += 1;
    if (e.timer > 40) e.vx -= e.dir * 0.2;
    e.x += e.vx;
    e.y += Math.sin(e.timer / 6) * 0.6;
    if (e.timer > 130) e.dead = true;
    return;
  }
  if (e.sub === "spark") {
    e.vy += 0.12;
  }
  e.x += e.vx;
  e.y += e.vy;
  if (e.sub === "shard" && w.solidAt(e.x + e.w / 2, e.y + e.h + 1)) {
    // Shards run along the ground.
    e.y = Math.floor((e.y + e.h) / TILE) * TILE - e.h;
    e.vy = 0;
  }
  if (w.solidAt(e.x + e.w / 2, e.y + e.h / 2)) e.dead = true;
  if (e.age > 240 || e.x < w.cameraX - 40 || e.x > w.cameraX + 360 || e.y > 220) e.dead = true;
}

/* ------------------------------------------------------------------ */
/* Bosses                                                               */
/* ------------------------------------------------------------------ */

function updateBoss(e: Entity, w: World) {
  const p = w.player;
  const pcx = p.x + p.w / 2;
  const ecx = e.x + e.w / 2;

  if (e.state === "intro") {
    e.timer += 1;
    e.alpha = Math.min(1, e.timer / 40);
    if (e.timer === 1) w.sayBoss(e.sub);
    if (e.timer > 70) {
      e.state = e.sub === "decrocheur" ? "idle" : "walk";
      e.timer = 0;
      e.alpha = 1;
    }
    return;
  }
  if (e.state === "dying") {
    e.timer += 1;
    if (e.timer % 6 === 0) {
      w.particles(e.x + Math.random() * e.w, e.y + Math.random() * e.h, 5, "#ffd27a", 1.2);
      w.sfx("enemy");
    }
    e.alpha = 1 - e.timer / 90;
    if (e.timer > 90) e.dead = true;
    return;
  }

  switch (e.sub) {
    case "machine": {
      // Walks toward the player, stomps, and fires sparks from the drill.
      e.timer += 1;
      if (e.state === "walk") {
        faceTo(e, pcx);
        if (e.onGround) e.vx = e.dir * 0.55;
        if (e.timer > 100) {
          e.timer = 0;
          e.state = dist(pcx, ecx) < 70 ? "stomp" : "drill";
          if (e.state === "stomp") {
            e.vy = -5.5;
            e.vx = e.dir * 1.2;
          }
        }
      } else if (e.state === "stomp") {
        if (e.onGround && e.timer > 10) {
          w.shake(10);
          w.sfx("boss");
          const gy = e.y + e.h - 4;
          w.enemyShot(e.x - 4, gy, -2.2, 0, "shard");
          w.enemyShot(e.x + e.w, gy, 2.2, 0, "shard");
          e.state = "walk";
          e.timer = 30;
          e.vx = 0;
        }
      } else if (e.state === "drill") {
        e.vx = 0;
        if (e.timer === 15 || e.timer === 30 || e.timer === 45) {
          const dx = pcx - ecx;
          const dy = p.y - (e.y + e.h);
          const len = Math.max(1, Math.hypot(dx, dy));
          w.enemyShot(ecx - 2, e.y + e.h - 6, (dx / len) * 2.4, (dy / len) * 2.4 - 0.8, "spark");
          w.sfx("throw");
        }
        if (e.timer > 70) {
          e.state = "walk";
          e.timer = 0;
        }
      }
      w.moveEntity(e);
      break;
    }
    case "decrocheur": {
      // Appears near the player, swings its scythe, vanishes, throws the blade.
      e.timer += 1;
      if (e.state === "idle") {
        e.alpha = 1;
        faceTo(e, pcx);
        if (e.timer > 45) {
          e.timer = 0;
          e.state = dist(pcx, ecx) < 44 ? "slash" : Math.random() < 0.5 ? "throw" : "vanish";
        }
      } else if (e.state === "slash") {
        if (e.timer === 8) w.sfx("hit");
        if (e.timer >= 8 && e.timer <= 24) {
          const hit = {
            x: e.dir > 0 ? e.x + e.w : e.x - 30,
            y: e.y + 6,
            w: 30,
            h: 30,
          };
          if (overlaps(hit, p)) w.hurtPlayer();
        }
        if (e.timer > 40) {
          e.timer = 0;
          e.state = "vanish";
        }
      } else if (e.state === "throw") {
        if (e.timer === 10) {
          w.enemyShot(ecx + e.dir * 10, e.y + 10, e.dir * 2.4, 0, "scythe").dir = e.dir;
          w.sfx("throw");
        }
        if (e.timer > 50) {
          e.timer = 0;
          e.state = "vanish";
        }
      } else if (e.state === "vanish") {
        e.alpha = Math.max(0, 1 - e.timer / 30);
        if (e.timer > 40) {
          // Reappear 70px from the player, on the arena floor.
          const side = Math.random() < 0.5 ? -1 : 1;
          const arenaL = e.data.arenaL as number;
          const arenaR = e.data.arenaR as number;
          let nx = pcx + side * 70 - e.w / 2;
          nx = Math.max(arenaL + 8, Math.min(arenaR - e.w - 8, nx));
          e.x = nx;
          e.state = "appear";
          e.timer = 0;
          w.particles(nx + e.w / 2, e.y + 20, 8, "#e8e4d8", 1);
        }
      } else if (e.state === "appear") {
        e.alpha = Math.min(1, e.timer / 20);
        if (e.timer > 20) {
          e.state = "idle";
          e.timer = 0;
        }
      }
      e.vx = 0;
      w.moveEntity(e);
      break;
    }
    case "sombre": {
      // Possessed knight: runs, leaps over the player, slashes, summons armours.
      e.timer += 1;
      const summonT = (e.data.summonT as number) ?? 0;
      e.data.summonT = summonT + 1;
      if (e.state === "walk") {
        faceTo(e, pcx);
        if (e.onGround) e.vx = e.dir * 1.3;
        if (wallAhead(w, e) && e.onGround) e.vy = -5;
        if (dist(pcx, ecx) < 30 && e.onGround && e.timer > 30) {
          e.state = "slash";
          e.timer = 0;
          e.vx = 0;
        } else if (dist(pcx, ecx) < 60 && e.onGround && Math.random() < 0.02) {
          e.vy = -5.8;
          e.vx = e.dir * 2;
          w.sfx("jump");
        }
        if (e.data.summonT > 420) {
          const golems = w.entities.filter((o) => o.kind === "golem" && !o.dead).length;
          if (golems < 2) {
            e.data.summonT = 0;
            e.state = "summon";
            e.timer = 0;
            e.vx = 0;
          }
        }
      } else if (e.state === "slash") {
        if (e.timer === 6) w.sfx("hit");
        if (e.timer >= 6 && e.timer <= 18) {
          const hit = { x: e.dir > 0 ? e.x + e.w : e.x - 22, y: e.y, w: 22, h: e.h };
          if (overlaps(hit, p)) w.hurtPlayer();
        }
        if (e.timer > 34) {
          e.state = "walk";
          e.timer = 0;
        }
      } else if (e.state === "summon") {
        if (e.timer === 20) {
          const arenaL = e.data.arenaL as number;
          const arenaR = e.data.arenaR as number;
          const gx = Math.random() < 0.5 ? arenaL + 16 : arenaR - 28;
          const g = w.spawn("golem", gx, e.y, "");
          g.state = "wake";
          g.timer = 30;
          w.particles(gx + 6, e.y + 10, 8, "#ff9a2a", 1);
          w.sfx("boss");
        }
        if (e.timer > 40) {
          e.state = "walk";
          e.timer = 0;
        }
      }
      w.moveEntity(e);
      break;
    }
    default:
      break;
  }
}

/* ------------------------------------------------------------------ */
/* Drawing                                                              */
/* ------------------------------------------------------------------ */

export function drawEntity(e: Entity, w: World) {
  const flip = e.dir < 0;
  const alpha = e.flash > 0 && e.flash % 4 < 2 ? 0.35 : e.alpha;
  const anim2 = Math.floor(e.age / 10) % 2;
  const sx = e.x + e.ox;
  const sy = e.y + e.oy;
  switch (e.kind) {
    case "spore":
      w.drawSprite(w.sprite(e.onGround ? "spore0" : "spore1"), sx, sy, flip, alpha);
      break;
    case "meduse":
      w.drawSprite(w.sprite(`meduse${Math.floor(e.age / 14) % 2}`), sx, sy, flip, alpha * 0.9);
      break;
    case "penitent":
      w.drawSprite(w.sprite("penitent"), sx, sy + (Math.floor(e.age / 16) % 2), flip, alpha);
      break;
    case "rouage":
      w.drawSprite(w.sprite(`rouage${Math.floor(e.age / 6) % 2}`), sx, sy, flip, alpha);
      break;
    case "loup":
      w.drawSprite(w.sprite(`loup${Math.floor(e.age / 6) % 2}`), sx, sy, flip, alpha);
      break;
    case "reptile":
      w.drawSprite(w.sprite(`reptile${Math.floor(e.age / 7) % 2}`), sx, sy, flip, alpha);
      break;
    case "colosse":
      w.drawSprite(w.sprite(`colosse${e.state === "charge" ? Math.floor(e.age / 4) % 2 : anim2}`), sx, sy, flip, alpha);
      break;
    case "golem": {
      const frame = e.state === "walk" ? Math.floor(e.age / 12) % 2 : 0;
      const a = e.state === "dormant" ? alpha * 0.75 : alpha;
      w.drawSprite(w.sprite(`golem${frame}`), sx, sy, flip, a);
      break;
    }
    case "souris":
      w.drawSprite(w.sprite("souris"), sx, sy + (e.vx !== 0 ? anim2 : 0), flip, alpha);
      break;
    case "chest":
      w.drawSprite(w.sprite(e.state === "open" ? "chestOpen" : "chestClosed"), sx, sy, false, alpha);
      break;
    case "item": {
      const name = {
        lueur: "itemLueur",
        cle: "itemCle",
        dague: "itemDague",
        cloche: "itemCloche",
        cape: "itemCape",
        medaillon: "itemMedaillon",
        lys: "itemLys",
      }[e.sub] ?? "itemLys";
      w.drawSprite(w.sprite(name), sx, sy + Math.round(Math.sin(e.age / 8)), false, alpha);
      break;
    }
    case "npc": {
      if (e.sub === "serrure") {
        w.drawSprite(w.sprite("serrure"), sx, sy + (Math.floor(e.age / 30) % 2), flip, alpha);
      } else if (e.sub === "bourdon") {
        w.drawSprite(w.sprite("bourdon"), sx - 12, sy - 14 + (Math.floor(e.age / 40) % 2), flip, alpha);
      } else if (e.sub === "barrik") {
        w.drawSprite(w.sprite("barrik"), sx - 2, sy, flip, alpha);
      } else if (e.sub === "rose") {
        w.drawSprite(w.sprite("rose"), sx + 1, sy + 4, flip, alpha);
      }
      break;
    }
    case "shot": {
      if (e.sub === "cle") {
        w.drawSprite(w.sprite("projCle"), sx, sy, Math.floor(e.age / 4) % 2 === 0, alpha);
      } else if (e.sub === "cloche") {
        w.drawSprite(w.sprite("projCloche"), sx, sy, false, alpha);
      } else if (e.sub === "dague") {
        w.drawSprite(w.sprite("projDague"), sx, sy, flip, alpha);
      } else {
        w.drawSprite(w.sprite("projLueur"), sx, sy, flip, alpha);
      }
      break;
    }
    case "enemyShot": {
      if (e.sub === "scythe") {
        w.drawSprite(w.sprite("scythe"), sx - 8, sy - 8, Math.floor(e.age / 5) % 2 === 0, alpha);
      } else if (e.sub === "shard") {
        w.drawSprite(w.sprite("projShard"), sx, sy, false, alpha);
      } else {
        w.drawSprite(w.sprite("projSpark"), sx, sy, false, alpha);
      }
      break;
    }
    case "boss":
      drawBoss(e, w, alpha);
      break;
    default:
      break;
  }
}

function drawBoss(e: Entity, w: World, alpha: number) {
  const flip = e.dir < 0;
  switch (e.sub) {
    case "machine": {
      const bob = e.state === "walk" ? Math.floor(e.age / 8) % 2 : 0;
      w.drawSprite(w.sprite("machine"), e.x - 2, e.y - 4 + bob, flip, alpha);
      break;
    }
    case "decrocheur": {
      w.drawSprite(w.sprite("decrocheur"), e.x - 8, e.y - 8, flip, alpha);
      if (e.state === "slash" && e.timer >= 4 && e.timer <= 26) {
        const sx = e.dir > 0 ? e.x + e.w - 2 : e.x - 22;
        w.drawSprite(w.sprite("scythe"), sx, e.y + 4 + (e.timer - 4), e.dir < 0, alpha);
      } else if (e.state !== "throw") {
        const sx = e.dir > 0 ? e.x + e.w - 6 : e.x - 18;
        w.drawSprite(w.sprite("scythe"), sx, e.y + 2, e.dir < 0, alpha);
      }
      break;
    }
    case "sombre": {
      const frame = e.state === "walk" && Math.abs(e.vx) > 0.2 ? Math.floor(e.age / 7) % 2 : 0;
      w.drawSprite(w.sprite(`sombre${frame}`), e.x - 2, e.y, flip, alpha);
      const swordX = e.dir > 0 ? e.x + e.w : e.x - 4;
      if (e.state === "slash" && e.timer >= 6 && e.timer <= 18) {
        w.drawSprite(w.sprite("greatsword"), swordX + e.dir * 8, e.y + 4, flip, alpha);
      } else {
        w.drawSprite(w.sprite("greatsword"), e.dir > 0 ? e.x - 4 : e.x + e.w, e.y - 4, flip, alpha);
      }
      break;
    }
    default:
      break;
  }
}
