---
type: session
date: 2026-09-26
tags: [session]
---

# Full preview and page map

## Asked for

- A preview option that shows the full desktop experience inside the page editor.
- A mini map mode showing the order of components, to understand quickly how to order and organise them.

## Done

- **Full preview** button: the whole page over the full screen at Laptop, Desktop or Large screen width, scaled to fit, EN/KH switch, Esc to close.
- **Page map** button: small pictures of each section in order, with drag and arrows to reorder, the buyer's journey steps, advice per section and a one-click **Use this order** (undoable).
- See [[Page Builder]].

## Verified

- tsc, eslint, 206 unit tests (6 new for the order advice), production build.
- Browser test of the Korea page in the editor: full preview opens with the desktop layout, width and language switch, Esc closes; the map lists all 9 sections with pictures, suggests an order, applies it, undo restores it, click selects, arrows and drag reorder; phone-size editor has no sideways scroll; no page errors. Nothing was saved.

## Decisions

- The suggested order is a stable sort by journey step, with Why and Details as one step, so the owner's own order is kept where it is not wrong. Added to [[Decision Log]].

## Follow-ups

- None.
