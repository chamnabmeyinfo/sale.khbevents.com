---
type: audit
date: 2026-09-29
tags: [audit, security, corrective-action]
status: for-review
source:
  - full read-only audit of src/ (294 TS/TSX files, 42 test files)
  - baseline: tsc --noEmit, vitest (334 tests), eslint
  - src/lib/auth.ts, supabase-store.ts, storage.ts, round-robin.ts, rate-limit.ts
  - src/app/api/telegram/webhook/route.ts, src/app/api/settings/route.ts
  - data/db.json (git-tracked), .gitignore
---

# Full Project Code Audit — Corrective Action Plan

A whole-project audit of the sales portal, done as five parallel read-only passes (security, core-library correctness, API routes, frontend/React, architecture & tooling). **Nothing in the code was changed.** This note is for the owner to review and approve before any fix is made.

Each item below has an ID so you can say, for example, "do P0 and P1-a, skip the rest for now."

> No secrets are written in this note. Where a fix needs a secret rotated or a value read, it says so; the value itself lives in the admin / Vercel, not here. See [[Admin and Security]].

## The short version

- **Build health is genuinely good.** Type check passes, all **334 tests pass**, lint has **0 errors** (37 warnings, mostly `<img>`). TypeScript is in strict mode; `next build` is not set to ignore type or lint errors; `.env` hygiene is correct.
- **The serious problems are not in the build — they are in secrets, auth, and concurrency.** Three things stand out and should be treated as urgent:
  1. **Live secrets are committed to git** in `data/db.json` (bot token, chat IDs, admin password hash).
  2. **The admin session can be forged** when `SESSION_SECRET` is unset and the default password is still in place.
  3. **Shared-state writes race and lose data** on Vercel (visits, round-robin fairness, lead notes) because many writes go through one JSON row with no lock.
- Several of these overlap with tasks already in [[Open Tasks]]; this note supersedes and orders them.

## Priority tiers

### P0 — Critical: secrets & auth (do first)

Fix order matters: **rotate credentials and lock signups first**, because the code fixes below only help once the leaked values are dead.

| ID | Finding | Where | Who |
|----|---------|-------|-----|
| **P0-1** | **Live secrets committed to git.** `data/db.json` is tracked (commit `3b09acb`) and holds the Telegram bot token, a chat ID, an unsalted SHA-256 admin password hash, and staff/lead chat IDs (PII). `.gitignore` excludes `data/*.tmp` and `data/backups/` but **not** `data/db.json`. Anyone with repo or history access can take over the bot and attack the admin hash offline. | `data/db.json`, `.gitignore` | Owner + Claude |
| **P0-2** | **Forgeable admin session.** The session key is `HMAC(SESSION_SECRET, adminPasswordHash)`, but `SESSION_SECRET` falls back to a hardcoded string in source (`auth.ts:59`) and the admin hash falls back to a hardcoded default (`supabase-store.ts:191`). If `SESSION_SECRET` is unset **and** the password was never changed, both inputs are public and an attacker can mint a valid admin cookie — no login, no rate limit. | `auth.ts:57-72`, `supabase-store.ts:191` | Owner + Claude |
| **P0-3** | **Unsalted SHA-256 for the admin password**, with the default committed. New passwords use scrypt, but the legacy bare-SHA256 path is still accepted for any value not prefixed `scrypt$`, and the shipped default is exactly such a digest. | `auth.ts:37-52` | Claude (after P0-1) |

**Corrective actions (P0):**
1. **Owner:** rotate the Telegram bot token ([[Rotate the Telegram Bot Token]]) and set a new strong admin password ([[Change the Admin Password]]).
2. **Owner:** confirm Supabase email sign-ups are closed / allowlisted (see P1-1).
3. **Claude (on approval):** `git rm --cached data/db.json`; add `data/db.json` (or `/data/*.json`) to `.gitignore`; ship only an empty seed file; make Supabase the sole production store. Purge `data/db.json` from history with git-filter-repo/BFG (owner coordinates the force-push).
4. **Claude:** make `SESSION_SECRET` **required** — throw at boot if unset; remove the hardcoded secret fallback and the hardcoded default password hash; derive the signing key from a random per-install secret independent of the password hash.
5. **Claude:** drop the legacy unsalted-SHA256 accept path; force any legacy/default credential to be re-set as scrypt.

