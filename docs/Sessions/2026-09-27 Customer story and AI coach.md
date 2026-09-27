---
type: session
date: 2026-09-27
tags: [session, ai, telegram, crm]
---

# Stored chats, voice to text, customer story and the AI coach

## Asked for

- Store all chat history in the platform so AI can understand each chat and decide the next plan for customers not yet converted; an idea list for AI support to close faster. Then "go ahead" on the list, plus: turn voice messages into text and make everything a text file the AI can read as the story of each person.

## Done

- **Chat store** (`chat:<leadId>` rows): every message both ways saved on each live read, account check and portal reply; up to 200 older messages the first time; newest 500 kept.
- **Voice to text**: Telegram's own transcription through the salesperson's account first, Gemini when `GEMINI_API_KEY` is set; text shown in the bubble and in the story; bounded per read and per check.
- **Story file** per customer (Markdown): profile, source, clicks, whole conversation with voice as text, notes, numbers; download from the card; `GET /api/leads/<id>/story`.
- **AI coach** (`lead-ai.ts`, same key and model as the campaign analyst): summary, intent, heat with reason, objections, next step and when, suggested reply in Khmer and English, coaching, confidence; stored per lead; on demand and up to 3 changed open chats per sweep after site traffic.
- UI: AI coach card in the Telegram inbox and in every lead's drawer; heat badges and **Hot first** in the inbox; **Use** puts the suggested reply in the reply box.

- Fix after the owner's test (a new customer did not show at once): while the inbox is open, the accounts are checked for new chats every 30 seconds and the list refreshes every 10 seconds; before, only every 2 minutes after site traffic.

- Second fix after the owner's test (a chat from their other account still did not show): a person the account already knew (in the chat list when it was connected) now also becomes a lead when they write within 30 minutes after a click; before, only brand-new people or a reference code counted. The settings row shows what the last check saw and a **Check the connection** button tests the account lock and reports where it lives.

- Owner's request on the first message: the three-line template with the code is gone; the chat now opens with only "សួស្តី 👋" for visitors in Cambodia or with a Khmer browser, "Hello 👋" otherwise. Matching to the click is by timing (30 minutes), which the known-person rule above also uses.

## Verified

- tsc, eslint (0 errors), 271 unit tests (new: chat merge keeps transcripts and caps, story markdown, insight normalising), production build, browser run with the Telegram test double: a voice message got its Telegram transcription once and shows in the bubble; the story markdown holds the conversation with the voice text and downloads as a .md file; without an AI key the coach answers 503 and the card says which key is missing; Hot first present; the CRM drawer shows the card.
- Not verifiable here (no network): the real Claude call for the coach (same code path as the working campaign analyst) and Gemini transcription.

## Decisions

- Store conversations, transcribe voice, AI coach read-only (in [[Decision Log]]).

## Follow-ups

- Owner: confirm the Anthropic key, decide on the Gemini key, tell the team (in [[Open Tasks]]).
- Claude: delete stored chat with a lead; Phase 2 of the coach (in [[Open Tasks]]).
