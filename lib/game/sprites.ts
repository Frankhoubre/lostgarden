/**
 * All pixel art for the Lost Garden game, authored as ASCII.
 * Characters are mapped to colours through per-sprite palettes.
 * "." is transparent.
 */
import { overlay, remap, sprite, type Palette, type Sprite } from "./pixel";

/* ------------------------------------------------------------------ */
/* Lanterne (player)                                                    */
/* ------------------------------------------------------------------ */

const LANTERNE_PALETTE: Palette = {
  r: "#d7dbe2", // ring
  l: "#9aa3b1", // lantern shade
  L: "#e6e9ee", // lantern light
  E: "#12121a", // eye holes
  c: "#c8b48a", // scarf / sash
  C: "#c3ad84", // cape
  P: "#6e4a44", // pauldron
  p: "#4d3230", // pauldron shadow
  b: "#22232c", // black armour
  B: "#3a3c4a", // armour highlight
  a: "#b9c0ca", // plates
  k: "#15161d", // boots and gloves
};

const LANTERNE_HEAD = [
  "......rr........",
  ".....r..r.......",
  "....llllll......",
  "...LLLLLLLl.....",
  "...LLLLLLLl.....",
  "...LLLELLEl.....",
  "...LLLLLLLl.....",
  "...LLLLLLLl.....",
  "....llllll......",
];

const LANTERNE_TORSO = [
  "....cccccc......",
  "..PPPbbbbbPPP...",
  ".pPPPbBbbbPPPp..",
  ".ppp.bbbbb.ppp..",
  "..bb.bbbbb.bb...",
  "..bb.bbbbb.bb...",
  "..aa.ccccc.aa...",
  "..kk.aaaaa.kk...",
  ".....aaaaa......",
];

const LANTERNE_TORSO_THROW = [
  "....cccccc......",
  "..PPPbbbbbPPP...",
  ".pPPPbBbbbPPPp..",
  ".ppp.bbbbb.ppp..",
  "..bb.bbbbbbbbbk.",
  "..bb.bbbbb......",
  "..aa.ccccc......",
  "..kk.aaaaa......",
  ".....aaaaa......",
];

const LANTERNE_CAPE = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "..CC............",
  ".CCC............",
  ".CCC............",
  ".CCC............",
  ".CCC............",
  ".CCC............",
  ".CCC............",
  ".CCC............",
  ".CCC............",
  ".CC.............",
  ".C.C............",
  "C..C............",
];

const LEGS_IDLE = [
  ".....bb.bb......",
  ".....bb.bb......",
  ".....aa.aa......",
  ".....bb.bb......",
  ".....kk.kk......",
  "....kkk.kkk.....",
];
const LEGS_WALK_A = [
  "....bb..bb......",
  "...bb....bb.....",
  "...aa....aa.....",
  "..bb......bb....",
  "..kk......kk....",
  ".kkk......kkk...",
];
const LEGS_WALK_B = [
  "....bb..bb......",
  "....bb...bb.....",
  "....aa...aa.....",
  "...bb.....bb....",
  "...kk.....kk....",
  "..kkk.....kkk...",
];
const LEGS_JUMP = [
  "....bb..bb......",
  "...bb....bb.....",
  "...aa....aa.....",
  "...kk....kk.....",
  "..kkk....kkk....",
  "................",
];

const pad = (rows: string[], top: number, total = 24): string[] => {
  const out: string[] = [];
  for (let i = 0; i < top; i += 1) out.push("................");
  out.push(...rows);
  while (out.length < total) out.push("................");
  return out;
};

const body = (torso: string[], legs: string[]) =>
  overlay(LANTERNE_CAPE, pad([...LANTERNE_HEAD, ...torso, ...legs], 0));

const LANTERNE_CROUCH = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "......rr........",
  ".....r..r.......",
  "....llllll......",
  "...LLLLLLLl.....",
  "...LLLLLLLl.....",
  "...LLLELLEl.....",
  "...LLLLLLLl.....",
  "...LLLLLLLl.....",
  "....llllll......",
  "....cccccc......",
  "..PPPbbbbbPPP...",
  ".pPPPbBbbbPPPp..",
  ".ppp.bbbbb.ppp..",
  "..bb.ccccc.bb...",
  "..kk.aaaaa.kk...",
  "....bbb.bbb.....",
  "...kkk...kkk....",
  "..kkkk...kkkk...",
];

const LANTERNE_DEAD_A = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "......rr........",
  ".....r..r.......",
  "....llllll......",
  "...LLLLLLLl.....",
  "...LLLELLEl.....",
  "...LLLLLLLl.....",
  "....llllll......",
  "..PPPcccccPPP...",
  ".pPPPbbbbbPPPp..",
  ".ppp.bbbbb.ppp..",
  "..bb.bbbbb.bb...",
  "..kk.ccccc.kk...",
  "...aaaaaaaaa....",
  "..bbbb...bbbb...",
  ".kkkk.....kkkk..",
  "................",
];

const LANTERNE_DEAD_B = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "...........rr...",
  "..........r..r..",
  ".........llllll.",
  "........LLLLLLLl",
  "...PPP..LLELLLEl",
  "..PPPPP.LLLLLLLl",
  ".pbbbbbp.llllll.",
  ".aaaaaaa.a..kk..",
  "kkbbbbbkk.aa.kk.",
  "kkkkkkkkkkkkkkkk",
];

const LANTERNE_FRAMES: Record<string, string[]> = {
  idle: body(LANTERNE_TORSO, LEGS_IDLE),
  walk0: body(LANTERNE_TORSO, LEGS_WALK_A),
  walk1: body(LANTERNE_TORSO, LEGS_IDLE),
  walk2: body(LANTERNE_TORSO, LEGS_WALK_B),
  walk3: body(LANTERNE_TORSO, LEGS_IDLE),
  jump: body(LANTERNE_TORSO, LEGS_JUMP),
  throw: body(LANTERNE_TORSO_THROW, LEGS_IDLE),
  throwAir: body(LANTERNE_TORSO_THROW, LEGS_JUMP),
  crouch: LANTERNE_CROUCH,
  crouchThrow: overlay(LANTERNE_CROUCH, [
    ...pad([], 19),
    "..bb.ccccccccck.",
  ]),
  deadA: LANTERNE_DEAD_A,
  deadB: LANTERNE_DEAD_B,
};

