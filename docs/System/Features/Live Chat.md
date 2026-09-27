---
type: feature
tags: [system, feature, live-chat, telegram, sales-team]
updated: 2026-09-27
admin_path: /admin/chats
admin_menu: Leads & CRM Pipeline → Live chat inbox
source:
  - src/components/common/LiveChatWidget.tsx
  - src/lib/web-chat.ts
  - src/lib/web-chat-types.ts
  - src/app/api/chat/route.ts
  - src/app/api/chat/[id]/route.ts
  - src/app/api/chat/admin/route.ts
  - src/app/api/telegram/webhook/route.ts
  - src/components/admin/LiveChatInboxClient.tsx
  - src/app/admin/chats/page.tsx
  - src/lib/storage.ts
---

# Live Chat

A chat window on every landing page. The visitor writes on the website; the salesperson answers from Telegram or from the admin inbox; the answer appears in the visitor's window within seconds.

## What it does for sales

A visitor who is not ready to open Telegram or send the form can still ask a question at once, on the page, in Khmer or English. Every chat is routed to a salesperson with the same fairness as a Telegram click, becomes a lead in [[Leads CRM]] straight away (name, phone if given, page, campaign), and counts in "Chats: did we reply?" on Team performance ([[Round Robin]]).

## For the visitor

- Green button **Chat with us / ជជែកជាមួយយើង** bottom-left of the page (Telegram and WhatsApp buttons stay bottom-right). Language follows the page.
- First message: name (required), phone or Telegram (optional, "so we can reach you if you leave"), the message.
- Answers appear in the window while the page is open (checked every 4 seconds) and a red badge counts new answers while the window is closed. The chat is remembered in that browser, so coming back later shows the whole conversation.
- A closed chat says so and offers **New chat**.

## For the salesperson

Each visitor message reaches the salesperson's Telegram from the company bot:

> 💬 Live chat ថ្មីពីគេហទំព័រ · <page> · 👤 name · phone · 💬 message · ↩️ Reply to this message to answer · `#WC-XXXXXX`

- **Reply** (swipe or long-press → Reply) to the bot's message and type: the text goes to the visitor's window. The bot confirms "✅ បានផ្ញើទៅអតិថិជនលើគេហទំព័រ".
- Replying `/close` closes the chat.
- Only the Telegram chat that received the messages can answer them; a reply from another chat is refused.
- The button **📋 បើកក្នុង Admin** opens the same chat in the inbox.
- Without a Telegram Chat ID for the salesperson, messages go to the manager chat (or the company chat), where they can be answered the same way.

## For the manager: the inbox

**Admin → Leads & CRM Pipeline → Live chat inbox** (`/admin/chats`): open or all chats, "needs reply" and unread marks, the conversation with both sides, a reply box (Enter sends), Close / Reopen, a link to the lead, and the switch **Live chat on the website: ON/OFF** (off hides the button and refuses new chats). Refreshes every 5 seconds. The CRM lead shows a 🌐 badge with the message counts and a link to the conversation.

## Key rules and defaults

- Routing: the visitor's remembered salesperson (cookie) first, else the rotation among active people the bot can reach (Chat ID); working hours and page teams apply as for clicks; the assignment counts for the fair share.
- The lead: source `web_chat`, tag `live-chat`, event type "Live chat", the first message as the message; the phone fills in when given. Conversation numbers (messages each way, first reply time, who spoke last) update on every message and feed Team performance.
- Limits per address: 5 new chats per 10 minutes, 40 messages per 10 minutes, 240 reads per minute. Messages are cut at 1,000 characters; a chat keeps its last 400 messages.
- Storage: one JSON row per chat (`webchat:<id>`) and an index row (`webchat_index`) in `system_settings`, last 400 chats. The visitor's browser holds the chat id and a secret token in localStorage; reading or writing needs the token.
- Manager CC (Round Robin setting) receives the first message of each chat.

## Limits and gotchas

- The visitor's message text is stored in the portal (unlike Telegram chats, which are read live). It is admin-only data; the vault never copies it.
- No typing indicators or read receipts; delivery is by polling, not push. Answers take up to 4 seconds to appear.
- A visitor who clears the browser storage loses the window's history; the chat stays in the inbox and the CRM.
- Two messages written in the same instant may, rarely, overwrite each other (JSON rows, no migration). The Telegram copy of every visitor message is the safety net.
- The bot must receive replies: the webhook must be registered (Settings & Security → Register / secure bot webhook).

## Related

[[Round Robin]], [[Leads CRM]], [[Tracking and Analytics]], [[Prospect Journey Audit]].
