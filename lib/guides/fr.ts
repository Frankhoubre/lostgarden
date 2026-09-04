import type { Guide, GuideSlug } from "@/lib/guide-article";

const howToMakeAiAnime: Guide = {
  article: {
    byline:
      "Le pipeline derrière l'épisode 1 de Lost Garden, dix-sept minutes d'animation faites par une seule personne. Écrit pour ceux qui veulent essayer, pas pour ceux à qui on veut vendre un outil.",
    sections: [
      {
        paragraphs: [
          "La plupart des guides sur le sujet sont des tests d'outils déguisés en tutoriels. Celui-ci est l'ordre des opérations qui a réellement produit un épisode fini, y compris les étapes qui font perdre le plus de temps.",
          "En une phrase : la contrainte, c'est le scénario, pas le modèle. Tout le reste en découle.",
        ],
      },
      {
        heading: "1. Écrire le scénario avant d'ouvrir le moindre générateur",
        paragraphs: [
          "La tentation est de générer un beau plan d'abord, puis de bâtir une histoire autour. Ce chemin produit une bande d'ambiance, jamais un épisode. Un plan qui existe avant la scène ne sert rien, et vous le garderez par attachement plutôt que par utilité.",
          "Écrivez des scènes avec une intention. Qu'est-ce que cette scène change. Que sait le spectateur à la fin qu'il ne savait pas au début. Si une scène rate ce test sur le papier, aucune génération ne la sauvera.",
          "Sur Lost Garden, le scénario est écrit à la main dans ScreenWeaver, qui garde le texte comme unique source de vérité pour tout ce qui suit.",
        ],
      },
      {
        heading: "2. Construire la bible du monde avant la première image",
        paragraphs: [
          "Une bible est un document court qui fixe ce qui ne peut pas changer : la lumière, la palette, les matières, les règles du lieu. Pour le monde souterrain de Lost Garden, ça veut dire des forêts bleues, de la brume cyan, de la pierre humide, et jamais de soleil.",
          "Ce n'est pas du worldbuilding pour le plaisir. C'est la référence contre laquelle vous vérifiez un plan généré, et c'est ce qui vous permet de refuser une image qui est belle mais qui appartient à un autre film.",
        ],
        callouts: [
          "Une bible est un outil de refus. Sa valeur se mesure aux plans que vous jetez.",
        ],
      },
      {
        heading: "3. Storyboarder à partir du scénario, scène par scène",
        paragraphs: [
          "Le storyboard est le moment où vous découvrez que la moitié de vos scènes n'ont pas de caméra. Une page de dialogue ne devient une séquence que quand quelqu'un décide où se placer.",
          "Des planches générées suffisent à ce stade, puisque vous décidez du cadre et du rythme, pas de l'image finale. Ce qui compte, c'est que chaque plan ait une raison : ce qu'il montre, pourquoi il vient après le précédent, combien de temps il doit durer.",
        ],
      },
      {
        heading: "4. Verrouiller les personnages avant de générer un seul plan",
        paragraphs: [
          "C'est l'étape que tout le monde saute, et c'est elle qui décide si votre épisode se regarde comme un film ou comme un diaporama d'inconnus qui se ressemblent.",
          "Constituez un jeu de références par personnage : visage, corps entier, silhouette, et les deux ou trois angles que vous utiliserez vraiment. Gardez ces références à côté des plans qui les utilisent, pas dans un dossier que vous oublierez. La cohérence est un problème de pipeline, pas de prompt, et elle a son propre guide.",
        ],
      },
      {
        heading: "5. Générer les plans, et s'attendre à en jeter la plupart",
        paragraphs: [
          "Le ratio réel est inconfortable. Beaucoup de plans demandent plusieurs tentatives, certains une douzaine, et certaines scènes finissent réécrites parce que le plan dont elles ont besoin n'existe encore à aucune qualité.",
          "Deux habitudes font gagner le plus de temps. Générer à la durée dont le montage a besoin plutôt qu'à celle que propose le modèle, parce qu'un plan généré long dérive et que vous le couperez de toute façon. Et juger une prise contre la bible avant de la juger contre votre goût.",
          "Sur Lost Garden, la génération image et vidéo tourne sur Imaginode, qui réunit un large catalogue de modèles derrière un seul canvas. L'enjeu n'est pas le choix du modèle, c'est de pouvoir tester le même plan sur plusieurs modèles sans tout reconstruire à chaque fois.",
        ],
      },
      {
        heading: "6. Monter en monteur, pas en prompteur",
        paragraphs: [
          "Le montage est l'endroit où un film assisté par IA devient un film, ou reste une collection de clips. Le rythme, les temps de pause, quand rester sur un visage, quand couper avant que le spectateur remarque un défaut : rien de tout ça ne sort d'un modèle.",
          "Couper sur le mouvement masque beaucoup de dérive. Faire confiance à un plan plus court aussi. L'envie de tenir sur une belle image générée est presque toujours une mauvaise idée.",
        ],
      },
      {
        heading: "7. Le son fait la moitié du film, et c'est la moitié qu'on saute",
        paragraphs: [
          "Des pas sur la pierre humide, le grincement d'une armure vide, la distance dans une caverne. Le son est ce qui convainc le spectateur que l'espace existe, et il y contribue davantage que n'importe quel gain de résolution.",
          "La musique en dernier, et en moins grande quantité que vous ne le pensez. Une nappe générée sous chaque scène aplatit l'épisode en bande-annonce.",
        ],
      },
      {
        heading: "Ce que ça coûte vraiment",
        paragraphs: [
          "Du temps, essentiellement. L'épisode 1 de Lost Garden dure dix-sept minutes et a été écrit, réalisé, généré, monté et fini par une seule personne. C'est possible aujourd'hui et ça ne l'était pas il y a trois ans, et c'est ça la vraie nouveauté.",
          "Ce n'est pas rapide. Quiconque promet un épisode fini en un week-end vend une démo.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Quel est le minimum pour commencer ?",
      answer:
        "Un scénario, une bible du monde, et un jeu de références par personnage. Les outils de génération comptent beaucoup moins que ces trois documents, et démarrer sans eux est la raison la plus fréquente pour laquelle un projet s'enlise.",
    },
    {
      question: "Quel modèle d'IA utiliser pour de l'animé ?",
      answer:
        "Celui qui tient le mieux vos références de personnages, et le classement change tous les quelques mois. Choisissez un dispositif qui permet de tester le même plan sur plusieurs modèles plutôt que de vous enfermer dans un seul, et jugez sur la cohérence plutôt que sur la plus jolie image isolée.",
    },
    {
      question: "Combien de temps prend un épisode d'animé IA ?",
      answer:
        "Pour dix-sept minutes faites par une seule personne, comptez en mois, pas en week-ends. L'essentiel du temps passe dans les plans refusés et dans le montage, pas dans les prompts.",
    },
    {
      question: "Faut-il savoir dessiner ?",
      answer:
        "Non, mais il faut savoir regarder. La compétence qui compte est de savoir dire ce qui ne va pas dans un plan et pourquoi, ce qui relève de la réalisation et du montage bien plus que du dessin.",
    },
  ],
  related: [
    { label: "Un animé fait par IA est-il un vrai animé ?", href: "/is-ai-anime-real-anime" },
    { label: "Animé IA contre animation traditionnelle", href: "/ai-anime-vs-traditional-animation" },
    { label: "Garder un personnage cohérent d'un plan à l'autre", href: "/ai-character-consistency" },
    { label: "Le top 6 des animés créés par IA", href: "/best-ai-anime" },
    { label: "Notes de production de Lost Garden", href: "/process" },
    { label: "Imaginode, la plateforme de génération utilisée", href: "https://imaginode.ai" },
  ],
};

const characterConsistency: Guide = {
  article: {
    byline:
      "Pourquoi les personnages générés dérivent d'un plan à l'autre, et les méthodes de travail qui gardent un visage reconnaissable sur dix-sept minutes.",
    sections: [
      {
        paragraphs: [
          "C'est le problème qui arrête la plupart des projets d'animation IA. Un plan isolé est superbe. Deux plans côte à côte donnent deux personnes différentes dans le même costume, et l'illusion s'effondre.",
          "Aucun réglage ne règle ça. Il existe des habitudes qui le réduisent à quelque chose qu'un montage peut absorber.",
        ],
      },
      {
        heading: "Pourquoi les prompts seuls échouent toujours",
        paragraphs: [
          "Une description écrite est un moyen à très faible débit de spécifier un visage. Cheveux argentés, yeux verts et une cicatrice décrit des milliers de personnes différentes, et un modèle vous en donnera volontiers une nouvelle à chaque fois.",
          "Ajouter des adjectifs aggrave la situation au lieu de l'améliorer. Les prompts longs dérivent davantage, parce que chaque terme supplémentaire est une chose de plus que le modèle peut pondérer autrement d'une génération à l'autre.",
        ],
        callouts: [
          "Chaque détail que vous spécifiez en mots plutôt qu'en image est un détail qui changera d'un plan à l'autre.",
        ],
      },
      {
        heading: "Les images de référence battent les descriptions, toujours",
        paragraphs: [
          "Constituez un jeu de références par personnage et réutilisez-le partout : un visage net à hauteur d'œil, un corps entier, une silhouette, et les angles précis que votre storyboard demande. Le trois quarts et le profil valent l'effort, parce que c'est là que la dérive se voit le plus.",
          "Gardez ces références dans le même espace de travail que les plans qui les utilisent. Sur Lost Garden, c'est le rôle d'Imaginode dans le pipeline : un canvas à nodes où la référence d'un personnage est posée à côté de chaque plan qu'elle alimente, plutôt que dans un dossier que personne ne rouvre.",
        ],
      },
      {
        heading: "Concevoir le personnage pour la cohérence dès le départ",
        paragraphs: [
          "Les personnages qui survivent à la génération sont ceux qui ont une silhouette lisible et un petit nombre de traits durs. Lanterne est une armure vide avec une lanterne à la place de la tête. Cette forme se reconnaît à n'importe quelle taille, sous n'importe quelle lumière, sous n'importe quel angle, même quand les détails en dessous changent.",
          "Si votre personnage repose sur un visage subtil, vous avez choisi le problème le plus difficile qui soit. Donnez-lui une forme, une couleur et un objet. C'est ce que l'œil suit réellement.",
        ],
      },
      {
        heading: "Accepter la dérive là où personne ne regarde",
        paragraphs: [
          "Les rivets, les plis, les accessoires de fond, le motif exact sur une manche : les spectateurs ne les suivent pas et ne les ont jamais suivis. L'animation traditionnelle les simplifie depuis toujours pour la même raison.",
          "Concentrez votre attention sur les trois ou quatre éléments qui portent l'identité, et laissez le reste bouger. Vouloir tout verrouiller revient à ne rien verrouiller, parce que vous serez à court de patience avant d'être à court de plans.",
        ],
      },
      {
        heading: "Les plans courts cachent davantage",
        paragraphs: [
          "La dérive est fonction de la durée. Un plan de deux secondes a rarement le temps de se trahir. Un maintien de huit secondes sur un visage se trahira, quoi que vous fassiez.",
          "Ce n'est pas un compromis, c'est ainsi qu'on monte l'action de toute façon. Si un plan doit être long, trouvez une raison pour que la caméra bouge ou pour que le personnage se détourne.",
        ],
      },
      {
        heading: "Corriger au montage, pas au générateur",
        paragraphs: [
          "Couper sur le mouvement masque un changement comme ça l'a toujours fait. Passer en plan large aussi, ou mettre le personnage dans l'ombre, ou couper sur ce qu'il regarde plutôt que sur lui.",
          "Régénérez quand un plan est faux. Contournez au montage quand un plan est seulement imparfait. Savoir distinguer vite ces deux cas est l'essentiel du métier, et la principale raison pour laquelle un épisode fini existe.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Pourquoi mes personnages IA changent-ils d'un plan à l'autre ?",
      answer:
        "Parce qu'un prompt texte ne peut pas spécifier un visage avec assez de précision. Chaque génération est une nouvelle interprétation de votre description. Des images de référence, réutilisées sur tous les plans, sont la seule correction fiable.",
    },
    {
      question: "Combien d'images de référence par personnage ?",
      answer:
        "Quatre à six, couvrant le visage, le corps entier, la silhouette et les angles dont votre storyboard a besoin. Au-delà, elles cessent d'aider et commencent à se contredire.",
    },
    {
      question: "La cohérence dépend-elle du modèle ?",
      answer:
        "En partie. Les modèles tiennent une référence plus ou moins bien, et le classement change tous les quelques mois. Mais un personnage bien conçu, à silhouette claire, survit à un modèle faible, alors qu'un visage subtil échoue même sur un modèle fort.",
    },
    {
      question: "Peut-on tenir un personnage sur toute une série ?",
      answer:
        "Oui, à condition que le jeu de références soit versionné et réutilisé plutôt que refait à chaque épisode. Refaire les références, c'est ainsi qu'un personnage devient lentement quelqu'un d'autre entre l'épisode 1 et l'épisode 3.",
    },
  ],
  related: [
    { label: "Un animé fait par IA est-il un vrai animé ?", href: "/is-ai-anime-real-anime" },
    { label: "Animé IA contre animation traditionnelle", href: "/ai-anime-vs-traditional-animation" },
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Le top 6 des animés créés par IA", href: "/best-ai-anime" },
    { label: "Notes de production de Lost Garden", href: "/process" },
    { label: "Imaginode, la plateforme de génération utilisée", href: "https://imaginode.ai" },
  ],
};

const isAiAnimeRealAnime: Guide = {
  article: {
    byline:
      "La question revient sous chaque vidéo d'animation IA. Les grandes bases de données d'animés y répondent déjà, et leur réponse n'a presque rien à voir avec l'IA.",
    sections: [
      {
        paragraphs: [
          "Version courte : les bases qui cataloguent l'animé le définissent par son lieu de production, pas par sa technique de dessin. Selon cette définition, une série assistée par IA faite au Japon est un animé, et une série dessinée à la main faite en France n'en est pas un. La technique n'entre jamais en ligne de compte.",
          "Ça vaut la peine de le savoir avant d'en débattre, parce que l'essentiel des disputes en ligne vient de gens qui utilisent deux définitions différentes en même temps.",
        ],
      },
      {
        heading: "Ce qu'exige réellement AniList",
        paragraphs: [
          "AniList accepte trois catégories régionales et rien d'autre. Anime demande un contrôle créatif significatif de studios japonais. Aeni demande des studios sud-coréens. Donghua demande des studios chinois ou taïwanais.",
          "Leur propre exemple est RWBY. La série a un doublage japonais. Elle a été diffusée à la télévision japonaise. Elle est refusée quand même, parce que la société de production et l'équipe principale sont américaines. Leur formulaire va plus loin et ne propose que quatre pays d'origine, sans moyen de laisser le champ vide.",
        ],
        callouts: [
          "Un doublage japonais et une diffusion japonaise ne suffisent pas. Le contrôle créatif doit être japonais.",
        ],
      },
      {
        heading: "Ce qu'exige MyAnimeList",
        paragraphs: [
          "La même règle sous une autre forme. L'œuvre doit être animée en tant qu'œuvre d'animation, produite professionnellement au Japon, et destinée au marché japonais, avec une tolérance étroite pour les coproductions. RWBY y échoue aussi, pour la même raison.",
          "Anime News Network est l'exception des trois. Son encyclopédie est plus large et catalogue bien de l'animation non japonaise, ce qui en fait la seule base qu'une production occidentale indépendante peut réellement rejoindre.",
        ],
      },
      {
        heading: "Où se situe l'IA là-dedans",
        paragraphs: [
          "Nulle part dans ces règles. Aucune ne mentionne la façon dont les images sont fabriquées.",
          "Twins Hinahima tranche la question en pratique. Produite par Frontier Works et KaKa Creation, diffusée sur Tokyo MX en mars 2025, avec de l'IA générative sur environ 95 % de ses plans d'animation. Selon tous les critères ci-dessus, c'est un animé sans la moindre ambiguïté. Pendant ce temps, une série française dessinée entièrement à la main pendant dix ans par deux cents personnes n'en serait pas un.",
          "Quoi qu'on pense de l'IA en animation, ce n'est pas la ligne que tracent ces bases.",
        ],
      },
      {
        heading: "L'autre définition, celle que tout le monde utilise vraiment",
        paragraphs: [
          "Dans le langage courant, animé désigne une tradition visuelle et narrative : le design des personnages, le découpage, le registre d'émotion, le rapport à l'immobilité. Selon cette définition, beaucoup d'œuvres non japonaises qualifient, et les spectateurs l'appliquent sans hésiter.",
          "Au Japon, le mot est encore plus large. Anime veut simplement dire animation, toute l'animation, Pixar compris.",
          "Il y a donc au moins trois définitions en circulation : celle des bases, fondée sur l'origine de production, celle des spectateurs, fondée sur le style, et celle du Japon, littérale. Un débat qui ne dit pas laquelle il emploie ne peut pas être tranché.",
        ],
      },
      {
        heading: "Ce que ça donne pour Lost Garden",
        paragraphs: [
          "Lost Garden est une série d'animation indépendante faite en France, dans la tradition de l'animé, avec un pipeline assisté par IA sous direction humaine. C'est un animé selon la définition stylistique et ça n'en est pas un selon celle des bases, et les deux affirmations servent à quelque chose.",
          "Être précis là-dessus n'est pas de la modestie, c'est pratique. C'est ce qui explique que le projet a sa place dans l'encyclopédie d'Anime News Network, sur IMDb et sur TMDB, et pas sur AniList ni MyAnimeList. Soumettre au mauvais endroit fait perdre du temps à tout le monde et vous vaut un refus sur une règle qui n'a rien à voir avec votre travail.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Un animé fait par IA est-il un vrai animé ?",
      answer:
        "Ça dépend de la définition. AniList et MyAnimeList définissent l'animé par sa production japonaise, donc une série japonaise assistée par IA qualifie et une série occidentale dessinée à la main non. Selon la définition stylistique employée par la plupart des spectateurs, une œuvre assistée par IA dans la tradition de l'animé compte.",
    },
    {
      question: "Un animé IA a-t-il déjà été accepté comme animé par l'industrie ?",
      answer:
        "Oui. Twins Hinahima, produite par Frontier Works et KaKa Creation, a été diffusée sur Tokyo MX en mars 2025 avec de l'IA générative sur environ 95 % de ses plans. Elle remplit tous les critères des bases de données.",
    },
    {
      question: "Pourquoi AniList et MyAnimeList refusent-ils l'animation occidentale ?",
      answer:
        "Parce que les deux définissent l'animé par son origine de production. L'exemple d'AniList est RWBY, refusée malgré un doublage et une diffusion au Japon, parce que la production et l'équipe principale sont américaines. MyAnimeList exige une production professionnelle au Japon pour le marché japonais.",
    },
    {
      question: "Quelle base accepte l'animation occidentale indépendante ?",
      answer:
        "L'encyclopédie d'Anime News Network est plus large qu'AniList et MyAnimeList et catalogue de l'animation non japonaise. IMDb, TMDB et Wikidata n'ont aucune restriction régionale.",
    },
  ],
  related: [
    { label: "Le top 6 des animés créés par IA", href: "/best-ai-anime" },
    { label: "Animé IA contre animation traditionnelle", href: "/ai-anime-vs-traditional-animation" },
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Notes de production de Lost Garden", href: "/process" },
  ],
};

const aiVsTraditional: Guide = {
  article: {
    byline:
      "Une comparaison écrite de l'intérieur, après avoir fini seul un épisode de dix-sept minutes. Ce qu'un pipeline assisté par IA change vraiment, ce qu'il laisse exactement en l'état, et là où il reste moins bon.",
    sections: [
      {
        paragraphs: [
          "La plupart des comparaisons sur le sujet sont écrites par des gens qui vendent un camp. Celle-ci vient d'avoir produit un épisode avec le pipeline assisté par IA, et d'avoir observé ce qu'il a résolu et ce qu'il n'a pas résolu.",
        ],
      },
      {
        heading: "Ce qui change vraiment : le plancher",
        paragraphs: [
          "Dix-sept minutes d'animation demandaient un studio, un planning et une masse salariale. Il faut maintenant une personne et un an. C'est toute l'histoire, et tout le reste de ce qu'on raconte sur l'animation IA est plus petit que ça.",
          "Ça ne rend pas l'animation bon marché. Ça la rend possible à l'échelle d'une seule personne, ce qui est autre chose, et plus intéressant.",
        ],
      },
      {
        heading: "Ce qui change : l'itération, et donc le goût",
        paragraphs: [
          "Dans un pipeline traditionnel, un plan coûte assez cher pour qu'on s'y engage dès le storyboard. Dans un pipeline génératif, on peut regarder quarante versions du même plan avant de choisir.",
          "Ça sonne comme un pur avantage et ça n'en est pas un. Choisir parmi quarante options est une compétence, et sans bible du monde à laquelle se référer, vous prendrez le plus joli plutôt que le juste. Le goulot d'étranglement se déplace de la fabrication des images vers leur jugement.",
        ],
        callouts: [
          "La ressource rare cesse d'être la capacité de production et devient le jugement.",
        ],
      },
      {
        heading: "Ce qui ne change pas du tout",
        list: [
          "L'écriture. Une scène faible est faible à n'importe quelle résolution.",
          "L'intention de storyboard. Quelqu'un décide toujours où se place la caméra et pourquoi.",
          "Le montage. Le rythme, les temps de pause et les coupes font toujours la différence entre un film et une bande d'images.",
          "Le son. Toujours la moitié du résultat, toujours la moitié qu'on saute.",
          "Le taux de réussite. La plupart des prises sont mauvaises dans les deux pipelines. Seul le coût d'une mauvaise prise a changé.",
        ],
      },
      {
        heading: "Là où l'IA est clairement moins bonne",
        paragraphs: [
          "La cohérence des personnages d'un plan à l'autre est l'évidence, et c'est un problème de pipeline plutôt que de prompt. Les mains et les petits accessoires restent peu fiables. Un maintien long sur un visage trahit une dérive qu'un plan de deux secondes masque.",
          "Le timing délibéré est l'écart le plus profond. Un animateur traditionnel décide qu'un geste dure onze images parce que onze est plus drôle que douze. Le mouvement généré n'offre pas ce contrôle, et la différence se voit dans la comédie et dans la chorégraphie de combat plus que partout ailleurs.",
        ],
      },
      {
        heading: "Là où l'IA est clairement meilleure",
        paragraphs: [
          "Explorer une direction visuelle avant de s'engager. Les décors, la lumière, l'atmosphère, la matière d'un monde : tout ça revient plus vite et plus riche qu'une petite équipe ne pourrait le dessiner.",
          "Le volume de tentatives est l'autre point. Pouvoir échouer quarante fois sur un plan qui compte est un luxe qu'une production planifiée n'a pas.",
        ],
      },
      {
        heading: "Le verdict honnête",
        paragraphs: [
          "Ce n'est pas un pipeline de remplacement, c'est un autre jeu de contraintes. Un studio fait toujours un jeu d'acteur et une chorégraphie qu'aucun plan généré n'atteint. Une seule personne peut désormais finir un épisode cohérent avec un monde à elle, ce qu'aucune personne seule ne pouvait faire avant.",
          "Les deux sont vrais en même temps, et quiconque ne vous en dit qu'un seul vous vend quelque chose.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "L'animation IA coûte-t-elle moins cher que l'animation traditionnelle ?",
      answer:
        "Moins cher en salaires, pas en temps. Le coût se déplace d'une équipe vers les mois d'une seule personne. Ce qui change réellement, c'est qu'une production de cette durée devient possible pour une personne seule, ce qui n'était pas le cas il y a quelques années.",
    },
    {
      question: "L'animation IA est-elle plus rapide ?",
      answer:
        "Les plans pris un par un sont plus rapides. Le projet non, parce que l'essentiel du temps passe dans les prises refusées et dans le montage. Un épisode de dix-sept minutes fait seul se compte toujours en mois.",
    },
    {
      question: "Que fait encore mieux l'animation traditionnelle ?",
      answer:
        "Le timing délibéré et le jeu des personnages. Un animateur qui décide qu'un geste dure onze images plutôt que douze a un contrôle que le mouvement généré n'offre pas, et ça se voit surtout dans la comédie et la chorégraphie de combat.",
    },
    {
      question: "L'IA va-t-elle remplacer les animateurs ?",
      answer:
        "Elle n'a pas remplacé les parties du travail qui décident si une scène fonctionne : l'écriture, la mise en scène, le montage, le timing. Elle a abaissé la barrière pour des gens qui ne pouvaient pas produire d'animation du tout. Ce sont deux effets différents et les deux ont lieu.",
    },
  ],
  related: [
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Garder un personnage cohérent d'un plan à l'autre", href: "/ai-character-consistency" },
    { label: "Un animé fait par IA est-il un vrai animé ?", href: "/is-ai-anime-real-anime" },
    { label: "Animé IA contre animation traditionnelle", href: "/ai-anime-vs-traditional-animation" },
    { label: "Le top 6 des animés créés par IA", href: "/best-ai-anime" },
  ],
};

export const guidesFr: Record<GuideSlug, Guide> = {
  "/how-to-make-ai-anime": howToMakeAiAnime,
  "/ai-character-consistency": characterConsistency,
  "/is-ai-anime-real-anime": isAiAnimeRealAnime,
  "/ai-anime-vs-traditional-animation": aiVsTraditional,
};
