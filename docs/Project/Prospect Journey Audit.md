---
type: audit
tags: [project, audit, tracking, crm, round-robin, ai]
updated: 2026-09-28
source:
  - src/components/common/LandingPageTracking.tsx
  - src/components/common/attribution.ts
  - src/lib/visits.ts
  - src/lib/campaign-analytics.ts
  - src/app/api/round-robin/route.ts
  - src/lib/storage.ts
  - src/lib/telegram-account.ts
  - src/lib/contact-verify.ts
  - src/lib/lead-followup.ts
  - src/lib/lead-response.ts
  - src/app/api/telegram/webhook/route.ts
  - src/lib/ai-analyst.ts
  - src/lib/ai-store.ts
  - src/lib/types.ts
---

# Prospect Journey Audit

How one prospect is tracked today from the ad to the closed deal, where the trail breaks, and what to build so the system can read prospect behaviour and the bot can follow up with the sales team. Written 2026-09-27 at the owner's request. Decisions that follow from it go in [[Decision Log]]; work items in [[Open Tasks]].

> [!note] Status on 2026-09-28
> Much of Phase 1 is live, and the process in force is [[Telegram Sales Process]]: a Telegram chat becomes a CRM lead, reply numbers are kept, the conversation itself is stored (the owner reversed "numbers only" on 2026-09-27), the AI coach reads the whole story, and the waiting-customer reminder and the Telegram section of the daily summary run. Not built: running the account check from the routing tick and the daily cron (it runs on traffic; see [[Open Tasks]]). The stage table and the guard rails below describe 27 Sep and are kept as history.

## The journey today, stage by stage

| Stage | What is recorded | Where it shows | Verdict |
|---|---|---|---|
| **1. Source** (ad, post, QR, Telegram message) | Campaign link with `utm_` tags per ad version; spend typed in weekly; first campaign remembered in the browser for 30 days | Campaigns & AI → Campaigns & links, Performance | Good. Gap: spend is manual; a visitor who blocks storage looks new every time |
| **2. Visit** | One visit record per session: channel, app browser, device, language, active seconds, scroll depth, sections reached, button and Telegram clicks, form started or sent. No names, no IP. Kept 120 days | Performance (funnel, sections, hours, breakdowns); AI analyst plan | Good for the crowd. Gap: nothing shows one visitor's own path |
| **3a. Contact by form** | Lead in the CRM: name, phone, campaign, location, visit and browser ids; Round Robin assignment; Telegram lead card with three buttons; reply time; hand-over after N minutes; returning customer by phone or e-mail | Leads CRM, Team performance, daily summary | Good. This is the only path that reaches the pipeline by itself |
| **3b. Contact by Telegram click** | Routing log: page, salesperson, IP, device, location, campaign, visit id, code in the first message; since 27 Sep the connected account confirms the chat and gives the customer's name, @username, user id and first message | Team performance → Who reached the team | Improved today. **Gap: the chat never becomes a lead.** It is not in the CRM, has no status, no notes, no hand-over, no reply timer. On the live site clicks outnumber forms (10 to 0 in the last week) |
| **4. Conversation** | Form leads: first button tap and its time. Telegram chats: nothing after the first message | Team performance | Weak. Nobody knows how many messages were exchanged, who spoke last, or how long the customer has waited |
| **5. Pipeline** | Six statuses set by hand in the CRM; notes typed by hand | Leads CRM | Works only for form leads, and only when the team remembers to update it |
| **6. Close** | WON or LOST in the CRM; WON counts as a customer in the campaign report | Campaigns → Performance | Correct, but blind to Telegram-only deals, which are most deals |
| **Follow-up with the team** | Hand-over of an unanswered form lead; one manager summary a day; AI campaign plan to the manager | Telegram | The bot never asks a salesperson how a prospect is doing |

**The three breaks in the chain**

1. **Telegram chats are outside the pipeline.** Most prospects arrive this way, so the CRM, the reply timer, the hand-over and the win rate all see a minority of the business.
2. **Identity is scattered.** One person can appear as a visitor id (browser), a session id (visit), an IP and browser string (click), a Telegram user id (chat) and a phone number (form). The pieces are recorded but never stitched into one prospect.
3. **Status depends on memory.** Nothing reminds a salesperson to update a prospect, and nothing asks them what happened.

## What to build, in order

### Phase 1: one record per prospect (rules only, about a week)

- **Telegram chat → CRM lead.** When the account check confirms a chat, create a lead automatically: name and @username from Telegram, page, campaign, salesperson, status NEW, source "Telegram chat", the Telegram user id as the identity key (phone optional). A second chat from the same user id updates the same lead. The lead card buttons then work for chats too.
- **Prospect timeline** in the lead drawer: the ad that brought them, each visit (how long, how far, which sections, including the price and the itinerary), the click, the chat's first message, every status change and note, the reply times. Built from data that exists today, stitched by visitor id, session id, Telegram user id and phone.
- **Conversation counts** from the connected account for matched chats only: messages from the customer and from us, first reply time, last message and who sent it, unread count. Stored as numbers, never as text. Feeds a **Reply** column and a "waiting for a reply" state.
- **Automatic account check** from the routing tick and the daily cron, so matching and reminders do not wait for someone to open the admin.
- **Behaviour signals per prospect**, computed by rules: read the price section, read the itinerary, came back a second time, clicked more than once, came from which ad. Shown as chips on the lead and used for a simple **heat** score (hot, warm, cold) that the team can see and sort by.

