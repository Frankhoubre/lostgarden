/**
 * Sprite registry. All art lives in ./art and is rasterised on first use.
 */
import { remap, sprite, type Palette, type Sprite } from "./pixel";
import { LANTERNE_BARE_MAP, LANTERNE_FRAMES, LANTERNE_PALETTE } from "./art/lanterne";
import { BARRIK, BARRIK_PALETTE, BOURDON, BOURDON_PALETTE, ROSE, ROSE_PALETTE, SERRURE, SERRURE_PALETTE } from "./art/npcs";
import * as E from "./art/enemies";
import * as B from "./art/bosses";
import * as W from "./art/world";

export function lanterneSprite(frame: string, bare: boolean): Sprite {
  const rows = LANTERNE_FRAMES[frame] ?? LANTERNE_FRAMES.idle;
  if (bare) {
    return sprite(`lanterne-bare:${frame}`, { rows: remap(rows, LANTERNE_BARE_MAP), palette: LANTERNE_PALETTE });
  }
  return sprite(`lanterne:${frame}`, { rows, palette: LANTERNE_PALETTE });
}

type ArtDef = { rows: string[]; palette: Palette; outline?: boolean; rim?: boolean; outlineColor?: string };

const tile = (rows: string[], palette: Palette): ArtDef => ({ rows, palette, outline: false, rim: false });

