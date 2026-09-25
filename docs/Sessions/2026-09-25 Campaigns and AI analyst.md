---
type: session
date: 2026-09-25
tags: [session, analytics, marketing, ai]
---

# Campaigns and AI analyst

## Asked for

- Owner: running ads on social media from the platform. After my advice (measure, don't rebuild Ads Manager) the owner asked for it: "I want to clearly know how the campaign performs, analyse visitor behaviour and develop strategy to get them to convert. The task should be performed by AI first before suggesting to me."

## Done

- **Durable visit records.** Found that the old event log was a temporary file per server (capped, lost on redeploy). Visits are now saved in Supabase, one row per page per day. Each record holds the campaign, channel, app browser, device, language, active time, scroll, sections reached, clicks, form started or sent. See [[Campaigns and AI Analyst]].
- **Attribution.** The visit keeps its campaign when the address loses its `utm_` tags. The first campaign is remembered for 30 days, and leads are linked to their visit.
- **Server-side conversions** to Meta and TikTok, with the same event id as the pixel; hashed data only. The pixels' hardcoded $499 value was removed; the real offer price is used.
- **Admin → Campaigns & AI**, four tabs:
  - Performance: KPIs, findings, per-campaign table, journey, section reach, daily and hourly charts, breakdowns.
  - Campaigns & links: tracked links per ad, QR codes (PNG download), spend entries.
  - AI analyst.
  - Tracking setup.
- **AI analyst** (Claude): reads the report first, then writes a diagnosis, actions, verdicts, tests, ad ideas and sales advice, in Khmer or English. It runs every evening with the cron, can send a Telegram brief to the manager, and also runs on demand.

## Verified

- tsc, eslint, 194 unit tests (11 new), `npm run build`.
- Playwright end to end, with local mocks of Telegram, Meta, TikTok and Anthropic:
  - a phone visit from a Facebook ad link: the visit record holds campaign, ad, scroll, sections, form started and lead;
  - the lead keeps the campaign after the address lost its tags, and is linked to its visit;
  - the Meta and TikTok payloads carry the shared event id, hashed phone, `fbc` built from `fbclid` and the offer value; no raw phone number is sent;
  - creating a campaign in the admin gives links and QR;
  - Performance, Tracking setup and the AI plan render;
  - the AI request uses model `claude-opus-5`, `fallbacks: "default"`, a JSON schema and streaming, and contains no names or phone numbers;
  - the daily cron sends the Khmer Telegram brief;
  - no sideways scroll on a phone, and dark mode works.
- **Not verified live:** the real Meta, TikTok and Anthropic APIs (no keys here). Check with the test codes after the keys are added.

## Decisions

- Store visit records in `system_settings` rows instead of a new table, so no migration is needed. See [[Decision Log]].
- Build measurement and analysis, not ad buying (the ad managers do that).

## Follow-ups

- Owner: add the three keys in Vercel and redeploy; create campaigns for live ads; enter spend weekly. See [[Open Tasks]].
- Later: read spend automatically from the Meta and TikTok reporting APIs; send a "Purchase" event when a lead is marked WON.
