---
type: tasks
tags: [tasks, index]
updated: 2026-09-27
source:
  - supabase/migrations/20260923_lock_down_rls.sql
  - src/lib/round-robin.ts
  - src/components/admin/RoundRobinManagerClient.tsx
  - src/components/admin/PageEditor.tsx
  - src/lib/i18n/dict
---

# Open Tasks

What still needs doing, and who does it. Tick a box when it is done, and add the date. Claude reads this note at the start of every session. To ask Claude for something, add a line with the tag `#for-claude`. See [[How to Use This Vault]].

Business focus right now: selling business trips. See [[KHB Events Company Profile]] and [[Smart City Tea and Cafe Vietnam 2026]].

## Owner

### Vietnam page restored (2026-09-26)

- [x] Restore the Vietnam page from the owner's saved copy of the live page (2026-09-26). The page as it was before the automatic update was applied as a content pack; photos, text, terms and seats are back. → [[Smart City Tea and Cafe Vietnam 2026]]
- [ ] After this deploy, open `/smart-city-tea-cafe` and check: all photos load (23 uploaded pictures; a missing one means the file is gone from storage and needs re-uploading), the lead form and the final call to action are back, and the "Why people choose this" and second hero sections sit before the terms as they did. Then Save once in the builder so the copy is also in Versions. → [[Page Builder]] #owner

### Telegram inbox (new, 2026-09-27)

- [ ] After this deploy, open **Leads & CRM Pipeline → Telegram inbox**, pick a customer, and send a short reply from the portal. It should appear in your Telegram chat with that customer as a message from you. → [[Telegram Inbox]] #owner
- [ ] Tell the team: the manager may read and answer their Telegram customer chats from the portal; replies go out under the salesperson's name. #owner
- [x] Live without Refresh (2026-09-27): the chat view keeps itself fresh while on screen, one short connection per account at a time, Telegram's waits honoured, Auto seen switch per salesperson. See [[Telegram Inbox]] → Keeping the salesperson's account safe.
- [ ] After this deploy, open the Telegram inbox on a customer's chat and have them (or a test account) send a message: it should appear by itself within about 8 seconds, with the chip saying **Live**. → [[Telegram Inbox]] #owner
- [ ] Decide per salesperson whether **Auto seen** should be on (Settings → Telegram account check, their row). Off means the customer sees "seen" only when the salesperson opens Telegram. #owner
- [ ] If a row ever shows "Telegram ended the session", the salesperson connects again from the same tab (code from their Telegram app). Telegram may also show a new "khbportal" device after a reconnection; ending old ones there is fine. #owner
- [ ] Later, if the team wants replies within a second instead of about eight: a live update connection per account (Telegram updates), which needs a server that stays up all day rather than Vercel functions. Decide only after the polling version has run a few weeks. #for-claude

### Gen Ads (2026-09-28)

- [x] **Gen Ads** button on every landing page card: one AI call turns the page into an ads package (analysis, three concepts with poster text and captions, video script, Google and LinkedIn text, objection posts, first Telegram reply, targeting, A/B tests, posting plan); every number comes from the CMS; flagged lines show why. → [[Gen Ads]]
- [ ] Open **Gen Ads** on the Korea sourcing page once the deploy is READY (the first open runs the AI), read the three concepts and the Khmer, and tell Claude what reads wrong or is missing. #owner
- [ ] Press **Create tracked links** there, then use the Facebook / Telegram / TikTok links of each concept in the ads, so Campaigns → Performance shows which concept sells. This replaces "one campaign per trip, one ad version per poster" for pages that use Gen Ads. #owner
- [ ] Have a native Khmer speaker read the Khmer captions and the first Telegram reply before they are posted. #owner
- [ ] Later, if useful: a poster text preview card (4:5) in the portal before Canva; per-concept LinkedIn text; a "save as Telegram Reply Template" button for the first reply. Decide after a few real runs. #for-claude

### AI & API keys (2026-09-28)

