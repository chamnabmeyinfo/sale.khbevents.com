---
type: session
date: 2026-09-24
tags: [session]
---

# Page builder sales components

## Asked for

- Owner: more components for the drag and drop builder (the pilot had three).

## Done

- Five new components, two designs each: Benefits, What's included, How it works, Lead form, Final call to action. See [[Page Builder]].
- The lead form sends to Leads and Round Robin like other page forms; tracking keeps no names or phone numbers.
- A new page now starts as a full sales page (hero, benefits, how it works, offer, FAQ, closing call to action).
- **+** adds a component above the closing call to action instead of after it.
- All editor labels in English and Khmer.

## Verified

- Typecheck, lint (no errors), all unit tests (2 new), production build.
- Browser test on a local production server with Telegram alerts switched off in the local test data: new page has 6 sections, library shows 8 components, every design switch, icon choice, phone and Khmer preview, publish, public page with no sideways scroll on a phone, empty form shows an error, a filled form shows the thank-you and the lead is saved for the page.
- Fixed during the test: two style names clashed with section names (timeline showed as cards, the form section lost its dark background).

## Follow-ups

- Next components: gallery, packages, guarantee, about us. In [[Open Tasks]].
