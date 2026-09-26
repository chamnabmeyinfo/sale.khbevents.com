---
type: session
date: 2026-09-26
tags: [session]
---

# Whole-system backups

## Asked for

- A backup system for the entire system, smart enough to protect against a future code update accidentally deleting data.

## Done

- Snapshots of all business tables to a private storage bucket: before every production build, daily, before Clear demo data / page deletion / restore, and on demand. Retention per kind.
- Data-loss check on every snapshot and on every visit of the Backups tab and Dashboard: missing pages or a real fall in leads → Telegram alert + red banner.
- Admin → Settings → **Backups & Restore**: health, list, Back up now, Download, Restore (parts, add-missing or overwrite, RESTORE typed, undo snapshot first).
- See [[Backups]], [[Restore from a Backup]].

## Verified

- tsc, eslint, 225 unit tests (4 new for the comparison rules), production build; the build-time bundle compiles with the new module.
- Local browser rehearsal: Back up now → file holds all tables → download → a page deleted through the real delete (its before-deletion snapshot appeared) → health and Dashboard showed the drop with the missing page → restore "add missing, pages only" → page back, opens publicly, health ok, banner gone, restore's own undo snapshot listed. No page errors. Test data and local backup files removed.
- Two bugs found and fixed during the rehearsal: a restored page kept its "deleted" mark; the local in-memory copy overwrote the restored file.
- Live: the first production build failed to create the bucket (a file-size limit above the Supabase plan's); fixed in a second commit. That build's log shows `[backup] before deploy: deploy/2026-09-26T09-00-46-142Z-deploy-29c787a.json (3 pages, 0 leads, 491 KB)`: the live database holds 3 pages and 0 leads at this time. The Telegram alert path was not exercised (no drop).

## Decisions

- In [[Decision Log]].

## Follow-ups

- Owner: check the first Before-deploy snapshot appears; download a manual copy monthly (in [[Open Tasks]]).
