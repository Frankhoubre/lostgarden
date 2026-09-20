# Lost Garden

Official one-page landing site for the anime project **Lost Garden**, a poetic dark fantasy set in an underground world.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Firebase Authentication (email + Google) & Firestore (user profiles)
- Framer Motion

## Local development

```bash
npm install
cp .env.local.example .env.local
# Fill in Firebase keys from the Firebase console
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Retro game

`/[locale]/game` hosts **The Lantern's Oath**, a Ghouls'n Ghosts style platformer set in the Lost Garden universe, behind the site's login. The current stage follows episode 1 on a 480x288 canvas with generated pixel art:

- `lib/game/game.ts`: the engine. Tile collision, a vertical camera, dodge roll, crouch (the light hides), charged glimmer, coyote time and jump buffering, the lighting stack, the creatures of the Below, the Machine, the pause menu (music, effects, FR / EN, controls)
- `lib/game/world.ts`: the map of episode 1 as terrain profiles on a 332 by 44 tile grid: eight zones, cliffs, ledges, a pit, tunnels, and every spawn
- `lib/game/strings.ts`: in-game text in French and English
- `lib/game/mockup.ts`: the earlier flat stage, still reachable with `?engine=mockup`
- `lib/game/audio.ts`: plays the original recordings in `public/game/music/` per zone with cross-fades, synthesises the sound effects with WebAudio, and falls back to the chiptune renditions in `lib/game/songs.ts` when a recording cannot play
- `scripts/playtest.mjs` (`npm run playtest`, against a running dev server): the automated playtest. Map lint (every spawn on a floor and reachable from the start, ledges within a jump), sprite frames cut at a cell edge, missing assets, jump height, roll, crouch, pause menu and language, a tour of every zone with black or flat frame detection, eight seconds of random inputs per zone hunting for a knight stuck in rock, checkpoints, the chase and the boss. Screenshots and `report.json` land in `playtest-report/`
- `scripts/build-game-assets.py` and `scripts/game-assets-manifest.json`: slice the generated sources into the strips in `public/game/` (`--fetch` downloads the sources, `--generated` builds); `scripts/build-tiles.py` cuts the 32px autotile sheet from the painted ground
- `components/game/GameGate.tsx`: the pixel-art login screen, then the game once signed in
- `components/game/GameShell.tsx`: canvas host, keyboard and touch controls
- `lib/game/engine.ts`, `actors.ts`, `levels.ts`, `sprites.ts`, `text.ts`: the earlier three-stage engine, still reachable with `?engine=full`

## Webtoon

`/[locale]/webtoon` hosts the vertical webtoon adaptation of the series, produced by an adaptation engine rather than drawn by hand. The first strip covers the start of episode 1 (0:00 to 1:04): the white memory, the sanctuary and the awakening. `/[locale]/convert-video-to-webtoon` is the private studio where the strip is edited and published (Google sign-in, allowlisted account, see `docs/webtoon-pipeline.md`).

- `lib/webtoon/`: the engine. `types.ts` (panel schema shared with ScreenWeaver), `adaptation.ts` (panel intents → fully specified panels: timing, aspect, height, spacing, references, prompt), `references.ts` (character, location and source-frame library with automatic resolution), `style-bible.ts`, `prompts.ts`, `layout.ts`, `editor-ops.ts`, `generation.ts`
- `lib/webtoon/sources/`: per-sequence data. `*.analysis.ts` is the narrative analysis of the source (shots, dialogue, sounds, continuity), `*.plan.ts` the beats and panel intents, `*.images.ts` the generated panels
- `components/webtoon/`: mobile-first reader (1080 px canvas, HTML lettering), storyboard notes, editor (resize, respace, move, merge, split, edit dialogue and prompts, export or import JSON)
- `app/api/webtoon/[slug]`: the storyboard JSON with its layout, also written to `public/webtoon/<slug>/webtoon.json` by `node scripts/webtoon-export.mjs`
- `scripts/webtoon-images.py`: registers generated images for a script

The full pipeline, and how to add a sequence or start from a screenplay only, is described in `docs/webtoon-pipeline.md`.

## Environment variables

See `.env.local.example` for required `NEXT_PUBLIC_FIREBASE_*` values.

## Deploy

Push to `main` and connect the repo on [Vercel](https://vercel.com). Add the same environment variables in the Vercel project settings.

Deploy Firestore rules from `firestore.rules` in the Firebase console.

## Project

An original anime project by Frank Houbre.
