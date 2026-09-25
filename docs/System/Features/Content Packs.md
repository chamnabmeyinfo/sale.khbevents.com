---
type: feature
tags: [system, feature, content, deploy]
updated: 2026-09-25
admin_path: /admin/pages
admin_menu: Landing Pages CMS → Import JSON
source:
  - src/lib/content-pack.ts
  - scripts/sync-content-packs.mjs
  - scripts/sync-content-packs.ts
  - src/lib/classic-to-builder.ts
  - scripts/convert-smart-city-to-builder.mts
  - content/pages/smart-city-tea-cafe.json
  - src/components/admin/PagesManagerClient.tsx
  - src/components/landing/smart-city-content.ts
  - package.json
  - README.md
---

# Content Packs

## What it does for sales

A content pack is the sales copy of one landing page, kept as a file in git: headline, sections, FAQ, form text and the Khmer translation. It lets a copy rewrite (for example one done with Claude) reach the live page safely with the next deploy, without anyone retyping it into the admin. It never touches the live business numbers the owner controls, such as deadlines and seats claimed.

Copy rules: [[Copy Rules]]. The trip itself: [[Smart City Tea and Cafe Vietnam 2026]].

## What a pack owns

A pack is `content/pages/<slug>.json`. It holds only the fields it wants to change. Today there is one pack: `content/pages/smart-city-tea-cafe.json`.

| In the Smart City pack (repo at the time of writing) | Not in the pack, so the admin keeps it |
|---|---|
| Title, subtitle, description, category, badge | Early-bird and registration deadlines |
| Hero headline, sub-headline, button text and link | Total seats and claimed seats |
| SEO title and description | Event date and the English venue fields (the Khmer venue text is in the pack) |
| Risk note, urgency notice, early-bird price 550, regular price 550 | Phone, WhatsApp, bot token, chat IDs, webhook |
| Core values, problems, audiences, value stack, guarantee, FAQs | Bank and payment details, passcode |
| Packages (empty, so price comes from the two prices above) | Tracking pixel IDs |
| Testimonials (empty) and section visibility (testimonials hidden) | View and lead counters |
| Section order, form texts | Gallery and hero photos |
| Custom button and thank-you text | English itinerary (only the Khmer itinerary is in the pack) |
| Khmer translations of the copy | |

The owner sets the registration and early-bird deadlines personally in the admin. Code and content packs must never overwrite them. A pack must never add testimonials that are not real.

## When a pack is applied

| When | How | Who |
|---|---|---|
| **Production deploy** | After `next build` succeeds, `npm run build` runs `scripts/sync-content-packs.mjs` | Automatic |
| **On demand** | **Admin → Landing Pages CMS → Import JSON**, then pick the file | Admin |

On a production deploy, each pack is applied **once per file version**:

1. The script hashes the file.
2. It compares the hash with the marker row `content_pack:<slug>` in `system_settings`. Same hash: skip.
3. It saves the page as it is now to `content_pack_backup:<slug>`. If that backup cannot be written, the pack is **not** applied.
4. It merges the pack over the page and saves it.
5. It stores the new hash in `content_pack:<slug>`.

So an admin edit made after the deploy sticks until the pack file itself changes in git.

## Merge rules

From `mergeContentPack` in `src/lib/content-pack.ts` (tests in `src/lib/__tests__/content-pack.test.ts`):

- **Nested settings merge key by key.** A pack that sets only `urgency.regularPrice` leaves every other `urgency` value, such as deadlines, as the admin set it. The same goes for `formConfig`, `isolatedSettings`, `sectionVisibility`, `valueStack`.
- **Lists replace whole.** A list in the pack (FAQs, packages, testimonials) is the whole list.
- **Identity fields are ignored:** `id`, `viewsCount`, `leadsCount`, `createdAt`, `updatedAt`.
- A file without a `slug` is skipped. A slug with no page in the CMS is skipped on deploy.

**Import JSON** uses the same merge. It asks for confirmation first ("Fields not in the file are kept"). A file whose slug matches no page creates a new **draft** page, which needs a `title`.

## Safety rules of the deploy step

- It writes only during a Vercel **production** build (`VERCEL_ENV=production`). Preview builds never change live content.
- It needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the build environment; otherwise it skips.
- It never fails the build. Every problem is logged with the prefix `[content-packs]` and the build continues. Read the Vercel build log to see what happened.

## npm scripts

| Command | What it does |
|---|---|
| `npm run build` | `next build`, then applies packs (production only) |
| `npm run sync:content` | Runs the pack step alone. Outside Vercel it only writes with `CONTENT_PACK_SYNC=1` set |

## Moving a page to the builder

A pack with `"convertToBuilder": true` turns an old fixed-layout page into a builder page. It is built from the page's own live text, price, deadlines and seats (`src/lib/classic-to-builder.ts`). Builder pages are left as they are.

The Vietnam pack is now only `{ "slug": "smart-city-tea-cafe", "convertToBuilder": true }` (2026-09-25). Its copy is edited in the builder, not in git. `npm run content:pack` was removed because it would have brought the old layout back.

## Undo a pack

The page as it was before the last applied pack is kept in the `content_pack_backup:<slug>` row of `system_settings` in Supabase. At the time of writing there is no admin button to restore it; a developer copies it back.

## Limits and gotchas

- A pack sets prices when it carries them. Changing those numbers in a pack changes the live price on the next deploy. The admin stays the source of truth for live numbers.
- Scripts that rewrite `data/db.json` need their diff reviewed: never commit customer data or secrets in it.

## Related

- [[Landing Pages CMS]], [[Languages]], [[Deploy to Production]], [[Decision Log]]
- Map: [[System Map]]
