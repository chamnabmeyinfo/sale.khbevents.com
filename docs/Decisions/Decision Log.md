---
type: decision-log
tags: [decision, log]
updated: 2026-09-24
source:
  - git log (commits befb78b to 6d1e831)
  - vercel.json
  - scripts/vercel-ignore-build.sh
  - src/lib/round-robin.ts
  - src/lib/popup-ads.ts
  - src/lib/i18n/index.ts
  - src/lib/supabase-store.ts
  - src/lib/content-pack.ts
  - src/app/api/round-robin/route.ts
  - content/pages/smart-city-tea-cafe.json
  - README.md
---

# Decision Log

What we decided, when, and why. Newest first. One entry per decision.

**How to add one:** copy the Decision template from the Templates folder, or add a short entry at the top of this list. Keep the same fields. Link the feature note it affects.

**Who decides:** "Owner" means the business owner decided it. "Claude with owner approval" means Claude proposed it during a working session and the owner accepted the result.

---

## 2026-09-26 — Packs can replace one builder section by id

- **Decision:** A content pack can carry `replaceBuilderBlocks` to swap single builder sections (matched by id), instead of replacing the whole builder page. First use: the Vietnam page's "What's included" became "Included & not included".
- **Why:** Builder pages are edited in the admin; a whole-page pack would wipe the owner's edits (deadlines, seats, order). Swapping one section keeps them.
- **Who decided:** Claude with owner approval.
- **Affects:** [[Content Packs]], [[Smart City Tea and Cafe Vietnam 2026]].

## 2026-09-26 — Page map suggests an order; it never reorders on its own

- **Decision:** The builder's Page map advises on section order along a buyer's journey (Attention → Why/Details → Price → Sign up → Questions → Terms → Final push). It only changes the order when the owner presses **Use this order**, which can be undone. Sections in the same step keep the owner's order.
- **Why:** Order affects sales, but some pages have good reasons to differ (for example a programme placed after the price). Advice plus one click keeps the owner in control.
- **Who decided:** Claude with owner approval.
- **Affects:** [[Page Builder]].

## 2026-09-25 — Campaigns: measure and analyse, not buy ads; visits stored as daily JSON rows; AI analyst on Claude

- **Decision:** The portal does not create or pay for ads. It measures them:
  - tracked campaign links;
  - durable visit records;
  - server-side conversions to Meta and TikTok;
  - a campaign report.
- **AI analyst:** a Claude-based analyst reads the report and proposes the plan, every evening and on demand.
- **Visit storage:** visit records are stored as one JSON row per page per day in `system_settings`, kept 120 days, instead of a new table.
- **Why:**
  - Ads Manager already does ad buying well. The gap was knowing which ad brings paying customers.
  - The old event log was a temporary per-server file, so its numbers were partial.
  - JSON rows need no database migration.
- **Details:**
  - Only aggregated numbers go to the AI; personal data goes to the ad platforms only as hashes.
  - All keys are Vercel environment variables.
- **Decided by:** Owner (goal); Claude with owner approval (approach).
- **Affects:** [[Campaigns and AI Analyst]], [[Tracking and Analytics]].

---

## 2026-09-25 — The print agenda picks its sections by the kind of page

- **Decision:** Print has two modes, a smart Agenda (default) and the Entire page. The agenda reads the page as a trip (day-by-day programme), an event (deadline or seats) or a product, and keeps only the practical sections: programme, places, what's included, how to join, who it's for and a few questions. Problems, long "why" lists, photos and most of the FAQ are left out.
- **Why:** The owner wants an agenda that is straight to the point for visitors to review, and the whole page when needed, with a real print design.
- **Decided by:** Owner (feature); Claude with owner approval (rules).
- **Affects:** [[Print Agenda]].

---

## 2026-09-25 — Printable agenda is generated from the live page

- **Decision:** `/<page>/print` builds an A4 agenda from the page's latest saved version on every visit, with a QR code back to the page. There is no separate PDF to maintain.
- **Why:** The owner wants staff and visitors to print the latest update; a generated sheet can never be out of date.
- **Decided by:** Owner (feature); Claude with owner approval (approach).
- **Affects:** [[Print Agenda]], [[Page Builder]].

