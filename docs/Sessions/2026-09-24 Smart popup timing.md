---
type: session
date: 2026-09-24
tags: [session, popups]
---

# Smart popup timing

## Asked for

- A smart feature that reads how a visitor uses a landing page and decides when to show the popup. Is it a good idea?

## Done

- Answer: yes, if it is polite and explainable. Built as a points system in the browser, not a trained model (too little traffic to learn from).
- New trigger **Smart timing** with Gentle, Balanced and Eager. Signals, points and rules: [[Ads and Popups]].
- Never while typing in the form, never after the form was sent on that page, never for a visitor who does nothing.
- Each view and click records its top reasons; the admin list shows **Why it showed (clicks/views)**.
- The **Telegram quick chat** starter now uses smart timing.

## Verified

- Type check, lint, 129 unit tests (9 new for smart timing) and a production build.
- Browser test on a local production server: idle visitor sees nothing after 20 s; a reader who scrolls to the price and form sees it (53 points); no popup while typing for 15 s, then it shows after they stop; no popup after the form was sent; leaving on desktop shows it; reasons reach the stats and the admin list; no missing labels, no console errors.

## Decisions

- Smart timing uses plain rules, not a trained model (in [[Decision Log]]).

## Follow-ups

- Compare smart popups with fixed-delay ones after a few weeks (in [[Open Tasks]]).
