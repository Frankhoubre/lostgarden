/**
 * The map of episode 1, as one long stretch of the Below: eight zones on a
 * 332 by 44 tile grid (32px tiles), from the roots where Lanterne wakes to
 * the arena of the Machine. Built from terrain profiles, not tile art: ground
 * heights, cliffs, ledges, tunnels, and the creatures that live there.
 */

export const TILE = 32;
export const MAP_W = 332;
export const MAP_H = 44;

/** Grid values. */
export const EMPTY = 0;
export const SOLID = 1;
export const ONEWAY = 2;

export type SpawnKind =
  | "beetle"
  | "wolf"
  | "dormant"
  | "moth"
  | "eye"
  | "root"
  | "jelly"
  | "lily"
  | "light"
  | "watcher"
  | "stone"
  | "lantern"
  | "cocoons"
  | "machineProp";

export type Spawn = { kind: SpawnKind; x: number; y: number; dir: 1 | -1; hint?: string; range?: number };

export type Zone = {
  id: string;
  /** Tile range. */
  x0: number;
  x1: number;
  /** Extra darkness for the deep paths (0 to 1). */
  dark: number;
  /** Rock ceiling: draw a cave lid instead of the forest sky. */
  cave: boolean;
};

export type World = {
  grid: Uint8Array;
  spawns: Spawn[];
  zones: Zone[];
  start: { x: number; y: number };
  gong: { x: number; y: number };
  tavern: { x: number; y: number };
  arena: { l: number; r: number; y: number };
  gate: { x: number; y: number };
  /** The chase: where the colossal machine wakes, where the run ends, its floor. */
  chase: { x: number; end: number; y: number };
  hints: { x: number; y: number; id: string }[];
};

export function tileAt(grid: Uint8Array, tx: number, ty: number): number {
  if (tx < 0 || tx >= MAP_W) return SOLID;
  if (ty < 0) return EMPTY;
  if (ty >= MAP_H) return SOLID;
  return grid[ty * MAP_W + tx];
}

