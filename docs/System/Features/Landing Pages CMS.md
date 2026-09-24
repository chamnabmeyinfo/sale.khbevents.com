---
type: feature
tags: [system, feature, cms, landing-pages]
updated: 2026-09-24
admin_path: /admin/pages
admin_menu: Landing Pages CMS
source:
  - src/app/admin/pages
  - src/app/[slug]/page.tsx
  - src/app/api/pages
  - src/components/admin/PagesManagerClient.tsx
  - src/components/admin/PageEditor.tsx
  - src/components/admin/IsolatedSettingsEditor.tsx
  - src/components/admin/KhmerTranslationEditor.tsx
  - src/lib/storage.ts
  - src/lib/page-access.ts
  - src/lib/seat-price.ts
  - src/lib/types.ts
  - src/lib/i18n/dict/pages.ts
  - src/lib/i18n/dict/editor.ts
  - src/lib/i18n/dict/editor-extras.ts
  - content/pages/smart-city-tea-cafe.json
---

# Landing Pages CMS

> Live price, deadlines and seats left are set in the admin. The admin is the source of truth; this note explains the tool.

## What it does for sales

> A drag and drop builder for new sales pages now sits next to this editor: **New drag & drop page**. See [[Page Builder]].

Every trip or event gets its own page at `sale.khbevents.com/<slug>`. The page carries the offer: headline, price, seats left, programme, FAQ and a registration form. Sales can launch or change a page without a developer. Each page can have its own contacts, lead tags, passcode and ad pixels.

The page on sale right now is `/smart-city-tea-cafe`. See [[Smart City Tea and Cafe Vietnam 2026]]. How to write the words on a page: [[Copy Rules]].

## Where it is in the admin

**Admin → Landing Pages CMS** (`/admin/pages`).

| Element | What it does |
|---|---|
| Tabs: All Campaigns, Published (Live), Drafts, Corporate Events, Trade & Delegations | Filter the page list |
| **+ Create New Landing Page** | Opens the editor for a new page (`/admin/pages/new`) |
| **Import JSON** | Applies a content pack file. See [[Content Packs]] |
| Card button Copy Public URL | Copies the live link |
| Card button Preview Live | Opens the page |
| Card button Duplicate this page | Copies the page as a **draft**, with "(Copy)" added to the title and `-copy-...` added to the slug. Change the slug before publishing |
| Card button View Tracking & Pixels | Opens the page's pixel settings |
| Card button Dedicated Page Settings | Opens the page's own settings |
| Card button Delete Page | Deletes the page after a confirmation |

The sidebar also has direct links to the Smart City page editor and its analytics.

## How to use it

Full launch steps are in [[Launch a New Trip Page]]. The short version:

- [ ] Click **+ Create New Landing Page**, or **Duplicate** an existing page.
- [ ] In **General & Template**, set the title, the URL slug, the template and the status.
- [ ] Fill the tabs you need (list below). Switch to the **ភាសាខ្មែរ (Khmer)** tab for the Khmer version. See [[Languages]].
- [ ] Press **Save & Publish Landing Page**.
- [ ] Open the live link and check it on a phone.

### Editor tabs

| Tab | Holds |
|---|---|
| General & Template | Title, slug, category, badge, template, status |
| 🧩 Page Layout & Sections | Which sections show and in what order |
| Hero Section | Headline, sub-headline, button text and link, slideshow photos |
| Date & Venue | Event date, duration, venue, countdown, seats and prices (see below) |
| Template tabs | B2B trip: Itinerary, Value Stack, Core Values, Problem vs Solution, Target Audience. Expo: Booth Tiers. Concert: Artists. Summit: Speakers |
| Pricing Packages | Pass cards with price, features and a "popular" flag |
| Visual Gallery | Same photo list as the hero slideshow |
| Testimonials | Customer quotes (hidden on the Smart City page, see rules) |
| FAQs | Questions and answers. Approved wording: [[FAQ Answers]] |
| Guarantee | Risk-free points |
| Lead Form | Form headline, button text, fields |
| SEO & Social | Page title, description, social share image |
| 📊 Tracking & Pixels | Meta, Google and TikTok pixel IDs. See [[Tracking and Analytics]] |
| ⚙️ Dedicated Settings | This page's own contacts, alerts, tags, sold-out mode, passcode, payment details |

### Templates

| Template | Code name | Typical use |
|---|---|---|
| B2B Trade Delegation | `b2b-delegation` (default) | Business trips such as the Smart City trip |
| Trade Expo & Exhibition | `trade-expo` | Booth sales |
| Concert & Music Festival | `concert-festival` | Line-ups and passes |
| Corporate Summit & Conference | `corporate-summit` | Speakers and tables |
| Custom Campaign | `custom` | Blank page with toggleable sections |

Each template has a default section order (`src/lib/types.ts`).

