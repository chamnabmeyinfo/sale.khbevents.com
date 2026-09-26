---
type: session
date: 2026-09-26
tags: [session]
---

# Coordinator profile on the print and the page

## Asked for

- Update the Dedicated Trip / Event Coordinator Profile and show it when printing.

## Done

- The profile was only used by the old Vietnam page design, so it showed nowhere on live pages or prints.
- The profile now also holds the title in Khmer, the coordinator's own phone and Telegram, and a short introduction (EN/KH). It can be edited in the old page settings card and in the builder's Page settings → Brand & contact.
- The printed agenda's closing box shows a **Your coordinator** card: photo or initials, name, title, phone, Telegram, introduction. The Contact & company section shows the same card with tap-to-call and Telegram links. It can be hidden per page (Show on this page → Coordinator).
- See [[Page Builder]], [[Print Agenda]].

## Verified

- tsc, eslint, 220 unit tests (1 new), production build.
- Local browser, Vietnam page:
  - the print showed the existing coordinator (Sovann Meas, initials);
  - after adding a photo, phone, Telegram and an introduction in the builder and saving, the print and the public page (phone) showed them;
  - the Khmer print label is correct;
  - no sideways scroll.
- Test data and the test photo were removed afterwards.
- One page error remains on the old page editor screen (React hydration #418, Tracking & Pixels tab). It was already known before this change.

## Decisions

- None.

## Follow-ups

- Fix the old hydration mismatch in the Tracking & Pixels tab (suggested as a separate task).
