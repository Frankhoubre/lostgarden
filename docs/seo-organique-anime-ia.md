# Faire venir sur lostgarden.world les gens qui cherchent un animé fait par IA

Note de travail, septembre 2026. Objectif unique : capter la recherche organique sur "animé créé par IA" et ses variantes, dans les quatre langues du site, et transformer ce trafic en vues de l'épisode 1.

## Ce qui est déjà en place

Inutile de le refaire, c'est fait et c'est bien fait :

- hreflang complet sur les 4 locales, canonical propre, x-default vers l'anglais
- JSON-LD sur toutes les pages : Organization, WebSite, TVSeries, Article, FAQPage, VideoObject
- `robots.ts` autorise explicitement GPTBot, ClaudeBot, PerplexityBot, Google-Extended et les autres. C'est un avantage réel et peu de sites d'animation le font
- une page `/process` qui répond déjà à "comment c'est fait"
- depuis aujourd'hui, `/best-ai-anime` dans les 4 langues, avec ItemList, FAQPage et Article

## Le problème réel

Le site compte huit pages. Une personne qui cherche un animé fait par IA ne cherche pas "Lost Garden", elle ne connaît pas le nom. Elle tape une question. Aujourd'hui le site n'a presque rien à lui répondre, donc Google n'a aucune raison de le sortir.

Il y a deux marchés distincts et il faut les traiter séparément :

1. Ceux qui veulent **regarder** un animé IA. Intention de consommation, volume moyen, conversion directe vers l'épisode 1.
2. Ceux qui veulent **en fabriquer un**. Intention outil, volume beaucoup plus élevé, conversion vers Imaginode et vers la crédibilité du projet.

Le deuxième groupe est plus gros, et c'est lui qui fait les liens et les partages. Le site doit servir les deux, mais les articles qui rapportent des backlinks viennent du groupe 2.

## Les requêtes à viser

Anglais, priorité haute :
- ai anime, best ai anime, anime made with ai, ai generated anime
- can ai make anime, is ai anime real, first ai anime
- how to make an ai anime, make anime with ai
- ai anime episode, full ai anime episode

Français :
- animé créé par IA, anime fait par IA, animé intelligence artificielle
- comment faire un animé avec l'IA
- premier animé IA

Japonais, le marché le plus dense et le moins servi en contenu occidental :
- AIアニメ, 生成AI アニメ, AIで作られたアニメ, AIアニメ 作り方

Coréen :
- AI 애니메이션, AI로 만든 애니, 인공지능 애니메이션 만드는 법

Le japonais et le coréen sont l'angle mort de tout le monde. Le site a déjà les traductions et le hreflang. C'est là que le rapport effort sur résultat est le meilleur.

## Le plan de contenu

`/best-ai-anime` sert de hub. Autour, six pages à écrire, dans cet ordre.

**1. Comment faire un animé avec l'IA, de A à Z.** La page la plus recherchée du lot. Le vrai pipeline de Lost Garden, étape par étape, avec les échecs. Scénario dans ScreenWeaver, storyboard, génération dans Imaginode, montage. Cible le groupe 2, ramène des liens, et c'est la page qui vend Imaginode sans avoir l'air de vendre.

**2. Garder un personnage cohérent d'un plan à l'autre.** Le problème numéro un de tous ceux qui essaient. Sol et Rose comme cas d'école, avec des images avant et après. Requête à faible volume mais à intention très forte, et personne ne la traite sérieusement.

**3. Le making-of de l'épisode 1.** Combien de plans, combien de temps, combien de prises jetées. Les chiffres concrets sont ce qui se cite et ce qui se reprend dans les articles de presse.

**4. Les modèles vidéo testés pour l'animation.** Comparatif honnête, y compris ce qui n'a pas marché. Attire le groupe 2 et vieillit bien si la page est datée et mise à jour.

**5. L'IA remplace-t-elle les animateurs.** Sujet à polémique, donc sujet à liens. Position claire et argumentée, pas de langue de bois. Risqué, à écrire seulement si Frank assume la position publiquement.

**6. Un index `/blog` ou `/articles`.** Dès qu'il y a plus de trois articles, il faut une page de collection avec `CollectionPage` en JSON-LD, sinon les articles restent orphelins et le maillage ne circule pas.

Rythme réaliste : un article toutes les deux ou trois semaines. Quatre articles solides valent mieux que quinze pages minces, surtout sur un domaine jeune.

## Corrections techniques à faire

**Le sitemap ment.** Dans `lib/seo.ts`, `getSitemapEntries()` met `new Date()` en `lastModified` pour toutes les entrées, à chaque requête. Google apprend vite à ignorer un site qui déclare que tout a changé toutes les cinq minutes. Il faut une vraie date par page, écrite en dur ou dérivée d'un champ dans le contenu.

**Les pages sont dynamiques.** Le build sort toutes les routes en `ƒ` (server-rendered on demand) alors que le contenu est statique. Le proxy pose un cookie sur chaque réponse, ce qui empêche la mise en cache. Sur les pages éditoriales, ça coûte du temps de réponse pour rien, et le temps de réponse compte au crawl. À creuser : ne poser le cookie que sur la navigation utilisateur, pas sur les requêtes de bots.

**Pas d'image dédiée par article.** Toutes les pages partagent `/images/og-image.png`. Une image propre par article améliore le taux de clic sur les partages et donne quelque chose à indexer dans Google Images, qui est une source de trafic réelle sur les requêtes anime.

**Ajouter un `llms.txt`.** Google l'ignore, mais Perplexity et quelques autres le lisent. Coût : dix minutes.

## Ce qui compte autant que le site

Le référencement seul ne suffira pas sur un domaine neuf. Trois leviers hors-site, par ordre d'efficacité :

**Les fiches de référence.** Anime News Network Encyclopedia, MyAnimeList, IMDb, AniList. Ce sont les sources que Google et les modèles de langue traitent comme faisant autorité sur l'animation. Une fiche Lost Garden dans chacune vaut plus que dix articles de blog, et elle est gratuite. C'est la première chose à faire.

**YouTube.** L'épisode 1 est déjà la meilleure porte d'entrée. La description doit pointer vers `/best-ai-anime` et vers `/process`, pas seulement vers la page d'accueil, et le titre de la vidéo doit contenir les mots que les gens tapent. YouTube est aussi un moteur de recherche, et son inventaire sur "AI anime full episode" est faible.

**Reddit et les communautés.** r/aivideo, r/StableDiffusion, r/anime dans une moindre mesure. Pas de spam de lien : publier le making-of, répondre aux questions techniques. Ces fils sont massivement cités par les modèles de langue quand on leur demande des exemples d'animés IA.

## Comment mesurer

Brancher Search Console sur les quatre versions de langue et suivre trois choses seulement :

- les impressions sur les requêtes contenant "ai anime" et ses équivalents, par langue
- la position moyenne de `/best-ai-anime` sur la requête principale de chaque langue
- les clics vers `/episode-1` depuis les pages éditoriales

Le reste est du bruit les six premiers mois. Un domaine neuf sur un sujet neuf met entre trois et neuf mois à bouger, et la seule erreur vraiment coûteuse serait d'arrêter d'écrire au bout de deux articles parce que rien ne se passe.
