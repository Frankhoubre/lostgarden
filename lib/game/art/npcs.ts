/** Serrure, Bourdon, Barrik and Rose. */
import type { Palette } from "../pixel";

function rows(width: number, ...list: string[]): string[] {
  for (const r of list) {
    if (r.length !== width) throw new Error(`row width ${r.length} != ${width}: ${r}`);
  }
  return list;
}

/* Serrure: 32x46, half a head taller than Lanterne. Dark blue-grey helmet with a keyhole,
   scarf, layered pauldrons, long coat, two swords, golden key on the chest. */
export const SERRURE_PALETTE: Palette = {
  h: "#3e4759", // helmet
  H: "#525c70", // helmet light
  i: "#2c3342", // helmet shade
  K: "#0f1218", // keyhole
  s: "#333b4b", // scarf
  S: "#444e60", // scarf light
  o: "#2b3140", // coat
  O: "#3b4356", // coat light
  n: "#1d222d", // coat shadow
  g: "#d8ad4a", // key
  G: "#f0cc6e", // key light
  w: "#9aa3b1", // blade
  W: "#c9d0da", // blade light
  t: "#5a3d2a", // belt
  T: "#7a553c", // belt light
  k: "#1a1b22", // boots
};

export const SERRURE = rows(
  32,
  "...........HHHHHHHHi............",
  "..........HHhhhhhhhhi...........",
  "..........HhhhhhhhhHi...........",
  "..........Hhhhhhhhhhi...........",
  "..........HhhhKKhhhhi...........",
  "..........HhhhhKhhhhi...........",
  "..........HhhhhKhhhhi...........",
  "..........HhhhhKhhhhi...........",
  "..........Hhhhhhhhhhi...........",
  "..........hhhhhhhhhhi...........",
  "..........ihhhhhhhhii...........",
  ".........SSssssssssssS..........",
  "........SsssssssssssssS.........",
  ".......HHHHsssssssssHHHH........",
  "......HhhhhhssssssshhhhhH.......",
  ".....HhhhhhhhooGoohhhhhhhH......",
  ".....hhhhhhhhooggoohhhhhhhh.....",
  ".....ihhhhhhiooggooihhhhhhi.....",
  "......iiiii.OooggooO.iiiii......",
  ".......oo...OoogGooO...oo.......",
  ".......oo...OooooooO...oo.......",
  ".......OO...OooooooO...OO.......",
  ".......oo..TttttttttT..oo.......",
  ".......oo...tTttttTt...oo.......",
  "......WKK...OooooooO...KKW......",
  "......Ww....OooooooO....wW......",
  "......Ww....OooooooO....wW......",
  "......Ww....OooooooO....wW......",
  "......Ww....OooooooO....wW......",
  "......Ww....OooooooO....wW......",
  "......Ww....OooooooO....wW......",
  "......W.....OooooooO.....W......",
  "............OooooooO............",
  "............OooooooO............",
  "............OooooooO............",
  "............Ooooooon............",
  "............nooooonn............",
  ".............hhh.hhh............",
  ".............hhh.hhh............",
  ".............hhh.hhh............",
  ".............ihh.ihh............",
  ".............kkk.kkk............",
  "............kkkk.kkkk...........",
  "...........kkkkk.kkkkk..........",
  "................................",
  "................................",
);

/* Bourdon: 64x64 stone giant, fire beard, white eyes, yoke with two bells, little house. */
export const BOURDON_PALETTE: Palette = {
  s: "#43454c", // stone
  S: "#5a5d66", // stone light
  d: "#2b2c32", // stone dark
  c: "#e8632a", // cracks glowing
  e: "#f2f2f2", // eyes
  f: "#e58a2a", // beard fire
  F: "#f7c04a", // beard light
  b: "#4f6b5a", // green bell
  B: "#6f8f78", // green bell light
  n: "#2d2d2d", // black bell
  N: "#444444", // black bell light
  w: "#3f2d1f", // wood
  W: "#5f4733", // wood light
  r: "#2a2320", // roof
};