### Phase 2: the bot follows up with the team (rules only, about a week)

- **Check-in messages.** For each open prospect the bot asks the salesperson, in short Khmer, at set moments: 30 minutes after a chat began with no reply from us; 24 hours after the first contact; 3 days after the last message; and 2 days before the registration deadline. Each message carries buttons: បានទាក់ទង (Contacted), បានផ្ញើសម្រង់តម្លៃ (Proposal sent), កំពុងចរចា (Negotiating), ឈ្នះ (Won), បាត់ (Lost), ចាំបន្ត (Follow up in 3 days). A tap sets the CRM status; the webhook already handles button taps.
- **Text replies become notes.** A reply to the bot's message is saved as a note on that prospect, with the time and the author. The webhook needs a small extension for this.
- **Silence escalates.** No answer to two check-ins → the manager gets one line. This reuses the hand-over machinery.
- **Morning list per salesperson**: "You have 4 open prospects: 2 waiting for your reply, 1 quiet for 3 days, 1 with the deadline in 2 days", each with a link to the CRM.
- **Weekly pipeline summary to the manager**: new, talking, quiet, won, lost per salesperson, and the ads they came from.

### Phase 3: AI where rules stop (after Phases 1 and 2)

The portal already has an AI analyst (Claude, key in Vercel, daily campaign plan). Reuse it for three tasks that rules cannot do well:

1. **Read free-text replies from the team.** A salesperson answers the bot "គាត់ថាចាំប្រពន្ធសម្រេចមុន សប្តាហ៍ក្រោយ" and the AI proposes: status Negotiating, follow up in 7 days, note saved. The proposal is shown with a confirm button; nothing changes until the salesperson taps it.
2. **A one-paragraph brief before the reply.** When a new chat is confirmed, the bot adds three lines for the salesperson: which ad, what the visitor read (for example the price twice and the single-room line), what they asked in the first message, and the best template from [[Telegram Reply Templates]] to start with. Khmer, under 60 words.
3. **Patterns across prospects, weekly.** Which sections, sources and reply times lead to wins; which prospects look like past winners but have gone quiet. Numbers only, no personal data, in the same guarded style as the campaign plan (quote the numbers, say when data is thin, never invent).

## Do we need AI for this? Assessment

- **Not for the core.** Linking identities, building the timeline, counting messages, sending reminders and setting statuses with buttons are deterministic. Rules are cheaper, work offline from the AI key, never invent, and are easier for a Khmer-speaking team to trust. Phases 1 and 2 need no AI and deliver most of the value: every prospect in the pipeline, and a bot that asks.
- **Yes for language and judgement.** Turning a Khmer free-text answer into a status and a date, writing a short brief a busy salesperson will actually read, and spotting patterns across dozens of prospects are where an AI earns its cost. Each is a small call (a few hundred tokens), a few times a day; far below the daily campaign run already in place.
- **Guard rails, the same as today's analyst:** the AI proposes and a person confirms; it sees only what the task needs (never the whole chat history; the first message and the team's own reply text at most); it quotes numbers it was given; it says "not enough data" rather than guessing. Every AI action is logged on the prospect as "suggested by AI, confirmed by <name>".
- **What to skip:** an AI that chats with customers on the salesperson's behalf. It would talk from a personal Telegram account, the owner has chosen human conversation deliberately (see the Round Robin decisions), and a wrong price or promise would cost more than it saves.

## Data and privacy rules for this work

- Customer data stays in the CRM and the routing log, never in the vault or in AI prompts beyond the minimum.
- Conversation content is not stored; only counts, times and the first message (200 characters) already kept today. *(Changed 2026-09-27 at the owner's request: conversations of chat leads are now stored for the story and the AI coach, see [[Customer Story and AI Coach]]. The process in force is [[Telegram Sales Process]].)*
- The connected Telegram session, the bot token and the service key must be behind the RLS lockdown before Phase 2 automates more writes. See [[Run the RLS Lockdown Migration]].
- Everything the bot proposes is reversible in the CRM.

## To confirm with the owner

- [ ] Check-in timings (30 min, 24 h, 3 days, deadline minus 2 days) and whether check-ins pause outside working hours.
- [ ] Whether a Telegram chat with no phone number may be a lead in the CRM (the form requires a phone today).
- [ ] Whether the manager should receive the morning list too.
- [ ] Budget for Phase 3 (each AI call is paid; the current daily analyst is the reference).

## Related

[[Tracking and Analytics]], [[Campaigns and AI Analyst]], [[Leads CRM]], [[Round Robin]], [[Sales Playbook]], [[Telegram Reply Templates]], [[Landing Page Builder Roadmap]].
