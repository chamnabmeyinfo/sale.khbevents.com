---
type: runbook
tags: [runbook, testing, quality]
updated: 2026-09-24
who: Claude or Developer
source:
  - package.json
  - README.md
  - vitest.config.ts
  - eslint.config.mjs
  - src/lib/storage.ts
  - src/lib/supabase.ts
  - .claude/skills/landing-page-copy/references/qa-checklist.md
---

# Verify Changes Locally

## What this is for

Every code change is checked on a computer before it goes live. This is the owner's rule. It stops a broken form or a wrong price from reaching customers who clicked an ad. The next step after this runbook is [[Deploy to Production]].

**Who normally does it:** Claude or a developer.

## Before you start

- [ ] The repository is on your computer and dependencies are installed (`npm install --ignore-scripts`, as in `README.md`).
- [ ] You know which pages the change affects (landing page, admin screen, popup, form).
- [ ] Check which database your local copy uses (see "Which data a local run uses").

## Which data a local run uses

| Your `.env.local` | Where a local run reads and writes |
|---|---|
| No Supabase settings | The local file `data/db.json` |
| Supabase settings present | The Supabase project those settings point to, plus `data/db.json` as a local copy |

If `.env.local` points at the production Supabase project, saving in the local admin changes live data. Use a test page or no Supabase settings when you test saves. The file names are in `.env.example`; the values never go in the vault.

## Steps

The quality gates, exactly as in `package.json`:

| Command | What it checks |
|---|---|
| `npm run typecheck` | TypeScript types |
| `npm run lint` | ESLint with the Next.js rules (`eslint.config.mjs`) |
| `npm test` | Vitest unit tests (`vitest.config.ts`, files `src/**/*.test.ts`) |
| `npm run build` | The production build |

- [ ] **1.** Run all four quality gates. All must pass.
- [ ] **2.** Start the built site: `npm start` (runs `next start`). Add `-- -p <port>` to use a port other than 3000.
- [ ] **3.** Open the changed pages in a browser at phone width (about 375 px) and at desktop width.
- [ ] **4.** Check the pages in both languages, English and Khmer. See [[Languages]].
- [ ] **5.** Check the admin screens you changed. Log in at `/admin` with the local admin login. Never write that login in the vault.
- [ ] **6.** If the form or routing changed: send a test lead and check it appears in [[Leads CRM]].
- [ ] **7.** Stop the local server.
- [ ] **8.** Restore the local database: `git checkout data/db.json`. Local runs write to it, for example test leads and saved settings.
- [ ] **9.** Run `git status` and make sure `data/db.json` is not in the list of changed files.

For a copy change on a landing page, also run the QA list in `.claude/skills/landing-page-copy/references/qa-checklist.md` (truth, clarity, bilingual, technical). See [[Copy Rules]].

For a change to the vault only, run `npm run vault:check`. It checks that every wikilink points to an existing note and that no secret-looking text is in the notes.

## Check it worked

- [ ] All four gates passed on the final version of the change.
- [ ] Every changed page looked right at phone and desktop width.
- [ ] No errors in the browser console or in the terminal running the server.
- [ ] `git status` shows only the files you meant to change.

## If something goes wrong

| Problem | What to do |
|---|---|
| A gate fails | Fix the cause. Do not skip the gate or push anyway. |
| `npm run build` shows a content pack warning | The content pack sync never fails the build. It only writes during a Vercel production build. Read the warning; see [[Content Packs]]. |
| The page looks different from production | Your local data differs from Supabase. Compare with the live admin. |
| `data/db.json` shows as changed | Run `git checkout data/db.json`. Never commit local test data. It can hold test leads and settings. |
| You saved test data into production by mistake | Delete the test lead in [[Leads CRM]] and restore the setting in the admin. Note it in the session log. |

## Related

- [[Deploy to Production]], [[Launch a New Trip Page]]
- [[System Map]], [[Admin and Security]]
- [[Copy Rules]], [[Content Packs]]
