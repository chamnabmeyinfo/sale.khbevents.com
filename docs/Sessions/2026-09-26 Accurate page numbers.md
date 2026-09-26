---
type: session
date: 2026-09-26
tags: [session]
---

# Accurate leads and visits on page cards and the dashboard

## Asked for

- The page cards still showed leads and page views that looked like old demo data; show them accurately.

## Done

- The page cards (Landing Pages CMS) and the Dashboard no longer show the counters stored on each page. They had counted every page load, test visits and sample data (the seed had 342 views and 24 leads on the Vietnam page).
- They now show real leads (all time, no demo, test or sample leads), visits from the durable visit records (last 30 days, or since tracking began), and conversion for the same period. A note above the cards says what is counted.
- See [[Tracking and Analytics]].

## Verified

- tsc, eslint, 217 unit tests (3 new for the calculation), production build.
- Local: the Vietnam card went from the stored 342 views / 24 leads to the true 0 / 0; one phone visit to the Korea page showed as 1 visit on the card and on the Dashboard; the note switched to "since 26 Sept"; no page or hydration errors.

## Decisions

- None.

## Follow-ups

- The page analytics screen (`/admin/pages/<id>/analytics`) still reads the server's local copy; moving it to the visit records is a separate change.