/** Armour lost: no cape, no pauldrons. */
const BARE_MAP = { C: ".", P: ".", p: "." };

export function lanterneSprite(frame: string, bare: boolean): Sprite {
  const rows = LANTERNE_FRAMES[frame] ?? LANTERNE_FRAMES.idle;
  if (bare) {
    return sprite(`lanterne-bare:${frame}`, {
      rows: remap(rows, BARE_MAP),
      palette: LANTERNE_PALETTE,
    });
  }
  return sprite(`lanterne:${frame}`, { rows, palette: LANTERNE_PALETTE });
}

/* ------------------------------------------------------------------ */
/* NPC knights and friends                                              */
/* ------------------------------------------------------------------ */

const SERRURE: string[] = [
  "....hhhhhhh.....",
  "....hhhhhhh.....",
  "....hhhKhhh.....",
  "....hhhKhhh.....",
  "....hhhKhhh.....",
  "....hhhhhhh.....",
  "....hhhhhhh.....",
  "...sssssssss....",
  "..ssssssssssss..",
  "..HHHsssgssHHH..",
  ".HHHHooogoooHHHH",
  ".HHH.ooooooo.HHH",
  "..oo.ooooooo.oo.",
  "..oo.ttttttt.oo.",
  "..oo.ooooooo.oo.",
  ".wKK.ooooooo.KKw",
  ".w...ooooooo...w",
  ".w...ooooooo...w",
  ".w...ooooooo...w",
  ".w...ooooooo...w",
  ".....ooooooo....",
  ".....ooooooo....",
  ".....hh...hh....",
  ".....hh...hh....",
  "....hhh...hhh...",
  "................",
];
const SERRURE_PALETTE: Palette = {
  h: "#3b4356",
  H: "#4d5669",
  K: "#0f1218",
  s: "#2f3646",
  o: "#2a3040",
  O: "#3a4254",
  g: "#d1a043",
  w: "#8e96a3",
  t: "#5a3d2a",
};

const BARRIK: string[] = [
  "....iiiiiiiiiiii....",
  "...iWWWWWWWWWWWWi...",
  "..iWwWwWwWwWwWwWwi..",
  "..wWwWwWwWwWwWwWwW..",
  ".wWwWwWweeWwWeeWwWw.",
  ".iiiiiiiieeiiieeiii.",
  ".wWwWwWwWwWwWwWwWwW.",
  ".wWwWwWwWwWwWwWwWwW.",
  ".wWwWwWwWwWwWwWwWwW.",
  ".wWwWwWwWwWwWwWwWwW.",
  "kwWwWwWwWwWwWwWwWwWk",
  "kkWwWwWwWwWwWwWwWwkk",
  "kkiiiiiiiiiiiiiiiikk",
  "kk.wWwWwWwWwWwWwW.kk",
  "KK.wWwWwWwWwWwWwW.KK",
  "KK.wWwWwWwWwWwWwW.KK",
  "...wWwWwWwWwWwWwW...",
  "...iiiiiiiiiiiiii...",
  "....wWwWwWwWwWwW....",
  ".....iiiiiiiiii.....",
  ".....kk......kk.....",
  ".....kk......kk.....",
  ".....KK......KK.....",
  ".....kk......kk.....",
  "....KKK......KKK....",
  "...KKKK......KKKK...",
];
const BARRIK_PALETTE: Palette = {
  w: "#8a5a2e",
  W: "#a8733c",
  i: "#3a3230",
  e: "#141216",
  k: "#4a423d",
  K: "#26221f",
};

const ROSE: string[] = [
  ".....hhhh.....",
  "....hhhhhh....",
  "...hhhhhhhh...",
  "...hhfhhhhh...",
  "...hhsssshh...",
  "...hhsessh....",
  "...hhssssh....",
  "....hsssh.....",
  "....hhhhh.....",
  "...cCCCCCCc...",
  "..cCCCCCCCCc..",
  "..cCCCCCCCCc..",
  "..cCCCCCCCCc..",
  "..cCCCCCCCCc..",
  "..cCCCCCCCCc..",
  "..cCCCCCCCCc..",
  "..cCCCCCCCCc..",
  "..cCCCCCCCCc..",
  "..cccccccccc..",
  ".....ss.ss....",
  ".....ss.ss....",
  "....eee.eee...",
];
const ROSE_PALETTE: Palette = {
  h: "#f2a7c8",
  H: "#ffd0e4",
  f: "#fff6a8",
  s: "#f7dcc9",
  c: "#7c5a8a",
  C: "#9c78aa",
  e: "#3b2440",
};