---

## 2026-09-25 — Every page is edited in the drag-and-drop builder

- **Decision:** The Vietnam page moved to the builder. New pages are always builder pages. The old fixed layouts (B2B delegation, trade expo, concert, summit, custom) are no longer offered. A page still on one gets a "Move to drag-and-drop" button. The conversion only reuses the page's own text, price, deadlines and seats.
- **Why:** The owner wants one place to edit every page, not several page types.
- **Details:**
  - The live page is converted on the next production build through the content pack flag `convertToBuilder`, with a backup of the page as it was.
  - Not carried over: the seat map, matchmaker tabs, stats strip, two-tier price cards and sticky bars.
- **Decided by:** Owner.
- **Affects:** [[Page Builder]], [[Landing Pages CMS]], [[Content Packs]], [[Smart City Tea and Cafe Vietnam 2026]].

---

## 2026-09-25 — Demo data is tagged and excluded everywhere, and never refilled from the sample file

- **Decision:** Simulation Studio leads and clicks are tagged demo when created; one rule (`isDemoLead`) marks them and the shipped samples; every report, count and automation uses real leads only; the CRM shows real customers first. An empty live database is shown as empty.
- **Why:** The owner wants to start fresh with real data only. Before this, clearing the live data would have brought the sample leads back from the fallback file, and test runs counted in fairness and statistics.
- **Decided by:** Owner.
- **Affects:** [[Admin and Security]], [[Round Robin]], [[Leads CRM]].

---

## 2026-09-25 — Lead hand-over runs on site traffic, not a paid cron

- **Decision:** The check that passes unanswered form leads to a colleague runs after ordinary requests (at most once a minute) and on a public tick address, instead of a Vercel cron job.
- **Why:** On the Hobby plan a Vercel cron may run only once a day, and a cron that runs more often makes the deployment fail. Traffic-driven checks cost nothing and are on time whenever visitors or staff are active; a free external scheduler can call the tick address for exact timing.
- **Details:** The tick address only moves leads that are already overdue, so calling it early or often does nothing harmful. Default is Off; the owner chooses the minutes.
- **Decided by:** Claude with owner approval (owner chose the follow-up and hand-over features).
- **Affects:** [[Round Robin]].

---

## 2026-09-25 — Popup analytics are stored as daily counts, not raw events

- **Decision:** Each popup event adds to a small per-day record on the popup's stats row (by page, source, device, browser, language, hour, timing, leads), kept for 120 days.
- **Why:** On Vercel the individual tracking events are not saved anywhere permanent; only the stats row in Supabase is. Daily counts need no new table or migration, stay small, and let every chart follow the date filter.
- **Details:** Counts are approximate under heavy simultaneous traffic (the row is read and rewritten). No names or phone numbers are stored.
- **Decided by:** Claude with owner approval (owner asked for detailed popup analytics).
- **Affects:** [[Ads and Popups]], [[Tracking and Analytics]].

---

## 2026-09-24 — Smart popup timing uses plain rules, not a trained model

- **Decision:** The "Smart timing" trigger adds up interest points (reading time, scroll, price or form seen, re-reading, several pages, return visit, leaving) in the visitor's browser and shows the popup at a threshold set by the sensitivity.
- **Why:** The site's traffic is too small to train a model, and rules can be explained and tuned. Nothing personal leaves the browser; only the top reasons are counted per popup.
- **Details:** Never while typing in the form or after the form was sent. Reasons per view and click appear in the admin list.
- **Decided by:** Claude with owner approval (owner asked for a feature that decides the popup moment automatically).
- **Affects:** [[Ads and Popups]].

---

## 2026-09-24 — One page per trip: the Korea page was rebuilt at its existing link

- **Decision:** The Korea trip keeps `/korea-b2b-trip-2026`. Its content was replaced with a drag and drop builder page written only from the owner's caption, instead of adding a second page for the same trip.
- **Why:** The old page was live with invented testimonials, seat counts and partners, and with Vietnam text from its template. Two pages for one trip would split visitors and keep the invented content online. Keeping the link keeps ads and posts working.
- **Details:** The main button opens the trip contact's Telegram directly; the form still sends leads to the CRM. Shipped as a content pack.
- **Decided by:** Owner (chose "fix the existing page").
- **Affects:** [[Korea Sourcing Trip Seoul 2026]], [[Page Builder]].

