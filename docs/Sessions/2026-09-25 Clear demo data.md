---
type: session
date: 2026-09-25
tags: [session, admin]
---

# Clear demo data

## Asked for

- A global "clear demo data" action.

## Done

- New tab **Settings & Security → Demo data** (and sidebar link **Clear Demo Data**). It scans for demo leads (simulation, sample, test name), sample staff accounts, the routing log and statistics, lists each lead with its reason, and deletes only after DELETE is typed. Details: [[Admin and Security]].
- The server re-checks every lead against the demo rules, so real leads cannot be deleted through it.
- Statistics reset is optional and off by default.

## Verified

- Type check, lint, 167 unit tests (4 new) and a production build.
- On a local production server with the sample data plus one realistic customer lead: both addresses refuse calls without login; 30 demo leads listed and the real customer not listed; the button stays locked until DELETE (lower case does not unlock); the address refuses without DELETE and refuses to delete the real lead even when asked directly; with one demo lead unticked, 29 leads, 1 sample staff account and 21 log entries were removed and statistics reset; the unticked lead and the real customer remained; page lead counts were recalculated; light, dark and phone views have no missing labels or overflow. No page errors.

## Decisions

- Demo data is removed only after an explicit list and typed confirmation, never automatically.

## Follow-ups

- Owner: run it once before going live (in [[Open Tasks]]).
