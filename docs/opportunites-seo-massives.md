# Opportunités SEO massives, et le bug qui les bloque toutes

Audit du 5 septembre 2026, fait en direct sur la production. Complète `seo-organique-anime-ia.md`, qui reste juste sur la stratégie de contenu. Ce document traite de ce qui a le plus de levier, dans l'ordre.

Note de méthode : Ahrefs a répondu `Insufficient plan` sur tous les endpoints, y compris celui des quotas qui est pourtant gratuit. Aucun volume de recherche n'a pu être vérifié ici. Tout ce qui suit vient de mesures directes sur le site et de vérifications SERP, pas d'estimations.

## 1. Le site entier se déclare sur un domaine qui redirige

C'est le point le plus important du document, et c'est une correction d'une ligne.

Mesuré :

```
https://lostgarden.world/en      -> 307 -> https://www.lostgarden.world/en
https://www.lostgarden.world/en  -> 200
```

Le serveur force le `www`. Le code, lui, déclare le non-www partout. Dans `lib/seo.ts` :

```ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lostgarden.world";
```

Conséquences vérifiées sur la page servie à `www.lostgarden.world/en` :

- `<link rel="canonical" href="https://lostgarden.world/en">`, donc une canonique inter-domaines qui pointe vers une URL en 307
- les cinq `hreflang` de la page pointent tous vers des URL qui redirigent
- `og:url` pareil
- `robots.txt` annonce `Host: https://lostgarden.world` et `Sitemap: https://lostgarden.world/sitemap.xml`
- le sitemap contient 52 URL, dont **0 en www**, et chaque entrée porte en plus cinq annotations `xhtml:link` vers des URL qui redirigent

Pourquoi c'est grave, et pas juste inélégant : Google demande que les cibles `hreflang` soient les URL canoniques. Une URL qui redirige n'est pas canonique, et une annotation vers une telle URL est couramment ignorée, et une annotation ignorée casse la réciprocité, donc **le cluster entier**. Or les quatre langues avec hreflang complet sont décrites dans la note de stratégie comme l'avantage structurel numéro un du site. En l'état il est probablement annulé. Le japonais et le coréen, l'angle mort du marché, ne peuvent pas fonctionner tant que ce n'est pas réglé.

Deuxième détail : la redirection non-www vers www est un **307**, temporaire. Une consolidation de domaine se fait en 301.

Deux façons de corriger, il faut en choisir une et s'y tenir :

- garder le www comme domaine servi, et mettre `SITE_URL` à `https://www.lostgarden.world`
- ou faire du non-www le domaine principal dans Vercel, rediriger www vers non-www en 301, et ne rien changer au code

La première est la plus sûre, elle aligne le code sur ce qui tourne déjà. La seconde est plus propre à long terme mais touche la configuration DNS et le domaine déjà indexé. C'est un arbitrage qui appartient à Frank, pas au code.

Une fois le choix fait, resoumettre le sitemap dans Search Console et vérifier que la propriété déclarée est bien celle qui sert le 200.

## 2. Le sitemap donne 52 fois la même date

Mesuré : 52 `<loc>`, **un seul `<lastmod>` distinct**, `2026-09-04T17:26:06.220Z`.

C'est `new Date()` dans `getSitemapEntries()`, figé au build. À chaque déploiement, les 52 URL déclarent avoir changé, y compris les mentions légales. Google apprend en quelques semaines à ignorer le champ, et le site perd le seul mécanisme dont il dispose pour signaler qu'un article a vraiment été mis à jour. Sur un domaine jeune qui va publier un article toutes les deux ou trois semaines, c'est exactement le signal qu'on veut conserver.

Correctif : une date par page, écrite en dur dans `SITEMAP_HINTS` ou dérivée d'un champ dans les fichiers de contenu de `lib/guides`, `lib/ai-anime-articles`, etc.

## 3. Aucune page HTML n'est mise en cache, et 37 polices sont préchargées

Mesuré sur `https://www.lostgarden.world/en` :

```
cache-control: private, no-cache, no-store, max-age=0, must-revalidate
x-vercel-cache: MISS
ttfb: entre 0,24 s et 0,93 s selon les requêtes, jamais servi depuis le cache
37 en-têtes Link rel=preload as=font
182 Ko de HTML
```

