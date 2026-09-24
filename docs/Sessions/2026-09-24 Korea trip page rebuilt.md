---
type: session
date: 2026-09-24
tags: [session]
---

# Korea trip page rebuilt

## Asked for

- Owner: a landing page for the Korea business trip (Seoul, 25 to 28 Nov 2026), from the sales caption. A second trip will follow.

## Found

- A page for this trip already existed and was live at `/korea-b2b-trip-2026`. It had invented content (two named testimonials, "11 seats taken", a partner organisation, a welcome dinner, a "$1,850+" value, a "100% guarantee"), the wrong contact, a photo path that does not exist, and Vietnam and café text leaking from the Smart City template.
- The owner chose to fix that page and keep its link.

## Done

- Rebuilt the page with the [[Page Builder]], from the caption only. See [[Korea Sourcing Trip Seoul 2026]].
- Builder features added for it: early-bird price that switches to the regular price by itself, default language per page (this one opens in Khmer), "Official website" links on benefit items, a choice question on the lead form (sector), four new icons, t.me links treated as Telegram.
- Builder pages now send the browser only the fields they use (not the whole admin record).
- Ships as the content pack `content/pages/korea-b2b-trip-2026.json` (built by `scripts/build-korea-content-pack.mts`), applied to Supabase on the production build. It also clears the old invented fields.

## Verified

- Typecheck, lint (no errors), all tests (4 new), production build.
- Browser test (local, Telegram alerts off): page opens in Khmer, no Vietnam or café text, no invented claims in the HTML, $750 with $799 struck and the early-bird countdown, button opens Mr. Tim Vutha's Telegram, three fair links, no sideways scroll on a phone, English switch, form saves the lead with the sector, thank-you shows the Telegram button, admin opens the page in the builder, the Smart City page still loads.

## Decisions

- Fix the existing page instead of adding a second one (owner). Added to [[Decision Log]].

## Follow-ups

- Items under "To confirm" in [[Korea Sourcing Trip Seoul 2026]], added to [[Open Tasks]].
- After the pack is applied, edit this page in the builder, not by changing the pack file: a new pack version would overwrite builder edits.
