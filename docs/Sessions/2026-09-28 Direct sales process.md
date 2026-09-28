---
type: session
date: 2026-09-28
tags: [session, telegram, round-robin, sales-team, process]
---

# The sales process: direct to the salesperson, tracked through the accounts

## Asked for

- With the team's Telegram accounts connected: route prospects straight to the salespeople, track through the accounts, and let the bot only alert. Then: "Please update the process to this flow, and make sure every detail is accurate."

## Done

- Checked every step of the described flow against the code (own reading plus a read-only audit). Three statements were not true yet, and one tracking gap was found; all fixed:
  - **Quick replies hid new chats.** The check only looked at chats whose last message was the customer's, so a salesperson who answered before the check made the chat invisible, and a customer who wrote again later could fall outside the 30-minute match. The check now reads the start of a new person's chat to find their first message (up to 8 chats per check); for a known person it does so only when there is an unmatched click in the last 24 hours; a chat the salesperson opened with someone new is re-read only when something changes in it.
  - **Click alert** told the salesperson a code would be in the customer's message; the greeting has no code since 2026-09-27. Now: service, time, "if they write, please reply fast". Manager copy likewise.
  - **Waiting-customer reminder** did not exist for Telegram chats (only the form-lead hand-over). Built: Round Robin → Advanced, Off/10/15/30/60 minutes (default 15), once per wait counted from the customer's first unanswered message, working hours only (a night or weekend message counts from the next shift start), manager at twice the time, waits longer than 24 hours of shift time or messages older than 7 days left to the daily summary. New `waitingSince` in the chat numbers.
  - **Daily summary** had no Telegram numbers. Added: new chats today, answered, average first reply per person, customers still waiting (last 30 days).
  - **Disconnected accounts** were only visible on the settings row. The bot now tells the manager and the salesperson once.
- Documentation: new [[Telegram Sales Process]] (the whole flow, exact numbers and conditions, settings checklist, limits); [[Sales Playbook]], [[Round Robin]], [[Telegram Inbox]], [[Bot First Guide]], [[00 Start Here]] updated; stale statements corrected (read-only, never sends, no text stored, code in the message, the per-salesperson app).

## Verified

- tsc, eslint (0 errors), 283 unit tests (new: waiting-since, reminder rule incl. shift start, weekend message reminded at the next shift, off shift, 24 h of shift time, 7 days, manager copy and dedupe; setting default; daily summary chat section), production build.
- Rehearsal with the Telegram and bot doubles, 22 checks: click straight to the salesperson; click alerts without a code; a customer answered before the check still found and matched (lead with match "time") with the "customer messaged you" alert; a customer waiting 31 minutes got one salesperson reminder and one manager copy, recorded on the lead, not repeated at the next check; no reminder for the answered chat; disconnect alert to manager and salesperson once, row shows the reason; the reminder setting on the Round Robin screen. The earlier live-inbox (56 checks) and bot-first (21 checks) rehearsals were rerun on the final build: all pass (99 checks in total).
- Not verifiable here: real Telegram and the production settings (each salesperson's username, Chat ID, manager chat). The owner checks them with the list in [[Telegram Sales Process]].

## Decisions

- The sales process: straight to the salesperson, tracked through their accounts, the bot only alerts (in [[Decision Log]]).

## Follow-ups

- Owner: settings checklist; tell the team (in [[Open Tasks]]).
