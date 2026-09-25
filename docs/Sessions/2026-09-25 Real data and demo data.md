---
type: session
date: 2026-09-25
tags: [session, admin]
---

# Real data and demo data

## Asked for

- Start fresh with real data only, with a clear line between demo data and real data.

## Done

- Found that an empty live database fell back to the sample file: after clearing, the 30 sample leads and 24 sample log entries would have come back. Now only a failed database read uses that file. Page analytics now read the live page and real leads instead of the local file.
- Simulation Studio leads and clicks are tagged demo when created and never move counters, fairness, limits or statistics; their Telegram messages start with "🧪 DEMO".
- Dashboard, Team performance, daily summary, page analytics and hand-overs use real leads only.
- Leads CRM opens on Real customers, with Demo & test and All views and a DEMO badge; the routing log shows DEMO badges (also fixed: hand-over entries were labelled "Returning visitor").
- Clear demo data also removes log entries tagged DEMO. Details: [[Admin and Security]].
- Not done: emptying the sample file itself was stopped by the permission check; it is no longer needed for the live site.

## Verified

- Type check, lint, 168 unit tests (1 new) and a production build.
- On a local production server with Telegram faked: a simulated lead was tagged demo and a simulated click logged as demo, staff counters and click history unchanged, DEMO shown on the Telegram messages; the CRM opened on Real customers (1) with Demo & test (31) one click away; the dashboard showed no demo leads; the routing log showed 23 DEMO badges; Team performance counted only the real lead. No page errors.

## Decisions

- Real and demo data are separated by a tag and one rule used everywhere (in [[Decision Log]]).

## Follow-ups

- Owner: run Settings & Security → Demo data once with Reset statistics (in [[Open Tasks]]).
