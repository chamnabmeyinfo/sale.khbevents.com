---
type: playbook
tags: [sales, playbook, leads]
updated: 2026-09-24
source:
  - src/lib/round-robin.ts
  - src/app/api/round-robin/route.ts
  - src/app/api/leads/route.ts
  - src/lib/storage.ts (createLead, recordDirectContactRoute)
  - src/lib/i18n/dict/leads.ts
  - src/lib/i18n/dict/round-robin.ts
  - src/components/landing/smart-city-content.ts
---

# Sales Playbook

How a visitor becomes a booked seat. Read this before your first shift. The trip facts are in [[Smart City Tea and Cafe Vietnam 2026]].

> [!important] Check live numbers first
> Price, deadlines and seats left change. Check Admin → Landing Pages CMS before you quote them. The admin is the source of truth.

## The promise we make on the page

The page copy makes three promises. Every salesperson keeps them:

1. **No payment today.** The visitor reserves with name and phone only.
2. **A fast reply.** "Coordinator replies within 15 minutes." The coordinator card adds: "Replies within 15 minutes in business hours."
3. **Pay after the call.** The buyer pays only after flights, hotel and factory schedule are confirmed. The official tax invoice and full itinerary are sent on Telegram.

## The lead journey

```
Visitor (ad, popup, link)
   │
   ▼
Landing page  ── /smart-city-tea-cafe
   │
   ├── A. "Chat on Telegram" button ──► Round Robin picks a salesperson
   │                                    ──► visitor lands in YOUR Telegram chat
   │                                    ──► you get a bot alert "a visitor clicked"
   │
   └── B. Registration form ──► lead saved in Admin → Leads & CRM Pipeline (status NEW)
                               ──► Round Robin picks a salesperson
                               ──► you get a lead card on Telegram (name, phone, page)
```

### A. The visitor clicks "Chat on Telegram"

- The button goes to `/api/round-robin?page=<slug>&redirect=true` (`src/app/api/round-robin/route.ts`).
- [[Round Robin]] picks one active salesperson with a Telegram username. The visitor is sent straight to that person's Telegram chat.
- The bot sends the salesperson an alert that a visitor was routed to them. This needs the bot token (Admin → Settings & Security) and the salesperson's Chat ID (Admin → Staff Round Robin). If the manager CC setting is on, the manager gets a copy.
- **The alert has no name or phone.** The visitor appears in your Telegram when they write. Watch your chats and answer fast.
- Nobody reachable? The click goes to the page's or company's Telegram contact, or to the bot. This happens when Round Robin is paused, direct contact routing is off, or no active staff member has a Telegram username. It also happens when one internet address makes more than 10 new clicks in 10 minutes (`rateLimitByIp` in `src/app/api/round-robin/route.ts`).

### B. The visitor sends the form

- On the Smart City page the form asks for full name, phone (Telegram or WhatsApp) and type of business. The visitor can also pick a seat number. There is no email field on that page, so most leads have no email. Other pages built in the CMS can add an optional email field.
- The lead is saved in the CRM with status **NEW** (`createLead` in `src/lib/storage.ts`).
- Round Robin picks a salesperson in this order:
  1. **Returning customer:** same phone number (last 8 digits) or same email as an earlier lead, inside the memory window. Goes to the same salesperson.
  2. **Returning visitor:** same browser that clicked or sent a form before. Goes to the same salesperson.
  3. **Otherwise the rotation.** When a bot token is set, people who can receive the alert (they have a Chat ID) are preferred.
- The salesperson gets a lead card on Telegram (same bot token and Chat ID needed). The default card shows client name, phone, email, company, page, source, a WhatsApp quick link and a link to the lead in the CRM. The "compact" card style shows fewer fields.
- Returning people get an extra line on the card: "Returning customer" or "Returning visitor".
- If Telegram rejects the alert to the salesperson, a warning with the lead goes to the "Fallback Manager Telegram Chat ID" (Admin → Staff Round Robin → Advanced Routing Engine Rules & Fallbacks). If that is empty, it goes to the page's own Telegram chat, then to the chat in Admin → Settings & Security → Instant Telegram Alerts. The lead is marked "Fallback to Manager".
- If the bot token or the salesperson's Chat ID is missing, no alert is sent at all. The lead is still saved in the CRM and marked "Telegram Failed".
- If Round Robin is switched off, the lead goes to the Telegram chat set in Admin → Settings & Security → Instant Telegram Alerts (when alerts are on).

### C. The lead in the CRM

Every form lead is in **Admin → Leads & CRM Pipeline**. See [[Leads CRM]]. Move it through these statuses:

| Status (admin label) | Khmer label | Use it when |
|---|---|---|
| NEW | ថ្មី | The lead just arrived. Nobody has spoken to them yet. |
| CONTACTED | បានទាក់ទង | You reached them by phone, Telegram or WhatsApp. |
| PROPOSAL SENT | បានផ្ញើសំណើ | You sent the itinerary, price and invoice. |
| NEGOTIATING | កំពុងចរចា | They are deciding, asking questions or arranging payment. |
| WON | ជោគជ័យ | Seat paid and confirmed. |
| LOST | បរាជ័យ | They said no, or cannot be reached. Write why in the notes. |

