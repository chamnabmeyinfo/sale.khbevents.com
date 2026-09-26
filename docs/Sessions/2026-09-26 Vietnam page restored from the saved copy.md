---
type: session
date: 2026-09-26
tags: [session, vietnam, restore]
---

# Vietnam page restored from the owner's saved copy

## Asked for

- The owner had saved the live Vietnam page from Chrome (an HTML file) before a deploy overwrote their photos and text. Read that file and put its pictures and text back on `/smart-city-tea-cafe`.

## Done

- The saved HTML holds the page's data (the Next.js payload), so the exact builder document was pulled from it: 14 sections, 23 uploaded photos (links into Supabase storage), Khmer as default language, 16 seats left, the owner's price and deadlines, 10 FAQ answers, the "Why people choose this" and second hero sections, and the Terms with 5 clauses.
- Written as the Vietnam content pack (`content/pages/smart-city-tea-cafe.json`, whole builder document) so it applies on the next production deploy, with two additions the saved copy lacked: the lead form (after "How to book") and the final call to action (last). The nine included items became the **Included & not included** section again, with five not-included lines (the four from the FAQ plus the single-room supplement from the owner's terms).
- The bundled seed got the same page.
- The Terms "Last updated" date is now formatted with fixed month names (`formatDay` in `src/lib/builder.ts`): the Khmer locale date differed between the server and Chrome and broke the page's hydration.

## Verified

- tsc, eslint, 225 unit tests (pack content: 16 sections in order, 23 photos, seats, language, terms, inclusions), production build.
- Local site: opens in Khmer, 16 sections, the owner's headline and titles, terms with 5 clauses, form and final call to action, 23 photo links, 16 seats, 9 included / 5 not included, no sideways scroll, print works, editor opens 16 sections, no page errors.
- Photo links point at Supabase public storage. They cannot be fetched from the work container, so whether every file still exists is checked on the live page by the owner.

## Decisions

- One-time restore through a content pack that carries the owner's own numbers (in [[Decision Log]]).

## Follow-ups

- Owner: check the live page after the deploy (in [[Open Tasks]]).