Deux causes distinctes.

**Le cookie.** `proxy.ts` pose `lostgarden-locale` sur *chaque* réponse, y compris celles servies aux robots. Une réponse qui pose un cookie devient `private` et ne peut pas être mise en cache au bord. Résultat : `MISS` permanent, rendu serveur à chaque requête, TTFB entre 0,6 et 0,9 s. Le contenu est pourtant strictement statique. Le correctif est de ne poser le cookie que quand la locale vient d'une négociation ou d'un changement explicite, c'est à dire sur les branches de redirection, et pas sur la branche `NextResponse.next()` où la locale est déjà dans l'URL.

**Les polices.** `app/layout.tsx` charge `Zen_Kaku_Gothic_New` en trois graisses comme police de corps globale. C'est une police japonaise, que Next découpe en un grand nombre de sous-ensembles unicode et précharge tous. D'où 37 `preload` pour 459 Ko de polices, sur toutes les pages et dans toutes les langues, y compris l'anglais qui n'en a pas besoin. Le CSS livré contient 726 déclarations `@font-face` pour cette seule famille. C'est le poste le plus lourd du LCP. Passer la police secondaire en `preload: false`, ou ne la charger réellement que sur `ja`, coûte peu et se voit immédiatement dans les Core Web Vitals.

Ces deux points comptent au delà du confort de lecture : la vitesse de réponse conditionne le rythme de crawl, et un domaine jeune a besoin d'être crawlé souvent pour que les nouveaux articles sortent vite.

## 4. Il y a une intention de recherche entièrement vide, et le site est le seul à pouvoir la servir

Vérifié en SERP sur l'intention « regarder un animé IA complet ». Ce qui remonte : des générateurs d'épisodes, des pages produit d'outils, des chaînes de recaps automatisés, des listicles. Presque rien qui soit une œuvre réelle qu'on puisse regarder.

C'est la meilleure nouvelle de cet audit. La note de stratégie disait que le groupe « fabriquer » est plus gros que le groupe « regarder ». C'est vrai en volume, et c'est aussi le groupe le plus disputé : chaque éditeur d'outil se bat pour ces requêtes avec un budget marketing. Le groupe « regarder » est petit mais **structurellement vacant**, et Lost Garden a ce que personne d'autre n'a : un épisode fini de 17 minutes, deux sélections en festival, 65 000 vues, et des fiches IMDb, TMDB et Wikidata.

Sur ce terrain le site ne se bat pas contre des SaaS, il se bat contre le vide. C'est là que le premier positionnement solide arrivera, et c'est aussi la page qui convertit directement vers l'épisode.

Mais le balisage ne permet pas encore d'y aller. Sur `/episode-1`, le `VideoObject` contient `name`, `description`, `thumbnailUrl`, `uploadDate`, `contentUrl`, `embedUrl`, `inLanguage`, `creator`, `partOfSeries`, `keywords`. Il manque :

- `duration`, recommandé par Google et affiché dans le résultat. Précision utile : ce n'est pas un champ requis. Les trois requis, `name`, `thumbnailUrl`, `uploadDate`, sont présents, la page est donc déjà éligible au résultat vidéo. `duration` améliore le résultat, il ne le débloque pas
- `hasPart` avec des `Clip`, les « moments clés », qui prennent une place verticale considérable dans les résultats et que personne ne fait sur ce sujet
- `interactionStatistic` avec le nombre de vues, qui est un signal de popularité lisible
- une vignette propre : `thumbnailUrl` pointe vers l'`og-image.png` partagée par tout le site, et sur l'hôte non-www

Limite honnête : pour une vidéo hébergée sur YouTube, la page YouTube elle-même est en concurrence directe sur la requête, et elle gagne souvent. La page `/episode-1` n'a de sens que si elle apporte ce que YouTube n'a pas : le contexte de la série, les chapitres, les quatre langues, les liens vers les fiches.

Et sur la page d'accueil, le noeud `TVSeries` ne référence pas l'épisode : ni `episode`, ni `containsSeason`, ni `trailer`. Le graphe se coupe exactement là où il devrait mener au contenu. Une page `/episode-1` typée `TVEpisode` et rattachée au `@id` de la série resserre tout l'ensemble.