const BOURDON: string[] = [
  "..............wwwwwwwwwwww..............",
  ".............wWWWWWWWWWWWWw.............",
  "............wWwwwwwwwwwwwWw.............",
  "...wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww....",
  "...w.w......wWwwwwwwwwwwwWw......w.w....",
  "..nnnnn.....wWwwwwwwwwwwwWw.....bbbbb...",
  "..nnnnn......SSSSSSSSSSSS.......bBbbb...",
  ".nnnnnnn....SSSSSSSSSSSSSS.....bbBbbbb..",
  ".nnnnnnn....SSSSSSSSSSSSSS.....bbbbbbb..",
  ".nnnnnnn...SSSSeeSSSSeeSSSS....bbbbbbb..",
  ".nnnnnnn...SSSSeeSSSSeeSSSS....bbbbbbb..",
  ".nnnnnnn...SSSSSSSSSSSSSSSS....bbbbbbb..",
  "nnnnnnnnn..SSSSSSddSSSSSSSS...bbbbbbbbb.",
  "nnnnnnnnn..SSSSfFffffFfSSSS...bbbbbbbbb.",
  ".nnnnnnn...SSSfFfFffFfFfSSS....bbbbbbb..",
  "..nn.nn....sSSffFfffFffSSs.....bb.bb....",
  "...........ssSffFffFfffSss..............",
  ".........sssssffffffffssssss............",
  "........sssssssfFfffFfsssssss...........",
  ".......ssssSSSssffffssSSSsssss..........",
  "......sssSSSSSSSssffsSSSSSSSssss........",
  ".....ssssSSSSSSSSSssSSSSSSSSsssss.......",
  "....sssssSSSSSSSSSSSSSSSSSSSsssssss.....",
  "....sssssSSSSSSSSSSSSSSSSSSSsssssss.....",
  "...ssssssSSSSSSdSSSSSSSdSSSSsssssss.....",
  "...ssssssSSSSSSSSSSSSSSSSSSSssssssss....",
  "...ssssssSSSSSSSSSSSSSSSSSSSssssssss....",
  "...ssssss.SSSSSSSSSSSSSSSSS.ssssssss....",
  "...ssssss.SSSSSSSSSSSSSSSSS.ssssssss....",
  "...ssssss.SSSSSSSSSSSSSSSSS.ssssssss....",
  "...ssssss.SSSSSSSSSSSSSSSSS.ssssssss....",
  "...sssss..SSSSSSSSSSSSSSSSS..sssssss....",
  "...sssss..sssssssssssssssss..sssssss....",
  "..........ssssssss.ssssssss.............",
  "..........ssssssss.ssssssss.............",
  "..........ssssssss.ssssssss.............",
  "..........ssssssss.ssssssss.............",
  ".........sssssssss.sssssssss............",
  ".........sssssssss.sssssssss............",
  "........ssssssssss.ssssssssss...........",
  "........ssssssssss.ssssssssss...........",
];
const BOURDON_PALETTE: Palette = {
  s: "#3d3f45",
  S: "#52555c",
  d: "#26272c",
  e: "#e8e8e8",
  f: "#e58a2a",
  F: "#f5c04a",
  b: "#4f6b5a",
  B: "#6b8a74",
  n: "#2b2b2b",
  w: "#3a2a1e",
  W: "#5a4530",
};

/* ------------------------------------------------------------------ */
/* Enemies                                                              */
/* ------------------------------------------------------------------ */

const SPORE_A = [
  "....CCCC....",
  "..CCccccCC..",
  ".CcccccccCC.",
  ".CcccccccccC",
  "cccccccccccc",
  ".cc.cccc.cc.",
  "...ssssss...",
  "...sesses...",
  "...ssssss...",
  "...ssssss...",
  "..ss.ss.ss..",
  "..ss....ss..",
];
const SPORE_B = [
  "............",
  "............",
  "....CCCC....",
  "..CCccccCC..",
  ".CcccccccCC.",
  "cCcccccccccC",
  "cccccccccccc",
  ".cc.cccc.cc.",
  "...ssssss...",
  "...sesses...",
  ".sssssssssss",
  "ss........ss",
];
const SPORE_PALETTE: Palette = {
  c: "#3fa9e8",
  C: "#8fe3ff",
  s: "#c9d6dc",
  e: "#111111",
};

const MEDUSE_A = [
  "....MMMM....",
  "..MMmmmmMM..",
  ".MmmmmmmmmM.",
  ".MmmmmmmmmM.",
  "MmmmmmmmmmmM",
  "MmmmddddmmmM",
  ".mmmmmmmmmm.",
  ".t.t.t.t.t.t",
  ".t.t.t.t.t.t",
  "t.t.t.t.t.t.",
  "t.t.t.t.t.t.",
  ".t.t.t.t.t.t",
  ".t...t...t..",
  "..t...t...t.",
];
const MEDUSE_B = [
  "............",
  "....MMMM....",
  "..MMmmmmMM..",
  ".MmmmmmmmmM.",
  "MmmmmmmmmmmM",
  "MmmmddddmmmM",
  ".mmmmmmmmmm.",
  "t.t.t.t.t.t.",
  "t.t.t.t.t.t.",
  ".t.t.t.t.t.t",
  ".t.t.t.t.t.t",
  "t.t.t.t.t.t.",
  "..t...t...t.",
  ".t...t...t..",
];
const MEDUSE_PALETTE: Palette = {
  m: "#7fd8ff",
  M: "#c9f1ff",
  d: "#3f8fc4",
  t: "#9fe4ff",
};

const PENITENT = [
  "....rrrr....",
  "...rrrrrr...",
  "..rrwwwwrr..",
  "..rrwwwwrr..",
  "..rrwewwer..",
  "..rrwwwwrr..",
  "..rrwwwwrr..",
  "..rrrwwrrr..",
  "..rrrwwrrr..",
  ".rrrrwwrrrr.",
  ".rrrrwwrrrr.",
  ".rrrrRwrrrr.",
  ".rrrrRRrrrr.",
  ".rrrrRRrrrr.",
  ".rrrrrrrrrr.",
  ".rrrrrrrrrr.",
  ".rrrrrrrrrr.",
  ".rrrrrrrrrr.",
  "rrrrrrrrrrrr",
  "rrrrrrrrrrrr",
  "rrrrrrrrrrrr",
  "rrrrrrrrrrrr",
  "rrrrrrrrrrrr",
  "rrrrrrrrrrrr",
];
const PENITENT_PALETTE: Palette = {
  r: "#1a1c26",
  R: "#2a2d3b",
  w: "#e9e6df",
  e: "#111111",
};

const ROUAGE_A = [
  ".....kkkkkk.....",
  "...kkrrrrrrkk...",
  "..kkrRRRRRRrkk..",
  ".kkrRRRookRRrkk.",
  ".krRRRRooRRRRrk.",
  ".krrrrrrrrrrrrk.",
  "..kgkgkkkkgkgk..",
  ".k.k.k....k.k.k.",
  "k..k..k..k..k..k",
  "k..k..k..k..k..k",
  ".k..k......k..k.",
  "k..k........k..k",
];
const ROUAGE_B = [
  ".....kkkkkk.....",
  "...kkrrrrrrkk...",
  "..kkrRRRRRRrkk..",
  ".kkrRRRookRRrkk.",
  ".krRRRRooRRRRrk.",
  ".krrrrrrrrrrrrk.",
  "..kgkgkkkkgkgk..",
  "..k.k.k..k.k.k..",
  "..k.k.k..k.k.k..",
  ".k..k..k.k.k..k.",
  ".k.k...k.k..k.k.",
  "k..k...k.k...k.k",
];
const ROUAGE_PALETTE: Palette = {
  k: "#1b1b22",
  r: "#8f2a2a",
  R: "#c43b3b",
  o: "#ff9a2a",
  g: "#6b6f7a",
};

