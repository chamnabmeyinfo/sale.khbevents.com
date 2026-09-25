# KHB EVENTS - Landing Page System & CRM Portal

> **Official Sales & Landing Portal for KHB EVENTS Cambodia (`sale.khbevents.com`)**

A high-performance, conversion-optimized Landing Page System and Lead Management CRM built for **KHB EVENTS**, Cambodia's premier event management, 4K LED staging, concert production, and exhibition agency.

> 📖 **Architecture & Engineering Blueprint:**  
> For complete system architecture, dual-tier persistence sync, Telegram bot workflows, round-robin rules, and SOPs for future updates, read [FEATURE_BLUEPRINT.md](FEATURE_BLUEPRINT.md).

---

## 🌟 Key Highlights & Features

### 1. High-Converting Public Sales Portal (`/`)
- **Luxury KHB Branding:** Styled in Emerald Green, Champagne Gold, and deep obsidian black matching KHB Events' brand aesthetics.
- **Interactive Event Budget Calculator:** Visitors select event scale, audience count, and technical equipment (4K LED wall, line-array audio, moving lights, 3D stage build) to receive an instant production guideline and lock in custom estimates.
- **Visual Production Portfolio:** Showcase of real past mega-events (Diamond Island / Koh Pich, Koh Norea, K Mall, etc.).
- **Turnkey Production Pillar Grid:** Corporate galas, concerts/festivals, trade delegations, booth fabrication, 4K LED screens, and ticketing.
- **Instant Communication:** Floating WhatsApp and Telegram buttons with pre-filled message triggers.
- **Conversion-Optimized Lead Form:** Real-time client inquiries with automatic marketing UTM attribution tracking (`utm_source`, `utm_medium`, `utm_campaign`).

### 2. Dynamic Campaign Landing Pages (`/[slug]`)
- Host unlimited specialized landing pages under `sale.khbevents.com/[slug]`.
- Pre-seeded high-impact campaigns:
  - `/smart-city-tea-cafe`: Flagship Vietnam Smart City, Tea & Cafe B2B Business Delegation 2026.
- **Dedicated Business Type Templates:** Unique landing page templates for B2B Delegations, Trade Expos, Concerts/Festivals, Corporate Summits, and Custom Campaigns.
- Dynamic Countdown Timer for events with registration deadlines.
- Interactive Package Tier Cards with "Select Pass" triggers that prefill the inquiry form.
- Dedicated FAQ accordion and gallery.

### 3. Integrated Admin CMS & Leads CRM (`/admin`)
- **Overview Dashboard:** Total inquiries, new leads count, active pages, total tracked views, and overall conversion rate %.
- **Visual Landing Page Builder & CMS:**
  - Create, edit, clone, or archive landing pages in seconds.
  - Customize Hero banner, CTA text, venue info, highlights, package tiers, and FAQs.
  - Instant live preview and public link copy.
- **Leads & Inquiries CRM Pipeline:**
  - Manage lead status: `NEW` $\rightarrow$ `CONTACTED` $\rightarrow$ `PROPOSAL_SENT` $\rightarrow$ `NEGOTIATING` $\rightarrow$ `WON` $\rightarrow$ `LOST`.
  - Direct 1-click **WhatsApp Chat** and phone calls.
  - Detailed client view with special requests, custom parameters, and internal notes history.
  - **Export to CSV:** 1-Click CSV export for Excel and Google Sheets.
- **Settings & Real-Time Alerting:**
  - Company contact information (phone, WhatsApp number, Telegram, address).
  - Real-time **Telegram Webhook alerts** sent directly to the sales team's phone or group chat upon inquiry submission.
  - Admin credentials management.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router with Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **Data Persistence:** Portable, zero-dependency JSON database engine with atomic writes and schema validation (`data/db.json`).
- **Server Deployment:** Compatible with Node.js on cPanel Passenger, Docker, Vercel, or VPS.

---

## 🚀 Getting Started Locally

