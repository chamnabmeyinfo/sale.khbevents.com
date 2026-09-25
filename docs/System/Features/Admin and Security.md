---
type: feature
tags: [system, feature, security, admin]
updated: 2026-09-24
admin_path: /admin/settings#security
admin_menu: Settings & Security
source:
  - src/lib/auth.ts
  - src/lib/page-access.ts
  - src/lib/rate-limit.ts
  - src/lib/secrets.ts
  - src/lib/supabase.ts
  - src/lib/storage.ts
  - src/app/admin
  - src/app/api/auth/login/route.ts
  - src/app/api/settings/route.ts
  - src/app/api/pages/unlock/route.ts
  - src/app/api/telegram/setup-webhook/route.ts
  - src/app/api/telegram/webhook/route.ts
  - src/components/admin/AdminSidebar.tsx
  - src/components/admin/SettingsClient.tsx
  - supabase/schema.sql
  - supabase/migrations/20260923_lock_down_rls.sql
  - README.md
  - CPANEL_DEPLOYMENT.md
---

# Admin and Security

## What it does for the business

The admin holds our customers' phone numbers, the sales team's Telegram details and the bot that talks to customers. Security keeps all of that away from strangers, keeps private trip pages private, and stops spam from flooding the CRM. Three urgent items are open; see "Open security items" below.

## Where it is in the admin

**Admin → Settings & Security** (`/admin/settings`).

| Tab | Holds |
|---|---|
| Company Profile & Contact | Company name, tagline, hotline, WhatsApp, email, address |
| Social & Media Channels | Facebook, TikTok, public Telegram username |
| Instant Telegram Alerts | Alert switch, **Telegram Bot Token**, **Target Chat ID / Sales Group ID**, **Register / secure bot webhook** |
| Theme & Display | Light, dark or automatic theme; portal language ([[Languages]]) |
| Roles & Security | Role cards and **Update Portal Admin Password** |

## Logging in

- Admins log in at `/admin/login` with an email and the admin password.
- Two addresses are accepted: the owner address and the admin address. Both are set in `src/lib/auth.ts` and the company settings. **Both use the same single admin password.**
- A successful login sets the cookie `khb_admin_session` for **7 days**. It is signed with the server secret `SESSION_SECRET` together with the current password hash.
- **Changing the password signs out every other session.** The admin who changed it stays signed in.
- Staff who sign in through Supabase Auth (the `/login` page) also count as admins when their email ends in `@khbevents.com` (or is the owner address) **and** the address is confirmed.
- Every admin page checks the session and redirects to `/admin/login` if there is none. Every admin API answers "Unauthorized" without one (`requireAdmin` in `src/lib/auth.ts`).

Steps to change it are in [[Change the Admin Password]]. New passwords shorter than 6 characters are ignored. Passwords are stored salted (scrypt); an old unsalted hash still works until the password is next changed.

## Roles

| Shown in the admin | Who | What they can do |
|---|---|---|
| 🛡️ SUPER ADMIN | Shown when the browser is signed in to Supabase as the super-admin address | Everything |
| 👑 OWNER | Shown in every other case, including a normal password login | Everything |

In code there are also `admin` (any other `@khbevents.com` address) and `client` (everyone else) (`getUserRole` in `src/lib/auth.ts`). At the time of writing, every logged-in admin has full access ("Full Access" in the sidebar). The role only changes the badge; no screen is limited by role.

## Passcode-protected pages

A landing page can be private. In the page editor → **⚙️ Dedicated Settings** → **Campaign Access Control & Privacy Gate**, choose **VIP PIN / Password Protected** and set the **VIP Access Passcode / PIN**. See [[Landing Pages CMS]].

- Visitors see a lock screen with only the page title, partner name and logo, and phone, until they enter the passcode.
- A correct passcode unlocks the page in that browser for **12 hours**.
- Changing the passcode locks the page again for everyone.
- Logged-in admins skip the lock.
- Protected pages are hidden from search engines and from the home page list.

## Rate limits

| What | Limit per visitor address | Where |
|---|---|---|
| Admin login | 10 tries per 15 minutes; also 20 per 15 minutes per email | `src/app/api/auth/login/route.ts` |
| Passcode entry | 10 tries per 15 minutes; also 100 per 15 minutes per page | `src/app/api/pages/unlock/route.ts` |
| Lead form | 5 forms per 10 minutes | `src/app/api/leads/route.ts` |
| New Telegram click assignments | 10 per 10 minutes (then the fallback contact) | `src/app/api/round-robin/route.ts` |
| Tracking events | 60 per minute | `src/app/api/track/route.ts` |

- The visitor address is read from headers set by the hosting proxy. For `X-Forwarded-For` the last entry is used, the one our own proxy adds, so a fake header from the visitor does not dodge the limit (`getClientIp`).
- When no address is known, all such visitors share one bucket with a 20 times larger limit.
- Limits are kept in server memory (`src/lib/rate-limit.ts`). They are exact on a single cPanel server and approximate on Vercel, where each server instance counts on its own.

## What visitors can never see