const LOUP_A = [
  "..............kk....",
  "......kkkkkkkkkkk...",
  "....kkKKKKKKKKKKkkk.",
  "..kkKKKKKKKKKKKKeKkk",
  ".kKKKKKKKKKKKKKKKKKk",
  "kKKKKKKKKKKKKKKKKwww",
  "kKKKKKKKKKKKKKKKKKk.",
  ".kKKKKKKKKKKKKKKKk..",
  "..kKKkkKKKKkkKKk....",
  "..kK...kK..kK..kK...",
  ".kk...kk..kk...kk...",
  "kk...kk..kk...kk....",
];
const LOUP_B = [
  "..............kk....",
  "......kkkkkkkkkkk...",
  "....kkKKKKKKKKKKkkk.",
  "..kkKKKKKKKKKKKKeKkk",
  ".kKKKKKKKKKKKKKKKKKk",
  "kKKKKKKKKKKKKKKKKwww",
  "kKKKKKKKKKKKKKKKKKk.",
  ".kKKKKKKKKKKKKKKKk..",
  "..kKKkkKKKKkkKKk....",
  "...kK.kK....kK.kK...",
  "...kk.kk....kk.kk...",
  "..kk..kk...kk..kk...",
];
const LOUP_PALETTE: Palette = {
  k: "#1f2230",
  K: "#2e3245",
  e: "#9fd6ff",
  w: "#c8ccd8",
};

const REPTILE_A = [
  "...W.W.W......",
  "...WWWWW......",
  "..WWyWWyW.....",
  "..WWWWWWW.....",
  "...WWwWW......",
  "....ww........",
  "...wwww.......",
  "..wwwwww......",
  ".ww.ww.ww.....",
  ".w..ww..w.....",
  ".w..ww..w.....",
  "....bb........",
  "...bbbb.......",
  "...bbbb.g.....",
  "...w.w..gg....",
  "...w.w...gg...",
  "...w.w....gg..",
  "...w.w.....gg.",
  "...w.w......gg",
  "...w.w........",
  "...w.w........",
  "...w.w........",
  "..ww.ww.......",
  ".ww...ww......",
];
const REPTILE_B = [
  "...W.W.W......",
  "...WWWWW......",
  "..WWyWWyW.....",
  "..WWWWWWW.....",
  "...WWwWW......",
  "....ww........",
  "...wwww.......",
  "..wwwwww......",
  ".ww.ww.ww.....",
  ".w..ww..w.....",
  ".w..ww..w.....",
  "....bb........",
  "...bbbb.......",
  "...bbbb.g.....",
  "...ww...gg....",
  "..w.ww...gg...",
  "..w..w....gg..",
  ".w...w.....gg.",
  ".w...w......gg",
  "w....w........",
  "w....ww.......",
  "......w.......",
  "......ww......",
  ".......ww.....",
];
const REPTILE_PALETTE: Palette = {
  w: "#dfe4ec",
  W: "#f4f6f9",
  y: "#f2c14e",
  b: "#2f4a6b",
  e: "#111111",
  g: "#aab2bf",
};

const COLOSSE = [
  ".............dddddd.............",
  "...........ddsSSSSdd............",
  "........ddddsSeSSeSddd..........",
  ".....dddsSSSdSSSSSSdSSSddd......",
  "...ddsSSSSSSSSSSSSSSSSSSSSSdd...",
  "..dsSSSSSSSSSSSSSSSSSSSSSSSSSd..",
  ".dsSSSSSdsSSSSSdsSSSSSdsSSSSSSd.",
  ".dsSSSSSdsSSSSSdsSSSSSdsSSSSSSd.",
  "dsSSSSSdsSSSSSdsSSSSSdsSSSSSSSsd",
  "dssssssdsssssssdsssssdsssssssssd",
  "dhhhhssdsssssssdsssssdsssssssssd",
  "dhhhhhhdddddddddddddddddddddddd.",
  ".hhhhhhpppppppppppppppppppppp...",
  ".hhhhhh.ppppppppppppppppppppp...",
  ".hh.hhh.pppppppppppppppppppp....",
  ".h..hh...pp..ppp...pp...pp......",
  ".h...h...bb..bbb...bb...bb......",
  ".........bb..bb....bb...bb......",
  ".........bb..bb....bb...bb......",
  ".........bb..bb....bb...bb......",
  "........bb..bb....bb...bb.......",
  "........bb..bb....bb...bb.......",
  ".......kkk.kkk...kkk...kkk......",
  "......kkk.kkk...kkk...kkk.......",
];
const COLOSSE_B = [
  ...COLOSSE.slice(0, 16),
  ".........bb..bb....bb...bb......",
  ".........bb...bb...bb....bb.....",
  "..........bb..bb....bb...bb.....",
  "..........bb...bb...bb....bb....",
  "..........bb...bb...bb....bb....",
  ".........kkk..kkk..kkk...kkk....",
  "........kkk..kkk..kkk...kkk.....",
  "................................",
];
const COLOSSE_PALETTE: Palette = {
  s: "#6b6355",
  S: "#857a68",
  d: "#4a443b",
  b: "#e5dccb",
  p: "#4a2f4f",
  h: "#efe7d1",
  k: "#2a2622",
  e: "#111111",
};

const GOLEM_A = [
  "....aaaaaa....",
  "...aAAAAAAa...",
  "...aAeAAeAa...",
  "...aAAAAAAa...",
  "....aaaaaa....",
  "..aaaAAAAaaa..",
  ".aAAaAAAAaAAa.",
  ".aAAaAAAAaAAa.",
  ".aa.aAAAAa.aa.",
  ".aa.aAAAAa.aa.",
  ".aa.aaaaaa.aa.",
  ".dd.aAAAAa.dd.",
  "....aaaaaa....",
  "...aAAAAAAa...",
  "...aAAAAAAa...",
  "....aa..aa....",
  "....aa..aa....",
  "....AA..AA....",
  "....aa..aa....",
  "....aa..aa....",
  "....aa..aa....",
  "....dd..dd....",
  "...ddd..ddd...",
  "..dddd..dddd..",
];
const GOLEM_B = [
  ...GOLEM_A.slice(0, 15),
  "...aa....aa...",
  "..aa......aa..",
  "..AA......AA..",
  ".aa........aa.",
  ".aa........aa.",
  ".aa........aa.",
  ".dd........dd.",
  "ddd........ddd",
  "..............",
];
const GOLEM_PALETTE: Palette = {
  a: "#6e3b3b",
  A: "#8f4d4d",
  d: "#3b1f1f",
  e: "#ff9a2a",
};

