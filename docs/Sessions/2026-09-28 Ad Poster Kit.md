---
type: session
date: 2026-09-28
tags: [session, marketing, campaigns]
---

# Ad Poster Kit

## Asked for

- Owner: a feature that generates prompts for designing social media ad posters for the business trips, in sizes that fit Facebook, TikTok, Telegram, Google and LinkedIn; or use an external tool.

## Done

- Recommended: the portal builds the prompts and text from live facts, an image tool draws, Canva finishes. Built **Campaigns & AI → Ad posters** (sidebar link too): goal choice limited to what the page can back, photo prompts for four sizes with safe zones, poster text in English and Khmer from the hero copy and the CMS offer, tracked links and QR codes of the page's campaigns, one all-in-one prompt, warnings (not a builder page, no price, passed deadline).
- API `GET /api/campaigns/posters?page=<slug>` (admin only) returns the page's poster facts.
- [[Campaigns and AI Analyst]], [[Decision Log]], [[Open Tasks]] updated.

## Verified

- Type check and lint; unit tests (facts, blocked goals, copy lines in both languages with Phnom Penh dates, prompts).
- Browser check on a local build: tab and sidebar link, four size prompts, early-bird available and last seats blocked on the Korea page, English and Khmer offer lines, Copy to clipboard, passed-deadline warning on the Smart City page, no page errors.

## Decisions

- [[Decision Log]]: "Ad posters: the portal writes the prompts and text from live facts; an image tool draws".

## Follow-ups

- Owner: one campaign per trip, one ad version per poster ([[Open Tasks]]).
- Optional: send the kit to Canva for draft designs.
