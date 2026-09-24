---
type: feature
tags: [system, feature, popups, marketing]
updated: 2026-09-24
admin_path: /admin/ads
admin_menu: Ads & Popups
source:
  - src/lib/popup-ads.ts
  - src/components/common/PopupAds.tsx
  - src/components/admin/AdsManagerClient.tsx
  - src/app/admin/ads/page.tsx
  - src/app/api/popup-ads/route.ts
  - src/app/api/popup-ads/stats/route.ts
  - src/app/api/track/route.ts
  - src/lib/storage.ts
  - src/lib/types.ts
  - src/lib/i18n/dict/ads.ts
  - src/styles/popup-ads.css
  - README.md
---

# Ads and Popups

## What it does for sales

A popup is a short offer that appears on a landing page: "Ask us on Telegram", "Reserve a seat", "Before you go". It gives a hesitating visitor one clear next step. The rules keep it polite: at most one popup per page view, easy to close, and (with the default setting) never shown again to someone who already sent the form.

Step-by-step: [[Create a Popup]]. Wording: [[Copy Rules]].

## Where it is in the admin

**Admin → Ads & Popups** (`/admin/ads`). Sidebar shortcuts: All Popups, Performance (`/admin/ads#performance`).

| Area | What it does |
|---|---|
| **Popups enabled** switch | Master switch for every popup |
| KPI tiles | Popup views, Button clicks, Click rate (clicks ÷ views), Live now |
| **Cooldown between popups (hours)** | See rules below |
| **Popups & performance** list | Each popup with status, where and when, views, clicks, rate, and the actions Preview, Pause / Enable, Edit, Duplicate, Delete |
| **New popup** or a starter | Opens the editor with tabs **Content**, **Design**, **Rules** and a live preview |

Changes go live after you press **Done** in the editor and then **Save all**. Live pages update within a minute.

## How to use it

- [ ] Click a starter (**Telegram quick chat**, **Ask us on Telegram**, **Reserve a seat**, **Before you go**) or **New popup**.
- [ ] **Content:** Internal name, Small badge, Title, Text, Picture, Button text, what the button does, Dismiss link. Optional: a second button, a countdown, and the sender name and role for the Chat bubble. English title and English button text are required; Khmer is optional and falls back to English.
- [ ] **Design:** Layout, colours, button colour, position, size, entrance animation, corners, page dimming, close by itself, close on outside tap, small button after closing.
- [ ] **Rules:** pages (or all pages except some), devices, language, new or returning visitors, ad source, office hours, trigger, how often, start and end, priority, hide after the form.
- [ ] Switch the popup on, press **Done**, then **Save all**.
- [ ] Press **Preview** in the list to see it on the live page.

## Layouts (templates)

| Admin label | Code | Looks like |
|---|---|---|
| Chat bubble | `chat` | A message from the team in a corner, with sender name, online dot and a short typing animation. Page stays usable. Made for "Ask us on Telegram" |
| Centered card | `card` | Classic popup in the middle, page dimmed behind |
| Bottom sheet | `bottom-sheet` | Slides up on phones, sits in the corner on desktop. Least intrusive |
| Bottom banner | `banner` | Slim bar at the bottom. Page stays usable, no dimming |
| Image first | `image` | Big photo on top, text under it |

Themes: Dark green (matches the page), Light, or Brand gold. The default button colour is the brand gold `#E5A93C`.

## Design settings

All optional. A popup saved before 2026-09-24 has none of them and looks exactly as before.

