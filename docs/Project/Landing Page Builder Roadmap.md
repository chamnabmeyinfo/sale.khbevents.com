---
type: roadmap
status: proposed
tags: [roadmap, landing-pages]
updated: 2026-09-24
---

# Landing Page Builder Roadmap

**Goal (owner, 2026-09-24):** our own landing page system that is easy to use and can sell **anything**, not only trips.

**Done means:** anyone on the team can build a bilingual page that sells in about 15 minutes, cannot publish something broken or untrue, and can see which version sells best. Every page stays connected to [[Round Robin]], the [[Leads CRM]] and [[Ads and Popups]].

## The key idea: build around the offer

Today the system is built around trips (seats, itinerary, departure date). To sell anything, every page is built around an **Offer**: the thing being sold, its price and its action. Blocks read their facts from the Offer, so a price or date is typed once and can never disagree across the page.

| Offer type | Examples | Main button | Special fields |
|---|---|---|---|
| Seats | Trips, events, workshops, expo tickets | Reserve a seat | Date, seats total and left, deadlines, itinerary or agenda |
| Product | Physical goods, bundles | Order now | Variants (size, color), stock, delivery area and fee |
| Service | Event production, consulting, rentals | Get a quote / Book a call | Packages, what's included, booking slots |
| Digital | Courses, memberships, e-books | Buy / Get access | Access link sent after payment |
| Lead only | Anything sold by conversation | Chat on Telegram | Just the question you want answered |

Every offer type shares: bilingual name and description, price or "from" price, optional discount with a real end date, payment options (KHQR, ABA, bank transfer, cash on delivery), and the contact route (form, Telegram through round robin, phone).

## The owner's vision: designed components, dragged onto a page (2026-09-24)

"A page system that lets me drag and drop and design beautiful sales page components. Each component has its own uniqueness and core value."

What this means for the build:

- **Every component has a sales job** (its core value), written on the component itself: e.g. Hero = promise the result, Offer card = make the price and urgency clear, FAQ = remove doubt, Guarantee = remove risk, Form = capture the lead.
- **Every component has its own designed variants**, not one generic layout: e.g. Hero as split photo, full-bleed photo, video background or minimal text.
- **Design controls per component**, inside safe limits: theme (dark, light, brand), background (colour, gradient, photo), alignment, spacing, accent colour, animation on or off.
- **Drag and drop**: a component library on the left, the live page in the middle, settings on the right. Components snap into place as full-width sections so every page still works on a phone.
- **A brand kit** (fonts, colours, button style, corner radius) set once, so every component looks consistent and beautiful by default.
- **My components**: save a designed component or a whole page as a reusable template.
- **Health hints** on each component: missing button, headline too long, Khmer missing, fake-looking claim.

## Phases

### Phase 1 — Fix the foundations
- [ ] Fix the known bugs in [[Open Tasks]]: wrong price on the app view, popup cooldown, Khmer spelling.
- [ ] Deadline fields in the editor; new pages start as **draft** with no sample testimonial.
- [ ] Add the **Offer** to the page data, and move the Smart City facts into it without changing the live page.

### Phase 2 — Block builder with live preview
- [ ] Turn the Smart City design into reusable blocks: hero, offer card (price, seats or stock, countdown), benefits, how it works, what's included, gallery, packages or variants, FAQ, guarantee, coordinator, form, final call to action.
- [ ] Type-specific blocks: itinerary and agenda (seats), variants and delivery (product), booking slots (service), curriculum (digital).
- [ ] One screen: the page on the right, click a block to edit it on the left. English and Khmer side by side. Phone and desktop toggle. Drag to reorder, switch to hide.
- [ ] Every block reads prices, dates and counts from the Offer.

### Phase 3 — New-page wizard
- [ ] Pick the offer type, answer about ten questions, pick a template.
- [ ] Claude drafts the English and Khmer copy with the [[Copy Rules]]; the owner reviews before publishing.
- [ ] Templates per offer type, each based on what already converts on our best page.

### Phase 4 — Ordering and payment
- [ ] Orders next to leads in the CRM: what was ordered, quantity, variant, amount, payment status.
- [ ] KHQR / ABA payment step with the QR shown on the thank-you screen and a "paid, send proof" button that alerts the salesperson on Telegram.
- [ ] Stock and seat counts go down automatically when an order is confirmed.
- [ ] Order confirmation in the customer's language.

### Phase 5 — Safe publishing
- [ ] Private preview link, version history with one-click undo, scheduled publish.
- [ ] A check before publishing that blocks: missing Khmer text, a deadline or discount already expired, no images, a test price, a testimonial without a real source.

### Phase 6 — Selling smarter
- [ ] A/B tests on headline, image or button, with the winner shown by leads and orders, not clicks.
- [ ] Funnel per page: visits, clicks, Telegram chats, form leads, orders, won deals.
- [ ] A catalogue page listing every open offer.
- [ ] Roles: sales staff can edit text, only the owner changes prices and publishes.

## Rules for the whole system
- Bilingual first: every visible string has English and Khmer.
- Truthful by design: no invented reviews, counts or deadlines; urgency only from real data.
- Phone first: the main button is on the first phone screen.
- Every page is connected to [[Round Robin]] and the [[Leads CRM]] without setup.

## To confirm
- Who builds pages: only the owner, or sales staff too?
- Design freedom: answered by the owner on 2026-09-24: drag-and-drop designed components (see the vision above). Still to confirm: sections only, or free placement of elements inside a section?
- Online payment: is showing KHQR / ABA and confirming by hand enough at first, or is an automatic payment gateway needed?
- Delivery for products: which areas, and is the fee fixed or by zone?
- First priority after Phase 1: easy building (Phases 2–3) or taking orders (Phase 4)?

Related: [[Landing Pages CMS]], [[Launch a New Trip Page]], [[Decision Log]], [[Open Tasks]].
