---
type: session
date: 2026-09-24
tags: [session]
---

# Feature image for every page

## Asked for

- Owner: each campaign landing page should have a feature image.

## Done

- One feature image per page (stored in `ogImage`), used in the admin page list, the home page campaign list and link previews (large card, absolute address). See [[Page Builder]].
- Builder page settings: new **Feature image** field with a warning when missing. Classic editor: the "Social share image" field is now "Feature image".
- Pages without any photo are flagged **No feature image** in the page list; otherwise the first photo on the page stands in.
- Fixed an older light-mode bug found while testing: a rule that turns dark gradients white also covered every photo overlay (fading to transparent) with white, hiding the photos on the admin page cards and on public pages (home campaign cards, portfolio gallery, hero). Overlays are now excluded. The card category label is readable again.

## Verified

- Typecheck, lint (no errors), all tests (3 new, 112 in total), production build.
- Browser test (local): two pages flagged, builder warning, feature image saved and kept after reload, shown in the page list and on the home page, `og:image` is an absolute sale.khbevents.com address, large share card; light-mode screenshots of the page list and a home card show the photos.

## Follow-ups

- Add a feature image to the two Korea pages (no photos yet). In [[Open Tasks]].
