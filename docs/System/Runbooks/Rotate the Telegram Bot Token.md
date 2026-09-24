---
type: runbook
tags: [runbook, security, telegram]
updated: 2026-09-24
who: Owner (the BotFather part needs the Telegram account that owns the bot)
source:
  - src/components/admin/SettingsClient.tsx
  - src/app/api/settings/route.ts
  - src/app/api/telegram/setup-webhook/route.ts
  - src/app/api/telegram/webhook/route.ts
  - src/lib/auth.ts
  - src/components/admin/RoundRobinManagerClient.tsx
  - src/lib/i18n/dict/settings.ts
  - src/lib/i18n/dict/round-robin.ts
  - src/lib/i18n/dict/editor-extras.ts
  - README.md
  - CPANEL_DEPLOYMENT.md
---

# Rotate the Telegram Bot Token

## What this is for

The company bot sends every lead alert to the sales team and answers visitors. Whoever holds its token controls the bot: they can read what it receives and send messages in its name.

The current token was exposed. It was committed in `data/db.json` in the past, and git keeps old versions forever. Deleting it from the file does not help. The only fix is a new token, which makes the old one useless. This is an open task in [[Open Tasks]].

**Who normally does it:** the owner, because BotFather only works from the Telegram account that created the bot.

## Before you start

- [ ] You are logged in to Telegram with the account that owns the company bot.
- [ ] You are logged in to the admin at `sale.khbevents.com/admin`.
- [ ] Pick a quiet time. Between step 2 and step 6, lead alerts stop. Leads are still saved in [[Leads CRM]].
- [ ] Never paste the token into this vault, a chat, an email, code or `data/db.json`. It goes only into the admin field.

## Steps

**Part 1: get a new token from BotFather**

- [ ] **1.** In Telegram, open `@BotFather`.
- [ ] **2.** Send `/revoke` and choose the company bot. BotFather replies with a new token. The old token stops working at once.
- [ ] **3.** Copy the new token. Keep the BotFather chat open until step 6.

**Part 2: put the new token in the admin**

- [ ] **4.** Open **Settings & Security** in the sidebar, tab **🤖 Instant Telegram Alerts** (sidebar shortcut **Telegram Alert Bot**).
- [ ] **5.** In **Telegram Bot Token**, delete everything in the box (it shows a masked placeholder of the old token), then paste the new token.
- [ ] **6.** Press **Save All Settings**. Wait for "Settings successfully saved and synchronized across the portal!".

**Part 3: reconnect the bot to the website**

- [ ] **7.** On the same tab, press **Register / secure bot webhook**.
- [ ] **8.** Wait for the green message "Connected: https://sale.khbevents.com/api/telegram/webhook".

The webhook's secret is made from the bot token. A new token needs a new registration, or the bot stops answering visitors who open it.

**Part 4: check every page and test**

- [ ] **9.** Open **Admin → Landing Pages CMS**. For each page, open the tab **⚙️ Dedicated Settings**, then **🔔 Lead Routing & Webhooks** (section *Isolated Telegram Lead Alerts & Webhooks*). If **Custom Telegram Bot Token (Optional)** holds a token, replace it with the new one or clear it. Save the page.
- [ ] **10.** Open **Admin → Staff Round Robin**. Press **⚡ Test Ping** on each staff card. Each should say "Connection Verified!".
- [ ] **11.** Read the **Readiness check**. It should say **Ready**.

## Check it worked

- [ ] "Connected: …/api/telegram/webhook" appeared after step 8.
- [ ] Test Ping works for every active staff member.
- [ ] Open the company bot in Telegram yourself and send `/start`. The bot answers.
- [ ] Send one test form on a landing page. The assigned salesperson gets the alert. Delete the test lead afterwards.
- [ ] Tick the task in [[Open Tasks]] and note the date in [[Decision Log]] or the session log (the date only, never the token).

## If something goes wrong

| Problem | What to do |
|---|---|
| "No Telegram Bot Token configured. Set it in Admin → Settings & Security." | The token was not saved. Repeat steps 5 and 6, then press the webhook button again. |
| Webhook registration shows an error from Telegram | The token is wrong or incomplete. Copy it again from BotFather, save, and retry. |
| Test Ping says "Telegram Bot Token is missing." | Save the token first (step 6). The Round Robin screen also has a **Telegram Bot Token** field under Advanced rules; it saves to the same company setting. |
| Alerts reach nobody after the change | A page may still hold the old token in its Dedicated Settings (step 9). |
| You lost the new token before saving it | Run `/revoke` again in BotFather. Each new token cancels the one before. |

## To confirm

The BotFather steps come from how Telegram works in general, not from this repository. Check them the first time you do this:

- Does `/revoke` in BotFather give a new token and stop the old one at once?
- Can only the Telegram account that created the bot use BotFather for it?

## Related

- [[Round Robin]], [[Add a Sales Staff Member]], [[Leads CRM]]
- [[Admin and Security]], [[Change the Admin Password]], [[Run the RLS Lockdown Migration]]
- [[Open Tasks]]
