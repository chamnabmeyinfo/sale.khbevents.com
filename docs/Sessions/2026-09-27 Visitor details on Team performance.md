---
type: session
date: 2026-09-27
tags: [session, round-robin, analytics]
---

# Visitor details on Team performance

## Asked for

- On `/admin/round-robin/performance`, every detail about the visitors who click and reach the sales team through Round Robin: where they came from, whether they are real, device, IP, location and more.

## Done

- New section **Who reached the team** on Team performance: one row per Telegram click and form lead in the chosen period, with device and browser (and the app it was opened in), location and IP, where the visitor came from (campaign tags, app, referring site), the page, the salesperson, and a **Real person / Check / Bot** verdict with its reasons. Summary boxes for verdicts, devices, countries and sources; search and filters; a detail panel per row. See [[Round Robin]].
- The click route now records the country, region and city (Vercel headers), the referrer and its `utm_` tags, the browser language and the visit and browser ids. The landing pages set `khb_sid` and `khb_vid` cookies so the plain Telegram link can be tied to the tracked visit (time on page, scroll depth).
- Returning visitors' clicks are written to the log too (no alert, not counted twice).
- Form leads' log entries carry the same detail from the lead (country, city, referrer, campaign).
- The routing log keeps 500 entries in Supabase (was 200).

## Verified

- tsc, eslint, 238 unit tests (13 new: browser parsing, header capture, verdict rules, labels), production build.
- Local end-to-end: a phone visitor from a Facebook campaign reads the page and clicks twice (first routed, second logged as returning), a Facebook link-preview bot hits the link directly; the admin page shows Cambodia / Phnom Penh, the campaign, the returning mark, Real person and Bot verdicts, the detail panel with IP, referrer and browser string; filters and search work; no page errors; no sideways scroll at phone width.

## Decisions

- Store the visitor's IP and location on the routing log for the admin; the campaign visits stay anonymous (in [[Decision Log]]).

## Follow-ups

- Owner: check the live page after a few real clicks (in [[Open Tasks]]).
