---
type: trip
status: on-sale
landing_page: /smart-city-tea-cafe
tags: [trip, vietnam, business-trip]
updated: 2026-09-25
price_usd: 550
departure: 2026-10-08
return: 2026-10-11
source:
  - src/components/landing/smart-city-content.ts
  - content/pages/smart-city-tea-cafe.json
  - data/db.json (page smart-city-tea-cafe, public fields only)
  - src/lib/classic-to-builder.ts
  - src/components/landing/SmartCityLandingPageView.tsx
  - src/app/[slug]/page.tsx
---

# Smart City Tea and Cafe Vietnam 2026

> Live price, deadlines and seats left are set in Admin → Landing Pages CMS. This note explains the trip; the admin is the source of truth for numbers.

> [!info] Page moved to the builder (2026-09-25)
> The page is now a drag-and-drop builder page: Admin → Landing Pages CMS → Edit, or the sidebar link. Price, registration deadline and seats are in the builder's **Offer** panel, copied from the old admin settings. The sale-phase table below describes the old layout.
>
> The builder has one countdown: early-bird price, then the registration deadline. It hides itself once the date has passed.
>
> These were not carried over: the seat map, the industry matchmaker tabs, the stats strip, the two-tier price cards and the sticky bars. See [[Page Builder]].

**Full name:** Smart City, Tea & Cafe Business Trip to Vietnam 2026.

**In one line:** a 4-day B2B trip to Hanoi and Halong Bay for Cambodian café, tea and retail-tech owners: two international expos, a factory visit and matched supplier meetings, with a trilingual guide.

**Headline on the page:** "Come home with suppliers, not just photos."

## Key facts

| Fact | Value | Where it comes from |
|---|---|---|
| Dates | 8 to 11 October 2026 | Page subtitle in the content pack |
| Length | 4 days / 3 nights | Page copy |
| Destinations | Hanoi and Halong Bay, Vietnam | Page copy |
| Departure | 2026-10-08, from Phnom Penh | Page `eventDate` in the seed |
| Seat price | **$550 per person** | Owner. The repo has the same value for both early-bird and regular price. |
| Total seats | 30 | Value in the repo at the time of writing. Live value: Admin → Landing Pages CMS. |
| Seats already taken | 19 | Value in the repo at the time of writing. Live value: Admin → Landing Pages CMS. |
| Early-bird deadline | 2026-09-08 | Value in the repo. The owner sets it in the admin. |
| Registration deadline | 2026-09-20 | Value in the repo. The owner sets it in the admin. |

The early-bird price and regular price are both $550 in the repo. When the two prices are equal, the page shows one price and no early-bird offer (`salePhaseAt` in `src/components/landing/SmartCityLandingPageView.tsx`).

The page changes its urgency text by itself, based on the dates in the admin:

| Phase | When | What the page says |
|---|---|---|
| Early | Before the early-bird deadline, only if early bird is cheaper | Early-bird savings and deadline |
| Standard | Before the registration deadline | "Registration closes …" |
| Final | After registration closes, through the departure day | "Final seats", seats confirmed by phone |
| Departed | After that | "This delegation has departed" |

With the repo dates, today (2026-09-24) is in the **Final** phase. Check the admin: the owner may have changed the dates.

> [!warning] Deadlines belong to the owner
> The owner sets registration and early-bird deadlines in the admin personally. Code and content packs must never overwrite them. See [[Content Packs]].

## Who it is for

The page names four groups (`audiences` in `src/components/landing/smart-city-content.ts`):

| Group | What they come for |
|---|---|
| Smart city and tech importers | IoT, smart-home, smart-lighting and security equipment from certified manufacturers |
| Cafe and tea brand owners | Vietnamese tea and coffee beans, syrups, packaging, espresso machines and brewing equipment at factory prices |
| Wholesalers and distributors | Exclusive distribution rights, factory-direct wholesale pricing, OEM/ODM partnerships |
| F&B entrepreneurs and investors | Franchise brands, new beverage concepts and retail models to bring to Cambodia |

