---
type: runbook
tags: [runbook, landing-pages, sales, trips]
updated: 2026-09-24
who: Owner or Sales lead, with Claude for copy
source:
  - src/components/admin/PagesManagerClient.tsx
  - src/components/admin/PageEditor.tsx
  - src/lib/storage.ts
  - src/lib/page-access.ts
  - src/lib/seat-price.ts
  - src/components/landing/DynamicLandingPageView.tsx
  - src/app/[slug]/page.tsx
  - src/app/api/round-robin/route.ts
  - src/lib/i18n/dict/editor.ts
  - docs/Templates/Trip.md
  - .claude/skills/landing-page-copy/SKILL.md
  - .claude/skills/landing-page-copy/references/qa-checklist.md
---

# Launch a New Trip Page

## What this is for

Each business trip we sell gets its own landing page at `sale.khbevents.com/<slug>`. The page is where ad clicks land, where visitors read the offer, and where they send the form or chat on Telegram. A new trip can go live without a developer. The tool is described in [[Landing Pages CMS]].

**Who normally does it:** the owner or the sales lead. Claude can write or review the copy.

## Before you start

- [ ] The trip facts are confirmed: dates, cities, what the seat includes, price, number of seats. Write them in a trip note first (step 12) or keep them at hand.
- [ ] Photos are ready. Keep words out of photos. See [[Image Uploads]].
- [ ] English copy is ready. For help, ask Claude to use the `landing-page-copy` skill. Rules: [[Copy Rules]].
- [ ] Khmer copy is ready, or someone will write it. See [[Languages]].
- [ ] No testimonial, customer name, partner name or statistic unless it is real.

## Steps

- [ ] **1.** Open **Admin → Landing Pages CMS** (`/admin/pages`).
- [ ] **2.** Start the page one of two ways:
  - **Duplicate this page** on an existing trip. The copy is a **draft**, with "(Copy)" added to the title and `-copy-...` added to the slug. It carries over the original page's content and settings.
  - **+ Create New Landing Page** for a blank page.
- [ ] **3.** Tab **General & Template:** set the title, a short URL slug (for example `trip-name-2027`), the template (**B2B Trade Delegation** for business trips) and the **Publishing Status**. A brand-new page starts as **published** in the repo at the time of writing, so switch it to **draft** now and keep it there until step 11.
- [ ] **4.** Tab **Hero Section:** headline, sub-headline, button text and slideshow photos.
- [ ] **5.** Tab **Date & Venue:** event start date, duration, venue and city, countdown, Total Seats, Claimed Seats, Early Bird Price ($), Regular Price ($), the urgency notice text and the risk-free note. A brand-new page starts these boxes with example values. Replace every one.
- [ ] **6.** Trip tabs: **📅 Itinerary (4D3N)**, **💎 9-in-1 Value Stack**, **Core Values**, **Problem vs Solution**, **Target Audience**. Then **Pricing Packages**, **FAQs** (approved wording in [[FAQ Answers]]; a brand-new page starts with one example FAQ, replace it), **Guarantee** and **Lead Form**.
- [ ] **7.** Tab **Testimonials:** a brand-new page starts with one example testimonial already filled in. Delete it. Leave the list empty until the owner provides real ones, or switch the section off in **🧩 Page Layout & Sections**. Never add invented quotes.
- [ ] **8.** Switch to **ភាសាខ្មែរ (Khmer)** and fill the Khmer version. See the limit under "If something goes wrong".
- [ ] **9.** Tab **SEO & Social:** Meta Title, Meta Description and a **Social share image** (1200×630). This image shows when the link is shared on Telegram or Facebook. Empty means the hero cover is used.
- [ ] **10.** Tab **⚙️ Dedicated Settings:** check the contacts, the coordinator, the lead alerts, the sold-out mode and the access gate. On a duplicate these come from the original page. Tab **📊 Tracking & Pixels:** check the pixel IDs. See [[Tracking and Analytics]].
- [ ] **11.** Set the status to **published** and press **Save & Publish Landing Page**. Saving clears the 60-second cache, so the page is live at once.
- [ ] **12.** In Obsidian, create a trip note in `Business/Trips` from the **Trip** template (Command palette → *Templates: Insert template* → Trip). Fill who it is for, what they get, the itinerary and sales notes. Link it from [[KHB Events Company Profile]]. Example: [[Smart City Tea and Cafe Vietnam 2026]].
- [ ] **13.** Optional: create a popup for the new page. See [[Create a Popup]].
- [ ] **14.** Tell the sales team the new link and add the trip to [[Sales Playbook]] if the pitch differs.

## Deadlines

The owner sets the registration and early-bird deadlines in the admin personally. Code and content packs must never overwrite them.

In the repo at the time of writing, the page editor has no input for these two dates. A brand-new page gets starting dates that are already in the past. A duplicate keeps the original page's dates. After publishing, check the countdown on the live page. How the owner sets these dates for a new page is still an open question; see "To confirm".

## Check it worked

- [ ] The page opens at `sale.khbevents.com/<slug>` on a phone and on a desktop.
- [ ] Price, seats left and dates on the page match what you typed. The admin is the source of truth.
- [ ] No placeholder text, no example values, no invented testimonials.
- [ ] Send a test form. It appears in [[Leads CRM]] and the assigned salesperson gets the Telegram alert. Delete the test lead afterwards.
- [ ] Tap **Chat on Telegram** on the page. It opens a salesperson's Telegram chat. This counts as a real assignment in [[Round Robin]].
- [ ] Share the link in a Telegram chat to yourself. The preview shows the right title, description and image.
- [ ] Run the copy QA list in `.claude/skills/landing-page-copy/references/qa-checklist.md`.

## If something goes wrong

| Problem | What to do |
|---|---|
| "The URL … is already used by …" or "… is reserved by the system" | Two pages cannot share a slug. Reserved words (`admin`, `api`, `auth`, `login`, `images`, `photos`, `_next`, `favicon.ico`) are not allowed. Letters other than a–z, 0–9, `-` and `_` become `-`. |
| Page shows "not found" | The status is **archived**, or the slug is different from the link. |
| Page is visible only to you | The status is **draft**. Drafts show only to a logged-in admin. |
| Khmer text does not show | At the time of writing, only the Smart City page uses the Khmer tab. Other pages use the generic view, which does not. Ask Claude or a developer. |
| No Telegram alert for the test lead | Check the readiness check in **Admin → Staff Round Robin**. See [[Add a Sales Staff Member]]. |
| Wrong price on the Smart City page | On the Smart City page view, if the page has package cards, the card marked "popular" (or else the first card) sets the price everywhere on that page (`src/lib/seat-price.ts`). Fix the card. |

## Related

- [[Landing Pages CMS]], [[Content Packs]], [[Image Uploads]], [[Languages]]
- [[Create a Popup]], [[Round Robin]], [[Leads CRM]]
- [[Copy Rules]], [[FAQ Answers]], [[Sales Playbook]]

## To confirm

- Where exactly does the owner set the registration and early-bird deadlines today, since the page editor has no date field for them?
- Should the generic page view show the Khmer tab, so new trips are bilingual like the Smart City page?
- On pages that use the generic view, which number sets the price shown: the package cards or the Early Bird / Regular price boxes?
