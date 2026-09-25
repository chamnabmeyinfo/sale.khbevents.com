---
type: session
date: 2026-09-25
tags: [session, popups, analytics]
---

# Popup analytics dashboard

## Asked for

- Detailed analytics of the popup ads: see in detail how each popup performs.

## Done

- New page **Admin → Ads & Popups → Performance** (`/admin/ads/analytics`): date range and popup filters, five tiles, plain-language findings, a daily views and clicks chart, a popup comparison, breakdowns by page, source, device, browser, language and hour, smart timing reasons, and a CSV download. Details: [[Ads and Popups]].
- Each popup event now also records its page, device, source, app browser, language, hour and timing into a per-day record on the popup's stats (kept 120 days). No database change needed.
- Leads are credited to a popup when the visitor sends a form after seeing it in the same tab.
- Found and fixed: Telegram's Android browser was counted as a tablet, and the browser name was cut to 100 characters on the server so "Telegram" was lost.
- Labels in English and Khmer.

## Verified

- Type check, lint, 144 unit tests (9 new) and a production build.
- Browser test on a local production server with 35 days of made-up local test data (never pushed): a Telegram phone visit records view, click, app, source and time to click; an iPhone visit that closes the popup then sends the form records the close and a lead credited to the popup; the dashboard in light, dark and phone widths, hover tooltip, range and popup filters, table view and CSV download work; no missing labels, no console errors.

## Decisions

- Popup detail is stored as daily counts on the popup's stats row, not as raw events (in [[Decision Log]]).

## Follow-ups

- The live numbers start from this update; check the dashboard after a week of traffic (in [[Open Tasks]]).
