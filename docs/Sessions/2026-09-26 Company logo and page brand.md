---
type: session
date: 2026-09-26
tags: [session]
---

# Company logo and per-page brand and contact

## Asked for

- A custom company logo in Settings → Company & Public Contact Information, and each landing page able to have its own logo and details.

## Done

- **Company logo** upload in Settings → Company (preview on light and dark). Used in the admin menu, login, public pages (navbar, footer, Vietnam classic views) and the print.
- **Brand & contact on this page** in the builder's Page settings: own logo, company name, phone, Telegram, WhatsApp, email, address; empty = company settings.
- New builder component **Contact & company** (Footer / Contact card) showing those details as tap-to-contact buttons.
- The print uses the page's details, else the company's, and now shows the address.
- See [[Admin and Security]], [[Page Builder]], [[Print Agenda]].

## Verified

- tsc, eslint, 214 unit tests (5 new: fallback rules, unsafe logo addresses refused, the new section and the Page map), production build.
- Browser: upload and save the company logo; admin menu and login show it; add Contact & company to the Korea page; page logo and Telegram override in the preview, saved, on the public page (phone and desktop, no sideways scroll), and on its print; another page's print keeps the company logo; no page errors. Test data and test images removed afterwards.

## Decisions

- Logo stored as its own settings row; page details override field by field (in [[Decision Log]]).

## Follow-ups

- Owner: upload the logo; check the Korea page's Telegram username (a bot handle) before adding a Contact section (in [[Open Tasks]]).
- The browser-tab icon is still the built-in logo.