The content pack adds a fifth group: anyone exploring IoT, coffee or tea businesses.

Who it is **not** for, in the page's words: "If you only want to sightsee, a tour company will serve you better."

The form asks the visitor to pick one: Cafe or tea brand, Smart city / tech, Wholesaler / importer, F&B investor.

## What they get

What the page says the buyer takes home (core values):

1. **Factory-direct pricing.** Buy at the source and cut 25 to 35% off what brokers charge. One negotiated container order can pay for the whole trip.
2. **Trust built face to face.** Walk the factory floor and see the QC lab before wiring money.
3. **Exclusive rights for Cambodia.** Sign distribution before another importer does.
4. **Next year's products, this year.** Two international expos in one trip.
5. **Business and leisure in one trip.** Expo days and a factory visit, then Hanoi Old Quarter and a Halong Bay cruise (content pack only).
6. **See your market from outside** (content pack only).

## Itinerary

From the content module. Times are local.

| Day | Date | Where | What happens |
|---|---|---|---|
| 1 | Oct 8, 2026 | Phnom Penh → Hanoi | 17:45–21:35 flight to Hanoi (Noi Bai). 22:30 private coach to hotel. Optional evening walk. |
| 2 | Oct 9, 2026 | Hanoi | Breakfast. 10:00–12:00 **Cafe Show Vietnam** at the Vietnam Exhibition Center. Lunch. 13:00–16:00 **matched B2B meetings** and price negotiations with suppliers. Evening: Hanoi Old Quarter walk and dinner. |
| 3 | Oct 10, 2026 | Hanoi → Halong Bay | Breakfast. 10:00–12:00 **Smart City Expo** (IoT, smart lighting, infrastructure, tech). Lunch. 13:00–15:30 visit to a wholesale coffee and tea roasting factory and showroom. 15:30–18:30 transfer to Halong Bay. Night market. |
| 4 | Oct 11, 2026 | Halong Bay → Phnom Penh | 07:30–11:30 Halong Bay cruise with seafood lunch. Transfer to Noi Bai Airport. 18:00–20:30 flight back to Phnom Penh. |

The itinerary is edited in Admin → Landing Pages CMS → the page → Itinerary.

## Price and what it includes

**Seat price: $550 per person** (owner fact). Always check the live price in the admin before quoting.

The price includes nine things. The page shows what each would cost if arranged alone:

| Included | Cost if arranged alone (page copy) |
|---|---|
| Round-trip flights Phnom Penh – Hanoi | $220 |
| Hotel, 3 nights, twin or double sharing | $150 |
| Breakfast every day | $25 |
| Private air-conditioned coach in Vietnam | $80 |
| Trilingual business guide (Khmer, English, Vietnamese) | $60 |
| Expo passes: Cafe Show Vietnam and Smart City Expo | $120 |
| Border and customs help | $40 |
| Factory and wholesale visits | $150 |
| Halong Bay cruise and Hanoi tour | $65 |
| **Total if arranged alone** | **$910+** |

**Not included** (FAQ copy): lunches and dinners outside the listed programme (the cruise lunch is included), a Vietnam SIM card, travel insurance, personal shopping.

On the page (since 2026-09-26) both lists sit side by side in the **Included & not included** section: "Included in your seat" (the nine items) and "Not included" (these four). The FAQ answer says the same; change both together. See [[Page Builder]].

**Single room:** the price is twin or double sharing. A single room is possible for "a small supplement". The amount is not in the repo.

**Payment:** nothing to pay on the first step. The buyer pays after the confirmation call, once flights, hotel and factory schedule are confirmed. An official tax invoice and the full itinerary are sent on Telegram. Payment details (bank, Bakong KHQR) are set per page in Admin → Landing Pages CMS → the page → Dedicated Landing Page Settings → Invoicing & KHQR.

