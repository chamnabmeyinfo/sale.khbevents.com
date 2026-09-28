---
type: feature
tags: [system, feature, analytics, tracking, marketing]
updated: 2026-09-28
admin_path: /admin/pages/<id>/analytics
admin_menu: Landing Pages CMS → Page Tracking & Analytics
source:
  - src/components/common/LandingPageTracking.tsx
  - src/components/common/GoogleAnalytics.tsx
  - src/lib/ga4.ts
  - src/app/[slug]/layout.tsx
  - src/app/page.tsx
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

> [!info] Campaign report (2026-09-25)
> Since 2026-09-25 every visit is also saved to the database as one visit record: campaign, channel, device, app, language, active time, scroll depth, sections reached, clicks, form started or sent. The campaign report, the AI analyst and the server-side conversions for Meta and TikTok are built on it. See [[Campaigns and AI Analyst]].
>
> The event log behind the page analytics screen below lives in a temporary file on each server and is capped at 5,000 events, so on the live site it is partial. Use Admin → Campaigns for decisions.

> [!info] Google Analytics for the whole site (2026-09-28)
> One GA4 property covers sale.khbevents.com. Its Measurement ID goes once in **Settings → Social & Public Channels → Google Analytics 4 for the whole site** and loads on every landing page (and its app, opt-in and print views) and on the home page, new pages included. The portal's own tracking stays the main source for sales decisions; GA4 is a free second view and the link to Google Ads. See "Google Analytics 4" below.

## What it does for sales

Tracking answers three sales questions:

1. **Which ads bring people?** Views and leads carry the `utm_` tags of the link the visitor clicked.
2. **Where do visitors drop off?** A funnel shows how many landed, read half the page, clicked a button and sent the form.
3. **Did the ad platform see the lead?** Meta, Google and TikTok pixels set on a page receive a "lead" event, so ad campaigns can optimise for real inquiries. At the time of writing this works on the Smart City page views only (see limits below).

Use it to decide where to spend on ads. Treat the portal's own numbers as a guide, not as accounting (see limits below).

## Where the numbers show

| Screen | Path | What you see |
|---|---|---|
| Dashboard | `/admin` | Total Inquiries, Active Pages, Visits, Conversion Rate; leads, visits and conversion per page |
| Page cards | `/admin/pages` | Leads, and visits with conversion % per page |
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
- [ ] Put the GA4 Measurement ID once in Settings → Social & Public Channels (the whole site). Put the Meta and TikTok pixel IDs in the page editor tab **📊 Tracking & Pixels**.
- [ ] After launch, open **Page Tracking & Analytics** for the page and check that your own visit appears in the activity stream.

## Ad pixels per page

Tab **📊 Tracking & Pixels** in the page editor. Each page has its own IDs, each with an on/off switch.

| Pixel | Setting | Events it receives from the page |
|---|---|---|
| Meta (Facebook) Pixel | Pixel ID | `Lead` on form sent, `Contact` on Telegram click, `InitiateCheckout` on seat pick, custom `CtaClick` |
| Google Analytics 4 | Measurement ID (optional here: the site-wide ID from Settings already loads on every page; a different ID here is added to it) | `generate_lead`, `contact`, `select_content` |
| Google Tag Manager | Container ID | A `dataLayer` event `khb_<event type>` for every event |
| TikTok Pixel | Pixel ID | `SubmitForm`, `Contact`, `ClickButton` |
| Custom scripts | Head and body script boxes | Whatever the script does |

Pixel IDs are not secret. Custom scripts run on the live page, so paste only code from a trusted source.

## Google Analytics 4