- [x] Settings & Security → AI & API keys: Anthropic and Gemini keys saved in the portal (checked before saving, shown only as the last four characters), used by the AI analyst, the AI coach, voice to text and the new AI headline ideas in Ad posters. → [[AI Keys]]
- [ ] Paste the Anthropic key and (optional) the Gemini key there, press **Check and save**, and set a monthly spend limit in each provider's console. #owner
- [x] Primary AI choice (Claude or Gemini) with the other as automatic back-up; failed Anthropic checks now show Anthropic's reason. → [[AI Keys]]
- [ ] Revoke the Anthropic and Gemini keys that were pasted in the chat, create new ones, save them in the portal, and choose the **Primary AI**. #owner
- [ ] Try each AI feature once on Gemini (AI analyst, Analyze now on a customer, poster ideas) and compare the Khmer quality with Claude before keeping Gemini as primary. #owner
- [ ] Optional later: remove `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` from Vercel once the keys are saved in the portal, so there is one place to rotate them. #owner

### Ad posters (2026-09-28)

- [x] Ad Poster Kit in Campaigns & AI → Ad posters: photo prompts for 4:5, 1:1, 9:16 and 1.91:1, poster text in English and Khmer from the live CMS facts, tracked links and QR codes, and an all-in-one prompt. → [[Campaigns and AI Analyst]]
- [ ] Before making posters, create a campaign per trip with one ad version per poster (Campaigns & links), so each poster's leads are counted. #owner
- [ ] Optional later: send the kit straight to Canva to create draft designs in the four sizes (Claude can do this from a chat today with the Canva connector). #for-claude

### Google Analytics for the whole site (2026-09-28)

- [x] One GA4 Measurement ID in Settings loads on every landing page and the home page; the home page is tracked by the portal too; forms and the floating Telegram button send GA4 events. → [[Tracking and Analytics]]
- [ ] Create one GA4 property for sale.khbevents.com (analytics.google.com → Admin → Create property → Web stream), and paste its Measurement ID (G-…) in Settings → Social & Public Channels → Google Analytics 4 for the whole site. Then Save. #owner
- [ ] In GA4: Admin → Events → mark `generate_lead` and `contact` as key events; Admin → Data retention → 14 months. If you run Google Ads, link it and import `generate_lead`. #owner
- [ ] Remove any per-page GA4 ID in the pages' Tracking & Pixels tab unless it is a different property on purpose. #owner

### Sales process: direct + account tracking (2026-09-28)

- [x] Process set: straight to the salesperson, tracked through the connected accounts, bot alerts and reminders only. Quick replies no longer hide a new chat; click alert no longer mentions a code; waiting-customer reminder (15 min default); Telegram chats in the daily summary; disconnect alert. → [[Telegram Sales Process]]
- [x] Audit fixes, same day: known customers take a click only with the greeting; chats the salesperson started never do; lookups limited to the period; 100 chats read; crawlers not routed; greeting on fallback chats; timed-out checks close their connection; alerts for Track-every-new-chat leads and "already answered" wording; reminders move to the next shift, repeat when the customer writes again, reach the manager only after the salesperson had time, and come as one list when many; summary shows dates, untracked salespeople and retries a failed send; screen texts and the readiness check corrected. → [[Telegram Sales Process]]
- [ ] Check the settings list in [[Telegram Sales Process]] → "Settings that make this work": entry = straight to the salesperson (also on each page), CC and the Settings Target Chat ID, the Fallback Manager chat, each row's Telegram username = the connected account, Chat IDs, every salesperson pressed Start in the bot, working hours, reminder minutes, daily summary hour. #owner
- [ ] Tell the team: after a click they get the alert; when the customer writes, a second alert with the name (check the 📌 service: the greeting does not name the trip); if a customer waits 15 minutes in working hours, the bot reminds them, and tells the manager if they still wait 15 minutes later. Chat leads stay NEW until they set Contacted. #owner
- [ ] Switch Off in Round Robin any salesperson whose Telegram account is not connected: clicks to them are not tracked (the daily summary names them under "not tracked"). #owner
- [ ] Decide on the Smart City page's promises next to the Telegram button: "Message <coordinator> on Telegram" (Round Robin may pick someone else), "Itinerary PDF sent at once" (nothing sends it: the salesperson must, in the first reply) and "Coordinator replies within 15 minutes" (no "business hours"). Keep and brief the team, or reword. → [[Telegram Sales Process]] #owner
- [ ] Decide whether the account check may also run from a scheduler at night (the tick address every 2–5 minutes), so leads, alerts and reminders do not wait for the next visitor. Today it runs only with traffic, the inbox open, or Check now. #owner
- [ ] Decide what happens when a returning customer is routed to a different salesperson: today the lead stays with the first one (note "now chatting with …"), so reminders and the inbox follow the first salesperson's chat. Option: move the lead to whoever the customer is chatting with. #owner
- [ ] Follow-ups from the audit: one row per routing-log entry (two writes at once can lose a click or a chat mark); "Not checked" instead of "No chat yet" for salespeople without a connected account; a logged click for the bot's fallback path and for plain Start; returning-visitor clicks labelled "no alert" instead of DELIVERED; keep the referrer on Telegram buttons; two clicks within a second going to the same person; send chat leads to the page webhook; warn when a row's username is not the connected account, and when an active salesperson has no connected account. #for-claude
- [ ] Optional later: bot reminder for clicks that never became a chat within 30 minutes (only if clicks seem to go missing). #for-claude

