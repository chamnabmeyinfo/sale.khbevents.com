---
type: feature
tags: [system, feature, telegram, live-chat, sales-team]
updated: 2026-09-27
admin_path: /admin/chats
admin_menu: Leads & CRM Pipeline → Telegram inbox
source:
  - src/components/admin/LiveChatInboxClient.tsx
  - src/components/admin/TelegramChatView.tsx
  - src/app/admin/chats/page.tsx
  - src/app/api/chat/admin/route.ts
  - src/app/api/leads/[id]/chat/route.ts
  - src/lib/telegram-account.ts
---

# Telegram Inbox

Live chat with customers, on Telegram, from the portal. Telegram stays the customer's channel: they chat with the salesperson's own account as before. The portal shows every such conversation live and lets the owner or the salesperson answer from the admin, sent from the salesperson's account.

## What it does for sales

- One list of every Telegram customer (each is a lead in [[Leads CRM]]), newest activity first, with "needs reply" when the customer spoke last.
- The whole conversation, read live from the salesperson's connected Telegram account (see [[Round Robin]] → Telegram account check), refreshed every 30 seconds while open.
- A reply box: the text is sent from the salesperson's Telegram account, so the customer sees it from the person they were talking to. A note on the lead records who sent it from the portal.
- The same chat view and reply box sit in the lead drawer of the CRM.

There is **no chat window on the website**: the owner decided on 2026-09-27 that Telegram is the only live-chat channel. The "Chat on Telegram" buttons and the Round Robin routing are unchanged.

## Where it is in the admin

**Admin → Leads & CRM Pipeline → Telegram inbox** (`/admin/chats`, badge "Telegram"), and in each Telegram lead's drawer in the CRM.

## How to use it

- [ ] Each salesperson connects their Telegram account once (Settings & Security → Telegram account check). Chats of a salesperson without a connected account are listed but cannot be read or answered here.
- [ ] Open the inbox, pick a customer. **Open** hides won and lost deals; **All** shows everything.
- [ ] Read, then type in the reply box (Enter sends, Shift+Enter for a new line) → **Send on Telegram**.
- [ ] Set the deal's status and notes in the lead (**Open lead**).

## Key rules and defaults

- Reading and sending go through Telegram's user-account API with the stored session; nothing is stored in the portal except the numbers on the lead (messages each way, first reply time, who spoke last, unread) and, for each portal reply, a note "💬 Sent on Telegram by <name>: “…”".
- Only chat leads (customers matched by the account check, or tracked with "Track every new chat") appear; the list refreshes every 15 seconds.
- A reply from the portal counts as the salesperson's reply in "Telegram chats: did we reply?" on Team performance.
- The reply box appears only when that salesperson's account is connected.

## Limits and gotchas

- Sending from the portal uses the salesperson's account at a human pace; do not automate mass messages from it, Telegram limits user accounts that send too much.
- Photos, voice messages and files show as labelled attachments, without the file itself.
- A customer not among the salesperson's 300 most recent chats and without a @username cannot be opened (Telegram needs one of the two to find the chat).
- Each open of a chat is a fresh read from Telegram (a second or two).

## Related

[[Round Robin]], [[Leads CRM]], [[Prospect Journey Audit]].