export function buildWorld(): World {
  const grid = new Uint8Array(MAP_W * MAP_H);
  const spawns: Spawn[] = [];
  const hints: World["hints"] = [];
  const set = (tx: number, ty: number, v: number) => {
    if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) grid[ty * MAP_W + tx] = v;
  };
  /** Solid ground of height h tiles from x0 to x1 (exclusive). */
  const ground = (x0: number, x1: number, h: number) => {
    for (let x = x0; x < x1; x += 1) for (let y = MAP_H - h; y < MAP_H; y += 1) set(x, y, SOLID);
  };
  /** Floor row (pixel y of the walkable line) for ground of height h. */
  const floorY = (h: number) => (MAP_H - h) * TILE;
  /** A one-way ledge, `up` tiles above ground height h, `w` tiles wide. */
  const ledge = (x: number, h: number, up: number, w: number) => {
    const ty = MAP_H - h - up;
    for (let k = 0; k < w; k += 1) if (grid[ty * MAP_W + x + k] === EMPTY) set(x + k, ty, ONEWAY);
    return ty * TILE;
  };
  /** A solid rock block. */
  const block = (x: number, ty: number, w: number, hh: number) => {
    for (let k = 0; k < w; k += 1) for (let j = 0; j < hh; j += 1) set(x + k, ty + j, SOLID);
  };
  /** Rock everywhere above `gap` tiles over ground of height h, from x0 to x1: a tunnel or a chamber. */
  const lid = (x0: number, x1: number, h: number, gap: number) => {
    const bottom = MAP_H - h - gap;
    for (let x = x0; x < x1; x += 1) for (let y = 0; y < bottom; y += 1) set(x, y, SOLID);
  };
  const at = (kind: SpawnKind, tx: number, y: number, dir: 1 | -1 = -1, extra: Partial<Spawn> = {}) => {
    spawns.push({ kind, x: tx * TILE + TILE / 2, y, dir, ...extra });
  };
  const hint = (tx: number, y: number, id: string) => {
    hints.push({ x: tx * TILE + TILE / 2, y, id });
    at("stone", tx, y);
  };

  // Outer walls.
  block(0, 0, 1, MAP_H);
  block(MAP_W - 1, 0, 1, MAP_H);

  /* ---- Z1 L'Eveil (0-38): the clearing where the armour wakes. Tutorial. ---- */
  ground(0, 36, 6);
  const f6 = floorY(6);
  hint(7, f6, "move");
  hint(14, f6, "jump");
  const l1 = ledge(18, 6, 3, 3);
  at("lily", 19, l1);
  hint(23, f6, "throw");
  at("beetle", 27, f6, -1);
  at("watcher", 31, f6, -1);
  hint(33, f6, "crouch");
  ground(36, 38, 8);

  /* ---- Z2 Les Corniches (38-100): climbing through the canopy. ---- */
  ground(38, 48, 8);
  const f8 = floorY(8);
  at("lily", 44, ledge(43, 8, 3, 3));
  at("watcher", 46, f8, 1);
  // A pit with polite jellyfish to ride across, or beetles to fight at the bottom.
  ground(48, 56, 3);
  const f3 = floorY(3);
  at("beetle", 50, f3, 1);
  at("beetle", 53, f3, -1);
  at("jelly", 50, f8 - 20, 1, { range: 60 });
  at("jelly", 53, f8 - 60, -1, { range: 50 });
  // Out of the pit: two ledges, then the cliff top.
  ledge(53, 3, 2, 2);
  ledge(54, 3, 4, 2);
  ground(56, 66, 9);
  const f9 = floorY(9);
  hint(57, f9, "roll");
  at("beetle", 60, f9, -1);
  at("wolf", 62, f9, -1);
  at("wolf", 64, f9, -1);
  ledge(64, 9, 2, 2);
  ground(66, 74, 12);
  const f12 = floorY(12);
  at("light", 70, f12);
  ground(74, 92, 14);
  const f14 = floorY(14);
  at("wolf", 81, f14, -1);
  at("wolf", 84, f14, 1);
  at("lily", 80, ledge(79, 14, 3, 3));
  at("beetle", 88, f14, -1);
  at("eye", 86, f14, -1);
  ledge(90, 14, 2, 2);
  ground(92, 106, 18);
  const f18 = floorY(18);
  hint(95, f18, "charge");
  at("lily", 101, ledge(100, 18, 3, 3));

  /* ---- Z3 La Descente des Racines (106-150): down into the roots, a crouch tunnel, the Sleepers. ---- */
  ground(106, 150, 4);
  const f4 = floorY(4);
  // The drop from the ledges: fourteen tiles, no harm, a long fall into the dark.
  lid(109, 118, 4, 2); // crouch tunnel
  hint(107, f4, "tunnel");
  at("light", 116, f4);
  lid(118, 150, 4, 8); // the chamber of the Sleepers
  at("cocoons", 122, (MAP_H - 4 - 8) * TILE);
  at("cocoons", 137, (MAP_H - 4 - 8) * TILE);
  hint(120, f4, "sleeper");
  at("root", 124, f4);
  at("dormant", 128, f4, -1);
  at("moth", 131, f4 - 110, -1);
  at("moth", 134, f4 - 70, 1);
  at("root", 136, f4);
  at("moth", 139, f4 - 130, -1);
  at("dormant", 142, f4, 1);
  at("lily", 145, ledge(144, 4, 3, 2));
  at("root", 147, f4);

  /* ---- Z4 Le Gong des Pelerins (150-172): the hush of the seal. ---- */
  ground(150, 152, 5);
  ground(152, 172, 6);
  const gong = { x: 161 * TILE, y: f6 };

  /* ---- Z5 Le Chemin Profond (172-232): the pack hunts whatever shows a light. ---- */
  ground(172, 180, 6);
  hint(175, f6, "hide");
  at("lantern", 178, f6);
  ground(180, 192, 8);
  at("wolf", 188, f8, -1, { range: 300 });
  at("wolf", 190, f8, -1, { range: 300 });
  at("wolf", 191, f8, 1, { range: 300 });
  ground(192, 200, 5);
  const f5 = floorY(5);
  at("root", 195, f5);
  at("root", 198, f5);
  ground(200, 214, 8);
  at("beetle", 203, f8, 1);
  at("wolf", 207, f8, -1, { range: 300 });
  at("wolf", 209, f8, -1, { range: 300 });
  at("beetle", 211, f8, -1);
  at("lantern", 212, f8);
  ledge(212, 8, 2, 2);
  ground(214, 222, 11);
  const f11 = floorY(11);
  at("lily", 216, ledge(215, 11, 3, 2));
  at("wolf", 217, f11, -1, { range: 300 });
  at("wolf", 219, f11, -1, { range: 300 });
  at("wolf", 221, f11, 1, { range: 300 });
  ground(222, 232, 7);
  const f7 = floorY(7);

  /* ---- Z6 La Taverne de Serrure (232-250) ---- */
  ground(232, 250, 7);
  const tavern = { x: 241 * TILE, y: f7 };
  at("light", 245, f7);

  /* ---- Z7 Le Cimetiere des Machines (250-300): the sleeping ones, and the one that wakes. Run. ---- */
  ground(250, 253, 9);
  ground(253, 256, 11);
  ground(256, 300, 13);
  const f13 = floorY(13);
  hint(254, floorY(11), "sleeper2");
  at("machineProp", 258, f13);
  at("beetle", 262, f13, -1);
  // The run: low walls to hop, gaps to clear, roots that break through, moths in the way.
  block(266, MAP_H - 14, 1, 1);
  ground(270, 272, 10);
  at("root", 275, f13);
  block(278, MAP_H - 15, 1, 2);
  at("moth", 281, f13 - 100, -1);
  ground(283, 286, 10);
  at("lily", 288, ledge(287, 13, 3, 2));
  at("root", 290, f13);
  block(293, MAP_H - 14, 1, 1);
  at("moth", 295, f13 - 120, 1);
  ground(296, 298, 10);
  const chase = { x: 260 * TILE, end: 300 * TILE, y: f13 };

  /* ---- Z8 L'Arene et la porte (300-332): four tiles down, where the colossus cannot follow. ---- */
  ground(300, 332, 9);
  const f9b = floorY(9);
  ledge(304, 9, 3, 2);
  ledge(313, 9, 3, 2);
  const arena = { l: 302 * TILE, r: 317 * TILE, y: f9b };
  const gate = { x: 326 * TILE, y: f9b };

  const zones: Zone[] = [
    { id: "eveil", x0: 0, x1: 38, dark: 0, cave: false },
    { id: "corniches", x0: 38, x1: 106, dark: 0, cave: false },
    { id: "racines", x0: 106, x1: 150, dark: 0.25, cave: true },
    { id: "gong", x0: 150, x1: 172, dark: 0, cave: false },
    { id: "chemin", x0: 172, x1: 232, dark: 0.35, cave: false },
    { id: "taverne", x0: 232, x1: 250, dark: 0, cave: false },
    { id: "cimetiere", x0: 250, x1: 300, dark: 0.15, cave: false },
    { id: "arene", x0: 300, x1: 332, dark: 0.1, cave: false },
  ];

  return { grid, spawns, zones, start: { x: 4 * TILE, y: f6 }, gong, tavern, arena, gate, chase, hints };
}

