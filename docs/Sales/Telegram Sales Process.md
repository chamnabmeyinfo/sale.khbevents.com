---
type: process
tags: [sales, process, telegram, round-robin]
updated: 2026-09-28
source:
  - src/app/api/round-robin/route.ts
  - src/lib/storage.ts (recordDirectContactRoute, createLeadFromTelegramChat)
  - src/lib/round-robin.ts (eligibleStaff, selectNextStaff, resolveFallbackTelegramUrl, roundRobinHealth)
  - src/lib/contact-verify.ts (prefilledMessage, startsWithGreeting, matchContactsToLogs, chatStatsFrom)
  - src/lib/telegram-account.ts (checkAccount, finishCheck, waitDecision, remindWaitingChats, alertChatStarted)
  - src/lib/lead-followup.ts (scheduleLeadResponseCheck, maybeSendDailySummary)
  - src/lib/staff-performance.ts (dailySummaryText)
  - src/app/api/telegram/webhook/route.ts
---

# Telegram Sales Process

How a visitor who taps **Chat on Telegram** becomes a tracked prospect, since 2026-09-28. Chosen by the owner: customers go **straight to the salesperson**, the salespeople's **connected Telegram accounts** do the tracking, and the **sales bot only alerts and reminds the team**. In this flow the bot writes to a customer only when nobody can take the click (step 1). The form path is in [[Sales Playbook]].

```
Landing page ── "Chat on Telegram"
   │
   ▼
Round Robin picks a salesperson ──► bot alert to the salesperson (+ copy to the manager chat, CC on)
   │
   ▼
Salesperson's own Telegram chat opens, "សួស្តី 👋" already typed
   │  (the customer taps Send, or writes their own message)
   ▼
Account check reads the salesperson's chats ──► chat matched to the click
   │                                          ──► lead in the CRM
   │                                          ──► bot alert "the customer messaged you" (+ copy, CC on)
   ▼
Telegram inbox + CRM: live conversation, reply numbers, stored chat, AI coach
   │
   ├── customer waits too long ──► bot reminder to the salesperson, later the manager
   ├── every evening (if an hour is set) ► daily summary to the manager
   └── account disconnected ─────► bot alert to the manager and the salesperson
```

## 1. The click

- The button calls `/api/round-robin?page=<slug>`. [[Round Robin]] picks one **active salesperson with a Telegram username** and sends the visitor straight to `t.me/<username>`.
- Who is picked: the page's team, people on shift and people under their daily limit are **preferred**, but only while someone is left, so a click at night still reaches someone. A **returning visitor** (same browser, within the memory window, 1 month by default) goes back to the same person: no alert and not counted again, but the click is logged, so their chat can still be matched.
- The chat opens with a greeting already typed: **"សួស្តី 👋"** for a visitor in Cambodia or with a Khmer browser, **"Hello 👋"** otherwise. No code, no template. A page that sets its own prefilled text keeps it. The customer still has to tap Send.
- **Search engines, link previews and scripts** (Google, Facebook, Telegram and WhatsApp previews, curl…) that follow the button are sent on without choosing anyone: no alert, no log, no count.
- **Nobody can take it** when Round Robin is off, direct contact routing is off, no active salesperson has a Telegram username, or one internet address made more than 10 clicks of any kind in 10 minutes (counted per server) and has no remembered salesperson. The click then goes to the page's or the company's Telegram contact (Settings), with the same greeting typed. When that contact is the bot or empty, it goes to the **sales bot** with the page name:
  - If Round Robin is on, the bot picks a salesperson (their click count goes up, but **no click is logged**), shows a button to chat with them and says "we reply within 15 minutes in business hours". That salesperson gets an alert with the customer's name; the manager chat gets a copy when CC is on, and always when nobody could be assigned.
  - Without a logged click, the chat that follows is **not matched and makes no lead** (unless Track every new chat is on, step 3). What the customer types to the bot goes only to the company chat in Settings.