Run the RLS lockdown migration ([[Run the RLS Lockdown Migration]]) as part of this tier — it is still open in [[Open Tasks]] and is what stops the public key reading settings.

### P1 — High: authorization, webhook, rate limiting, data races, no CI

| ID | Finding | Where | Who |
|----|---------|-------|-----|
| **P1-1** | **No owner/staff privilege boundary.** Any confirmed `@khbevents.com` Supabase user is a full admin; `settings` PUT (guarded only by `isAuthenticated`) lets any such user rotate the admin password and bot token, and `leads` GET exposes all customer PII. | `auth.ts:19,107`, `api/settings/route.ts:26`, `api/leads/route.ts:12` | Claude |
| **P1-2** | **Telegram webhook is forgeable until `setup-webhook` is run.** When the secret header is absent, the route processes the update unless already secured — so before an admin secures it, anyone who guesses the URL can create fake leads and trigger bot messages. It also does two 500-row log scans and a blocking `1.5s` sleep per unknown `/start`, i.e. a cheap DoS. | `api/telegram/webhook/route.ts:121-126, 413-420` | Claude |
| **P1-3** | **Rate limiting is per-instance, so it barely limits on serverless.** Counters live in an in-memory Map; on Vercel each warm Lambda has its own, so the real budget is limit × instances — for login PIN-guessing, lead spam, unlock, click routing. | `rate-limit.ts:14-16` | Claude |
| **P1-4** | **Lost visit records under concurrency.** `recordVisit` reads the day/page row, appends, writes back with no lock — two simultaneous visitors clobber each other, silently undercounting visits (and conversion rate, CPL, the AI analyst). | `storage.ts:2208-2221` | Claude |
| **P1-5** | **Round-robin fairness & counters race.** Concurrent leads/clicks read the same settings, both pick the **same** salesperson, and lost `totalLeadsRouted`/`lastAssignedIndex` increments compound the mis-distribution (the weighting derives from those counters). | `storage.ts:1845,1061,2040`, `round-robin.ts:255,311` | Claude |
| **P1-6** | **Wrong price shown to visitors.** `/smart-city-tea-cafe/app` renders the hardcoded `$499` in the total card (`SmartCityAppView.tsx:647` uses `GENERAL.earlyBirdPrice` instead of `effEarlyBirdPrice`), plus the button/countdown/save strings bake in `$499`/`$51`, even when the CMS price is `$550`. | `SmartCityAppView.tsx:24,42,62,647` | Claude |
| **P1-7** | **No CI/CD.** There is no `.github/workflows`, so `lint`, `typecheck`, `test`, `vault:check`, `build` never run automatically. Every regression reaches `main` unchecked. | (missing) | Claude |
| **P1-8** | **The whole remote data layer is untested.** `supabase-store.ts` (783 lines — the entire Supabase persistence path) has no test; all 45 API routes and all ~114 components have none. A mapping/race bug there corrupts saved pages/leads silently. | `supabase-store.ts`, `api/**`, components | Claude |

**Corrective actions (P1):**
- P1-1: gate destructive/owner-only actions (password, bot token, backups/restore, settings) on an **owner** role, not the domain; confirm Supabase sign-ups are closed.
- P1-2: require the webhook secret unconditionally once a bot token exists (or auto-secure on first token save); add rate limiting; replace the blocking sleep with a bounded, non-holding retry.
- P1-3: back the limiter for abusable endpoints with a shared store (Supabase CAS marker or Upstash/Redis), or use Vercel's platform rate limiting/WAF.
- P1-4 / P1-5: replace whole-row read-modify-write with append-only sub-rows or an atomic CAS/increment (the pattern `supabaseCasMarker` already exists and is used by the Telegram lease).
- P1-6: use `effEarlyBirdPrice`/`effRegularPrice` everywhere; interpolate the button/countdown/save strings. (The hero chip already does this correctly — copy it.) Needs owner confirmation of the real price. → [[Smart City Tea and Cafe Vietnam 2026]]
- P1-7: add a GitHub Actions workflow on push/PR: `npm ci` → lint → typecheck → test → `vault:check` → build. Add Dependabot / `npm audit`.
- P1-8: start with contract tests for `supabase-store.ts` (snake↔camel mapping) and route-level tests for `auth/login`, `telegram/webhook`, `leads`, `round-robin/*`.

