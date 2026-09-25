---
type: session
date: 2026-09-25
tags: [session, print, landing-pages]
---

# Smart print modes

## Asked for

- Owner: print options such as "entire landing page" and "agenda". The agenda should be straight to the point for visitors, and smart enough to understand each page and decide what to print. A good print design, not only text.

## Done

- Two modes at `/<page>/print`:
  - **Agenda** (default) chooses its sections by the kind of page: trip, event or product. The screen explains what it printed and what it left out.
  - **Entire page** prints every section with photos.
- Options on the toolbar: language, photos on or off, print or save as PDF.
- New design:
  - a cover photo with the headline, and fact tiles with icons;
  - a day-by-day timeline for the programme;
  - cards for places, benefits and steps, a checklist, and a tinted guarantee box;
  - a photo grid in "Entire page";
  - a dark closing panel with contacts and a QR code;
  - page numbers and "Last updated" / "Printed" stamps.
- The planner is `src/lib/print-plan.ts`; it replaces `print-agenda.ts`. Section icons moved to `src/components/builder/icons.tsx`, so the print page shares them with the live page.

## Verified

- tsc, eslint, 183 unit tests (8 new for the planner), `npm run build`.
- Screenshots and PDFs from a local production server:
  - Vietnam agenda: 3 A4 pages, recognised as a trip;
  - Vietnam entire page: 6 pages;
  - Korea agenda: 2 pages, recognised as an event, with the three fairs as places;
  - no page errors.
- Khmer letters look broken in the test container only, because it has no Khmer fonts. Visitors' browsers load them from Google Fonts, as on the live page.

## Decisions

- The agenda leaves out persuasion sections and keeps practical ones. See [[Decision Log]].

## Follow-ups

- None.
