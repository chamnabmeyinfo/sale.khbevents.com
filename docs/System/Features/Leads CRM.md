---
type: feature
tags: [system, feature, crm, leads]
updated: 2026-09-24
admin_path: /admin/leads
admin_menu: Leads & CRM Pipeline
source:
  - src/app/admin/leads/page.tsx
  - src/app/api/leads/route.ts
  - src/app/api/leads/[id]/route.ts
  - src/components/admin/LeadsCrmClient.tsx
  - src/lib/storage.ts
  - src/lib/types.ts
  - src/lib/csv.ts
  - src/lib/rate-limit.ts
  - src/lib/i18n/dict/leads.ts
---

# Leads CRM

## What it does for sales

Every inquiry from the website lands here, whether it came from a landing page form or from the home page. Each lead shows who the customer is, which page they came from, which ad brought them, which salesperson got them, and every note the team wrote. Sales moves each lead through the pipeline until it is won or lost. How to work a lead: [[Sales Playbook]].

Customer data lives only in the CRM. Never copy names, phone numbers or emails from the CRM into this vault.

## Where it is in the admin

**Admin → Leads & CRM Pipeline** (`/admin/leads`). Sidebar shortcuts: All Inquiries Pipeline, New Client Requests (`?status=NEW`), In Negotiation (`?status=NEGOTIATING`), Won Event Contracts (`?status=WON`).

A Telegram lead alert links to `/admin/leads?id=<lead id>`, which opens that lead directly.

## The pipeline

| Status | Tab in the CRM | Meaning |
|---|---|---|
| `NEW` | 🔥 NEW Requests | Just arrived. Every new lead starts here |
| `CONTACTED` | 📞 Contacted | We spoke with the customer |
| `PROPOSAL_SENT` | 📝 Proposals | Offer, itinerary or invoice sent |
| `NEGOTIATING` | 💼 In Negotiation | Discussing terms |
| `WON` | 🏆 Won Deals | Booked |
| `LOST` | 📁 Closed / Lost | Not travelling this time |

## How to use it

- [ ] Open **New Client Requests** first.
- [ ] Filter with the status tabs, the campaign drop-down, the tag filter or the search box (name, phone, company, tags, message).
- [ ] Open a lead with **View Details & Notes**.
- [ ] Contact the customer with **WhatsApp Chat** or **Direct Call** from the lead drawer. Reply wording: [[Telegram Reply Templates]].
- [ ] Change the **Pipeline Status** as the deal moves.
- [ ] Add a note in **Internal Organizer Notes** after every contact.
- [ ] Use **Export … Leads to CSV** for a meeting or a spreadsheet.
- [ ] Delete only spam or test leads with **Delete Lead**. It cannot be undone.

## What a lead record shows

| Part | Where it comes from |
|---|---|
| Name, phone, email, company, message, package interest | The form. Name and phone are required; the rest is optional |
| Campaign source | The landing page the form was on (`general` when no page is given) |
| Marketing Attribution (UTM source, campaign) | The `utm_` parameters of the visitor's link. See [[Tracking and Analytics]] |
| Visitor country, city, region | Location headers added by Vercel (country also from Cloudflare) |
| Automated CRM Tags | The page's **Automatic CRM Lead Tags** in its Dedicated Settings. See [[Landing Pages CMS]] |
| Round Robin Staff Assignment | Who got the lead, their share, Telegram delivery status, and "Returning customer" or "Returning visitor" when the lead was kept with an earlier salesperson. See [[Round Robin]] |
| Internal Organizer Notes | Notes typed by the team, newest first, with time and author |

## Key rules and defaults

- A new lead starts with status `NEW` and event type `General Inquiry` when none is given (`createLead` in `src/lib/storage.ts`).
- One visitor can send at most **5 forms per 10 minutes** from the same address. After that they see a message asking them to wait or to call or message us directly (`src/app/api/leads/route.ts`).
- **Telegram alerts for a new lead:**
  - When [[Round Robin]] is on, the chosen salesperson gets a lead card from the bot, and the manager chat gets a copy if that option is on.
  - When Round Robin is off, the lead card goes to the chat set in **Admin → Settings & Security → Instant Telegram Alerts** (or the page's own chat), but only if **Enable Telegram Bot Notification Alerts for New Inquiries** is on (or the page's own alert switch, when set).
- **Outgoing webhook.** If a page has a webhook URL in its Dedicated Settings, each lead from that page is also sent there after the response.
- **CSV export** includes a byte-order mark so Excel shows Khmer text correctly. Cells that start with `=`, `+`, `-` or `@` get a leading apostrophe, so a spreadsheet never runs them as formulas (`src/lib/csv.ts`).
- Only a logged-in admin can read, change or delete leads. Anyone can create one through the form.

## How it works

- The public form posts to `POST /api/leads`. `createLead` in `src/lib/storage.ts` builds the lead, runs the round robin, sends the alerts, and saves the lead.
- In production the lead is saved to the Supabase `leads` table. If that save fails, the lead is kept in the local copy, marked as unsynced, still shown in the CRM, and retried the next time the CRM loads leads.
- Status changes and notes go to `PATCH /api/leads/<id>`. Deleting goes to `DELETE /api/leads/<id>`.
- The screen is `src/components/admin/LeadsCrmClient.tsx`.

## Limits and gotchas

- On Vercel the local copy lives in a temporary folder. A lead that failed to reach Supabase can be lost if the server instance stops before the retry. A Supabase outage is therefore worth checking in the CRM right away.
- Leads created by the **Simulation Studio** in [[Round Robin]] are real leads in the CRM. Delete them after testing.
- The rate limit is kept in server memory. On Vercel each server instance counts separately, so it is a rough limit, not an exact one.

## Related

- [[Sales Playbook]], [[Telegram Reply Templates]], [[FAQ Answers]]
- [[Round Robin]], [[Tracking and Analytics]], [[Admin and Security]]
- [[System Map]]
