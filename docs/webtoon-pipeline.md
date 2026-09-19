# Lost Garden · pipeline webtoon

Le moteur transforme une source (épisode monté, scénario ScreenWeaver, ou les deux) en une bande verticale 1080 px lisible sur téléphone. Première application : les 30 premières secondes de l'épisode 1, lisibles sur `/webtoon/ep1-opening`, éditables sur `/webtoon/ep1-opening/editor`, exportées sur `/api/webtoon/ep1-opening` et dans `public/webtoon/ep1-opening/webtoon.json`.

## Étapes et fichiers

| Étape | Rôle | Fichier |
|---|---|---|
| Source | Vidéo proxy, scénario, fiches, sous-titres | dépôt `lost-garden` (`12_Episodes`, `02_Scenario`, `09_Fiches_modeles`, `07_Soustitres`) |
| Analyse narrative | Plans horodatés, dialogues, sons, continuité | `lib/webtoon/sources/ep1-opening.analysis.ts` |
| Segmentation | Beats | `lib/webtoon/sources/ep1-opening.plan.ts` (`EP1_OPENING_BEATS`) |
| Moteur d'adaptation | Intentions de case → cases complètes (temps, format, hauteur, espacement, références, prompt) | `lib/webtoon/adaptation.ts`, intentions dans `ep1-opening.plan.ts` |
| Références | Bibliothèque personnages, lieux, objets, images du film, et résolution automatique | `lib/webtoon/references.ts` |
| Bible de style | Fragments de prompt et interdits communs | `lib/webtoon/style-bible.ts` |
| Prompts | Un prompt structuré par case | `lib/webtoon/prompts.ts` |
| Génération | Requête neutre par case (modèle, ratio, prompt, références) | `lib/webtoon/generation.ts`, images enregistrées par `scripts/webtoon-images.py` |
| Layout | Empilement vertical, fonds, gaps | `lib/webtoon/layout.ts` |
| Rendu | Lecteur mobile first, lettrage HTML | `components/webtoon/WebtoonReader.tsx`, `PanelLettering.tsx` |
| Éditeur | Modifier, déplacer, fusionner, scinder, régénérer, exporter | `components/webtoon/WebtoonEditor.tsx`, opérations pures dans `lib/webtoon/editor-ops.ts` |
| Export | JSON source de vérité | `scripts/webtoon-export.mjs`, route `app/api/webtoon/[slug]/route.ts` |

## Le contrat : `webtoon.json`

Un script contient `source` (l'analyse), `beats`, `panels`, `references` et `layout`. Chaque case porte les champs du brief : `panel_id`, `source_time_start`, `source_time_end`, `narrative_role`, `description`, `characters`, `location`, `action`, `emotion`, `shot_type`, `camera_angle`, `composition`, `panel_height`, `transition_type`, `spacing_before`, `spacing_after`, `dialogue`, `caption`, `sfx`, `visual_references`, `generation_prompt`, `negative_constraints`, plus `fidelity` (`direct`, `reframe`, `bridge`), `background`, `focal_point`, `aspect_ratio` et `image`.

Le frontend ne décide rien : il empile ce que le moteur a décidé. La distance avant une case prend le fond de cette case, ce qui fait basculer la page du blanc au noir au début du gap, là où le lecteur tombe.

## Grammaires du moteur

- Valeur de plan → ratio par défaut (`ASPECT_BY_SHOT`) : très large 9:16, large et moyen 4:5, détail 3:2, très gros plan 16:9.
- Transition → espace avant (`SPACING_BY_TRANSITION`) : continu 40, cut 90, beat 170, respiration 280, chute 1100, fondu au noir 900.
- Une intention peut surcharger ratio, hauteur, espacements, références et notes de prompt.

## Ajouter une séquence

1. Écrire l'analyse (`*.analysis.ts`) : plans avec temps, description, personnages, lieu, dialogues, sons, images de référence. Depuis une vidéo : `ffmpeg` avec détection de coupes puis frames à 2 i/s. Depuis un scénario seul : mêmes champs, temps à `null`, images vides.
2. Écrire le plan (`*.plan.ts`) : beats, palettes par lieu, une intention par case avec sa raison d'être.
3. Enregistrer le script dans `lib/webtoon/scripts.ts`.
4. `node scripts/webtoon-export.mjs <slug> --prompts` : vérifie le JSON et imprime les prompts.
5. Générer les cases avec les références listées, dans l'ordre, puis `python3 scripts/webtoon-images.py <slug> jobs.json`.
6. Relancer l'export. La page et l'API lisent le même code.

## Génération : Vercel AI Gateway et les fiches personnages

- Fournisseur de référence : **Vercel AI Gateway**, modèle `openai/gpt-image-2.5-sunburst` (`lib/webtoon/providers/vercel-gateway.ts`). Clé `AI_GATEWAY_API_KEY` côté serveur, jamais côté client.
- En lot : `AI_GATEWAY_API_KEY=… node scripts/webtoon-generate.mjs ep1-opening [p03 p07]` génère, écrit `public/webtoon/<slug>/panels/*.png` et met à jour `<slug>.images.ts`. `--dry-run` imprime les requêtes.
- À la demande : `POST /api/webtoon/<slug>/generate` avec `{ panel_id }` renvoie l'image en data URL ; le bouton « Régénérer » de l'éditeur l'appelle et remplace l'image dans le navigateur.
- Références **toujours** jointes, dans cet ordre : les fiches du personnage (planche modèle d'abord, puis still du film), la fiche du lieu, l'image du plan source. La résolution se fait par `subject` dans `lib/webtoon/references.ts` : chaque personnage présent dans une case attache toutes ses fiches.
- Fiches disponibles dans `lost-garden/09_Fiches_modeles` : Lanterne, Serrure, Bourdon, Barrik, le Roi Voûte, le Décrocheur, le Chevalier Sombre, le Colosse, le Reptilien. **Rose n'a pas de planche modèle** : ses références sont deux stills du film (visage, corps entier). Une planche générée depuis ces stills renforcerait la cohérence.
- Tailles : GPT Image produit 1024x1024, 1024x1536 ou 1536x1024 ; `sizeForAspect` choisit l'orientation et la mise en page recadre au point focal. Un plan peut demander `2:3` ou `3:2` pour éviter tout recadrage.

## Ce que la première passe a établi

- Les 30 s de l'épisode 1 font onze plans (coupes à 4.4, 6.3, 11.2, 12.9, 13.9, 16.9, 20.6, 22.6, 25.5, 27.6 s) et une seule réplique, « Find me. » à 17.9 s.
- Dix cases, 16 028 px de haut, cinq beats. Le noir du film (20.6 à 22.6 s) n'est pas une case : c'est un gap de 1 400 px et le changement de fond.
- Aucune case n'invente d'action : chaque case est marquée `direct` et pointe le plan dont elle vient.
- Trois passes : Nano Banana (`panels-v1-nano-banana/`), GPT Image 2.5 Sunburst en rendu détaillé (`panels-v2-sunburst-rendered/`), puis GPT Image 2.5 Sunburst en rendu webtoon à aplats (bible v3, `panels/`, celle qui est en ligne). Fiches personnages jointes en premier sur chaque case à chaque passe.