---

## 2026-09-24 — Renaming a library photo changes its display name, not its file

- **Decision:** In the Photo Library, rename sets a name shown in the admin. The stored file and its public address never change.
- **Why:** Pages and popups save the photo's address. Renaming the file would break every page that shows it.
- **Details:** Names are kept in the `media_library` row of `system_settings`. Deleting a photo that is still used asks first and names the pages and popups.
- **Decided by:** Claude with owner approval.
- **Affects:** [[Image Uploads]].

---

## 2026-09-24 — Drag and drop pages store their sections on the page itself

- **Decision:** A page made in the drag and drop builder has `template: builder` and a `builder` document: one Offer (price, stock, deadline, button action), a brand colour, and the list of sections. Every section reads its facts from the Offer. In Supabase the document is stored in the page's `form_config._extra`.
- **Why:** No database migration is needed, and prices, dates and stock are typed once, so sections cannot disagree. The classic Smart City page is untouched.
- **Decided by:** Claude with owner approval ("follow your recommendation").
- **Affects:** [[Page Builder]], [[Landing Page Builder Roadmap]].

## 2026-09-24 — Build our own landing page system that sells anything

- **Decision:** Keep and grow our own landing page system instead of moving to an off-the-shelf builder. It must be easy to use and able to sell anything: seats, products, services, digital products, or leads by conversation.
- **Why:** Off-the-shelf builders lack the parts that fit our market: Telegram round robin, Khmer and English everywhere, and the leads CRM. Building around an "Offer" (what is sold, its price and its action) lets one system serve every kind of product.
- **Decided by:** Owner. The plan was proposed by Claude.
- **Affects:** [[Landing Page Builder Roadmap]], [[Landing Pages CMS]].

## 2026-09-24 — No secrets in the vault

- **Decision:** The vault never holds passwords, bot tokens, chat IDs, database keys, environment variable values or customer contact data. Notes say where a secret lives instead, for example "Vercel → Project → Settings → Environment Variables" or "Admin → Settings & Security → Instant Telegram Alerts".
- **Why:** The vault is stored in git, and git keeps deleted text forever. The Telegram bot token already leaked this way once (it was committed in `data/db.json`).
- **How it is checked:** `npm run vault:check` (`scripts/check-vault.mjs`) looks for broken links and secret-looking text.
- **Decided by:** Claude with owner approval, when the vault was set up.
- **Affects:** [[How to Use This Vault]], [[Admin and Security]], [[Rotate the Telegram Bot Token]].

## 2026-09-24 — The vault lives in `docs/` inside the repo, and note-only pushes skip the build

- **Decision:** The Obsidian vault is the `docs` folder of the website repository. A push that changes only `docs/` or `CLAUDE.md` does not rebuild the live site.
- **Why:** The team and Claude share one source of memory, synced with git. Saving a note should never redeploy the website.
- **How it works:** `vercel.json` runs `scripts/vercel-ignore-build.sh` before each Vercel build. It skips the build only when every changed file is a note. When in doubt, it builds.
- **Decided by:** Claude with owner approval.
- **Affects:** [[How to Use This Vault]], [[Deploy to Production]].

## 2026-09-24 — One language option for the whole portal, with English as the fallback

- **Decision:** The EN / ខ្មែរ toggle switches the whole admin and both sign-in pages, not only the landing pages. Any Khmer text that is missing shows in English.
- **Why:** Sales staff who read Khmer more easily can use every admin screen. A missing Khmer string never shows a blank or a code key.
- **Details:** Names, numbers, slugs, URLs, message templates and page content are data and are not translated. The choice is stored per browser. Commit `6d1e831`; the fallback is in `src/lib/i18n/index.ts`.
- **Follow-up:** A native Khmer speaker should review the admin wording. See [[Open Tasks]].
- **Decided by:** Claude with owner approval.
- **Affects:** [[Languages]].

