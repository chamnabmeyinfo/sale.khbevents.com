---
type: session
date: 2026-09-28
tags: [session, sales, telegram, round-robin]
---

# Sales process audit fixes

## Asked for

- Owner: "Please update Process to this flow! and make sure every detail are accurate." The flow: clicks go straight to the salesperson, tracking runs through the connected Telegram accounts, the bot only alerts and reminds the team. First pass in [[2026-09-28 Direct sales process]].

## Done

- Audited the whole flow against the code in four areas (click routing, account check, reminders and manager messages, texts and docs), then fixed what was wrong.
- **Matching:** a known customer takes a click only with the greeting the click typed; a new person with the greeting goes first; a chat the salesperson started (a form lead answering on Telegram) never takes a click and never becomes a second lead. Lookups only look at messages since the last check or the oldest open click; 100 chats read; only changed chats get their numbers refreshed.
- **Routing:** crawlers and link previews are not routed, alerted or logged; a fallback to a person's chat types the greeting; the click alert takes the page title from the CMS, adds "🌙" off shift and "DEMO" for Simulation Studio.
- **Alerts:** "customer messaged you" says "✔️ already answered" when it is, and "🔁" for an existing lead; Track-every-new-chat leads get their own alert; salespeople and the manager pressing Start get a confirmation instead of counting as customers; the fallback bot no longer promises 15 minutes at any hour, and its manager copy follows CC unless nobody was assigned.
- **Reminders:** reworked: moved to the next shift when due after closing, repeated when the customer writes after a reminder, the manager only after the salesperson had the same minutes, sent-times compared with the wait start, no 24-hour cap, one list when more than 3 are due, texts show when the customer wrote and the real wait.
- **Daily summary:** dates on older waits, "form leads" wording, a line naming salespeople whose chats are not tracked, a retry when Telegram refuses the send.
- **Safety:** a timed-out account lease now closes its Telegram connection before the account is used again.
- **Texts (EN and KH):** settings hints, Team performance footnote and legend, Round Robin hints (reminder, summary, fallback chat, CC, hand-over), disconnect warning, privacy, guide FAQ, inbox empty state, visitor-list labels, readiness check (two precise warnings instead of "No manager copy").
- **Docs:** [[Telegram Sales Process]] rewritten; [[Sales Playbook]], [[Round Robin]], [[Telegram Inbox]], [[Leads CRM]], [[Customer Story and AI Coach]], [[Connect a Telegram Account]], [[Add a Sales Staff Member]], [[Telegram Reply Templates]], [[Prospect Journey Audit]] (status banner), both Korea trip notes and [[Open Tasks]] corrected.

## Verified

- Type check and lint clean on the changed files; 291 unit tests pass (new: greeting matching, chats we started, reminder timing including Friday evening and "writes again", summary lines, lease abort).
- Local rehearsal with a mock Telegram account and a mock bot: direct flow, live inbox and bot first suites, on a fresh copy of the data each time, with a fake bot token; data file restored after.

## Decisions

- Recorded in [[Decision Log]]: "Sales process details after the audit: greeting rule, reminder timing, manager chats".

## Follow-ups

- In [[Open Tasks]] under "Sales process": owner decisions on the Smart City page promises, the Korea pages, a scheduled night check, and a returning customer routed to another salesperson; a list of smaller fixes for Claude.
