/**
 * Lanterne, the twelfth knight. 32x44 frames, drawn facing right.
 * Cape characters (v, V, w) and pauldrons (P, p, o, x) are remapped to
 * transparent once the armour is lost.
 */
import { overlay, type Palette } from "../pixel";

export const LANTERNE_PALETTE: Palette = {
  r: "#d7dbe2", // ring
  L: "#eef1f5", // lantern light face
  l: "#c4cbd5", // lantern mid
  d: "#8a94a2", // lantern shade
  D: "#586170", // lantern dark edge
  E: "#0e0e14", // eye holes
  c: "#cfb98d", // scarf / sash
  C: "#e8d8b2", // scarf highlight
  q: "#a08a62", // scarf shadow
  P: "#7a524a", // pauldron
  p: "#57392f", // pauldron shadow
  o: "#9a6d60", // pauldron highlight
  x: "#45292a", // pauldron engraving
  b: "#24252f", // black armour
  B: "#3a3c4e", // armour highlight
  n: "#15161c", // armour shadow
  a: "#c3c9d3", // plates
  A: "#e4e8ee", // plate highlight
  s: "#8b95a3", // plate shadow
  g: "#d8ad4a", // gold
  k: "#1a1b22", // boots / gloves
  K: "#2f3040", // boots highlight
  v: "#bfa981", // cape
  V: "#d9c59f", // cape highlight
  w: "#93805c", // cape shadow
};

const W = 32;
const blank = ".".repeat(W);

function rows(...list: string[]): string[] {
  for (const r of list) {
    if (r.length !== W) throw new Error(`lanterne row width ${r.length}: ${r}`);
  }
  return list;
}

/** Rows 0-13: the lantern head. */
const HEAD = rows(
  "..............rr................",
  ".............r..r...............",
  "..........DlllllllD.............",
  ".........DLLLLLLLLlD............",
  "..........dllllllld.............",
  ".........DLLLLLLLLdD............",
  ".........DLLLLLLLldD............",
  ".........DLLELLLLEdD............",
  ".........DLLELLLLEdD............",
  ".........DLLLLLLLldD............",
  ".........DLLLLLLLldD............",
  ".........DLLLLLLlldD............",
  "..........DlllllldD.............",
  "...........DDDDDD...............",
);

/** Rows 14-16: scarf. */
const SCARF = rows(
  "..........qCcccccCq.............",
  ".........qcccccccccq............",
  "..........qqcccccqq.............",
);

/** Rows 17-31: pauldrons, torso, arms, sash and skirt plates. */
const TORSO = rows(
  ".....oPPPPo.bbbbbb.oPPPPo.......",
  "....oPxxPPPpbBbbbbboPPxxPPo.....",
  "....PPxPPPPpbbbbbbbPPPPxPPP.....",
  "....pPPPPPppbbbbbbbppPPPPPp.....",
  ".....ppppp.bbbBbbbb.ppppp.......",
  "......bb...bbbbbbbb...bb........",
  "......bbb..bbbbbbbb..bbb........",
  "......nbb..bbgbbbbb..bbn........",
  "......nbb..bbbbbbbb..bbn........",
  "......sAa..qcccccq...aAs........",
  "......saa..ccccccc...aas........",
  "......kKk..qcccccq...kKk........",
  ".......k...aAAAAAa....k.........",
  "...........aaAAAaa..............",
  "..........saaaaaaas.............",
);

const TORSO_THROW = rows(
  ".....oPPPPo.bbbbbb.oPPPPo.......",
  "....oPxxPPPpbBbbbbboPPxxPPo.....",
  "....PPxPPPPpbbbbbbbPPPPxPPP.....",
  "....pPPPPPppbbbbbbbppPPPPPp.....",
  ".....ppppp.bbbBbbbb.ppppp.......",
  "......bb...bbbbbbbb...bbbbb.....",
  "......bbb..bbbbbbbb..bbbbbbbb...",
  "......nbb..bbgbbbbb..nbbbbaAsK..",
  "......nbb..bbbbbbbb..........k..",
  "......sAa..qcccccq..............",
  "......saa..ccccccc..............",
  "......kKk..qcccccq..............",
  ".......k...aAAAAAa..............",
  "...........aaAAAaa..............",
  "..........saaaaaaas.............",
);

