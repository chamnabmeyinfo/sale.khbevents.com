---
type: feature
tags: [system, feature, analytics, tracking, marketing]
updated: 2026-09-24
admin_path: /admin/pages/<id>/analytics
admin_menu: Landing Pages CMS → Page Tracking & Analytics
source:
  - src/components/common/LandingPageTracking.tsx
  - src/app/api/track/route.ts
  - src/lib/storage.ts
  - src/lib/supabase-store.ts
  - src/lib/types.ts
  - src/app/api/pages/[id]/analytics/route.ts
  - src/components/admin/PageAnalyticsClient.tsx
  - src/components/admin/DashboardOverviewClient.tsx
  - src/components/admin/TrackingAndPixelsEditor.tsx
  - src/lib/rate-limit.ts
  - src/lib/i18n/dict/pages.ts
  - src/lib/i18n/dict/editor-extras.ts
---

# Tracking and Analytics

## What it does for sales

Tracking answers three sales questions:

1. **Which ads bring people?** Views and leads carry the `utm_` tags of the link the visitor clicked.
2. **Where do visitors drop off?** A funnel shows how many landed, read half the page, clicked a button and sent the form.
3. **Did the ad platform see the lead?** Meta, Google and TikTok pixels set on a page receive a "lead" event, so ad campaigns can optimise for real inquiries. At the time of writing this works on the Smart City page views only (see limits below).

Use it to decide where to spend on ads. Treat the portal's own numbers as a guide, not as accounting (see limits below).

## Where the numbers show

| Screen | Path | What you see |
|---|---|---|
| Dashboard | `/admin` | Total Inquiries, Active Pages, Tracked Views, Conversion Rate; views and conversion per page |
| Page cards | `/admin/pages` | Leads, and views with conversion % per page |
| Page Tracking & Analytics | `/admin/pages/<id>/analytics` | Total Page Views, Unique Visitors, Leads Captured, Conversion Rate; the funnel; traffic sources; devices; language; the last 30 events |
| Ads & Popups | `/admin/ads` | Popup views, clicks, click rate. See [[Ads and Popups]] |
| Staff Round Robin | `/admin/round-robin` | Leads routed, Telegram clicks, delivery success rate. See [[Round Robin]] |
| Leads CRM | `/admin/leads` | UTM source and campaign on each lead. See [[Leads CRM]] |

The funnel on the page analytics screen:

| Step | Counted from |
|---|---|
| 1. Landed on Page | Page views |
| 2. Read > 50% of Page | `scroll_depth` events at 50% or more |
| 3. Clicked CTA / Picked Seat | `cta_click` and `seat_select` events |
| 4. Submitted Delegation Lead | Leads in the CRM for this page |

Conversion rate = leads ÷ page views.

## Event types

| Event | Sent when |
|---|---|
| `page_view` | A landing page opens |
| `scroll_depth` | The visitor passes 25%, 50%, 75% and 100% of the page |
| `cta_click` | The hero button or the hero status-bar button is tapped on the Smart City page |
| `telegram_click` | A Telegram button is tapped on the Smart City page (floating button, mobile sticky bar, coordinator card) |
| `seat_select` | A seat is picked on the Smart City seat map |
| `form_submit` | The form is sent |
| `lang_toggle` | Defined, but no page sends it at the time of writing |
| `popup_view` | A popup appears |
| `popup_click` | A popup's button is tapped |
| `popup_close` | A popup is closed (close button, dismiss link, a tap outside it, or Esc) |

Each event carries: page slug, a session id (kept for the browser tab session as `khb_sid`), referrer, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, device type, browser, and language.

**Traffic sources** use `utm_source` when present. Otherwise the referrer decides: Telegram, Facebook, TikTok, Google, Referral, or Direct / Organic.

## How to use it

