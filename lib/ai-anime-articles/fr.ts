import type { AiAnimeArticle } from "@/lib/ai-anime-article";

export const aiAnimeArticleFr: AiAnimeArticle = {
  lead: "Six animés réellement produits avec de l'IA, classés : Lost Garden (2026, indépendant, épisode complet de 17 minutes), Twins Hinahima (2025, premier animé diffusé à la télévision japonaise avec de l'IA sur environ 95 % de ses plans), les séries originales Anipops (2026, premier service de streaming payant d'animés IA au Japon), The Dog & the Boy (2023, Netflix et WIT Studio), Anime Rock, Paper, Scissors (2023, Corridor Digital) et la série de science-fiction Vidu et Aura Productions (2025, 50 épisodes).",
  updatedLabel: "Mis à jour en septembre 2026",
  byline:
    "Une liste de travail pour qui cherche un animé réalisé par intelligence artificielle : ce qui existe vraiment, qui l'a fait, et ce que l'IA a réellement produit.",
  disclosure:
    "Transparence : cet article est publié sur le site officiel de Lost Garden, et Lost Garden occupe la première place. Les raisons sont détaillées plus bas, libre à vous de les contester. Les cinq autres entrées sont des productions réelles, avec leurs sources publiques en fin d'article.",
  intro: [
    "Cherchez animé IA et vous tombez surtout sur des outils. Des générateurs, des comparatifs de modèles, des packs de prompts. Ce qui est beaucoup plus difficile à trouver, c'est le travail lui-même : des épisodes finis, regardables, avec des personnages qui restent les mêmes d'un plan à l'autre.",
    "Il n'en existe pas des centaines. Il en existe une poignée, et elle vient d'endroits très différents. Une chaîne japonaise. Un studio de Los Angeles. Une équipe VFX de YouTube. Une seule personne en France avec un ordinateur portable. Cette liste, c'est ces projets, classés selon la solidité du résultat plutôt que selon le bruit de l'annonce.",
  ],
  method: {
    heading: "Comment ce classement est construit",
    paragraphs: [
      "La première place va au projet qui ressemble le plus à un animé et le moins à une démo. Donc une histoire assez longue pour tenir, un univers cohérent, et des personnages que l'œil reconnaît après une coupe.",
    ],
    list: [
      "Durée : un épisode complet compte plus qu'un test d'une minute.",
      "Cohérence : les visages, les costumes et les décors survivent-ils d'un plan à l'autre.",
      "Autorité : y a-t-il un humain qui décide de l'histoire, ou le pipeline est-il le sujet.",
      "Accessibilité : peut-on le regarder aujourd'hui, gratuitement ou sur un service qui existe.",
      "Honnêteté : la production dit-elle ce que l'IA a fait, au lieu de le cacher.",
    ],
  },
  rankingHeading: "Le top 6 des animés créés par IA",
  entries: [
    {
      rank: 1,
      title: "Lost Garden",
      meta: "2026 · indépendant · créé par Frank Houbre · épisode 1, 17 minutes",
      verdict: "L'épisode le plus abouti de cette liste, et le fait d'un seul auteur.",
      paragraphs: [
        "Sol se réveille sur un autel sous la terre, sans mémoire, une lanterne à la place du visage. Rose est une enfant qu'il décide de protéger sans savoir pourquoi. Autour d'eux, un monde enseveli de forêts bleues, de brume cyan et de treize chevaliers creux liés par un vieux serment.",
        "L'épisode 1 dure environ dix-sept minutes et il tient debout, ce qui est justement la partie difficile. Les personnages restent reconnaissables d'une scène à l'autre, le monde souterrain obéit à sa propre bible, et l'histoire continue dans un deuxième épisode au lieu de s'arrêter à une ambiance.",
        "Le tout est fait par une seule personne. Frank Houbre écrit le scénario, dirige les plans et monte l'épisode. L'IA génère les images et l'animation à l'intérieur de cette direction, et un plan généré qui casse l'univers finit à la poubelle comme n'importe quelle mauvaise prise. C'est la différence entre un animé assisté par IA et un enchaînement de prompts.",
      ],
      aiRoleLabel: "Ce que fait l'IA",
      aiRole:
        "La génération d'images, les plans animés et une partie de la recherche sonore. Le scénario, l'intention de storyboard, le choix des prises et le montage final restent humains.",
      links: [
        { label: "Regarder l'épisode 1", href: "/episode-1" },
        { label: "Notes de production complètes", href: "/process" },
        { label: "Produit avec Imaginode", href: "https://imaginode.ai" },
      ],
    },
    {
      rank: 2,
      title: "Twins Hinahima",
      meta: "2025 · Japon · Frontier Works et KaKa Creation · diffusion télé",
      verdict:
        "Le premier animé diffusé à la télévision japonaise avec de l'IA générative sur environ 95 % de ses plans.",
      paragraphs: [
        "Himari et Hinana sont jumelles, ne se ressemblent pas, n'ont pas le même caractère, et veulent toutes les deux devenir célèbres en dansant sur TikTok. La série est passée sur Tokyo MX le 28 mars 2025, sur MBS le lendemain, puis en streaming à partir du 30 mars.",
        "Le chiffre que tout le monde cite : environ 95 % des plans d'animation passent par de l'IA générative. Dans les faits c'est un hybride. L'IA produit les décors et les illustrations de personnages, des animateurs humains finissent les images, et le studio utilise aussi Unreal Engine 5, Clip Studio Paint et les outils Adobe habituels.",
        "À regarder pour ce que ça prouve côté diffusion. Une chaîne japonaise a mis ça à l'antenne en créditant l'IA ouvertement, ce que personne n'avait fait avant.",
      ],
      aiRoleLabel: "Ce que fait l'IA",
      aiRole:
        "Elle génère les décors et les illustrations de personnages, que les animateurs finissent ensuite. L'écriture, le doublage et la réalisation restent classiques.",
    },
    {
      rank: 3,
      title: "Les séries originales Anipops",
      meta: "2026 · Japon · PIXTA · streaming au format court",
      verdict: "Le premier service de streaming payant japonais bâti sur des originaux produits par IA.",
      paragraphs: [
        "PIXTA a relancé Anipops le 12 août 2026 sous forme de plateforme de streaming court, avec cinq séries originales issues de son propre studio IA. Au catalogue : la fantasy de combat de monstres Morks, le film de sabre Bells of the Oni, et une tranche de vie sur un salarié en burn-out qui part à la campagne et devient viral en filmant des chats errants.",
        "Anipops avait démarré en mars 2026 comme un espace où des créateurs indépendants publiaient leurs propres animés IA. Cette partie est passée sur Anipops Creators. Le service principal, lui, diffuse la production du studio, de l'écriture à l'animation, en interne.",
        "C'est le premier vrai test : est-ce qu'un public paiera un abonnement pour de l'animé IA au lieu de le regarder gratuitement dans un feed. Réponse dans un an.",
      ],
      aiRoleLabel: "Ce que fait l'IA",
      aiRole:
        "Elle traverse tout le pipeline interne, de la conception et de l'écriture jusqu'à l'animation, sur des épisodes courts pensés pour le téléphone.",
    },
    {
      rank: 4,
      title: "The Dog & the Boy",
      meta: "2023 · Japon · Netflix Anime Creators Base, WIT Studio, rinna · 3 minutes",
      verdict: "Le court-métrage qui a déclenché la polémique.",
      paragraphs: [
        "Un garçon et son chien robot, réalisé par Ryotaro Makihara, sorti sur YouTube le 31 janvier 2023. Les décors ont d'abord été dessinés en concept art, passés plusieurs fois dans un modèle d'IA, puis retouchés à la main.",
        "Au générique, le décorateur est crédité « AI + Human ». C'est cette ligne, plus que le film, que les gens ont retenue. La colère des animateurs professionnels a été immédiate, et elle portait sur l'emploi bien plus que sur les pixels, d'autant que Netflix présentait l'expérience comme une réponse à la pénurie de décorateurs.",
        "Trois minutes, qui valent le détour comme repère historique plutôt que comme récit.",
      ],
      aiRoleLabel: "Ce que fait l'IA",
      aiRole:
        "Uniquement les décors, générés à partir de concepts dessinés à la main puis corrigés par des artistes. Les personnages et l'animation sont traditionnels.",
    },
    {
      rank: 5,
      title: "Anime Rock, Paper, Scissors",
      meta: "2023 · États-Unis · Corridor Digital · 7 minutes",
      verdict: "Celui que presque tout le monde a vu avant même de savoir que la vidéo IA existait.",
      paragraphs: [
        "Deux amis jouent une partie de pierre-feuille-ciseaux d'un mélodrame ridicule, et c'est drôle. Corridor a filmé de vrais acteurs, puis repeint chaque image avec Stable Diffusion et un modèle DreamBooth entraîné sur Vampire Hunter D: Bloodlust, avec des décors construits dans Unreal Engine. Deux millions de vues en huit jours.",
        "Entraîner ce modèle sur un film précis sans autorisation, c'est exactement la pratique qui a mis les animateurs professionnels en état de guerre, et la vidéo reste la référence de ce débat trois ans plus tard.",
        "Techniquement, on est plus proche de la rotoscopie que de la génération, et c'est une des raisons pour lesquelles le mouvement tient encore mieux que beaucoup de ce qui a suivi.",
      ],
      aiRoleLabel: "Ce que fait l'IA",
      aiRole:
        "Elle repeint des images filmées dans un style animé, plan par plan. Le jeu des acteurs, le rythme et la caméra sont tournés, pas générés.",
    },
    {
      rank: 6,
      title: "La série de science-fiction Vidu et Aura Productions",
      meta: "2025 · États-Unis et Chine · Aura Productions avec Vidu · 50 épisodes",
      verdict: "Le pari du volume : cinquante épisodes d'une à deux minutes.",
      paragraphs: [
        "Annoncée au FilMart de Hong Kong en mars 2025, c'est une collection de cinquante courts épisodes de science-fiction générés entièrement avec Vidu, le modèle vidéo de ShengShu Technology, pour une diffusion sur les réseaux sociaux. Aura Productions est le studio de Los Angeles fondé par les producteurs Luo Yan et D.T. Carpenter.",
        "Le choix intéressant ici, c'est le format. Plutôt qu'un long film, ils misent sur un goutte-à-goutte d'épisodes adaptés au vertical, en s'appuyant sur la cohérence multi-personnages de Vidu pour garder des visages reconnaissables d'un plan à l'autre.",
        "Si l'animé IA au format court devient une habitude de visionnage plutôt qu'une curiosité, c'est à peu près là que ça commence.",
      ],
      aiRoleLabel: "Ce que fait l'IA",
      aiRole:
        "Elle génère les images de bout en bout. Le travail humain se concentre sur l'écriture, la conception des plans et le montage.",
    },
  ],
  sections: [
    {
      heading: "Où l'IA se place réellement dans un pipeline d'animation",
      paragraphs: [
        "L'expression animé IA recouvre au moins quatre choses différentes, et c'est parce qu'on les confond que les discussions en ligne tournent en rond.",
      ],
      list: [
        "Décors assistés : un humain dessine, un modèle itère, un artiste retouche. The Dog & the Boy.",
        "Plans assistés : les modèles produisent l'essentiel des dessins, les animateurs les finissent. Twins Hinahima.",
        "Transfert de style sur des images filmées : de vrais acteurs, des images repeintes. Anime Rock, Paper, Scissors.",
        "Génération directe : les plans sortent d'un modèle vidéo et sont montés ensemble. Lost Garden, Anipops, Vidu et Aura.",
      ],
      trailingParagraphs: [
        "Aucune des quatre ne supprime le besoin d'une personne qui décide de ce que raconte la scène. Cette décision reste tout le métier, et reste la raison pour laquelle la plupart des images générées qu'on trouve en ligne sont inregardables.",
      ],
    },
    {
      heading: "Est-ce qu'un animé est fait à 100 % par l'IA ?",
      paragraphs: [
        "Non, et méfiez-vous de ceux qui vous vendent l'inverse. Même les projets qui génèrent chaque image ont quelqu'un qui choisit l'histoire, écrit les dialogues, désigne laquelle des quarante prises est utilisable et fixe le rythme du montage.",
        "Ce qui a vraiment changé, c'est le plancher. Produire dix-sept minutes d'animation demandait un studio et un budget. Une seule personne peut le faire en un an, et c'est bien pour ça que l'entrée la plus intéressante de cette liste est aussi la plus petite équipe.",
      ],
    },
  ],
  productionHeading: "Comment Lost Garden est produit",
  productionParagraphs: [
    "Le scénario vient en premier et il est écrit à la main, dans ScreenWeaver, qui génère ensuite le storyboard scène par scène à partir de ce texte.",
    "La génération d'images et de vidéos tourne sur Imaginode, la plateforme de création IA construite par Frank Houbre. Elle réunit un large catalogue de modèles image et vidéo derrière un seul canvas à nodes, ce qui permet de tester un plan sur plusieurs modèles sans changer d'outil, et de garder les références de personnages à côté des plans qui les utilisent. C'est plus déterminant que le choix d'un modèle : tenir l'armure de Sol et le visage de Rose stables sur tout un épisode est un problème de pipeline, pas un problème de prompt.",
    "Le montage, le rythme, les choix sonores et toutes les décisions sur ce qui reste dans l'épisode sont humains. Les plans générés qui contredisent la bible de l'univers sont coupés, et il y en a beaucoup.",
  ],
  productionLinks: [
    { label: "Imaginode, la plateforme derrière les plans", href: "https://imaginode.ai" },
    { label: "Lire les notes de production complètes", href: "/process" },
  ],
  faqHeading: "Les questions qu'on nous pose vraiment",
  faq: [
    {
      question: "Quel est le meilleur animé créé par IA à regarder maintenant ?",
      answer:
        "Pour une histoire complète, l'épisode 1 de Lost Garden, un épisode de dark fantasy indépendant de dix-sept minutes signé Frank Houbre. Pour une production diffusée, Twins Hinahima, passé à la télévision japonaise en mars 2025 avec de l'IA générative sur environ 95 % de ses plans.",
    },
    {
      question: "Existe-t-il un animé fait à 100 % par une IA ?",
      answer:
        "Non. Certaines productions génèrent chaque image avec de l'IA, mais un humain écrit toujours l'histoire, choisit les prises utilisables et monte l'épisode. Les projets annoncés comme entièrement automatiques sont en général des compilations de clips sans récit continu.",
    },
    {
      question: "Quel animé a utilisé l'IA en premier ?",
      answer:
        "The Dog & the Boy, sorti sur YouTube le 31 janvier 2023 par Netflix Anime Creators Base avec WIT Studio et rinna, est la première production d'animation largement vue à créditer des décors générés par IA.",
    },
    {
      question: "Un animé IA a-t-il déjà été diffusé à la télévision ?",
      answer:
        "Oui. Twins Hinahima, produit par Frontier Works et KaKa Creation, est passé sur Tokyo MX le 28 mars 2025 et sur MBS le lendemain.",
    },
    {
      question: "Une seule personne peut-elle faire un animé avec l'IA ?",
      answer:
        "Oui, et Lost Garden le prouve. L'épisode 1 a été écrit, réalisé, produit et monté par une seule personne, avec ScreenWeaver pour le scénario et le storyboard et Imaginode pour la génération d'images et de vidéos.",
    },
    {
      question: "Où regarder Lost Garden ?",
      answer:
        "L'épisode 1 est gratuit sur YouTube et sur la page épisode 1 de ce site. L'épisode 2 est en production.",
    },
  ],
  sourcesHeading: "Sources",
  sourcesNote:
    "Les informations sur les cinq autres productions viennent de ces publications. Les éléments sur Lost Garden viennent de la production elle-même.",
  sources: [
    {
      label: "Anime News Network, Frontier Works et KaKa Creation dévoilent Twins Hinahima",
      href: "https://www.animenewsnetwork.com/news/2024-12-14/frontier-works-kaka-creation-reveal-twins-hinahima-ai-anime/.219056",
    },
    {
      label: "Anime Corner, PIXTA relance Anipops avec un nouveau studio et cinq séries originales",
      href: "https://animecorner.me/pixtas-japanese-short-form-ai-anime-platform-anipops-launches-with-new-studio-and-5-original-series/",
    },
    {
      label: "Anime News Network, WIT Studio produit The Dog & the Boy avec des décors générés par IA",
      href: "https://www.animenewsnetwork.com/interest/2023-02-02/wit-studio-produces-the-dog-and-the-boy-anime-short-with-ai-generated-backgrounds/.194426",
    },
    {
      label: "Anime News Network, Non, vous ne pouvez pas faire un animé avec l'IA",
      href: "https://www.animenewsnetwork.com/feature/2023-03-15/no-you-cant-make-anime-with-ai/.195921",
    },
    {
      label: "Variety, Aura Productions s'associe à Vidu pour une série d'animation IA",
      href: "https://variety.com/2025/digital/news/luo-yan-aura-productions-vidu-ai-anime-series-1236338232/",
    },
  ],
  relatedHeading: "À lire ensuite",
  relatedLinks: [
    { label: "Comment Lost Garden est fabriqué, en détail", href: "/process" },
    { label: "Regarder l'épisode 1", href: "/episode-1" },
    { label: "La vision de l'auteur derrière la série", href: "/vision" },
    { label: "Presse et kit média", href: "/press" },
  ],
};