## 2026-09-24 — Popups: at most one per page view, a cooldown, and hidden after a lead

- **Decision:** A public page shows at most one popup per view. A global cooldown stops a second popup from following the first. A popup set to "hide after lead" is skipped for visitors who already sent the form.
- **Why:** Popups should help sell, not annoy. A visitor who already registered does not need another offer.
- **Details:** In the repo at the time of writing, the default global cooldown is 12 hours and "hide after lead" is on by default (`src/lib/popup-ads.ts`). The admin setting is the source of truth. Starter templates contain only truthful copy. Commit `f203da0`.
- **Decided by:** Claude with owner approval.
- **Affects:** [[Ads and Popups]], [[Create a Popup]].

## 2026-09-24 — New settings are stored as JSON rows in `system_settings` (no SQL migration)

- **Decision:** New kinds of saved data are stored as JSON rows in the existing `system_settings` table in Supabase, not in new tables.
- **Why:** No database migration is needed, so a feature ships with a normal push. It follows the pattern already used for round robin settings and logs (commit `849413f`).
- **Used for:** deleted-page markers (`befb78b`), content pack markers and backups (`5a69976`), and popup ads with their counters (`f203da0`). See `src/lib/supabase-store.ts`.
- **Decided by:** Claude with owner approval.
- **Affects:** [[Ads and Popups]], [[Round Robin]], [[Content Packs]], [[System Map]].

## 2026-09-23 — Remember returning visitors for a set time (sticky salesperson)

- **Decision:** A visitor stays with the salesperson they were first sent to. A cookie keeps the same browser with the same person. A new lead whose phone number or email matches an earlier lead goes to that lead's salesperson, from any device.
- **Why:** A customer should not be passed between salespeople or get two replies. The owner can set how long the system remembers a visitor.
- **Details:** Setting "Remember a visitor for" in Admin → Staff Round Robin: Off, 1, 2, 3 or 6 months. In the repo at the time of writing the default is 1 month (`src/lib/round-robin.ts`). Each lead records why it went where it did: rotation, returning visitor or returning customer. Commits `6994887`, `bd8a2dd`.
- **Decided by:** Claude with owner approval.
- **Affects:** [[Round Robin]], [[Leads CRM]].

## 2026-09-23 — "Fair Weighted Share" is the default routing algorithm

- **Decision:** Each new lead goes to the active salesperson who is furthest below their percentage share. The old random lottery stays available as "Random Weighted Lottery". "Strict Round Robin" is also still available.
- **Why:** Shares are met exactly, and nobody gets several leads in a row while a colleague waits.
- **Also decided:** Routing only picks staff who can take the lead: a Telegram username for clicks, a Chat ID for form leads. The default staff list is empty, because sample accounts are not real people. A readiness check in Admin → Staff Round Robin shows what is missing. Commit `6994887`.
- **Decided by:** Claude with owner approval.
- **Affects:** [[Round Robin]], [[Add a Sales Staff Member]].

## 2026-09-23 — The visitor goes straight to a salesperson; the Telegram bot is mainly for alerts

- **Decision:** A "Chat on Telegram" click opens a chat with the chosen salesperson directly. The company bot sends alerts to staff and managers. It is not a middle step for the visitor.
- **Why:** The visitor reaches a real person at once. Alerts now run after the visitor is redirected (Next.js `after()`), so a slow alert never delays the visitor and is not lost when the server function stops.
- **Details:** The direct redirect started in `ce00583` (2026-09-22). If no salesperson can take a click, the visitor goes to the configured contact account, or to the bot as a last resort (`src/app/api/round-robin/route.ts`). Commit `6994887` made alerts run after the response. Commit `ca64264` fixed the concierge link that showed raw JSON and now prefills the first message in Telegram.
- **Decided by:** Claude with owner approval.
- **Affects:** [[Round Robin]], [[Telegram Reply Templates]].

## 2026-09-23 — Page copy lives in git as content packs, applied by the production build