- [ ] Tag every ad link, for example `.../smart-city-tea-cafe?utm_source=facebook&utm_campaign=<campaign name>`. Add `&lang=kh` for Khmer ads.
- [ ] Put the ad platform IDs in the page editor tab **📊 Tracking & Pixels**.
- [ ] After launch, open **Page Tracking & Analytics** for the page and check that your own visit appears in the activity stream.

## Ad pixels per page

Tab **📊 Tracking & Pixels** in the page editor. Each page has its own IDs, each with an on/off switch.

| Pixel | Setting | Events it receives from the page |
|---|---|---|
| Meta (Facebook) Pixel | Pixel ID | `Lead` on form sent, `Contact` on Telegram click, `InitiateCheckout` on seat pick, custom `CtaClick` |
| Google Analytics 4 | Measurement ID | `generate_lead`, `contact`, `select_content` |
| Google Tag Manager | Container ID | A `dataLayer` event `khb_<event type>` for every event |
| TikTok Pixel | Pixel ID | `SubmitForm`, `Contact`, `ClickButton` |
| Custom scripts | Head and body script boxes | Whatever the script does |

Pixel IDs are not secret. Custom scripts run on the live page, so paste only code from a trusted source.

## How it works

1. `LandingPageTracking` in `src/components/common/LandingPageTracking.tsx` sends events from the browser with `navigator.sendBeacon` (or `fetch` as a fallback) to `POST /api/track`, and loads the pixels.
2. `/api/track` accepts only known event types and trims every field. Popup events keep only a few known fields. One address can send at most **60 events per minute**.
3. `recordTrackingEvent` in `src/lib/storage.ts` stores the event. Popup events also bump the popup counters after the response.
4. `getPageAnalytics` builds the analytics screen from the stored views and events.

## Limits: how durable are the numbers?

- **On Vercel, most tracking data is not durable.** Events and the per-page view list are kept in the server's local copy of the database, which on Vercel lives in memory and the temporary folder of one server instance. They reset when that instance stops (for example after a deploy or a quiet period), and two instances do not see each other's events. The page analytics screen reads only this local copy.
- **View counters.** The view counter per page (Dashboard, page cards) is increased only in that local copy. In the repo at the time of writing it is not written to Supabase when a view happens, so on production it can stay far below the real number.
- **Page views are also saved to Supabase**, in the `page_views` table (page and referrer only). At the time of writing, no admin screen reads that table.
- **Leads are durable.** Leads live in Supabase, and the CRM and the Dashboard's **Total Inquiries** read them from there. The per-page lead numbers are not reliable: the page cards (and the per-page conversion on the Dashboard) show a stored counter that a new lead does not update in Supabase, and **Leads Captured** on the page analytics screen counts leads in the server's local copy. To count leads per page, use the campaign filter in [[Leads CRM]]. (Read from the code, not checked against live data.)
- **Popup counters are durable but approximate.** They live in the `popup_ad_stats` row; simultaneous updates can lose a count.
- The local copy keeps at most the latest 5,000 views and 5,000 events.
- Ad blockers can stop both the beacons and the pixels.
- The home page `/` sends no page views at the time of writing; only landing pages do.
- For pages other than the Smart City page, page views and page events are recorded as English.
- **Pixels on other pages.** At the time of writing, pixel events (`Lead`, `Contact` and the others) are sent only from the Smart City views. Pages rendered by the generic view (`DynamicLandingPageView.tsx`) load the pixels and record page views, scroll depth and the portal's own `form_submit`, but send no pixel lead event and record no button clicks.

For reliable ad numbers, use the ad platform's own reports (fed by the pixels) together with the lead count in the CRM.

## Related

- [[Leads CRM]], [[Ads and Popups]], [[Round Robin]], [[Landing Pages CMS]]
- [[Sales Playbook]]
- Map: [[System Map]]

## To confirm

- Should page analytics move to durable storage (Supabase) so numbers survive deploys? (Candidate for [[Open Tasks]].)
- Should the per-page lead counters and the pixel events on generic pages be fixed? (Candidates for [[Open Tasks]].)
