---
type: session
date: 2026-09-24
tags: [session]
---

# Drag and drop page builder pilot

## Asked for

- Owner: build the recommended pilot of a drag and drop sales page builder where each component has its own core value.

## Done

- New builder: Admin → Landing Pages CMS → **New drag & drop page** opens a three-panel editor (components, live page, settings). See [[Page Builder]].
- Three components, two designs each: Hero, Offer card, FAQ. Each reads price, stock and deadline from one Offer.
- Live preview in EN / ខ្មែរ, phone / desktop; undo and redo; publish and unpublish.
- Public page at `/<web address>` with language switch, round robin button, tracking and popups.
- Fixed in passing: a new page saved to the local store lost its template; a builder page loaded from Supabase could fall back to the Smart City template.
- Whole builder is translated (EN and KH).

## Verified

- Typecheck, lint, 11 new unit tests (all tests pass), production build.
- Browser test on a local production server: create, edit, switch designs, price $45 with "Save 25%", countdown, stock label, drag from library, undo, phone width 390 px with Khmer, publish, public page 200 with the round robin link and no sideways scroll, unpublish gives 404.
- Drag to reorder checked with real drag events (the automated mouse drag could not reach a section below the visible part of the canvas).

## Decisions

- Builder pages keep their content in a `builder` document on the page, stored in `form_config._extra` (no migration). Added to [[Decision Log]].

## Follow-ups

- Next components and the lead form section. Added to [[Open Tasks]].