export const BOURDON = rows(
  64,
  "..........................wwwwwwwwwwww..........................",
  ".........................wWWWWWWWWWWWWw.........................",
  "........................wWrrrrrrrrrrrrWw........................",
  ".......................wWrrrrrrrrrrrrrrWw.......................",
  "........................wWWWWWWWWWWWWWWw........................",
  "........................wWwwwwwwwwwwwwWw........................",
  "........................wWwwWWWwwWWWwwWw........................",
  "........................wWwwWddWwWddWwWw........................",
  ".....wwwwwwwwwwwwwwwwwwwwWwwWWWwwWWWwwWwwwwwwwwwwwwwwwwwwwwww...",
  "....wWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWw..",
  ".....wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww..",
  ".......w.w..............wWwwwwwwwwwwwwWw..............w.w.......",
  ".......w.w..............wWwwwwwwwwwwwwWw..............w.w.......",
  ".....NNNNNNN............wwwwwwwwwwwwwwww............BBBBBBB.....",
  "....NnnnnnnnN...........SSSSSSSSSSSSSSSS...........BbbbbbbbB....",
  "....NnnnnnnnN..........SSSSSSSSSSSSSSSSSS..........BbbbbbbbB....",
  "...NnnnnnnnnnN.........SSSSSSSSSSSSSSSSSS.........BbbbbbbbbbB...",
  "...NnnnnnnnnnN........SSSSSSSSSSSSSSSSSSSS........BbbbbbbbbbB...",
  "...NnnnnnnnnnN........SSSSSeeSSSSSSSeeSSSS........BbbbbbbbbbB...",
  "...NnnnnnnnnnN........SSSSSeeSSSSSSSeeSSSS........BbbbbbbbbbB...",
  "...NnnnnnnnnnN........SSSSSSSSSSSSSSSSSSSS........BbbbbbbbbbB...",
  "..NnnnnnnnnnnnN.......SSSSSSSSSddSSSSSSSSS.......BbbbbbbbbbbbB..",
  "..NnnnnnnnnnnnN.......SSSSSSSSddddSSSSSSSS.......BbbbbbbbbbbbB..",
  "..NnnnnnnnnnnnN.......SSSSSfFffffffFfSSSSS.......BbbbbbbbbbbbB..",
  ".NnnnnnnnnnnnnnN......SSSSfFfFffffFfFfSSSS......BbbbbbbbbbbbbbB.",
  ".NnnnnnnnnnnnnnN......SSSfFffFfffFffFfSSSS......BbbbbbbbbbbbbbB.",
  ".NNNNNNNNNNNNNNN......sSSffFfffffffFffSSs.......BBBBBBBBBBBBBBB.",
  "...nn.nn.nn.nn.........sSSffFffffFffSSs.........bb.bb.bb.bb.....",
  "......................ssSSfFfffffFfSSss.........................",
  ".....................sssSSSffFffFfSSSsss........................",
  "...................ssssSSSSffffffSSSSssss.......................",
  "..................sssSSSSSSSSffffSSSSSSSsss.....................",
  ".................ssSSSSSSSSSSffffSSSSSSSSSss....................",
  "................ssSSSSSSSSSSSSffSSSSSSSSSSSss...................",
  "...............ssSSSSSSSSSSSSSSSSSSSSSSSSSSSss..................",
  "..............sssSSSSSSSSSSSSSSSSSSSSSSSSSSSSsss................",
  ".............ssssSSSSSSSSSSSSSSSSSSSSSSSSSSSSssss...............",
  "............sssssSSSSSSSSdSSSSSSSSSSSSdSSSSSsssss...............",
  "............sssssSSSSSSSSSSSSSSSSSSSSSSSSSSSSsssss..............",
  "...........ssssssSSSSSSSSSSSSSSSSSSSSSSSSSSSSssssss.............",
  "...........ssssssSSSSSSSSSSScSSSSSSSSSSSSSSSSssssss.............",
  "...........sssssscSSSSSSSSSSSSSSSSSSSSSSSSSSSssssss.............",
  "...........ssssss.SSSSSSSSSSSSSSSSSSSSSSSSSSS.ssssss............",
  "...........ssssss.SSSSSSSSSSSSSSSSSSSSSSSSSSS.ssssss............",
  "...........ssssss.SSSSSSSSSSSSSSSSSSSSSSSSSSS.ssssss............",
  "...........ssssss.SSSSSSSSSSSSSSSSSSSSSSSSSSS.ssssss............",
  "...........ssssss.SSSSSSSSSSSSSSScSSSSSSSSSSS.ssssss............",
  "...........sssss..SSSSSSSSSSSSSSSSSSSSSSSSSSS..sssss............",
  "...........sssss..sssSSSSSSSSSSSSSSSSSSSSSsss..sssss............",
  "...........ddddd..ssssssssssssssssssssssssss...ddddd............",
  "..................ssssssssssss.ssssssssssss.....................",
  "..................ssssssssssss.ssssssssssss.....................",
  "..................ssssssssssss.ssssssssssss.....................",
  "..................ssssssssssss.ssssssssssss.....................",
  "..................ssssssssssss.ssssssssssss.....................",
  ".................sssssssssssss.sssssssssssss....................",
  ".................sssssssssssss.sssssssssssss....................",
  ".................sssssssssssss.sssssssssssss....................",
  "................ssssssssssssss.ssssssssssssss...................",
  "................ssssssssssssss.ssssssssssssss...................",
  "...............sssssssssssssss.sssssssssssssss..................",
  "...............ddddddddddddddd.ddddddddddddddd..................",
  "................................................................",
  "................................................................",
  "................................................................",
);