const SOURIS = [
  ".mm..mm.",
  ".mmmmmm.",
  "..memem.",
  "..mmmm..",
  ".rrrrrr.",
  ".rrgrrr.",
  "..mmmm..",
  ".m....m.",
];
const SOURIS_PALETTE: Palette = {
  m: "#a89f94",
  M: "#cfc8bf",
  e: "#111111",
  g: "#e0b04a",
  r: "#c46a5a",
};

/* ------------------------------------------------------------------ */
/* Bosses                                                               */
/* ------------------------------------------------------------------ */

const MACHINE = [
  "..................kkkkkkkkkkkk..................",
  "...............kkkkKKKKKKKKKKkkkk...............",
  ".............kkKKKKKKrrrrrrKKKKKkkk.............",
  "...........kkKKKKrrrrRRRRRRrrrrKKKKkk...........",
  "..........kKKKrrrRRRRRRRRRRRRRRrrrKKKk..........",
  ".........kKKrrRRRRRRRRRRRRRRRRRRRRrrKKk.........",
  "........kKKrRRRRRRggggRRRRRRggggRRRRrKKk........",
  "........kKrRRRRRgggoogggRRRgggoogggRRrKk........",
  ".......kKrRRRRRggOoooOggRRRggOoooOggRRrKk.......",
  ".......kKrRRRRRgoooooooggRggoooooooggRrKk.......",
  ".......kKrRRRRRgoooooooggRggoooooooggRrKk.......",
  ".......kKrRRRRRggoooooggRRRggoooooggRRrKk.......",
  "........kKrRRRRRgggoogggRRRgggoogggRRrKk........",
  "........kKrRRRRRRggggRRRRRRRRggggRRRrKk.........",
  ".........kKrrRRRRRRRRRRRRRRRRRRRRRrrKk..........",
  "..........kKKrrrRRRRRRRRRRRRRRRrrrKKk...........",
  "...........kKKKKrrrrrrrrrrrrrrrKKKKk............",
  "............kkKKKKKKKKGGGGKKKKKKKkk.............",
  ".............kkkkkkkkkGggGkkkkkkkk..............",
  "..........kkk......kk.GggG.kk......kkk..........",
  ".........kk.kk....kk..GggG..kk....kk.kk.........",
  "........kk...kk..kk...GggG...kk..kk...kk........",
  ".......kk.....kkkk....GggG....kkkk.....kk.......",
  "......kk......kk......GggG......kk......kk......",
  ".....kk......kk.......GggG.......kk......kk.....",
  "....kk......kk........GggG........kk......kk....",
  "...kk......kk.........GGGG.........kk......kk...",
  "..kk......kk...........GG...........kk......kk..",
  ".kk......kk............GG............kk......kk.",
  "kk......kk.............GG.............kk......kk",
  "k......kk..............rr..............kk......k",
  "......kk...............rr...............kk......",
  ".....kk................rr................kk.....",
  ".....k.................rr.................k.....",
];
const MACHINE_PALETTE: Palette = {
  k: "#2a2a38",
  K: "#2b2b36",
  r: "#7d2323",
  R: "#b23535",
  o: "#ff9a2a",
  O: "#ffd27a",
  g: "#6c717c",
  G: "#9aa0ad",
};

const DECROCHEUR = [
  "..w......w.....w......w.........",
  "..w..w...w.w...w.w..w..w........",
  "...w.w..w..w...w..w.w.w.........",
  "...ww..w...w...w...ww.w.........",
  "....ww.w...w.w.w..ww.ww.........",
  ".....www...www...www............",
  "......ww..wwwww..ww.............",
  ".......wwwWWWWWwww..............",
  "........wWWWWWWWw...............",
  "........wWWWdWWWw...............",
  "........wWWdWdWWw...............",
  ".........wWWdWWw................",
  "..........wWWWw.................",
  "...........wWw..................",
  "............k...................",
  "..........kkkkk.................",
  ".........kkKkKkk................",
  "........kkKKKKKkk...............",
  "........kKKKKKKKk...............",
  ".......kkKKKKKKKkk..............",
  ".......kKKKKKKKKKk..............",
  ".......kKKKdKKKKKk..............",
  "......kkKKKKKKKKKkk.............",
  "......kKKKKKKKKKKKk.............",
  "......kKKKKKKKKKKKk.............",
  "......kKKKKKKKKKKKk.............",
  ".....kkKKdKKKKKdKkk.............",
  ".....kKKKKKKKKKKKKk.............",
  ".....kKKKKKKKKKKKKk.............",
  ".....kKKKKKKKKKKKKk.............",
  "....kkKKKKKKKKKKKKkk............",
  "....kKKKKKKKKKKKKKKk............",
  "....kKKKKKdKKKKdKKKk............",
  "....kKKKKKKKKKKKKKKk............",
  "...kkKKKKKKKKKKKKKKkk...........",
  "...kKKKKKKKKKKKKKKKKk...........",
  "...kKKKKKKKKKKKKKKKKk...........",
  "...kKKKKKKKKKKKKKKKKk...........",
  "..kkKKKKKKKKKKKKKKKKkk..........",
  "..kKKKKKKKKKKKKKKKKKKk..........",
  "..k.kKKKk.kKKKk.kKKk.k..........",
  "..k.kKKk..kKKk..kKk..k..........",
  "....kKk...kKk...kk..............",
  "....kk....kk....k...............",
  "....k.....k.....................",
  "....k.....k.....................",
  "...kk....kk.....................",
  "...kk....kk.....................",
];
const DECROCHEUR_PALETTE: Palette = {
  k: "#0e0e14",
  K: "#1c1c26",
  w: "#e8e4d8",
  W: "#f6f3ea",
  d: "#111111",
};

