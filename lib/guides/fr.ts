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
};