## 5. L'entité existe déjà, il manque le dernier maillon

`sameAs` est déjà bien rempli : YouTube, Instagram, TikTok, IMDb `tt43459291`, TMDB `325287`, Wikidata `Q140266760`. Frank a son propre élément, `Q139094807`. C'est plus que ce qu'ont la plupart des productions indépendantes, et c'est ce qui fait que les moteurs de réponse citent déjà le projet correctement.

Ce qui manque pour un panneau de connaissance complet, par ordre de coût croissant :

- le noeud `Person` de Frank apparaît deux fois dans le JSON-LD, en `creator` de la série et en `founder` de l'organisation, sans `@id`. Les deux portent le même `sameAs` Wikidata, ce qui suffit à Google pour les réconcilier. Un `@id` commun est plus propre, ce n'est pas un défaut
- aucune page Wikipédia n'est liée à `Q140266760`. C'est le seul élément qui manque vraiment, et c'est celui qui déclenche le panneau. Les sélections en festival et la couverture presse sont le début d'un dossier de notoriété, ce n'est pas encore suffisant, mais c'est la cible à garder en tête
- les identifiants ANN dès que la fiche est validée

## 6. Les articles HackerNoon sont un actif déjà payé

Au moins trois articles signés Frank sur HackerNoon parlent nommément de Lost Garden et ressortent en recherche sur son nom. HackerNoon a une autorité de domaine que le site n'aura pas avant longtemps.

À auditer, je n'ai pas pu le faire ici, la page renvoie un 403 aux robots : est-ce que ces articles pointent vers `lostgarden.world` avec une ancre utile, ou seulement vers la page d'accueil, ou pas du tout. Trois liens contextuels vers `/process`, `/how-to-make-ai-anime` et `/episode-1` valent plus que les six prochains articles du blog, et c'est du travail d'édition sur des textes qui existent déjà.

Même logique pour la description YouTube, déjà notée dans l'autre document et toujours vraie.

## Fait le 5 septembre 2026, dans cette branche

Vérifié sur un build de production servi en local avant d'être poussé.

- `SITE_URL` aligné sur `https://www.lostgarden.world`, l'hôte que Vercel sert réellement. Canonical, hreflang, `og:url`, `robots.txt`, sitemap et JSON-LD sortent maintenant tous en www : 52 URL sur 52 dans le sitemap
- même correction dans `public/llms.txt`, dans `scripts/build-press-assets.mjs` et dans les fichiers texte du kit presse
- une date par page dans le sitemap, dérivée de l'historique git de chaque contenu. Trois dates distinctes au lieu d'une seule : le 3 juin pour l'épisode et les pages légales, le 8 juin pour le kit presse, le 4 septembre pour tout ce que la correction Lanterne et les nouveaux articles ont touché. À mettre à jour dans `SITEMAP_HINTS` quand une page change
- `preload: false` sur Zen Kaku Gothic New. Préchargements de polices par page : 37 avant, 2 après, les deux restants sont les graisses Oswald latines qui servent au titre
- le graphe JSON-LD ne porte plus qu'un seul noeud `Person` pour Frank, avec un `@id`, référencé par `Organization.founder`, `TVSeries.creator` et `VideoObject.creator`
- `TVSeries` référence maintenant l'épisode via un noeud `TVEpisode` localisé, avec numéro, durée, date, URL de la page de l'épisode et lien vers le `VideoObject`
- `duration: PT17M` sur le `VideoObject` et sur l'épisode, lu depuis `EPISODE_ONE.duration`

Ce qui reste à faire hors du code, par Frank :

- **vérifier dans Vercel que la variable `NEXT_PUBLIC_SITE_URL` n'est pas définie sur le non-www.** Si elle l'est, elle écrase la valeur du code et rien ne change en production
- passer la redirection non-www vers www de 307 à 301, dans la configuration du domaine Vercel, le code n'y a pas accès
- dans Search Console, ajouter la propriété `www.lostgarden.world` si elle n'existe pas, et y resoumettre `https://www.lostgarden.world/sitemap.xml`

## Six articles ajoutés le 5 septembre 2026

Six guides, chacun dans les quatre langues, chacun sur une intention de recherche que le site ne servait pas. Le tableau sert de carte anti-cannibalisation : avant d'écrire une page, vérifier qu'elle ne tombe dans aucune de ces lignes ni dans celles des cinq articles précédents.

