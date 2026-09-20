# Studio webtoon · vision produit et plan

Note écrite le 20 septembre 2026 à partir du brief de Frank, pour que le cap ne se perde pas. Le studio privé de Lost Garden (`/convert-video-to-webtoon`) est le prototype : ce document dit comment il devient un produit où n'importe qui crée son webtoon.

## Le parcours voulu

1. **Un compte, un projet par webtoon.** L'utilisateur se connecte et crée un projet. Trois points de départ : convertir une vidéo en webtoon, convertir une histoire (scénario PDF, FDX, texte) en webtoon, ou partir de zéro.
2. **Choisir le style, une fois pour toutes.** Le projet est invité à choisir son style parmi des styles que notre moteur d'image sait tenir (chacun est une bible de style plus des cases d'ancrage approuvées). Le style est fixé pour le projet : c'est ce qui garde toutes les cases dans le même monde.
3. **Écrire l'histoire et peupler le monde.** Rédiger facilement (chapitres, scènes), créer ses personnages avec des prompts prédéfinis qui produisent une planche modèle sur fond blanc (tour complet, expressions), attacher une description (verrou de design) à chaque personnage, lieu et objet.
4. **Générer.** Découper les scènes en cases, générer les images dans le style, lettrer, traduire, publier, lire.

## Ce qui existe déjà et se transporte tel quel

Tout `lib/webtoon` de ce dépôt est indépendant de Lost Garden sauf les données de la première minute :

| Brique | Fichier | État |
|---|---|---|
| Schéma de case et de script (JSON exportable, champs du brief) | `types.ts` | fait |
| Bible de style en fragments de prompt, palettes, interdits | `style-bible.ts` | fait, un seul style |
| Composition d'un prompt depuis les champs d'une case, ordre des références | `prompts.ts`, `compose.ts` | fait |
| Bibliothèque de références (personnages, lieux, ancres, images du film) avec surcouche utilisateur | `references.ts`, `library.ts` | fait |
| Fiche générée par l'IA (tour complet fond blanc, expressions ; illustration de lieu) | `app/api/webtoon/[slug]/asset` | fait |
| Écrivain de la suite : images du film + scénario → intentions de cases, événements décomposés, lieu lu sur l'image | `app/api/webtoon/[slug]/continue`, `continue.ts` | fait |
| Génération d'une case avec références, image stockée côté serveur | `app/api/webtoon/[slug]/generate`, `providers/vercel-gateway.ts`, `storage-server.ts` | fait |
| Traduction du lettrage en langage parlé, onomatopées par langue | `app/api/webtoon/[slug]/translate`, `translate.ts` | fait |
| Éditeur (bulles, sons, cartouches, cadre, rythme, structure), lecteur mobile, layout | `components/studio`, `components/webtoon`, `layout.ts`, `editor-ops.ts` | fait |
| Brouillon et publication, enregistrement automatique, progression, éditeur persistant | `studio.ts`, `StudioApp.tsx` | fait |

Ce qui est spécifique à Lost Garden : l'analyse et le plan de la première minute (`sources/`), la liste blanche d'adresses, le script unique `ep1-opening`.

## Où le produit doit vivre

