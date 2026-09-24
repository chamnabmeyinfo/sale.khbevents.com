---
type: history
tags: [project, history]
updated: 2026-09-24
period: 2026-09-21 to 2026-09-24
source:
  - git log (all commits in the repository clone, babe6d4 to 6d1e831)
  - README.md
  - FEATURE_BLUEPRINT.md
---

# Project History

What was built on the sales portal, in order. Each line ends with the short commit hash(es), so a developer can look up the details with `git show <hash>`. For why things were done, see [[Decision Log]]. For how the parts fit together, see [[System Map]].

> The earliest commit in the repository clone used for this note is dated 2026-09-21. The clone is shallow, so older history may exist on GitHub.

## 2026-09-21 — Foundation, admin and the first trip page

**Database and sign-in**
- Supabase connection settings documented and a connection check script added. `babe6d4`, `84308e5`
- Database writes made safe on serverless hosting, where the file system is read-only. `2f2f7f9`
- Sign-in with Google, email and password, and phone code. Owner and super-admin roles configured. Instant sign-in after sign-up. `fd1e468`, `b17ae9e`, `4bcfed9`

**Admin look and feel**
- Admin redesigned with a left menu and feature tabs. `f645eb1`
- Light mode, dark mode and "follow system" theme. `012c594`, `137c64b`

**Smart City landing page**
- The Smart City, Tea & Cafe landing page rebuilt from the old project, in English and Khmer, with the lead form. `e7056c3`, `08f1005`
- Smart City lead counters and a test record updated in `data/db.json`. `61b7359`
- See [[Smart City Tea and Cafe Vietnam 2026]].

**Landing pages CMS**
- Edit every section of a page, with quotas and on/off toggles. `8aca139`
- Page templates per business type. `05c9284`
- Admin changes now reach the public page and are saved in Supabase. `baa0ceb`
- Per-page settings: routing, webhooks, password gate, payments. `38313d1`
- See [[Landing Pages CMS]].

**Languages, tracking, CRM, round robin**
- Language switcher in the admin and a Khmer translations manager. `7fef4ce`
- Tracking per landing page. `3b9903b`
- CRM tag filters, badges and CSV export. `c01e8cc`
- First weighted round robin for five staff, with Telegram check and audit log. `37c5ada`

## 2026-09-22 — Telegram routing, a second trip page, page builder

**Round robin and Telegram alerts**
- Lead simulation studio and test dispatch. `b30e609`, `3fe08a7`
- Telegram alerts in Khmer, with WhatsApp and CRM links, a message template builder, and a per-staff alert language. `a40cac7`, `79ac947`, `7185100`, `26abdcd`
- Add and remove staff with automatic weight rebalancing. Round robin settings and logs saved in Supabase. `2383cff`, `849413f`
- Telegram buttons routed through the company bot; API path fixed. `13544fc`, `e32ada3`
- Bot token configured in the settings. These commits put bot tokens into `data/db.json` in git history. `ccaf05d`, `396b6d1`. The current token was later also copied into `FEATURE_BLUEPRINT.md` and the in-admin guide. `2bef0d9`, `a57c86f`. See [[Rotate the Telegram Bot Token]].
- The Telegram button now sends the visitor straight to the chosen salesperson, with bot alerts to staff. `ce00583`
- See [[Round Robin]].

**Leads and visitors**
- Deleting a lead fixed. `b2847a4`
- Visitor country and city captured on leads. `9e6befa`
- See [[Leads CRM]] and [[Tracking and Analytics]].

**Pages**
- Korea B2B Business Delegation 2026 landing page added at `/korea-b2b-trip-2026`. `03cff73`
- Local pages synced to Supabase automatically. `0627221`
- Section visibility fixes across landing, app and opt-in views. `af0d854`, `e17b8b4`, `191a6ee`, `ecddb6a`
- Standalone gallery, speakers, artists and expo booth sections, with built-in fallback content. `8d99d90`. The invented defaults for speakers, artists and booths were removed on 2026-09-23 (`7291cbd`).
- App view button removed from the page header and phone menu. `84dc2fe`
- Drag-and-drop section builder. `d8615f5`, `2d0997d`
- Flags in the language switcher. `e47af06`, `9923458`

**Guides**
- `FEATURE_BLUEPRINT.md` written, then refocused as an operator guide; in-admin guide at `/admin/guide`. `0b3306c`, `2bef0d9`, `a57c86f`

## 2026-09-23 — Security, speed, and a page that sells (session with Claude)

- Security hardening and bug fixes: signed admin sessions, admin-only APIs, secrets kept off the browser, server-checked page passcodes, rate limits, and fixes for page editor data loss, duplicate slugs, WhatsApp links, CSV export, routing, alerts and mobile layout. Pull request #1. `befb78b`. See [[Admin and Security]].
- Faster public pages: database reads cached for 60 seconds, server functions moved to Singapore (`sin1`). Pull request #2. `93d0062`
- Smart City page: invisible buttons fixed, copy rewritten in English and Khmer, price set to $550, placeholder testimonials hidden, "Import JSON" for content packs, and the landing-page copywriting skill. Pull request #3. `e99ef90`. See [[Copy Rules]].
- Content packs applied automatically by the production build. Pull request #4. `5a69976`. See [[Content Packs]].
- Conversion-focused redesign of the Smart City page: new hero with a reservation-status card, main button in the first phone screen, one urgency strip, shorter page in buying order, coordinator card beside the form, no placeholder sections. `7291cbd`
- Hero slideshow: upload photos, drag to arrange, choose the cover. `b0cdd5a`
- An Upload button on every image field in the page editor. `1a24644`. See [[Image Uploads]].
- Round robin audit: redirect first and alerts after, fair weighted share, only staff who can take the lead, sticky cookie, empty default staff list with a readiness check. `6994887`
- "Remember a visitor for" setting and returning-customer matching by phone or email. `bd8a2dd`
- Concierge Telegram link fixed: it showed raw JSON; the message is now prefilled in Telegram. `ca64264`

## 2026-09-24 — Popups, full Khmer admin, and this vault

- Popup ads system in Admin → Ads & Popups. `f203da0`. See [[Ads and Popups]].
- English / Khmer option for the whole admin and the sign-in pages. `6d1e831`. See [[Languages]].
- This Obsidian vault in `docs/`, the `npm run vault:check` script, and the rule that note-only pushes skip the Vercel build. The same commit removed the bot token and manager chat ID from the in-admin guide and `FEATURE_BLUEPRINT.md`. See [[How to Use This Vault]].
- Session summary: [[2026-09-24 Portal build session]].

## Where we are now

The portal sells the Smart City, Tea & Cafe Vietnam 2026 trip with a redesigned, bilingual landing page whose copy lives in git. Once real staff are in the staff list, new leads and Telegram clicks are shared fairly among them, and a returning visitor stays with the same salesperson. The team can run popups and use the whole admin in Khmer. Three security jobs are still open: rotate the Telegram bot token, change the admin password on production, and run the RLS lockdown migration. The owner will supply real testimonials and outcome photos, and a native speaker should review the Khmer admin wording. See [[Open Tasks]].