/** Walkable tops: cells with something under them and air where they stand. */
function surfaces(grid: Uint8Array): Set<number> {
  const out = new Set<number>();
  for (let ty = 1; ty < MAP_H; ty += 1) {
    for (let tx = 0; tx < MAP_W; tx += 1) {
      if (tileAt(grid, tx, ty) !== EMPTY) continue;
      const below = tileAt(grid, tx, ty + 1);
      if (below === EMPTY) continue;
      // Room to stand: one more empty tile above (crouch height), else it is a crawl space.
      out.add(ty * MAP_W + tx);
    }
  }
  return out;
}

/**
 * Checks the map for things a player could not do: spots nothing can reach with a
 * three-tile jump, spawns floating in the air or buried in rock, ledges too high.
 */
export function worldLint(w: World): string[] {
  const problems: string[] = [];
  const grid = w.grid;
  const surf = surfaces(grid);
  const key = (tx: number, ty: number) => ty * MAP_W + tx;
  // Reachability from the start, with a jump of 3 tiles up and 4 across, and falls of any depth.
  const start = key(Math.floor(w.start.x / TILE), Math.floor(w.start.y / TILE) - 1);
  const seen = new Set<number>();
  const queue: number[] = [];
  if (surf.has(start)) {
    seen.add(start);
    queue.push(start);
  } else {
    problems.push("start is not on a walkable surface");
  }
  while (queue.length) {
    const k = queue.shift() as number;
    const tx = k % MAP_W;
    const ty = (k - tx) / MAP_W;
    for (let dx = -4; dx <= 4; dx += 1) {
      for (let dy = -3; dy <= MAP_H; dy += 1) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) continue;
        const nk = key(nx, ny);
        if (!surf.has(nk) || seen.has(nk)) continue;
        // A wall between the two, at head height, blocks a straight hop.
        const step = dx > 0 ? 1 : -1;
        let blocked = false;
        for (let x = tx + step; x !== nx; x += step) {
          if (tileAt(grid, x, Math.min(ty, ny)) === SOLID && tileAt(grid, x, Math.min(ty, ny) - 1) === SOLID) blocked = true;
        }
        if (blocked && dy >= 0) continue;
        seen.add(nk);
        queue.push(nk);
      }
    }
  }
  const check = (label: string, x: number, y: number, mustReach = true) => {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE) - 1;
    if (tileAt(grid, tx, ty) !== EMPTY) problems.push(`${label} at tile ${tx},${ty} is inside rock`);
    else if (tileAt(grid, tx, ty + 1) === EMPTY) problems.push(`${label} at tile ${tx},${ty} floats in the air`);
    else if (mustReach && !seen.has(key(tx, ty))) problems.push(`${label} at tile ${tx},${ty} cannot be reached from the start`);
  };
  for (const sp of w.spawns) {
    if (sp.kind === "moth" || sp.kind === "jelly" || sp.kind === "cocoons" || sp.kind === "eye") continue;
    check(sp.kind, sp.x, sp.y, sp.kind === "lily" || sp.kind === "light");
  }
  check("gong", w.gong.x, w.gong.y);
  check("tavern", w.tavern.x, w.tavern.y);
  check("gate", w.gate.x, w.gate.y);
  check("arena", w.arena.l + 60, w.arena.y);
  for (const h of w.hints) check(`hint ${h.id}`, h.x, h.y);
  // Every ledge must be within a jump of some surface below it.
  for (let ty = 0; ty < MAP_H; ty += 1) {
    for (let tx = 0; tx < MAP_W; tx += 1) {
      if (tileAt(grid, tx, ty) !== ONEWAY) continue;
      let ok = false;
      for (let dy = 1; dy <= 3 && !ok; dy += 1) for (let dx = -3; dx <= 3; dx += 1) if (surf.has(key(tx + dx, ty + dy - 1))) ok = true;
      if (!ok) problems.push(`ledge at tile ${tx},${ty} is more than three tiles above any surface`);
    }
  }
  return problems;
}
