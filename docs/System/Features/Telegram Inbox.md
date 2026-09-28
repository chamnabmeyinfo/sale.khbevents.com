---
type: feature
tags: [system, feature, telegram, live-chat, sales-team]
updated: 2026-09-28
admin_path: /admin/chats
admin_menu: Leads & CRM Pipeline → Telegram inbox
source:
  - src/components/admin/LiveChatInboxClient.tsx
  - src/components/admin/TelegramChatView.tsx
  - src/components/admin/TelegramAccountPanel.tsx
  - src/app/admin/chats/page.tsx
  - src/app/api/chat/admin/route.ts
  - src/app/api/leads/[id]/chat/route.ts
  - src/app/api/telegram-account/route.ts
  - src/lib/telegram-account.ts
  - src/lib/telegram-lease.ts
  - src/lib/telegram-chat-rules.ts
---

# Telegram Inbox

Live chat with customers, on Telegram, from the portal. Telegram stays the customer's channel: they chat with the salesperson's own account as before. The portal shows every such conversation live and lets the owner or the salesperson answer from the admin, sent from the salesperson's account.

## What it does for sales

- One list of every Telegram customer (each is a lead in [[Leads CRM]]), newest activity first, with "needs reply" when the customer spoke last.
- The whole conversation, read live from the salesperson's connected Telegram account (see [[Round Robin]] → Telegram account check). It keeps itself fresh while it is on screen: a customer's reply shows up by itself within about 8 seconds in an active chat (20 to 60 seconds in a quiet one), no Refresh click (since 2026-09-27, later the same day).
- Every message is also **stored** in the portal, voice messages are turned into text, and the **AI coach** card under the chat says where the customer stands and what to do next, with a Khmer reply to edit (**Use** puts it in the box). Heat badges and **Hot first** in the list. See [[Customer Story and AI Coach]].
- **Auto seen**, a switch per salesperson (off unless they turn it on): with it on, the customer sees "seen" on Telegram while someone is looking at the chat in the portal.
- A reply box: the text is sent from the salesperson's Telegram account, so the customer sees it from the person they were talking to. A note on the lead records who sent it from the portal.
- The same chat view and reply box sit in the lead drawer of the CRM.

There is **no chat window on the website**: the owner decided on 2026-09-27 that Telegram is the only live-chat channel. The "Chat on Telegram" buttons and the Round Robin routing are unchanged.

## Where it is in the admin

**Admin → Leads & CRM Pipeline → Telegram inbox** (`/admin/chats`, badge "Telegram"), and in each Telegram lead's drawer in the CRM.

## How to use it

- [ ] Each salesperson connects their Telegram account once (Settings & Security → Telegram account check). Chats of a salesperson without a connected account are listed but cannot be read or answered here.
- [ ] Open the inbox, pick a customer. **Open** hides won and lost deals; **All** shows everything.
- [ ] Read, then type in the reply box (Enter sends, Shift+Enter for a new line) → **Send on Telegram**. New messages appear on their own; when you have scrolled up, a **New messages** button jumps down.
- [ ] The chip next to the title says how the live view is doing: **Connecting…** (the first read is on its way), **Live** (looking every 8 to 60 seconds), **Paused** (the tab is in the background; it looks again the moment you come back), **Busy** (another request is using that salesperson's account; it tries again in 3 seconds), **Telegram asked to wait until …** (see below), **Not connected**.
- [ ] Set the deal's status and notes in the lead (**Open lead**).
- [ ] Each salesperson decides about **Auto seen** on their row in Settings → Telegram account check. Off (default): the customer sees "seen" only when the salesperson opens Telegram. On: while their chat is open in a front tab of the portal, new customer messages are marked read, once per message. A reply sent from the portal always marks the chat as read, like any chat app.

## Key rules and defaults

- Reading and sending go through Telegram's user-account API with the stored session. Since 2026-09-27 (later the same day) the conversation itself is stored too, for the story and the AI coach ([[Customer Story and AI Coach]]); the lead keeps the numbers (messages each way, first reply time, who spoke last, unread, Telegram's id of the latest message and of the last message marked read) and, for each portal reply, a note "💬 Sent on Telegram by <name>: “…”".
- Only chat leads appear: customers who wrote within 30 minutes of a click (matched by the account check), new people tracked with "Track every new chat", and bot-first customers. See [[Telegram Sales Process]]. While the inbox is open the list refreshes every 10 seconds and the connected accounts are checked for **new chats every 30 seconds** (elsewhere every 2 minutes), so a customer's first message shows here within about half a minute; the open chat's row updates the moment the chat does.
- **How the live view looks without hammering Telegram:** the browser asks the server only while the tab is visible, every 8 seconds when the last message is less than 10 minutes old or someone typed in the last 2 minutes, every 20 seconds within the hour, every 60 seconds after that, never faster than 5 seconds, one request at a time. Each request is one short connection with one cheap question to Telegram ("what is the latest message id and the unread count?"); the messages themselves are downloaded only when that answer changed.
- **Auto seen** marks read only when all four hold: the salesperson's switch is on, the browser says a person is looking (visible and focused tab), Telegram counts unread messages, and this latest message was not marked before. One read receipt per new message, never more.
- Replies from the portal keep a human pace: at least 1.5 seconds apart and at most 20 a minute per account; a faster attempt is refused with "Please wait …" and the text stays in the box.