/** Rows 32-43: legs. */
const LEGS_IDLE = rows(
  "...........bbb.bbb..............",
  "...........bbb.bbb..............",
  "...........bBb.bBb..............",
  "..........sAAs.sAAs.............",
  "..........saas.saas.............",
  "...........bbb.bbb..............",
  "...........bbb.bbb..............",
  "...........nbb.nbb..............",
  "...........KKk.KKk..............",
  "..........kKKk.kKKk.............",
  ".........kkKKk.kkKKk............",
  ".........kkkkk.kkkkk............",
);
const LEGS_WALK_A = rows(
  "...........bbb.bbb..............",
  "..........bbb...bbb.............",
  "..........bBb...bBb.............",
  ".........sAAs...sAAs............",
  ".........saas....saas...........",
  "........bbb.......bbb...........",
  "........bbb.......bbb...........",
  ".......nbb.........nbb..........",
  ".......KKk.........KKk..........",
  "......kKKk........kKKkk.........",
  ".....kkKKk........kkKKk.........",
  ".....kkkkk........kkkkk.........",
);
const LEGS_WALK_B = rows(
  "...........bbb.bbb..............",
  "...........bbb.bbb..............",
  "...........bBb.bBb..............",
  "..........sAAs.sAAs.............",
  "..........saas.saas.............",
  "...........bbb..bbb.............",
  "...........bbb..bbb.............",
  "...........nbb..nbb.............",
  "...........KKk..KKk.............",
  "..........kKKk...KKk............",
  ".........kkKKk...kkk............",
  ".........kkkkk..................",
);
const LEGS_WALK_C = rows(
  "...........bbb.bbb..............",
  "..........bbb...bbb.............",
  "..........bBb...bBb.............",
  ".........sAAs...sAAs............",
  "........saas.....saas...........",
  "........bbb.......bbb...........",
  ".......bbb........bbb...........",
  ".......nbb.........nbb..........",
  ".......KKk.........KKk..........",
  "......kKKk........kKKk..........",
  ".....kkKKk.......kkKKk..........",
  ".....kkkkk.......kkkkk..........",
);
const LEGS_WALK_D = rows(
  "...........bbb.bbb..............",
  "...........bbb.bbb..............",
  "...........bBb.bBb..............",
  "..........sAAs.sAAs.............",
  "..........saas.saas.............",
  "..........bbb...bbb.............",
  "..........bbb...bbb.............",
  "..........nbb...nbb.............",
  "..........KKk...KKk.............",
  "..........KKk..kKKk.............",
  "..........kkk.kkKKk.............",
  "..............kkkkk.............",
);
const LEGS_JUMP = rows(
  "...........bbb.bbb..............",
  "..........bbb...bbb.............",
  ".........bBb.....bBb............",
  ".........sAAs...sAAs............",
  "..........saas.saas.............",
  "..........bbb...bbb.............",
  "..........nbb...nbb.............",
  ".........kKKk...kKKk............",
  ".........kkkk...kkkk............",
  "................................",
  "................................",
  "................................",
);

/** Cape behind the body (left side when facing right). */
const CAPE = rows(
  blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank,
  "........vv......................",
  ".......vvv......................",
  "......vvvv......................",
  ".....VvvvV......................",
  ".....Vvvvv......................",
  ".....Vvvvv......................",
  "....VVvvvv......................",
  "....Vvvvvv......................",
  "....Vvvvvv......................",
  "....Vvvvvvv.....................",
  "....Vvvvvvv.....................",
  "...VVvvvvvv.....................",
  "...Vvvvvvvv.....................",
  "...Vvvvvvvv.....................",
  "...Vvvvvvww.....................",
  "...Vvvvvvww.....................",
  "...Vvvvvvww.....................",
  "...Vvvvvvww.....................",
  "...Vvvvvwww.....................",
  "...Vvvv.www.....................",
  "...vvv...ww.....................",
  "...vv.....w.....................",
  "..vv............................",
  "..v.............................",
  blank, blank, blank,
);
/** Cape blown back while running / jumping. */
const CAPE_FLOW = rows(
  blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank, blank,
  "........vv......................",
  ".......vvv......................",
  "......vvvv......................",
  "....VvvvvV......................",
  "...VVvvvvv......................",
  "..VVvvvvvv......................",
  ".VVvvvvvvv......................",
  ".Vvvvvvvvv......................",
  "Vvvvvvvvvv......................",
  "Vvvvvvvvvv......................",
  "Vvvvvvwvvv......................",
  "vvvvvwwvvv......................",
  "vvvvwww.vv......................",
  ".vvwww..vv......................",
  ".www....ww......................",
  "ww......ww......................",
  "w.......w.......................",
  blank, blank, blank, blank, blank, blank, blank, blank, blank, blank,
);

