---
type: session
date: 2026-09-28
tags: [session, ai, settings, marketing]
---

# AI keys and headline ideas

## Asked for

- Owner: a master setting to add API keys such as Gemini or Anthropic, for the system to use wherever it needs them, such as AI support chat or AI campaign prompts based on the landing page.

## Done

- Settings & Security → **AI & API keys** (and a sidebar link): Anthropic and Gemini keys, checked with the service before saving, shown only as the last four characters, removable, with a free test. Stored in the `ai_keys` row; the Vercel variables remain the fallback. See [[AI Keys]].
- The AI analyst, the AI coach and voice-to-text now read the keys from there.
- Ad posters: **Suggest more headlines with AI** (5 ideas in English and Khmer from the page's copy and CMS facts; ideas with a number not in the facts are dropped).
- Not built: a customer-facing AI chat, because of the owner's 2026-09-27 rule that AI never answers customers. The AI coach already drafts replies in the Telegram inbox.
- Texts that said "set ANTHROPIC_API_KEY in Vercel" now point to the new screen (EN and KH).

## Verified

- Type check, lint, 302 unit tests (new: key priority and removal, key shape, number guard).
- Browser check on a local build with a mock key check (no real key, no AI call): wrong kind of key refused, rejected key not saved, good key saved and shown as the last four only, test, Gemini key, remove, admin-only API, the Ad posters AI button without a key points to the new screen, no page errors.
- Not tested: a real Anthropic request for headline ideas (no key in this environment).

## Decisions

- [[Decision Log]]: "AI keys are managed in the portal; AI still never talks to customers".

## Follow-ups

- Owner: save the keys, set spend limits ([[Open Tasks]]).