- **Korea trip pages are an exception:** their Offer button links straight to one salesperson's t.me account, so none of this process applies there (no alert, no log, no match). The owner decides whether to route them through Round Robin (Open Tasks).

## 2. The bot alerts at the click

- The salesperson gets: **🔔 អតិថិជនថ្មីចុច Telegram មករកអ្នក**, the service (the page title from the CMS), the time, "🌙 ក្រៅម៉ោងធ្វើការ …" when they have working hours and are off shift, and "👉 បើគេផ្ញើសារមក សូមឆ្លើយឱ្យលឿន!". It needs the bot token and the salesperson's **Chat ID** on their Round Robin row, and the salesperson must have pressed Start in the bot once. Pressing Start as a salesperson or from the manager chat gets a confirmation; it is not counted as a customer.
- A copy (salesperson's name and @username, service, time) goes to the chat in **Settings → Instant Telegram Alerts → Target Chat ID** when **Carbon-Copy (CC) Lead Dispatch Alerts to Manager Group** is ticked in Round Robin. Never to the salesperson's own chat. Test clicks from Simulation Studio are marked DEMO.
- A click is **not a lead**. It shows on Team performance as "No chat yet" until the customer writes.

## 3. The customer writes: the account check

Each salesperson's own Telegram account is connected ([[Connect a Telegram Account]]).

- **When it runs:** every 30 seconds while someone has the [[Telegram Inbox]] open in a visible tab; otherwise after site traffic (landing pages, the bot, the admin Leads, Round Robin, Team performance and inbox pages), at most every 2 minutes per account; and with **Check now** (at most every 30 seconds). The tick address and the daily 20:00 job do **not** run it: with no traffic and no inbox open, for example at night, nothing is checked until the next visit.
- **What it reads:** the account's 100 most recent chats, of any kind (pinned first; groups, channels and bots count toward the 100 and are skipped). New people first. For a new person, and for a known person who wrote since the last check while a click to this salesperson is still unmatched, it reads the chat's last 20 messages (up to 8 chats per check) and takes the customer's **first** message since the last check, or since the oldest unmatched click of the last 24 hours if that is earlier. So a salesperson who already answered, or a customer who wrote again, hides nothing. When the first message is only the greeting, their next words are added. If the 8 are used up or Telegram refuses, it uses the customer's latest message when they spoke last, otherwise it looks again next time.
- **Known** people are those in the chat list when the account was connected (200 most recent chats) or seen by an earlier check.
- **Matching:** the chat is linked to the latest unmatched click to the **same salesperson** from 30 minutes before to 1 minute after the customer's first message. Each click and each chat is used once. Order: a new person who sent the greeting, then other new people, then known people. A **known person counts only when their message starts with the greeting** ("សួស្តី 👋" or "Hello 👋"), so an existing customer chatting on never takes a new visitor's click. A chat the **salesperson started** (they wrote first, in the period checked, and the customer did not send the greeting; for example a form lead messaged on Telegram) never takes a click.
- **Then, at once:**
  - the customer becomes a lead in [[Leads CRM]]: name and @username from Telegram, no phone, event type "Telegram chat", status NEW, assigned to that salesperson, with the page, campaign and visit details of the click. One lead per Telegram user: a customer who already has a lead (even Won, Lost, or with another salesperson) keeps it, with a note "Clicked again: <page>" (and "now chatting with <name>" when it is someone else). The lead is not reopened or reassigned.
  - the click shows as a real chat on Team performance ("Messaged us · by time").
  - the bot sends the salesperson **✅ អតិថិជនបានផ្ញើសារមកអ្នកហើយ (ប្រហែលពីការចុចនេះ)**, or **🔁 អតិថិជនចាស់ចុចម្តងទៀត …** for an existing lead: who, the service, their first words (120 characters), the time of their first message, "👉 សូមឆ្លើយឥឡូវ!" or "✔️ បានឆ្លើយរួចហើយ" when the salesperson already answered, and the CRM link. Copy to the Settings chat with CC on.
- **Track every new chat** (per salesperson, in Settings → Telegram account check): a new person who writes **without** a click also becomes a lead ("Telegram (direct)") if their message is less than 7 days old, and the bot sends **💬 អតិថិជនថ្មីផ្ញើសារមកផ្ទាល់** (copy with CC on). People who already have a lead and chats the salesperson started are left out. Turning it on also makes leads of the unmatched new people of the last 7 days that earlier checks saw, without an alert (the reminder covers those still waiting).
- Otherwise a chat with no click to match stays a **contact** only: not a lead, no alert, no reminder. "What the last check saw" lists the six newest chats where the customer spoke last.

## 4. Working the chat

- The [[Telegram Inbox]] lists every Telegram chat lead, newest activity first, with a "needs reply" badge when the customer wrote last (**Hot first** sorts by the AI coach's heat), the live conversation and a reply box that sends from the salesperson's account. A new message shows within about 8 seconds in an active chat (20 to 60 seconds in a quiet one). The same chat is in the lead's drawer in the CRM.
- The conversation is stored in the portal (newest 500 messages per customer), voice messages are turned into text when possible, and the [[Customer Story and AI Coach]] reads it once its key is set.
- Reply numbers per chat: messages each way, first reply time, who spoke last, since when the customer has been waiting. Each check refreshes the open chat leads of the last 30 days whose chat changed, up to 15, the oldest numbers first.
- **Chat leads stay NEW** until someone changes the status: replying in Telegram or the portal does not move them. Ask for the phone in the chat and set Contacted yourself.

## 5. Customer waiting: the reminder

Round Robin → Advanced → **Remind the salesperson when a Telegram customer waits for a reply**: Off, or after 10, **15 (default)**, 30 or 60 minutes. At 15 minutes the page's promise ("replies within 15 minutes in business hours") is already missed; choose 10 to be reminded before it.

- **Waiting** means the customer wrote last. The wait counts from their **first** unanswered message. Any reply ends it, even an emoji; a closing "thanks" from the customer counts as waiting.
- It covers customers who are **leads** (step 3) with an open deal (not Won or Lost) of that salesperson, whose chat is among the 100 most recent. A contact only gets no reminder.
- The bot sends the salesperson **⏳ អតិថិជនរង់ចាំចម្លើយ …**: the customer, the service, when they wrote, how long they have waited, their last words and the inbox link. Once per wait, and **again if the customer writes after that reminder**.
- The manager gets **"Customer still waiting for a reply"** once per wait, if the customer still waits that many minutes **after the salesperson's reminder** (so at twice the time at the earliest, never together with the salesperson). It goes to the **Fallback Manager Telegram Chat ID** (Round Robin), else the Settings chat, whether or not CC is on. A salesperson with no Chat ID: the manager is told at twice the time.
- **Working hours:** nothing is sent while the salesperson is off shift. A message that came in off shift, or so close to closing that the reminder would fall after it, counts from the start of the next shift (Friday 16:50 → Monday 08:15 with a 15-minute setting). A salesperson **without working hours** counts as always on shift, so reminders can come at night: set the hours on their Round Robin card.
- More than 3 reminders due at once for one person arrive as **one list**. A customer whose last message is more than 7 days old gets none.
- Sent at the next account check after the time passes (see the timing in step 3).

## 6. The manager every evening

With a **daily summary hour** set (Round Robin, 17:00–20:00 Phnom Penh; off until set), the manager gets the day's summary: form leads and clicks per salesperson, button taps and reply times, form leads with no reply, and **Telegram chats**: new chats today, answered, average first reply, per salesperson, the Telegram customers still waiting for our reply (last 30 days, longest wait first, with the date when the wait began on another day), and a line naming salespeople whose chats are **not tracked now** (account not connected, or paused by Telegram).

- Counts run from midnight to the moment it is sent; later contacts appear in no summary (only the waiting list catches them).
- It goes to the Fallback Manager Telegram Chat ID, else the Settings chat. A daily job at 20:00 Phnom Penh sends it if traffic has not already done so; the numbers are those of the latest account check. If Telegram refuses the message, the next traffic tries again.

## 7. When an account disconnects

If Telegram ends a connected account's session (for example the "khbportal" device was removed in that person's Telegram), the next check notices it. The portal forgets the session, the settings row shows "Telegram ended the session … Connect the account again", and the bot tells the **manager** (Fallback chat, else Settings chat) and the **salesperson** once. Until it is reconnected, that person's new chats are not tracked, not matched, not reminded and cannot be answered from the portal, **while Round Robin keeps sending them clicks**: switch them Off in Round Robin until they reconnect. Pressing **Disconnect** yourself sends no alert.

## Settings that make this work

- [ ] Round Robin → Advanced: **Where a Chat on Telegram click goes = Straight to the salesperson's chat** (the default). Check each page's own setting too (page settings → Lead Routing: "Same as Round Robin").
- [ ] Settings → Instant Telegram Alerts → **Target Chat ID / Sales Group ID**: the manager or sales group chat. It gets the copies of clicks, form leads and "customer messaged you" when **Carbon-Copy (CC) Lead Dispatch Alerts to Manager Group** is ticked in Round Robin.
- [ ] Round Robin → **Fallback Manager Telegram Chat ID**: gets form leads that cannot reach a salesperson and the manager-only messages (daily summary, customers still waiting, form leads nobody answered, disconnected accounts). Empty: those go to the Settings chat. Simplest: the same chat in both places.
- [ ] Each salesperson's row: **Telegram username** of the **same account** that is connected (compare "Connected as @…" in Settings → Telegram account check; nothing warns you if they differ), and their **Chat ID** for the bot alerts (check with ⚡ Test Ping).
- [ ] Each salesperson has pressed Start in the sales bot once.
- [ ] Settings → Telegram account check: every active salesperson **connected**; **Check the connection** says "Account lock OK". No salesperson Active in Round Robin without a connected account (the readiness check does not look at this).
- [ ] Round Robin: **working hours** for each salesperson, the reminder minutes (default 15) and the daily summary hour.
- [ ] In each salesperson's Telegram: Settings → Devices → **Automatically terminate old sessions → If inactive for**: 6 months (or the longest option).

## Known limits

- **A click with no message is not a lead.** Only a message proves a real person.
- **Timing can swap attributions.** If two people are sent to the same salesperson and both click before either writes (within 30 minutes), the first to write takes the later click. Their page (the service in the alert), ad, location and visit details can be swapped; the lead, its salesperson and the conversation are right.
- **Tracking follows the connected accounts and the checks.** Usually nothing is lost, because matching uses the time of the message, not of the check. But a long exchange (more than 20 messages) or a chat pushed out of the 100 most recent before the next check can be missed, and a check that fails midway can miss a known person's message.
- **A returning customer keeps their old lead**, even Won, Lost or with another salesperson: reopen and reassign it by hand, otherwise there are no reminders and the inbox reads the first salesperson's chat.
- **Two clicks within about a second** can go to the same salesperson, and one count is lost. The routing log is one shared record, so two writes at the same moment can lose a click or a "real chat" mark (rare).
- **Telegram buttons strip the referrer**, so Visitors & Contacts flags many real clicks "no referrer".
- **Opening the bot without a link** (plain Start) names a salesperson and counts a click for them, with no log and no alert.
- **Chat leads do not reach a page's webhook** (form leads do).
- **Smart City page promises:** the button names the coordinator from the CMS ("Message … on Telegram") but Round Robin may pick someone else, and the card promises "Itinerary PDF sent at once": send the PDF in the first reply. Owner decision in Open Tasks.

## Related

[[Round Robin]], [[Telegram Inbox]], [[Leads CRM]], [[Connect a Telegram Account]], [[Customer Story and AI Coach]], [[Bot First Guide]] (the optional bot-first entry, not used in this process), [[Sales Playbook]].
