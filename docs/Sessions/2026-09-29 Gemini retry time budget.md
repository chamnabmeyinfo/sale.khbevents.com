---
type: session
date: 2026-09-29
tags: [session]
---

# Gemini retry time budget

## Asked for

- Fix the review findings on the Gemini 429 wait-and-retry ([[AI Keys]]).

## Done

- One time budget for all Gemini attempts; the retry gets the time left, and the clock starts before the model lookup.
- 429 messages are classified on the full text and on Google's quota name; only the quoted excerpt is shortened.
- No wait-and-retry for `limit: 0` or daily-cap 429s.
- A network error on the retry keeps the 429 reason.
- Anthropic errors show Anthropic's reason (via `anthropicErrorMessage`); the "make Claude primary" hint is now neutral.
- Tests moved into the `primary AI` group; new test for the daily cap.
- Feature note and Open Tasks corrected: unverified claims removed or marked "to confirm".

## Verified

- `vitest` on `ai-text` and `ai-keys` (15 tests) and `tsc --noEmit` pass.

## Decisions

- See [[Decision Log]] 2026-09-29.

## Follow-ups

- To confirm: cost per run on Gemini billing.
