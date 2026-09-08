# Sous-titres de l'épisode 1

Déposer ici les fichiers exportés depuis YouTube Studio, un par langue :

- `en.srt` ou `en.vtt`
- `fr.srt` ou `fr.vtt`
- `ja.srt` ou `ja.vtt`
- `ko.srt` ou `ko.vtt`

Puis lancer `node scripts/import-subtitles.mjs` et commiter les fichiers générés dans `lib/transcripts/`.
La page `/episode-1-transcript` n'est publiée, et listée dans le sitemap, que lorsque les quatre langues sont présentes.