| Page | Intention visée | Requêtes type | Se distingue de |
|---|---|---|---|
| `/ai-manga` | Manga créé par IA, la moitié immobile du problème | manga IA, AI manga, AI漫画, AI 웹툰 | tout le reste, qui parle d'animation |
| `/ai-anime-generator` | Les produits « générateur », ce qu'ils sortent | générateur d'animé IA, AI anime generator, AIアニメ 生成 | `/how-to-make-ai-anime`, qui décrit le pipeline, pas la catégorie de produits |
| `/ai-anime-voice-and-sound` | Voix, son et musique par IA dans un animé | voix IA animé, AI anime voice, AI 声優 アニメ | rien d'autre ne parle du son |
| `/how-to-tell-if-anime-is-ai` | Reconnaître un animé fait avec l'IA | reconnaître un animé IA, how to tell if anime is AI, AIアニメ 見分け方 | `/is-ai-anime-real-anime`, qui traite la définition, pas la détection |
| `/making-of-episode-1` | Le récit d'une production, avec les faits vérifiables | Lost Garden making-of, AI anime behind the scenes | `/how-to-make-ai-anime`, qui est un guide générique |
| `/can-one-person-make-an-anime` | Les métiers, ce que l'IA couvre, ce qui reste | faire un animé seul, can one person make an anime, 一人 アニメ 制作 | `/ai-anime-vs-traditional-animation`, qui compare les pipelines |

Ce qui a été respecté pour chaque texte :

- aucun chiffre qui n'existe pas déjà dans le dépôt. Dix-sept minutes, environ un an, 65 000 vues, le 29 mai 2026, les deux festivals, les outils nommés dans `/process` et `/vision`. Rien sur le nombre de plans, rien sur le coût, parce que ces chiffres ne sont documentés nulle part
- le japonais et le coréen ne sont pas des traductions mot à mot : `/ai-manga` vise AI漫画 au Japon et AI 웹툰 en Corée, et les mots-clés de chaque langue sont ceux que les gens tapent dans cette langue
- chaque page renvoie vers deux ou trois autres du cluster, et les deux guides les plus lus (`/how-to-make-ai-anime`, `/ai-character-consistency`) renvoient vers les nouveaux
- `llms.txt` liste maintenant les onze articles, et deux faits périmés y ont été corrigés au passage, le nom Sol et la date du 2 juin

## Dix articles de plus, le 5 septembre 2026

Même méthode, même carte. Le site compte maintenant 21 articles en quatre langues, 116 URL dans le sitemap.

| Page | Intention visée | Se distingue de |
|---|---|---|
| `/ai-anime-storyboard` | storyboard IA, AI storyboard | le guide pipeline, dont c'est une seule étape |
| `/ai-anime-backgrounds` | décor animé IA, anime background generator | la cohérence des personnages, qui est un autre problème |
| `/ai-anime-script` | scénario animé IA, AI anime script | rien d'autre ne parle d'écriture |
| `/ai-anime-copyright` | droit d'auteur animé IA | la page définition, qui parle des bases de données |
| `/history-of-ai-anime` | premier animé IA, first AI anime | le classement, qui note et ne date pas |
| `/anime-style-prompts` | prompt style animé, anime style prompt | la page générateurs, qui décrit des produits |
| `/editing-ai-anime` | montage animé IA, editing AI anime | rien d'autre ne parle du montage |
| `/why-ai-anime-looks-bad` | pourquoi l'animé IA est moche | la page détection, qui s'adresse au spectateur et pas au créateur |
| `/ai-film-festivals-animation` | festival film IA | le making-of, qui raconte et ne conseille pas |
| `/lost-garden-story-and-characters` | Lost Garden personnages, Lanterne | la page d'accueil, qui présente et n'explique pas |

Points de vigilance pour ces dix :

- la page droit d'auteur cite la position du Copyright Office américain et rien d'autre, avec la mention que ce n'est pas un conseil juridique. Ne pas y ajouter de juridiction sans source
- la page histoire ne contient que des dates déjà présentes sur `/best-ai-anime`, plus la date de sortie de l'épisode. Pas de nouvelle affirmation
- la page festivals ne nomme que les deux festivals du dépôt. Le reste est du conseil général
- la page personnages est entièrement tirée des textes de l'accueil : Lanterne douzième chevalier, Serrure neuvième, Aren dont le réveil clôt l'épisode, les Machines Endormies, les Pèlerins Masqués