- Public pages get company settings **without** the bot token, chat IDs, staff routing data, owner and admin addresses or the password hash (`getPublicSettings` in `src/lib/storage.ts`).
- Landing pages are sent **without** their passcode, bot token, chat ID, webhook address and secret, and per-page routing (`toPublicPage` in `src/lib/page-access.ts`).
- Admin forms show a stored bot token as `••••••••`. Saving the form with the dots keeps the current token (`src/lib/secrets.ts`).
- The Telegram webhook, once secured, only accepts calls that carry a secret derived from the bot token. Changing the token changes that secret, so the webhook must be registered again.

## Where the secrets live

Write where a secret is kept, never the secret itself. See [[How to Use This Vault]].

| Secret or setting | Where it lives | Changed in |
|---|---|---|
| `SESSION_SECRET` | Vercel → Project → Settings → Environment Variables | Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel environment variables | Vercel (value from Supabase project settings) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel environment variables. Public by design, safe only with the RLS lockdown | Vercel |
| `NEXT_PUBLIC_APP_URL` (not secret) | Listed for Vercel in `README.md`; the code does not read it at the time of writing | Vercel |
| Telegram bot token | Company settings in Supabase (`system_settings`, row `default`) | Admin → Settings & Security → Instant Telegram Alerts, or the Bot Token field in Admin → Staff Round Robin |
| Per-page bot token, chat ID, webhook secret, passcode | The page record in Supabase | Page editor → ⚙️ Dedicated Settings |
| Admin password | Only its hash, in company settings | Admin → Settings & Security → Roles & Security |
| Staff Telegram chat IDs | Round robin row in Supabase | Admin → Staff Round Robin |

On a cPanel install the same variables go in **Setup Node.js App → Environment variables** (`CPANEL_DEPLOYMENT.md`). Without `SESSION_SECRET`, sessions and page unlocks fall back to a publicly known value, so it must always be set.

## Database access (RLS)

- The app reads and writes Supabase **only from the server**, with the service role key. The browser uses Supabase only for client sign-in.
- The public anon key ships in the browser. Older table policies let that key read and edit every table, including leads, the bot token and staff chat IDs.
- The fix is `supabase/migrations/20260923_lock_down_rls.sql`: it removes those policies and leaves RLS on with no policies, so only the server can reach the tables.
- **Status: the migration has not been run yet.** Run it only after `SUPABASE_SERVICE_ROLE_KEY` is set on the server, or the app loses database access. Steps: [[Run the RLS Lockdown Migration]].
- If the service role key is missing, the server logs a warning and falls back to the anon key (`src/lib/supabase.ts`).

## Open security items

| Item | Why | Runbook |
|---|---|---|
| Rotate the Telegram bot token | It was committed in `data/db.json` in the past, so it is in git history. Treat it as public | [[Rotate the Telegram Bot Token]] |
| Change the admin password | The production password may still be the seed default, which is printed in repo docs | [[Change the Admin Password]] |
| Run the RLS lockdown migration | Until then the public key may read and edit tables | [[Run the RLS Lockdown Migration]] |

Track them in [[Open Tasks]].

## Limits and gotchas

- One shared admin password means everyone who logs in with it is the same user. When a person leaves the team, change the password.
- After changing the bot token, press **Register / secure bot webhook** again in Admin → Settings & Security (save the new token first).
- Rate limits reset when a server instance restarts.

## Clear demo data

**Admin → Settings & Security → Demo data** (`/admin/settings#data`, sidebar **Clear Demo Data**). Rules in `src/lib/demo-data.ts`, work in `scanDemoData` / `clearDemoData` (`src/lib/storage.ts`), address `/api/demo-data` (admin only).

- Lists every lead with a clear demo sign, with the reason: **simulation** (made by Round Robin → Simulation Studio: "[SIMULATION TEST]", the simulation flag or utm_source simulation_tool), **sample** (shipped with the site in `data/db.json`), **test name** (name or e-mail says test, tester, demo, sample or dummy, or uses example.com). Each can be unticked.
- Also: sample staff accounts; the Round Robin routing log (entries of the deleted leads by default, or the whole log, since test Telegram clicks look like real ones); and **Reset all statistics to zero** (page views, popup stats, Telegram click history, staff counters; lead counts recalculated), off by default.
- Nothing happens until the word DELETE is typed. The server checks every lead id against the demo rules again, so a real lead cannot be deleted this way even by calling the address directly. Deleting cannot be undone.

## Related

- Runbooks: [[Change the Admin Password]], [[Rotate the Telegram Bot Token]], [[Run the RLS Lockdown Migration]], [[Deploy to Production]]
- Features: [[Round Robin]], [[Landing Pages CMS]], [[Leads CRM]]
- Decisions: [[Decision Log]]
- Map: [[System Map]]

## To confirm

- `FEATURE_BLUEPRINT.md` section 5.2 still prints a bot token and a manager chat ID, and `README.md`, `FEATURE_BLUEPRINT.md` and `CPANEL_DEPLOYMENT.md` print the seed login. Should these be removed from the docs as part of the rotation? (See [[Open Tasks]].)
- Is `SESSION_SECRET` set on the Vercel project? Check the variable exists; never copy its value.
