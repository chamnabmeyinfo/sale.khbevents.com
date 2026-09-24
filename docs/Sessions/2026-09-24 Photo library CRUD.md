---
type: session
date: 2026-09-24
tags: [session]
---

# Photo library CRUD

## Asked for

- Owner: add create, read, update and delete to the photo library ("Library. Click a photo to add it").

## Done

- New **Photo Library** page (Landing Pages CMS → Photo Library) and the same library inside the page editor and beside every single image field, including the builder. See [[Image Uploads]].
- Upload, search, open, rename (display name only, the address never changes) and delete. Delete lists the pages and popups that still show the photo and asks before deleting.
- Fixed an old light-mode bug found while testing: the admin frame's text-selection class matched a rule meant for gold buttons, so every admin text was forced black in light mode. It made the builder preview show black headlines on dark photos and hid white button text. Admin text now shows its intended colours; the language switch in the admin header got its own readable colour.

## Verified

- Typecheck, lint (no errors), all tests (6 new), production build.
- Browser test on a local production server: upload 2 photos, readable default names, rename kept after reload, search, pick a photo in the builder, "Used 1×" tag, delete warning names the page, cancel, delete an unused photo, delete anyway, anonymous and malformed delete requests refused.
- Light-mode scan of 10 admin screens found no unreadable text.

## Decisions

- Rename changes a display name, not the file. Added to [[Decision Log]].

## Follow-ups

- The public landing pages and the login page still carry the class that forces black text in light mode. Added to [[Open Tasks]].