**Un produit à part entière, indépendant**, sans lien avec ScreenWeaver ni avec lostgarden.world (décision de Frank, 20 septembre 2026). Concrètement : une application Next.js dédiée dans son propre dépôt, son propre projet Firebase (Auth Google et e-mail, Firestore, Storage, plan Blaze), son propre projet Vercel avec la clé du Gateway, son nom et son domaine. Le moteur de ce dépôt (`lib/webtoon`, les routes de génération, l'éditeur, le lecteur) s'y copie tel quel ; les crédits et l'abonnement reprennent le modèle d'Imaginode (Stripe, abonnement plus recharges, coût affiché avant chaque génération), qui est déjà à Frank.

Lost Garden garde son studio privé comme premier client et comme banc d'essai, et son lecteur public reste la vitrine.

## Les chantiers, dans l'ordre

### 1. Projets et données (fondation)

- Une collection `projects/{projectId}` : propriétaire, titre, style choisi, langues, source (`video`, `screenplay`, `scratch`), état. Sous-collections : `panels` (ou une chaîne JSON comme aujourd'hui tant que la bande reste sous 1 Mo), `published`, `library`, `sources`.
- Règles Firestore et Storage par propriétaire du projet (plus de liste blanche).
- Les routes `generate`, `continue`, `translate`, `asset` reçoivent `projectId`, vérifient l'appartenance, débitent les crédits avant d'appeler le Gateway (coût réel d'une case en 2k : environ 0,20 $ ; d'une fiche : 0,20 $ ; d'un appel écrivain : 0,05 à 0,30 $ selon le nombre d'images du film envoyées). Comptes, abonnement et crédits : Firebase Auth et Stripe, sur le modèle d'Imaginode.
- Le registre de scripts en code (`scripts.ts`) disparaît : un projet est ses données.

### 2. Les trois points de départ

- **Vidéo.** Envoi du fichier, extraction d'une image toutes les 5 secondes **dans le navigateur** (balise vidéo et canvas, pas de ffmpeg serveur), envoi des images dans Storage, sous-titres si fournis. L'écrivain actuel fonctionne déjà sur ces images.
- **Scénario.** Import PDF, FDX (XML de Final Draft, simple à lire), Fountain ou texte collé, avec un analyseur à écrire dans le produit. L'écrivain reçoit le scénario seul : il faut lui apprendre à découper sans images (le brief actuel est conçu pour ça, l'analyse peut porter `time: null` et `frames: []`).
- **De zéro.** Un projet vide avec l'éditeur d'histoire ; l'écrivain travaille scène par scène.

### 3. Le style, fixé par projet

- Une liste de styles = autant de `StyleBible` : webtoon à plats (la bible v4 actuelle), manhwa rendu, ligne claire, encre noir et blanc, aquarelle, pixel art… Chaque style est validé sur notre moteur (GPT Image 2.5 Sunburst, Gemini 3.1 Image, Grok Imagine) avant d'être proposé.
- À la création : l'utilisateur voit une case d'exemple par style, en choisit un, puis le studio **génère ses deux ancres de style** (une case claire, une case sombre) avec un de ses personnages ; il approuve ou regénère. Ces ancres sont jointes à chaque case ensuite, comme `style-white.jpg` et `style-blue.jpg` aujourd'hui.
- Changer de style après coup = regénérer la bande ; l'interface le dit.

### 4. Histoire, personnages, lieux, objets

- Éditeur d'histoire simple (chapitres, scènes, texte), avec un assistant qui propose le découpage en temps forts.
- Bibliothèque de références comme aujourd'hui, étendue aux **objets** (`kind: "object"`, déjà prévu dans le schéma), avec les prompts prédéfinis de fiche : tour complet fond blanc plus expressions pour un personnage, illustration large pour un lieu, vue sur fond blanc pour un objet. Verrou de design obligatoire avant génération, réécrit en anglais par le modèle si l'utilisateur l'écrit dans sa langue.

### 5. Génération, lettrage, publication

- « Générer les N cases suivantes » tel qu'aujourd'hui, avec la progression, l'arrêt et l'enregistrement automatique ; par scène quand il n'y a pas de vidéo.
- Lettrage : bulles, sons, cartouches déplaçables, traduction dans les langues choisies par le projet.
- Publication : un lecteur public par projet (`/webtoon/<slug>`), pages d'épisode, partage.

## Décisions à prendre

1. **Nom et domaine** du produit, et le nom du dépôt.
2. **Tarif** : abonnement et crédits par case, par fiche, par appel écrivain.
3. **Langues** du produit au départ (le studio actuel gère fr, en, ja, ko).
4. **Styles** à valider en premier : commencer par deux ou trois, testés sur de vraies planches.

## Ce qui ne bouge pas

Les règles apprises sur Lost Garden restent la base de l'écrivain : suivre la source sans inventer d'action, décomposer chaque événement physique en cases intermédiaires, lire le lieu sur l'image, joindre fiches personnages puis ancre de style puis lieu puis image source, trois à cinq tons par élément, un tiers du détail des références.