- **One property for the whole domain**, not one per page: one property shows the path between pages, builds audiences and links to Google Ads; one per page would split the data.
- **Where:** Settings → Social & Public Channels → *Google Analytics 4 for the whole site*. Only a `G-` Measurement ID is accepted; empty switches it off. It is stored in the `site_ga4` row of `system_settings` (the settings table has no column for it) and is public, like every Measurement ID.
- **Pages:** every page under `/<slug>` (through `src/app/[slug]/layout.tsx`) and the home page. The admin never loads it.
- **Events:** `generate_lead` when a form is sent (page forms, the home page form, builder forms), `contact` on a Telegram click (page buttons and the floating Telegram button), `select_content` on a button or seat. Never a name or phone number.
- **Counted once:** gtag.js loads once per page and each ID is configured once, so the same ID in Settings and in a page's Tracking & Pixels does not double the views. A page's different ID receives the same events.
- **Set-up in Google:** GA4 → Admin → Events → mark `generate_lead` and `contact` as key events; Admin → Data retention → 14 months; if you run Google Ads, link it and import `generate_lead` as a conversion.
- GA4 will show fewer visits than the portal: ad blockers stop it, and it does not see Telegram chats, CRM leads or won deals.

## How it works

1. `LandingPageTracking` in `src/components/common/LandingPageTracking.tsx` sends events from the browser with `navigator.sendBeacon` (or `fetch` as a fallback) to `POST /api/track`, and loads the pixels.
2. `/api/track` accepts only known event types and trims every field. Popup events keep only a few known fields. One address can send at most **60 events per minute**.
3. `recordTrackingEvent` in `src/lib/storage.ts` stores the event. Popup events also bump the popup counters after the response.
4. `getPageAnalytics` builds the analytics screen from the stored views and events.

**Dashboard and page cards (since 2026-09-26):** computed from real data, not from stored counters (`src/lib/page-stats.ts`).
- **Leads:** real leads of the page, all time. Demo, test and sample leads are not counted.
- **Visits:** visitor sessions from the durable visit records (one per session and page), over the last 30 days, or since tracking began when that is later (visit records exist from 2026-09-25).
- **Conversion:** leads created in that same period ÷ visits. It shows "–" when there are no visits.
- The old per-page counters (`viewsCount`, `leadsCount`) are still stored but no screen shows them. They had counted every page load, test visits and sample data.

## Limits: how durable are the numbers?

- **On Vercel, most tracking data is not durable.** Events and the per-page view list are kept in the server's local copy of the database, which on Vercel lives in memory and the temporary folder of one server instance. They reset when that instance stops (for example after a deploy or a quiet period), and two instances do not see each other's events. The page analytics screen reads only this local copy.
- **Old view counters.** The stored view counter per page is increased only in that local copy and is no longer shown (see above).
- **Page views are also saved to Supabase**, in the `page_views` table (page and referrer only). At the time of writing, no admin screen reads that table.
- **Leads are durable.** Leads live in Supabase, and the CRM and the Dashboard's **Total Inquiries** read them from there. The page cards and the Dashboard now count real leads per page from Supabase. **Leads Captured** on the page analytics screen still counts leads in the server's local copy. (Read from the code, not checked against live data.)
- **Popup counters are durable but approximate.** They live in the `popup_ad_stats` row; simultaneous updates can lose a count.
- The local copy keeps at most the latest 5,000 views and 5,000 events.
- Ad blockers can stop both the beacons and the pixels.
- The home page `/` is tracked since 2026-09-28 like a landing page (slug `main-sales`, shown as "Home page" in the campaign report), including its form and its floating Telegram button.
- For pages other than the Smart City page, page views and page events are recorded as English.
- **Pixels on other pages.** Builder pages and the Smart City views send every pixel event. Pages rendered by the generic view (`DynamicLandingPageView.tsx`) and the home page send GA4 `generate_lead` (form) and `contact` (floating Telegram button) since 2026-09-28, but no Meta or TikTok lead event from the browser (the server-side Lead for Meta and TikTok still goes out when those pixels are set).

For reliable ad numbers, use the ad platform's own reports (fed by the pixels) together with the lead count in the CRM.

## Related

- [[Leads CRM]], [[Ads and Popups]], [[Round Robin]], [[Landing Pages CMS]]
- [[Sales Playbook]]
- Map: [[System Map]]

## To confirm

- Should page analytics move to durable storage (Supabase) so numbers survive deploys? (Candidate for [[Open Tasks]].)
- Should the per-page lead counters and the pixel events on generic pages be fixed? (Candidates for [[Open Tasks]].)
