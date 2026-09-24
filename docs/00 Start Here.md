---
type: index
tags: [index]
updated: 2026-09-24
---

# KHB Events — Project Vault

This vault is the shared memory of the KHB Events sales business and its sales portal, sale.khbevents.com. The team reads and edits it in Obsidian. Claude reads it at the start of every working session and updates it at the end, so nobody has to explain the same thing twice.

New here? Read [[How to Use This Vault]] first.

## Business and sales

- [[KHB Events Company Profile]]: who we are, what we sell, how customers reach us.
- [[Smart City Tea and Cafe Vietnam 2026]]: the trip currently on sale.
- [[Sales Playbook]]: how a lead becomes a booked seat.
- [[FAQ Answers]]: approved answers to the questions customers ask.
- [[Telegram Reply Templates]]: ready-to-paste replies in English and Khmer.
- [[Copy Rules]]: how we write sales copy, in English and Khmer.
- [[Glossary]]: words we use, in both languages.

## The sales portal

- [[System Map]]: how the website and admin fit together.
- Features: [[Landing Pages CMS]], [[Leads CRM]], [[Round Robin]], [[Ads and Popups]], [[Languages]], [[Image Uploads]], [[Content Packs]], [[Tracking and Analytics]], [[Admin and Security]].
- Runbooks: [[Deploy to Production]], [[Verify Changes Locally]], [[Launch a New Trip Page]], [[Add a Sales Staff Member]], [[Create a Popup]], [[Change the Admin Password]], [[Rotate the Telegram Bot Token]], [[Run the RLS Lockdown Migration]].

## Keeping track

- [[Open Tasks]]: what still needs doing, and who does it.
- [[Decision Log]]: what we decided, when, and why.
- [[Landing Page Builder Roadmap]]: where the landing page system is going, phase by phase.
- [[Project History]]: what was built, in order.
- Sessions folder: one short log per working session with Claude.

## Rules for this vault

1. **No secrets.** Never write passwords, bot tokens, API keys or database keys here. The vault is stored in git, and git keeps deleted text forever. Write where a secret lives, never the secret itself.
2. **The admin is the source of truth for live numbers.** Prices, deadlines and seats left are set in Admin → Landing Pages CMS. Notes explain them; when they disagree, the admin wins and the note gets fixed.
3. **No invented facts.** No made-up testimonials, customer names, statistics or partner names, in notes or on the website.
4. **One idea per note, linked with `[[double brackets]]`.** Short notes that link to each other beat one long document.