- **Decision:** Landing page copy is kept in `content/pages/<slug>.json`. After a successful production build on Vercel, each pack is applied to the CMS once per file version. The page is backed up first. The Import JSON button in Admin → Landing Pages CMS applies a pack on demand.
- **Why:** Production reads its pages from Supabase, so copy written in code would never reach the live page. A pack makes copy reviewable in git and ships with a normal push.
- **Rules:** A pack holds only the fields it owns. Everything it leaves out, such as deadlines, seat counts and phone numbers, stays as the admin set it. Preview builds never write. The step never fails the build. Commits `e99ef90`, `5a69976`.
- **Alternatives:** Asking the owner to type copy into the admin by hand.
- **Decided by:** Claude with owner approval.
- **Affects:** [[Content Packs]], [[Landing Pages CMS]], [[Copy Rules]].

## 2026-09-23 — Registration and early-bird deadlines are set by the owner only

- **Decision:** The owner sets registration and early-bird deadlines in the admin personally. Code and content packs never overwrite them.
- **Why:** Time pressure only works when it is true. A wrong or passed deadline on the page damages every other claim.
- **Decided by:** Owner.
- **Affects:** [[Smart City Tea and Cafe Vietnam 2026]], [[Content Packs]], [[Landing Pages CMS]].

## 2026-09-23 — Hide placeholder testimonials until real ones exist

- **Decision:** The testimonials on the Smart City page were placeholders, so they are hidden. No invented testimonials are ever added. The redesign also stopped showing Speakers, Artists and Booths sections built from invented defaults; they show only when the CMS holds real entries.
- **Why:** Fake proof destroys trust when a buyer notices it. The owner will provide real testimonials and outcome photos later.
- **Details:** Commits `e99ef90`, `7291cbd`.
- **Decided by:** Owner.
- **Affects:** [[Smart City Tea and Cafe Vietnam 2026]], [[Copy Rules]], [[Open Tasks]].

## 2026-09-23 — The Smart City seat sells for $550

- **Decision:** The selling price of a seat on Smart City, Tea & Cafe Vietnam 2026 is $550. On the page, the price on the published package card always wins.
- **Why:** This is the real price, confirmed by the owner. The admin is the source of truth if it changes.
- **Details:** Commit `e99ef90`.
- **Decided by:** Owner.
- **Affects:** [[Smart City Tea and Cafe Vietnam 2026]], [[Landing Pages CMS]].

## 2026-09-23 — Code changes go straight to `main`, verified locally first

- **Decision:** Code changes are pushed directly to the `main` branch, without pull requests. A push to `main` deploys to production on Vercel automatically. Every change is checked locally first (typecheck, lint, tests, build, browser check), and the live site is checked after.
- **Why:** Owner process rule. It keeps releases fast, with safety coming from the local checks.
- **Evidence:** The first four changes of the session were merged as pull requests #1 to #4. From commit `7291cbd` on, commits land directly on `main`.
- **Decided by:** Owner.
- **Affects:** [[Deploy to Production]], [[Verify Changes Locally]].

## 2026-09-23 — Server functions run in Singapore (`sin1`)

- **Decision:** Vercel runs the site's server functions in the Singapore region, set in `vercel.json`. Public pages cache their Supabase reads for 60 seconds, and admin saves clear the cache.
- **Why:** Public pages made 3 to 4 database round trips per page from Vercel's US East region. Singapore is next to the Supabase project and to Cambodian visitors.
- **Details:** Commit `93d0062`.
- **Decided by:** Claude with owner approval.
- **Affects:** [[System Map]], [[Deploy to Production]].

## 2026-09-23 — Uploaded images go to Supabase Storage

- **Decision:** Photos uploaded in the admin are stored in a public Supabase Storage bucket named `page-images`. The browser shrinks photos before upload.
- **Why:** Hero images stay light and under Vercel's request size limit. In local development without Supabase, uploads are saved in `public/uploads`.
- **Details:** Commits `b0cdd5a`, `1a24644`.
- **Decided by:** Claude with owner approval.
- **Affects:** [[Image Uploads]].

## To confirm

- The exact day the owner stated the "push straight to main" rule. The date above comes from the first commit pushed without a pull request.
