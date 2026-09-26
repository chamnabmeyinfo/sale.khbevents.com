---
type: session
date: 2026-09-26
tags: [session]
---

# Sticky editor bar and shortcuts

## Asked for

- Make the page editor's top bar sticky when scrolling, and ideas to make the editor easier to use.

## Done

- The editor top bar is sticky under the admin header. On a computer the editor now fits the screen height and the three columns scroll on their own, so the bar and Save never leave the screen. On phones and tablets the bar hides while scrolling down and returns on scrolling up.
- Shortcuts: Ctrl/⌘+S saves (also from a text field), Ctrl+Y redo, Esc deselects, Alt+↑/↓ moves the selected section (undo/redo existed).
- See [[Page Builder]].

## Verified

- tsc, eslint, 209 unit tests, production build.
- Browser: desktop 1366×768 and 1280×620 (bar visible, panels below it, no page scroll), shortcuts (select, Alt+Down, Ctrl+Z, Esc, Ctrl+S from a field), phone (bar hides on scroll down, returns under the header on scroll up, no sideways scroll), no page errors.

## Decisions

- None.

## Follow-ups

- Ideas offered to the owner, not built: keep an unsaved draft in the browser, section templates / copy a section to another page, a search box for the component library, a "what changed" list before publishing.
