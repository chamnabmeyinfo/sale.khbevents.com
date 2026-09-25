---
type: feature
tags: [system, feature, landing-pages, print]
updated: 2026-09-25
admin_path: /admin/pages
admin_menu: Landing Pages CMS → printer icon on a page card, or the builder → Print agenda
source:
  - src/app/[slug]/print/page.tsx
  - src/lib/print-agenda.ts
  - src/lib/qr.ts
  - src/styles/print-agenda.css
  - src/components/print/PrintButton.tsx
---

# Print Agenda

## What it does for sales

Every landing page has a printable agenda at `sale.khbevents.com/<page>/print`. Staff print it for meetings and walk-ins, and visitors print it or save it as a PDF to keep. It is built from the page each time it opens, so a print always shows the **last saved update**.

## What is on the sheet (A4)

- Company name and logo, the page headline, badge and intro.
- Price, early-bird date, the registration deadline ("Closed on" once it has passed) and seats left: the same values as the builder's Offer panel.
- Every section with words in it: benefits, what's included, the price card list, the itinerary with times, the steps, the guarantee and the FAQ.
- A **QR code** to the live page, so a reader can register or check the newest version.
- Contact details from Admin → Settings (phone, Telegram, e-mail), the page link, **Last updated** and **Printed** date and time (Cambodia time).

Left out on paper: the lead form, buttons, photo gallery and countdowns.

## How to open it

- **Visitors:** the printer icon next to EN / ខ្មែរ at the top right of the page.
- **Staff:** Admin → Landing Pages CMS → printer icon on the page card, or the builder's top bar → **Print agenda** (opens in the language shown in the builder).
- On the agenda: EN / ខ្មែរ switch, then **Print or save as PDF**. `?lang=kh` in the link opens the Khmer version.

## Rules

- Draft, passcode and archived pages follow the same access rules as the page itself.
- The agenda is not indexed by search engines.
- Pages still on an old layout print too; they are converted on the fly (see [[Page Builder]]).
- "Last updated" is the page's last save. After changing a price or a date, save the page, then print again.

## Related

- [[Page Builder]], [[Landing Pages CMS]], [[Smart City Tea and Cafe Vietnam 2026]]