## Keeping the salesperson's account safe

Telegram ends a login session it sees used from two connections at the same time, and asks an account that calls too often to wait. The portal guards against both:

- **One connection per account at a time.** Every Telegram call first takes a short lease on that salesperson's account (an in-process queue plus a compare-and-swap row `tg_lease:<staffId>` in `system_settings`, 25 seconds, released when the call ends). No lease, no connection: the chat view shows **Busy** and looks again in 3 seconds; a reply waits up to 8 seconds; the automatic check skips its turn. Two admins reading the same salesperson's chats at once therefore take turns.
- **Short connections.** Connect, one to three calls, disconnect. Nothing stays connected between requests, and no live update listener runs on a server (deferred; see the decision of 2026-09-27).
- **Telegram's wait is honoured.** When Telegram answers "wait N seconds" (FLOOD_WAIT), the account is left alone until that time plus 2 seconds: the chat view says **Telegram asked to wait until …**, replies are refused with the same message, the settings row shows it, and **Check now** says wait. It clears by itself.
- **A dead session disconnects the account.** If Telegram says the session is gone (ended from Settings → Devices, or the account logged in elsewhere with this same session), the portal forgets the session, the settings row shows "Telegram ended the session (…). Connect the account again.", and the chat view stops looking. Nobody's chats are read through a dead session.
- **Check now** runs at most every 30 seconds per account; the automatic check every 30 seconds while the inbox is open, otherwise at most every 2 minutes with site traffic.
- **Customer waiting too long** (since 2026-09-28): the bot reminds the salesperson when a chat's customer wrote last and nobody answered for the set time (Round Robin → Advanced, 15 minutes by default, only while the salesperson is on shift), and again if the customer writes after that reminder; the manager once, if the customer still waits that long after the salesperson's reminder. See [[Telegram Sales Process]] → step 5.
- Only what a person sends is ever sent from the account (a typed reply, or the suggested hello they press); there is no automatic sending, typing indicator or fake presence.
- A reply from the portal counts as the salesperson's reply in "Telegram chats: did we reply?" on Team performance.
- The reply box appears only when that salesperson's account is connected.

## Limits and gotchas

- Sending from the portal uses the salesperson's account at a human pace; do not automate mass messages from it, Telegram limits user accounts that send too much.
- Photos and files show as labelled attachments, without the file itself. Voice messages show their text once transcribed (🎤, "text coming…" until then).
- A customer not among the salesperson's 300 most recent chats and without a @username cannot be opened (Telegram needs one of the two to find the chat).
- Each open of a chat is a fresh read from Telegram (a second or two); after that the view keeps itself fresh as long as the tab is visible.
- "Live" here means within 8 to 60 seconds, not instant. Replies within a second would need a connection held open all day per account; that is deferred (Open Tasks).
- The first time a customer's chat is opened after a (re)connection, the portal looks the chat up in the salesperson's chat list (up to 300 chats) and remembers Telegram's handle for it, so later looks need no list.

## Related

[[Round Robin]], [[Leads CRM]], [[Prospect Journey Audit]].