const ART: Record<string, ArtDef> = {
  serrure: { rows: SERRURE, palette: SERRURE_PALETTE },
  barrik: { rows: BARRIK, palette: BARRIK_PALETTE },
  rose: { rows: ROSE, palette: ROSE_PALETTE },
  bourdon: { rows: BOURDON, palette: BOURDON_PALETTE },

  spore0: { rows: E.SPORE_A, palette: E.SPORE_PALETTE },
  spore1: { rows: E.SPORE_B, palette: E.SPORE_PALETTE },
  meduse0: { rows: E.MEDUSE_A, palette: E.MEDUSE_PALETTE, outline: false },
  meduse1: { rows: E.MEDUSE_B, palette: E.MEDUSE_PALETTE, outline: false },
  penitent0: { rows: E.PENITENT_A, palette: E.PENITENT_PALETTE },
  penitent1: { rows: E.PENITENT_B, palette: E.PENITENT_PALETTE },
  rouage0: { rows: E.ROUAGE_A, palette: E.ROUAGE_PALETTE },
  rouage1: { rows: E.ROUAGE_B, palette: E.ROUAGE_PALETTE },
  loup0: { rows: E.LOUP_A, palette: E.LOUP_PALETTE },
  loup1: { rows: E.LOUP_B, palette: E.LOUP_PALETTE },
  reptile0: { rows: E.REPTILE_A, palette: E.REPTILE_PALETTE },
  reptile1: { rows: E.REPTILE_B, palette: E.REPTILE_PALETTE },
  colosse0: { rows: E.COLOSSE_A, palette: E.COLOSSE_PALETTE },
  colosse1: { rows: E.COLOSSE_B, palette: E.COLOSSE_PALETTE },
  golem0: { rows: E.GOLEM_A, palette: E.GOLEM_PALETTE },
  golem1: { rows: E.GOLEM_B, palette: E.GOLEM_PALETTE },
  souris: { rows: E.SOURIS, palette: E.SOURIS_PALETTE },

  machine: { rows: B.MACHINE, palette: B.MACHINE_PALETTE },
  decrocheur: { rows: B.DECROCHEUR, palette: B.DECROCHEUR_PALETTE },
  scythe: { rows: B.SCYTHE, palette: B.SCYTHE_PALETTE },
  sombre0: { rows: B.SOMBRE_A, palette: B.SOMBRE_PALETTE },
  sombre1: { rows: B.SOMBRE_B, palette: B.SOMBRE_PALETTE },
  greatsword: { rows: B.GREATSWORD, palette: B.GREATSWORD_PALETTE },

  chestClosed: { rows: W.CHEST_CLOSED, palette: W.CHEST_PALETTE },
  chestOpen: { rows: W.CHEST_OPEN, palette: W.CHEST_PALETTE },
  itemLueur: { rows: W.ITEM_LUEUR, palette: W.ITEM_PALETTE, outline: false },
  itemCle: { rows: W.ITEM_CLE, palette: W.ITEM_PALETTE },
  itemDague: { rows: W.ITEM_DAGUE, palette: W.ITEM_PALETTE },
  itemCloche: { rows: W.ITEM_CLOCHE, palette: W.ITEM_PALETTE },
  itemCape: { rows: W.ITEM_CAPE, palette: W.ITEM_PALETTE },
  itemMedaillon: { rows: W.ITEM_MEDAILLON, palette: W.ITEM_PALETTE },
  itemLys: { rows: W.ITEM_LYS, palette: W.ITEM_PALETTE },

  projLueur: { rows: W.PROJ_LUEUR, palette: W.PROJ_PALETTE, outline: false, rim: false },
  projDague: { rows: W.PROJ_DAGUE, palette: W.PROJ_PALETTE },
  projCle: { rows: W.PROJ_CLE, palette: W.PROJ_PALETTE },
  projCloche: { rows: W.PROJ_CLOCHE, palette: W.PROJ_PALETTE },
  projSpark: { rows: W.PROJ_SPARK, palette: W.PROJ_PALETTE, outline: false, rim: false },
  projShard: { rows: W.PROJ_SHARD, palette: W.PROJ_PALETTE, outline: false, rim: false },

  tileForestGround: tile(W.FOREST_GROUND, W.FOREST_PALETTE),
  tileForestRock: tile(W.FOREST_ROCK, W.FOREST_PALETTE),
  tileForestRockB: tile(W.FOREST_ROCK_B, W.FOREST_PALETTE),
  tileMushroom: { rows: W.MUSHROOM_CAP, palette: W.MUSHROOM_PALETTE, rim: false },
  tileChain: { rows: W.CHAIN_PLATFORM, palette: W.CHAIN_PALETTE, rim: false },
  tileBoneGround: tile(W.BONE_GROUND, W.BONE_PALETTE),
  tileBoneRock: tile(W.BONE_ROCK, W.BONE_PALETTE),
  tileBoneRockB: tile(W.BONE_ROCK_B, W.BONE_PALETTE),
  tileCastleStone: tile(W.CASTLE_STONE, W.CASTLE_PALETTE),
  tileCastleFloor: tile(W.CASTLE_FLOOR, W.CASTLE_PALETTE),
  tileBeam: { rows: W.CASTLE_BEAM, palette: W.BEAM_PALETTE, rim: false },
  tileThorns: { rows: W.THORNS, palette: W.THORNS_PALETTE, outline: false, rim: false },
  tileWhiteGround: tile(W.WHITE_GROUND, W.WHITE_PALETTE),

  decoGrass: { rows: W.DECO_GRASS, palette: W.DECO_PALETTE, outline: false },
  decoMushroomSmall: { rows: W.DECO_MUSHROOM_SMALL, palette: W.DECO_PALETTE },
  decoMushroomTall: { rows: W.DECO_MUSHROOM_TALL, palette: W.DECO_PALETTE },
  decoCandle: { rows: W.DECO_CANDLE, palette: W.DECO_PALETTE, outline: false },
  decoCandelabra: { rows: W.DECO_CANDELABRA, palette: W.DECO_PALETTE, outline: false },
  decoSkull: { rows: W.DECO_SKULL, palette: W.DECO_PALETTE },
  decoBones: { rows: W.DECO_BONES, palette: W.DECO_PALETTE, outline: false },
  decoChainHook: { rows: W.DECO_CHAIN_HOOK, palette: W.DECO_PALETTE },
  decoBanner: { rows: W.DECO_BANNER, palette: W.DECO_PALETTE },
};

export function getSprite(name: string): Sprite {
  const def = ART[name];
  if (!def) throw new Error(`Unknown sprite: ${name}`);
  return sprite(name, def);
}

export function hasSprite(name: string): boolean {
  return name in ART;
}
