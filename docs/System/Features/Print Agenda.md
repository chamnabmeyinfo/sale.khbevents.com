---
type: feature
tags: [system, feature, landing-pages, print]
updated: 2026-09-25
admin_path: /admin/pages
admin_menu: Landing Pages CMS → printer icon on a page card, or the builder → Print agenda
source:
  - src/app/[slug]/print/page.tsx
  - src/lib/print-plan.ts
  - src/lib/qr.ts
  - src/styles/print.css
  - src/components/builder/icons.tsx
  - src/components/print/PrintButton.tsx
---

# Print Agenda

## What it does for sales

Every landing page prints as a designed A4 document at `sale.khbevents.com/<page>/print`. Staff print it for meetings and walk-ins; visitors print it or save it as a PDF. It is built from the page each time it opens, so a print always shows the **last saved update**.

## Two print modes

| Mode | Link | What it prints |
|---|---|---|
| **Agenda** (default) | `/<page>/print` | Straight to the point for a visitor to review. The page decides what to keep (see below) |
| **Entire page** | `/<page>/print?mode=full` | Every section, in the page's order, with photos and the full FAQ |

Other options on the toolbar: **EN / ខ្មែរ** (`?lang=kh`), **Photos On / Off** (`?photos=0`, saves ink), **Print or save as PDF**. The toolbar and the explanation box are not printed.

## How the agenda decides (smart agenda)

The page reads what the page sells (`classifyNature` in `src/lib/print-plan.ts`):

| Page type | How it is recognised | Agenda prints |
|---|---|---|
| **Trip** | a How it works section whose steps are days or hold times ("Day 1 · …", "08:00 - 09:00 …") | Programme as a day-by-day timeline, places to visit, what's included, how to join, who it's for (as tags) |
| **Event** | a deadline or a seat counter, no programme | The main benefits (6 at most), places to visit (benefits with website links, such as trade fairs), what's included, how to join, who it's for, 4 questions |
| **Product** | anything else | Benefits, what's included (or the price card list), how to buy, 4 questions |

The **Included & not included** section prints on both the agenda and the entire page, as two boxes (green ticks, red crosses).

The logo, company name and contact line at the top and bottom come from the page's Brand & contact settings, else the company settings (see [[Admin and Security]]). The page can hide single lines, add a footer note and set its own closing box wording (see [[Page Builder]]). WhatsApp is on the contact line too.

Left out of the agenda: problem sections, long "why" lists, photos, Terms & Conditions and the rest of the FAQ. The screen shows which sections were printed and which were left out, so staff can switch to **Entire page** when needed.

## Design

- Cover: the hero photo with the headline over it (or an accent gradient when photos are off or there is none), company logo, "Agenda" or "Entire page" tag.
- Key facts as icon tiles: price (with "per person" and the regular price when an early-bird price is on), dates of the programme, early-bird date, registration deadline ("Registration closed" once past) and seats left. Beside them a QR code to the live page.
- Programme: one card per day with a time line of times and activities.
- Places, benefits and steps as cards with the page's icons; what's included as a two-column checklist; a guarantee on a brand-coloured section becomes a tinted box.
- Closing dark panel: how to register, contacts from Admin → Settings, the page link and a second QR code.
- Footer: **Last updated** (the page's last save) and **Printed**, in Cambodia time. Page numbers at the bottom of each sheet in Chrome and Edge.

## How to open it

- **Visitors:** the printer icon next to EN / ខ្មែរ at the top right of the page.
- **Staff:** Landing Pages CMS → printer icon on the page card, or the builder's top bar → **Print agenda**.

## Rules

- Draft, passcode and archived pages follow the same access rules as the page itself. The print is not indexed by search engines.
- Pages still on an old layout print too; they are converted on the fly (see [[Page Builder]]).
- After changing a price or a date, save the page, then print again.
- The smart agenda depends on how sections are written: an itinerary is recognised when its steps start with "Day 1", "ថ្ងៃទី ១" or hold times like "08:00 - 09:00".

## Related

- [[Page Builder]], [[Landing Pages CMS]], [[Smart City Tea and Cafe Vietnam 2026]]
