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

## Environment variables

See `.env.local.example` for required `NEXT_PUBLIC_FIREBASE_*` values.

## Deploy

Push to `main` and connect the repo on [Vercel](https://vercel.com). Add the same environment variables in the Vercel project settings.

Deploy Firestore rules from `firestore.rules` in the Firebase console.

## Project

An original anime project by Frank Houbre.
