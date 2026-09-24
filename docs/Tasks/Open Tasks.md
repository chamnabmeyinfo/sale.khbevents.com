---
type: tasks
tags: [tasks, index]
updated: 2026-09-24
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

### Security (do these first)

Suggested order: lock the database first, then change the token and the password. Until the lockdown runs, the database rules let the public key read the settings, which hold the bot token and the password hash. A new token saved before the lockdown could be read the same way.

- [ ] Check that `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel → Project → Settings → Environment Variables, then run the RLS lockdown migration. It has not been run yet. → [[Run the RLS Lockdown Migration]] #owner
- [ ] Rotate the Telegram bot token. It was exposed in git history (committed in `data/db.json` in the past). → [[Rotate the Telegram Bot Token]] #owner
- [ ] Change the admin password. Production may still use the seed default from the repository. → [[Change the Admin Password]] #owner

### Sales page

- [ ] Set the real registration and early-bird deadlines in the admin. Only the owner sets them; code and content packs never overwrite them. The page editor has no date field for them yet (see the question below). → [[Landing Pages CMS]], [[Smart City Tea and Cafe Vietnam 2026]] #owner
- [ ] Send real testimonials and outcome photos when they exist. Until then the testimonials stay hidden; they were placeholders. → [[Smart City Tea and Cafe Vietnam 2026]], [[Image Uploads]] #owner
- [ ] Choose the **Remember a visitor for** period in Admin → Staff Round Robin → Advanced Routing Engine Rules & Fallbacks. Choices: Off, 1, 2, 3 or 6 months. The default in the repo is 1 month. → [[Round Robin]] #owner
- [ ] Decide whether to run a popup, and create the first one if wanted. → [[Create a Popup]], [[Ads and Popups]] #owner

### Setup

- [ ] Set up Obsidian and GitHub Desktop on your computer and open the `docs` folder as a vault. → [[How to Use This Vault]] #owner

## Sales team

- [ ] Open Admin → Staff Round Robin and check the **Readiness check** says **Ready**. Remove any sample staff accounts with the **Remove … sample account(s), then Save** button. Make sure every real salesperson has a username, a Chat ID and a passing **⚡ Test Ping**. → [[Add a Sales Staff Member]], [[Round Robin]] #sales
- [ ] Have a native Khmer speaker review the wording of the admin. A Khmer translation of the whole admin was added; switch the admin language to Khmer and note unclear or wrong words. → [[Languages]] #sales

## Claude

- [ ] When the owner sends real testimonials and outcome photos, add them to the page and show the section again. Never invent any. → [[Landing Pages CMS]], [[Copy Rules]] #for-claude
- [ ] After each security task above, check the live site still works (landing page, test lead, Telegram alert, admin) and log it in a session note. → [[Deploy to Production]], [[Verify Changes Locally]] #for-claude
- [ ] Apply the Khmer wording fixes from the native review. → [[Languages]] #for-claude

### Code problems found while writing the vault

Found by checking the notes against the code on 2026-09-24. Each needs the owner's go-ahead before Claude changes the code.

- [ ] **Wrong price on the app view.** `/smart-city-tea-cafe/app` shows **$499** in its button, countdown label and total, typed into `src/components/landing/SmartCityAppView.tsx`, whatever the admin price is. The real price is $550. Fix first: visitors can see it today. → [[Smart City Tea and Cafe Vietnam 2026]] #for-claude
- [ ] **Popup cooldown setting has no effect.** The **Cooldown between popups (hours)** value saved in Admin → Ads & Popups never reaches the live site, which always waits 12 hours. The live popup must read the saved setting. → [[Ads and Popups]] #for-claude
- [ ] **Khmer spelling on the live page.** The Khmer copy in `src/components/landing/smart-city-content.ts` and `content/pages/smart-city-tea-cafe.json` types ៃ where ៀ or ែ belongs (for example រៃបចំ, តៃ, ខៃ, រយៃពេល). Fix after a native speaker confirms the list in [[FAQ Answers]]. #for-claude
- [ ] **New pages start published with a sample testimonial.** A new page in the editor defaults to published and is pre-filled with an invented testimonial and example FAQ, price, seats and deadline. Default to draft and start empty. → [[Launch a New Trip Page]] #for-claude
- [ ] **No date fields for deadlines.** The page editor has no input for the early-bird and registration deadlines (see the question below). #for-claude
- [ ] **Remember-visitor hint is inaccurate.** The admin hint says a returning person gets "no second alert". That is true for Telegram clicks, but a returning person who sends the form does get a lead card. Correct the wording in `src/lib/i18n/dict/round-robin.ts`. → [[Round Robin]] #for-claude
- [ ] **Customer names in tracking data.** `src/components/landing/LeadForm.tsx` puts the customer's name into the `form_submit` tracking event. Tracking needs no personal data; remove it. → [[Tracking and Analytics]] #for-claude
- [ ] **Per-page lead counts and pixels.** Page cards and per-page conversion on Supabase do not count new leads, and ad-pixel Lead events fire only on the Smart City views. → [[Tracking and Analytics]] #for-claude
- [ ] **Token still in the fallback database.** After rotating the bot token, remove the old one from `data/db.json` (the local and cPanel fallback). It was removed from the in-admin guide and `FEATURE_BLUEPRINT.md` on 2026-09-24. → [[Rotate the Telegram Bot Token]] #for-claude

## Questions to settle

These come from the "To confirm" sections of the feature notes. Answer them here or in [[Decision Log]].

- [ ] Where does the owner set the registration and early-bird deadlines today? The page editor in the repo has no date field for them. → [[Launch a New Trip Page]] #owner
- [ ] Should the **Cooldown between popups (hours)** value in the admin reach the live site? Today the live site uses the built-in 12 hours. → [[Ads and Popups]] #owner

## Done

Move finished tasks here with the date, or delete them once they are in a session log. History of what was built: [[Project History]].

## Related

- [[00 Start Here]], [[Decision Log]], [[2026-09-24 Portal build session]]
- [[Admin and Security]], [[System Map]]