Aussi corrigé dans cette passe : les six problèmes de lint. Le cookie banner et la notice d'inscription lisent leur état via `useSyncExternalStore` au lieu d'un `setState` dans un effet, l'écriture du cookie de langue est partagée dans `setLocaleCookie`, et deux imports inutilisés ont disparu. `npm run lint` sort à zéro.

## Médias sur les articles, le 5 septembre 2026

Le classement des six animés IA n'avait pas une image. Corrigé, avec trois mécanismes.

- **Une image d'en-tête par article**, prise dans les scènes de l'épisode et le kit presse (`lib/article-media.ts`), avec un texte alternatif traduit dans les quatre langues (`media.alt` dans les dictionnaires). La même image sert d'`image` au balisage `Article` et est déclarée dans le sitemap : 84 entrées `image:image`
- **Une vignette Open Graph générée par page et par langue**, route `/og?locale=&path=`, avec la scène de l'article, le titre dans la police de la langue (Noto Sans, JP ou KR chargée depuis Google Fonts) et le nom de la série. Cache d'une semaine au bord. Si le rendu échoue, la route renvoie la scène brute, jamais une image cassée. Le proxy de langue laisse passer `/og`
- **Les vidéos officielles sur le classement**, en lecteur léger (vignette, puis iframe au clic) : Lost Garden, le PV de Twins Hinahima sur la chaîne officielle, Le Chien et le Garçon sur la chaîne Netflix Japan, Anime Rock, Paper, Scissors sur celle de Corridor Digital. Chaque identifiant a été vérifié par l'endpoint oEmbed de YouTube contre le nom de la chaîne. Anipops et la série Vidu / Aura n'ont pas d'upload officiel intégrable, elles gardent un lien
- Le lecteur de l'épisode 1 est intégré sur les cinq articles où il a sa place : making-of, voix et son, montage, une seule personne, histoire et personnages
- L'index des articles affiche une vignette par entrée

Deux choses apprises en route :

- tous les fichiers `.png` du site sauf le logo sont en réalité des JPEG. Ça n'empêche rien, les navigateurs devinent le format, mais c'est ce qui faisait échouer la génération de vignette tant que l'image était passée avec un type déclaré. À renommer un jour, avec les références
- Twins Hinahima est un spécial TV unique de 24 minutes, pas une série. Les pages qui parlaient de « série » ont été corrigées

## Pas fait, et pourquoi

**Le rendu statique des pages.** Le build sort toutes les routes en dynamique parce que `app/layout.tsx` appelle `headers()` pour poser `lang` sur `<html>`. Tant que c'est le cas, les pages restent en `private, no-store` et le cookie du proxy ne change rien au cache, le retirer seul ne servirait à rien. La solution propre selon la doc Next embarquée est de descendre le layout racine dans `app/[locale]/`, ce qui impose le drapeau expérimental `globalNotFound` pour la page 404. L'alternative est de figer `lang="en"` dans le HTML brut et de le corriger côté client, ce qui dégrade l'accessibilité des pages japonaise et coréenne. Aucune des deux ne se fait à l'aveugle dans une passe de corrections sûres. C'est le prochain chantier technique, et il vaut la peine : c'est ce qui ramènerait le TTFB sous 100 ms et rendrait le cookie du proxy inoffensif.

## Dans quel ordre

1. Choisir le domaine canonique et aligner `SITE_URL`, puis resoumettre le sitemap. Rien d'autre ne compte tant que ce n'est pas fait
2. Vraies dates dans le sitemap
3. Cookie conditionnel dans le proxy, et polices non préchargées
4. `duration`, `hasPart`, `interactionStatistic` sur le `VideoObject`, et rattacher l'épisode à la série
5. `@id` sur le noeud Person
6. Audit des liens HackerNoon et de la description YouTube

Les quatre premiers points sont du code, ils sont petits, et ils se font en une passe. Ce sont eux qui décident si les six articles prévus dans la note de contenu servent à quelque chose ou pas.
