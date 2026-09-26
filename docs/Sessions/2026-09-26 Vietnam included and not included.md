---
type: session
date: 2026-09-26
tags: [session]
---

# Vietnam page: included and not included

## Asked for

- Move the nine "included in this package" items on the Vietnam page into the Included & not included component.

## Done

- Section `cv-included` on the Vietnam page is now an **Included & not included** section (Two columns): "Included in your seat" with the same nine items and wording, and "Not included" with the four items the FAQ already states (meals outside the programme, Vietnam SIM card, travel insurance, personal shopping), in English and Khmer. The title, subtitle and "$910+" note are unchanged.
- New pack option `replaceBuilderBlocks` so the change ships as a content pack without touching the rest of the page. See [[Content Packs]].
- The bundled seed got the same change.
- See [[Smart City Tea and Cafe Vietnam 2026]].

## Verified

- tsc, eslint, 209 unit tests (3 new: the Vietnam pack's content; only that section changes, the offer and order stay; unknown ids skipped), production build.
- Local page on phone and desktop, EN and KH: 9 included and 4 not included, no sideways scroll; the print agenda shows both lists; no page errors.

## Decisions

- Packs can replace one builder section by id (in [[Decision Log]]).

## Follow-ups

- Owner: check the live page; optionally list the single-room supplement (in [[Open Tasks]]).
