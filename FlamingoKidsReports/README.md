# Flamingo Kids Reports

Kids progress reports for Flamingo Jiu-Jitsu. Coaches capture observations,
import the Kids Evaluation sheet and fill in the "My Jiu-Jitsu Journey"
report card. The finished card can be shared with parents as a PNG, an A4
PDF or a link.

This is a standalone Next.js app, separate from the Community Day RSVP site in
the repo root. It has its own `package.json`, and is meant to be deployed as
its own Vercel project with **Root Directory = `FlamingoKidsReports`**.

## Pages

| Path | Who | What |
| --- | --- | --- |
| `/` | Coaches | Workspace: kid list, observations, evaluation, report editor + live preview |
| `/r/<id>` | Parents | Short link to a shared report, with Save image / Share / Print buttons |
| `/view#r=…` | Parents | Same view for the long self-contained link (used when short links aren't set up) |

## Getting started

```bash
cd FlamingoKidsReports
npm install
npm run dev
```

## How it works

- **Observations**: dated notes per kid after each class. One click appends a
  note to the journey, next-level or coach's-note text.
- **Evaluation import**: the *Kids Evaluation* tab, from File → Download →
  CSV or from copied and pasted cells. Kids are matched by name and new names
  are added. Items named like a trait (e.g. "Focus") suggest a 🌱/🌿/🌳 level;
  numbers are scaled against the highest score in that column. Tick "Kids are
  in columns" if the sheet lists kids across the top.
- **Report card**: a fixed 1131×1600 canvas (the template's size), scaled to
  fit the screen. It covers name/group/batch, photo, four superpowers, trait
  levels, journey, next level, badge and coach's note.
- **Group / batch**: cohorts Cub, Junior, Youth; Weekday or Weekend batch.
  The card prints them in lowercase, like the template.
- **Sharing**: *Download PNG* (best for WhatsApp), *Print / PDF* (A4), or
  *Copy parent link* / *WhatsApp*. Parent links are short,
  e.g. `…/r/Qx2XBfKk`. Each kid keeps one link: sharing again after edits
  updates what that link shows.
- **Storage**: this browser's localStorage. Use **Backup** / **Restore**
  (a JSON file) to move data between devices.

## Short links (Vercel Blob)

Shared reports are saved as `reports/<id>.json` in a Vercel Blob store. To
set it up once, open the Vercel project, go to **Storage → Create → Blob**,
choose **Private** access and connect it to the project. That adds
`BLOB_READ_WRITE_TOKEN`. Then redeploy.

| Variable | Notes |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Added automatically when the Blob store is connected |
| `BLOB_ACCESS` | `private` (default) or `public`, matching how the store was created |
| `SHARE_DIR` | Optional: store shared reports in this folder instead (local dev / self-hosting) |

Until a store is connected, *Copy parent link* still works but falls back to
the long self-contained link.

## Files

```
src/app/page.tsx, CoachWorkspace.tsx   Coach workspace
src/app/view/                          Parent view (long #fragment links)
src/app/r/[id]/                        Parent view for short links
src/app/api/share/route.ts             Saves a report, returns its short id
src/lib/shareStore.ts                  Blob (or SHARE_DIR) storage
src/app/kr.module.css                  Workspace + viewer styles
src/components/kids/                   Report card, scaling wrapper, fonts
src/lib/kidsReport.ts                  Types, presets, CSV import, share-link encoding
src/lib/kidsExport.ts                  PNG export, share helpers
```
