---
type: session
date: 2026-09-27
tags: [session, telegram, live-chat, crm, security]
---

# Live Telegram chat without Refresh, one connection per account, Auto seen

## Asked for

- "When user reply I have to click button refresh which is not like a real live chat. I want it smart enough to let me on and off auto seen. or you can decide what best but make sure it is not risk my account."

## Done

- The chat view (inbox and CRM lead drawer) keeps itself fresh while on screen: every 8 seconds around a fresh conversation, 20 or 60 seconds around an old one, paused in a background tab with an immediate look on return, one request at a time. A chip shows Live / Paused / Busy / Telegram asked to wait / Not connected; a **New messages** button appears when you have scrolled up. The inbox row updates the moment the open chat does.
- Each request is one short connection with one cheap question to Telegram (latest message id, unread count); messages are downloaded only when that changed; the lead's numbers are written only when they changed.
- **One connection per account at a time**: a lease (in-process queue plus a compare-and-swap row `tg_lease:<staffId>` in `system_settings`, 25 seconds) guards every Telegram call; no lease, no connection. Telegram's FLOOD_WAIT is honoured for the whole account (reads, replies, Check now); a session Telegram has ended disconnects the account and stops polling; replies keep a human pace (1.5 seconds apart, 20 a minute); Check now rests 30 seconds.
- **Auto seen** switch per salesperson (Settings → Telegram account check), off by default; on, the customer's messages are marked read only while a person looks at the chat in a front tab, once per new message. A reply from the portal always marks read first, then sends, on the same connection.
- New modules `src/lib/telegram-lease.ts` and `src/lib/telegram-chat-rules.ts` (pure rules, unit-tested); `telegram-account.ts` reworked (probe, mark read, field-level record writes, error classification); API `GET /api/leads/<id>/chat?since&unread&view` answers 200 with a live state; `POST` answers 409 busy / 429 too fast or flood.

## Verified

- tsc, eslint, 266 unit tests (15 new: error classification, mark-read rule, unchanged detection, send pace, poll cadence, lease: busy, wait, release on throw, stale takeover, fail closed), production build.
- Rehearsal with the Telegram test double, in the browser: Auto seen off by default; polls run by themselves; an unchanged chat downloads no messages; the customer's message stays unread with Auto seen off; a new customer message appeared by itself in 6 seconds and the inbox row updated at once; Auto seen on → exactly one read receipt up to the latest message, none repeated, one more for the next message; a background tab paused polling and an immediate look followed on return; a reply marked read then sent on one connection; a second reply within 1.5 seconds was refused with "Please wait" and the text kept; a dead session disconnected the account with the reason and stopped polling; a flood wait showed in the chip and the settings row, blocked reads, replies (429) and Check now; switching Auto seen off in Settings changed only that option; the lead keeps numbers and ids, no text; the CRM drawer shows the same live view.
- Not verifiable here (no network to Telegram or Supabase): the real GramJS calls (constructors checked at runtime against the library) and the Supabase compare-and-swap row. The owner checks the live inbox after the deploy (Open Tasks).

## Decisions

- Live chat by careful polling with a per-account lease; Auto seen off by default; no held-open connection for now (in [[Decision Log]]).

## Follow-ups

- Owner: watch a real reply arrive on the live site; decide Auto seen per salesperson (in [[Open Tasks]]).
- Later, if wanted: a live update connection per account on an always-on server (in [[Open Tasks]]).