### Connecting accounts (2026-09-28)

- [x] Step-by-step for the my.telegram.org form in the settings tab and in [[Connect a Telegram Account]] (2026-09-28).
- [ ] Optional later: set the app once for the whole team and connect by scanning a QR code instead of phone and code. #for-claude

### Bot first entry (new, 2026-09-27)

- [x] Round Robin → Advanced → "Where a Chat on Telegram click goes": direct (default) or the sales bot first with one button to the salesperson (2026-09-27). → [[Round Robin]]
- [x] Superseded by the 2026-09-28 decision ([[Telegram Sales Process]]): do not switch the Round Robin setting to bot first. Bot first stays for a test on one page's own setting only ([[Bot First Guide]]).
- [ ] The bot's webhook must be registered for the bot to answer Start (Settings → Telegram, or POST /api/telegram/setup-webhook). If the bot stays silent after Start, that is the first thing to check. #owner
- [x] Per-page choice of entry, **Say hello** from the inbox for silent bot-entry customers, one-tap phone share for people without a @username (2026-09-28). Guide: [[Bot First Guide]].
- [ ] Optional: test bot first on one page's own setting with [[Bot First Guide]], on the second phone. The site-wide process stays direct. #owner

### Customer story and AI coach (new, 2026-09-27)

- [x] Stored chats, voice to text, story file per customer, AI coach with heat, next step and suggested reply, Hot first in the inbox (2026-09-27). → [[Customer Story and AI Coach]]
- [ ] Add the Anthropic key in Settings & Security → **AI & API keys** (or keep `ANTHROPIC_API_KEY` in Vercel); then open a customer in the Telegram inbox and press **Analyze now**. → [[AI Keys]] #owner
- [ ] Decide on voice transcription outside Telegram: add a Gemini key in Settings & Security → **AI & API keys** (Google AI Studio key) so voice messages Telegram cannot transcribe still get their text. Without it, only Telegram's own transcription is used. → [[AI Keys]] #owner
- [ ] Tell the team: customer chats are now stored in the CRM and read by the AI coach; the coach suggests, people send. #owner
- [ ] Delete a lead → also delete its stored chat and analysis rows. #for-claude
- [ ] Phase 2 of the coach: bot check-ins with the next step and buttons (Done / Snooze / Lost), the morning list of hot customers to the manager, weekly coaching summary, objections per trip on Team performance. #for-claude

### Prospect journey (audit 2026-09-27)

