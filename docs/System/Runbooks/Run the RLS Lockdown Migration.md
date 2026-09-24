---
type: runbook
tags: [runbook, security, supabase, database]
updated: 2026-09-24
who: Owner or Developer (needs access to the Supabase and Vercel dashboards)
source:
  - supabase/migrations/20260923_lock_down_rls.sql
  - supabase/schema.sql
  - src/lib/supabase.ts
  - src/app/api/uploads/route.ts
  - scripts/verify-supabase.mjs
  - README.md
  - CPANEL_DEPLOYMENT.md
---

# Run the RLS Lockdown Migration

## What this is for

The database holds every lead with the customer's name and phone number, all landing pages, and the settings, including the bot token, the admin password hash and staff Chat IDs.

Supabase gives every website two kinds of keys. The **public (anon) key** is visible to anyone in the browser. The **service role key** is secret and stays on the server. The old database rules let the public key read and edit every table. In plain words: anyone who knew how could read our leads and the bot token.

The migration `supabase/migrations/20260923_lock_down_rls.sql` closes that door. It has not been run yet. This is an open task in [[Open Tasks]].

**Who normally does it:** the owner or a developer. Claude can prepare and check, but running SQL on the live database needs a person logged in to Supabase.

## What the migration does

| Part | Effect |
|---|---|
| Drops 8 old policies | The four "Service role full access on …" policies (which in fact applied to every role) and the four "Public can …" policies (view published pages, view company settings, insert leads, insert page views). |
| Keeps Row Level Security on | For `landing_pages`, `leads`, `system_settings` and `page_views`. |
| Result | With no policies, the public and signed-in roles get no table access. The service role (the server) keeps full access, because it bypasses these rules. |

The website reads and writes tables only from the server, with the service role key. The browser uses Supabase only for sign-in. So the site keeps working, **as long as the server has the service role key**.

## Before you start

- [ ] **The server has the service role key.** In Vercel → Project → Settings → Environment Variables, check that `SUPABASE_SERVICE_ROLE_KEY` exists for Production. Do not copy its value anywhere.
- [ ] If you just added the variable: redeploy, because Vercel applies a changed variable only to new deployments. See [[Deploy to Production]].
- [ ] Quick proof the key works: in the admin, upload a test image anywhere (for example a popup picture). Uploads fail with "Image storage is not configured: set SUPABASE_SERVICE_ROLE_KEY." when the key is missing. See [[Image Uploads]].
- [ ] Or check the Vercel runtime logs: the message "SUPABASE_SERVICE_ROLE_KEY is not set: the server is using the public anon key …" must **not** appear.
- [ ] Pick a quiet time and have the admin open in another tab.

If the key is missing and you run the migration anyway, the website loses access to its database: pages, leads and settings stop loading.

## Steps

- [ ] **1.** Open the Supabase dashboard and choose the project used by sale.khbevents.com.
- [ ] **2.** Open **SQL Editor** and start a new query.
- [ ] **3.** Open `supabase/migrations/20260923_lock_down_rls.sql` from the repository (on GitHub or in your local copy) and copy its whole content.
- [ ] **4.** Paste it into the SQL editor and press **Run**.
- [ ] **5.** It should finish without an error. The statements use `IF EXISTS`, so running it twice is harmless.
- [ ] **6.** Do the checks below straight away.

## Check it worked

- [ ] The live landing page (today `/smart-city-tea-cafe`) loads, with the right price and seats.
- [ ] Send a test form. The lead appears in [[Leads CRM]] and the Telegram alert arrives. Delete the test lead afterwards.
- [ ] In the admin, **Landing Pages CMS** lists the pages and **Settings & Security** loads.
- [ ] Save a harmless change in the admin (for example re-save a setting) and reload. It stays saved.
- [ ] Developer check, optional: `node scripts/verify-supabase.mjs` with the local environment file. The public-key read of `landing_pages` should now return nothing, while the service-role read still works. The script prints lead data to the terminal; never paste its output anywhere.
- [ ] Tick the task in [[Open Tasks]] and record the date in [[Decision Log]].

## If something goes wrong

| Problem | What to do |
|---|---|
| Pages, leads or settings stop loading after the run | The server is using the public key. Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel → Project → Settings → Environment Variables, then redeploy. This is the fix; do not undo the migration. |
| The SQL editor shows an error | Copy the error message and ask a developer. The file is safe to run again once the cause is fixed: it only drops policies `IF EXISTS` and switches Row Level Security on. |
| Something else looks broken | Roll back the website only if a code deploy caused it ([[Deploy to Production]]). The database change is separate. |

**Undo.** The migration file has no undo script. Undoing it would mean re-creating the old open policies (their text is in the git history of `supabase/schema.sql`), which re-opens the leak. Ask a developer before doing that; the right fix is almost always the service role key.

## To confirm

- The Supabase dashboard steps (SQL Editor, new query, Run) and the Vercel rule that a changed variable needs a redeploy describe those services in general, not this repository. Check the exact buttons when you do it.
- The expected result of `scripts/verify-supabase.mjs` after the migration is inferred from the migration's own comments; nobody has run it yet.

## Related

- [[Admin and Security]], [[Change the Admin Password]], [[Rotate the Telegram Bot Token]]
- [[Deploy to Production]], [[System Map]], [[Leads CRM]]
- [[Open Tasks]]
