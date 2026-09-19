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

`/[locale]/game` hosts **The Lantern's Oath**, a Ghouls'n Ghosts style platformer set in the Lost Garden universe. It is written from scratch in TypeScript on a 320x192 canvas (no game framework, no image or audio assets):

- `lib/game/pixel.ts` and `lib/game/sprites.ts`: ASCII pixel art rasterised at runtime (Lanterne, Serrure, Bourdon, Barrik, Rose, enemies, bosses, tiles)
- `lib/game/engine.ts`: game loop, tile physics, player state (two-hit armour, committed jumps, four throwable weapons), HUD, screens
- `lib/game/actors.ts`: enemy and boss behaviours (the Machine, the Decrocheur, the Dark Knight)
- `lib/game/levels.ts`: three stages built from 16-column segments
- `lib/game/audio.ts`: chiptune music and sound effects synthesised with WebAudio
- `lib/game/text.ts`: in-game text in the four site locales
- `components/game/GameShell.tsx`: canvas host, keyboard and touch controls

## Webtoon

`/[locale]/webtoon` hosts the vertical webtoon adaptation of the series, produced by an adaptation engine rather than drawn by hand. The first strip covers the opening of episode 1 (0:00 to 0:30).

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
