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

## Community Day RSVP — `/FlamingoCommunityRSVP`

Public RSVP page for Flamingo Jiu-Jitsu Community Day (Sun, Oct 11), ported from
the Claude design canvas. Files: `src/app/FlamingoCommunityRSVP/`,
`src/app/api/rsvp/route.ts`, `src/lib/rsvp.ts`.

On submit the page POSTs to `/api/rsvp`, which:

1. **Saves the RSVP** by submitting it server-side to the Google Form (name,
   phone, guests, sessions). Link the form to a Google Sheet (Form → Responses →
   Link to Sheets) to get a live spreadsheet of attendees. If saving fails, the
   attendee sees an error and can retry.
2. **Sends a WhatsApp confirmation** to the number they entered through the
   WhatsApp Cloud API (Meta). This is skipped silently until it's configured;
   the RSVP is still saved.

### Environment variables

| Variable | Required | Default / notes |
| --- | --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | for WhatsApp | Permanent system-user token from Meta Business |
| `WHATSAPP_PHONE_NUMBER_ID` | for WhatsApp | The sending number's ID (WhatsApp Manager → API setup) |
| `WHATSAPP_TEMPLATE_NAME` | | `rsvp_confirmation` |
| `WHATSAPP_TEMPLATE_LANG` | | `en` |
| `WHATSAPP_API_VERSION` | | `v21.0` |
| `RSVP_DEFAULT_COUNTRY_CODE` | | `91`, added to 10-digit numbers typed without a country code |
| `RSVP_GOOGLE_FORM_URL` | | The form's `…/formResponse` URL (defaults to the one from the design) |
| `RSVP_ENTRY_NAME` / `_PHONE` / `_GUESTS` / `_SESSIONS` | | The form's `entry.<id>` field names |

### WhatsApp template

WhatsApp only lets a business message someone who hasn't written to it first
through a pre-approved **template**. Create one in WhatsApp Manager → Message
templates, category **Utility**, name `rsvp_confirmation`, language English,
with two body variables:

```
Hi {{1}}, you're RSVP'd for Flamingo Jiu-Jitsu Community Day on Sun, Oct 11 at HSR Layout ({{2}}). Doors open at 9:45am. Directions: https://maps.app.goo.gl/Tkn43vwU8J89QMBD6. See you on the mat!
```

`{{1}}` is the attendee's first name and `{{2}}` is a summary such as
`You + 2 guests · Free Workshop, Meet & greet`.

## Kids progress reports — `/kids-reports`

Coach workspace for the "My Jiu-Jitsu Journey" report card (the Jan–Aug
template). Files: `src/app/kids-reports/`, `src/components/kids/`,
`src/lib/kidsReport.ts`, `src/lib/kidsExport.ts`.

- **Observations**: dated notes per kid after each class. One click appends a
  note to the journey, next-level or coach's-note text.
- **Evaluation**: import the *Kids Evaluation* tab (File → Download → CSV, or
  copy and paste the cells). Kids are matched by name and new names are added.
  Items whose names match a trait (e.g. "Focus") suggest a 🌱/🌿/🌳 level;
  numbers are scaled against the highest score in that column. Tick "Kids are
  in columns" if the sheet lists kids across the top.
- **Report card**: name/group/batch, photo, four superpowers (presets or
  custom), trait levels, the three text sections, and the badge. The live
  preview is the exact 1131×1600 card.
- **Sharing with parents**: *Download PNG* (best for WhatsApp), *Print / PDF*
  (A4), or *Copy parent link* / *WhatsApp*. The link opens
  `/kids-reports/view`. The whole report (with a smaller photo) is compressed
  into the link's `#fragment`, so nothing is uploaded and the server never
  sees it. Parents can save or print from that page.

Traits and the report period apply to every kid (**Traits** and **Report
period** in the top bar). Data is stored in this browser's localStorage. Use
**Backup** to download a JSON file and **Restore** to load it on another
device.
