/** In-game text, French and English. The game keeps its own language setting, separate from the site's. */

export type Lang = "fr" | "en";

export type HintId = "move" | "jump" | "throw" | "crouch" | "roll" | "charge" | "tunnel" | "sleeper" | "hide" | "sleeper2";

export type GameStrings = {
  zones: Record<string, string>;
  hints: Record<HintId, string>;
  gong: { title: string; lines: string[] };
  serrure: { title: string; lines: string[]; trade: string[]; offer: string };
  wake: string;
  boss: string;
  clear: { title: string; sub: string; line: string; replay: string };
  death: string;
  menu: { title: string; resume: string; music: string; sfx: string; lang: string; controls: string; restart: string; on: string; off: string; back: string; hint: string };
  controls: string[];
};

export const STRINGS: Record<Lang, GameStrings> = {
  fr: {
    zones: {
      eveil: "L'Eveil",
      corniches: "Les Corniches",
      racines: "La Descente des Racines",
      gong: "Le Gong des Pelerins",
      chemin: "Le Chemin Profond",
      taverne: "La Taverne de Serrure",
      cimetiere: "Le Cimetiere des Machines",
      arene: "L'Arene",
    },
    hints: {
      move: "Flèches ou Q / D : marcher.",
      jump: "Z, W ou Espace : sauter. Relâche tôt pour un petit saut.",
      throw: "X : lancer la lueur.",
      crouch: "Bas : s'accroupir. La lumière se cache, la lueur part au ras du sol.",
      roll: "C ou Maj : roulade. Rien ne te touche pendant la roulade.",
      charge: "Garde X enfoncé après un lancer, puis relâche : lueur chargée.",
      tunnel: "Accroupi, on passe sous les racines.",
      sleeper: "Ne réveille pas un Dormant.",
      hide: "Ne montre pas ta lumière près des chemins profonds. Elle appelle la meute.",
      sleeper2: "Les machines dorment. L'une d'elles veille.",
    },
    gong: { title: "LES PELERINS", lines: ["Le gong résonne dans l'abîme.", "L'armure se souvient d'elle-même."] },
    serrure: {
      title: "SERRURE",
      lines: ["Oh ! Encore un chevalier !", "Suis la lumière bleue de ton pendentif,", "et tu trouveras Rose."],
      trade: ["Des lys pâles ! Garde-les contre ton coeur.", "L'armure se souvient d'une vie de plus."],
      offer: "BAS : 3 LYS = 1 COEUR",
    },
    wake: "La machine s'éveille dans la mousse.",
    boss: "LA MACHINE",
    clear: { title: "EPREUVE FRANCHIE", sub: "La forêt des champignons bleus", line: "Le médaillon brûle de bleu. Rose est plus proche.", replay: "X pour rejouer" },
    death: "L'armure retombe dans la mousse.",
    menu: { title: "PAUSE", resume: "Reprendre", music: "Musique", sfx: "Effets", lang: "Langue", controls: "Commandes", restart: "Recommencer", on: "oui", off: "non", back: "Retour", hint: "Haut / Bas : choisir   X ou Entree : valider   Echap : reprendre" },
    controls: [
      "Flèches ou Q / D : se déplacer",
      "Z, W, Espace ou Haut : sauter",
      "Bas : s'accroupir   Bas + saut : descendre",
      "X, K ou Entree : lancer la lueur",
      "Maintenir X puis relâcher : lueur chargée",
      "C, L ou Maj : roulade",
      "Echap ou P : pause   M : son",
    ],
  },
  en: {
    zones: {
      eveil: "The Waking",
      corniches: "The Ledges",
      racines: "The Descent of the Roots",
      gong: "The Pilgrims' Gong",
      chemin: "The Deep Path",
      taverne: "Serrure's Tavern",
      cimetiere: "The Graveyard of Machines",
      arene: "The Arena",
    },
    hints: {
      move: "Arrow keys or A / D: walk.",
      jump: "Z, W or Space: jump. Release early for a short hop.",
      throw: "X: throw the glimmer.",
      crouch: "Down: crouch. Your light hides, the glimmer skims the ground.",
      roll: "C or Shift: dodge roll. Nothing touches you while rolling.",
      charge: "Keep X held after a throw, then release: charged glimmer.",
      tunnel: "Crouched, you pass under the roots.",
      sleeper: "Do not wake a Sleeper.",
      hide: "Do not show your light near the deep paths. It calls the pack.",
      sleeper2: "The machines sleep. One of them watches.",
    },
    gong: { title: "THE PILGRIMS", lines: ["The gong rings through the abyss.", "The armour remembers itself."] },
    serrure: {
      title: "SERRURE",
      lines: ["Oh! Another knight!", "Follow the blue light of your pendant,", "and you will find Rose."],
      trade: ["Pale lilies! Keep them against your heart.", "The armour remembers one more life."],
      offer: "DOWN: 3 LILIES = 1 HEART",
    },
    wake: "The machine wakes in the moss.",
    boss: "THE MACHINE",
    clear: { title: "TRIAL PASSED", sub: "The blue mushroom forest", line: "The medallion burns blue. Rose is closer.", replay: "X to play again" },
    death: "The armour sinks back into the moss.",
    menu: { title: "PAUSED", resume: "Resume", music: "Music", sfx: "Sound effects", lang: "Language", controls: "Controls", restart: "Restart", on: "on", off: "off", back: "Back", hint: "Up / Down: choose   X or Enter: confirm   Esc: resume" },
    controls: [
      "Arrow keys or A / D: move",
      "Z, W, Space or Up: jump",
      "Down: crouch   Down + jump: drop through",
      "X, K or Enter: throw the glimmer",
      "Hold X then release: charged glimmer",
      "C, L or Shift: dodge roll",
      "Esc or P: pause   M: sound",
    ],
  },
};
