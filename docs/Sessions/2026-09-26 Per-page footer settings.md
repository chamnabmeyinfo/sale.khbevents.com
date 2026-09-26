---
type: session
date: 2026-09-26
tags: [session]
---

# Per-page footer settings

## Asked for

- Correct the contact block on the printed agenda (company, phone, bot Telegram handle, address, link). Each landing page should have its own footer settings, with the company settings as the default.

## Done

- Found where each value came from:
  - the phone and WhatsApp are set on the Vietnam page itself (they look like sample numbers);
  - the Telegram username is the routing bot, set in Settings → Company;
  - the address is the company setting.
- New per-page options in builder → Page settings → Brand & contact:
  - show or hide each line (phone, Telegram, WhatsApp, email, address, page link);
  - a footer note (EN/KH);
  - the print's closing box heading and text (EN/KH).
  Empty = company settings / default wording.
- The print now also shows WhatsApp and the footer note. The Contact & company section shows the note.
- See [[Page Builder]], [[Print Agenda]].

## Verified

- tsc, eslint, 219 unit tests (2 new), production build.
- Local browser: on the Vietnam page, changed the phone, hid Telegram, added a note and a closing heading, saved. The print showed exactly that, and the Khmer print fell back to the English text. No page errors. The test data was restored.

## Decisions

- None.

## Follow-ups

- Owner corrects the real contact details (in [[Open Tasks]]). Claude did not change them: the correct values are not known.
