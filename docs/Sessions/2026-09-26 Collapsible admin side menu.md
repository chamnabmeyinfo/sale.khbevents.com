---
type: session
date: 2026-09-26
tags: [session]
---

# Collapsible admin side menu

## Asked for

- Make the admin (backend) side menu able to expand and collapse.

## Done

- The desktop side menu collapses to a 76px icon bar and expands back to full width (edge button, or Collapse / Expand menu at the bottom). The page content widens to match.
- In the icon bar, hovering or tabbing to an icon shows its sub-menu beside it; it closes on leaving or after navigating.
- The choice is remembered per browser. Phones keep the existing drawer. The existing per-feature sub-menu arrows are unchanged.
- See [[Admin and Security]].

## Verified

- tsc, eslint, 206 unit tests, production build.
- Browser test: collapse and expand (mouse and keyboard), content width, sub-menu on hover and its links, remembered after reload, no stray sub-menu after navigating, the page builder with the icon bar, phone drawer unchanged, no page or hydration errors.

## Decisions

- None.

## Follow-ups

- None.