const pad = (list: string[], top: number, total = 44): string[] => {
  const out: string[] = [];
  for (let i = 0; i < top; i += 1) out.push(blank);
  out.push(...list);
  while (out.length < total) out.push(blank);
  return out.slice(0, total);
};

const body = (torso: string[], legs: string[], cape: string[] = CAPE) =>
  overlay(cape, pad([...HEAD, ...SCARF, ...torso, ...legs], 0));

const CROUCH = pad(
  [
    ...HEAD,
    ...SCARF,
    ".....oPPPPo.bbbbbb.oPPPPo.......",
    "....oPxxPPPpbBbbbbboPPxxPPo.....",
    "....PPxPPPPpbbbbbbbPPPPxPPP.....",
    "....pPPPPPppbbbbbbbppPPPPPp.....",
    ".....ppppp.bbgbbbbb.ppppp.......",
    "......sAa..qcccccq...aAs........",
    "......kKk..ccccccc...kKk........",
    "..........aAAAAAAAa.............",
    "........bbbsaaaaaasbbb..........",
    "......sAAbbb.....bbbAAs.........",
    ".....kKKkkkk.....kkkkKKk........",
    ".....kkkkkk.......kkkkkk........",
  ],
  10,
);
const CROUCH_THROW = overlay(CROUCH, pad(["......sAa..qcccccq..bbbbbbaAsK..", "......kKk..ccccccc...........k.."], 32));

const DEAD_A = pad(
  [
    "..............rr................",
    ".............r..r...............",
    "..........DlllllllD.............",
    ".........DLLLLLLLLlD............",
    "..........dllllllld.............",
    ".........DLLLLLLLLdD............",
    ".........DLLELLLLEdD............",
    ".........DLLELLLLEdD............",
    ".........DLLLLLLLldD............",
    "..........DlllllldD.............",
    "...........DDDDDD...............",
    ".....oPPPPqCcccccCqoPPPPo.......",
    "....oPxxPPPcccccccoPPxxPPo......",
    "....PPxPPPPpbbbbbbPPPPxPPP......",
    "....pPPPPPppbbbbbbppPPPPPp......",
    ".....ppppp.bbbBbbb.ppppp........",
    "......bbb..bbbbbbb..bbb.........",
    "......nbb..qcccccq..bbn.........",
    "......sAa..ccccccc..aAs.........",
    "......kKk.aAAAAAAAa.kKk.........",
    "........bbbsaaaaaasbbb..........",
    ".....sAAbbb.......bbbAAs........",
    "....kKKkkk.........kkkKKk.......",
    "....kkkkk...........kkkkk.......",
  ],
  20,
);

const DEAD_B = pad(
  [
    ".......................rr.......",
    "......................r..r......",
    "...................DlllllllD....",
    "..................DLLLLLLLLlD...",
    "...................dllllllld....",
    "....oPPPo.........DLLLLLLLLdD...",
    "...oPxxPPo........DLLELLLLEdD...",
    "..oPPxPPPPo.......DLLELLLLEdD...",
    "..pPPPPPPPp.......DLLLLLLLldD...",
    ".bbppppppbbb.......DlllllldD....",
    "bbbbbBbbbbbbb.......DDDDDD......",
    "aAAAAAAAAAaaa..sAAs.....kKKk....",
    "saaaaaaaaaaas..saas....kkKKk....",
    "kkKKkkkkkKKkk..kkkk....kkkkk....",
  ],
  30,
);

export const LANTERNE_FRAMES: Record<string, string[]> = {
  idle: body(TORSO, LEGS_IDLE),
  idle1: overlay(CAPE, [...pad([...HEAD, ...SCARF], 1).slice(0, 17), ...TORSO, ...LEGS_IDLE]),
  walk0: body(TORSO, LEGS_WALK_A, CAPE_FLOW),
  walk1: body(TORSO, LEGS_WALK_B, CAPE_FLOW),
  walk2: body(TORSO, LEGS_WALK_C, CAPE_FLOW),
  walk3: body(TORSO, LEGS_WALK_D, CAPE_FLOW),
  jump: body(TORSO, LEGS_JUMP, CAPE_FLOW),
  throw: body(TORSO_THROW, LEGS_IDLE),
  throwAir: body(TORSO_THROW, LEGS_JUMP, CAPE_FLOW),
  crouch: CROUCH,
  crouchThrow: CROUCH_THROW,
  deadA: DEAD_A,
  deadB: DEAD_B,
};

export const LANTERNE_BARE_MAP: Record<string, string> = { v: ".", V: ".", w: ".", P: ".", p: ".", o: ".", x: "." };