const SCYTHE = [
  "..........sssssss.......",
  ".......ssssSSSSSsss.....",
  ".....sssSSS.....ssss....",
  "....ssSS...........sss..",
  "...ssS...............ss.",
  "..ssS.................s.",
  "..sS....................",
  ".ss.....................",
  ".s......................",
  ".s.........g............",
  "..........g.............",
  ".........g..............",
  "........g...............",
  ".......g................",
  "......g.................",
  ".....g..................",
  "....g...................",
  "...g....................",
  "..g.....................",
  ".g......................",
  "g.......................",
];
const SCYTHE_PALETTE: Palette = { g: "#5a5a66", s: "#cfcabd", S: "#ffffff" };

const SOMBRE_A = [
  ".....wwwww......",
  "....wwwwwww.....",
  "....wgggggw.....",
  "....wgggggw.....",
  "....wgkkkgw.....",
  "....wgggggw.....",
  "...wwgggggww....",
  "..wwwwwwwwwww...",
  ".wwwGGGGGGGwww..",
  ".www.GGGGG.www..",
  ".www.GgGgG.www..",
  ".ww..GGGGG..ww..",
  ".ww..ttttt..ww..",
  ".ww.gGGGGGg.ww..",
  ".ww.gGGGGGg.ww..",
  ".ww.gGGGGGg.ww..",
  ".ww..GGGGG..ww..",
  ".w...GGGGG...w..",
  ".w...gg.gg...w..",
  ".....gg.gg......",
  ".....GG.GG......",
  ".....gg.gg......",
  ".....gg.gg......",
  ".....gg.gg......",
  "....ggg.ggg.....",
  "................",
];
const SOMBRE_B = [
  ...SOMBRE_A.slice(0, 18),
  ".w..gg...gg..w..",
  "....gg...gg.....",
  "...GG.....GG....",
  "...gg.....gg....",
  "..gg.......gg...",
  "..gg.......gg...",
  ".ggg.......ggg..",
  "................",
];
const SOMBRE_PALETTE: Palette = {
  g: "#2f4a3a",
  G: "#3e6049",
  w: "#efece4",
  W: "#fbfaf6",
  k: "#111111",
  t: "#5a3d2a",
};

const GREATSWORD = [
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  ".ss.",
  "tttt",
  ".hh.",
  ".hh.",
  ".tt.",
];
const GREATSWORD_PALETTE: Palette = { s: "#9aa3b1", t: "#5a3d2a", h: "#3a2a1e" };

/* ------------------------------------------------------------------ */
/* Items and projectiles                                                */
/* ------------------------------------------------------------------ */

const CHEST_CLOSED = [
  "..kkkkkkkkkkkk..",
  ".kWWWWWWWWWWWWk.",
  ".kWwwwwwwwwwwWk.",
  ".kWwwwwwwwwwwWk.",
  ".kggggggggggggk.",
  ".kWwwwwwgwwwwWk.",
  ".kWwwwwgggwwwWk.",
  ".kWwwwwwgwwwwWk.",
  ".kWwwwwwwwwwwWk.",
  ".kWwwwwwwwwwwWk.",
  ".kggggggggggggk.",
  ".kWwwwwwwwwwwWk.",
  ".kkkkkkkkkkkkkk.",
  "................",
];
const CHEST_OPEN = [
  ".kkkkkkkkkkkkkk.",
  ".kWwwwwwwwwwwWk.",
  ".kkkkkkkkkkkkkk.",
  "..k..........k..",
  "................",
  ".kggggggggggggk.",
  ".kWwwwwwwwwwwWk.",
  ".kWwwwwwwwwwwWk.",
  ".kWwwwwwwwwwwWk.",
  ".kWwwwwwwwwwwWk.",
  ".kggggggggggggk.",
  ".kWwwwwwwwwwwWk.",
  ".kkkkkkkkkkkkkk.",
  "................",
];
const CHEST_PALETTE: Palette = {
  w: "#6b4a2a",
  W: "#8a6238",
  g: "#d9b24a",
  k: "#2a1d10",
};

const ITEM_PALETTE: Palette = {
  y: "#fff1a8",
  Y: "#ffffff",
  o: "#ffb347",
  g: "#d9b24a",
  s: "#c9d0da",
  t: "#5a3d2a",
  b: "#4f6b5a",
  B: "#7fd8ff",
  c: "#8a7452",
  C: "#c8b48a",
  w: "#f4f4f0",
  G: "#3f7f6a",
};

const ITEM_LUEUR = [
  "....yy....",
  "...yYYy...",
  "..yYYYYy..",
  ".yYYYYYYy.",
  ".yYYYYYYy.",
  "..yYYYYy..",
  "...yYYy...",
  "....yy....",
  "....oo....",
  "....oo....",
];
const ITEM_CLE = [
  "...gggg...",
  "..gg..gg..",
  "..gg..gg..",
  "...gggg...",
  "....gg....",
  "....gg....",
  "....gggg..",
  "....gg....",
  "....gggg..",
  "..........",
];
const ITEM_DAGUE = [
  "........ss",
  ".......ss.",
  "......ss..",
  ".....ss...",
  "....ss....",
  "...ss.....",
  "..tt......",
  ".tt.......",
  "tt........",
  "..........",
];
const ITEM_CLOCHE = [
  "....gg....",
  "...bbbb...",
  "..bbbbbb..",
  "..bbbbbb..",
  "..bbbbbb..",
  ".bbbbbbbb.",
  ".bbbbbbbb.",
  "bbbbbbbbbb",
  "....gg....",
  "..........",
];
const ITEM_CAPE = [
  "..cccccc..",
  ".cCCCCCCc.",
  ".cCCCCCCc.",
  ".cCCCCCCc.",
  ".cCCCCCCc.",
  ".cCCCCCCc.",
  ".cCCCCCCc.",
  ".cCcCcCcc.",
  ".c.c.c.c..",
  "..........",
];
const ITEM_MEDAILLON = [
  "....ss....",
  "...s..s...",
  "..ssssss..",
  ".ssBBBBss.",
  ".sBBYYBBs.",
  ".sBBYYBBs.",
  "..ssBBss..",
  "...ssss...",
  "..........",
  "..........",
];
const ITEM_LYS = [
  "...w..w...",
  "..ww..ww..",
  "..wwwwww..",
  "...wyyw...",
  "....GG....",
  "....GG....",
  "...GGG....",
  "....G.....",
  "..........",
  "..........",
];

