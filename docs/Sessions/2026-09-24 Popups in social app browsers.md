---
type: session
date: 2026-09-24
tags: [session, popups]
---

# Popups in social app browsers

## Asked for

- The popup did not show when the link was opened inside Telegram's built-in browser. Make popups work in Facebook, Telegram and other in-app browsers.

## Done

- Cause: the live popup "Telegram quick chat" has office hours Monday to Saturday, 08:00 to 18:00 Phnom Penh time. The test was on Friday at about 01:55, so the popup was hidden on purpose, in every browser. Nothing blocked in-app browsers.
- Added `?popup_debug=1`: a box at the top of the page that names the browser and says, for each popup, whether it shows or why not, with the next opening time for office hours. Useful on phones, where there is no console.
- The admin list and the Rules tab now say "Hidden right now: outside office hours. Shows again …".
- A tip about `?popup_debug=1` is under the cooldown setting. Details: [[Ads and Popups]].

## Verified

- Type check, lint, 132 unit tests (3 new) and a production build.
- A copy of the live popup tested with the user agents of Facebook (iOS and Android), Messenger, Instagram, Telegram (Android and iOS) and TikTok: it shows in all of them during office hours and stays hidden at 01:55 with the reason on screen. No page errors.
- Limit: Chromium only; the iPhone apps use Safari's engine, which could not be run here.

## Decisions

- None.

## Follow-ups

- Owner to confirm the live popup's office hours and layout (in [[Open Tasks]]).
