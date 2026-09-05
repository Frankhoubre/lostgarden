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

## Dans quel ordre

1. Choisir le domaine canonique et aligner `SITE_URL`, puis resoumettre le sitemap. Rien d'autre ne compte tant que ce n'est pas fait
2. Vraies dates dans le sitemap
3. Cookie conditionnel dans le proxy, et polices non préchargées
4. `duration`, `hasPart`, `interactionStatistic` sur le `VideoObject`, et rattacher l'épisode à la série
5. `@id` sur le noeud Person
6. Audit des liens HackerNoon et de la description YouTube

Les quatre premiers points sont du code, ils sont petits, et ils se font en une passe. Ce sont eux qui décident si les six articles prévus dans la note de contenu servent à quelque chose ou pas.
