---
type: session
date: 2026-09-25
tags: [session, round-robin]
---

# Lead follow-up buttons and hand-over

## Asked for

- Ideas for Round Robin; the owner chose all of them. This session is stage A: buttons on the lead card and passing unanswered leads on. Stages B (working hours, teams per page) and C (reports, daily summary, daily limit) follow.

## Done

- Contacted / No answer / Not interested buttons under every form lead card. A tap updates the CRM status, adds a note and records the response time; only the current salesperson can tap.
- New setting **Pass a form lead on if nobody responds within** (Off by default). Unanswered leads go to the colleague who waited longest, at most twice, then the manager gets one alert. Details: [[Round Robin]].
- The Leads CRM shows the tap, the response time and every hand-over.
- Fixed the "remember visitor" hint (open task).

## Verified

- Type check, lint, 153 unit tests (9 new) and a production build.
- End to end on a local production server, with Telegram replaced by a local fake that records every call (no real bot token used): the card has three buttons; a colleague's tap is refused; No answer then Contacted saves the status and notes; an unanswered lead is passed on after the set time to the next person with a "Passed to you" card, the first person's buttons change, the first person and the manager are told, a late tap by the first person is refused; after two hand-overs the manager is alerted once; the audit log shows the hand-overs; the CRM shows them. No page errors.

## Decisions

- The hand-over check runs on site traffic, not a paid cron (in [[Decision Log]]).

## Follow-ups

- Owner: register the webhook once, choose the minutes, tell the team (in [[Open Tasks]]).
