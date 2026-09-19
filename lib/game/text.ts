import type { Locale } from "@/lib/i18n/config";

export type GameText = {
  title: string;
  subtitle: string;
  pressStart: string;
  controlsHint: string;
  score: string;
  hiScore: string;
  time: string;
  stage: string;
  pause: string;
  resume: string;
  mute: string;
  gameOver: string;
  continueQ: string;
  yes: string;
  no: string;
  stageClear: string;
  timeBonus: string;
  timeOut: string;
  ready: string;
  weapons: Record<string, string>;
  levels: { title: string; intro: string }[];
  dialogue: Record<string, string>;
  ending: string[];
  thanks: string;
  bossNames: Record<string, string>;
  loading: string;
};

const fr: GameText = {
  title: "LOST GARDEN",
  subtitle: "Le Serment de la Lanterne",
  pressStart: "Appuie sur une touche",
  controlsHint: "Flèches : bouger · Z ou Espace : sauter · X : lancer · Bas : s'accroupir",
  score: "SCORE",
  hiScore: "RECORD",
  time: "TEMPS",
  stage: "ÉPREUVE",
  pause: "PAUSE",
  resume: "Appuie sur P pour reprendre",
  mute: "M : son",
  gameOver: "L'armure retombe dans la mousse.",
  continueQ: "Continuer ?",
  yes: "OUI",
  no: "NON",
  stageClear: "ÉPREUVE FRANCHIE",
  timeBonus: "BONUS DE TEMPS",
  timeOut: "Le temps s'est éteint.",
  ready: "PRÊT",
  weapons: {
    lueur: "LUEUR",
    cle: "CLÉ DE SERRURE",
    dague: "DAGUE",
    cloche: "CLOCHE DE BOURDON",
  },
  levels: [
    {
      title: "La Forêt des champignons bleus",
      intro:
        "Vingt siècles après la fin du monde, une armure vide s'éveille sous la terre. Le médaillon s'allume en bleu : Rose est quelque part, et elle attend.",
    },
    {
      title: "Le Monde des chaînes",
      intro:
        "Des chaînes épaisses comme des troncs. Serrure a posé la règle : à partir de maintenant, le médaillon reste fermé. Trop tard. Un Décrocheur est venu pour toi.",
    },
    {
      title: "Le Château penché",
      intro:
        "Un château transpercé par une racine, incliné, où l'on marche de travers. Bourdon coule des cloches dans sa forge. Dans la salle d'armures, quelque chose a bougé.",
    },
  ],
  dialogue: {
    serrure1: "Oh ! Encore un chevalier ! Suis la lumière bleue de ton pendentif, et tu trouveras Rose.",
    serrure2: "Un Décrocheur est venu pour nous. C'est ma faute. Cours, je m'occupe du reste.",
    bourdon: "HO HO HO ! Un creux qui marche ! Repose-toi près du feu, petit. Mes souris veilleront.",
    barrik: "Barrik ! Le pire... et le plus chanceux des chevaliers qui aient jamais existé !",
    rose: "Trouve-moi.",
    lanterne: "...",
    machine: "La machine s'éveille dans la mousse.",
    decrocheur: "Le Décrocheur a senti ton médaillon.",
    sombre: "Le Chevalier Sombre n'est plus lui-même.",
  },
  ending: [
    "Le tunnel blanc s'ouvre sur un champ de lys.",
    "Une enfant aux cheveux roses se retourne.",
    "Le médaillon brûle de bleu. Le serment tient encore.",
    "Ce n'est pas la fin. C'est le début du chemin vers le Jardin Oublié.",
  ],
  thanks: "Merci d'avoir joué. Lost Garden, un anime de Frank Houbre.",
  bossNames: {
    machine: "LA MACHINE",
    decrocheur: "LE DÉCROCHEUR",
    sombre: "LE CHEVALIER SOMBRE",
  },
  loading: "Le feu se rallume...",
};