## Key rules and defaults

- **Status.** `published` is live. `draft` is visible only to a logged-in admin. `archived` returns "not found" (`src/lib/page-access.ts`).
- **Slugs.** The slug is lower-cased and any character other than a–z, 0–9, `-` or `_` becomes `-`. Two pages cannot share a slug. These slugs are reserved: `admin`, `api`, `auth`, `login`, `images`, `photos`, `_next`, `favicon.ico` (`savePage` in `src/lib/storage.ts`).
- **New page defaults** (`savePage`): status `published`, category `General`, button text `Get Started`, button link `#booking-form`, form headline `Inquire or Register`, meta title `<title> | KHB EVENTS`.
- **Date & Venue fields:** Event Start Date, Duration / Time, Venue Name, Venue Address / City, countdown toggle, Total Seats, Claimed Seats, Early Bird Price ($), Regular Price ($), Urgency Notice Banner Text, Risk-Free Note. When a page has no value yet, the editor starts the seat and price boxes at 30, 19, 499 and 550 (`PageEditor.tsx`). Check them before saving.
- **Which price is shown.** If the page has package cards, the card marked "popular" (or else the first card) sets the price everywhere on the page. Without cards, the early-bird or regular price applies by phase (`src/lib/seat-price.ts`).
- **Smart City price.** The real selling price of a seat is $550 (owner). In the repo at the time of writing, the Smart City content pack sets both early-bird and regular price to 550. The admin is the source of truth.
- **Deadlines belong to the owner.** The owner sets the registration and early-bird deadlines in the admin personally. Code and content packs must never overwrite them.
- **No invented testimonials.** The testimonials that used to be on the Smart City page were placeholders. They stay hidden until the owner provides real ones. Never add made-up quotes.
- **Deleting a page** records it in `deleted_pages`, so the bundled seed file does not bring it back. Re-creating a page with the same slug or id brings it back.
- **Saving shows at once.** Saving clears the public 60-second cache.

### Dedicated Settings (per page)

| Section | What it controls |
|---|---|
| Dedicated Campaign Hotline & Social Contacts | Phone, WhatsApp, Telegram shown on this page |
| Dedicated Trip / Event Coordinator Profile | Coordinator name, role and photo |
| Isolated Telegram Lead Alerts & Webhooks | Own bot token and chat for alerts, outgoing webhook (Zapier, Make, Sheets, n8n) signed with an `X-KHB-Signature` header, automatic CRM lead tags |
| Post-Conversion & Form Submission Behavior | Inline success message or redirect |
| Sold Out / Registration Closed Mode | Locks the form and shows a sold-out or waitlist message |
| Campaign Accent Color & Partner Co-Branding | Colour, partner name and logo |
| Campaign Access Control & Privacy Gate | Public, or VIP passcode; search indexing on or off |
| Campaign Payment & KHQR Invoicing Details | Payment methods, KHQR image, bank details |

Private fields (bot token, chat ID, webhook, passcode) are removed before the page is sent to visitors (`toPublicPage` in `src/lib/page-access.ts`).

## How it works

- The admin screens are `src/components/admin/PagesManagerClient.tsx` (list) and `src/components/admin/PageEditor.tsx` (editor).
- Saves go to `/api/pages` and `/api/pages/<id>`, then `savePage` in `src/lib/storage.ts` writes the local copy and the `landing_pages` table in Supabase.
- Public pages render in `src/app/[slug]/page.tsx`. The slug `smart-city-tea-cafe` uses its own designed views (`SmartCityLandingPageView.tsx`, `SmartCityAppView.tsx`, `SmartCityOptinView.tsx`) while its template is `b2b-delegation`. All other pages use `DynamicLandingPageView.tsx`.
- The Smart City page still renders from built-in copy if the CMS has no page for it.

## Limits and gotchas

- The `?view=app` and `?view=optin` layouts exist only for the Smart City page.
- Khmer page content shows on the Smart City views. At the time of writing, the generic page view (`DynamicLandingPageView.tsx`) does not use the Khmer tab. See [[Languages]].
- The data model has a per-page round robin team (`useCustomRoundRobin`), but no admin screen edits it at the time of writing. All pages use the global team in [[Round Robin]].
- Pages with a passcode are left out of the home page list.

## Related

- Runbooks: [[Launch a New Trip Page]], [[Create a Popup]]
- Features: [[Content Packs]], [[Image Uploads]], [[Languages]], [[Tracking and Analytics]], [[Leads CRM]]
- Map: [[System Map]]

## To confirm

- The owner sets the early-bird and registration deadlines in the admin. In the repo at the time of writing, the page editor has no input for these two dates; only a brand-new page gets starting values. Where exactly are they edited today?
- Real testimonials and outcome photos will come from the owner later. Who adds them, and when? (See [[Open Tasks]].)
