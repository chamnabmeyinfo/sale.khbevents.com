---
type: session
date: 2026-09-26
tags: [session]
---

# Autosave and backup versions

## Asked for

- Autosave, and a backup version stored whenever a landing page is changed.

## Done

- Autosave 4 s after the last change: a live page gets a server backup (the live page is untouched until Save/Publish); a draft is saved. Status line under the top bar.
- Backups thinned to one per 2 minutes, last 20 per page (`page_autosave:<id>` row), shown in Versions as "Auto-saved backup". Draft autosaves thin the save history the same way.
- A browser copy of unsaved work 1 s after each change; on reopening, Restore / Discard.
- See [[Page Builder]].

## Verified

- tsc, eslint, 221 unit tests (1 new for the snapshot thinning), production build.
- Local browser: a live page's edit produced a backup without changing the live page; the backup appeared in Versions; closing the tab and reopening offered the unsaved work; Restore then Save made it live; a draft page was saved by autosave and stayed a draft; no page errors. Test data restored.

## Decisions

- In [[Decision Log]]: autosave backs up live pages, saves drafts.

## Follow-ups

- None.
