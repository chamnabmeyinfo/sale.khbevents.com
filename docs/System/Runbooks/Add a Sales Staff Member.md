---
type: runbook
tags: [runbook, round-robin, telegram, sales-team]
updated: 2026-09-24
who: Owner or Sales lead, with the new staff member
source:
  - src/components/admin/RoundRobinManagerClient.tsx
  - src/lib/round-robin.ts
  - src/lib/i18n/dict/round-robin.ts
  - src/app/api/round-robin/test
---

# Add a Sales Staff Member

## What this is for

New customers are shared among the sales team by [[Round Robin]]. A salesperson gets customers only after they are added here. Once added, visitors who tap **Chat on Telegram** can land in their Telegram chat, and they get a lead card from the company bot when a form comes in.

**Who normally does it:** the owner or the sales lead, together with the new staff member (they need their phone for two steps).

## Before you start

- [ ] The new staff member has a Telegram account with a **username** (Telegram → Settings → Username).
- [ ] You can log in to the admin.
- [ ] The company bot token is already set. If the readiness check says "Bot token missing", see [[Rotate the Telegram Bot Token]] first.

Keep the staff list in the admin only. Do not copy names, usernames or Chat IDs into this vault.

## Steps

- [ ] **1.** Open **Admin → Staff Round Robin** (`/admin/round-robin`), tab **Staff Accounts & Percentage Allocation**.
- [ ] **2.** Click **+ Add Staff Account** (or **+ Add Another Staff Member**). A new card appears.
- [ ] **3.** Fill **Staff Full Name** and **Role / Title**.
- [ ] **4.** Fill **Telegram @Username** without the `@`. Visitors who tap "Chat on Telegram" are sent to this username.
- [ ] **5.** Ask the staff member to open the **company bot** in Telegram and press **Start** (send `/start`). A bot cannot message someone who never pressed Start. The bot's username is shown in the admin **Guide**, in the Settings section.
- [ ] **6.** Get their **Telegram Chat ID**. The screen says "via @userinfobot": the staff member opens `@userinfobot` in Telegram and presses Start; it replies with their numeric ID. They send you that number.
- [ ] **7.** Paste the number into **Telegram Chat ID**.
- [ ] **8.** Optional: choose their **🌐 Alert Language** (Global template, Khmer, English or Compact).
- [ ] **9.** Press **⚡ Test Ping** on their card. Wait for "Connection Verified!" and ask them to confirm the message arrived.
- [ ] **10.** Set their **Routing Percentage Share**. Press **⚖️ Auto-Balance to 100%** to split evenly among active staff. The total should show **✓ Balanced**.
- [ ] **11.** Make sure their card is switched to **Active**.
- [ ] **12.** Press **Save All Settings** at the top of the screen.
- [ ] **13.** Read the **Readiness check** at the top. It should say **Ready**.

## Check it worked

- [ ] The readiness check says **Ready** ("… active members, every one reachable, alerts on").
- [ ] Test Ping showed "Connection Verified!" and the staff member got the message.
- [ ] Optional: in **Simulation Studio**, run a **Live Lead Dispatch**. It creates a real lead tagged `[SIMULATION TEST]` and sends a real alert. Delete that lead in [[Leads CRM]] afterwards.

## Readiness check messages and fixes

| Message | Fix |
|---|---|
| Sample accounts still in the team | Press **Remove … sample account(s), then Save**. They are demo entries and reach nobody. |
| No active staff | Add at least one person with a Telegram username and switch them to Active. |
| Active member without a Telegram username | Fill **Telegram @Username** for that person. |
| Bot token missing | Set the bot token. See [[Rotate the Telegram Bot Token]]. |
| Active member without a Chat ID | Steps 5 to 9 for that person. |
| Round Robin is paused | Switch **System Enabled** to **ACTIVE**. |
| Direct contact routing is off | Tick **Enable Direct Visitor Contact Routing** under Advanced Routing Engine Rules & Fallbacks. |
| No manager copy | Fill **Fallback Manager Telegram Chat ID** (a manager or group chat) under Advanced rules. |

## If something goes wrong

| Problem | What to do |
|---|---|
| Test Ping shows "Failed to Ping …" for one person | Read the error Telegram returned. Most often the staff member has not pressed Start in the company bot, or the Chat ID is wrong. Repeat steps 5 to 7. |
| Test Ping fails for everyone, or says "Telegram Bot Token is missing." | The bot token is missing, wrong or was changed. See [[Rotate the Telegram Bot Token]]. |
| The staff member gets no customers | Check their card is **Active**, has a username, and has a share above 0%. |
| Someone leaves the company | Switch their card to **Off**, or delete it, then **Save All Settings**. The screen keeps at least one staff account. |
| Someone is on leave | Switch their card to **Off** (Paused 0%). Switch back to **Active** when they return. |

## To confirm

- The repo only says "via @userinfobot". The steps in step 6 (open it, press Start, it replies with the numeric ID) come from how that Telegram bot works in general. Check them with the first new staff member.

## Related

- [[Round Robin]], [[Leads CRM]], [[Sales Playbook]], [[Telegram Reply Templates]]
- [[Rotate the Telegram Bot Token]], [[Admin and Security]]
- [[Open Tasks]]