### P2 — Medium: more concurrency, analytics integrity, hardening, UX

| ID | Finding | Where |
|----|---------|-------|
| **P2-1** | Routing-log entries lost under concurrency (read-prepend-write of the 500-row array) — hurts click attribution & audit. | `supabase-store.ts:741-758` |
| **P2-2** | `strict_round_robin` is **not** actually sequential: it indexes a stored counter into the *filtered, variably-ordered* eligible pool, so it skips or repeats people. | `round-robin.ts:278-294` |
| **P2-3** | Lead status/notes lost updates; `recordStaffClick` daily-stats race (all read-modify-write). | `supabase-store.ts:357-380,390-413`, `storage.ts:2132-2153` |
| **P2-4** | Daily summary can send twice under concurrent triggers (cron + traffic) — non-atomic check-then-set; `supabaseCasMarker` exists but is not used here. | `lead-followup.ts:369-374` |
| **P2-5** | Concurrent `/api/round-robin/tick` can double-hand-over and double-alert a lead (non-atomic minute guard). | `lead-followup.ts:182-186,206-207` |
| **P2-6** | `track` POST rewrites the **entire** DB per event (pages + leads + 2×5000 event arrays) at up to 60/min; on serverless each instance writes its own `/tmp` copy that never reconciles. | `storage.ts:1572-1634` |
| **P2-7** | `track` page views are not deduplicated — `sendBeacon` retries / replay double-count, skewing conversion metrics. | `api/track/route.ts`, `storage.ts:1587-1607` |
| **P2-8** | Full-table lead scans on hot paths: `findLeadByTelegramUserId` (every inbound Telegram msg) and `findPreviousLeadOfCustomer` (every form submit) load all leads; leads GET has no pagination. Gets slower as leads grow. | `storage.ts:1140-1143,861-877`, `api/leads/route.ts` |
| **P2-9** | Round-robin click routing mutates rotation state on **GET**, so link prefetch / double navigation advances rotation and writes phantom log rows. | `api/round-robin/route.ts:116-127` |
| **P2-10** | Stored XSS surface: admin `customBodyScript` is rendered as raw HTML (and `customHeadScript` only strips `<script>`, bypassable). Combined with P1-1, any domain admin can inject script into every public page. Treat custom scripts as owner-only + sanitize + consider a CSP. | `LandingPageTracking.tsx:515,523` |
| **P2-11** | Light-mode forces black text via `selection:bg-amber-400` on the two public views and the login page (admin was fixed 2026-09-24). | `MainSalesView.tsx:47`, `DynamicLandingPageView.tsx:1258`, `app/admin/login/page.tsx:48` |
| **P2-12** | Legacy `PageEditor` defaults new pages to **published** and pre-fills an **invented testimonial**, example FAQ, and placeholder price/seats/deadlines — violates the no-invented-facts rule; can go live. (The newer builder flow is already correct: draft + empty.) | `PageEditor.tsx:274,286-295,356,369-374` |
| **P2-13** | Customer name is put into the internal `form_submit` tracking event — PII that tracking doesn't need. (The GA event is already clean.) | `LeadForm.tsx:95-98` |
| **P2-14** | Cron endpoints are public when `CRON_SECRET` is unset (`daily-summary` skips its check; `tick` has none) → forced AI runs, backups, manager messages. | `api/round-robin/daily-summary/route.ts:20-23`, `api/round-robin/tick` |
| **P2-15** | PostgREST filter-injection footgun: the admin lead `search` term is interpolated unescaped into a `.or()` string. Limited (admin-only, service role), but should be escaped. | `supabase-store.ts:277-278` |
| **P2-16** | Rate limiter trusts client-supplied IP headers (`cf-connecting-ip`/`x-real-ip`) before XFF; if the trusted header is ever absent, buckets can be spoofed or all clients collapse into one. Trust only the header your real proxy sets. | `rate-limit.ts:63-72` |
| **P2-17** | `AuthModal` has no focus trap, no Escape-to-close, no `role="dialog"`/`aria-modal`, no focus restore — keyboard/screen-reader users tab out to the page behind. | `AuthModal.tsx` |

