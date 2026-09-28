---
type: feature
tags: [system, feature, round-robin, telegram, sales-team]
updated: 2026-09-28
admin_path: /admin/round-robin
admin_menu: Staff Round Robin
source:
  - src/lib/round-robin.ts
  - src/lib/lead-response.ts
  - src/lib/staff-performance.ts
  - src/components/admin/TeamPerformanceClient.tsx
  - src/components/admin/VisitorContacts.tsx
  - src/lib/visitor-detail.ts
  - src/lib/telegram-account.ts
  - src/lib/contact-verify.ts
  - src/components/admin/TelegramAccountPanel.tsx
  - src/app/api/telegram-account/route.ts
  - src/app/api/round-robin/daily-summary/route.ts
  - vercel.json
  - src/components/admin/StaffAvailability.tsx
  - src/components/admin/StaffSummary.tsx
  - src/components/admin/AvatarUpload.tsx
  - src/components/admin/StaffAvatar.tsx
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

## Staff list views and photos

- **Views** (switch above the staff list, remembered in this browser): **Detailed** (the full cards), **Compact list** (one row per person with share, counts and status chips) and **Grid** (tiles with a big photo). In Compact list and Grid, **Edit** opens that person's full card; **Done editing** closes it. Active and Test Ping work from every view.
- **Photo** (the round picture with a camera button, in every view): pick an image; it is shrunk to 400 px and uploaded to the photo library, then saved with **Save All Settings**. × removes it from the card. Without a photo the card shows initials on a colour. The photo appears on Team performance too.
- The photo library counts a staff photo as in use ("Staff photo: name") and asks before deleting it. Only an upload on this site or an https address is saved as a photo.

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
- **Daily summary to the manager chat** (Advanced rules): Off, or every day at 17:00, 18:00, 19:00 or 20:00 Phnom Penh. One Telegram message with the day's leads and clicks per person, taps and reply times, and the leads still waiting; since 2026-09-28 also the **Telegram chats**: new chats today, answered, average first reply per person, and the Telegram customers still waiting for a reply (last 30 days). Sent to the Manager Chat ID (or Fallback, or the company chat) once per day, at or after the chosen time, on site traffic; a Vercel cron at 20:00 (`/api/round-robin/daily-summary`, once a day, allowed on the free plan) sends it if nothing did. If `CRON_SECRET` is set on the server, that address only accepts Vercel's call.

## Who reached the team (visitor details)

On **Team performance**, under the per-salesperson table: every Telegram click and form lead sent to a salesperson in the chosen period, one row each (`VisitorContacts.tsx`, rules in `src/lib/visitor-detail.ts`).

| Column | Where it comes from |
|---|---|
| Time, CLICK / FORM, returning | The routing log |
| Device & browser | The browser string (phone, tablet, computer, bot; Chrome, Safari…; the app it was opened in: Telegram, Facebook, TikTok…) |
| Location & IP | The network address and Vercel's country, region and city headers (city level, roughly; a VPN or a mobile network can be off) |
| Came from | The `utm_` tags of the page the visitor clicked from, else the app, else the referring site, else "direct". A tracked visit adds time on page and scroll depth |
| Sent to | The salesperson |
| Looks like | **Real person**, **Check** or **Bot** |

**Real person / Check / Bot** is a rule of thumb, not a proof: Bot when the browser string is a known crawler, link-preview fetcher or script (Facebook and Telegram link previews, curl, headless browsers…); Check when no browser string was sent, the click did not come from one of our pages (no referrer, or another website), 5 or more contacts came from the same address in the period, or the click came within 3 seconds of arriving without scrolling; otherwise real. A visit that shows real reading outweighs a missing referrer. Open a row for the full detail (browser string, referrer address, campaign tags, visit and browser ids, Telegram alert result, log id) and the reasons behind the verdict.

The landing pages set two cookies (`khb_sid` for the visit, `khb_vid` for the browser) so a click, a plain link, can be tied to the visit that the campaign report tracks. Returning visitors' clicks are logged too (marked "Returning visitor"; nobody is alerted and nothing is counted twice). The log keeps the last 500 entries; location, referrer and campaign are recorded from 27 Sep 2026, older entries show only the IP address and the browser. Only the admin sees this list; the campaign report stays anonymous.

## Telegram account check: did the visitor really message us? (2026-09-27)

A click only opens the salesperson's Telegram chat; Telegram tells the website nothing about the person. The only proof of a real customer is a message from them. So each salesperson connects their **own Telegram account** and the portal watches it for new chats. This is the tracking half of the chosen process, described end to end in [[Telegram Sales Process]].

