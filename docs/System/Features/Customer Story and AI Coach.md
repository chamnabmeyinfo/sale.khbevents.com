---
type: feature
tags: [system, feature, ai, telegram, crm, sales-team]
updated: 2026-09-27
admin_path: /admin/chats
admin_menu: Leads & CRM Pipeline → Telegram inbox, and each lead's drawer
source:
  - src/lib/chat-store.ts
  - src/lib/transcribe.ts
  - src/lib/lead-story.ts
  - src/lib/lead-ai.ts
  - src/app/api/leads/[id]/story/route.ts
  - src/app/api/leads/[id]/ai/route.ts
  - src/components/admin/LeadInsightCard.tsx
  - src/lib/telegram-account.ts
---

# Customer Story and AI Coach

Every Telegram conversation is now kept in the portal, voice messages are turned into text, and each customer has a **story file** (Markdown) that an AI coach reads to tell the team where the customer stands and what to do next. Built on 2026-09-27 at the owner's request, reversing the earlier "numbers only" rule (see [[Decision Log]]).

## What it does for sales

- **Stored chat.** Every message both ways of every Telegram chat lead is saved as it is read (live view, account check, portal reply), the first time with up to 200 older messages. Photos and files are noted by kind, not stored.
- **Voice to text.** A voice message gets its text: first through Telegram's own transcription on the salesperson's account (free trials, unlimited with Telegram Premium), otherwise through Gemini when `GEMINI_API_KEY` is set in Vercel. The text shows in the chat bubble (🎤) and in the story.
- **Story file.** One Markdown file per customer: profile, where they came from, every click on our pages, the whole conversation with voice as text, the team's notes, the numbers. **Story .md** in the AI coach card downloads it.
- **AI coach.** Reads the story and returns: a short summary, what the customer wants, **heat** (hot / warm / cold) with the reason, what the deal is stuck on, the **next step** and when, a **suggested reply** in Khmer and English (a person edits and sends; **Use** puts it in the reply box), and one line of coaching for the salesperson. Shown in the Telegram inbox under the chat and in every lead's drawer in [[Leads CRM]].
- **Hot first.** The inbox shows the heat badge per customer and can sort hot customers first.

## Where it is in the admin

Telegram inbox (`/admin/chats`): heat badges in the list, **🔥 Hot first**, the AI coach card under the conversation. Leads CRM: the same card in each lead's drawer, for every lead (form leads too; their story is the form, the clicks and the notes).

## How to use it

- [ ] Open a customer in the inbox → **Analyze now**. Read the summary and the next step; press **Use** on the Khmer reply to put it in the reply box, edit, send.
- [ ] Sort **Hot first** in the morning and work the list from the top.
- [ ] **Story .md** downloads the whole story, for a meeting or for another AI tool.
- [ ] The coach also runs by itself: after site traffic, up to 3 open chat leads whose conversation changed since their last analysis (last 30 days), at most once an hour per lead.

## Key rules and defaults

- Needs `ANTHROPIC_API_KEY` in Vercel (the same key as the campaign analyst). Without it the card says so and nothing is sent anywhere. Voice transcription outside Telegram needs `GEMINI_API_KEY` (model `GEMINI_TRANSCRIBE_MODEL`, default gemini-2.5-flash); without it voice messages Telegram cannot transcribe stay marked "text coming…".
- The AI never writes to a customer. It reads and suggests; a person sends.
- The story is built fresh from the stored chat each time; the analysis is stored per lead (`lead_ai:<leadId>`) with when and on how many messages it was based.
- Stored chats live in `chat:<leadId>` rows of `system_settings` (or the local file), newest 500 messages per lead. Admin only, same protection as the Telegram session: the RLS lockdown matters.
- Transcription is bounded: at most 2 voice messages per chat read and 3 per account check, oldest pending first, each tried once through Telegram and once through Gemini; a failure is noted on the message.

## Limits and gotchas

- Salespeople must know their customer chats are now kept in the CRM (owner task in [[Open Tasks]]). Deleting a lead does not yet delete its stored chat row (follow-up).
- The heat is the model's reading of the story, not a fact: use it to choose who to call first, not to give up on someone.
- A story longer than about 60,000 characters is cut at the start of the conversation section.
- Telegram's transcription is limited on accounts without Premium; the Gemini path sends the voice file to Google.

## Related

[[Telegram Inbox]], [[Leads CRM]], [[Round Robin]], [[Prospect Journey Audit]].
