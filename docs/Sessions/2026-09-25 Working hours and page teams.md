---
type: session
date: 2026-09-25
tags: [session, round-robin]
---

# Working hours and page teams

## Asked for

- Stage B of the Round Robin ideas: working hours per salesperson and teams per landing page.

## Done

- Each staff card has **Only during working hours** (days and times, Phnom Penh) and **Serves pages**. Details: [[Round Robin]].
- Form leads, Telegram clicks and the bot prefer the page's team, then whoever is working now; if nobody qualifies, the normal rotation still assigns the contact.
- A lead that arrives outside the person's hours says so on the card, and its hand-over clock starts when their shift opens. Hand-overs only go to people working now, the page's team first.
- Returning customers keep their salesperson whatever the hours or teams.
- Saved values are checked on the server (valid days and times, page addresses).

## Verified

- Type check, lint, 157 unit tests (4 new) and a production build.
- On a local production server with Telegram faked: hours and pages set in the admin, saved and still there after reload; "Working now" and "Off now, back …" shown; Korea leads went to the working Korea team member, Vietnam leads to the Vietnam team, a page with no team to the people working; a Telegram click on the Korea page went to the Korea team member. No page errors.

## Decisions

- Hours and teams narrow who is preferred but never leave a lead unassigned.

## Follow-ups

- Owner: set hours and pages for each person (in [[Open Tasks]]).
