---
type: process
tags: [sales, process, telegram, round-robin]
updated: 2026-09-28
source:
  - src/app/api/round-robin/route.ts
  - src/lib/storage.ts (recordDirectContactRoute)
  - src/lib/round-robin.ts (eligibleStaff, selectNextStaff, resolveFallbackTelegramUrl)
  - src/lib/contact-verify.ts (prefilledMessage, matchContactsToLogs, chatStatsFrom)
  - src/lib/telegram-account.ts (checkAccount, finishCheck, remindWaitingChats, alertChatStarted)
  - src/lib/lead-followup.ts (scheduleLeadResponseCheck, maybeSendDailySummary)
  - src/lib/staff-performance.ts (dailySummaryText)
---

# Telegram Sales Process

How a visitor who taps **Chat on Telegram** becomes a tracked prospect, since 2026-09-28. Chosen by the owner: customers go **straight to the salesperson**, the salespeople's **connected Telegram accounts** do the tracking, and the **sales bot only alerts and reminds the team**. It never talks to a customer in this flow. The form path is in [[Sales Playbook]].

```
Landing page ── "Chat on Telegram"
   │
   ▼
Round Robin picks a salesperson ──► bot alert to the salesperson (+ manager copy)
   │
   ▼
Salesperson's own Telegram chat opens, "សួស្តី 👋" already typed
   │  (customer sends it or writes their own message)
   ▼
Account check reads the salesperson's chats ──► chat matched to the click
   │                                          ──► lead in the CRM
   │                                          ──► bot alert "the customer messaged you" (+ manager copy)
   ▼
Telegram inbox + CRM: live conversation, reply numbers, stored chat, AI coach
   │
   ├── customer waits too long ──► bot reminder to the salesperson (manager at twice the time)
   ├── every evening ─────────────► daily summary to the manager, with Telegram chats
   └── account disconnected ─────► bot alert to the manager and the salesperson
```

## 1. The click

- The button calls `/api/round-robin?page=<slug>`. [[Round Robin]] picks one **active salesperson with a Telegram username** and sends the visitor straight to `t.me/<username>`.
- Who is picked: the page's team, people on shift and people under their daily limit are **preferred**, but only when someone is left. So a click at night still reaches someone instead of being lost. A returning visitor (same browser, within the memory window, 1 month by default) goes back to the same person.
- The chat opens with a greeting already typed: **"សួស្តី 👋"** for a visitor in Cambodia or with a Khmer browser, **"Hello 👋"** otherwise. There is no code and no template. A page that sets its own prefilled text keeps it.
- **Nobody can take it** when Round Robin is off, direct contact routing is off, no active salesperson has a Telegram username, or one internet address made more than 10 new clicks in 10 minutes and has no remembered salesperson. The click then goes to the page's or the company's Telegram contact (Settings), or, when that is the bot or empty, to the sales bot with the page name. In that case the bot greets the visitor and, when Round Robin can still pick someone, names that salesperson. This is the only time the bot talks to a customer in this process.

## 2. The bot alerts at the click