const PROJ_LUEUR = ["oyYYYYYo", "yYYYYYYY", "oyYYYYYo"];
const PROJ_DAGUE = ["tt.......", ".ttssssss", "tt......."];
const PROJ_CLE = [
  "..gggg..",
  ".gg..gg.",
  ".gg..gg.",
  "..gggg..",
  "...gg...",
  "...gggg.",
  "...gg...",
  "...gggg.",
];
const PROJ_CLOCHE = [
  "...gg...",
  "..bbbb..",
  ".bbbbbb.",
  ".bbbbbb.",
  "bbbbbbbb",
  "bbbbbbbb",
  "...gg...",
  "........",
];
const PROJ_SPARK = ["oo", "oo"];
const PROJ_SHARD = [".r.", "rRr", ".r."];
const PROJ_PALETTE: Palette = {
  ...ITEM_PALETTE,
  r: "#ff9a2a",
  R: "#ffd27a",
};

/* ------------------------------------------------------------------ */
/* Tiles (16x16)                                                        */
/* ------------------------------------------------------------------ */

const FOREST_GROUND = [
  "mmMmmmmMmmmmmMmm",
  "mmmmmmmmmmmmmmmm",
  "ssssssssdsssssss",
  "sSssssssdsssssSs",
  "ssssssssdsssssss",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
  "sSssdsssSsssdsss",
  "ssssdsssssssdsss",
  "dddddddddddddddd",
  "ssssssssdsssssss",
  "sSssssssdsssSsss",
  "ssssssssdsssssss",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
  "ssssdsssssssdsss",
];
const FOREST_ROCK = [
  "ssssdsssssssdsss",
  "sSssdsssSsssdsss",
  "dddddddddddddddd",
  "ssssssssdsssssss",
  "sSssssssdsssssSs",
  "ssssssssdsssssss",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
  "sSssdsssSsssdsss",
  "ssssdsssssssdsss",
  "dddddddddddddddd",
  "ssssssssdsssssss",
  "sSssssssdsssSsss",
  "ssssssssdsssssss",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
];
const FOREST_PALETTE: Palette = {
  m: "#3f7f6a",
  M: "#6fc4a0",
  s: "#22364d",
  S: "#33506e",
  d: "#162538",
};
const MUSHROOM_CAP = [
  "....CCCCCCCC....",
  "..CCccccccccCC..",
  ".CccccCCccccccC.",
  "CccccccccccccccC",
  "cccccccccccccccc",
  ".ccc.ccc.ccc.cc.",
  "......ss........",
  "......ss........",
  "......ss........",
  "......ss........",
  "......ss........",
  "......ss........",
  "......ss........",
  "......ss........",
  ".....ssss.......",
  ".....ssss.......",
];
const MUSHROOM_PALETTE: Palette = { c: "#3fa9e8", C: "#8fe3ff", s: "#b8c6d0" };

const CHAIN_PLATFORM = [
  ".rr..rrrr..rrrr.",
  "rrrrrr..rrrr..rr",
  "rr..rrrr..rrrr..",
  ".rr..rrrr..rrrr.",
  "..rrrr..rrrr..rr",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];
const CHAIN_PALETTE: Palette = { r: "#8a5a34", R: "#b0733f" };

const BONE_GROUND = [
  "bbBbbbbbBbbbbbbB",
  "bbbbBbbbbbbBbbbb",
  "ggggggggdggggggg",
  "gGggggggdgggggGg",
  "ggggggggdggggggg",
  "dddddddddddddddd",
  "ggggdgggggggdggg",
  "gGggdgggGgggdggg",
  "ggggdgggggggdggg",
  "dddddddddddddddd",
  "ggggggggdggggggg",
  "gGggggggdgggGggg",
  "ggggggggdggggggg",
  "dddddddddddddddd",
  "ggggdgggggggdggg",
  "ggggdgggggggdggg",
];
const BONE_ROCK = [
  "ggggdgggggggdggg",
  "gGggdgggGgggdggg",
  "dddddddddddddddd",
  "ggggggggdggggggg",
  "gGggggggdgggggGg",
  "ggggggggdggggggg",
  "dddddddddddddddd",
  "ggggdgggggggdggg",
  "gGggdgggGgggdggg",
  "ggggdgggggggdggg",
  "dddddddddddddddd",
  "ggggggggdggggggg",
  "gGggggggdgggGggg",
  "ggggggggdggggggg",
  "dddddddddddddddd",
  "ggggdgggggggdggg",
];
const BONE_PALETTE: Palette = {
  b: "#cfc7b4",
  B: "#f0e9d6",
  g: "#2f3038",
  G: "#41434d",
  d: "#1e1f26",
};

const CASTLE_STONE = [
  "ssssssssdsssssss",
  "sSssssssdsssssSs",
  "ssssssssdsssssss",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
  "sSssdsssSsssdsss",
  "ssssdsssssssdsss",
  "dddddddddddddddd",
  "ssssssssdsssssss",
  "sSssssssdsssSsss",
  "ssssssssdsssssss",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
  "sSssdsssSsssdsss",
  "ssssdsssssssdsss",
  "dddddddddddddddd",
];
const CASTLE_FLOOR = [
  "rrrrrrrrrrrrrrrr",
  "RrrRrrrRrrRrrrRr",
  "ssssssssdsssssss",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
  "sSssdsssSsssdsss",
  "ssssdsssssssdsss",
  "dddddddddddddddd",
  "ssssssssdsssssss",
  "sSssssssdsssSsss",
  "ssssssssdsssssss",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
  "sSssdsssSsssdsss",
  "ssssdsssssssdsss",
  "dddddddddddddddd",
];
const CASTLE_PALETTE: Palette = {
  s: "#4a4455",
  S: "#5d566a",
  d: "#2a2632",
  r: "#7a2f38",
  R: "#a03f4a",
};
const CASTLE_BEAM = [
  "wwwwwwwwwwwwwwww",
  "WWWWWWWWWWWWWWWW",
  "wwwwwwwwwwwwwwww",
  "kkkkkkkkkkkkkkkk",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];
const BEAM_PALETTE: Palette = { w: "#5a4530", W: "#7a5f40", k: "#2a1d10" };

