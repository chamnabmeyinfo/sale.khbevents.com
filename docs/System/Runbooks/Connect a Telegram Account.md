---
type: runbook
tags: [system, runbook, telegram, sales-team]
updated: 2026-09-28
---

# Connect a Telegram Account

How to connect a salesperson's Telegram account to the portal (Admin → Settings & Security → **Telegram account check**). In the chosen process ([[Telegram Sales Process]]) the connection is what turns a customer's chat into a lead and drives the "customer messaged you" alert, the waiting-customer reminder and the disconnect alert. It also shows the chats in the [[Telegram Inbox]] and sends replies typed in the portal. Background in [[Round Robin]].

## 1. Create the app once (for the whole team)

The **api_id** and **api_hash** identify the portal as an application, not a person. One app is enough for every salesperson. Telegram allows only one app per phone number; if yours already exists, my.telegram.org shows its details instead of the form, and you reuse them.

1. Open **my.telegram.org** on a computer, enter a team phone number with the country code (+855…), and type the code Telegram sends to that phone's Telegram app.
2. Click **API development tools**.
3. Fill the **Create new application** form:

| Field | What to type |
|---|---|
| App title | KHB EVENTS Sales Portal (any name; customers never see it) |
| Short name | letters and digits only, 5–32, no spaces, e.g. `khbsales` |
| URL | https://sale.khbevents.com (optional) |
| Platform | Web (any choice works) |
| Description | Sales portal for the KHB Events team (optional) |

4. Click **Create application**. If Telegram answers only "ERROR": turn off VPN and ad blockers, fill every field, wait a few minutes, try again.
5. Copy **App api_id** (a number) and **App api_hash** (32 letters and digits). Ignore "Available MTProto servers" and the public keys. Keep the hash private: never paste it into a chat or a note.

## 2. Connect each salesperson

On the salesperson's row in Settings → Telegram account check:

1. Enter the app's **api_id** and **api_hash** (the same for everyone; after the first save the hash field shows dots and can stay empty), and **that salesperson's own phone number** with the country code.
2. Press **Send login code**. Telegram sends a code to the salesperson's Telegram app (not SMS).
3. Type the code, and the two-step password if the account has one. Press **Connect**.
4. The row shows "Connected as @username". Telegram also shows a new device "khbportal" under Settings → Devices; that is the portal.

## 3. After connecting

- [ ] Compare "Connected as @…" with the salesperson's **Telegram @Username** on their Round Robin row: they must be the same account. Nothing warns you if they differ, and then customers are sent to one account while the portal reads the other, so nothing is tracked.
- [ ] Press **Check the connection**: it must say "Account lock OK".
- [ ] Press **Check now**, then open **What the last check saw**: recent chats should be listed.
- [ ] Telegram → Settings → Devices → **Automatically terminate old sessions → If inactive for**: 6 months (or the longest option), so a quiet period does not log the portal out.
- [ ] Decide **Track every new chat** and **Auto seen** for this salesperson.

## If something is off

| What you see | Do |
|---|---|
| "The API hash is 32 letters and digits" | copy the hash again from my.telegram.org, without spaces |
| No code arrives | the code comes inside the Telegram app on that phone, from "Telegram"; check the phone number and country code |
| "Telegram ended the session" on the row | the device was removed in Telegram, or logged out; connect again from step 2 |
| "Telegram asked this account to wait until …" | nothing to do; it clears by itself |
| "Request was unsuccessful 1 time(s)" (before 2026-09-28) | fixed: the number lives on another Telegram data centre and the portal now retries there; press Send login code once more |

Never write the api_hash, phone numbers or login codes in the vault or in chats.

## Related

[[Telegram Inbox]], [[Round Robin]], [[Bot First Guide]].
