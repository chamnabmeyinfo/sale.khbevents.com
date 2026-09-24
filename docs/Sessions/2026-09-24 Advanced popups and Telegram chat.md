---
type: session
date: 2026-09-24
tags: [session, popups]
---

# Advanced popups and Telegram chat

## Asked for

- A popup that invites visitors to chat on Telegram for a faster answer.
- Whether a popup can be shown only on chosen landing pages.
- More settings and customisation for popups.

## Done

- Answer: choosing pages and a Telegram button already existed. The Telegram button goes through [[Round Robin]] for the page the visitor is on.
- New **Chat bubble** layout and a **Telegram quick chat** starter: sender name and role, online dot, a short typing animation, a Telegram icon on the button, and a small Telegram button left in the corner after closing.
- New design settings: position, size, entrance animation, corners, page dimming, close by itself, close on outside tap, a second button (link or phone), a countdown, and a Brand gold theme.
- New rules: all pages except some, new or returning visitors, ad source (utm_source), office hours in Phnom Penh time, and a "stops moving" trigger.
- Fixed: the saved **Cooldown between popups** now reaches the live site.
- Fixed: a "Go to the registration form" button now finds the Form section on drag and drop pages.
- Admin labels in English and Khmer. Details: [[Ads and Popups]], steps: [[Create a Popup]].

## Verified

- Type check, lint, 121 unit tests (7 new for the popup rules) and a production build.
- Browser test on a local production server, desktop and phone: chat bubble on the chosen page only, Telegram link through round robin, no page dimming, page still scrolls, small button reopens it, excluded pages skipped, office hours respected, new-visitor rule, register button scrolls to the form, admin editor with no missing labels. No console errors.

## Decisions

- Old popups keep their look: every new setting is optional and has a default per layout. No Decision Log entry needed.

## Follow-ups

- Owner may switch on a Telegram quick chat popup for the trip pages (added to [[Open Tasks]]).
