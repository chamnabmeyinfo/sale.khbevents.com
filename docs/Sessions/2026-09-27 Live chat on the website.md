---
type: session
date: 2026-09-27
tags: [session, telegram, live-chat, crm]
---

# Live chat: built for the website, then moved to Telegram only

## Asked for

- First: an official live chat where visitors chat from the website. Then, the same day: no chat window on the website; Telegram is the only live-chat channel, and the portal should chat with customers through Telegram.

## Done

- A website chat widget with Telegram relay and an inbox was built, rehearsed and deployed (commit 6bbe4cb), then **removed** the same day at the owner's request: no widget on any page, no public chat API, no web-chat storage.
- In its place the **Telegram inbox** (`/admin/chats`): every Telegram customer in one list with "needs reply", the live conversation read through the salesperson's connected account, and a **reply box that sends from that account**. The same reply box is in the CRM lead drawer. A note on the lead records each portal reply. See [[Telegram Inbox]].

## Verified

- tsc, eslint, 251 unit tests, production build.
- Rehearsal with the Telegram test double: a customer chat became a lead; the inbox listed it as needing a reply; the live thread showed the message; a reply typed in the portal went out through the salesperson's account, appeared in the thread with the numbers updated (1 from the customer, 1 from us, first reply timed) and left a note on the lead; the inbox no longer marked it; the CRM drawer had the same reply box; a disconnected account showed "not connected" and no reply box; landing pages have no chat window; no page errors.

## Decisions

- Telegram is the only live-chat channel; the portal reads and answers through the salesperson's account (in [[Decision Log]]).

## Follow-ups

- Owner: try the inbox on the live site (in [[Open Tasks]]).
