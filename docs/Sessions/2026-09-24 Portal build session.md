---
type: session
date: 2026-09-24
started: 2026-09-23
tags: [session]
updated: 2026-09-24
commits: ["befb78b", "93d0062", "e99ef90", "5a69976", "7291cbd", "b0cdd5a", "1a24644", "6994887", "bd8a2dd", "ca64264", "f203da0", "6d1e831"]
source:
  - git log (commits befb78b to 6d1e831)
  - .claude/skills/landing-page-copy/SKILL.md
  - README.md
---

# 2026-09-24 Portal build session

A long working session with Claude, from 2026-09-23 to 2026-09-24. It made the portal safer and faster, rebuilt the Smart City page to sell, fixed lead routing, and added popups, a full Khmer admin and this vault. The timeline with every commit is in [[Project History]]. The reasons are in [[Decision Log]].

## Asked for

- Fix security problems and bugs in the portal.
- Make the public pages faster.
- Fix buttons that could not be seen on the Smart City page.
- Make the Smart City page more convincing, in English and Khmer.
- Upload hero slideshow photos and arrange them by dragging.
- Upload images from every image field in the admin.
- Check that Round Robin shares leads fairly and reliably.
- Remember returning visitors so they stay with one salesperson.
- Fix the concierge Telegram link that showed a page of code (JSON).
- Run popup ads on the landing pages.
- Use the whole admin in Khmer.
- Set up an Obsidian vault as shared project memory.

## Done

| Area | What changed | Commit | Note |
|---|---|---|---|
| Security and bugs | Signed admin sessions, admin-only APIs, secrets kept off the browser, server-checked page passcodes, rate limits, many bug fixes | `befb78b` | [[Admin and Security]] |
| Speed | 60-second cache for database reads; server functions in Singapore (`sin1`) | `93d0062` | [[System Map]] |
| Smart City copy | Invisible buttons fixed; copy rewritten in EN and KH; price $550; placeholder testimonials hidden; deadlines left to the owner; "Import JSON"; copywriting skill in `.claude/skills/landing-page-copy` | `e99ef90` | [[Smart City Tea and Cafe Vietnam 2026]], [[Copy Rules]] |
| Content packs | Page copy in `content/pages/*.json`, applied by the production build | `5a69976` | [[Content Packs]] |
| Smart City design | Conversion-focused redesign; coordinator card beside the registration form; form before the pass preview on phones | `7291cbd` | [[Landing Pages CMS]] |
| Photos | Hero slideshow upload and drag to arrange; Upload button on every image field | `b0cdd5a`, `1a24644` | [[Image Uploads]] |
| Round Robin | Redirect first, alerts after (Next.js `after()`); fair weighted share; only staff who can take the lead; sticky cookie; empty default staff list; readiness check | `6994887` | [[Round Robin]] |
| Returning visitors | "Remember a visitor for": Off, 1, 2, 3 or 6 months; returning customers matched by phone or email | `bd8a2dd` | [[Round Robin]], [[Leads CRM]] |
| Telegram link | Concierge link fixed (bad `?text=` join); first message now prefilled in Telegram | `ca64264` | [[Round Robin]] |
| Popups | Admin → Ads & Popups | `f203da0` | [[Ads and Popups]] |
| Languages | English / Khmer for the whole admin and both sign-in pages | `6d1e831` | [[Languages]] |
| Vault | This vault in `docs/`, `npm run vault:check`, note-only pushes skip the Vercel build | committed with this note (commit message "docs: Obsidian vault for the project") | [[How to Use This Vault]] |

**Questions answered in the session**

- *Why do we need a Telegram bot?* Mainly for alerts. The visitor is sent straight to the salesperson's own Telegram chat, and the bot tells staff and managers about the new contact. If no salesperson can take a click, the bot is the last-resort link.
- *Does the system remember returning visitors?* Yes. How long is a setting in Admin → Staff Round Robin.

## Verified

What the commit messages record:

- `befb78b`: 0 lint errors and 32 unit tests.
- `7291cbd`: typecheck, lint, 43 tests and a production build passed. Browser checks at desktop and phone width in English and Khmer: main button in the first screen, no invisible buttons, no sideways scrolling, no script errors, placeholder sections gone.
- `b0cdd5a`: browser-tested uploads, including that an anonymous upload is refused, and that the new photo shows in the slideshow.
- `1a24644`: build, typecheck, lint and 48 tests passed; upload into the social share image field tested in the browser.
- `f203da0`: popup rules are in a unit-tested module (`src/lib/popup-ads.ts`).
- `6d1e831`: 1,625 strings in both languages, with no missing Khmer entry.
- `5d00eb5` (this vault): typecheck, lint, 78 tests, production build and `npm run vault:check` passed. Vercel deployment READY with no runtime errors. The ignore-build script was tested in a throwaway clone for nine cases: note-only pushes skip; no previous deployment, unknown commit, no changes, and any code change all build.
- The first note-only push after `5d00eb5` is the live test of the skip rule; its result is recorded in [[Deploy to Production]].

See [[Verify Changes Locally]] for the standard checks.

## Decisions

All recorded in [[Decision Log]]:

- Code changes go straight to `main`; each change is verified locally first and the live site checked after.
- The Smart City seat sells for $550.
- Placeholder testimonials stay hidden until real ones exist.
- Deadlines are set by the owner only; code and content packs never overwrite them.
- Page copy lives in git as content packs, applied at build.
- New saved data goes into JSON rows in `system_settings`, with no SQL migration.
- The Telegram bot sends alerts; the visitor goes straight to the salesperson.
- Fair Weighted Share is the default routing algorithm.
- Sticky salesperson with a "Remember a visitor for" setting.
- Popups: at most one per page view, a cooldown, hidden after a lead.
- One language option for the whole portal, English as the fallback.
- The vault lives in `docs/`; note-only pushes skip the build; no secrets in the vault.

## Follow-ups

Tracked in [[Open Tasks]]:

- [ ] Rotate the Telegram bot token. It is in git history, and it still appears in `data/db.json`, `FEATURE_BLUEPRINT.md` and the in-admin guide (`src/components/admin/UserGuideClient.tsx`). See [[Rotate the Telegram Bot Token]].
- [ ] Change the admin password on production; it may still be the seed default. See [[Change the Admin Password]].
- [ ] Run the RLS lockdown migration `supabase/migrations/20260923_lock_down_rls.sql`. See [[Run the RLS Lockdown Migration]].
- [ ] Owner: send real testimonials and outcome photos for the Smart City page.
- [ ] A native Khmer speaker reviews the wording of the Khmer admin. See [[Languages]].
- [ ] Check the readiness card in Admin → Staff Round Robin: the default staff list is empty, so real staff must be in the staff list, with a Telegram username to receive clicks and a Chat ID to receive form leads. See [[Add a Sales Staff Member]].

## To confirm

- The current bot token is still in plain text in `FEATURE_BLUEPRINT.md` (section 5.2, next to a chat ID), in the in-admin guide at `/admin/guide` (`src/components/admin/UserGuideClient.tsx`) and in `data/db.json`. Should those be removed from the files after the token is rotated?
- Has the bot webhook been re-registered from Admin → Settings & Security since `befb78b`? That commit says the live bot keeps working until it is.
- Was the live site checked after the last pushes (`f203da0`, `6d1e831`)? The commits do not record it.
