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
- `lib/game/audio.ts` and `lib/game/songs.ts`: WebAudio step sequencer and the chiptune renditions of the original soundtrack (Ash Lantern Prayer, The Knight's Lullaby, Clockwork Requiem, The Giant and the Knight), transcribed from the recordings
- `scripts/build-game-assets.py` and `scripts/game-assets-manifest.json`: slice the generated sources into the strips in `public/game/` (`--fetch` downloads the sources, `--generated` builds); `scripts/build-tiles.py` cuts the 32px autotile sheet from the painted ground
- `components/game/GameGate.tsx`: the pixel-art login screen, then the game once signed in
- `components/game/GameShell.tsx`: canvas host, keyboard and touch controls
- `lib/game/engine.ts`, `actors.ts`, `levels.ts`, `sprites.ts`, `text.ts`: the earlier three-stage engine, still reachable with `?engine=full`

## Environment variables

See `.env.local.example` for required `NEXT_PUBLIC_FIREBASE_*` values.

## Deploy

Push to `main` and connect the repo on [Vercel](https://vercel.com). Add the same environment variables in the Vercel project settings.

Deploy Firestore rules from `firestore.rules` in the Firebase console.

## Project

An original anime project by Frank Houbre.