const en: GameText = {
  title: "LOST GARDEN",
  subtitle: "The Lantern's Oath",
  pressStart: "Press any key",
  controlsHint: "Arrows: move · Z or Space: jump · X: throw · Down: crouch",
  score: "SCORE",
  hiScore: "HI-SCORE",
  time: "TIME",
  stage: "STAGE",
  pause: "PAUSE",
  resume: "Press P to resume",
  mute: "M: sound",
  gameOver: "The armour sinks back into the moss.",
  continueQ: "Continue?",
  yes: "YES",
  no: "NO",
  stageClear: "STAGE CLEAR",
  timeBonus: "TIME BONUS",
  timeOut: "The light went out.",
  ready: "READY",
  weapons: {
    lueur: "GLIMMER",
    cle: "SERRURE'S KEY",
    dague: "DAGGER",
    cloche: "BOURDON'S BELL",
  },
  levels: [
    {
      title: "The Blue Mushroom Forest",
      intro:
        "Twenty centuries after the end of the world, an empty suit of armour wakes beneath the earth. The medallion glows blue: Rose is somewhere out there, waiting.",
    },
    {
      title: "The World of Chains",
      intro:
        "Chains as thick as tree trunks. Serrure set the rule: from now on, the medallion stays closed. Too late. A Decrocheur has come for you.",
    },
    {
      title: "The Leaning Castle",
      intro:
        "A castle pierced by a root, tilted, where you walk sideways. Bourdon casts bells in his forge. In the hall of armours, something moved.",
    },
  ],
  dialogue: {
    serrure1: "Oh! Another knight! Follow the blue light of your pendant, and you will find Rose.",
    serrure2: "A Decrocheur has come for us. It's my fault. Run, I'll handle the rest.",
    bourdon: "HO HO HO! A hollow one, walking! Rest by the fire, little one. My mice will keep watch.",
    barrik: "Barrik! The worst... and the luckiest knight there ever was!",
    rose: "Find me.",
    lanterne: "...",
    machine: "The machine wakes in the moss.",
    decrocheur: "The Decrocheur has sensed your medallion.",
    sombre: "The Dark Knight is no longer himself.",
  },
  ending: [
    "The white tunnel opens onto a field of lilies.",
    "A child with pink hair turns around.",
    "The medallion burns blue. The oath still holds.",
    "This is not the end. It is the start of the road to the Forgotten Garden.",
  ],
  thanks: "Thank you for playing. Lost Garden, an anime by Frank Houbre.",
  bossNames: {
    machine: "THE MACHINE",
    decrocheur: "THE DECROCHEUR",
    sombre: "THE DARK KNIGHT",
  },
  loading: "The fire rekindles...",
};

const ja: GameText = {
  title: "LOST GARDEN",
  subtitle: "ランタンの誓い",
  pressStart: "キーを押してください",
  controlsHint: "矢印：移動 · ZかSpace：ジャンプ · X：投げる · 下：しゃがむ",
  score: "スコア",
  hiScore: "ハイスコア",
  time: "タイム",
  stage: "ステージ",
  pause: "ポーズ",
  resume: "Pで再開",
  mute: "M：サウンド",
  gameOver: "鎧は苔の中へ沈んだ。",
  continueQ: "コンティニュー？",
  yes: "はい",
  no: "いいえ",
  stageClear: "ステージクリア",
  timeBonus: "タイムボーナス",
  timeOut: "灯が消えた。",
  ready: "READY",
  weapons: {
    lueur: "ひかり",
    cle: "セリュールの鍵",
    dague: "短剣",
    cloche: "ブルドンの鐘",
  },
  levels: [
    {
      title: "青いキノコの森",
      intro:
        "世界の終わりから二十世紀。空っぽの鎧が地下で目覚める。メダルが青く光る。ローズはどこかで待っている。",
    },
    {
      title: "鎖の世界",
      intro:
        "幹のように太い鎖。セリュールの掟：これからメダルは閉じたまま。もう遅い。デクロシュールがお前を狙って来た。",
    },
    {
      title: "傾いた城",
      intro:
        "巨大な根に貫かれ、傾いた城。ブルドンは炉で鐘を鋳る。鎧の広間で、何かが動いた。",
    },
  ],
  dialogue: {
    serrure1: "おお！また騎士か！ペンダントの青い光を追え。ローズが見つかる。",
    serrure2: "デクロシュールが来た。俺のせいだ。走れ、あとは任せろ。",
    bourdon: "ホッホッホ！歩く空っぽだ！火のそばで休みな。ネズミたちが見張ってくれる。",
    barrik: "バリク！史上最悪で…史上最も運のいい騎士！",
    rose: "わたしを見つけて。",
    lanterne: "...",
    machine: "苔の中で機械が目覚める。",
    decrocheur: "デクロシュールがメダルを感じ取った。",
    sombre: "暗黒の騎士はもう自分ではない。",
  },
  ending: [
    "白いトンネルの先に、百合の野が開く。",
    "桃色の髪の子が振り向く。",
    "メダルが青く燃える。誓いはまだ続いている。",
    "これは終わりではない。忘れられた庭への道の始まりだ。",
  ],
  thanks: "プレイありがとう。Lost Garden、Frank Houbre のアニメ。",
  bossNames: {
    machine: "ザ・マシン",
    decrocheur: "デクロシュール",
    sombre: "暗黒の騎士",
  },
  loading: "火が再び灯る...",
};