### P3 — Low / cleanup

| ID | Finding | Where |
|----|---------|-------|
| **P3-1** | Per-page `leadsCount` isn't persisted on Supabase (mutates a detached row) — confirms the known [[Open Tasks]] item. | `storage.ts:920` |
| **P3-2** | `maybeRunDailyAi` sets the day-marker **before** the run, so a transient AI failure blocks retry that day (unlike the daily summary, which reverts). | `ai-store.ts:112-124` |
| **P3-3** | `round-robin/logs` `limit` is unvalidated (`limit=1000000` or `NaN`). Admin-only. | `api/round-robin/logs/route.ts:12` |
| **P3-4** | `campaigns/conversions` / `campaigns` POST don't validate the body shape before persisting. Admin-only. | `api/campaigns/conversions/route.ts:33-34` |
| **P3-5** | Duplicate/orphaned scripts: `sync-content-packs.mjs` (wired in) vs `sync-content-packs.ts` (richer, unused); `verify-supabase.mjs` not referenced. Consolidate. | `scripts/` |
| **P3-6** | Lint warnings: 12× `<img>` → `next/image`; unused `readdir` (`backups.ts:14`), unused `formattedDeadline` (`SmartCityLandingPageView.tsx:375`). | various |
| **P3-7** | Khmer spelling `ៃ`→`ៀ`/`ែ` in the Smart City copy (known; needs native review first). | `smart-city-content.ts`, `content/pages/*.json` |
| **P3-8** | Dual-store drift risk (Supabase vs `data/db.json` fallback) — add a shared contract test; add a vitest coverage floor once CI exists. | `storage.ts`, `supabase-store.ts` |

## Recommended sequence

1. **P0** — owner rotates token + password and closes signups; Claude removes the committed secrets, makes `SESSION_SECRET` required, drops the default hash and legacy SHA-256, runs the RLS lockdown. (Security emergency; small, well-scoped code changes.)
2. **P1-7 + P1-8 (start)** — stand up CI and the first data-layer/route tests, so every later fix is guarded.
3. **P1-1, P1-2, P1-3** — close the authorization, webhook, and rate-limit holes.
4. **P1-4, P1-5, P2-1..P2-9** — the concurrency/analytics-integrity cluster, best done together behind an atomic-marker/append-only helper. Highest data-correctness payoff.
5. **P1-6, P2-11..P2-13** — the visitor-facing correctness/privacy fixes (quick wins).
6. **P2 remainder, then P3.**

## What was checked and is fine (no action)

- Type check clean; **334/334 tests pass**; lint 0 errors; TS strict; `next build` does **not** ignore type/lint errors; `.env` ignored, only `.env.example` tracked with placeholders; lockfile committed.
- File uploads and backups: server-generated names, MIME-based extensions, strict `[name]` regexes, SVG excluded, size/type validated, restore is confirm-gated. No path traversal.
- SSRF: `safe-url.ts`/`video-embed.ts` allowlist protocols and provider hosts; no fetch of arbitrary user URLs.
- Secrets to the browser: only the anon key client-side; service-role key server-only; `getPublicSettings` strips the token/hash/emails; settings GET masks the token.
- Session/staff/unlock cookies are httpOnly + sameSite=lax + secure(prod); login is timing-safe with generic errors.
- `TelegramChatView` and `LiveChatInboxClient` polling: correct AbortController/timer cleanup, visibility pause/resume, no leaks. `use-browser-state.ts` uses `useSyncExternalStore` correctly.

## Related

- [[Open Tasks]] (several items here supersede the "Code problems found" and Security sections)
- [[Admin and Security]], [[AI Keys]], [[Round Robin]], [[Telegram Sales Process]]
- [[Rotate the Telegram Bot Token]], [[Change the Admin Password]], [[Run the RLS Lockdown Migration]]
