---
type: session
date: 2026-09-24
tags: [session, popups]
---

# Popup source targeting fix

## Asked for

- Review again: the popup did not show on a phone.

## Done

- Cause: the live popup had **Only visitors from these ad sources: telegram**. That rule matched only links carrying `?utm_source=telegram`, so a normal link on a phone, even inside Telegram, was hidden.
- The rule now matches what its name suggests: a visit counts as telegram (or facebook, messenger, instagram, tiktok, google…) from the link tag, the app's built-in browser, or the site the visitor came from. Renamed to **Only visitors who came from**.
- The admin list shows "Only visitors from: …" and the editor warns that everyone else will not see the popup.
- Fixed: the field deleted commas while typing, so only one source could be entered.
- The `?popup_debug=1` box now shows where the visit came from. Details: [[Ads and Popups]].

## Verified

- Type check, lint, 135 unit tests (3 new) and a production build.
- A copy of the live popup on phones: Telegram Android app, a t.me link and `?utm_source=telegram` show it, and the tag is remembered on the next page in the same tab. iPhone Safari, Android Chrome and the Facebook app with a plain link hide it, and the box says why. No page errors.

## Decisions

- None.

## Follow-ups

- Owner to decide whether the popup should be limited to Telegram visitors at all (in [[Open Tasks]]).
