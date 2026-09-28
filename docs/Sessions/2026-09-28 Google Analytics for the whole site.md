---
type: session
date: 2026-09-28
tags: [session, analytics, tracking]
---

# Google Analytics for the whole site

## Asked for

- Owner: should visitor tracking use Google Analytics on the main domain, on each landing page, or our own tracking? Then: "Please build it, follow your recommendation."

## Done

- One site-wide GA4 Measurement ID in Settings → Social & Public Channels, validated (`G-…`), stored in the `site_ga4` row, loaded on every `/<slug>` page (new layout) and on the home page. A page's own ID is added; gtag.js loads once and each ID is configured once.
- The home page now has the portal's own tracking (visits, scroll, campaign; "Home page" in the campaign report).
- GA4 events from the shared form (`generate_lead`) and the floating Telegram button (`contact`, plus the portal's own `telegram_click`), never personal data.
- [[Tracking and Analytics]] updated (new GA4 section, corrected limits), [[Decision Log]] and [[Open Tasks]].

## Verified

- Type check, lint, 293 unit tests (new: GA4 ID check).
- Browser check on a local build: wrong ID refused, ID saved and shown, home page and landing pages configure the ID once with one gtag.js load, a page's own ID added once, Telegram click sends `contact`, empty ID switches it off. Data file restored.

## Decisions

- [[Decision Log]]: "Google Analytics: one property for the whole site, as a complement to the portal's own tracking".

## Follow-ups

- Owner: create the GA4 property, paste the ID, mark key events (in [[Open Tasks]]).
