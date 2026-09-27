---
type: session
date: 2026-09-27
tags: [session, round-robin, crm, telegram]
---

# Telegram chats become leads; did we reply?

## Asked for

- Phase 1 of the [[Prospect Journey Audit]], after the owner's answers: every Telegram chat in the pipeline, and numbers on whether the team really replies, how many messages, and how fast. No AI.

## Done

- A confirmed chat creates a CRM lead (one per Telegram user; a repeat click adds a note), assigned to the salesperson of the click, with the campaign, location and visit ids of the click and the first message. The "customer messaged you" alert now carries the CRM link.
- The connected account reads the last 60 messages of each open chat lead and keeps only numbers: messages each way, first reply time, last message and who sent it, unread count.
- Team performance: new card **Telegram chats: did we reply?** (chats, answered, average first reply, waiting now, quiet 3+ days, won, lost per salesperson; the waiting list with CRM links) and the same numbers per click in the visitor list.
- The account check now also runs with the lead follow-up check after normal site traffic, so matching and numbers no longer wait for someone to open the admin.
- Later the same day: a per-salesperson option **Track every new chat** makes leads for customers who write directly, without a click (page "Telegram (direct)"); people already in the chat list, bots and groups are never included. Rehearsed with the test double: off → contact seen, no lead; on → lead with reply numbers; old friend and bot ignored.
- Later again: **live chat view** in the CRM lead drawer for chat leads (both sides, times, attachment kinds; read through the connected account on open and every 30 s; Read again; read only; nothing stored but the numbers) and a 💬 badge with the message counts in the lead list. Rehearsed with the test double: 4 messages incl. a photo shown as bubbles, numbers refreshed (3/1, first reply 3 min, waiting), a new reply appears on refresh and clears the waiting mark, disconnected account explained, form leads have no chat, no sideways scroll on a phone.
- See [[Round Robin]] and [[Leads CRM]].

## Verified

- tsc, eslint, 251 unit tests (6 new: conversation counts, reply timing, per-salesperson stats), production build.
- Local rehearsal with the Telegram test double: connect, click (code and Khmer prefilled message), customer message → lead "Sok Dara" created and shown waiting; salesperson reply → "replied in 4 min", waiting list empty; second click by the same customer → one lead with a note; both bot alerts sent with the CRM link; disconnect; no page errors.

## Decisions

- A Telegram chat is a lead without a phone number; the team adds the phone later (owner, 2026-09-27; in [[Decision Log]]).

## Follow-ups

- Phase 2 (bot check-ins with the team) next; timings configurable with minimums (in [[Open Tasks]]).
