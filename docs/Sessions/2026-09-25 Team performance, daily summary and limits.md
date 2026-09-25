---
type: session
date: 2026-09-25
tags: [session, round-robin]
---

# Team performance, daily summary and limits

## Asked for

- Stage C of the Round Robin ideas: a salesperson performance page, a daily Telegram summary to the manager, and a daily lead limit per person.

## Done

- **Team performance** page (`/admin/round-robin/performance`) with tiles, a row per salesperson, new contacts per day and the leads still waiting. Details: [[Round Robin]].
- **Daily summary** to the manager chat at a chosen time (17:00 to 20:00), once a day, with a daily Vercel cron at 20:00 as a back-up.
- **Daily limit** per salesperson, with today's count on the card.
- Telegram clicks are now counted per person per day (120 days).
- Salesperson avatars (initials) on the performance page; photo upload follows in stage D.

## Verified

- Type check, lint, 162 unit tests (5 new) and a production build.
- On a local production server with Telegram faked: a person with a limit of 1 got one of four leads; today's count saved; clicks counted per person; the summary sent once to the manager with people, taps and waiting leads (a second call sent nothing); the performance page in light, dark and phone widths with no missing labels or overflow; the daily limit and summary time saved; the link from the Round Robin page works. No page errors.

## Decisions

- The daily summary uses one daily Vercel cron (allowed on the free plan) plus site traffic.

## Follow-ups

- Owner: set limits and the summary time (in [[Open Tasks]]).
