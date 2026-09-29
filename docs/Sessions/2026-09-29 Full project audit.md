---
type: session
date: 2026-09-29
tags: [session, audit]
---

# Full project audit

## Asked for

- Audit the entire project code and produce a corrective action plan for the owner to review.

## Done

- Ran a whole-project read-only audit in five parallel passes: security, core-library correctness, API routes, frontend/React, architecture & tooling.
- Established a baseline: `tsc --noEmit` clean, `vitest` 334/334 pass, `eslint` 0 errors (37 warnings).
- Verified independently that `data/db.json` is git-tracked and holds the bot token, a chat ID and an unsalted SHA-256 admin hash, and that `.gitignore` does not exclude it.
- Wrote the plan: [[2026-09-29 Full Project Code Audit]] (P0–P3, with IDs, owners and a recommended sequence).

## Verified

- No code was changed; this session only produced the review document.
- Baseline commands above were run in this session.

## Decisions

- (also add to [[Decision Log]]) Fix order recorded in the plan: rotate credentials and lock signups first, then remove committed secrets and harden auth, then CI + tests, then the concurrency cluster.

## Follow-ups

- (also add to [[Open Tasks]]) Owner to review the plan and say which tiers to implement. P0 needs the owner to rotate the bot token and admin password first.
