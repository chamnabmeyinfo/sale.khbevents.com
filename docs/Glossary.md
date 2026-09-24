---
type: reference
tags: [glossary, khmer, reference]
updated: 2026-09-24
source:
  - src/lib/i18n/dict/leads.ts
  - src/lib/i18n/dict/nav.ts
  - src/lib/i18n/dict/round-robin.ts
  - src/lib/i18n/dict/editor.ts
  - src/lib/i18n/dict/editor-extras.ts
  - src/lib/i18n/dict/ads.ts
  - src/lib/i18n/dict/pages.ts
  - src/components/landing/smart-city-content.ts
  - .claude/skills/landing-page-copy/references/khmer-copy.md
---

# Glossary

Words we use in sales and in the portal, in English and Khmer. Use the same word every time, on the page and in chat.

The **Source** column says where the Khmer comes from:

- **Admin**: the label in the Khmer admin (`src/lib/i18n/dict/*.ts`)
- **Page**: the Khmer landing-page copy (`src/components/landing/smart-city-content.ts`)
- **Rules**: the Khmer copy rules (`.claude/skills/landing-page-copy/references/khmer-copy.md`)

The Khmer admin is new and a native speaker should review it (see [[Open Tasks]]).

## Business terms

| English | Khmer | Source | Meaning |
|---|---|---|---|
| Business trip / delegation | ដំណើរអាជីវកម្ម | Page | A group trip for business owners to expos, factories and supplier meetings. What we sell now. |
| Delegate | ប្រតិភូ | Page | One person travelling on the trip. |
| Seat | កៅអី | Page | One place on the trip. One person takes one seat. Always "seat", never "pass" or "ticket". |
| Seats left | នៅសល់ … កៅអី | Page | Total seats minus seats taken. Set in the admin. |
| Waitlist | បញ្ជីរង់ចាំ | Page | Where people go when all seats are taken. A seat may not open. |
| Early Bird | Early Bird (តម្លៃ Early Bird) | Admin, Rules | A lower price before a deadline. Shown only when it is really lower than the regular price. |
| Regular price | តម្លៃធម្មតា | Admin | The price after the early-bird deadline. |
| Coordinator | អ្នកសម្របសម្រួល | Page, Admin | The named person who calls the customer and answers questions. |
| No payment today | មិនបង់ប្រាក់ថ្ងៃនេះ | Page, Rules | Our first-step promise: reserve with name and phone only. |
| Tax invoice | វិក្កយបត្រពន្ធ | Page, Rules | The official invoice we send on Telegram. |
| KHQR | Bakong KHQR | Admin | A Bakong payment QR code. A page can hold a KHQR image and bank details for payment (Admin → Landing Pages CMS → the page → Invoicing & KHQR). |
| Supplier | អ្នកផ្គត់ផ្គង់ | Rules | A company that sells goods to our customers. |
| Factory | រោងចក្រ | Rules | Where products are made. We visit one on the trip. |
| Importer | អ្នកនាំចូល | Rules | A business that buys goods from abroad. |
| Distributor | អ្នកចែកចាយ | Rules | A business that resells goods to shops. |
| Wholesale price | តម្លៃបោះដុំ | Rules | The price for buying in bulk. |
| Middleman / broker | ឈ្មួញកណ្តាល | Rules | A reseller who adds a markup between factory and buyer. |
| Exclusive distribution rights | សិទ្ធិចែកចាយផ្តាច់មុខ | Rules | The only right to sell a supplier's product in Cambodia. |
| Negotiation | ការចរចា | Rules | Talking price and terms with a supplier. |
| MOQ | MOQ | Rules | Minimum order quantity. The Latin acronym stays in Khmer. |
| B2B Matchmaking | B2B Matchmaking (ការផ្គូផ្គងដៃគូអាជីវកម្ម) | Rules | Meetings we arrange between a customer and suppliers that fit their business. |
| Trilingual guide | មគ្គុទ្ទេសក៍ ៣ ភាសា | Page | A guide who speaks Khmer, English and Vietnamese. |

## Portal terms

| English | Khmer | Source | Meaning |
|---|---|---|---|
| Landing page | ទំព័រ Landing | Admin | One sales page for one trip, e.g. `/smart-city-tea-cafe`. See [[Landing Pages CMS]]. |
| Landing Pages CMS | គ្រប់គ្រងទំព័រ Landing | Admin | The admin screen where pages, prices, seats and deadlines are edited. |
| Lead | Lead | Admin | A person who sent the form. Saved in the CRM. The Khmer admin keeps the English word. |
| CRM | អតិថិជន និង CRM | Admin | Admin → Leads & CRM Pipeline: the list of leads and their status. See [[Leads CRM]]. |
| Round Robin | ចែក Lead តាម Round Robin | Admin | Shares new leads and Telegram clicks between salespeople by their percentage. See [[Round Robin]]. |
| Routing percentage | ភាគរយចែក Lead | Admin | Each salesperson's share of new leads. |
| Remember a visitor | ចងចាំអ្នកទស្សនារយៈពេល | Admin | Keeps a returning visitor or customer with the same salesperson for 1, 2, 3 or 6 months, or off. |
| Returning customer | អតិថិជនចាស់ | Admin | Same phone or email as an earlier lead. Kept with their salesperson. |
| Fallback (manager chat) | Chat ID Telegram អ្នកគ្រប់គ្រង (Fallback) | Admin | Where a lead goes when the alert to the salesperson fails. |
| Chat ID | Chat ID | Admin | The number that lets the bot message a person or group on Telegram. |
| Popup | Popup | Admin | A promotional box on a landing page. Menu: ផ្សព្វផ្សាយ និង Popup. See [[Ads and Popups]]. |
| Content pack | — | — | A JSON file in `content/pages/` holding a page's copy. No Khmer admin label. See [[Content Packs]]. |
| Import JSON | នាំចូល JSON | Admin | Admin button that applies a content pack to a page. |
| Total seats | កៅអីសរុប | Admin | Seat capacity set on the page. |
| Claimed seats | កៅអីបានកក់ | Admin | Seats already taken. Updated by hand in the admin. |
| Settings | ការកំណត់ និងសុវត្ថិភាព | Admin | Company details, Telegram bot and admin security. See [[Admin and Security]]. |

## Lead statuses

As labelled in Admin → Leads & CRM Pipeline (`src/lib/i18n/dict/leads.ts`). How to use them: [[Sales Playbook]].

| Status (English admin) | Khmer admin | Meaning |
|---|---|---|
| NEW | ថ្មី | Just arrived. Nobody has spoken to them yet. |
| CONTACTED | បានទាក់ទង | We reached them. |
| PROPOSAL SENT | បានផ្ញើសំណើ | Itinerary, price or invoice sent. |
| NEGOTIATING | កំពុងចរចា | They are deciding or arranging payment. |
| WON | ជោគជ័យ | Seat paid and confirmed. |
| LOST | បរាជ័យ | Not going ahead. |

## Related

[[Copy Rules]] · [[FAQ Answers]] · [[Telegram Reply Templates]] · [[System Map]] · [[Languages]]
