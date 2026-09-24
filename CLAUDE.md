@AGENTS.md

# Project knowledge: the Obsidian vault in `docs/`

`docs/` is an Obsidian vault shared by the owner, the sales team and Claude. It holds business facts, the sales playbook, how each portal feature works, runbooks, open tasks and the decision log.

**At the start of a session**
- Read `docs/00 Start Here.md` and `docs/Tasks/Open Tasks.md`.
- Before working on a feature, read its note in `docs/System/Features/`. Before writing sales copy, read the trip note in `docs/Business/Trips/` and `docs/Copywriting/Copy Rules.md`.
- Tasks tagged `#for-claude` in Open Tasks are requests from the owner.

**At the end of substantive work** (a feature, a fix, a decision; not a one-line answer)
- Add a session note in `docs/Sessions/` named `YYYY-MM-DD Short title.md`, following `docs/Templates/Session Log.md`.
- Tick finished items and add new follow-ups in `docs/Tasks/Open Tasks.md`.
- Add new decisions at the top of `docs/Decisions/Decision Log.md`.
- If a feature's behaviour changed, update its note in `docs/System/Features/`.
- Run `npm run vault:check` (broken links, secrets) and fix what it reports.

**Rules**
- Never write secrets in the vault: passwords, the Telegram bot token, chat IDs, Supabase keys, env var values, customer contact data. Write where a secret lives instead.
- Never invent facts, testimonials, customers or statistics. Unsure facts go under a "To confirm" heading.
- Live prices, deadlines and seats left come from the admin CMS; notes explain them and are corrected when they disagree.
- Link notes with `[[Note name]]` using existing file names; keep notes short, one idea each.
- Commits that change only `docs/` or `CLAUDE.md` skip the Vercel production build (`scripts/vercel-ignore-build.sh`). Use a `notes:` or `docs:` commit prefix for them.