Each lead has **Internal Organizer Notes**, a **WhatsApp Chat** button and a **Direct Call** button. Write a note after every contact.

Telegram click-throughs (route A) are not saved as leads. They appear in Admin → Staff Round Robin → Real-Time Routing Log. Ask the visitor for their name and phone in the chat, and ask them to send the form on the page so the lead is in the CRM.

## Returning visitors stay with their salesperson

Setting: **Admin → Staff Round Robin → Advanced Routing Engine Rules & Fallbacks → "Remember a visitor for"**.

| Option | Effect |
|---|---|
| Off | Every contact re-enters the rotation. |
| 1, 2, 3 or 6 months | Same browser, or same phone or email, goes back to the same salesperson. After this time they re-enter the rotation. |

What the salesperson sees:

- A repeat "Chat on Telegram" click from the same browser goes to the same salesperson with no new alert.
- A form from a returning visitor or customer still sends a lead card, marked "Returning customer" or "Returning visitor".

The admin hint under the setting says "with no second alert". In the code that is true for repeat clicks only (`recordDirectContactRoute` and `createLead` in `src/lib/storage.ts`).

The default in code is 1 month (`DEFAULT_REMEMBER_VISITOR_MONTHS` in `src/lib/round-robin.ts`). A month counts as 30 days.

A remembered salesperson who is paused or unreachable is skipped, and the rotation picks someone else.

## Following up

Suggested rhythm. The owner can change it (see "To confirm").

- [ ] **Within 15 minutes** of a new lead: call. This is the promise on the page.
- [ ] No answer: send the Telegram or WhatsApp message from [[Telegram Reply Templates]] ("First contact after a form lead").
- [ ] After the call: send itinerary and price. Set status to PROPOSAL SENT.
- [ ] After 24 hours with no reply: send the follow-up template.
- [ ] Questions: answer from [[FAQ Answers]]. Never invent an answer. Ask the manager.
- [ ] Paid: confirm the seat, send the tax invoice, set status to WON.

## When the lead has no Telegram

The form field is "Phone (Telegram or WhatsApp)", so some leads use only WhatsApp or phone.

- Call them with the **Direct Call** button in the CRM, or tap the number in the alert.
- Message them with the WhatsApp link in the alert card or the **WhatsApp Chat** button in the CRM.
  - The alert-card link opens with a Khmer greeting that names the customer, you and the page. The text is editable in Admin → Staff Round Robin.
  - The CRM button opens with a short English greeting.
- Send the same content as the Telegram templates by WhatsApp.
- Write in the lead notes which app they use.

## Daily routine

### Salesperson

- [ ] Open Telegram. Check the bot alerts and your chats from the night.
- [ ] Open Admin → Leads & CRM Pipeline, tab **NEW Requests**. Nothing should stay NEW for more than 15 minutes in business hours.
- [ ] Check live price, deadlines and seats left in Admin → Landing Pages CMS before quoting.
- [ ] Reply to every chat. Use [[Telegram Reply Templates]].
- [ ] Update the status and add a note on every lead you touched.
- [ ] Before you leave: follow up on every lead in CONTACTED or PROPOSAL SENT with no reply for 24 hours.

### Manager

- [ ] Admin → Staff Round Robin: the readiness check at the top should say **Ready**. Fix any red item.
- [ ] Everyone on shift is active. Everyone off shift is paused.
- [ ] Every active salesperson has a Telegram username and a Chat ID (press **Test**).
- [ ] Admin → Leads & CRM Pipeline: no lead left in NEW. Reassign or call if one is.
- [ ] Look for "Fallback to Manager" or "Telegram Failed" on leads. Someone's alert did not arrive.
- [ ] Update "Claimed Seats" in Admin → Landing Pages CMS when a seat is taken. The number does not change by itself; the page shows whatever the admin holds.
- [ ] Adding a new team member: [[Add a Sales Staff Member]].

## Rules

- Quote only what the page and [[FAQ Answers]] say. No discounts unless the owner approves them.
- Never promise a result, supplier or number that is not in the copy.
- Never share one customer's details with another.
- No customer phone numbers or names in this vault.

## Related

[[Round Robin]] · [[Leads CRM]] · [[FAQ Answers]] · [[Telegram Reply Templates]] · [[Smart City Tea and Cafe Vietnam 2026]] · [[Glossary]]

## To confirm

- [ ] Owner to approve the follow-up rhythm above (15 minutes, 24 hours).
- [ ] What are business hours for the 15-minute promise?
- [ ] Who may change "Claimed Seats" in the admin?
- [ ] Do salespeople have their own admin login, or does the manager update the CRM for them?
