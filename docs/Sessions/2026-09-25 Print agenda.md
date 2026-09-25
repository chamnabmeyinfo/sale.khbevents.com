---
type: session
date: 2026-09-25
tags: [session, print, landing-pages]
---

# Print agenda

## Asked for

- Owner: "Add Feature Print landing page as agenda too so Staff of visitor can print our last update."

## Done

- New printable agenda for every page at `/<page>/print` (A4, or "Save as PDF"). It is built from the latest saved page, in English or Khmer, and has a QR code to the live page plus "Last updated" and "Printed" stamps. See [[Print Agenda]].
- Printer icon on the public page next to the language switch; printer icon on each card in Landing Pages CMS; **Print agenda** in the builder's top bar.
- Small QR code library added (`qrcode-generator`, MIT, no dependencies).

## Verified

- tsc, eslint, 181 unit tests (6 new), `npm run build`.
- Playwright on a local production server:
  - the public page's print icon opens the agenda, which shows price, deadline, seats, itinerary, FAQ, QR code and both stamps;
  - the toolbar is hidden on paper, and English and Khmer PDFs were produced;
  - both Korea pages print, and an unknown page returns "not found";
  - there is no sideways scroll on a phone;
  - the admin and builder links work.

## Decisions

- The agenda is generated from the page on each visit; there is no separate document to keep in sync.

## Follow-ups

- None.
