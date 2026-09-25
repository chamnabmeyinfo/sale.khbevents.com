---
type: feature
tags: [system, feature, round-robin, telegram, sales-team]
updated: 2026-09-24
admin_path: /admin/round-robin
admin_menu: Staff Round Robin
source:
  - src/lib/round-robin.ts
  - src/lib/lead-response.ts
  - src/lib/staff-performance.ts
  - src/components/admin/TeamPerformanceClient.tsx
  - src/app/api/round-robin/daily-summary/route.ts
  - vercel.json
  - src/components/admin/StaffAvailability.tsx
  - src/lib/lead-followup.ts
  - src/app/api/round-robin/tick/route.ts
  - src/app/api/telegram/webhook/route.ts
  - src/lib/staff-cookie.ts
  - src/lib/after-response.ts
  - src/lib/storage.ts
  - src/lib/types.ts
  - src/app/api/round-robin/route.ts
  - src/app/api/round-robin/settings/route.ts
  - src/app/api/round-robin/simulate/route.ts
  - src/app/api/leads/route.ts
  - src/app/admin/round-robin/page.tsx
  - src/components/admin/RoundRobinManagerClient.tsx
  - src/lib/i18n/dict/round-robin.ts
---

# Round Robin

## What it does for sales

Round Robin shares new customers fairly among the sales team. It works for both ways a customer reaches us:

- **Telegram click.** A visitor taps "Chat on Telegram" on a landing page (the floating button, a page button or a popup). They land straight in one salesperson's own Telegram chat, with a first message already typed.
- **Form lead.** A visitor sends the registration form. One salesperson gets the lead card from the company bot on Telegram, with links to open the lead in the CRM and to message the customer on WhatsApp.

A returning visitor or customer goes back to the same salesperson, so a customer never talks to two people. The manager can get a copy of every assignment. How the team then handles the lead: [[Sales Playbook]].

## Where it is in the admin

**Admin → Staff Round Robin** (`/admin/round-robin`). The staff list itself (names, usernames, shares) is managed only there. Do not copy it into this vault.

| Area on the screen | What it is |
|---|---|
| **Readiness check** (top) | Plain-language list of anything that would make a visitor or lead land nowhere |
| **System Enabled** switch | Turns routing on or off (ACTIVE / PAUSED) |
| Tab **Staff Accounts & Percentage Allocation** | The team, each person's share, and the advanced rules |
| Tab **📝 Custom Alert Template (Telegram & WhatsApp)** | The wording of the lead card and of the WhatsApp greeting |
| Tab **Real-Time Routing Audit Log** | Every assignment, with filters |
| Tab **Simulation Studio** | Test a lead, a click, or a batch of 10, 20 or 50 |
| **Save All Settings** | Saves everything on the screen |

## How to use it

To add a person, follow [[Add a Sales Staff Member]]. In short:

- [ ] Click **+ Add Staff Account**.
- [ ] Fill **Staff Full Name**, **Role / Title**, **Telegram @Username** (without the @) and **Telegram Chat ID**.
- [ ] Ask the person to open the company bot in Telegram and press **Start** first. A bot cannot message someone who never pressed Start.
- [ ] Press **⚡ Test Ping** on their card and check they received it.
- [ ] Set the **Routing Percentage Share**. Use **⚖️ Auto-Balance to 100%** to split evenly.
- [ ] Press **Save All Settings**.
- [ ] Read the **Readiness check**. It should say **Ready**.

When someone is on leave, switch their card to **Off** (shown as Paused (0%)). They get no new assignments and the active people share the leads. Switch them back to **Active** when they return.

## The three ways to choose a person

Setting: **Distribution Algorithm** under Advanced Routing Engine Rules & Fallbacks. Default: **Fair Weighted Share**.

| Admin label | Code name | How it chooses |
|---|---|---|
| Fair Weighted Share (Recommended) | `weighted_percentage` | Each person is owed their share of all assignments so far. The one furthest below their share gets the next one. Ties go to whoever waited longest. Nobody gets several in a row while a colleague waits. |
| Strict Round Robin (Sequential 1-by-1) | `strict_round_robin` | One after another in list order. Shares are ignored. |
| Random Weighted Lottery | `random_weighted` | A draw weighted by the shares. Fair on average, not in the short run. |

Details that apply to all three (`selectNextStaff` in `src/lib/round-robin.ts`):

- Only active people count. With one active person, they get everything.
- If every share is 0, it falls back to plain one-after-another.
- Clicks and form leads both count as assignments for the fair share.

## Working hours and page teams

Each staff card has an **availability** row (`StaffAvailability.tsx`; rules `eligibleStaff` in `src/lib/round-robin.ts`):

- **Only during working hours:** days and from–to time, Phnom Penh time (default when switched on: Monday to Saturday, 08:00 to 18:00). The card says "Working now" or "Off now, back …".
- **Serves pages:** tap the landing pages this person serves. None chosen means every page.

How they apply to a new form lead, a Telegram click and the bot:

1. The page's team first (people with that page, plus people with no pages chosen). If nobody on the team can take it, everyone.
2. Then whoever is working now. If nobody is working, the normal rotation still assigns it, so nothing is lost; the lead card then says it arrived outside working hours and when the shift starts.
3. Then the usual fair share among the people left.

- A **returning** visitor or customer stays with their salesperson whatever the hours or teams.
- **Hand-over clock:** for a lead given outside someone's hours, the minutes count from the start of their next shift. Hand-overs only go to people working now, the page's team first. Leads older than 24 hours are not passed on (a Friday-night lead whose owner is back on Monday is the manager's call).
- Pages with their own Round Robin in Dedicated Settings keep using that separate setup.

## Daily limit, Team performance and the daily summary

- **Daily limit** (staff card): most new contacts (form leads plus Telegram clicks) per Phnom Penh day; 0 means no limit. The card shows today's count. People at their limit are skipped while a colleague below it can take the contact; if everyone is at their limit, the rotation continues. Hand-overs also skip people at their limit.
- **Team performance** (`/admin/round-robin/performance`, sidebar **Team Performance**, or the button on the Round Robin page): today, 7, 30 or 90 days. Tiles for form leads and clicks, replied (button tapped), average reply time, won and lost, still waiting. A row per salesperson with share of new contacts, leads, clicks, reply rate and time, the three button outcomes, won, waiting and hand-overs; new contacts per day; and the list of leads still waiting for a reply with links to the CRM. Built from the lead records (`src/lib/staff-performance.ts`); Telegram clicks per person per day are kept in the `staff_click_stats` row for 120 days. Replies start with the buttons (25 Sep 2026).
- **Daily summary to the manager chat** (Advanced rules): Off, or every day at 17:00, 18:00, 19:00 or 20:00 Phnom Penh. One Telegram message with the day's leads and clicks per person, taps and reply times, and the leads still waiting. Sent to the Manager Chat ID (or Fallback, or the company chat) once per day, at or after the chosen time, on site traffic; a Vercel cron at 20:00 (`/api/round-robin/daily-summary`, once a day, allowed on the free plan) sends it if nothing did. If `CRON_SECRET` is set on the server, that address only accepts Vercel's call.

## Who can receive what (eligibility)

| Contact type | The person needs | If nobody qualifies |
|---|---|---|
| Telegram click | A **Telegram username** (the visitor is sent to `t.me/<username>`) | The visitor goes to the fallback destination (below) |
| Form lead (bot token set) | A **Telegram Chat ID** (the bot alert goes there) | The lead is still saved and assigned to an active person, but no alert can be sent; the lead shows the Telegram status as failed. Check the CRM |
| Form lead (no bot token) | Only to be active | No Telegram alert is sent; the lead is saved in [[Leads CRM]] |

## Readiness check

The check at the top of the screen (`roundRobinHealth` in `src/lib/round-robin.ts`) warns about:

| Level | Message | What to do |
|---|---|---|
| Error | Sample accounts still in the team | Remove them. They are demo entries from earlier builds and reach nobody |
| Warning | Round Robin is paused | Clicks go to the fallback, form leads only reach the group chat |
| Error | No active staff | Add at least one person with a username |
| Error | Active member without a Telegram username | They are skipped for clicks |
| Warning | Bot token missing | Clicks still work, but nobody gets alerts |
| Warning | Active member without a Chat ID | They get no alerts and are skipped for form leads |
| Warning | Direct contact routing is off | "Chat on Telegram" skips the team |
| Warning | No manager copy | Set a Manager or Fallback Chat ID |
| OK | Ready | Every active person is reachable and alerts are on |

## Redirect first, alerts after

For a Telegram click, speed matters: the visitor should be in the chat before they lose interest.

1. The server only chooses the person, then sends the redirect at once (`recordDirectContactRoute` in `src/lib/storage.ts`).
2. Counters, the log entry, the alert to the salesperson and the manager copy are written **after** the response (`runAfterResponse` in `src/lib/after-response.ts`, which uses Next.js `after()` so Vercel does not cut the work off).

For a form lead, the alert to the salesperson is sent before the thank-you reply, so its delivery status can be saved on the lead. The manager copy goes after the reply.

## After the assignment: buttons and hand-over

Every form lead card sent to a salesperson has three buttons (`src/lib/lead-response.ts`, `src/lib/lead-followup.ts`):

| Button | Lead status in the CRM | Note added |
|---|---|---|
| ✅ Contacted | NEW becomes CONTACTED (a later status is kept) | Yes, with the response time |
| 📞 No answer | Unchanged; Contacted and Not interested stay available for a later call | Yes |
| ❌ Not interested | LOST | Yes |

- Only the salesperson who currently has the lead can tap; anyone else is told who has it.
- The **response time** is measured from the assignment to the first tap, and shown on the lead in the CRM.
- Setting **Pass a form lead on if nobody responds within**: Off (default), 5, 10, 15, 30 or 60 minutes. With no tap in time, the lead goes to the active colleague with a Chat ID who waited longest and has not had it yet. The first person's buttons change to "Passed to …", they get a short message, and the manager gets a copy when CC is on. The clock restarts for the new person.
- At most **2** hand-overs per lead. After that, or when nobody else can take it, the manager chat gets one "Lead waiting for a reply" alert.
- Only form leads from the last 24 hours that are still NEW and have no tap. Telegram clicks cannot be followed: the visitor chats with the salesperson directly.
- The check runs after normal site traffic (page tracking, the Telegram bot, the admin Leads and Round Robin pages), at most once a minute. For exact timing at night or on quiet days, a free scheduler such as cron-job.org can open `https://sale.khbevents.com/api/round-robin/tick` every 2 to 5 minutes. That address only moves leads that are already overdue.
- The buttons need the bot to receive taps: after this update, press **Register / secure bot webhook** once in Admin → Settings & Security (it asks Telegram for button taps).

## Staying with the same salesperson

Setting: **Remember a visitor for**. Choices: **Off**, **1 month**, **2 months**, **3 months**, **6 months**. Default: **1 month**. A month counts as 30 days.

| How we recognise them | Applies to | Log label |
|---|---|---|
| **Sticky cookie** `khb_rr_staff` in the visitor's browser, set after a click or a form | Clicks and forms from the same browser | Returning visitor |
| **Same phone number or email** as an earlier lead inside the period | Form leads, even from another device | Returning customer |

- Phones are compared by their last 8 digits, so `+855 12 ...` and `012 ...` match. Emails are compared without case.
- A returning visitor who clicks again is sent to the same person without a second alert and without counting again. A returning customer who sends the form again gets a new lead card marked as returning.
- The remembered person must still be able to take the assignment (active, with a username for a click, or a Chat ID for a form lead). If not, the rotation picks someone new.
- With **Off**, the cookie is cleared and every contact re-enters the rotation.
- The lead card tells the salesperson when the customer is returning.

## Fallback destination

When nobody can take a click (routing paused, direct contact routing off, nobody with a username, or too many new clicks from one address), the visitor still reaches us (`resolveFallbackTelegramUrl`):

1. The page's own Telegram contact from its Dedicated Settings, if set; otherwise
2. The company Telegram username from **Admin → Settings & Security**; otherwise
3. The company bot, with a start link that tells the bot which page the visitor came from.

For form leads, **Fallback Manager Telegram Chat ID** receives the lead when the alert to the salesperson fails. **Carbon-Copy (CC) Lead Dispatch Alerts to Manager Group** sends a copy of every assignment to the manager chat.

## Prefilled first message

A Telegram link may carry `&text=...`. The router passes it on as Telegram's `?text=` so the visitor's first message is already typed (at most 500 characters). Bot start links keep their own payload and get no text. The Smart City page uses this for its concierge button.

## Key rules and defaults

Defaults from `defaultRoundRobinSettings` in `src/lib/round-robin.ts`:

| Setting | Default |
|---|---|
| Round Robin enabled | On |
| Distribution Algorithm | Fair Weighted Share |
| Staff list | Empty. No staff ship with the code; the admin adds the real team |
| Enable Direct Visitor Contact Routing | On |
| CC alerts to manager | On |
| Manager and fallback Chat ID | Empty |
| Remember a visitor for | 1 month |
| Alert template | Khmer. Each person can choose Khmer, English or Compact under **🌐 Alert Language** |

Rate limit: one address can trigger at most **10 new click assignments per 10 minutes**. Repeat clicks by a remembered visitor still reach their salesperson. Over the limit, new clicks go to the fallback destination (`src/app/api/round-robin/route.ts`).

## How it works

- Click route: `GET /api/round-robin?page=<slug>` redirects; `&format=json` returns the decision instead.
- Form route: `POST /api/leads` calls `createLead` in `src/lib/storage.ts`.
- Settings are saved by `PUT /api/round-robin/settings`, into the `round_robin` row of `system_settings`. The bot token field on this screen saves to the company settings.
- The log keeps the latest 500 entries locally and the latest 200 in Supabase. The admin screen shows up to 150.
- Rules and algorithms: `src/lib/round-robin.ts`, with tests in `src/lib/__tests__/round-robin.test.ts`.

## Limits and gotchas

- **Simulation Studio** is live, not a sandbox. **Live Lead Dispatch** creates a real lead tagged `[SIMULATION TEST]` and sends a real alert. **Visitor Direct Click** makes a real assignment. **Batch % Benchmark** only calculates and does not change the counters.
- The rate limit lives in server memory, so on Vercel it is approximate.
- A counter update that happens after the redirect can be lost if the server stops at that moment; the visitor still reached the salesperson.

## Related

- Runbooks: [[Add a Sales Staff Member]], [[Rotate the Telegram Bot Token]]
- Features: [[Leads CRM]], [[Ads and Popups]], [[Admin and Security]]
- Sales: [[Sales Playbook]], [[Telegram Reply Templates]]
- Map: [[System Map]]
