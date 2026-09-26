---
type: runbook
tags: [runbook, backups, safety]
updated: 2026-09-26
who: Owner
source:
  - src/lib/backups.ts
  - src/components/admin/BackupsPanel.tsx
---

# Restore from a Backup

When pages, leads or settings have gone missing, or an update went wrong.

## When you get the alert

A Telegram message "Data check: something is missing since the last backup", or the red banner on the Dashboard, means the live counts are lower than the last snapshot. Do not make other changes first.

## Steps

1. **Admin → Settings & Security → Backups & Restore.** Read the red box: it names the missing pages and the lead counts before and after.
2. Find the right snapshot in the list. Usually the newest **Before deploy** or **Daily** one from before the problem. Its line shows how many pages and leads it holds.
3. Press **Restore** on that snapshot.
4. Tick what to bring back. For missing pages or leads, tick those. Tick **Settings…** only if staff, campaigns, popups or page history are also missing.
5. Choose **Add back what is missing**. It only puts back what no longer exists and changes nothing else. Choose **Overwrite with the backup** only when you want to undo edits made after the snapshot (for example a page saved with wrong content).
6. Type **RESTORE** and press **Restore now**. A new snapshot is taken first, so this step can be undone.
7. Reload the admin. Check the pages, the leads and the public site.

## If the restore itself was a mistake

Restore again from the newest **Before deletion / restore** snapshot, which was taken just before your restore, with **Overwrite**.

## If the list is empty or the tab shows an error

The server needs `SUPABASE_SERVICE_ROLE_KEY` (Vercel → Settings → Environment Variables). Until it is set, use Supabase's own backups: Supabase dashboard → Database → Backups. Ask Claude for help restoring from one.

## Related

[[Backups]], [[Page Builder]] (per-page Versions for a single page).