- The salesperson gets: **🔔 អតិថិជនថ្មីចុច Telegram មករកអ្នក**, the service (page title), the time, and "👉 បើគេផ្ញើសារមក សូមឆ្លើយឱ្យលឿន!". It needs the bot token and the salesperson's **Chat ID** on their Round Robin row.
- The manager gets a copy (salesperson's name and @username, service, time) when **Manager notification** is on in Round Robin and a manager chat is set.
- A returning visitor sent back to the same salesperson triggers no alert. The click is still logged.
- A click is **not a lead**. It appears on Team performance as "No chat yet" until the customer writes.

## 3. The customer writes: the account check

Each salesperson's own Telegram account is connected ([[Connect a Telegram Account]]). The **account check** reads each account's 40 most recent chats (private chats with people; bots and groups are ignored):

- **When it runs:** every 30 seconds while someone has the [[Telegram Inbox]] open; otherwise with site traffic (visitors' pages, the bot, the admin Leads, Round Robin and Team performance pages), at most every 2 minutes per account; and with **Check now** (at most every 30 seconds). With no traffic and no inbox open, for example at night, it waits for the next visit. Nothing is lost: it matches by the time of the customer's message, not the time of the check.
- **New person:** the check reads the start of the chat to find the customer's **first** message (up to 8 chats per check). A salesperson who already answered, or a customer who wrote again later, therefore hides nothing.
- **Matching:** the chat is linked to the latest unmatched click to the **same salesperson** in the 30 minutes before the customer's first message. Each click and each chat is used once. A person already in the chat list counts too, if they write within 30 minutes after a click.
- **Then, in the same moment:**
  - the customer becomes a lead in [[Leads CRM]] (name and @username from Telegram, no phone until the team asks, event type "Telegram chat", assigned to that salesperson). It is one lead per Telegram user; a second click adds a note "Clicked again".
  - the click shows as a real chat on Team performance.
  - the bot sends **✅ អតិថិជនបានផ្ញើសារមកអ្នកហើយ** to the salesperson: who, the service, their first words (120 characters), the time and the CRM link. The manager gets a copy when Manager notification is on.
- **Track every new chat** (per salesperson, in Settings → Telegram account check): a new person who writes **without** a click also becomes a lead ("Telegram (direct)"), if their message is less than 7 days old. No bot alert for these; the salesperson sees them in Telegram.
- A chat with no click in the 30 minutes before it, and Track every new chat off, stays a contact only (visible in What the last check saw).

## 4. Working the chat

- The [[Telegram Inbox]] lists every Telegram customer, newest activity first, with a "needs reply" badge when the customer wrote last (**Hot first** sorts by the AI coach's heat), the live conversation (a new message shows within about 8 seconds while open) and a reply box that sends from the salesperson's account. The same chat is in the lead's drawer in the CRM.
- The conversation is stored in the portal (newest 500 messages per customer), voice messages are turned into text when possible, and the [[Customer Story and AI Coach]] reads it once its key is set.
- Reply numbers per chat: messages each way, first reply time, who spoke last, since when the customer has been waiting. The check refreshes up to 15 open chat leads (created in the last 30 days) each run, the ones with the oldest numbers first.

## 5. Customer waiting: the reminder

Round Robin → Advanced → **Remind the salesperson when a Telegram customer waits for a reply**: Off, or after 10, **15 (default)**, 30 or 60 minutes. The default matches the page's promise "replies within 15 minutes in business hours".

- **Waiting** means the customer wrote last. The wait counts from their **first** unanswered message.
- It covers customers who are **leads** in the CRM (step 3) with an open deal (not Won or Lost) and whose chat is among the salesperson's 40 most recent. A chat that stayed a contact only gets no reminder.
- The bot sends the salesperson **⏳ អតិថិជនរង់ចាំចម្លើយ …** once per wait, with the customer, the service, their last words and the inbox link. The manager gets **"Customer still waiting for a reply"** at **twice** the time, once, when a manager chat is set (Manager Chat ID, else the fallback chat, else the company chat), whether or not the Manager notification copies are on.
- Only during the salesperson's working hours. A message that came in off shift (night, weekend) counts from the start of their next shift. A wait longer than 24 hours of shift time, or a message older than 7 days, is left to the daily summary.
- It is sent at the next account check after the wait passes (see the timing in step 3). A new customer message after our reply starts a new wait.

## 6. The manager every evening

With a **daily summary hour** set (Round Robin, 17:00–20:00 Phnom Penh), the manager gets the day's summary: form leads and clicks, button taps and reply times per salesperson, form leads with no reply, and now **Telegram chats**: new chats today, answered, average first reply, per salesperson, and the Telegram customers still waiting for our reply (last 30 days, longest wait first). A daily job at 20:00 Phnom Penh sends it if traffic has not already done so.

## 7. When an account disconnects

If Telegram ends a connected account's session (for example the "khbportal" device was removed in that person's Telegram), the next check notices it. The portal forgets the session, the settings row shows "Telegram ended the session … Connect the account again", and the bot tells the **manager** and the **salesperson** once. Until it is reconnected, that person's new chats are not tracked, not matched to clicks and cannot be answered from the portal. Pressing **Disconnect** yourself sends no alert.

## Settings that make this work

- [ ] Round Robin → Advanced: **Where a Chat on Telegram click goes = Straight to the salesperson's chat** (the default). Check each page's own setting too (page settings → Lead Routing: "Same as Round Robin").
- [ ] Round Robin: **Manager notification** on, and a manager chat set, if the manager wants the copies.
- [ ] Each salesperson's row: **Telegram username** of the **same account** that is connected in Settings → Telegram account check, and their **Chat ID** for the bot alerts. If the username points to a different account than the connected one, their chats are not tracked.
- [ ] Each salesperson has pressed Start in the sales bot once (otherwise the bot cannot message them).
- [ ] Settings → Telegram account check: every salesperson **connected**; **Check the connection** says "Account lock OK".
- [ ] Round Robin: the reminder minutes (default 15) and the daily summary hour.
- [ ] In each salesperson's Telegram: Settings → Privacy and Security → "If away for" 6 months.

## Known limits

- **A click with no message is not a lead.** Only a message proves a real person.
- **Timing can swap attributions.** If two people are sent to the same salesperson within 30 minutes and write in the opposite order, their chats can be linked to each other's click. The lead and the conversation are right; only the page or ad credited may be swapped.
- **Tracking follows the connected accounts.** A disconnected account is announced by the bot (step 7); check Settings → Telegram account check once a week anyway.
- **Timing of reminders** depends on the account checks (step 3): exact to about 30 seconds while the inbox is open, otherwise at the next site visit after the wait passes.

## Related

[[Round Robin]], [[Telegram Inbox]], [[Leads CRM]], [[Connect a Telegram Account]], [[Customer Story and AI Coach]], [[Bot First Guide]] (the optional bot-first entry, not used in this process), [[Sales Playbook]].
