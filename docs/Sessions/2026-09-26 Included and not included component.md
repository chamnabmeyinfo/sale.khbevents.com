---
type: session
date: 2026-09-26
tags: [session]
---

# Included and not included component

## Asked for

- A builder component that lists what is included and what is not included.

## Done

- New builder component **Included & not included**: two lists (green ticks, red crosses) with renamable headings, up to 30 items each, and an optional note. Designs: **Two columns** (side by side on a computer, one under the other on a phone) and **One card**. An empty list is hidden. Starter items are placeholders, flagged as sample text.
- The existing **What's included** component is unchanged.
- Printing: shown on both the Agenda and the Entire page, as two boxes.
- See [[Page Builder]], [[Print Agenda]].

## Verified

- tsc, eslint, 200 unit tests, production build.
- Local server: phone (Pixel 7) and desktop layouts, Khmer headings, light and brand colours, no sideways scroll, print agenda and entire page, editor panel and component library, no page errors.

## Decisions

- None.

## Follow-ups

- Owner adds the section with the real items on each trip page (added to [[Open Tasks]]).