**Set-up** (Admin → Settings & Security → **💬 Telegram account check**, steps in [[Connect a Telegram Account]]): one app from my.telegram.org (*App api_id* and *api_hash*) serves the whole team; on each salesperson's row enter them with that salesperson's phone number, press **Send login code**, type the code Telegram sends to their app (and the two-step password if they have one), press **Connect**. The Telegram username on the salesperson's Round Robin row must belong to the same account. Telegram then shows the portal under Settings → Devices as "khbportal"; it can be ended there any time. The login session is stored in the `tg_account:<staffId>` row of `system_settings`, next to the bot token, so the RLS lockdown matters.

**How it works once connected** (`src/lib/telegram-account.ts`, matching rules in `src/lib/contact-verify.ts`):
1. Every click is saved on the log entry and the chat opens with a plain greeting already typed: "សួស្តី 👋" for visitors in Cambodia or with a Khmer browser, "Hello 👋" otherwise (since 2026-09-27, later the same day; the earlier three-line template with a `#K7X2M` code was dropped because customers did not like it). The chat is matched to the click by timing.
2. The click alert to the salesperson is short and in Khmer: the service (page title), the time, and "if they write, please reply fast" (no code since 2026-09-28: the customer's message carries none). The manager CC is the same with the salesperson's name and @username.
3. The check runs every 30 seconds while the Telegram inbox is open, otherwise with site traffic at most every 2 minutes per account, and with **Check now** (at most every 30 seconds). It reads the account's 40 most recent chats. A person not seen before is a new contact: the check reads the start of their chat to find their **first** message (up to 8 chats per check, since 2026-09-28), so a salesperson who answered before the check, or a customer who wrote again later, still counts. A person already known (in the chat list at connection time, or seen by an earlier check) counts too when they write within 30 minutes after a click on our pages; otherwise a known person chatting on is an existing customer. Bots, groups and the account's own messages are ignored. The settings row shows **What the last check saw** (chats read, new and known people, matches, leads) and **Check the connection** tests the account lock.
4. A chat whose customer's first message came within 30 minutes after a click to the same salesperson is a match (**Probably messaged**); the latest unmatched click wins. A message that still contains an old-style code is a sure match (**Messaged us**). Each click and each chat is used once.
5. On a match the salesperson (and the manager, when CC is on) gets a second short alert: who wrote (name, @username), the service, their first message, the time.
6. Team performance shows a **Chat** column and a "Became a real chat" box; a confirmed chat marks the click as a real person.

What is kept per new contact: the customer's name, @username, user id, the time of the first message and its first 200 characters. For chat leads the conversation itself is also stored ([[Customer Story and AI Coach]]), and replies typed in the portal are sent from the account ([[Telegram Inbox]]). A visitor who clicks but never writes stays "No chat yet"; there is no way to see an opened chat that was never used. A customer with no @username shows by name and id. **Disconnect** logs the portal out on Telegram's side.

**Every confirmed chat is a lead** (since 2026-09-27, later the same day): the check makes a CRM lead for the customer (name and @username from Telegram, no phone until the salesperson asks for it; event type "Telegram chat"; tag `telegram`; assigned to the salesperson of the click; the first message as the lead's message; campaign, location and visit ids from the click). One lead per Telegram user: a second click by the same person adds a note "Clicked again" instead. The "customer messaged you" alert ends with the CRM link. Chat leads do not count as form leads on Team performance.

**Track every new chat** (checkbox on the salesperson's row in the settings tab, off by default): customers who write directly, without a click (from a Facebook post, a referral), also become leads, with page "Telegram (direct)", tag `telegram` and source `telegram_direct`, assigned to that salesperson. People already in the chat list when the account was connected, bots and groups are never included. Off: only chats that follow a click.

**Did we reply?** For open chat leads of the last 30 days (at most 15 per check, the oldest numbers first, among the account's 40 most recent chats), the check reads the last 60 messages of the chat, stores them with the conversation, and keeps the numbers on the lead (`routing.chat`): messages from the customer and from us, the customer's first message, our first reply and the seconds between, the last message and who sent it, since when the customer has been waiting, Telegram's unread count. Team performance shows a card **Telegram chats: did we reply?**: chats started, answered at least once, average first reply, waiting for our reply now, quiet for 3+ days, won and lost, per salesperson; and the list of customers waiting for a reply (the longest wait first) with CRM links. The visitor list shows the same numbers per click.

**Read and answer the chat itself:** the lead drawer in [[Leads CRM]] and the [[Telegram Inbox]] show the live conversation (both sides, times, attachment kinds) through the connected account, kept fresh while on screen (a new message shows within about 8 seconds), with a reply box that sends from the salesperson's account; a note on the lead records each portal reply. **Auto seen** (switch on the salesperson's row, off by default) marks the customer's messages as read on Telegram while a person looks at the chat in the portal.

**Keeping the account safe** (since 2026-09-27, later the same day): every use of the account takes a short lease first, so two servers or two admins never open the same session at once (Telegram would end it); connections are short; when Telegram says "wait N seconds" the account is left alone until then (the row shows the time, Check now and replies say wait); when Telegram ends the session, the row shows "Connect the account again" and nothing more is read. Check now runs at most every 30 seconds. Details in [[Telegram Inbox]].

The check runs after normal site traffic together with the lead follow-up check (page tracking, the bot, the admin Leads, Round Robin, Team performance and Telegram inbox pages), at most every 2 minutes per account; every 30 seconds while the Telegram inbox is open; and on **Check now**. With no traffic (at night) it waits for the next visit; matching uses the message time, so nothing is lost.

**Waiting-customer reminder** (since 2026-09-28; Advanced → "Remind the salesperson when a Telegram customer waits for a reply": Off, 10, **15 (default)**, 30 or 60 minutes): when a chat lead's customer wrote last, the bot reminds the salesperson once per wait (counted from the customer's first unanswered message), during the salesperson's working hours only (off-shift messages count from the next shift start); the manager chat gets "Customer still waiting" at twice the time. Sent at the next check after the wait passes; a wait longer than 24 hours of shift time, or a message older than 7 days, is left to the daily summary.

**Account disconnected** (since 2026-09-28): when Telegram ends a connected session, the bot tells the manager chat and the salesperson once, and the row asks to connect again.

## Bot first: the sales bot greets and hands over (2026-09-27, optional)

Not the chosen process: since 2026-09-28 the owner runs **straight to the salesperson** with account tracking ([[Telegram Sales Process]]). Bot first stays available per page for tests.

**Round Robin → Advanced → Where a "Chat on Telegram" click goes.** Two choices:

- **Straight to the salesperson's chat** (default): the chat opens with a plain greeting; the lead is made when the account check sees the customer's message (by timing within 30 minutes).
- **To the sales bot first, then one button to the salesperson**: the click sends the visitor to the bot with a short code in the link (`t.me/khb_sale_admin_bot?start=k_7X2M`). When they tap Start, Telegram tells the bot exactly who they are. The bot then, in one message and with no questions: greets them by name (Khmer for Khmer-language Telegram, English otherwise), names the salesperson and the trip, and shows one button **💬 Chat with <name>** to the salesperson's chat. In the same moment the portal makes the lead in [[Leads CRM]] (name, @username, Telegram id, page, salesperson; source `telegram_chat`, match "ref"), marks the click as a real chat on Team performance, and sends the salesperson a short Khmer alert (manager CC as usual). If the customer writes to the bot instead of tapping, the bot keeps the words as a note on the lead, alerts the salesperson and shows the button again. A second click by the same person adds a "Clicked again" note, never a second lead.

Because the customer is identified before they write to the salesperson, the later chat is tracked by Telegram id with no guesswork: the account check refreshes the numbers and the [[Telegram Inbox]] shows the conversation, and the check never makes a second contact for them.

**Say hello** (since 2026-09-27, later the same day): a bot-entry customer who tapped Start but never wrote shows in the [[Telegram Inbox]] with an empty chat and a ready Khmer greeting naming them, the salesperson and the trip ("សួស្តី Dara 👋 ខ្ញុំ Chamnab Mey ពី KHB Events…"). **Send this hello** sends it once from the salesperson's own account; **Edit first** puts it in the reply box. Only possible when the customer has a public @username. Without one, the bot's greeting is followed by a one-tap **📱 Share my phone number** button; a shared number lands on the lead, the salesperson is alerted with it, and the customer is thanked.

**Per page:** each landing page can choose its own entry under the page's dedicated settings → Lead Routing → "Where this page's Chat on Telegram click goes" (same as Round Robin, direct, or bot first), so bot first can be tested on one page against direct on another.

Trade-off: one extra tap (Start, then the button). Test it on real traffic and compare "Became a real chat" on Team performance with the direct setting. The bot is `@khb_sale_admin_bot` (its webhook must be registered, see the Telegram bot set-up); an old link with a code the portal no longer holds falls back to the bot's plain welcome. The step-by-step guide for the owner is [[Bot First Guide]].

## Telegram inbox

Every Telegram customer, the live conversation (fresh by itself while on screen), Auto seen per salesperson and a reply box that sends from the salesperson's connected account: [[Telegram Inbox]]. Telegram is the only live-chat channel; there is no chat window on the website (owner decision, 2026-09-27).

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
