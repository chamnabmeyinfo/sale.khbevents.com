---
type: feature
tags: [feature, backups, safety]
updated: 2026-09-26
source:
  - src/lib/backups.ts
  - src/app/api/backups/route.ts
  - src/app/api/backups/[name]/route.ts
  - src/components/admin/BackupsPanel.tsx
  - src/components/admin/DataHealthBanner.tsx
  - scripts/sync-content-packs.ts
  - src/app/api/round-robin/daily-summary/route.ts
---

# Backups

Whole-system backups, so a code update or a mistake that deletes data can be undone.

## What it does for the business

A copy of everything the business keeps in the portal (pages, leads, settings, staff, campaigns, popups, page history) is taken automatically and can be restored in a few clicks. Missing data is noticed and reported without anyone checking.

## Where it is in the admin

**Admin → Settings & Security → Backups & Restore** (`/admin/settings#backups`, also in the side menu).

## What a snapshot holds

One JSON file with every row of `landing_pages`, `leads` and `system_settings` (the last one also holds the round robin staff, popups, campaigns, AI reports, visit records, page history and autosaves). Page views are not included (analytics, regenerable); their count is noted.

Files live in the **private** Supabase Storage bucket `backups` (created automatically; only the server's service key can read it), under `<kind>/<time>-<label>.json`. Locally, without Supabase, in `data/backups/` (ignored by git). The list of snapshots is the `backups_index` row of `system_settings`.

## When snapshots are taken

| Kind | When | Kept |
|---|---|---|
| Before deploy | At the start of every production build, before content packs apply (`scripts/sync-content-packs.ts`), labelled with the commit | last 20 |
| Daily | The daily cron (`/api/round-robin/daily-summary`, 13:00 UTC), once per Phnom Penh day | last 30 |
| Before deletion / restore | Before Clear demo data, before a page is deleted, before a restore. No backup, no deletion. | last 20 |
| Manual | **Back up now** | last 50 |

## The data-loss check

Every new snapshot is compared with the previous one. A drop is: any page missing (by slug), or leads down by more than 5 and more than 10 % (clearing a few demo leads is not a drop). A drop:
- is marked on the snapshot in the list ("Fewer pages or leads than before");
- sends a Telegram message to the chat in Settings (at deploy and daily);
- shows a red **Data is missing** box on the Backups tab and a red banner on the Dashboard, both pointing at Restore.

The Backups tab and the Dashboard also compare the live counts with the last snapshot on every visit.

## Restore

Pick a snapshot → **Restore** → choose **Landing pages**, **Leads**, **Settings…** → choose how:
- **Add back what is missing** (default): only rows whose id no longer exists are put back; nothing present now changes.
- **Overwrite with the backup**: every row in the snapshot replaces the current one.

Nothing that exists now is ever deleted by a restore. A "before restore" snapshot is taken first, so a restore can itself be undone. Restored pages lose their "deleted" mark and show again. Type RESTORE to confirm. See [[Restore from a Backup]].

## Download

**Download** saves the snapshot as a JSON file. It contains the settings, including the Telegram bot token: keep the file private.

## Limits and gotchas

- The backups need `SUPABASE_SERVICE_ROLE_KEY` on the server (the anon key cannot write to storage). Without it the tab shows an error and nothing is backed up.
- Uploaded photos and videos live in the public storage bucket and are not part of a snapshot; a snapshot keeps the links to them.
- Supabase's own database backups (Supabase dashboard → Database → Backups) are a second, independent safety net.
- Restoring **Settings** with Overwrite also puts back the admin password hash and the bot token as they were at that time.

## Related

[[Page Builder]] (per-page versions and autosave), [[Admin and Security]], [[Deploy to Production]].