- [x] Owner answered the audit's questions (2026-09-27): check-in timings customisable with minimums; a Telegram chat may be a lead without a phone (the team asks for it); the manager gets the morning list too; AI later, if at all, only to read chats faster, never to answer customers.
- [x] Phase 1a (2026-09-27): Telegram chat → CRM lead, conversation counts and reply times, "Did we reply?" card, automatic account check after site traffic.
- [ ] Phase 1b: prospect timeline in the lead drawer, behaviour chips and a hot / warm / cold score. #for-claude
- [ ] Phase 2: bot check-ins to the salesperson with status buttons (timings set by the owner, minimum 15 minutes for the first and 1 hour between repeats, at most 3 a day per prospect, paused outside working hours), text replies saved as notes, escalation to the manager, morning list to each salesperson and the manager, weekly pipeline summary. #for-claude
- [ ] Owner: tell the team that their connected Telegram work account's customer chats can be read and answered from the portal by admins, and are stored in the CRM for the AI coach. → [[Leads CRM]] #owner
- [ ] Owner: if customers also write to the team directly (not from a page), tick **Track every new chat** on your row in Settings → Telegram account check. → [[Round Robin]] #owner
- [ ] Owner: after a few real chats, open Team Performance → Telegram chats: did we reply? and check the numbers against what the team sees in Telegram. In the CRM, chat leads have no phone until the team adds it. → [[Round Robin]] #owner

### Telegram account check (new, 2026-09-27)

- [x] Connect the owner's Telegram account in Settings → Telegram account check (2026-09-27).
- [ ] After a few real customers write, check Team Performance → Who reached the team: the **Chat** column should say "Messaged us · by time" for them, and the salesperson should have received the "អតិថិជនបានផ្ញើសារមកអ្នកហើយ" alert. Tell Claude if the wording of the three messages should change. → [[Round Robin]] #owner
- [ ] Telegram → Settings → Devices → Automatically terminate old sessions → "If inactive for": 6 months (or the longest option), so a quiet period does not log the portal out. #owner
- [x] Other salespeople: two more sales accounts connected by the owner (2026-09-28), using one shared app (api_id/api_hash). → [[Connect a Telegram Account]]
- [ ] For each newly connected salesperson: Check the connection (lock OK), Check now, set "If inactive for" to 6 months in their Telegram (Settings → Devices), decide Track every new chat and Auto seen, tell them their customer chats are stored in the CRM. → [[Connect a Telegram Account]] #owner
- [x] The account check runs after normal site traffic with the lead follow-up check (2026-09-27).

### Visitor details (new, 2026-09-27)

- [ ] After a few real clicks, open **Staff Round Robin → Team Performance → Who reached the team** and check the rows: location, device and "Looks like". Clicks before 27 Sep show only the IP and browser. Tell Claude if real customers are marked **Check** or **Bot** so the rules can be tuned. → [[Round Robin]] #owner

### Backups (new, 2026-09-26)

- [ ] After this deploy, open Settings → Backups & Restore: a **Before deploy** snapshot should be listed. If the tab shows an error, `SUPABASE_SERVICE_ROLE_KEY` is missing in Vercel (see the Security list). → [[Backups]] #owner
- [ ] Press **Back up now** once and **Download** the file to a safe place; repeat monthly. → [[Restore from a Backup]] #owner

### Security (do these first)

Suggested order: lock the database first, then change the token and the password. Until the lockdown runs, the database rules let the public key read the settings, which hold the bot token and the password hash. A new token saved before the lockdown could be read the same way.