**Refunds** (FAQ copy): cancel at least 14 days before departure and, if the seat is refilled from the waitlist, full refund. If KHB Events cancels, everyone gets a full refund.

## Sales notes

- **Common questions:** visa, "do I pay today", invoice, room, what is not included, refund, language, bringing a partner, passport validity. All answers are in [[FAQ Answers]].
- **Response promise in the copy:** the coordinator calls within 15 minutes. The coordinator card says "Replies within 15 minutes in business hours."
- **Coordinator name** shown on the page is set in Admin → Landing Pages CMS → the page → Dedicated Landing Page Settings → Coordinator Name. Without it, the page says "our coordinator".

### Angles from the copy

| Angle | Line from the page |
|---|---|
| Outcome, not a trip | "Come home with suppliers, not just photos." |
| Cost of doing nothing | "Why importers who source online pay up to 35% more" |
| Low risk | "Reserve my seat, no payment today" |
| Trust | "Walk the factory floor, see the QC lab and look your supplier in the eye before a single dollar is wired." |
| Scarcity (true numbers only) | "{seats left} of {total} seats left" |
| Fit | "Built for owners and decision-makers who can sign a supplier deal on the spot." |

### Objections and answers

| Objection | Answer from the copy |
|---|---|
| Too expensive | $910+ if arranged alone; one negotiated container order can pay for the trip. No discounts. See [[Telegram Reply Templates]]. |
| I don't speak English or Vietnamese | A trilingual guide sits beside you in every meeting. |
| I'm not sure yet | Nothing to pay today. You decide after the call. |
| What if I cancel? | Refund rule above. |

## Page variants

| URL | What it is |
|---|---|
| `/smart-city-tea-cafe` | The full sales page |
| `/smart-city-tea-cafe?lang=kh` | Opens in Khmer |
| `/smart-city-tea-cafe/app` (or `?view=app`) | Mobile app-style booking view |
| `/smart-city-tea-cafe/optin` (or `?view=optin`) | Short opt-in page: name and phone only |

Routing lives in `src/app/[slug]/page.tsx`, `src/app/[slug]/app/page.tsx` and `src/app/[slug]/optin/page.tsx`.

> [!warning] Old $499 price still in code
> The repo still holds an old early-bird price of $499 in a few places:
> - **App view** (`src/components/landing/SmartCityAppView.tsx`): the "Lock In $499" button, the "Early Bird $499 Ends In" countdown label and the "Your early bird price" total are typed into the code. They show $499 no matter what the admin says.
> - **Opt-in view** (`src/components/landing/SmartCityOptinView.tsx`): $499 is only a fallback when the admin has no early-bird price.
> - **Link preview** (`src/app/[slug]/page.tsx`): the fallback share text says "Early Bird $499". It is used only when the page is missing from the database.
>
> Open each view on the live site and check the price before you share its link. Fixing the app view is a code task.

## Where the content lives

- Default English and Khmer copy: `src/components/landing/smart-city-content.ts`
- Content pack (headline, sections, FAQ, form, Khmer): `content/pages/smart-city-tea-cafe.json`. See [[Content Packs]].
- Live numbers: Admin → Landing Pages CMS. See [[Landing Pages CMS]].
- `src/lib/smart-city-content.json` is an older copy file. No code uses it, and it still has an old early-bird price. Ignore it.

## Links

- Landing page: `/smart-city-tea-cafe`
- Related: [[Sales Playbook]], [[FAQ Answers]], [[Telegram Reply Templates]], [[KHB Events Company Profile]], [[Copy Rules]], [[Launch a New Trip Page]]

## To confirm

- [ ] Should the old $499 price be removed from the app view code? (See the warning under "Page variants".)
- [ ] Single-room supplement amount.
- [ ] Deposit or payment schedule, and the payment deadline before departure.
- [ ] Current live seats taken and deadlines (check the admin).
- [ ] Are there real testimonials or outcome photos from past delegations? The owner will provide them; until then the section stays hidden.
