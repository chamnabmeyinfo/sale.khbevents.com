---
type: runbook
tags: [system, runbook, telegram, round-robin, sales-team]
updated: 2026-09-28
---

# Bot First Guide

How to switch on, test and judge the "bot first" entry for "Chat on Telegram" clicks. Background in [[Round Robin]] → Bot first.

> [!note] Not the chosen process
> Since 2026-09-28 the owner runs **straight to the salesperson**, tracked through the connected accounts, with the bot only alerting and reminding the team: [[Telegram Sales Process]]. Use this guide only to test bot first on a page.

## 1. Before you switch

- [ ] The sales bot must answer **Start**. Open `t.me/khb_sale_admin_bot`, tap Start: it must reply. If it stays silent, register the webhook (Admin → Settings → Telegram, or `POST /api/telegram/setup-webhook`) and try again.
- [ ] Each salesperson in Round Robin has a **Telegram username** (the button "Chat with <name>" links to it) and a **Chat ID** (for the alert).
- [ ] The salesperson's own account is connected in Settings → Telegram account check, so the inbox can read the chat and **Say hello** can send.

## 2. Switch it on

Two ways:

- **Everywhere:** Admin → Round Robin → Advanced → *Where a "Chat on Telegram" click goes* → **To the sales bot first** → Save.
- **One page only (for a fair test):** open the page in the editor → dedicated page settings → *Lead Routing* → *Where this page's Chat on Telegram click goes* → **To the sales bot first**. Other pages keep the Round Robin choice.

## 3. Test it yourself (5 minutes, second phone)

1. On the second phone, open a landing page and tap **Chat on Telegram**. Telegram opens the sales bot.
2. Tap **Start**. Within a second the bot greets you by name in Khmer (if your Telegram is in Khmer) and shows **💬 ជជែកជាមួយ <salesperson>**.
3. Do not tap it yet. On the admin: Leads & CRM → the lead is already there (name, @username, page, salesperson, note "Came through the sales bot"). Team performance → the click shows **Messaged us**. The salesperson's Telegram got the alert "អតិថិជនថ្មីមកពី bot".
4. Telegram inbox → the customer is listed with an empty chat and a ready greeting. Press **Send this hello**: it arrives on the second phone from the salesperson's account.
5. Now tap the bot's button on the second phone and write something: it shows in the inbox within about 8 seconds.
6. Write something to the **bot** instead: the bot repeats the button, the salesperson gets the text, the lead gets a note "Wrote to the bot".
7. Try with a Telegram account that has **no @username**: after the greeting the bot offers **📱 Share my phone number**. Tap it: the number lands on the lead and the salesperson is alerted.

## 4. Judge it after a week

Team performance, per page and per week:

- **Clicks → real chats.** With bot first, "Messaged us · sure" counts everyone who tapped Start, even if they never wrote. Compare with the direct weeks.
- **Leads made** from clicks: CRM leads with source `telegram_chat` per week.
- **Drop at Start:** clicks minus Start taps. If more than a quarter of clickers never tap Start, bot first is costing you; switch that page back to direct.
- **Replies:** the "did we reply" card should improve, because the salesperson can open the conversation instead of waiting.

Keep whichever setting produces more leads in the CRM, not the one that feels nicer.

## 5. What the customer sees, in order

1. Bot: "សួស្តី Sok 👋 Chamnab Mey នឹងជួយអ្នកអំពី Smart City… សូមចុចប៊ូតុងខាងក្រោម" + one button. Nothing else. No questions.
2. (No username only) "ឬចែករំលែកលេខទូរស័ព្ទ…" + phone button.
3. Optionally, a hello from the salesperson's own account if the team pressed **Send this hello**.
4. The conversation with the salesperson, as before.

## 6. If something is off

| What you see | Why | Do |
|---|---|---|
| Bot silent after Start | webhook not registered, or bot token changed | register the webhook, check the token in Settings → Telegram |
| Bot answers with the old generic welcome | the click's code is unknown: the link is old, or the click log was cleared | tap the page button again |
| Lead made but "Say hello" not offered | customer has no @username, or the salesperson's account is not connected | wait for their message, or connect the account |
| Chat not found when sending hello | Telegram cannot find the customer by @username (privacy setting) | wait for their message |
| Salesperson got no alert | Chat ID missing on their Round Robin row, or they never started the bot | fix the row; the salesperson opens the bot once and taps Start |

## Related

[[Round Robin]], [[Telegram Inbox]], [[Leads CRM]], [[Customer Story and AI Coach]].
