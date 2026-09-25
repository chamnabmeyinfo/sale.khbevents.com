---
type: feature
tags: [system, feature, analytics, marketing, ai]
updated: 2026-09-25
admin_path: /admin/campaigns
admin_menu: Campaigns & AI
source:
  - src/app/admin/campaigns/page.tsx
  - src/components/admin/campaigns/
  - src/components/common/attribution.ts
  - src/components/common/LandingPageTracking.tsx
  - src/lib/visits.ts
  - src/lib/campaigns.ts
  - src/lib/campaign-analytics.ts
  - src/lib/campaign-store.ts
  - src/lib/conversions.ts
  - src/lib/conversions-server.ts
  - src/lib/ai-analyst.ts
  - src/lib/ai-store.ts
  - src/app/api/campaigns/
  - src/app/api/track/route.ts
  - src/app/api/leads/route.ts
  - src/app/api/round-robin/daily-summary/route.ts
---

# Campaigns and AI Analyst

## What it does for sales

It answers four questions:

1. Which ad or post brings visitors, leads and paying customers?
2. What does each one cost per lead?
3. What do visitors do on the page, and where do they leave?
4. What should we change next?

An AI analyst reads the numbers first and writes the plan. The owner reviews it; the AI does not change anything by itself.

## Where it is

**Admin → Campaigns & AI** (`/admin/campaigns`) has four tabs:

| Tab | What it shows |
|---|---|
| **Performance** | Visits, engaged visits, leads, customers, spend and cost per lead; "What needs attention" findings; a table per campaign (with the salesperson's first answer time and leads not yet contacted); visitor journey; how far visitors read (per section); visits and leads per day; visits by hour; breakdowns by channel, app browser, device, language, new or returning, page and ad |
| **Campaigns & links** | Create a campaign for each ad or post, then copy its tracked link and QR code. Record the money spent |
| **AI analyst** | Latest analysis: verdict, data quality, numbered actions with steps, campaign verdicts (scale, keep, fix, pause, too early), insights, tests to run, ad ideas, sales follow-up. Settings for the daily run |
| **Tracking setup** | Which keys are set, pixels per page, test codes, the last server sends to Meta and TikTok |

## How to use it

1. **Campaigns & links → New campaign:** name, landing page and channel. Add one line per ad version.
2. Copy the link (or one link per ad) into the ad's Website URL, the post, or the Telegram message. Use the QR code for print.
3. Once a week, copy the spend from Ads Manager into the campaign.
4. Read **Performance**, and the **AI analyst** plan that arrives every evening.

## How visits are counted

- **Visit record.** Each visit is saved once when the page opens, and updated when the visitor leaves, switches away, or after 15 seconds. The record holds:
  - the campaign, source and ad (`utm_` tags);
  - the channel and app browser;
  - device and language;
  - active seconds (the page open and in use), deepest scroll, the builder sections reached;
  - clicks on the buttons and Telegram, the form started, the form sent.
  - It holds no names, phone numbers or IP addresses. Records are kept 120 days.
- **Engaged** means 15+ active seconds, half the page read, or any click.
- **Attribution.**
  - A visit keeps the campaign it landed with, even after the address changes.
  - The first campaign that brought a visitor is remembered for 30 days in their browser. A lead who comes back directly still credits that campaign.
  - Each lead stores its visit and visitor ids, so the report ties leads to behaviour. Customers are leads marked **WON** in [[Leads CRM]].
- **Storage.** One JSON row per page per day, `visits:<day>:<page>`, in `system_settings` (Supabase). No database migration was needed. Two visits written at the same instant may rarely overwrite each other; the visit is written again when the visitor leaves.

## Server-side conversions (Meta, TikTok)

- **What happens:** when a lead arrives, the server also sends a **Lead** event (Meta Conversions API) and a **SubmitForm** event (TikTok Events API).
- **Duplicates:** the event uses the same event id as the browser pixel, so the platform counts it once.
- **What is sent:** phone (with country code 855), e-mail, name and visitor id go only as SHA-256 hashes. The IP address, browser, click id and pixel cookies are sent as the platforms require. The value is the offer price.
- **When it runs:** only for pages with that pixel switched on (page → Tracking & Pixels), and only when the key is set. Never for demo leads.
- **Keys:** they live in Vercel environment variables, never in the vault or the database:
  - `META_CAPI_ACCESS_TOKEN`
  - `TIKTOK_EVENTS_ACCESS_TOKEN`
- **Testing:** test codes are set in Tracking setup.

## AI analyst

- **Model:** Claude (`claude-opus-5`), with Anthropic's automatic fallback model if a request is declined. Key: `ANTHROPIC_API_KEY` in Vercel.
- **What it reads:** only aggregated numbers from the report, the rule findings, each page's sections and deadline, and the campaign audience notes. No personal data.
- **Rules it follows:** quote the numbers; say when data is too thin; never invent figures, customers or testimonials; give at most 6 actions, ordered by impact.
- **When it runs:** on demand ("Analyse now"), and once a day with the 20:00 Phnom Penh cron. The daily run is skipped when there were no visits or leads, so it costs nothing on empty days.
- **Telegram:** the daily run can send the verdict and the top three actions to the manager chat (Round Robin settings).
- Each run is a paid API call.

## Limits and gotchas

- Numbers start from 2026-09-25; earlier visits were not recorded this way.
- Visitors who block storage (some private windows) count as new visitors each time.
- Telegram chats opened from the page are counted as clicks. They become leads only when sales adds them to the CRM.
- Spend is typed in by hand. Reading it from the ad platforms automatically is a possible next step.
- The report shows the campaign's `utm_campaign` name. Do not change it once ads are live.

## Related

- [[Tracking and Analytics]], [[Leads CRM]], [[Round Robin]], [[Page Builder]], [[Ads and Popups]]