/* Barrik: 32x42, a barrel on two legs. */
export const BARRIK_PALETTE: Palette = {
  w: "#8a5a2e", // wood
  W: "#ad763f", // wood light
  u: "#6b4420", // wood dark
  i: "#3a3230", // iron band
  I: "#5a4f4b", // iron light
  e: "#111016", // eye holes
  k: "#4a423d", // gauntlets
  K: "#2a2523", // gauntlet shadow
  m: "#6a5f58", // gauntlet light
};

export const BARRIK = rows(
  32,
  "..........iiiiiiiiiiii..........",
  ".........IIIIIIIIIIIIII.........",
  "........iWWWWWWWWWWWWWWi........",
  ".......iWwWwWwWwWwWwWwWwi.......",
  ".......WwWwWwWwWwWwWwWwWW.......",
  "......WwWwWwWwWwWwWwWwWwWw......",
  "......WwWwWweeWwWwWeeWwWwu......",
  "......iiiiiiieeiiiiieeiiii......",
  "......IIIIIIIIIIIIIIIIIIII......",
  "......WwWwWwWwWwWwWwWwWwWu......",
  "......WwWwWwWwWwWwWwWwWwWu......",
  ".....mWwWwWwWwWwWwWwWwWwWum.....",
  "....kkWwWwWwWwWwWwWwWwWwWukk....",
  "...kkkWwWwWwWwWwWwWwWwWwWukkk...",
  "...kkkiiiiiiiiiiiiiiiiiiiikkk...",
  "...kkkIIIIIIIIIIIIIIIIIIIIkkk...",
  "...KKk.WwWwWwWwWwWwWwWwWu.kKK...",
  "...KKk.WwWwWwWwWwWwWwWwWu.kKK...",
  "...KKK.WwWwWwWwWwWwWwWwWu.KKK...",
  "..mKKK.WwWwWwWwWwWwWwWwWu.KKKm..",
  "..mKKK.WwWwWwWwWwWwWwWwWu.KKKm..",
  "..KKKK..WwWwWwWwWwWwWwWu..KKKK..",
  "..KKKK..iiiiiiiiiiiiiiii..KKKK..",
  "........IIIIIIIIIIIIIIII........",
  ".........WwWwWwWwWwWwWu.........",
  "..........WwWwWwWwWwWu..........",
  "..........iiiiiiiiiiii..........",
  "..........IIIIIIIIIIII..........",
  "...........kkk....kkk...........",
  "...........kkk....kkk...........",
  "..........mkkk....kkkm..........",
  "..........KKKK....KKKK..........",
  "..........kkkk....kkkk..........",
  "..........kkkk....kkkk..........",
  "..........mkkk....kkkm..........",
  "..........KKKK....KKKK..........",
  ".........kkkkk....kkkkk.........",
  "........kkkkkk....kkkkkk........",
  ".......KKKKKKK....KKKKKKK.......",
  "................................",
  "................................",
  "................................",
);

/* Rose: 24x36, pink hair, white lily in her hair, violet cape. */
export const ROSE_PALETTE: Palette = {
  h: "#f2a7c8", // hair
  H: "#ffd0e4", // hair light
  u: "#d9799f", // hair shadow
  f: "#fff8c8", // lily
  y: "#ffd27a", // lily centre
  s: "#f7dcc9", // skin
  S: "#e6bfa8", // skin shadow
  e: "#3b2440", // eyes
  c: "#7c5a8a", // cape
  C: "#9f7cb0", // cape light
  n: "#5b3f68", // cape shadow
  d: "#e8e1d8", // dress
  k: "#3b2440", // shoes
};

export const ROSE = rows(
  24,
  "........HHhhhh..........",
  ".......HhhhhhhhH........",
  "......Hhhhhhhhhhh.......",
  ".....Hhhhhhhhhhhhu......",
  ".....hhhffhhhhhhhu......",
  ".....hhfyfhhhhhhhu......",
  ".....hhhffssssshhu......",
  ".....hhhssssssshhu......",
  ".....hhhsesssesShu......",
  ".....hhhssssssSShu......",
  ".....uhhsssssSShhu......",
  ".....uhhhSssSShhhu......",
  "......uhhhhhhhhhu.......",
  ".......uhhhhhhhu........",
  "........nCCCCCn.........",
  ".......nCCCCCCCn........",
  "......nCCcccccCCn.......",
  "......nCcccccccCn.......",
  "......nCcccccccCn.......",
  "......nCcccccccCn.......",
  "......nCcccccccCn.......",
  "......nCcccccccCn.......",
  "......nCcccccccCn.......",
  "......nCcccccccCn.......",
  "......nCcccccccCn.......",
  ".....nCCcccccccCCn......",
  ".....nCcccccccccCn......",
  ".....nnnnnnnnnnnnn......",
  ".......dddddddddd.......",
  ".......dddddddddd.......",
  "........ss.....ss.......",
  "........ss.....ss.......",
  "........ss.....ss.......",
  ".......kkk....kkk.......",
  "......kkkk....kkkk......",
  "........................",
);
