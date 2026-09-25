---
type: session
date: 2026-09-25
tags: [session, round-robin]
---

# Staff views and photos

## Asked for

- More view styles for the Round Robin design, and uploading each salesperson's Telegram photo.

## Done

- The staff list can be shown as **Detailed**, **Compact list** or **Grid**, remembered per browser; Edit opens a person's full card. Details: [[Round Robin]].
- Each salesperson has a round photo with a camera button (upload, change, remove); initials when there is none. Shown in every view and on Team performance.
- Photos go through the normal image upload; the photo library shows them as in use by the staff member. The server only keeps upload or https addresses.
- Fixed: on phones the Round Robin header buttons and tab row ran off the screen; they now wrap.

## Verified

- Type check, lint, 163 unit tests (1 new) and a production build.
- On a local production server: a photo uploaded, shown, saved and still there after reload; Compact list shows the status chips (working now, 1 page, today 0 / 10, no Chat ID); Edit opens and Done closes the full card; the Grid choice is remembered after reload; the photo shows on Team performance; the photo library lists it as "Staff photo: Dara"; no missing labels; no page overflow at 390 px in any view. No page errors.

## Decisions

- None.

## Follow-ups

- Owner: upload each salesperson's photo and pick a view.
