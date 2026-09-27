---
type: session
date: 2026-09-27
tags: [session, live-chat, telegram, crm]
---

# Live chat on the website

## Asked for

- Upgrade to an official live chat: visitors chat from the website directly.

## Done

- Chat window on every landing page (builder pages, classic pages, the home page), Khmer or English by page language: name, optional phone, message; answers appear within seconds; remembered in the browser; badge for new answers.
- Each visitor message goes to the salesperson's Telegram (Round Robin routing, same rules as a click) with a `#WC-XXXXXX` code; the salesperson answers by replying to the bot's message, or `/close`; the webhook relays it to the visitor. Manager CC of the first message.
- Admin inbox at `/admin/chats` (sidebar: Live chat inbox): list with needs-reply and unread marks, thread, reply box, close/reopen, lead link, on/off switch for the widget.
- Every chat is a CRM lead at once (source `web_chat`, tag `live-chat`, phone when given, campaign from the visit); conversation numbers on the lead feed "Chats: did we reply?" on Team performance, which now shows whenever chats exist.
- See [[Live Chat]].

## Verified

- tsc, eslint, 255 unit tests (4 new: codes, summaries), production build.
- Local rehearsal with the Telegram mock: phone visitor writes from a Facebook-tagged page → Telegram message with code → reply through the webhook shows in the visitor's window → second visitor message → inbox lists it "needs reply", shows both sides, inbox reply reaches the visitor → CRM lead with phone, source and campaign, 2/2 messages, first reply timed → 🌐 badge and link → Team performance counts it → returning visitor sees the whole chat → Khmer page shows Khmer button → switch off hides the button and the API refuses (403) → wrong token cannot read (404) → no sideways scroll on a phone → no page errors.

## Decisions

- Live chat routed through Telegram replies plus an admin inbox, no third-party chat service (in [[Decision Log]]).

## Follow-ups

- Owner: test on the live site from a phone, and tell the team how to reply (in [[Open Tasks]]).
