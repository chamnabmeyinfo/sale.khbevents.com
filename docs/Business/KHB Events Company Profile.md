---
type: business
tags: [business, company]
updated: 2026-09-24
source:
  - src/components/landing/smart-city-content.ts
  - src/lib/storage.ts
  - data/db.json (settings: company fields only)
  - src/components/landing/ServicesGrid.tsx
  - src/components/landing/MainSalesView.tsx
  - src/components/landing/FloatingContact.tsx
  - src/app/api/round-robin/route.ts
  - README.md
---

# KHB Events Company Profile

> Contact details and company text are set in **Admin → Settings & Security → Company Profile & Contact**. This note explains them; the admin is the source of truth.

## Who we are

KHB Events is a Cambodian company. The company name in the portal is "KHB EVENTS".

The trip pages describe the company like this (`trustDesc` in `src/components/landing/smart-city-content.ts`):

> KHB Events & Media takes Cambodian owners, importers and investors to verified factories and trade expos across the region, with full support in Khmer, English and Vietnamese from the first call to the flight home.

The brand tagline saved in the seed settings is "Cambodia's Premier Event Management, Staging & Exhibition Production".

## What we sell now

**Business trips.** This is the current focus of the business (owner decision).

A business trip is a seat on an organised B2B trip. Cambodian business owners travel together to trade expos, factories and supplier meetings abroad. KHB Events handles flights, hotel, transport, passes and a guide.

| Trip | Landing page | Note |
|---|---|---|
| Smart City, Tea & Cafe Business Trip to Vietnam 2026 | `/smart-city-tea-cafe` | The trip on sale now. See [[Smart City Tea and Cafe Vietnam 2026]]. |

## Other services on the home page

The home page (`/`, `src/components/landing/MainSalesView.tsx`) also lists event services. These are shown in `src/components/landing/ServicesGrid.tsx`:

- Corporate galas and annual dinners
- Concerts and music festivals
- Exhibitions and custom booth fabrication
- Indoor and outdoor 4K LED screens
- B2B trade delegations and business summits
- Smart ticketing and onsite registration

The home page also has an event budget estimator and a general inquiry form. Right now the sales focus is business trips, not these services.

## How customers reach us

| Channel | Where the customer sees it | What happens |
|---|---|---|
| Registration form | Every trip landing page | A lead is saved in the CRM and sent to one salesperson on Telegram. See [[Leads CRM]]. |
| "Chat on Telegram" button | Trip pages and the home page | The visitor is sent straight to one salesperson's Telegram chat. See [[Round Robin]]. |
| Phone call | "Call" and "Hotline" buttons on the trip page | Calls the phone number set for the page, or the company phone. |
| WhatsApp | Floating button on the home page and on pages built with the general CMS template | Opens WhatsApp with the page's or the company's WhatsApp number. |
| Popups | Landing pages | Promotional popups send visitors to Telegram, the form, or another link. See [[Ads and Popups]]. |

The full lead journey is in [[Sales Playbook]].

## Where contact details are configured

| Detail | Where to change it |
|---|---|
| Company name, tagline, phone, WhatsApp, email, address, social links | Admin → Settings & Security → Company Profile & Contact |
| Telegram alert bot | Admin → Settings & Security → Instant Telegram Alerts |
| A trip's own phone, Telegram contact and coordinator | Admin → Landing Pages CMS → edit the page → Dedicated Landing Page Settings |
| Which salesperson gets each lead | Admin → Staff Round Robin (the staff list) |

Values as configured in the seed (`data/db.json` and `defaultSettings` in `src/lib/storage.ts`). They may be placeholders; confirm in Admin → Settings & Security:

| Field | Seed value |
|---|---|
| Company name | KHB EVENTS |
| Phone | +855 12 888 999 |
| Email | sale@khbevents.com |
| Address | Diamond Island (Koh Pich), Phnom Penh, Cambodia |
| Facebook | facebook.com/khbevents |
| TikTok | tiktok.com/@khbevents |

The trip page code has its own fallback phone (`GENERAL.contactPhone` in `src/components/landing/smart-city-content.ts`). It is only used when neither the page nor Settings has a phone.

## Brand promises we keep

- No payment on the first step. The customer reserves with name and phone.
- A real person replies. The page copy promises a call within 15 minutes.
- Support in Khmer, English and Vietnamese.
- No invented testimonials. The old placeholder testimonials are hidden until real ones exist.

How we write about the company is in [[Copy Rules]]. Words we use are in [[Glossary]].

## To confirm

- [ ] Are the seed phone number and email the real business contacts?
- [ ] Is "KHB Events & Media" the official full company name?
- [ ] The seed database also has a published page "Korea B2B Business Delegation 2026 (Seoul)" at `/korea-b2b-trip-2026`. Is that trip still on sale?
- [ ] Owner to supply real testimonials and outcome photos (see [[Open Tasks]]).
