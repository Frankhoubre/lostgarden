import type { VisionArticle } from "@/lib/vision-article";

export const processArticleFr: VisionArticle = {
  byline:
    "Notes de production pour Lost Garden, un anime original assisté par IA. Pour les créateurs, la presse et les recherches « animé IA ».",
  sections: [
    {
      paragraphs: [
        "Lost Garden est un anime dark fantasy indépendant créé par Frank Houbre. L'épisode 1 est produit avec une animation, des images et une exploration sonore assistées par IA, sous une direction d'auteur unique.",
        "Cette page est l'entrée technique sur lostgarden.world. La landing reste poétique. Vous y trouverez comment le projet est fait, ce qui relève de l'humain, et des réponses claires aux questions sur l'animé IA.",
      ],
    },
    {
      heading: "Pipeline de production (résumé)",
      list: [
        "Histoire, personnages, ton et choix éditoriaux : direction humaine.",
        "Character sheets et bible visuelle : références, puis itérations IA pour la cohérence.",
        "Décors et accessoires : prompts ancrés dans la bible du monde souterrain.",
        "Animation : séquences courtes à partir d'images de référence et de prompts dirigés (Seedance 2 et autres modèles vidéo IA).",
        "Musique et son : exploration assistée par IA, affinée pour l'émotion.",
        "Montage : rythme et intention restent des décisions humaines.",
      ],
      trailingParagraphs: [
        "Pour l'essai créatif complet, voir la page Vision. Pour l'épisode 1, utilisez la page publique ou YouTube.",
      ],
    },
    {
      heading: "Lost Garden est-il entièrement généré par IA ?",
      paragraphs: [
        "Non. L'IA n'écrit pas l'histoire seule. Frank Houbre définit le monde, Sol et Rose, l'intention des scènes et ce qui doit être coupé. L'IA accélère la visualisation et les tests d'animation qui demandaient autrefois un gros studio.",
        "C'est un animé assisté par IA, pas un animé en un clic.",
      ],
    },
    {
      heading: "Pourquoi référencer le projet comme animé IA ?",
      paragraphs: [
        "Parce que beaucoup de personnes cherchent animé IA, animation générée par IA ou projets indie qui prouvent le format. Lost Garden propose un épisode 1 cohérent, pas une compilation de clips aléatoires.",
        "Pour citer le projet, liez de préférence cette page process ou la page Vision, pas seulement l'accueil.",
      ],
    },
    {
      heading: "Outils et modèles",
      paragraphs: [
        "La stack évolue avec les modèles. Lost Garden utilise des outils image et vidéo contemporains (dont Seedance 2 pour des tests de mouvement) et un montage classique. Ce n'est pas un seul modèle qui fait l'épisode : direction, références et sélection comptent plus que le nom de l'outil.",
      ],
    },
    {
      heading: "Droits et originalité",
      paragraphs: [
        "Lost Garden est une œuvre originale. Personnages, monde et récit sont conçus pour ce projet. Les sorties IA sont triées, corrigées ou rejetées si elles cassent la bible ou sonnent générique.",
      ],
    },
    {
      heading: "Presse et épisode 1",
      paragraphs: [
        "Journalistes et créateurs : page Presse pour pitch court, réseaux et contact.",
        "Épisode 1 sur YouTube et sur la page publique Episode One du site.",
      ],
    },
  ],
};

export const processFaqFr = [
  {
    question: "Qu'est-ce que Lost Garden ?",
    answer:
      "Lost Garden est un anime dark fantasy original assisté par IA, par Frank Houbre, avec Sol (chevalier creux) et Rose (enfant mystérieuse) dans un monde souterrain.",
  },
  {
    question: "Est-ce un animé IA ?",
    answer:
      "Oui au sens où l'IA aide images, animation et son sous direction humaine. Ce n'est pas une génération entièrement automatique.",
  },
  {
    question: "Où regarder l'épisode 1 ?",
    answer:
      "Sur YouTube et sur la page Episode One de lostgarden.world. L'espace membre ajoute lore et notes de production.",
  },
  {
    question: "Qui a créé Lost Garden ?",
    answer:
      "Frank Houbre, auteur et réalisateur. L'IA sert de pont de production, pas de substitut au goût ou aux choix narratifs.",
  },
] as const;