- [ ] Check that `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel → Project → Settings → Environment Variables, then run the RLS lockdown migration. It has not been run yet. → [[Run the RLS Lockdown Migration]] #owner
- [ ] Rotate the Telegram bot token. It was exposed in git history (committed in `data/db.json` in the past). → [[Rotate the Telegram Bot Token]] #owner
- [ ] Change the admin password. Production may still use the seed default from the repository. → [[Change the Admin Password]] #owner

### Sales page

- [ ] Campaigns & AI (new):
  - Add `META_CAPI_ACCESS_TOKEN` and `TIKTOK_EVENTS_ACCESS_TOKEN` in Vercel → Settings → Environment Variables, then redeploy. The Anthropic key now goes in Settings → AI & API keys ([[AI Keys]]).
  - Check each with a test code in Admin → Campaigns → Tracking setup.
  - Create a campaign for every running ad, use its link, and enter the spend weekly.
  - → [[Campaigns and AI Analyst]] #owner
- [ ] If a page's background video was uploaded as a MOV file (from an iPhone), re-upload it as MP4 (H.264) so Android phones play it too. → [[Page Builder]] #owner
- [ ] Vietnam page, now in the builder:
  - Check it after the next deploy: Admin → Landing Pages CMS → Edit.
  - Its registration deadline (20 Sept 2026) has passed, so the page shows no countdown. Set a new date, or clear it, in the builder → Offer.
  - Check the seats left.
  - → [[Smart City Tea and Cafe Vietnam 2026]], [[Page Builder]] #owner
- [ ] Set the real registration and early-bird deadlines in the admin. Only the owner sets them; code and content packs never overwrite them. The page editor has no date field for them yet (see the question below). → [[Landing Pages CMS]], [[Smart City Tea and Cafe Vietnam 2026]] #owner
- [ ] Send real testimonials and outcome photos when they exist. Until then the testimonials stay hidden; they were placeholders. → [[Smart City Tea and Cafe Vietnam 2026]], [[Image Uploads]] #owner
- [ ] Choose the **Remember a visitor for** period in Admin → Staff Round Robin → Advanced Routing Engine Rules & Fallbacks. Choices: Off, 1, 2, 3 or 6 months. The default in the repo is 1 month. → [[Round Robin]] #owner
- [ ] Terms & Conditions (new builder component): write the real terms (payment, cancellation, refunds, changes, travel documents), have them checked, then add them to each page and set **Last updated**. Optionally tick **Ask visitors to agree** on the lead form. → [[Page Builder]] #owner
- [ ] Add an **Included & not included** section to each trip page with the real items (for example flights, hotel, meals, visa, insurance). The starter items are placeholders. Vietnam: done (2026-09-26), with the single-room supplement listed under "Not included". Korea: still to do. → [[Page Builder]] #owner
- [ ] Upload the company logo in Settings → Company Profile & Contact (transparent PNG). → [[Admin and Security]] #owner
- [ ] Correct the contact details. In Settings → Company, the Telegram username is the routing bot, and the phone and address may still be the form's example values. On the Vietnam page (builder → Page settings → Brand & contact), the phone and WhatsApp look like old sample numbers. Fix them, or hide lines per page with **Show on this page**. → [[Page Builder]], [[Print Agenda]] #owner
- [ ] Check each builder page's **Brand & contact** (page settings). The Korea page already had its own phone number and its Telegram username is set to a bot, `@khb_sale_admin_bot`. If you add a Contact & company section, visitors will see that handle; change it to the sales account if that is not what you want. → [[Page Builder]] #owner
- [ ] Decide whether to run a popup, and create the first one if wanted. → [[Create a Popup]], [[Ads and Popups]] #owner

### Korea trip

- [x] Feature images for all three trip pages (2026-09-24). Replace the Korea share images with real photos when there are some. → [[Page Builder]]
- [ ] Check the rights to two site photos: photo (6) shows a Google "Search inside image" button, photo (11) a TV programme title (`public/images/events/`). Replace them if they were copied from the internet. #owner

- [ ] Confirm the early-bird date. The caption says "before 31/9/26"; the page uses 30 September 2026. Change it in the builder if needed. → [[Korea Sourcing Trip Seoul 2026]] #owner
- [ ] Send real photos for the Korea page (hero and social sharing), and a day-by-day itinerary if it should be shown. → [[Korea Sourcing Trip Seoul 2026]] #owner
- [ ] Decide whether the Korea pages' Telegram button goes to Mr. Tim Vutha directly (as now) or through Round Robin. As it is, the [[Telegram Sales Process]] does not apply there: no alert, no click log, no match; the chat becomes a lead only with Track every new chat, as "Telegram (direct)". A third option since 2026-09-25: make him (and helpers) the Korea pages' team under **Serves pages**. → [[Round Robin]] #owner
- [ ] Set each salesperson's working hours, pages and (if needed) daily limit in Staff Round Robin, choose the **Daily summary** time, set the chats for manager messages (Settings → Instant Telegram Alerts → Target Chat ID for the CC copies; Fallback Manager Telegram Chat ID for the summary and reminders), then Save. Without working hours a salesperson counts as always on shift, so reminders can come at night. → [[Round Robin]] #owner
- [ ] Before going live: open **Settings & Security → Demo data**, check the list (untick anything real), tick **Reset all statistics to zero**, type DELETE and run it once. → [[Admin and Security]] #owner
- [ ] Upload each salesperson's photo in Staff Round Robin (camera button), then Save. → [[Round Robin]] #owner
- [ ] After a week, open **Staff Round Robin → Team Performance** and review reply times with the team. → [[Round Robin]] #owner
- [x] Second new trip page: [[Korea Robot and Food Trip Seoul 2026]] (2026-09-24).
- [ ] Confirm the robot and food trip's early-bird date (caption "31/9/26"; the page uses 30 September) and send photos. → [[Korea Robot and Food Trip Seoul 2026]] #owner

### Page builder

- [ ] Try a background video on the live site: one upload and one YouTube link, on a phone and a computer. → [[Page Builder]] #owner

- [ ] Try **New drag & drop page** in Admin → Landing Pages CMS with one real product and say what feels hard or missing. → [[Page Builder]] #owner

### Setup

- [ ] Set up Obsidian and GitHub Desktop on your computer and open the `docs` folder as a vault. → [[How to Use This Vault]] #owner

## Sales team

- [ ] Open Admin → Staff Round Robin and check the **Readiness check** says **Ready**. Remove any sample staff accounts with the **Remove … sample account(s), then Save** button. Make sure every real salesperson has a username, a Chat ID and a passing **⚡ Test Ping**. → [[Add a Sales Staff Member]], [[Round Robin]] #sales
- [ ] Have a native Khmer speaker review the wording of the admin. A Khmer translation of the whole admin was added; switch the admin language to Khmer and note unclear or wrong words. → [[Languages]] #sales

## Claude

- [ ] Move the page analytics screen (`/admin/pages/<id>/analytics`) to the durable visit records and real leads, like the page cards (2026-09-26). → [[Tracking and Analytics]]

- [ ] When the owner sends real testimonials and outcome photos, add them to the page and show the section again. Never invent any. → [[Landing Pages CMS]], [[Copy Rules]] #for-claude
- [ ] After each security task above, check the live site still works (landing page, test lead, Telegram alert, admin) and log it in a session note. → [[Deploy to Production]], [[Verify Changes Locally]] #for-claude
- [ ] Apply the Khmer wording fixes from the native review. → [[Languages]] #for-claude
- [x] Page builder: benefits, what's included, how it works, lead form, final call to action (2026-09-24). → [[Page Builder]]
- [ ] Page builder, next components: gallery, packages or variants, guarantee, about us, testimonials (real ones only). → [[Page Builder]], [[Landing Page Builder Roadmap]] #for-claude

### Code problems found while writing the vault

- [ ] **Light mode forces black text on public pages and the login page.** `DynamicLandingPageView.tsx`, `MainSalesView.tsx` and `app/admin/login/page.tsx` carry `selection:bg-amber-400`, which matches the gold-button rule in `globals.css` and turns all their text black in light mode. The admin was fixed on 2026-09-24 (see [[Image Uploads]]). #for-claude

Found by checking the notes against the code on 2026-09-24. Each needs the owner's go-ahead before Claude changes the code.

- [ ] **Wrong price on the app view.** `/smart-city-tea-cafe/app` shows **$499** in its button, countdown label and total, typed into `src/components/landing/SmartCityAppView.tsx`, whatever the admin price is. The real price is $550. Fix first: visitors can see it today. → [[Smart City Tea and Cafe Vietnam 2026]] #for-claude
- [x] **Popup cooldown setting has no effect.** Fixed 2026-09-24: the saved value now reaches the live site. See [[2026-09-24 Advanced popups and Telegram chat]]. → [[Ads and Popups]]
- [ ] **Khmer spelling on the live page.** The Khmer copy in `src/components/landing/smart-city-content.ts` and `content/pages/smart-city-tea-cafe.json` types ៃ where ៀ or ែ belongs (for example រៃបចំ, តៃ, ខៃ, រយៃពេល). Fix after a native speaker confirms the list in [[FAQ Answers]]. #for-claude
- [ ] **New pages start published with a sample testimonial.** A new page in the editor defaults to published and is pre-filled with an invented testimonial and example FAQ, price, seats and deadline. Default to draft and start empty. → [[Launch a New Trip Page]] #for-claude
- [ ] **No date fields for deadlines.** The page editor has no input for the early-bird and registration deadlines (see the question below). #for-claude
- [x] **Remember-visitor hint is inaccurate.** Fixed 2026-09-25. The admin hint says a returning person gets "no second alert". That is true for Telegram clicks, but a returning person who sends the form does get a lead card. Correct the wording in `src/lib/i18n/dict/round-robin.ts`. → [[Round Robin]] #for-claude
- [ ] **Customer names in tracking data.** `src/components/landing/LeadForm.tsx` puts the customer's name into the `form_submit` tracking event. Tracking needs no personal data; remove it. → [[Tracking and Analytics]] #for-claude
- [ ] **Per-page lead counts and pixels.** Page cards and per-page conversion on Supabase do not count new leads, and ad-pixel Lead events fire only on the Smart City views. → [[Tracking and Analytics]] #for-claude
- [ ] **Token still in the fallback database.** After rotating the bot token, remove the old one from `data/db.json` (the local and cPanel fallback). It was removed from the in-admin guide and `FEATURE_BLUEPRINT.md` on 2026-09-24. → [[Rotate the Telegram Bot Token]] #for-claude

- [ ] Turn on lead follow-up: press **Register / secure bot webhook** once in Admin → Settings & Security, then in Staff Round Robin choose **Pass a form lead on if nobody responds within** (15 minutes suggested) and Save. Tell the team to tap the buttons under each lead card. → [[Round Robin]] #owner
- [ ] Optional: set a free scheduler (cron-job.org) to open `https://sale.khbevents.com/api/round-robin/tick` every 5 minutes, so hand-overs happen on time even when the site is quiet. → [[Round Robin]] #owner
- [ ] After a week of traffic, open **Ads & Popups → Performance** and check the numbers look right (detail starts 25 Sep 2026). → [[Ads and Popups]] #owner
- [ ] After two to four weeks of a smart popup, compare its click rate and **Why it showed** reasons with the fixed-delay popups; tune the sensitivity. → [[Ads and Popups]] #owner
- [ ] The live **Telegram quick chat** popup is set to **Only visitors who came from: telegram**, so people from Facebook, Google or a plain link never see it. Empty that field if every visitor should see it, and add `?utm_source=telegram` to links posted in Telegram. → [[Ads and Popups]] #owner
- [ ] Optional: switch on a **Telegram quick chat** popup (Admin → Ads & Popups → starter) for the trip pages, with office hours set to when the sales team can reply. → [[Create a Popup]] #owner

## Questions to settle

- [ ] Answer the "To confirm" questions in [[Landing Page Builder Roadmap]] so the builder matches what you imagine. #owner

These come from the "To confirm" sections of the feature notes. Answer them here or in [[Decision Log]].

- [ ] Where does the owner set the registration and early-bird deadlines today? The page editor in the repo has no date field for them. → [[Launch a New Trip Page]] #owner
- [x] Should the **Cooldown between popups (hours)** value in the admin reach the live site? Yes, fixed 2026-09-24 as the open task asked. Today the live site uses the built-in 12 hours. → [[Ads and Popups]] #owner

## Done

Move finished tasks here with the date, or delete them once they are in a session log. History of what was built: [[Project History]].

## Related

- [[00 Start Here]], [[Decision Log]], [[2026-09-24 Portal build session]]
- [[Admin and Security]], [[System Map]]
