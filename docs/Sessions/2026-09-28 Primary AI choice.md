---
type: session
date: 2026-09-28
tags: [session, ai]
---

# Primary AI choice

## Asked for

- Show why a new Anthropic key was refused ("Anthropic answered 400").
- "Set Primary API": choose which AI service the system uses.

## Done

- A failed Anthropic check now shows Anthropic's own reason, with a plain hint when the account has no credits or billing.
- **Primary AI** card in Settings & Security → AI & API keys: Claude or Gemini, with a "Primary" badge on the chosen key.
- One shared AI layer (`src/lib/ai-text.ts`) for the AI analyst, the AI coach and the poster headline ideas. It asks the primary, then the other one on a service failure. Gemini answers through its JSON mode with the same answer shape, so the screens did not change.
- Texts in English and Khmer now say "Anthropic or Gemini" where they said Anthropic only.

## Verified

- Typecheck; 308 unit tests, including the primary order, the Gemini answer, the switch to the back-up, and no switch on an unreadable answer.
- Local browser check with mock keys (15/15): choosing Gemini, the choice kept after reload, the back-up notes, the keys screen admin only. `data/db.json` restored.
- Not tested against the real Gemini and Anthropic services from here (no keys in the test setup).

## Decisions

- The owner picks the primary AI; the other is the back-up (see [[Decision Log]]).

## Follow-ups

- Revoke the pasted keys, save new ones, choose the primary, and try each feature on Gemini (see [[Open Tasks]]).

Related: [[AI Keys]].