const THORNS = [
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "....W.....W.....",
  "....w.....w.....",
  ".W..w..W..w..W..",
  ".w..w..w..w..w..",
  ".w..w..w..w..w..",
  ".ww.ww.ww.ww.ww.",
  ".ww.ww.ww.ww.ww.",
  "wwwwwwwwwwwwwwww",
  "kkkkkkkkkkkkkkkk",
  "kkkkkkkkkkkkkkkk",
];
const THORNS_PALETTE: Palette = { w: "#5d5a6a", W: "#e8e6ef", k: "#1a1820" };

const WHITE_GROUND = [
  "wwwwwwwwwwwwwwww",
  "wWwwwwwWwwwwwWww",
  "ssssssssdsssssss",
  "sSssssssdsssssSs",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
  "sSssdsssSsssdsss",
  "dddddddddddddddd",
  "ssssssssdsssssss",
  "sSssssssdsssSsss",
  "dddddddddddddddd",
  "ssssdsssssssdsss",
  "sSssdsssSsssdsss",
  "dddddddddddddddd",
  "ssssssssdsssssss",
  "ssssssssdsssssss",
];
const WHITE_PALETTE: Palette = {
  w: "#e7e4dc",
  W: "#ffffff",
  s: "#b9b4aa",
  S: "#cbc6bb",
  d: "#9a958b",
};

/* ------------------------------------------------------------------ */
/* Registry                                                             */
/* ------------------------------------------------------------------ */

type ArtDef = { rows: string[]; palette: Palette };

const ART: Record<string, ArtDef> = {
  serrure: { rows: SERRURE, palette: SERRURE_PALETTE },
  barrik: { rows: BARRIK, palette: BARRIK_PALETTE },
  rose: { rows: ROSE, palette: ROSE_PALETTE },
  bourdon: { rows: BOURDON, palette: BOURDON_PALETTE },

  spore0: { rows: SPORE_A, palette: SPORE_PALETTE },
  spore1: { rows: SPORE_B, palette: SPORE_PALETTE },
  meduse0: { rows: MEDUSE_A, palette: MEDUSE_PALETTE },
  meduse1: { rows: MEDUSE_B, palette: MEDUSE_PALETTE },
  penitent: { rows: PENITENT, palette: PENITENT_PALETTE },
  rouage0: { rows: ROUAGE_A, palette: ROUAGE_PALETTE },
  rouage1: { rows: ROUAGE_B, palette: ROUAGE_PALETTE },
  loup0: { rows: LOUP_A, palette: LOUP_PALETTE },
  loup1: { rows: LOUP_B, palette: LOUP_PALETTE },
  reptile0: { rows: REPTILE_A, palette: REPTILE_PALETTE },
  reptile1: { rows: REPTILE_B, palette: REPTILE_PALETTE },
  colosse0: { rows: COLOSSE, palette: COLOSSE_PALETTE },
  colosse1: { rows: COLOSSE_B, palette: COLOSSE_PALETTE },
  golem0: { rows: GOLEM_A, palette: GOLEM_PALETTE },
  golem1: { rows: GOLEM_B, palette: GOLEM_PALETTE },
  souris: { rows: SOURIS, palette: SOURIS_PALETTE },

  machine: { rows: MACHINE, palette: MACHINE_PALETTE },
  decrocheur: { rows: DECROCHEUR, palette: DECROCHEUR_PALETTE },
  scythe: { rows: SCYTHE, palette: SCYTHE_PALETTE },
  sombre0: { rows: SOMBRE_A, palette: SOMBRE_PALETTE },
  sombre1: { rows: SOMBRE_B, palette: SOMBRE_PALETTE },
  greatsword: { rows: GREATSWORD, palette: GREATSWORD_PALETTE },

  chestClosed: { rows: CHEST_CLOSED, palette: CHEST_PALETTE },
  chestOpen: { rows: CHEST_OPEN, palette: CHEST_PALETTE },
  itemLueur: { rows: ITEM_LUEUR, palette: ITEM_PALETTE },
  itemCle: { rows: ITEM_CLE, palette: ITEM_PALETTE },
  itemDague: { rows: ITEM_DAGUE, palette: ITEM_PALETTE },
  itemCloche: { rows: ITEM_CLOCHE, palette: ITEM_PALETTE },
  itemCape: { rows: ITEM_CAPE, palette: ITEM_PALETTE },
  itemMedaillon: { rows: ITEM_MEDAILLON, palette: ITEM_PALETTE },
  itemLys: { rows: ITEM_LYS, palette: ITEM_PALETTE },

  projLueur: { rows: PROJ_LUEUR, palette: PROJ_PALETTE },
  projDague: { rows: PROJ_DAGUE, palette: PROJ_PALETTE },
  projCle: { rows: PROJ_CLE, palette: PROJ_PALETTE },
  projCloche: { rows: PROJ_CLOCHE, palette: PROJ_PALETTE },
  projSpark: { rows: PROJ_SPARK, palette: PROJ_PALETTE },
  projShard: { rows: PROJ_SHARD, palette: PROJ_PALETTE },

  tileForestGround: { rows: FOREST_GROUND, palette: FOREST_PALETTE },
  tileForestRock: { rows: FOREST_ROCK, palette: FOREST_PALETTE },
  tileMushroom: { rows: MUSHROOM_CAP, palette: MUSHROOM_PALETTE },
  tileChain: { rows: CHAIN_PLATFORM, palette: CHAIN_PALETTE },
  tileBoneGround: { rows: BONE_GROUND, palette: BONE_PALETTE },
  tileBoneRock: { rows: BONE_ROCK, palette: BONE_PALETTE },
  tileCastleStone: { rows: CASTLE_STONE, palette: CASTLE_PALETTE },
  tileCastleFloor: { rows: CASTLE_FLOOR, palette: CASTLE_PALETTE },
  tileBeam: { rows: CASTLE_BEAM, palette: BEAM_PALETTE },
  tileThorns: { rows: THORNS, palette: THORNS_PALETTE },
  tileWhiteGround: { rows: WHITE_GROUND, palette: WHITE_PALETTE },
};

export function getSprite(name: string): Sprite {
  const def = ART[name];
  if (!def) throw new Error(`Unknown sprite: ${name}`);
  return sprite(name, def);
}

export function hasSprite(name: string): boolean {
  return name in ART;
}