const ko: GameText = {
  title: "LOST GARDEN",
  subtitle: "랜턴의 맹세",
  pressStart: "아무 키나 누르세요",
  controlsHint: "방향키: 이동 · Z 또는 Space: 점프 · X: 던지기 · 아래: 웅크리기",
  score: "점수",
  hiScore: "최고 점수",
  time: "시간",
  stage: "스테이지",
  pause: "일시정지",
  resume: "P를 눌러 계속",
  mute: "M: 소리",
  gameOver: "갑옷이 이끼 속으로 가라앉는다.",
  continueQ: "계속할까요?",
  yes: "예",
  no: "아니오",
  stageClear: "스테이지 클리어",
  timeBonus: "시간 보너스",
  timeOut: "불빛이 꺼졌다.",
  ready: "READY",
  weapons: {
    lueur: "빛",
    cle: "세뤼르의 열쇠",
    dague: "단검",
    cloche: "부르동의 종",
  },
  levels: [
    {
      title: "푸른 버섯의 숲",
      intro:
        "세상이 끝나고 스무 세기가 지났다. 빈 갑옷이 땅속에서 깨어난다. 메달이 푸르게 빛난다. 로즈는 어딘가에서 기다리고 있다.",
    },
    {
      title: "사슬의 세계",
      intro:
        "나무 줄기처럼 굵은 사슬. 세뤼르의 규칙: 이제부터 메달은 닫아 둔다. 너무 늦었다. 데크로슈르가 너를 찾아왔다.",
    },
    {
      title: "기울어진 성",
      intro:
        "거대한 뿌리에 꿰뚫려 기울어진 성. 부르동은 대장간에서 종을 주조한다. 갑옷의 전당에서 무언가 움직였다.",
    },
  ],
  dialogue: {
    serrure1: "오! 또 기사인가! 펜던트의 푸른 빛을 따라가. 로즈를 찾을 거야.",
    serrure2: "데크로슈르가 우리를 찾아왔어. 내 잘못이야. 달려, 나머지는 내가 맡을게.",
    bourdon: "호호호! 걸어다니는 빈 갑옷이군! 불 옆에서 쉬어라. 내 생쥐들이 지켜 줄 거야.",
    barrik: "바릭! 역사상 최악의… 그리고 가장 운 좋은 기사!",
    rose: "나를 찾아줘.",
    lanterne: "...",
    machine: "기계가 이끼 속에서 깨어난다.",
    decrocheur: "데크로슈르가 네 메달을 감지했다.",
    sombre: "어둠의 기사는 더 이상 그 자신이 아니다.",
  },
  ending: [
    "하얀 터널 끝에 백합 들판이 열린다.",
    "분홍 머리의 아이가 돌아본다.",
    "메달이 푸르게 타오른다. 맹세는 아직 살아 있다.",
    "이것은 끝이 아니다. 잊혀진 정원으로 가는 길의 시작이다.",
  ],
  thanks: "플레이해 주셔서 감사합니다. Lost Garden, Frank Houbre의 애니메이션.",
  bossNames: {
    machine: "기계",
    decrocheur: "데크로슈르",
    sombre: "어둠의 기사",
  },
  loading: "불이 다시 붙는다...",
};

const TEXTS: Record<Locale, GameText> = { fr, en, ja, ko };

export function getGameText(locale: Locale): GameText {
  return TEXTS[locale] ?? en;
}
