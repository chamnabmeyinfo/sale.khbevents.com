---
type: session
date: 2026-09-26
tags: [session]
---

# Lost page edits: cause, restore and overwrite protection

## Asked for

- The owner's manually updated photos and info had disappeared: check, restore, and protect against accidental overwrites.

## Found

- Three code paths wrote the bundled sample pages (`data/db.json`) into Supabase:
  - **Page by address** (every public visit): if the read failed or returned nothing, it saved the bundled copy of that page.
  - **Page list:** if the read failed, it treated Supabase as empty and saved all bundled pages.
  - **Page by id** (the editors): the same as the page-by-address path.

  A brief database hiccup could therefore replace the owner's edited page. A successful overwrite logged nothing, so the logs cannot confirm which path fired.
- The page builder and the old page settings screen both saved whole-page copies. Production logs show three saves of the Vietnam page at 07:11 and 07:13 UTC with both screens open, so either could have put back an older copy.
- Recovery available: the copy the content pack step kept before 05:26 UTC (12:26 Phnom Penh) today. No copy exists of edits made after that; Supabase's own backups are the remaining option.

## Done

- **No automatic writes:** read failures are errors or a read-only fallback, never a save.
- **Saves:**
  - merge over the latest stored page;
  - refuse to overwrite a newer version (409; both editors show a clear message, and the builder offers a reload);
  - keep the replaced version (last 15);
  - report a failed database write as "not saved".
- **Old settings screen:** no longer sends a builder page's sections.
- **Versions panel** in the builder: load any kept version, including the pre-pack copy, then Save.
- **Content pack step:** a failed read skips the page instead of failing.
- See [[Page Builder]].

## Verified

- tsc, eslint, 220 unit tests, production build.
- Local browser, two tabs and the old screen:
  - a stale tab's save was refused and the newer change kept;
  - the old screen opened before a save was refused;
  - a normal save from the old screen left the builder sections untouched;
  - Versions listed the kept copies, and loading the oldest and saving restored it.
- No page errors. Test data restored.

## Decisions

- In [[Decision Log]]: never write bundled pages into the database; guard every save.

## Follow-ups

- Owner restores the Vietnam page from Versions, and checks Supabase backups for anything newer (in [[Open Tasks]]).