| Admin label | Code | Choices and default |
|---|---|---|
| Position | `position` | Centre, bottom right, bottom left. Chat bubble defaults to bottom right. Ignored by Bottom sheet and Bottom banner |
| Size | `size` | Small, Medium, Large |
| Entrance animation | `animation` | Zoom in, Fade in, Slide up, Bounce. Chat bubble defaults to Slide up. Off for visitors who ask for reduced motion |
| Corners | `radius` | Sharp, Soft, Round |
| Page behind the popup | `overlay` | Not dimmed, Lightly dimmed, Dimmed. Defaults: Chat bubble and Bottom banner not dimmed, Bottom sheet lightly dimmed, others dimmed. When not dimmed the page keeps scrolling |
| Close by itself after | `autoCloseSeconds` | 0 (stays open) to 600 seconds |
| Close when the visitor taps outside | `closeOnBackdrop` | On by default |
| Leave a small button after closing | `launcher` | A round button in the corner (blue Telegram button when the popup's button goes to Telegram) that opens the popup again |
| Second button | `secondary` | Text and a link: web address, site path or `tel:` phone number |
| Countdown | `countdownTo`, `countdownLabel` | Days, hours, minutes, seconds to a date. Hidden once it has passed. Use the deadline from the admin CMS, not a made-up one |
| Sender name and role | `agentName`, `agentRole` | Chat bubble only. Default "KHB Events" and "Usually replies in minutes" |

## What the button can do

| Admin label | Code | Effect |
|---|---|---|
| Chat on Telegram (round-robin routed) | `telegram` | Opens `/api/round-robin` for this page, so the visitor reaches the next salesperson. See [[Round Robin]] |
| Go to the registration form | `register` | Scrolls to the form on the page (element `#register`, or the Form section of a drag and drop page); if the page has none, opens the Telegram route |
| Open a link | `url` | Opens a web address or a site path, optionally in a new tab |
| Just close the popup | `close` | Closes it |

## Triggers

| Admin label | Code | Default value |
|---|---|---|
| As soon as the page loads | `immediate` | |
| After a few seconds | `delay` | 8 seconds (0 to 600) |
| After scrolling down | `scroll` | 40% of the page (1 to 100) |
| When the visitor is about to leave | `exit_intent` | Desktop: the pointer leaves through the top. Phones: after 15 seconds or 60% scrolled, whichever comes first |
| When the visitor stops moving | `idle` | 20 seconds with no scroll, pointer, tap or key (3 to 600) |

## Frequency per visitor

| Admin label | Code | Blocks a repeat for |
|---|---|---|
| Every page view | `always` | Never blocked |
| Once per visit | `session` | The browser session |
| Once a day | `day` | 1 day |
| Once a week | `week` | 7 days |
| Once a month | `month` | 30 days |
| Only once, ever | `forever` | Always after the first time |

Memory of what a visitor saw is kept in their browser (`localStorage` and `sessionStorage`). A visitor in private mode may see a popup again.

## Key rules and defaults

Defaults for a new popup (`newPopupAd` in `src/lib/popup-ads.ts`): switched off, Centered card, Dark theme, gold button, all pages, all devices, both languages, after 8 seconds, once a day, priority 10, hide after the form **on**, button "Chat on Telegram", dismiss "Not now".

- **One popup per page view.** When several could show, the highest **Priority** wins, then the most recently edited.
- **Cooldown between popups.** After a visitor saw any popup, no popup they have not seen before shows for this many hours. Default **12** (range 0 to 720). `0` turns it off. Popups set to "Every page view" ignore it. Since 2026-09-24 the saved value reaches the live site (each public popup carries it as `siteCooldownHours`).
- **Hide from visitors who already sent the form.** The browser remembers a sent form, and those visitors skip every popup with this option on.
- **Targeting.** Pages: all, or chosen pages (the home page is listed as "Home page (/)"). With all pages, **Except these pages** leaves some out. Devices: phones and desktop, phones only, desktop only. Language: both, English readers only, Khmer readers only.
- **Visitors.** Everyone, first visit only, or returning visitors only. Returning means the browser first came to the site more than 30 minutes ago (`khb_first_seen` in `localStorage`).
- **Ad source.** A list of `utm_source` values (for example `facebook, tiktok`). The popup shows only to visits that arrived with one of them; the source is remembered for the browser session.
- **Office hours.** Days and a from–to time in Phnom Penh time (UTC+7). Default when switched on: Monday to Saturday, 08:00 to 18:00. An end before the start runs overnight. Useful for a chat popup so someone can reply.
- **Schedule.** Start and End in your local time. Empty start means now; empty end means until paused. Status shows as active, scheduled, expired or paused.
- **Limits.** At most 50 popups. Title up to 120 characters, text up to 400, button text up to 60, badge and dismiss link up to 40. The editor's **Done** button stays disabled until the English title and English button text are filled. On save, a popup with no title or no button text in either language is dropped.
- **Picture.** Uploaded with the image field and shrunk to 1600 px on the long side. 1200×800 works best; keep words out of the picture. See [[Image Uploads]].

## Preview and switches

| URL | Effect |
|---|---|
| `?popup_preview=<popup id>` | Shows that popup at once, even when paused, ignoring its rules, and without counting a view or click. The **Preview** button in the list builds this link |
| `?nopopup=1` | Hides all popups on that page view. Useful for screenshots and demos |

## Stats

- Views, clicks and closes are counted per popup and shown in the list and the KPI tiles.
- They come from the visitor's browser as tracking events `popup_view`, `popup_click` and `popup_close` through `/api/track`. See [[Tracking and Analytics]].
- The counters are stored in the `popup_ad_stats` row. Treat them as close estimates: ad blockers, closed tabs and simultaneous updates can lose a count.

## How it works

- Rules are pure functions in `src/lib/popup-ads.ts`, with tests in `src/lib/__tests__/popup-ads.test.ts`.
- The server picks the popups that may show on a page (master switch, enabled, in schedule, targets the page) through the 60-second cache (`getActivePopupAds` in `src/lib/storage.ts`).
- The browser then picks the one popup for this visitor (device, language, form sent, frequency, cooldown) and waits for its trigger (`src/components/common/PopupAds.tsx`, styles in `src/styles/popup-ads.css`).
- All popups are stored as one JSON row `popup_ads` in `system_settings`. The editor always saves the whole list.

## Limits and gotchas

- The live preview in the editor shows only the card. Timing, frequency and dimming apply on the live page; use **Preview** from the list for the real thing.
- A paused popup can still be previewed.

## Related

- Runbook: [[Create a Popup]]
- Features: [[Round Robin]], [[Tracking and Analytics]], [[Languages]], [[Image Uploads]]
- Map: [[System Map]]

## To confirm

- Nothing open. The cooldown value was wired to the live site on 2026-09-24.
