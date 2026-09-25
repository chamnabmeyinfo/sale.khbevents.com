---
type: session
date: 2026-09-25
tags: [session, builder, landing-pages]
---

# Vietnam page moved to the builder

## Asked for

- Owner: "Convert Smart City, Tea & Cafe Business Trip to Vietnam 2026 page to have drag and drop feature too … for all component in it please upgrade it to one place only. I don't want so many types."

## Done

- The Vietnam page (`/smart-city-tea-cafe`) becomes a drag-and-drop builder page. The conversion (`src/lib/classic-to-builder.ts`) builds 13 builder sections from the page's own text and Khmer translation: hero, what you take home, problems, who it is for, what is included, the 4-day itinerary (timeline with times), photos, price card, guarantee, 3 steps, reservation form (with "Your business" choice), FAQ, final call to action.
- Price, registration deadline and seats come from the page's live admin values (urgency settings), read as Cambodia time. Nothing new is typed in.
- On production the content pack `content/pages/smart-city-tea-cafe.json` is now `{ slug, convertToBuilder: true }`: the next production build converts the **live** page once, after saving a backup (`content_pack_backup:smart-city-tea-cafe`). The seed `data/db.json` was converted the same way. The old fields stay on the record.
- One place for every page:
  - "Create New Landing Page" (list, sidebar, dashboard) always makes a builder page.
  - The old editor now shows only SEO, tracking and page settings for builder pages, with a link to the builder.
  - A page still on an old layout shows a **Move to drag-and-drop** button.
- `/smart-city-tea-cafe/app` and `/optin` now open the main page.
- Six new benefit icons (coffee and tea, technology, growth, search, losses, fast). Step text can be up to 1,000 characters, and line breaks show.
- Removed `npm run content:pack` and its script: running it would have put the old layout back.

## Verified

- tsc, eslint, 175 unit tests (7 new), `npm run build`.
- Playwright on a local production server:
  - the public page (13 sections, $550, 11 seats left, itinerary, FAQ, Khmer, no sideways scroll on a phone);
  - the old views redirect;
  - the form creates a lead with the business choice;
  - the admin has one create button, and the builder opens the page;
  - the old editor shows settings only;
  - "new page" creates a builder page.

## Decisions

- Every page is edited in the builder; the fixed layouts are no longer offered. See [[Decision Log]].
- Not carried over, because the builder has no such section and some of it was not confirmed fact:
  - the clickable seat map;
  - the industry "matchmaker" tabs (supplier and margin claims);
  - the stats strip;
  - the two-tier price cards;
  - the sticky bars.

## Follow-ups

- The registration deadline on the page (20 Sept 2026) has passed, so the countdown is hidden. The owner sets a new one, or removes it, in the builder → Offer. See [[Open Tasks]].
