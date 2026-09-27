---
type: session
date: 2026-09-27
tags: [session, round-robin, telegram]
---

# Telegram account check

## Asked for

- A more advanced check: use the owner's own Telegram account to verify when a visitor who clicked really contacted the team.
- Then: simple alert templates for a sales team that is not strong in English.

## Done

- Salespeople connect their own Telegram account (official user API, read only) in Settings & Security → Telegram account check. Every click puts a code (#K7X2M) in the prefilled first message; the portal reads the account's new chats, matches them to clicks by code (sure) or timing (probable), shows a **Chat** column and a "Became a real chat" box on Team performance, and alerts the salesperson with the customer's name and first message. See [[Round Robin]].
- Short Khmer templates: the customer's three-line first message; the click alert (service, code, time); the new "customer messaged you" alert (who, service, their message, time).
- Fixed on the way: the Telegram library was loaded twice ("Only StringSession and StoreSessions are supported"); everything now comes from its main export.

## Verified

- tsc, eslint, 245 unit tests (matching rules, codes, messages). The owner connected their account on the live site, clicked from a landing page, sent the prefilled message with its code and received the click alert.
- This session's permission checker blocked the local production build and browser run for this feature, so the Vercel build was the full check; it succeeded (the owner used the live feature).

## Decisions

- Read the salesperson's own account rather than route customers through the bot (in [[Decision Log]]).

## Follow-ups

- Owner: after real customers write, check that "Messaged us" appears and that the alerts read well for the team (in [[Open Tasks]]).
- Claude: run the account check from the routing tick and the daily cron (left out this session).
