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


const aiManga: Guide = {
  article: {
    byline:
      "Le manga, c'est la moitié immobile du même problème. Ce que les character sheets et le storyboard d'un épisode d'animé m'ont appris sur le manga généré, et là où ça casse.",
    sections: [
      {
        paragraphs: [
          "Je n'ai pas publié de manga. Ce que j'ai fait, c'est la partie d'une production d'animé qui y ressemble trait pour trait : des character sheets, un storyboard scène par scène, un paquet d'images fixes jugées contre une bible avant la moindre seconde de mouvement. Cette étape, c'est du manga sans le lettrage, et c'est de là que viennent les leçons qui suivent.",
          "En une phrase : l'IA sait déjà faire une page de manga. Elle ne sait pas encore faire un chapitre. Et la différence, c'est exactement ce qui compte pour un lecteur.",
        ],
      },
      {
        heading: "Une page, c'est facile. Un chapitre, non.",
        paragraphs: [
          "Demandez une case de manga à un modèle d'image actuel et vous l'avez. Le trait, la trame, l'angle dramatique, en quelques secondes. C'est la démo que tout le monde a vue et elle est vraie.",
          "Maintenant demandez la case suivante. Même personnage, même pièce, trois secondes plus tard, vu de l'autre côté. C'est là que la dérive qui ruine l'animation IA apparaît sur le papier, et elle apparaît plus fort, parce qu'un lecteur tient la page immobile et compare. En mouvement, vous pouvez couper avant qu'un visage raté se voie. Sur une page, le visage raté reste à côté du bon pour toujours.",
        ],
        callouts: [
          "En animation, l'oeil pardonne ce qu'il ne voit qu'une seconde. Une page de manga lui laisse tout le temps du monde.",
        ],
      },
      {
        heading: "Ce qui se transfère du pipeline animé",
        paragraphs: [
          "Tout ce qui a réglé la cohérence sur Lost Garden marche pour le manga, et marche même mieux, puisque vous n'avez jamais à vous battre contre le mouvement. Un jeu de références par personnage, réutilisé sur chaque case. Une silhouette qui survit à une mauvaise génération : Lanterne est une armure vide avec une lanterne en guise de tête, et cette forme se lit en vignette dans n'importe quelle case. Une bible du monde qui vous autorise à refuser un beau dessin parce qu'il appartient à un autre livre.",
          "L'étape du storyboard pèse plus lourd que les gens ne l'imaginent. Sur l'épisode, ScreenWeaver génère le storyboard à partir du scénario, scène par scène, et ce storyboard est déjà un manga brut : un plan par case, une raison pour chaque case, un rythme sur la page. Si vous faites un manga, c'est ce document-là qu'il faut réussir en premier, pas le dessin.",
        ],
      },
      {
        heading: "Ce qui ne se transfère pas, et qui fait mal",
        paragraphs: [
          "Les mains. Deux personnages qui se touchent. Tout ce qui porte du texte, de l'enseigne de boutique à la bulle de dialogue. Les bordures de cases et le sens de lecture, que le modèle ne comprend pas du tout et que vous poserez vous-même. Et la laideur volontaire dont le manga se sert pour appuyer : la goutte de sueur, la case chibi, les lignes de vitesse qui cassent la perspective exprès. Les modèles lissent tout ça, parce qu'ils ont appris sur des pages finies qui l'évitent la plupart du temps.",
          "Le lettrage est le point à prendre au sérieux. Une bulle générée est une image de texte, pas du texte. Tous les vrais workflows de manga avec de l'IA dedans dessinent l'image puis lettrent à la main après coup, et il n'existe pas encore de raccourci qui se lise bien.",
        ],
      },
      {
        heading: "Là où le manga généré sert vraiment, aujourd'hui",
        paragraphs: [
          "Le name, ce brouillon de mise en page qu'un mangaka dessine avant le propre. Les pages de pitch. L'exploration de design de personnage avant de trancher. Les couvertures couleur, qui sont des images uniques et jouent sur le point fort du modèle. Un projet de fans où la cohérence peut rester lâche parce que le lecteur connaît déjà les visages.",
          "Un chapitre de quarante pages avec six personnages, qu'un inconnu suit sans rien remarquer de bizarre, ça reste énormément de correction à la main. On est plus près qu'il y a un an, et on n'y est pas.",
        ],
      },
      {
        heading: "Sur le mot lui-même",
        paragraphs: [
          "En France, on dit manga aussi pour la série animée, donc une recherche sur un manga créé par IA veut souvent dire un animé créé par IA. Si c'est ce que vous cherchiez, l'épisode 1 de Lost Garden fait dix-sept minutes, il est complet et il se regarde gratuitement. Si vous vouliez dire la chose imprimée, tout ce qui précède est l'état honnête de la question en 2026, et un manga de la série n'existe pas encore.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "L'IA peut-elle créer un manga ?",
      answer:
        "Elle produit une page de manga convaincante en quelques secondes. Un chapitre complet avec les mêmes visages sur chaque case, un lettrage lisible et une mise en page voulue demande encore un humain pour l'essentiel de l'assemblage et des corrections. Les outils sont bons sur la case et faibles sur la continuité.",
    },
    {
      question: "Le manga IA est-il plus facile que l'animé IA ?",
      answer:
        "Par image, oui, il n'y a pas de mouvement à combattre. Par oeuvre, pas vraiment, parce que le papier laisse au lecteur le temps de comparer les cases et que chaque incohérence est définitive. L'animation peut couper avant une erreur. Une page ne peut pas.",
    },
    {
      question: "Comment garder un personnage de manga cohérent avec l'IA ?",
      answer:
        "Exactement comme en animation : un jeu de références par personnage réutilisé sur chaque case, un design à la silhouette forte et aux traits durs peu nombreux, et une bible contre laquelle refuser les dessins. Les prompts seuls dérivent, sur papier comme à l'écran.",
    },
    {
      question: "Existe-t-il un manga Lost Garden ?",
      answer:
        "Non. Lost Garden est une série animée. L'épisode 1 dure dix-sept minutes et se regarde gratuitement sur YouTube et sur ce site. Les character sheets et le storyboard qui le précèdent sont ce que le projet a de plus proche d'un manga.",
    },
  ],
  related: [
    { label: "Garder un personnage cohérent d'un plan à l'autre", href: "/ai-character-consistency" },
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Générateurs d'animé IA : ce qu'ils produisent vraiment", href: "/ai-anime-generator" },
    { label: "Regarder l'épisode 1", href: "/episode-1" },
    { label: "Les 6 meilleurs animés IA, classés", href: "/best-ai-anime" },
  ],
};

const aiAnimeGenerator: Guide = {
  article: {
    byline:
      "Ce qu'un générateur d'animé IA vous donne, ce qu'il ne vous donne pas, et quelles parties d'un épisode de dix-sept minutes en sont sorties. Écrit pour ceux qui s'apprêtent à payer un abonnement.",
    sections: [
      {
        paragraphs: [
          "Tous les produits avec le mot anime dans le nom promettent la même chose : vous tapez une phrase, vous obtenez un animé. Certains sont réellement impressionnants. Aucun ne fait un épisode, et l'écart entre ces deux faits, c'est là que les gens perdent des mois et une somme pas négligeable.",
          "Ceci n'est pas le test d'un outil précis. Les classements sur ce sujet sont périmés en un trimestre. C'est la description d'une catégorie, pour que vous sachiez ce que vous achetez avant de l'acheter.",
        ],
      },
      {
        heading: "Ce qu'un générateur sort réellement",
        paragraphs: [
          "Un clip. Entre quatre et quinze secondes la plupart du temps, à partir d'un prompt texte et souvent d'une image de référence. Un bon générateur vous donne un plan qui ressemble à de l'animé, avec un mouvement plausible, un mouvement de caméra et une lumière qui tient sur la durée.",
          "Ce qu'il ne sort pas, c'est le plan d'avant et le plan d'après. Il n'a aucune mémoire de votre personnage au-delà de l'image jointe, aucune idée de votre monde, aucune notion que ce plan appartient à une scène. Chaque génération, c'est un inconnu à qui l'on demande de dessiner votre personnage d'après une photo.",
        ],
        callouts: [
          "Un générateur fait des plans. Un épisode est fait des décisions entre les plans, et ça, aucun produit ne le vend.",
        ],
      },
      {
        heading: "Trois familles de produits, qui ne sont pas interchangeables",
        list: [
          "Les applis anime en un clic. Un prompt, un preset de style, un clip. Utile pour un test d'ambiance ou un post, inutile pour la continuité, et le plus cher à la seconde exploitable.",
          "Les modèles vidéo bruts avec une interface. Seedance, Kling, Veo et leurs successeurs. C'est là qu'est la qualité, et c'est là que le travail de références, de prompt et de sélection vous revient.",
          "Les espaces de travail qui mettent plusieurs modèles derrière un même canvas, avec vos références gardées à côté des plans. Pas un générateur, un endroit pour faire tourner des générateurs. C'est la famille d'Imaginode, et celle dans laquelle un épisode se fabrique réellement.",
        ],
        trailingParagraphs: [
          "La première famille, c'est là où atterrissent la plupart des recherches sur un générateur d'animé. La troisième est la seule qui tient la distance d'une histoire.",
        ],
      },
      {
        heading: "Ce que Lost Garden a utilisé, et pour quoi",
        paragraphs: [
          "Rien dans l'épisode 1 ne vient d'une appli en un clic. Le scénario est écrit à la main dans ScreenWeaver, qui génère ensuite le storyboard à partir du texte. La génération d'images et de vidéo tourne sur Imaginode, où un large catalogue de modèles se trouve derrière un seul canvas à noeuds, et où les références de Lanterne et de Rose restent accrochées à chaque plan qui en a besoin.",
          "Le mouvement vient de plusieurs modèles vidéo, Seedance 2 parmi eux, et le modèle changeait selon le plan. C'est la partie qu'aucun générateur seul ne sait faire : essayer le même plan sur trois modèles et garder celui qui tient l'armure, sans tout reconstruire à chaque fois.",
        ],
      },
      {
        heading: "Ce pour quoi les générateurs sont vraiment bons",
        paragraphs: [
          "Trouver un look avant de s'y engager. Vérifier qu'une scène a une caméra, tout court. Produire un storyboard assez vite pour en jeter la moitié sans regret. Faire une preuve de dix secondes qu'une idée bizarre, une armure vide avec une lanterne à la place de la tête, se lit vraiment à l'écran.",
          "Ces usages valent l'abonnement, et ils ont fait partie de la fabrication de cet épisode. Ils sont le début du travail, et les produits vous les vendent comme la fin.",
        ],
      },
      {
        heading: "Avant de vous abonner",
        paragraphs: [
          "Posez une seule question à n'importe quel outil : est-ce que je peux accrocher les mêmes références de personnage à cinquante plans différents sans les réimporter cinquante fois. Si la réponse est non, c'est une machine à clips, et les clips sont la partie pas chère. Si la réponse est oui, vous regardez un pipeline, et le prix est probablement juste.",
          "Et venez avec un scénario. Un générateur qui n'a rien à générer produit un dossier hors de prix de jolis inconnus.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Quel est le meilleur générateur d'animé IA ?",
      answer:
        "Pour un clip isolé, les modèles vidéo changent de rang tous les quelques mois, donc toute réponse nominative se périme. Pour un épisode, l'outil qui compte est celui qui garde vos références de personnage accrochées à chaque plan et vous laisse essayer le même plan sur plusieurs modèles. C'est un espace de travail, pas un générateur.",
    },
    {
      question: "Un générateur d'animé IA peut-il faire un épisode complet ?",
      answer:
        "Non. Les générateurs produisent des clips de quelques secondes sans mémoire entre eux. Un épisode, c'est un scénario, des références, des plans jugés un par un contre une bible, un montage et un mixage. L'épisode 1 de Lost Garden a pris à une personne environ un an, et aucune étape n'a tenu en un clic.",
    },
    {
      question: "Les générateurs d'animé IA gratuits valent-ils le coup ?",
      answer:
        "Pour un test de look ou une case de storyboard, oui. Pour tout ce que vous comptez garder, les offres gratuites plafonnent en général la résolution, la durée et la prise en charge des références, soit exactement les trois choses dont une histoire a besoin.",
    },
    {
      question: "Avec quel générateur Lost Garden a-t-il été fait ?",
      answer:
        "Aucun au sens du clic unique. Le scénario et le storyboard vivent dans ScreenWeaver, la génération tourne sur Imaginode avec plusieurs modèles vidéo dont Seedance 2, et le montage et le son sont classiques. Le modèle a varié plan par plan.",
    },
  ],
  related: [
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Garder un personnage cohérent d'un plan à l'autre", href: "/ai-character-consistency" },
    { label: "Le making-of de l'épisode 1", href: "/making-of-episode-1" },
    { label: "L'IA peut-elle créer un manga ?", href: "/ai-manga" },
    { label: "Imaginode, la plateforme de génération utilisée", href: "https://imaginode.ai" },
  ],
};

const aiAnimeVoiceAndSound: Guide = {
  article: {
    byline:
      "Le personnage principal de Lost Garden ne peut pas parler. Comment les voix, les sons d'armure et la musique de l'épisode 1 ont été faits, et ce que l'audio IA réussit et rate dans un animé.",
    sections: [
      {
        paragraphs: [
          "Le son, c'est la moitié d'un animé IA dont personne ne parle, et c'est la moitié qui décide si le spectateur croit à l'espace. Tous les articles sur le sujet parlent d'images. Celui-ci parle de l'autre canal.",
          "Lost Garden a eu la chance de poser la question tôt. Lanterne est une armure vide avec une lanterne en guise de tête. Pas de bouche, pas de poumons, pas de voix. Tout ce qu'il ressent doit sortir en son, et aucun de ces sons ne pouvait être quelqu'un qui parle.",
        ],
      },
      {
        heading: "Un personnage sans voix",
        paragraphs: [
          "Toute l'identité vocale de Lanterne est faite de métal creux : des grincements, des souffles vides, des résonances internes, des petits grognements de frustration, un soupir métallique étrange quand quelque chose tourne mal. Ces sons ont été explorés avec des outils audio IA, puis choisis, superposés et placés à la main, une réaction à la fois.",
          "La contrainte s'est révélée être un cadeau. Un personnage qui ne peut pas s'expliquer ne peut pas être sur-écrit, et un spectateur qui doit lire un grincement comme de la déception fait le travail qui le rend attaché. Le son a dit au public ce qu'était Lanterne avant que l'histoire ne le dise.",
        ],
        callouts: [
          "Une voix vous dit ce qu'un personnage dit. Un son vous dit ce qu'un personnage est.",
        ],
      },
      {
        heading: "Des voix pour ceux qui parlent",
        paragraphs: [
          "L'épisode est joué en anglais, sous-titré en français, en japonais et en coréen. Les répliques ont été produites avec des outils de voix IA, dirigées ligne par ligne : l'intention, le rythme, où va le souffle, quel mot porte le poids. Une lecture générée est une première prise, et comme toute première prise, beaucoup ont été refusées.",
          "La limite honnête, c'est le jeu sous pression. Les répliques calmes, la tranquillité d'une enfant, une phrase dite à quelqu'un qui ne peut pas répondre, ça fonctionne. Un cri, un rire qui se transforme en autre chose, deux personnes qui se coupent la parole, ça sonne encore comme ce que c'est. L'épisode est écrit autour de cette limite, et beaucoup de scénarios ne le seraient pas.",
        ],
      },
      {
        heading: "La musique a eu des règles avant d'avoir des notes",
        paragraphs: [
          "La bible du son était aussi stricte que celle des images. Mystique, fragile, souterraine, parfois science-fiction, parfois sacrée, et jamais de la musique de bande-annonce. Quand Lanterne rencontre l'Arbre Source, la partition n'est pas héroïque. Elle est ancienne et trop grande : des tons de verre doux, un violoncelle grave, des textures de choeur sans paroles, la réverbération d'une caverne, le craquement des racines, une faible résonance venue de l'armure elle-même.",
          "Quand une machine endormie se réveille, la palette bascule : des drones froids, des crépitements électriques, des gémissements mécaniques, des tonalités d'alarme et un cri extraterrestre signature. Ces deux palettes ont été explorées avec des outils de musique IA à partir de briefs écrits, et les briefs étaient le véritable travail. Un modèle à qui l'on donne le mot épique renvoie la moyenne de toutes les partitions épiques jamais composées. Un modèle à qui l'on donne une liste d'instruments interdits renvoie quelque chose qui appartient à un seul film.",
        ],
      },
      {
        heading: "Moins de musique que vous ne le pensez",
        paragraphs: [
          "L'erreur la plus courante en animation assistée par IA, c'est une partition générée sous chaque scène, parce que les partitions ne coûtent plus rien. Le résultat aplatit un épisode en bande-annonce de dix-sept minutes. Lost Garden tient le silence à des endroits que la plupart des projets rempliraient, et les pas sur la pierre mouillée font plus pour la sensation de caverne que n'importe quelle section de cordes.",
          "Les effets sonores ont été placés à la main, au montage, comme dans n'importe quel film. Cette partie-là n'a pas changé et ne devrait sans doute pas changer.",
        ],
      },
      {
        heading: "Ce qu'il faut en retenir",
        paragraphs: [
          "Écrivez la bible du son avant de générer une note. Donnez à chaque personnage une identité sonore, même à ceux qui parlent. Refusez l'audio généré comme vous refusez les images générées, contre la bible et pas selon votre humeur. Et laissez du silence. C'est la seule chose qu'aucun modèle ne vous proposera de lui-même.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Les voix de Lost Garden sont-elles générées par IA ?",
      answer:
        "Les répliques ont été produites avec des outils de voix IA et dirigées ligne par ligne, avec beaucoup de prises refusées. Lanterne, le personnage principal, n'a aucune voix humaine : ses réactions sont des sons d'armure creuse, grincements, souffles vides et soupirs métalliques, explorés avec des outils audio IA et placés à la main.",
    },
    {
      question: "La musique d'un animé IA est-elle en général générée par IA ?",
      answer:
        "De plus en plus, oui. Sur Lost Garden, la partition a été explorée avec des outils de musique IA à partir de briefs écrits stricts, qui nommaient l'ambiance, les instruments et ce qui était interdit. C'est le brief qui empêche une partition générée de ressembler à toutes les autres.",
    },
    {
      question: "Qu'est-ce que le doublage IA fait encore mal ?",
      answer:
        "Les émotions extrêmes et les chevauchements. Crier, un rire qui change de sens, deux personnages qui parlent en même temps. Les répliques calmes et tenues fonctionnent bien. Écrire le scénario avec cette limite en tête est plus efficace que de la combattre dans l'outil.",
    },
    {
      question: "Comment donner une voix à un personnage sans dialogue ?",
      answer:
        "Construisez une identité sonore à la place. Lanterne se définit par le métal : un grincement pour l'hésitation, un souffle vide pour la surprise, un soupir métallique pour l'échec. Des sons constants pour des émotions constantes, et le spectateur apprend la langue en une scène.",
    },
  ],
  related: [
    { label: "Le making-of de l'épisode 1", href: "/making-of-episode-1" },
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Regarder l'épisode 1", href: "/episode-1" },
    { label: "Le texte du créateur sur la fabrication de la série", href: "/vision" },
  ],
};

const howToTellIfAnimeIsAi: Guide = {
  article: {
    byline:
      "Les signes qu'un animé a été fait avec l'IA, par quelqu'un qui a passé un an à les cacher. Ce qui se voit encore, ce qui ne se voit plus, et pourquoi la vraie réponse est au générique.",
    sections: [
      {
        paragraphs: [
          "La question est posée sous chaque clip animé maintenant, et les réponses sûres d'elles se trompent le plus souvent dans les deux sens. Du dessin à la main se fait accuser parce qu'il a des dégradés lisses. Du généré passe parce qu'il a un trait griffé. Voici ce qui se voit réellement, du côté de la personne qui essaie que ça ne se voie pas.",
        ],
      },
      {
        heading: "Regardez la coupe avant le plan",
        paragraphs: [
          "Le signe le plus fort n'est dans aucun plan pris seul. Il est entre les plans. Le visage d'un personnage, le volume de ses cheveux, la forme exacte d'un col ou d'une sangle : si tout ça bouge légèrement à chaque coupe, les plans ont été générés séparément et personne n'a pu les verrouiller complètement. L'animation traditionnelle dérive aussi, mais elle dérive à l'intérieur d'une scène quand l'animateur fatigue, pas à chaque point de montage.",
          "Le signe qui va avec, c'est la durée des plans. Les projets générés coupent vite sur les visages et s'attardent sur les décors, parce qu'un visage de deux secondes cache la dérive et qu'une caverne de huit secondes n'a rien à trahir. Un épisode entier presque sans plan long sur un personnage vous dit quelque chose.",
        ],
        callouts: [
          "L'IA se voit entre les plans, pas dedans. Comparez des coupes, pas des images.",
        ],
      },
      {
        heading: "Les mains, les contacts et les petits objets",
        paragraphs: [
          "Toujours le point faible de tous les modèles, et toujours la première chose à vérifier. Des doigts qui fusionnent ou se multiplient pendant un geste, deux mains qui se touchent et deviennent un seul objet, une tasse qui change de forme entre le moment où on la prend et celui où on boit. Une main dessinée peut être mauvaise, mais elle est mauvaise de la même façon pendant tout le plan.",
          "Regardez aussi tout ce qu'un personnage tient d'une coupe à l'autre. Lanterne porte un médaillon lumineux, et un objet comme celui-là doit être vérifié à chaque coupe exactement comme un visage.",
        ],
      },
      {
        heading: "Le mouvement qui flotte",
        paragraphs: [
          "Le mouvement généré est fluide d'une manière que l'animation à la main refuse volontairement. L'animé tient une pose, claque sur la suivante, saute des images exprès pour l'impact. Les modèles vidéo interpolent tout, donc un personnage qui devrait frapper une pose y glisse à la place. Les cycles de marche sont le cas le plus net : regardez si les pieds se plantent ou s'ils patinent.",
          "Ce signe s'efface vite, et on peut diriger contre, mais en 2026 c'est encore ce qu'il y a de plus fiable à regarder dans une scène d'action.",
        ],
      },
      {
        heading: "Des décors trop finis",
        paragraphs: [
          "Les décors d'animé traditionnel sont peints une fois et réutilisés, donc la même pièce est la même dans chaque plan, jusqu'à la fissure dans le mur. Les décors générés sont nouveaux à chaque fois. Une fissure qui se déplace, une fenêtre qui gagne un carreau, de la mousse qui change de motif : la pièce est redessinée d'après une description au lieu d'être filmée d'après une peinture.",
          "Le paradoxe, c'est que les environnements générés sont souvent plus détaillés que les dessinés. Trop de texture partout, sans la décision d'un artiste sur ce qu'on laisse plat, c'est un signe en soi.",
        ],
      },
      {
        heading: "Ce qui ne marche plus comme test",
        paragraphs: [
          "La qualité du trait, la trame, le look animé lui-même : les modèles l'ont maintenant, et la sensation crayonnée à la main est un preset. Les six doigts, autrefois le mème, sont rares sur les modèles actuels. Le texte dans l'image devient lisible. Celui qui se sert encore de ces tests aura tort plus souvent que raison.",
          "Les yeux sont un mauvais test dans les deux sens. Les yeux d'animé ont toujours été stylisés, et un modèle copie le style parfaitement.",
        ],
      },
      {
        heading: "La seule méthode fiable",
        paragraphs: [
          "Lisez le générique, la description ou les notes de production. Lost Garden dit sur son propre site que l'épisode 1 est assisté par IA sous direction humaine, liste les outils et explique ce qui est humain et ce qui est généré. Twins Hinahima a été transparent sur son usage de l'IA dès le départ. Les projets qui le cachent sont ceux pour lesquels les tests ci-dessus existent, et ces tests perdent en fiabilité chaque mois.",
          "Donc la question utile est en train de passer de est-ce que je peux le voir à est-ce qu'on me l'a dit. C'est une question sur les gens, et elle ne se périme pas.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Comment savoir si un animé est généré par IA ?",
      answer:
        "Comparez des plans plutôt que des images : des visages, des volumes de cheveux et des objets tenus qui changent à chaque coupe, un montage rapide sur les personnages avec des plans longs sur les décors, des mains qui fusionnent pendant un geste, un mouvement qui glisse au lieu de claquer, des décors dont les détails changent d'un plan à l'autre. La réponse fiable est au générique ou dans les notes de production.",
    },
    {
      question: "Les six doigts sont-ils encore un signe d'IA ?",
      answer:
        "Rarement, sur les modèles actuels. Les mains restent le point faible, mais ce qui trahit maintenant, ce sont des doigts qui fusionnent ou se multiplient pendant un mouvement et deux mains qui deviennent un seul objet au contact, pas un décompte sur une image fixe.",
    },
    {
      question: "Un rendu dessiné à la main garantit-il que ce n'est pas de l'IA ?",
      answer:
        "Non. La qualité du trait, la trame et la sensation de crayon sont des presets de style maintenant. Regardez plutôt la continuité entre les plans.",
    },
    {
      question: "Lost Garden est-il généré par IA ?",
      answer:
        "Il est assisté par IA sous direction humaine, et il le dit. Le scénario, le monde, les personnages, le montage et les décisions de son sont humains. La génération d'images et de vidéo tourne sur Imaginode avec plusieurs modèles vidéo, et les notes de production de ce site listent ce qui est généré et ce qui ne l'est pas.",
    },
  ],
  related: [
    { label: "Un animé IA est-il un vrai animé ?", href: "/is-ai-anime-real-anime" },
    { label: "Garder un personnage cohérent d'un plan à l'autre", href: "/ai-character-consistency" },
    { label: "Notes de production de Lost Garden", href: "/process" },
    { label: "Animé IA contre animation traditionnelle", href: "/ai-anime-vs-traditional-animation" },
    { label: "Les 6 meilleurs animés IA, classés", href: "/best-ai-anime" },
  ],
};

const makingOfEpisodeOne: Guide = {
  article: {
    byline:
      "Comment l'épisode 1 de Lost Garden a été fait : ce qui a changé, ce qui a été jeté, et à quoi ressemble de l'intérieur un an de travail d'une seule personne sur dix-sept minutes d'animé.",
    sections: [
      {
        paragraphs: [
          "L'épisode 1 est sorti le 29 mai 2026. Dix-sept minutes, écrites, réalisées, générées, montées et mixées par une seule personne. Depuis, il a passé les soixante-cinq mille vues, il a été sélectionné au Seoul International AI Film Festival et il est arrivé en finale de l'AI London Festival. Voici le récit de sa fabrication, sans les parties qu'on lisse d'habitude.",
        ],
      },
      {
        heading: "Le monde était ailleurs, au début",
        paragraphs: [
          "Les premières versions de Lost Garden avaient une cathédrale. Elles avaient un extérieur, un ciel, une surface de fantasy assez classique avec le souterrain comme un endroit où l'on descend. Plus le projet avançait, plus il devenait clair que l'identité la plus forte était en dessous, et la surface a été coupée entièrement.",
          "Cette décision a coûté beaucoup d'images finies. Elle reste la meilleure décision de la production, parce que tout ce qui est venu après pouvait se vérifier contre une seule règle : forêts bleues, brume cyan, pierre mouillée, et jamais de soleil. Une bible du monde vaut exactement le nombre de bons plans que vous acceptez de jeter pour elle, et la cathédrale en a été la preuve.",
        ],
      },
      {
        heading: "Un chevalier conçu pour survivre aux outils",
        paragraphs: [
          "Lanterne est une armure vide avec une lanterne à la place de la tête, pas de visage, pas de corps à l'intérieur, des proportions modestes, une posture un peu gauche. Ce n'est pas un chevalier légendaire. Il est abîmé, protecteur et un peu maladroit. C'était d'abord un choix d'histoire, et c'est devenu la décision la plus pratique de tout le pipeline.",
          "Un visage dérive d'un plan généré à l'autre. Une silhouette avec une seule source de lumière au milieu, non. Rose, une petite fille à la force tranquille, a été le personnage le plus difficile précisément parce qu'elle a un visage, et qu'un visage, c'est ce qui dérive.",
        ],
        callouts: [
          "Le personnage qui ne peut pas parler et n'a pas de visage a été le plus facile à garder cohérent. Ce n'est pas un hasard.",
        ],
      },
      {
        heading: "L'ordre des opérations",
        paragraphs: [
          "Le scénario a été écrit à la main dans ScreenWeaver et il est resté l'unique source de vérité pour tout ce qui a suivi. ScreenWeaver en a généré le storyboard, scène par scène, et chaque plan a été produit dans son workflow pour qu'aucune image ne perde jamais le lien avec la ligne de scénario qu'elle servait.",
          "La génération a tourné sur Imaginode, un canvas à noeuds avec un large catalogue de modèles d'image et de vidéo derrière. L'intérêt de ce montage n'a jamais été le choix d'un modèle. C'était de pouvoir essayer le même plan sur plusieurs, avec les références de personnage toujours accrochées, et garder celui qui tenait l'armure. Seedance 2 a pris beaucoup de mouvement. Ce n'était pas le seul, et le modèle gagnant changeait plan par plan.",
        ],
      },
      {
        heading: "À quoi est passée la plus grande partie de l'année",
        paragraphs: [
          "Aux prises refusées et au montage. Beaucoup de plans ont demandé plusieurs essais. Certains en ont demandé une douzaine. Quelques scènes ont été réécrites parce que le plan dont elles avaient besoin n'existait encore à aucune qualité, et réécrire une scène va plus vite que se battre un mois contre un modèle.",
          "Le montage, c'est là que l'épisode est devenu un épisode. Couper sur le mouvement pour cacher la dérive, raccourcir sur les visages, faire confiance à un plan large, décider qu'une image magnifique était fausse pour la scène et la perdre. Rien de ça n'est sorti d'un générateur, et c'est à tout ça que les spectateurs réagissent réellement.",
        ],
      },
      {
        heading: "Le son est venu en dernier, et c'est normal",
        paragraphs: [
          "Lanterne n'a pas de voix, donc tout son personnage tient dans des sons d'armure : des grincements, des souffles vides, un soupir métallique. La partition a suivi une bible écrite aussi stricte que la bible visuelle, des tons de verre et un violoncelle grave pour le sacré, des drones froids et des tonalités d'alarme pour les machines, et moins de musique que n'importe quelle bande-annonce n'en mettrait. Les voix des personnages qui parlent ont été produites avec des outils de voix IA, dirigées ligne par ligne, en anglais, avec des sous-titres dans trois autres langues.",
        ],
      },
      {
        heading: "Ce que ça a prouvé, et ce que ça n'a pas prouvé",
        paragraphs: [
          "Ça a prouvé qu'une seule personne peut finir un épisode cohérent de dix-sept minutes avec un monde à elle, ce qui n'était pas possible il y a quelques années. Ça n'a pas prouvé que c'est rapide, pas cher ou facile. Quiconque l'a regardé en se disant qu'il pouvait faire pareil en un week-end a mal lu ce qu'il a vu.",
          "L'épisode 2 est en production, avec le même chevalier, la même enfant, et un jeu de références qui, cette fois, n'a pas à être construit à partir de rien.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Combien de temps a pris l'épisode 1 de Lost Garden ?",
      answer:
        "Environ un an de travail d'une seule personne pour dix-sept minutes, dont l'essentiel passé sur les prises refusées et le montage plutôt que sur la génération elle-même. Il est sorti le 29 mai 2026.",
    },
    {
      question: "Qui a fait Lost Garden ?",
      answer:
        "Frank Houbre a écrit, réalisé, généré, monté et mixé l'épisode 1 seul, avec un pipeline assisté par IA sous direction humaine. Le scénario vit dans ScreenWeaver et la génération tourne sur Imaginode.",
    },
    {
      question: "Qu'est-ce qui a été coupé de l'épisode 1 ?",
      answer:
        "Tout un monde de surface, cathédrale comprise, que les premières versions du projet avaient. La série est devenue entièrement souterraine et chaque image finie de la surface a été abandonnée. Plusieurs scènes ont aussi été réécrites parce que le plan dont elles avaient besoin ne pouvait pas encore être bien généré.",
    },
    {
      question: "Lost Garden a-t-il été montré en festival ?",
      answer:
        "Oui. L'épisode 1 a été sélectionné au Seoul International AI Film Festival et est arrivé en finale de l'AI London Festival. Il a aussi passé les soixante-cinq mille vues sur YouTube.",
    },
  ],
  related: [
    { label: "Regarder l'épisode 1", href: "/episode-1" },
    { label: "Comment les voix et le son ont été faits", href: "/ai-anime-voice-and-sound" },
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Une seule personne peut-elle faire un animé ?", href: "/can-one-person-make-an-anime" },
    { label: "Kit presse", href: "/press" },
  ],
};

const canOnePersonMakeAnAnime: Guide = {
  article: {
    byline:
      "Un studio, c'est quarante métiers. Un créateur seul, c'est un seul corps. Lesquels de ces métiers l'IA couvre aujourd'hui, lesquels non, et ce qu'il faut vraiment pour finir un épisode d'animé seul.",
    sections: [
      {
        paragraphs: [
          "Oui, et il y a un épisode fini de dix-sept minutes sur ce site pour le prouver. C'est la moitié facile de la réponse. La moitié utile, c'est ce que vous devez être, et ce à quoi vous devez renoncer, pour être cette personne.",
        ],
      },
      {
        heading: "Les métiers qu'un studio répartit",
        paragraphs: [
          "Scénariste, réalisateur, storyboardeur, character designer, décorateur, animateur clé, intervalliste, coloriste, compositeur d'image, monteur, sound designer, compositeur, directeur de voix, producteur. Dans une production traditionnelle, ce sont des personnes différentes avec des compétences différentes, et la plupart ne touchent jamais au scénario.",
          "Seul, vous les faites tous, et la question honnête, c'est lesquels vous pouvez faire mal sans que l'épisode s'effondre.",
        ],
      },
      {
        heading: "Ce que l'IA vous enlève des mains",
        paragraphs: [
          "L'intervalle, la couleur, l'essentiel de la peinture des décors, la production brute des images. Sur Lost Garden, tout ça est passé par Imaginode avec plusieurs modèles vidéo, et c'est ce travail-là qui demandait autrefois un étage entier de gens. Comme goulot d'étranglement, il a vraiment disparu, et c'est toute la raison pour laquelle un épisode solo existe.",
          "Elle prend aussi le premier jet du storyboard, que ScreenWeaver génère à partir du scénario, et une première passe de voix et de musique à partir de briefs écrits. Des premiers jets et des premières passes. Pas des versions finales.",
        ],
        callouts: [
          "L'IA a remplacé les métiers qui demandaient beaucoup de mains. Elle n'a pas remplacé ceux qui demandaient une seule tête.",
        ],
      },
      {
        heading: "Ce que vous devez encore être",
        list: [
          "Un scénariste. Le scénario est la contrainte de tout le reste, et aucun outil n'améliore une scène qui n'a pas de raison d'exister.",
          "Un réalisateur. Où se tient la caméra, ce que le spectateur sait, quand couper. C'est l'essentiel de l'année.",
          "Un monteur. L'épisode devient un épisode au montage. La dérive s'y cache, le rythme s'y trouve, les mauvais plans y meurent.",
          "Quelqu'un pour le son. La moitié du film, et la moitié que les créateurs solo sautent. Lanterne n'a pas de voix, donc sur ce projet le son, c'était le personnage.",
          "Un producteur, c'est à dire la personne qui décide qu'une scène sera réécrite plutôt que régénérée pendant un mois de plus.",
        ],
        trailingParagraphs: [
          "Remarquez qu'aucun de ces métiers n'est dessiner. Vous n'avez pas besoin de dessiner. Vous avez besoin de savoir ce qui cloche dans une image et pourquoi, ce qui est plus proche de la réalisation que de l'illustration.",
        ],
      },
      {
        heading: "Ce que seul coûte",
        paragraphs: [
          "Du temps, en mois. L'épisode 1 a pris environ un an pour dix-sept minutes, et l'essentiel est parti dans les prises refusées et le montage, pas dans la frappe de prompts. Il n'y a personne à qui refiler la partie ennuyeuse, et la partie ennuyeuse, c'est presque tout.",
          "La fatigue du goût, c'est le coût dont personne ne vous prévient. Choisir entre quarante versions d'un plan, scène après scène, use exactement le jugement dont tout dépend. Une bible du monde, c'est ce qui vous permet de continuer à décider quand vous êtes fatigué : le plan respecte la règle ou il ne la respecte pas.",
        ],
      },
      {
        heading: "Par où commencer, si vous êtes seul",
        paragraphs: [
          "Écrivez une scène. Pas une série, pas un monde, une scène avec un changement dedans. Concevez un personnage à la silhouette forte et aux traits peu nombreux, parce que c'est ce qui survit aux outils. Faites un jeu de références et gardez-le à côté de chaque plan. Storyboardez la scène avant d'en générer une seule image. Puis finissez cette scène, avec le son, jusqu'au bout.",
          "Une scène finie de deux minutes vous apprend plus qu'un épisode inachevé, et c'est elle qui vous convainc, vous et tous les autres, que le reste est possible.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Une seule personne peut-elle vraiment faire un animé ?",
      answer:
        "Oui. L'épisode 1 de Lost Garden, dix-sept minutes, a été fait entièrement par une seule personne, est sorti en mai 2026 et a été sélectionné en festival. Il a pris environ un an, et le travail resté humain a été l'écriture, la réalisation, le montage et le son.",
    },
    {
      question: "Faut-il savoir dessiner pour faire un animé seul ?",
      answer:
        "Non. La génération couvre les images. Il faut écrire, réaliser, monter et juger des images, ce qui est plus proche du cinéma que de l'illustration. Savoir ce qui cloche dans un plan compte plus que savoir le corriger à la main.",
    },
    {
      question: "Combien de temps faut-il à une personne pour faire un épisode d'animé ?",
      answer:
        "Comptez en mois. Dix-sept minutes ont pris environ un an, l'essentiel sur les prises refusées et le montage. Une scène courte finie est un premier objectif réaliste et apprend plus qu'un épisode inachevé.",
    },
    {
      question: "Quelle est la partie la plus dure quand on fait un animé seul ?",
      answer:
        "Garder son jugement intact sur des centaines de décisions sans personne avec qui les partager. Une bible du monde écrite est la réponse pratique : elle transforme le choix entre quarante versions en vérification d'une règle.",
    },
  ],
  related: [
    { label: "Le making-of de l'épisode 1", href: "/making-of-episode-1" },
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Animé IA contre animation traditionnelle", href: "/ai-anime-vs-traditional-animation" },
    { label: "Comment les voix et le son ont été faits", href: "/ai-anime-voice-and-sound" },
    { label: "Regarder l'épisode 1", href: "/episode-1" },
  ],
};


const aiAnimeStoryboard: Guide = {
  article: {
    byline:
      "Le storyboard, c'est là qu'un animé IA se décide vraiment, et c'est l'étape que la plupart des gens sautent parce que le générateur la fait paraître facultative. À quoi sert un board généré, ce qu'il ne doit jamais décider, et comment celui de l'épisode 1 a été construit.",
    sections: [
      {
        paragraphs: [
          "Un storyboard existe pour répondre à une question par plan : pourquoi ça, pourquoi ici, pourquoi cette durée. Les générateurs produisent de si belles images pour si peu qu'il paraît raisonnable de sauter la question et d'aller droit à la réponse. Tous les projets qui font ça finissent avec un dossier de plans magnifiques qui ne se montent pas ensemble.",
          "Sur Lost Garden, le board n'est pas dessiné à la main. ScreenWeaver le génère à partir du scénario, scène par scène, et c'est très bien ainsi, parce que ce que le board décide, ce n'est pas l'image. C'est la caméra.",
        ],
      },
      {
        heading: "Ce que le board décide",
        list: [
          "Où se tient la caméra et ce qu'elle peut voir. La moitié des scènes d'un premier jet n'ont aucune caméra, juste du dialogue dans le vide.",
          "L'ordre des plans, et la raison pour laquelle chacun suit le précédent.",
          "Combien de temps chaque plan tient. Un plan généré sera raccourci de toute façon, donc la durée doit être connue avant de générer.",
          "Ce que le spectateur sait à la fin de la scène qu'il ne savait pas au début.",
        ],
        trailingParagraphs: [
          "Rien de tout ça n'est visuel. Ce sont des décisions de mise en scène, et un board qui ne montre que de jolies images ne les a pas prises.",
        ],
      },
      {
        heading: "Pourquoi un board généré, oui, et un film généré, non",
        paragraphs: [
          "Au stade du board, vous choisissez le cadre et le rythme, et l'image peut être grossière, fausse, même laide, du moment que la décision se lit. C'est exactement ce que la génération fait bien : une image rapide et jetable d'une position de caméra. Jeter la moitié du board ne coûte rien, et il faut le faire.",
          "L'erreur, c'est de laisser les images du board devenir le film. Une case de board n'a jamais été vérifiée contre la bible, n'a jamais tenu une référence de personnage, n'a jamais eu à survivre à une coupe. Gardez la décision, régénérez l'image.",
        ],
        callouts: [
          "Un storyboard est une liste de décisions avec des images agrafées dessus. Les images sont la partie jetable.",
        ],
      },
      {
        heading: "Un board à partir du scénario, jamais à partir d'une ambiance",
        paragraphs: [
          "Le board est généré à partir du scénario parce que le scénario est la source de vérité de tout ce qui suit. Quand le board vient d'une ambiance, d'un film de référence, d'un lot d'images que vous aimez, l'histoire se plie pour leur correspondre, et vous ne le remarquerez qu'au montage.",
          "Concrètement, chaque case du board de Lost Garden peut être ramenée à une ligne du scénario. Quand une case ne le peut pas, c'est soit une ligne qui manque, soit un plan qui n'a rien à faire là.",
        ],
      },
      {
        heading: "Ce que le board a appris à l'épisode",
        paragraphs: [
          "Qu'une page de dialogue ne devient une séquence que quand quelqu'un décide où se placer. Qu'une scène avec une caméra révèle une scène sans point de vue. Et que Lanterne, qui ne peut pas parler, avait besoin de plus de plans que le scénario ne le suggérait, parce qu'un grincement et un geste prennent un temps d'écran qu'une réplique ne prend pas.",
          "Plusieurs scènes ont été réécrites après le board, pas après la génération. C'est le moment le moins cher pour changer d'avis, et le board est ce qui le rend visible.",
        ],
      },
      {
        heading: "Comment faire vous-même",
        paragraphs: [
          "Écrivez la scène. Générez une case grossière par plan, à partir du scénario, dans l'outil le plus rapide, sans vous soucier de l'apparence. Lisez le board comme une séquence : chaque case a-t-elle une raison, la scène change-t-elle quelque chose, un inconnu pourrait-il la suivre sans dialogue. Corrigez ça sur le board. Ensuite seulement, ouvrez le générateur qui compte.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "L'IA peut-elle générer un storyboard d'animé ?",
      answer:
        "Oui, et c'est un bon usage de la génération, parce qu'une case de board n'a qu'à montrer une décision de caméra, pas une image finale. Sur Lost Garden, ScreenWeaver génère le board à partir du scénario, scène par scène. Les décisions sont humaines, les images sont jetables.",
    },
    {
      question: "Faut-il un storyboard pour un animé IA ?",
      answer:
        "Plus encore que pour un animé traditionnel. La génération rend bon marché la production de plans sans raison, et le board est l'endroit où chaque plan en reçoit une. Le sauter est la façon la plus courante de finir avec un dossier de beaux clips qui ne se montent pas ensemble.",
    },
    {
      question: "Les images du storyboard doivent-elles servir dans l'épisode final ?",
      answer:
        "Non. Une case de board n'a jamais été vérifiée contre la bible ni contre une référence de personnage. Gardez le cadre et la durée qu'elle a décidés, puis régénérez le plan correctement avec les références attachées.",
    },
    {
      question: "Que doit décider un storyboard ?",
      answer:
        "Où se tient la caméra, l'ordre des plans, combien de temps chacun tient, et ce que le spectateur apprend. Rien de tout ça n'est visuel, ce qui explique qu'un board de jolies cases qui n'a pas pris ces décisions n'est pas encore un board.",
    },
  ],
  related: [
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Faut-il écrire un scénario d'animé avec l'IA ?", href: "/ai-anime-script" },
    { label: "Monter un animé IA : là où l'épisode se fabrique", href: "/editing-ai-anime" },
    { label: "Le making-of de l'épisode 1", href: "/making-of-episode-1" },
  ],
};

const aiAnimeBackgrounds: Guide = {
  article: {
    byline:
      "Les décors générés sont la partie de l'animé IA qui a déjà l'air mieux que la plupart des décors dessinés, et celle qui a le plus de chances de faire ressembler votre film à celui de tout le monde. Comment le monde souterrain de Lost Garden a gardé une seule identité sur tout un épisode.",
    sections: [
      {
        paragraphs: [
          "Les décors, c'est là que la génération brille et là que les projets meurent en silence. Un modèle rend une caverne, une forêt, une salle en ruine avec plus de richesse qu'une petite équipe ne pourrait les peindre, en quelques secondes. Il rend aussi la moyenne de toutes les cavernes qu'il a vues, et un épisode bâti sur des moyennes n'appartient à personne.",
          "Lost Garden est un monde entièrement souterrain. Forêts bleues, brume cyan, champignons lumineux, lys blancs, racines géantes, plateformes de pierre flottantes, rivières dans le noir, machines endormies sous la mousse. Garder ce monde identique pendant dix-sept minutes a été plus dur que garder les personnages.",
        ],
      },
      {
        heading: "La bible est une liste d'interdits",
        paragraphs: [
          "La bible des décors est surtout négative. Jamais de soleil. Pas de ciel. Pas de lumière chaude sauf la lanterne et les machines. Aucune architecture qui semble bâtie par des humains au cours du dernier millénaire. Ces règles ont fait plus que n'importe quelle description, parce qu'on peut dire à un modèle quoi faire et il dérivera, alors qu'une règle sur ce qui ne doit pas apparaître se vérifie facilement sur chaque plan.",
          "La palette est le second verrou. Bleu, cyan, pierre grise mouillée, un seul accent chaud. Un plan généré avec une lumière dorée de fin de journée est magnifique et appartient à un autre film, et la bible est ce qui vous permet de le dire sans discuter avec vous-même.",
        ],
        callouts: [
          "Un monde avec des règles se vérifie. Un monde avec des adjectifs ne peut que s'admirer.",
        ],
      },
      {
        heading: "Le monde a dû être réduit pour exister",
        paragraphs: [
          "Les premières versions avaient une cathédrale et un extérieur. Plus le projet grandissait, plus il était clair que l'identité était en dessous, et la surface a été retirée entièrement, images finies comprises. Cette coupe est la raison pour laquelle les décors se lisent comme un seul lieu : chaque endroit restant partage la même lumière, la même pierre, la même absence de ciel.",
          "Un monde qui essaie de tout avoir n'a rien de reconnaissable. Retirez un lieu et ceux qui restent deviennent plus forts.",
        ],
      },
      {
        heading: "La cohérence est un problème plus petit que pour les personnages, et différent",
        paragraphs: [
          "Personne ne suit un rocher des yeux. Une caverne peut être régénérée entre deux plans et aucun spectateur ne remarquera qu'une fissure a bougé, tant que la lumière, la palette et l'échelle tiennent. Ce qu'il remarque, c'est un changement d'humeur : une caverne humide et froide qui devient sèche et chaude d'une coupe à l'autre.",
          "Donc la référence d'un décor n'est pas une image unique à copier. Ce sont deux ou trois plans d'ancrage par lieu qui fixent la lumière et l'échelle, et chaque nouveau plan de cet endroit se juge contre eux.",
        ],
      },
      {
        heading: "Le problème de la moyenne",
        paragraphs: [
          "Demandez une forêt mystique et vous obtenez la moyenne de toutes les forêts mystiques : symétrique, centrée, éclairée uniformément, chaque arbre en héros. Ce look est ce qui rend les décors IA reconnaissables au premier coup d'oeil. Le casser, c'est demander le spécifique : une forêt où les champignons sont la seule lumière, où les racines sont plus grosses que les arbres, où la caméra est basse et la moitié du cadre dans la brume.",
          "Spécifique ne veut pas dire détaillé. L'excès de détail est lui-même un indice. Un décor dessiné a des zones plates parce qu'un peintre a décidé de ce qui comptait. Un décor généré texture tout, sauf si vous lui dites de ne pas le faire.",
        ],
      },
      {
        heading: "Quoi faire",
        paragraphs: [
          "Écrivez les règles négatives d'abord. Fixez une palette et un seul accent chaud. Réduisez le monde aux lieux qui partagent une identité. Faites deux ou trois plans d'ancrage par lieu et jugez chaque nouveau plan contre eux. Et demandez ce qui est étrange dans votre monde, pas ce qui est beau dans les mondes en général.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "L'IA peut-elle générer des décors d'animé ?",
      answer:
        "Oui, et souvent mieux qu'une petite équipe ne pourrait les peindre. Le problème n'est pas la qualité mais l'identité : un modèle rend la moyenne de tous les lieux similaires qu'il a vus, et un épisode bâti sur des moyennes ressemble à tous les autres projets IA. Une bible avec des règles négatives est ce qui garde les décors dans un seul lieu.",
    },
    {
      question: "Comment garder des décors IA cohérents entre les plans ?",
      answer:
        "Autrement que pour les personnages. Personne ne suit un rocher, donc le détail exact peut changer. Ce qui doit tenir, c'est la lumière, la palette et l'échelle. Deux ou trois plans d'ancrage par lieu, et chaque nouveau plan jugé contre eux, suffisent.",
    },
    {
      question: "Pourquoi les décors d'animé IA se ressemblent-ils tous ?",
      answer:
        "Parce que les prompts génériques rendent des moyennes génériques : centrées, symétriques, éclairées uniformément, texturées partout. Demander ce qui est spécifique et étrange dans votre monde, et interdire ce qui n'y appartient pas, est ce qui casse le look.",
    },
    {
      question: "Quelle est la bible du monde de Lost Garden ?",
      answer:
        "Un court jeu de règles pour un monde souterrain : jamais de soleil, pas de ciel, palette bleue et cyan, pierre mouillée, un accent chaud venant de la lanterne et des machines, pas d'architecture humaine récente. C'est surtout une liste de ce qui ne doit pas apparaître.",
    },
  ],
  related: [
    { label: "Écrire un prompt style animé qui vous appartient", href: "/anime-style-prompts" },
    { label: "Garder un personnage cohérent d'un plan à l'autre", href: "/ai-character-consistency" },
    { label: "Pourquoi l'animé IA est moche, et les remèdes", href: "/why-ai-anime-looks-bad" },
    { label: "Le making-of de l'épisode 1", href: "/making-of-episode-1" },
  ],
};

const aiAnimeScript: Guide = {
  article: {
    byline:
      "La question la plus cherchée du domaine, c'est de savoir si l'IA peut écrire votre animé. Elle peut. L'épisode de ce site n'a pas été écrit comme ça, et voici pourquoi, de la part de quelqu'un qui construit des outils d'écriture pour vivre.",
    sections: [
      {
        paragraphs: [
          "Je construis ScreenWeaver, un environnement d'écriture pour le cinéma, et Lost Garden y est écrit à la main. Ces deux faits sont vrais en même temps, et la raison n'est pas une pudeur vis-à-vis de l'IA. C'est que le scénario est le seul endroit où la plus grande force d'un modèle, produire la moyenne plausible, est exactement ce qui tue une histoire.",
        ],
      },
      {
        heading: "Ce qu'un modèle écrit quand vous lui demandez un scénario d'animé",
        paragraphs: [
          "Un scénario correct. Un élu au passé mystérieux, un mentor, une trahison au deuxième acte, une escalade, un sacrifice. Chaque temps fort tombe là où mille autres scénarios le mettent, parce que c'est là que les données d'entraînement le mettent. Ça se lit bien. C'est le scénario que tous ceux qui ont tapé le même prompt ont eu aussi.",
          "Ce n'est pas un problème de qualité. Les modèles écrivent des scènes plus propres que la plupart des premiers jets. C'est un problème d'identité. Une histoire, c'est l'ensemble des choix que personne d'autre ne ferait, et un modèle est construit pour faire le choix que la plupart des gens feraient.",
        ],
        callouts: [
          "Une image générée peut être sélectionnée. Une histoire générée a déjà sélectionné à votre place.",
        ],
      },
      {
        heading: "Lost Garden n'y survivrait pas",
        paragraphs: [
          "Le personnage principal ne peut pas parler. L'enfant n'est pas une arme, pas un miracle à dépenser, pas un symbole. Le chevalier est l'un des plus faibles des treize et c'est le point. Le monde est entièrement souterrain et il n'y a pas de ciel. Chacun de ces choix, un modèle le signalerait comme un problème et le corrigerait discrètement, parce que chacun rend l'histoire plus difficile à raconter de façon conventionnelle.",
          "Ces choix difficiles sont l'histoire. Retirez-les et vous avez une fantasy correcte sur un chevalier fort qui sauve une fille magique, ce qui existe déjà dix mille fois.",
        ],
      },
      {
        heading: "Où l'IA a sa place dans l'écriture",
        paragraphs: [
          "Partout sauf dans les choix. Relire un jet et demander ce qu'un inconnu ne comprendrait pas. Vérifier qu'une scène change quelque chose. Trouver où l'exposition se cache. Générer le storyboard à partir de la scène finie, ce que fait ScreenWeaver. Traduire le scénario pour les sous-titres en trois langues, puis corriger la traduction à la main.",
          "C'est beaucoup d'aide, et rien de tout ça ne décide de ce qu'est l'histoire.",
        ],
      },
      {
        heading: "Le seul test",
        paragraphs: [
          "Avant de garder une scène, demandez ce qu'elle change. Que sait le spectateur à la fin qu'il ne savait pas au début. Si la réponse est rien, aucune génération en aval ne la sauvera, et un modèle ne vous le dira pas, parce que la scène se lit bien.",
          "Le scénario est la contrainte de tout le reste du pipeline. C'est aussi la chose la moins chère à changer, et la seule qui soit entièrement à vous. Écrivez-le.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "L'IA peut-elle écrire un scénario d'animé ?",
      answer:
        "Elle peut en écrire un correct, et c'est le problème. Un modèle produit la moyenne plausible : l'élu, le mentor, la trahison, le sacrifice, chaque temps fort là où mille scénarios le mettent. Une histoire est l'ensemble des choix que personne d'autre ne ferait, ce qui est la seule chose qu'un modèle est construit pour ne pas faire.",
    },
    {
      question: "Lost Garden a-t-il été écrit avec l'IA ?",
      answer:
        "Non. Le scénario est écrit à la main dans ScreenWeaver. L'IA intervient en aval : le storyboard est généré à partir du scénario fini, les jets sont relus pour la clarté, et les sous-titres sont traduits puis corrigés à la main. Les choix d'histoire sont humains.",
    },
    {
      question: "À quoi l'IA peut-elle aider en écriture de scénario ?",
      answer:
        "À tout sauf aux choix. Relire un jet pour ce qu'un inconnu ne suivrait pas, trouver l'exposition cachée, vérifier que chaque scène change quelque chose, générer un board à partir de la scène finie, faire une première traduction. Rien de tout ça ne décide de ce qu'est l'histoire.",
    },
    {
      question: "Par où commencer un scénario d'animé ?",
      answer:
        "Par une scène qui change quelque chose, pas par un monde ni une série. Demandez ce que le spectateur sait à la fin qu'il ne savait pas au début. Si la réponse est rien, aucune génération plus tard ne la sauvera.",
    },
  ],
  related: [
    { label: "Storyboard d'animé IA : ce que le board décide", href: "/ai-anime-storyboard" },
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
    { label: "Lost Garden : l'histoire, le monde et les personnages", href: "/lost-garden-story-and-characters" },
    { label: "Le texte du créateur sur la fabrication de la série", href: "/vision" },
  ],
};

const aiAnimeCopyright: Guide = {
  article: {
    byline:
      "À qui appartient un animé IA, ce qui peut être protégé, et comment Lost Garden est construit pour que la réponse soit claire. Écrit par un réalisateur, pas par un avocat, donc à lire comme une pratique, pas comme un conseil.",
    sections: [
      {
        paragraphs: [
          "C'est la question sous chaque animation IA qui attire un peu d'attention, et elle mérite une réponse simple plutôt qu'un haussement d'épaules. En bref : les parties qu'un humain a écrites peuvent être protégées, celles qu'une machine a générées seule ne le peuvent en général pas, et le travail utile consiste à savoir lesquelles sont lesquelles dans votre propre projet avant qu'on vous le demande.",
          "Rien ici n'est un conseil juridique. Les règles diffèrent selon les pays et bougent encore. Ce qui suit, c'est la façon dont une production indépendante s'y prend.",
        ],
      },
      {
        heading: "Où en est la position, en gros",
        paragraphs: [
          "Les déclarations publiques les plus claires à ce jour viennent du Copyright Office américain, qui a dit qu'un contenu généré entièrement par une machine, sans auteur humain, ne peut pas être enregistré, alors que les contributions humaines à une oeuvre, son écriture, sa sélection et son agencement, son montage, le peuvent. D'autres juridictions ont été moins explicites, et aucune n'a dit le contraire.",
          "Lisez ça attentivement et ça décrit assez bien un film assisté par IA. Le scénario est écrit. Le montage est écrit. Le choix de quarante prises refusées et d'une gardée est un acte d'auteur. Les pixels à l'intérieur d'un seul plan généré sont la zone grise.",
        ],
        callouts: [
          "Le film est la somme des décisions humaines. Le plan est l'endroit où la machine a fait sa part. La protection suit les décisions.",
        ],
      },
      {
        heading: "Comment Lost Garden est construit pour ça",
        paragraphs: [
          "Le scénario est écrit à la main. Le monde, les personnages, Lanterne et Rose et les treize chevaliers, le souterrain sans ciel, tout ça est original et conçu pour ce projet. Le storyboard est généré à partir du scénario mais chaque décision de caméra y est humaine. Le montage, le rythme, le placement du son, le choix de ce qui reste, sont humains.",
          "Les sorties générées sont sélectionnées, corrigées et refusées quand elles cassent la bible ou sonnent générique. Cette dernière habitude compte pour autre chose que le goût : un plan qui est la moyenne des données d'entraînement est le plan qui a le moins de chances d'appartenir à quelqu'un.",
        ],
      },
      {
        heading: "Concevez vos propres choses",
        paragraphs: [
          "La protection la plus forte d'un projet indépendant, c'est que ses personnages et son monde lui appartiennent. Pas dans le style d'une série connue, pas un prompt qui nomme un autre studio, pas un personnage célèbre avec la coiffure changée. Une armure vide avec une lanterne pour tête et une enfant qui fait pousser les fleurs sont à nous au sens le plus simple, et ça vaut plus que n'importe quel enregistrement.",
          "C'est aussi la position honnête vis-à-vis des gens dont le travail a entraîné les modèles. Vous ne réglerez pas cette dette avec un budget indépendant, mais vous pouvez refuser de l'aggraver en imitant exprès le style d'un artiste vivant.",
        ],
      },
      {
        heading: "Dites-le, et gardez des traces",
        paragraphs: [
          "Lost Garden dit sur son propre site ce qui est généré et ce qui ne l'est pas, liste les outils et explique le pipeline. Gardez les versions du scénario, les boards, les jeux de références, les prises refusées. Si la question se pose un jour formellement, le registre des décisions humaines est la réponse, et un registre que vous n'avez pas tenu ne se reconstruit pas.",
        ],
      },
      {
        heading: "Ce que ça ne règle pas",
        paragraphs: [
          "Si une seule image générée peut être protégée. Si l'entraînement était loyal. Si les règles seront les mêmes dans deux ans. Rien de tout ça n'est au pouvoir d'un réalisateur indépendant. Ce qui est en votre pouvoir, c'est de faire une oeuvre où l'apport humain est réel, visible et documenté, pour que, quoi que les règles deviennent, votre film soit du bon côté.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Peut-on protéger un animé IA par le droit d'auteur ?",
      answer:
        "Les parties écrites par un humain, en général oui : le scénario, le montage, la sélection et l'agencement des plans, les personnages et le monde originaux. Un contenu purement généré sans auteur humain a été décrit comme non enregistrable, notamment par le Copyright Office américain. Les règles diffèrent selon les pays et ceci n'est pas un conseil juridique.",
    },
    {
      question: "À qui appartient Lost Garden ?",
      answer:
        "À Frank Houbre. Le scénario, les personnages, le monde et le montage sont un travail humain original, les plans générés sont sélectionnés et corrigés sous cette direction, et les archives de production sont conservées. Le site indique ce qui est généré et ce qui ne l'est pas.",
    },
    {
      question: "Est-il légal de faire un animé avec l'IA ?",
      answer:
        "Le faire, oui. Les questions ouvertes portent sur ce qui peut être protégé et sur la façon dont les modèles ont été entraînés, pas sur le droit de les utiliser. Concevoir ses propres personnages et ne pas imiter le style d'un artiste vivant tient un projet à l'écart du pire.",
    },
    {
      question: "Dois-je dire que mon animé utilise l'IA ?",
      answer:
        "Oui. C'est la position honnête, c'est ce qu'attendent les bases de données et les festivals qui acceptent les oeuvres IA, et le cacher est la seule chose qui transforme à coup sûr une question technique en question de réputation.",
    },
  ],
  related: [
    { label: "Un animé IA est-il un vrai animé ?", href: "/is-ai-anime-real-anime" },
    { label: "Comment reconnaître un animé fait avec l'IA", href: "/how-to-tell-if-anime-is-ai" },
    { label: "Notes de production de Lost Garden", href: "/process" },
    { label: "Les festivals de films IA qui acceptent l'animation", href: "/ai-film-festivals-animation" },
  ],
};

const historyOfAiAnime: Guide = {
  article: {
    byline:
      "Qui a fait le premier animé IA dépend de ce qu'on compte. Une courte histoire datée, des premiers décors en 2023 aux séries diffusées, avec ce que chaque étape a réellement prouvé.",
    sections: [
      {
        paragraphs: [
          "La question du premier animé IA est souvent posée et mal répondue, parce qu'elle a trois réponses honnêtes selon qu'on parle d'un court métrage, d'une série diffusée ou d'un épisode indépendant complet. Les voici dans l'ordre, avec les dates.",
        ],
      },
      {
        heading: "2023 : les premiers décors, et la première levée de boucliers",
        paragraphs: [
          "En janvier 2023, Netflix Japon a sorti The Dog & the Boy, un court produit avec WIT Studio dont les décors ont été générés par IA puis corrigés à la main. Trois minutes, et la première fois qu'un grand studio mettait les mots générés par IA dans un générique. La réaction a été immédiate et surtout hostile, et elle a donné le ton de tout ce qui a suivi.",
          "Un mois plus tard, Corridor Digital publiait Anime Rock, Paper, Scissors, un court fait en filmant des acteurs puis en transformant les images avec des modèles. Ça ressemblait à de l'animé, c'était fait par un studio YouTube en quelques semaines, et ça prouvait qu'une petite équipe pouvait y arriver. Ça a aussi attiré la même colère, pour les mêmes raisons.",
        ],
      },
      {
        heading: "2025 : la première série diffusée",
        paragraphs: [
          "Twins Hinahima, produit par Frontier Works et KaKa Creation, a été diffusé sur Tokyo MX en mars 2025. Environ 95 % de ses plans d'animation impliquaient de l'IA générative. C'était un vrai animé de télévision, au Japon, fait pour le marché japonais, et selon toutes les définitions qu'utilisent les bases de données, il compte. C'est la réponse à la question du premier animé IA au sens strict.",
          "La même année, Vidu et Aura Productions ont sorti une série de science-fiction de cinquante courts épisodes, qui a montré le versant volume de l'histoire : pas un épisode de prestige, mais un calendrier.",
        ],
        callouts: [
          "En 2025, la question a cessé d'être de savoir si l'animé IA pouvait exister, pour devenir de savoir si quelqu'un en voulait.",
        ],
      },
      {
        heading: "2026 : des services et des épisodes solo",
        paragraphs: [
          "Anipops a été lancé en 2026 comme premier service de streaming payant du Japon dédié aux animés IA originaux, ce qui est le moment où le format a acquis un modèle économique plutôt qu'une démo.",
          "Le 29 mai 2026, Lost Garden a sorti un épisode de dix-sept minutes écrit, réalisé, généré, monté et mixé par une seule personne. Ce n'est pas le premier animé IA. C'est, à ma connaissance, le premier épisode complet d'une série originale fait seul, et il a été sélectionné au Seoul International AI Film Festival et est arrivé en finale de l'AI London Festival sur cette base.",
        ],
      },
      {
        heading: "Ce que chaque étape a réellement prouvé",
        list: [
          "2023 a prouvé que l'IA pouvait faire un plan qui ressemble à de l'animé, et que le public s'en indignerait.",
          "2025 a prouvé qu'une série complète pouvait être diffusée à la télévision et comptée comme animé selon la définition la plus stricte.",
          "2026 a prouvé que le format avait des clients, et qu'une seule personne pouvait finir un épisode avec un monde à elle.",
        ],
        trailingParagraphs: [
          "Rien n'a encore prouvé que l'animé IA peut être grand. C'est l'étape ouverte, et elle n'est pas technique.",
        ],
      },
      {
        heading: "Pourquoi les dates comptent",
        paragraphs: [
          "Trois ans séparent les premiers décors corrigés d'un épisode solo. L'écart entre ce qui était possible en 2023 et en 2026 est plus grand que l'écart entre 2023 et la décennie d'avant. Quiconque planifie un projet en supposant que les outils resteront tels quels planifie pour une année déjà finie.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Quel a été le premier animé IA ?",
      answer:
        "Ça dépend de ce qu'on compte. Le premier court d'un grand studio avec des décors générés par IA est The Dog & the Boy, Netflix Japon et WIT Studio, janvier 2023. La première série diffusée est Twins Hinahima sur Tokyo MX en mars 2025, avec de l'IA générative dans environ 95 % de ses plans. Le premier épisode complet d'une série originale fait par une seule personne, à notre connaissance, est Lost Garden, sorti le 29 mai 2026.",
    },
    {
      question: "Twins Hinahima est-il le premier animé IA ?",
      answer:
        "C'est la première série télévisée d'animé IA au sens strict : produite au Japon par Frontier Works et KaKa Creation, diffusée sur Tokyo MX en mars 2025, et comptée comme animé selon les règles des bases de données elles-mêmes. Des courts utilisant l'IA la précèdent de deux ans.",
    },
    {
      question: "Lost Garden est-il le premier animé IA ?",
      answer:
        "Non, et il ne le prétend pas. C'est un épisode de dix-sept minutes d'une série originale fait entièrement par une seule personne, sorti en mai 2026, ce qui est une autre première. Les animés IA diffusés et les courts de studio l'ont précédé.",
    },
    {
      question: "À quelle vitesse l'animé IA change-t-il ?",
      answer:
        "Trois ans séparent des décors IA corrigés dans un court de trois minutes d'un épisode solo de dix-sept minutes. Des plans faits sur les outils d'aujourd'hui seront dépassés avant la fin de la production.",
    },
  ],
  related: [
    { label: "Les 6 meilleurs animés IA, classés", href: "/best-ai-anime" },
    { label: "Un animé IA est-il un vrai animé ?", href: "/is-ai-anime-real-anime" },
    { label: "Le making-of de l'épisode 1", href: "/making-of-episode-1" },
    { label: "Une seule personne peut-elle faire un animé ?", href: "/can-one-person-make-an-anime" },
  ],
};

const animeStylePrompts: Guide = {
  article: {
    byline:
      "Tous les guides de prompts animé sont des listes de mots magiques. Celui-ci est l'inverse : comment on écrit les prompts sur une production où le style doit appartenir à un seul film, et pourquoi le meilleur prompt est surtout une liste de ce qu'il faut laisser dehors.",
    sections: [
      {
        paragraphs: [
          "Tapez style animé dans n'importe quel générateur et vous obtenez du style animé : de grands yeux, un trait propre, un dégradé doux, un personnage pile au centre, éclairé uniformément, qui vous regarde. C'est correct et c'est ce que tout le monde obtient. Tout le problème du prompt pour un vrai projet, c'est de sortir de cette moyenne, et les mots magiques n'y arrivent pas, parce que les mots magiques sont la moyenne.",
        ],
      },
      {
        heading: "Le modèle vous donne la moyenne",
        paragraphs: [
          "Un modèle a vu un très grand nombre d'images d'animé et, quand on lui en demande une, rend leur centre. Composition centrée, visage symétrique, tout net, rien de coupé, rien dans l'ombre. Ce centrage est la signature la plus reconnaissable des images générées, et il vient du fait que le prompt est général.",
          "Donc le premier travail d'un prompt n'est pas la description. C'est le déplacement : pousser le résultat loin du centre, dans une direction qui appartient à votre film.",
        ],
        callouts: [
          "Un prompt générique demande de l'animé. Un prompt de production demande la seule image qui ne pourrait exister que dans ce film.",
        ],
      },
      {
        heading: "Comment un prompt de Lost Garden se construit réellement",
        list: [
          "La référence d'abord. Une character sheet ou un plan d'ancrage du lieu, attaché, pas décrit. Les mots dérivent, les images non.",
          "La caméra. Basse, large, de dos, la moitié du cadre dans la brume. Une décision de caméra est ce qui arrête le centrage.",
          "Les règles de la bible. Bleu et cyan, pierre mouillée, pas de ciel, une seule lumière chaude. Identiques sur chaque plan.",
          "Ce qui est interdit. Pas de soleil, pas de lumière ambiante chaude, pas de foule, pas d'architecture propre. La liste négative fait plus que la positive.",
          "Puis, en dernier et en plus court, l'action du plan.",
        ],
        trailingParagraphs: [
          "Remarquez que les mots style animé n'y sont pas. Le style vient des références et de la bible. Le nommer ne fait que ramener le résultat vers la moyenne.",
        ],
      },
      {
        heading: "Plus court, pas plus long",
        paragraphs: [
          "L'instinct dit qu'un prompt plus long est plus maîtrisé. C'est l'inverse. Chaque terme de plus est une chose de plus que le modèle peut pondérer différemment d'une exécution à l'autre, et les prompts longs dérivent plus entre les plans, pas moins. La cohérence d'un épisode vient des références et des règles identiques sur chaque plan, et d'un texte libre court.",
        ],
      },
      {
        heading: "Ne nommez ni un studio ni un artiste",
        paragraphs: [
          "Ça marche, c'est bien le problème. Un prompt qui nomme un studio connu rend le look de ce studio, et votre film devient la copie de quelque chose qui a un avocat. C'est aussi le moyen le plus rapide de faire que le style ne soit pas le vôtre. Construisez le look à partir de vos propres références et de vos propres règles. Ça prend plus de temps et c'est la seule chose qui survit.",
        ],
      },
      {
        heading: "Le test",
        paragraphs: [
          "Montrez à un inconnu trois images de votre projet et trois d'un autre animé IA. S'il ne peut pas dire lesquelles sont les vôtres, le prompt est encore générique, quoi qu'il dise. Sur Lost Garden le test est facile parce que le monde n'a pas de ciel, et une image avec un ciel dedans est à quelqu'un d'autre.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Quel est le meilleur prompt pour un style animé ?",
      answer:
        "Il n'y a pas de formule magique, parce que tout prompt général rend l'image d'animé moyenne : centrée, symétrique, éclairée uniformément. Un prompt de production se construit à partir d'une référence attachée, d'une décision de caméra, des règles de la bible, d'une liste d'interdits et d'une courte description de l'action. Le style vient des références, pas des mots.",
    },
    {
      question: "Pourquoi mes images d'animé IA sont-elles toutes centrées et pareilles ?",
      answer:
        "Parce qu'un prompt général rend la moyenne des données d'entraînement, et la moyenne est centrée. Une décision de caméra dans le prompt, basse, large, de dos, coupée, est ce qui la déplace. Attachez des références au lieu de les décrire.",
    },
    {
      question: "Faut-il écrire des prompts longs pour la cohérence ?",
      answer:
        "Non. Les prompts longs dérivent plus entre les plans, parce que chaque terme de plus peut être pondéré différemment à chaque exécution. La cohérence vient de références et de règles identiques sur chaque plan et d'un texte libre court.",
    },
    {
      question: "Peut-on prompter dans le style d'un studio connu ?",
      answer:
        "Ça marche et c'est une mauvaise idée. Vous obtenez le look de ce studio, pas le vôtre, et un projet bâti dessus est à la fois dérivé et exposé. Construisez le style à partir de vos propres références et de votre bible.",
    },
  ],
  related: [
    { label: "Garder un personnage cohérent d'un plan à l'autre", href: "/ai-character-consistency" },
    { label: "Décors d'animé IA : un seul monde, pas une moyenne", href: "/ai-anime-backgrounds" },
    { label: "Pourquoi l'animé IA est moche, et les remèdes", href: "/why-ai-anime-looks-bad" },
    { label: "Générateurs d'animé IA : ce qu'ils produisent vraiment", href: "/ai-anime-generator" },
  ],
};

const editingAiAnime: Guide = {
  article: {
    byline:
      "Des images générées ne font pas un film. Le montage, c'est là que l'épisode 1 en est devenu un, et la coupe est l'outil qui cache la plus grande part de ce que la génération rate. Comment monter de l'animation IA, par la personne qui en a monté dix-sept minutes.",
    sections: [
      {
        paragraphs: [
          "Tous les guides sur l'animé IA s'arrêtent à la génération, comme si les clips étaient le film. Ce sont la matière première. L'épisode existe dans le montage : le rythme, les plans tenus, le choix de ce que le spectateur voit et pendant combien de temps, et les cent décisions de perdre un beau plan parce qu'il était faux pour la scène. Rien de ça n'est sorti d'un modèle, et c'est à tout ça que les gens ont réagi.",
        ],
      },
      {
        heading: "Couper sur le mouvement",
        paragraphs: [
          "La plus vieille règle du montage est ici la plus utile. Une coupe qui tombe sur un mouvement, un demi-tour, un pas, une main qui se tend, est invisible, et une coupe invisible cache la petite dérive entre deux plans générés. Une coupe sur une image immobile invite l'oeil à comparer, et la comparaison est là où l'IA se voit.",
          "C'est pour ça que le board décide de la durée des plans avant la génération. Vous coupez vers le mouvement que vous aviez prévu, pas à la recherche d'un mouvement après coup.",
        ],
        callouts: [
          "Un spectateur pardonne un visage qui change pendant un demi-tour. Il ne pardonne jamais un visage qui change pendant qu'il le regarde.",
        ],
      },
      {
        heading: "Court sur les visages, long sur le monde",
        paragraphs: [
          "La dérive est fonction de la durée. Deux secondes sur un visage se trahissent rarement, huit secondes toujours. Donc les plans de personnage sont courts et les plans de décor sont longs, et le rythme d'un animé IA tend vers ce schéma que ça vous plaise ou non.",
          "L'astuce, c'est d'en faire une vertu. Lost Garden est un film lent et silencieux, et ses plans longs sont sur des cavernes, des machines, de la brume, pas sur un visage qui fait semblant de jouer. C'est un choix de style né d'une limite technique, et la plupart des styles le sont.",
        ],
      },
      {
        heading: "Couper vers ce qu'ils voient, pas vers eux",
        paragraphs: [
          "Quand un personnage réagit, le plan généré de la réaction est le plan risqué. Coupez plutôt vers ce qu'il regarde, et laissez le son porter la réaction. Lanterne n'a pas de visage, donc ses réactions sont déjà un grincement et un geste, et l'épisode a appris tôt que la chose qu'il voit, c'est le plan.",
        ],
      },
      {
        heading: "Régénérer ou contourner : la seule vraie décision",
        paragraphs: [
          "Chaque plan défectueux pose la même question. Est-il faux, ou seulement imparfait. Faux veut dire régénérer : le plan contredit la bible, le personnage est quelqu'un d'autre, l'action n'est pas l'action. Imparfait veut dire contourner : le raccourcir, passer en large, mettre le défaut dans l'ombre, couper avant que l'oeil le trouve.",
          "Distinguer les deux vite, c'est l'essentiel du métier. Régénérer tout ce qui est imparfait ne finit jamais. Contourner tout ce qui est faux fait un film que personne ne croit.",
        ],
      },
      {
        heading: "Perdre le beau plan",
        paragraphs: [
          "La coupe la plus dure, c'est l'image que vous adorez et qui n'a rien à faire là. Elle a été générée avant que la scène ait une raison, ou c'est une lumière dorée dans un monde sans ciel, ou elle est simplement plus longue que ce que la scène peut tenir. Gardez-la et le film se plie autour. La bible est ce qui vous permet de la couper sans vous battre, parce que la règle n'est pas votre goût et que le plan casse la règle.",
        ],
      },
      {
        heading: "Le son est la moitié du montage",
        paragraphs: [
          "Des pas sur la pierre mouillée, un grincement d'armure, la distance d'une caverne. Le son placé au montage est ce qui rend réel un espace généré, et il recouvre une coupe que l'image seule ne pouvait pas tenir. La musique en dernier, et moins que n'importe quelle bande-annonce. Le silence aussi est une coupe.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Comment monter un animé généré par IA ?",
      answer:
        "Comme un film, avec trois habitudes en plus. Couper sur le mouvement pour que la dérive entre les plans reste invisible. Garder les plans de personnage courts et les plans de décor longs, puisque la dérive grandit avec la durée. Et décider vite si un plan défectueux est faux, donc à régénérer, ou seulement imparfait, donc à contourner.",
    },
    {
      question: "Pourquoi le montage compte-t-il autant en animation IA ?",
      answer:
        "Parce que la génération produit des clips, pas un film. Le rythme, les plans tenus, ce que le spectateur voit et pendant combien de temps, et la décision de perdre un beau plan qui n'a rien à faire là, c'est là qu'un épisode se fabrique. Les spectateurs réagissent au montage, pas au modèle.",
    },
    {
      question: "Comment cacher les incohérences entre des plans IA ?",
      answer:
        "Couper sur le mouvement, garder le plan court, passer en large, mettre le personnage dans l'ombre, ou couper vers ce qu'il regarde plutôt que vers lui. Le son placé au montage couvre le reste. Le plan long sur un visage est la seule chose que rien ne cache.",
    },
    {
      question: "Faut-il régénérer un mauvais plan ou le contourner ?",
      answer:
        "Régénérer s'il est faux : il contredit la bible, le personnage est quelqu'un d'autre, l'action n'est pas l'action. Le contourner s'il est seulement imparfait. Régénérer tout ce qui est imparfait ne finit jamais, et contourner tout ce qui est faux fait un film que personne ne croit.",
    },
  ],
  related: [
    { label: "Comment les voix et le son ont été faits", href: "/ai-anime-voice-and-sound" },
    { label: "Garder un personnage cohérent d'un plan à l'autre", href: "/ai-character-consistency" },
    { label: "Storyboard d'animé IA : ce que le board décide", href: "/ai-anime-storyboard" },
    { label: "Le making-of de l'épisode 1", href: "/making-of-episode-1" },
  ],
};

const whyAiAnimeLooksBad: Guide = {
  article: {
    byline:
      "La plupart des animés IA sont moches, et c'est rarement la faute du modèle. Les six raisons, dans l'ordre où elles arrivent d'habitude, et ce qu'un épisode fini a fait pour chacune.",
    sections: [
      {
        paragraphs: [
          "La critique est juste. La plupart des animés IA sont moches : lisses, vides, tous pareils, une bande-annonce pour une série qui n'existe pas. Ce qui cloche dans la critique, c'est le diagnostic. Les gens accusent le modèle, et le modèle est la seule partie qui s'est améliorée chaque trimestre. Les problèmes sont en amont et en aval, et ce sont les mêmes six sur presque tous les projets.",
        ],
      },
      {
        heading: "1. Il n'y a pas d'histoire, donc rien vers quoi couper",
        paragraphs: [
          "Une bobine de beaux plans sans scène entre eux paraît mauvaise même quand chaque image est bonne, parce que l'oeil n'a rien à suivre. C'est la cause la plus courante et la moins discutée, puisqu'elle n'a rien à voir avec l'IA. Le remède, c'est un scénario avec des scènes qui changent quelque chose, avant toute génération.",
        ],
      },
      {
        heading: "2. C'est la moyenne",
        paragraphs: [
          "Personnages centrés, visages symétriques, pièces éclairées uniformément, chaque arbre en héros, de la texture partout. Ce look est la moyenne des données d'entraînement et c'est ce qu'un prompt général rend. Il se reconnaît en une seconde et n'appartient à personne. Le remède, c'est une bible avec des règles et des interdits, des références attachées plutôt que décrites, et une décision de caméra dans chaque prompt.",
        ],
        callouts: [
          "Un mauvais animé IA n'est pas laid. Il est moyen, ce qui est pire, parce que la laideur au moins appartient à quelqu'un.",
        ],
      },
      {
        heading: "3. Les visages dérivent et les plans sont trop longs",
        paragraphs: [
          "Un personnage qui est une personne légèrement différente à chaque plan casse l'illusion plus vite que n'importe quel autre défaut, et un plan long sur un visage est là où ça se voit. Le remède, c'est un jeu de références par personnage, un design à la silhouette forte et aux traits peu nombreux, et des plans de personnage courts coupés sur le mouvement. Lanterne est une armure vide avec une lanterne pour tête précisément pour cette raison.",
        ],
      },
      {
        heading: "4. Tout flotte",
        paragraphs: [
          "Le mouvement généré interpole. L'animé claque, tient, saute des images exprès. Donc les personnages générés glissent vers des poses qu'ils devraient frapper, les pieds patinent au lieu de se planter, et un combat ressemble à une danse sous l'eau. Le remède, c'est en partie de diriger contre, en partie de choisir ce qu'on montre : Lost Garden est silencieux et lent, et son action est surtout des choses qui se réveillent, parce que c'est ce que le mouvement fait bien.",
        ],
      },
      {
        heading: "5. De la musique sous tout",
        paragraphs: [
          "Les partitions ne coûtent plus rien, donc chaque scène en reçoit une, et l'épisode s'aplatit en bande-annonce de dix-sept minutes. Le remède, c'est une bible du son aussi stricte que la bible visuelle, des pas et des ambiances placés à la main, et du silence là où un projet moins exigeant remplirait. La moitié de ce qui rend un animé IA réel est dans l'audio, et c'est la moitié que la plupart des projets sautent entièrement.",
        ],
      },
      {
        heading: "6. Il n'a jamais été monté",
        paragraphs: [
          "Des clips mis bout à bout dans l'ordre de génération ne sont pas un montage. Le rythme, les plans tenus, couper vers ce qu'un personnage voit plutôt que vers lui, perdre le beau plan qui n'a rien à faire là : c'est là qu'un film se fabrique, et c'est l'étape que la plupart des projets IA traitent comme un export. Le remède, c'est de couper comme un monteur, c'est à dire accepter de jeter la majeure partie de ce qui a été généré.",
        ],
      },
      {
        heading: "Ce que ça donne au total",
        paragraphs: [
          "Chacune de ces six raisons est une décision, pas un modèle. Et c'est la bonne nouvelle : ça veut dire que la différence entre un animé IA moche et un animé IA qui ne l'est pas est à la portée de quiconque accepte d'écrire, de concevoir, de diriger, de monter et de mixer, et hors de portée de quiconque espère que le prochain modèle le fera à sa place.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Pourquoi l'animé IA est-il moche ?",
      answer:
        "Six raisons qui reviennent sur presque tous les projets, et aucune n'est le modèle : pas d'histoire donc rien ne se monte, des prompts génériques qui rendent le look moyen, des visages qui dérivent dans des plans longs, un mouvement interpolé qui flotte, de la musique sous chaque scène, et pas de vrai montage. Chacune est une décision, et chacune a un remède.",
    },
    {
      question: "Pourquoi l'animation IA a-t-elle l'air si lisse et flottante ?",
      answer:
        "Parce que les modèles vidéo interpolent tout, alors que l'animé tient des poses, claque de l'une à l'autre et saute des images exprès. Diriger contre aide, et choisir ce qu'on montre aussi : une action lente et silencieuse convient au mouvement généré, une chorégraphie rapide l'expose.",
    },
    {
      question: "Pourquoi tous les animés IA se ressemblent-ils ?",
      answer:
        "Les prompts généraux rendent la moyenne des données d'entraînement : centrée, symétrique, éclairée uniformément, texturée partout. Une bible avec des interdits, des références attachées et une décision de caméra dans chaque prompt sont ce qui fait qu'un projet se ressemble à lui-même.",
    },
    {
      question: "De meilleurs modèles vont-ils réparer l'animé IA ?",
      answer:
        "Ils réparent la dérive, les mains et le mouvement un peu plus chaque trimestre. Ils n'écrivent pas une scène, ne conçoivent pas une silhouette, ne placent pas un pas, ne coupent pas un plan qui n'a rien à faire là. C'est là que la plupart des animés IA échouent, et ce ne sont pas des problèmes de modèle.",
    },
  ],
  related: [
    { label: "Comment reconnaître un animé fait avec l'IA", href: "/how-to-tell-if-anime-is-ai" },
    { label: "Écrire un prompt style animé qui vous appartient", href: "/anime-style-prompts" },
    { label: "Monter un animé IA : là où l'épisode se fabrique", href: "/editing-ai-anime" },
    { label: "Comment les voix et le son ont été faits", href: "/ai-anime-voice-and-sound" },
    { label: "Comment faire un animé avec l'IA, étape par étape", href: "/how-to-make-ai-anime" },
  ],
};

const aiFilmFestivalsAnimation: Guide = {
  article: {
    byline:
      "L'épisode 1 a été sélectionné à Séoul et est arrivé en finale à Londres. Ce qu'une sélection en festival a fait pour un animé IA indépendant, quels festivals acceptent le format, et comment candidater sans jeter les frais par les fenêtres.",
    sections: [
      {
        paragraphs: [
          "Les festivals sont la seule référence qu'une animation IA indépendante peut gagner sans qu'elle vienne d'un compteur de vues. L'épisode 1 de Lost Garden a été sélectionné au Seoul International AI Film Festival et est arrivé en finale de l'AI London Festival, et ces deux lignes ont fait plus pour le projet que le nombre de vues : elles ont ouvert une fiche dans une base de données, une conversation avec la presse, et une raison pour un inconnu de prendre dix-sept minutes au sérieux.",
        ],
      },
      {
        heading: "Deux types de festivals, et ils ne veulent pas la même chose",
        paragraphs: [
          "Les festivals de films IA dédiés, dont il existe maintenant plusieurs, sont là pour montrer ce que les outils savent faire et pour en débattre. Ils acceptent le format par définition, ils sont jugés par des gens qui savent ce que coûte un bon plan généré, et c'est là qu'un animé IA est comparé à ses pairs plutôt qu'à un long métrage de studio.",
          "Les festivals d'animation généralistes, c'est une autre conversation. Certains excluent d'emblée les oeuvres assistées par IA, certains exigent une déclaration, la plupart n'ont pas tranché. Lisez le règlement avant de payer, et s'il ne mentionne pas l'IA, demandez. Soumettre une oeuvre non déclarée à un festival qui l'aurait refusée est la façon la plus sûre de transformer un choix technique en problème de réputation.",
        ],
        callouts: [
          "Un festival qui ne dit rien sur l'IA n'a pas dit oui. Demandez avant de payer les frais.",
        ],
      },
      {
        heading: "Ce que la sélection a réellement changé",
        paragraphs: [
          "TMDB, qui semblait fermé aux productions indépendantes selon son propre règlement, a référencé la série une fois qu'il y a eu des sélections en festival à montrer. Une presse qui n'aurait pas ouvert un e-mail sur un animé IA en a ouvert un sur un finaliste de festival. Et le projet a gagné une phrase qu'un inconnu peut vérifier en dix secondes, ce qui vaut plus que n'importe quelle description du pipeline.",
          "Ça n'a pas changé l'épisode. Les mêmes dix-sept minutes étaient là avant et après. Une sélection est une référence, pas une critique.",
        ],
      },
      {
        heading: "Ce qu'un jury regarde",
        paragraphs: [
          "Pas les outils. Chaque entrée d'un festival IA a utilisé des outils, et le jury a vu la signature de chaque modèle. Ce qui sépare les entrées, c'est s'il y a une histoire, si le monde appartient à un seul film, si les personnages tiennent, si le son a été fait ou balancé, et si ça a été monté. Autrement dit, exactement ce qui sépare un animé IA moche d'un animé IA qui ne l'est pas.",
          "Dix-sept minutes silencieuses et cohérentes avec un personnage qui ne peut pas parler sont allées plus loin qu'une bobine plus bruyante ne l'aurait fait. La cohérence est rare dans cette catégorie et les jurys la remarquent.",
        ],
      },
      {
        heading: "Comment candidater sans gaspiller d'argent",
        list: [
          "Finissez le film. Les festivals reçoivent des démos, et une démo perd contre un court fini d'une ambition trois fois moindre.",
          "Déclarez le pipeline dans les notes de soumission, simplement, avec ce qui est humain et ce qui est généré.",
          "Ayez une page presse prête avant de soumettre : synopsis, images, une photo du créateur, contact. Une sélection génère des demandes en quelques jours.",
          "Soumettez d'abord aux festivals IA dédiés. C'est là que le format est jugé équitablement et qu'une sélection est assez probable pour justifier les frais.",
          "Gardez le film hors des plateformes publiques si un festival exige une première, et lisez cette règle deux fois.",
        ],
      },
      {
        heading: "Ce que ça n'est pas",
        paragraphs: [
          "Une sélection n'est pas une distribution et ce n'est pas un public. L'épisode 1 a passé les soixante-cinq mille vues sur YouTube, et une projection en festival assoit quelques centaines de personnes. Les festivals vous donnent la phrase, la fiche et la conversation. Les spectateurs, il faut encore les gagner.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "Quels festivals acceptent l'animation IA ?",
      answer:
        "Les festivals de films IA dédiés l'acceptent par définition ; Lost Garden a été sélectionné au Seoul International AI Film Festival et est arrivé en finale de l'AI London Festival. Les festivals d'animation généralistes varient : certains excluent les oeuvres assistées par IA, certains exigent une déclaration, beaucoup n'ont pas tranché. Si le règlement ne mentionne pas l'IA, demandez avant de payer.",
    },
    {
      question: "Que fait une sélection en festival pour un animé IA ?",
      answer:
        "Elle donne au projet une référence vérifiable. Pour Lost Garden, elle a aidé à ouvrir une fiche TMDB, rendu possibles des échanges avec la presse, et donné à des inconnus une raison de prendre au sérieux un épisode de dix-sept minutes. Elle n'a pas amené de spectateurs par elle-même.",
    },
    {
      question: "Faut-il déclarer l'usage de l'IA en candidatant à un festival ?",
      answer:
        "Toujours. Les festivals IA dédiés s'y attendent, les festivals généralistes peuvent l'exiger, et soumettre une oeuvre non déclarée à un festival qui l'aurait refusée transforme un choix technique en problème de réputation.",
    },
    {
      question: "Que cherchent les jurys des festivals de films IA ?",
      answer:
        "Pas les outils, que chaque entrée a utilisés. Une histoire, un monde qui appartient à un seul film, des personnages qui tiennent d'un plan à l'autre, un son fabriqué plutôt que balancé, et un vrai montage. La cohérence est rare dans la catégorie et c'est ce qui se remarque.",
    },
  ],
  related: [
    { label: "Le making-of de l'épisode 1", href: "/making-of-episode-1" },
    { label: "Kit presse", href: "/press" },
    { label: "Un animé IA est-il un vrai animé ?", href: "/is-ai-anime-real-anime" },
    { label: "Droit d'auteur et animé IA : ce qui se protège", href: "/ai-anime-copyright" },
  ],
};

const lostGardenStoryAndCharacters: Guide = {
  article: {
    byline:
      "Un chevalier creux, une enfant qui fait pousser les fleurs, treize armures liées par un serment, et un monde sans ciel. De quoi parle Lost Garden, qui s'y trouve, et ce que l'épisode 1 met en mouvement, sans dévoiler la fin.",
    sections: [
      {
        paragraphs: [
          "Lost Garden est une série de dark fantasy qui se passe entièrement sous terre, dans un réseau d'immenses cavernes remplies de forêts bleues, de brume cyan, de champignons lumineux, de lys blancs, de racines géantes, de rivières dans le noir et de machines endormies sous la mousse. Il n'y a pas de ciel. Personne dans l'histoire n'en a jamais vu un.",
          "C'est une histoire de mémoire, de transmission, de sacrifice et de la possibilité d'aimer encore dans un monde presque entièrement perdu. Elle est silencieuse, lente, et pas destinée aux très jeunes enfants, même s'il n'y a rien d'explicite dedans.",
        ],
      },
      {
        heading: "Lanterne, le douzième chevalier",
        paragraphs: [
          "Lanterne est une vieille armure vide dont le heaume a la forme d'une lanterne. Il n'y a pas de corps à l'intérieur. Il ne peut pas parler, pas écrire, pas expliquer qui il est ni ce dont il se souvient. Ce qu'il ressent sort en sons métalliques creux, en grincements, en souffles vides et en petits gestes.",
          "Il se réveille seul sur un ancien autel, animé par une étrange énergie bleue, et il est le douzième de treize chevaliers, l'un des plus faibles. À son cou pend un pendentif qui montre le visage d'une enfant. Quand elle est proche, il brille en bleu. Lanterne n'est pas un héros au sens habituel. Il trébuche, hésite, tombe, et regarde le monde avec l'attention fragile de quelqu'un qui a oublié comment exister. Ce qui reste en lui, c'est de la chaleur, et c'est peut-être la seule chose qui lui permette de la protéger sans perdre ce qui le rendait humain.",
        ],
      },
      {
        heading: "Rose, l'enfant",
        paragraphs: [
          "Rose est petite, calme et presque irréelle. Elle traverse les lieux en ruine avec une étrange sérénité, comme si elle entendait ce que le monde a oublié. Autour d'elle, les fleurs éclosent, les racines bougent, et la terre morte se souvient parfois de respirer. Elle est ce que l'histoire appelle une Enfant Source, liée à la renaissance d'un monde blessé.",
          "La série fait attention à ce qu'elle n'est pas. Elle n'est pas une arme, pas un miracle à dépenser, pas un symbole. C'est une enfant, et elle doit être protégée pour cette seule raison.",
        ],
        callouts: [
          "L'un des personnages n'a pas de voix. L'autre n'en a pas besoin. L'essentiel de l'histoire se passe dans l'espace entre les deux.",
        ],
      },
      {
        heading: "Les treize chevaliers et le serment",
        paragraphs: [
          "Lanterne est l'une des treize armures creuses, numérotées de treize à un. Chacune est liée par un serment à une Enfant Source qui lui est propre, et chacune pourrait devenir la rivale des autres. Deux visages sont connus pour l'instant.",
          "Serrure, le neuvième chevalier, est le second. Contrairement à beaucoup de ceux que le serment lie, il n'a pas perdu sa chaleur. Il est doux, accueillant, et l'un des premiers signes pour Lanterne que tous les chevaliers ne sont pas des ennemis. Il explique le serment, les Enfants Source, et le chemin vers le Jardin Oublié. Sa bonté est réelle et son serment est dangereux, parce qu'il est lié à un enfant à lui, un garçon aux cheveux rouges et blancs nommé Aren, dont le réveil clôt le premier épisode.",
        ],
      },
      {
        heading: "Ce qui vit d'autre dans le noir",
        paragraphs: [
          "Les Machines Endormies sont des êtres colossaux, mi-mécaniques, mi-organiques, enterrés dans les forêts bleues depuis une ancienne catastrophe. Rouillées, fissurées, couvertes de champignons, elles ne haïssent pas et ne pardonnent pas. Certains de leurs yeux s'ouvrent encore dans le noir, et quand l'une se réveille, elle se réveille comme un désastre oublié.",
          "Les Pèlerins Masqués ne se voient que de loin : des silhouettes en capuches noires et masques blancs, qui traversent les plateformes de pierre en processions silencieuses, leurs gongs résonnant à travers l'abîme. Personne ne sait s'ils sont des gardiens, des pleureurs, ou quelque chose de plus ancien. Leur présence signifie que les profondeurs ne sont pas vides.",
        ],
      },
      {
        heading: "Ce que l'épisode 1 met en mouvement",
        paragraphs: [
          "Le premier épisode suit Lanterne depuis l'autel où il se réveille, à travers la forêt bleue, jusqu'au premier frémissement de quelque chose d'ancien dans le noir, et jusqu'à l'enfant dans les lys dont il portait le visage. Il se termine sur un autre réveil, celui d'Aren, qui est le serment de Serrure qui arrive à échéance.",
          "Il dure dix-sept minutes, en anglais avec des sous-titres en français, japonais et coréen, et il se regarde gratuitement sur YouTube et sur ce site. L'épisode 2 est en production.",
        ],
      },
      {
        heading: "D'où ça vient",
        paragraphs: [
          "La série est écrite, réalisée et produite par Frank Houbre, seul, en France, avec un pipeline assisté par IA sous direction humaine. Ses influences ne sont pas cachées : le sens de l'émerveillement, du danger et de l'innocence perdue de Made in Abyss, l'échelle et la révélation lente de L'Attaque des Titans. Elle n'essaie de copier ni l'un ni l'autre. Elle essaie de porter le même poids, avec une armure vide et une enfant.",
        ],
      },
    ],
  },
  faq: [
    {
      question: "De quoi parle Lost Garden ?",
      answer:
        "D'un chevalier creux nommé Lanterne, une armure vide avec une lanterne pour tête qui ne peut pas parler, qui se réveille sous terre sans mémoire et doit protéger Rose, une enfant dont la présence fait revenir la vie. C'est une dark fantasy sur la mémoire, le sacrifice et l'amour dans un monde souterrain sans ciel.",
    },
    {
      question: "Qui sont les personnages de Lost Garden ?",
      answer:
        "Lanterne, le douzième chevalier, une armure creuse sans voix. Rose, une Enfant Source qui fait pousser les fleurs. Serrure, le neuvième chevalier, bon et lié par son propre serment à un garçon nommé Aren. Les Machines Endormies, d'anciennes reliques mi-organiques sous la mousse. Et les Pèlerins Masqués, des processions silencieuses aux gongs, vues seulement de loin.",
    },
    {
      question: "Que sont les Treize Chevaliers ?",
      answer:
        "Treize armures creuses, numérotées de treize à un, chacune liée par un serment à une Enfant Source qui lui est propre. Lanterne est le douzième et l'un des plus faibles. Serrure est le neuvième. Les autres seront révélés dans les prochains épisodes.",
    },
    {
      question: "Comment se termine l'épisode 1 ?",
      answer:
        "Par un réveil. Aren, le garçon aux cheveux rouges et blancs lié à Serrure, se réveille, ce qui est le serment du neuvième chevalier qui arrive à échéance. Ce que ça signifie pour Lanterne et Rose est le sujet de l'épisode 2, en production.",
    },
  ],
  related: [
    { label: "Regarder l'épisode 1", href: "/episode-1" },
    { label: "Le making-of de l'épisode 1", href: "/making-of-episode-1" },
    { label: "Comment les voix et le son ont été faits", href: "/ai-anime-voice-and-sound" },
    { label: "Le texte du créateur sur la fabrication de la série", href: "/vision" },
  ],
};

export const guidesFr: Record<GuideSlug, Guide> = {
  "/how-to-make-ai-anime": howToMakeAiAnime,
  "/ai-character-consistency": characterConsistency,
  "/is-ai-anime-real-anime": isAiAnimeRealAnime,
  "/ai-anime-vs-traditional-animation": aiVsTraditional,
  "/ai-manga": aiManga,
  "/ai-anime-generator": aiAnimeGenerator,
  "/ai-anime-voice-and-sound": aiAnimeVoiceAndSound,
  "/how-to-tell-if-anime-is-ai": howToTellIfAnimeIsAi,
  "/making-of-episode-1": makingOfEpisodeOne,
  "/can-one-person-make-an-anime": canOnePersonMakeAnAnime,
  "/ai-anime-storyboard": aiAnimeStoryboard,
  "/ai-anime-backgrounds": aiAnimeBackgrounds,
  "/ai-anime-script": aiAnimeScript,
  "/ai-anime-copyright": aiAnimeCopyright,
  "/history-of-ai-anime": historyOfAiAnime,
  "/anime-style-prompts": animeStylePrompts,
  "/editing-ai-anime": editingAiAnime,
  "/why-ai-anime-looks-bad": whyAiAnimeLooksBad,
  "/ai-film-festivals-animation": aiFilmFestivalsAnimation,
  "/lost-garden-story-and-characters": lostGardenStoryAndCharacters,
};