1. **Install Dependencies:**
   ```bash
   npm install --ignore-scripts
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

4. **Checks** (run before pushing):
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```

---

## 🔐 Admin Credentials

- **URL:** `http://localhost:3000/admin` (or `https://sale.khbevents.com/admin`)
- **Default Email:** `admin@khbevents.com`
- **Default Password:** `khbevents2026` — change it right after the first login (Admin Settings panel).
- Set a random `SESSION_SECRET` in production; see [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md).

---

## 🚀 Deployment (Vercel)

The live site runs on **Vercel** with **Supabase** as the database. Every push to `main` deploys automatically; pull requests get a preview deployment (protected by Vercel SSO).

Server functions run in Singapore (`sin1`, set in `vercel.json`) to sit next to the Supabase project and Cambodian visitors.

Environment variables on Vercel: `SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.

After deploying a change that touches security or the Telegram bot:
1. Run any new file in `supabase/migrations/` in the Supabase SQL editor.
2. In Admin → Settings, save the bot token and click **Register / secure bot webhook**.

`data/db.json` is only a local/seed database; on Vercel it is copied to `/tmp` and Supabase holds the real data.

## 📁 Deployment to cPanel (alternative)

See detailed instructions in [CPANEL_DEPLOYMENT.md](CPANEL_DEPLOYMENT.md).

## Content packs

Landing-page copy lives in git as a content pack, `content/pages/<slug>.json`, holding only the fields it owns (headline, sections, FAQ, form text, Khmer translations). Two things apply a pack to the CMS with the same rules (`src/lib/content-pack.ts`): nested settings merge key by key, lists replace whole, and identity fields are ignored.

- **Production build**: after `next build` succeeds, `npm run build` runs `scripts/sync-content-packs.mjs`, which applies each pack once per file version (a `content_pack:<slug>` marker in `system_settings` remembers the applied hash, and `content_pack_backup:<slug>` keeps the page as it was before). It only writes during a Vercel production build and never fails the build.
- **Admin → Pages → Import JSON**: applies a pack on demand.

A pack with `"convertToBuilder": true` moves an old fixed-layout page to the drag-and-drop builder, built from the page's own live text, price, deadlines and seats (`src/lib/classic-to-builder.ts`). The Smart City page was moved this way; every page is now edited in the builder.

## Popup ads

Promotional popups on the public landing pages are managed in **Admin → Ads & Popups** (`/admin/ads`): bilingual copy, an optional picture, four layouts (card, bottom sheet, banner, image first), targeting by page / device / language, a trigger (immediately, after N seconds, after scrolling, on exit intent), a per-visitor frequency, a schedule and a priority. At most one popup shows per page view; a global cooldown stops a second popup from following the first, and visitors who already sent the form are skipped.

- Rules live in `src/lib/popup-ads.ts` (pure, unit-tested); the popup itself is `src/components/common/PopupAds.tsx` with styles in `src/styles/popup-ads.css`.
- State is stored as a JSON row (`popup_ads`) in `system_settings`, counters in `popup_ad_stats`; no migration needed. Public pages read it through the 60 s cache.
- `?popup_preview=<id>` shows one popup at once, ignoring its rules and without counting; `?nopopup=1` hides all popups.
- Views, clicks and closes flow through `/api/track` as `popup_view`, `popup_click` and `popup_close`.

## Project vault (Obsidian)

`docs/` is an Obsidian vault with the business facts, sales playbook, feature notes, runbooks, open tasks and decision log. Open the `docs` folder as a vault in Obsidian; start at `docs/00 Start Here.md`, and see `docs/How to Use This Vault.md` for setup and syncing. Claude reads and updates it as described in `CLAUDE.md`.

- `npm run vault:check` checks that every `[[link]]` resolves and that no secret-looking text is in the notes.
- Pushes that change only `docs/` or `CLAUDE.md` skip the Vercel production build (`scripts/vercel-ignore-build.sh`, wired in `vercel.json`).
