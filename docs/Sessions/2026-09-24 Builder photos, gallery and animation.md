---
type: session
date: 2026-09-24
tags: [session]
---

# Builder photos, gallery and animation

## Asked for

- Owner: components are mostly text and buttons; allow images, and add proper animation.

## Done

- Photos in Benefits items, How it works steps, the Offer card, the FAQ and the Lead form. See [[Page Builder]].
- New **Photo gallery** component: grid (fills every row whatever the count) or sliding carousel, captions, full-screen view.
- Entrance animations per section (rise, fade, zoom, slide, none; rise by default, so existing pages animate too), staggered items, hover lift and photo zoom, stock bar fill. Off for reduced motion; everything visible without JavaScript.
- Fixed during testing: the gallery grid used the same style name as the gallery section; renamed and checked that no other section name is used for an inner element.

## Verified

- Typecheck, lint (no errors), all tests (109), production build.
- Browser test (local): 9 components in the library, gallery upload of 4 photos with a caption, photo on a benefit and on the offer card, animation change replays in the editor, hero animates on load, lower sections wait and reveal on scroll, full-screen photo opens and closes, no sideways scroll on a phone, reduced motion shows everything at once, no page errors.
