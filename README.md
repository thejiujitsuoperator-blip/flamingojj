# Flamingo BJJ

Training-platform prototype for a Brazilian jiu-jitsu gym — session scheduling,
attendance approval, a technique library, per-member proficiency tracking and a
coach sign-off queue.

Converted from a single-file HTML/vanilla-JS prototype
(`reference/flamingo_organic.html`) into a Next.js + React app. All data is
in-memory demo data; there is no backend.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + React 19
- TypeScript
- Plain CSS ("organic" design-token system in `src/app/globals.css`)
- `next/font` for the Caprasimo + Figtree typefaces

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use **switch →** in the sidebar to toggle between the
Coach and Member views.

## Scripts

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the dev server               |
| `npm run build` | Production build                   |
| `npm start`     | Serve the production build         |
| `npm run lint`  | ESLint                             |

## Structure

```
src/
  app/
    globals.css        Design tokens + component styles
    layout.tsx         Root layout, fonts, metadata
    page.tsx           Mounts <StoreProvider> + <Shell>
  lib/
    data.ts            Domain types, constants, helpers, seed data
    store.tsx          React Context holding all app state + actions
  components/
    Shell.tsx          Sidebar + active page + modals + toast
    Sidebar.tsx        Nav, role badge, live badges
    SessionCard.tsx    Shared session card (Sessions + Book)
    Toast.tsx
    icons.tsx          Inline SVG icon set
    pages/             One component per view
    modals/            Session / booking / technique dialogs
```

## Behaviour notes

State lives in a single client-side context (`src/lib/store.tsx`); navigation,
modals and the toast are part of that context so they survive view changes.
Seed sessions are dated June 2025, so "upcoming" lists are empty unless you
create a new session with a future date.
