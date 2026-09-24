---
type: session
date: 2026-09-24
tags: [session]
---

# Feature images for the three trips

## Asked for

- Owner: find the right image and set it on each landing page.

## Done

- Vietnam page: the Hanoi train-street café photo (`/images/events/photo_2026-09-16_22-01-09.jpg`), which fits a tea and café trip better than the bus interior it showed before.
- Both Korea pages: no Korea photos exist in the repository, stock photo sites are blocked from the build environment, and a Vietnam photo would mislead. Designed 1200 × 630 share images instead (`public/images/campaigns/korea-*.jpg`): trip name in Khmer and English, dates, sectors with icons, fairs, a drawn Seoul skyline, KHB logo. No prices or deadlines on the images, so they never go out of date.
- Delivered through `content/feature-images.json`: applied on the production build only to pages without a feature image. See [[Page Builder]].

## Checked

- Of the 11 site photos, all are from Vietnam. Two look copied from the internet: photo (6) shows a Google "Search inside image" button and photo (11) carries a TV programme title. Not used; see [[Open Tasks]].

## Verified

- Tests (2 new, 114 in total), typecheck, lint, build. Locally: `og:image` of all three pages is the new absolute address, both images serve as JPEG, the admin page list shows all three and no "No feature image" flag.
