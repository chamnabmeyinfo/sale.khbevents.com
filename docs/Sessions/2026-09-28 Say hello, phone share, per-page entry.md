---
type: session
date: 2026-09-28
tags: [session, telegram, round-robin, sales-team]
---

# Say hello from the inbox, phone share in the bot, per-page entry

## Asked for

- "Is there any way when people click and let them automatically chat to us?" Answer: Telegram never sends in the customer's name; the closest is the salesperson writing first with one click once the bot has identified the customer. Owner: "OK please build it and don't forget to guide also."

## Done

- **Say hello**: a bot-entry customer with an empty chat shows a ready Khmer greeting (customer's first name, salesperson, trip) in the Telegram inbox and the CRM drawer; **Send this hello** sends it once from the salesperson's account, **Edit first** puts it in the reply box. Needs a public @username.
- **Phone share**: for a customer without a @username the bot follows its greeting with a one-tap "Share my phone number" button; a shared number is saved on the lead (Supabase `phone` column and the local file), noted, and the salesperson is alerted with it; the customer is thanked and the keyboard removed.
- **Per-page entry**: dedicated page settings → Lead Routing → "Where this page's Chat on Telegram click goes" (default / direct / bot first) overrides the Round Robin choice for that page.
- **Guide** for the owner: [[Bot First Guide]] (before switching, switching on, a 5-minute test, how to judge after a week, what the customer sees, troubleshooting).

## Verified

- tsc, eslint (0 errors), 272 unit tests, production build, bot-first rehearsal against the bot API double extended with: second bot-entry customer → Say hello panel with the right names → the hello went out from the account; a customer without a username → greeting plus phone-share keyboard → shared number on the lead and the salesperson alerted.

## Decisions

- None new; the bot-first decision of 2026-09-27 stands, with "we write first" as its complement.

## Follow-ups

- Owner: run the guide on the second phone; judge after a week (in [[Open Tasks]]).
