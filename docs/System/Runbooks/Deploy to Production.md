---
type: runbook
tags: [runbook, deploy, vercel]
updated: 2026-09-24
who: Claude or Developer, checked by the Owner
source:
  - package.json
  - vercel.json
  - scripts/vercel-ignore-build.sh
  - scripts/sync-content-packs.mjs
  - README.md
---

# Deploy to Production

## What this is for

The live site, sale.khbevents.com, is rebuilt from the `main` branch on GitHub. A change reaches customers only after it is pushed to `main`. This runbook keeps every release safe, so a landing page never breaks while ads are running.

**Who normally does it:** Claude or a developer. The owner checks the live page at the end.

## The owner's rule

| Rule | What it means |
|---|---|
| Straight to `main` | Code changes go directly to the `main` branch. No pull requests. |
| Push = deploy | Pushing to `main` on GitHub starts a production deployment on Vercel automatically. |
| Verify first | Every change is checked locally before the push. See [[Verify Changes Locally]]. |
| Check after | The live deployment is checked after the push. |

Decisions like this one belong in [[Decision Log]].

## Before you start

- [ ] The change is finished and tested with [[Verify Changes Locally]].
- [ ] `data/db.json` has no local test noise in it (restore it with `git checkout data/db.json`). Never commit it by accident.
- [ ] No password, bot token or key is in the change. See [[Admin and Security]].
- [ ] If the change adds a file in `supabase/migrations/`, plan to run it after the deploy (see step 8).

## Steps

The four quality gates, exactly as in `package.json`:

| Command | What it checks |
|---|---|
| `npm run typecheck` | TypeScript types (`tsc --noEmit`) |
| `npm run lint` | Code style and common mistakes (`eslint`) |
| `npm test` | Unit tests (`vitest run`, files `src/**/*.test.ts`) |
| `npm run build` | The production build (`next build`, then the content pack sync) |

- [ ] **1.** Run all four quality gates. All must pass.
- [ ] **2.** Commit with a short, clear message that says what changed.
- [ ] **3.** Push to `main` on GitHub.
- [ ] **4.** Vercel starts a production build. It runs `npm run build` (set in `vercel.json`). Server functions run in the Singapore region `sin1`.
- [ ] **5.** In the Vercel dashboard, open **Deployments** and wait until the new deployment shows **Ready**.
- [ ] **6.** Open the project's runtime logs in Vercel and check there are no new errors.
- [ ] **7.** Open the live pages and check them (see "Check it worked").
- [ ] **8.** If the change needs it: run any new file in `supabase/migrations/` in the Supabase SQL editor (see [[Run the RLS Lockdown Migration]]). If the change touches the Telegram bot, register the webhook again in **Admin → Settings & Security → Instant Telegram Alerts** (see [[Rotate the Telegram Bot Token]]).
- [ ] **9.** Write a short session log in the Sessions folder and tick the task in [[Open Tasks]].

## What the production build also does

After `next build` succeeds, `npm run build` runs `scripts/sync-content-packs.mjs`. It applies each content pack in `content/pages/` to the CMS once per file version, only during a Vercel production build. It never fails the build. Details: [[Content Packs]].

Content packs must never overwrite the registration and early-bird deadlines. The owner sets those in the admin personally.

## Notes-only pushes skip the build

A push that changes only files in `docs/` or `CLAUDE.md` does not rebuild the live site. Saving a note in Obsidian never redeploys the website.

- The rule is `ignoreCommand` in `vercel.json`, which runs `scripts/vercel-ignore-build.sh`.
- The script builds whenever it is unsure: no previous deployment, a git error, or no file changes at all (for example a manual redeploy).
- Any push that also changes code builds as usual.

## Check it worked

- [ ] The deployment shows **Ready** in Vercel.
- [ ] No new errors in the Vercel runtime logs.
- [ ] The landing page on sale (today `/smart-city-tea-cafe`) opens on a phone and on a desktop.
- [ ] Price, seats and deadlines on the page match what is set in the admin. The admin is the source of truth.
- [ ] The admin opens at `/admin` and you can log in.
- [ ] If the change touched the form or [[Round Robin]]: send one test lead, check the Telegram alert, then delete the test lead in [[Leads CRM]].

## If something goes wrong

| Problem | What to do |
|---|---|
| A quality gate fails before the push | Do not push. Fix the problem and run all four gates again. |
| The Vercel build fails | The old version stays live. Read the build log in Vercel, fix, and push again. |
| The build is Ready but the site is broken | Roll back at once (below), then fix calmly. |
| A notes-only push built anyway | Harmless. The script builds whenever it is unsure. |
| A code push was skipped | Should not happen. Tell a developer and check the build log of that deployment. |

**Roll back.** In the Vercel dashboard, open **Deployments**, find the last deployment that worked, and promote it back to production (Vercel calls this Instant Rollback, or "Promote to Production"). The live site switches back within moments. Then fix the problem in code and deploy again as normal.

A rollback changes only the code. It does not undo data saved in the admin or rows changed in Supabase.

## To confirm

The Vercel dashboard steps (the **Ready** status, runtime logs, Instant Rollback or "Promote to Production") describe how Vercel works in general. They are not written in this repository. Check the exact buttons the first time you use them.

## Related

- [[Verify Changes Locally]], [[Run the RLS Lockdown Migration]], [[Rotate the Telegram Bot Token]]
- [[System Map]], [[Content Packs]], [[Admin and Security]]
- [[Open Tasks]], [[Decision Log]], [[Project History]]
