---
name: landing-page-copy
description: Write or rewrite the copy of a KHB Events sales landing page (business trips, trade delegations, expo tours, B2B matchmaking trips, and any event we sell seats for) so it converts. Use it whenever the user asks to improve, review, rewrite, translate or "make more engaging" the content, headline, CTA, pricing, FAQ or form of a landing page, or asks for a new page for a product or trip, even if they do not say "copywriting". Also use it before touching the CONTENT block of a landing view or the page JSON in the CMS.
---

# Landing page copy for KHB Events

KHB sells seats on organised business trips to Cambodian SME owners: café and tea
brand owners, importers, wholesalers, retail-tech investors. A seat costs a few
hundred dollars, is bought by the owner personally, and is confirmed by a phone
call. The page has one job: get a name and phone number into the form. Everything
below serves that.

## How the buyer decides

Read `references/psychology.md` for the full list, but keep these in your head:

- **They buy an outcome, not a trip.** Suppliers signed, margin recovered, a
  competitor beaten to a distributor deal. Flights and hotels are proof the
  outcome is easy, never the headline.
- **Their fear is looking foolish.** Wasting money, being the only small business
  in the room, coming home with photos and no deals. Answer that fear before the
  price appears.
- **They trust people, not badges.** A named coordinator with a phone number,
  Telegram they can open now, the organiser's history. A "100% secure" badge
  means little in Phnom Penh; a person who answers in 15 minutes means a lot.
- **They decide on the phone.** The form is a low-commitment step. Say so,
  every time: no payment today, a real person calls, you can still say no.
- **Time pressure only works when it is true.** A passed deadline still on the
  page destroys every other claim. Dates and prices must come from data, never
  be typed into copy.

## Page blueprint

The section order for a delegation page, with the one job of each. Full copy
formulas and worked examples are in `references/business-trip-page.md`.

1. **Hero**: what, for whom, the outcome, one CTA, one risk-reversal line.
2. **Proof strip**: real count of seats taken and the kinds of businesses in the room.
3. **Core value**: the three or four outcomes they take home. Numbers over adjectives.
4. **Problem**: the cost of sourcing alone, in their own words. Then a one-line bridge.
5. **Who it is for**: let them recognise themselves. Exclude the wrong buyers.
6. **What you get**: the value stack. Everything handled, standalone prices, total.
7. **Matchmaker / ROI**: pick your industry and see suppliers, margins, sessions.
8. **Itinerary**: day by day. Business hours first, leisure second.
9. **Seats**: the live roster. Real scarcity, visible.
10. **Testimonials**: real people, named outcomes, role and company.
11. **Pricing**: one anchor, one price, what is and is not included.
12. **Three steps + guarantee**: reserve, call, fly. No payment today. Refund terms.
13. **Register**: two fields, the coordinator's name, Telegram alternative.
14. **FAQ**: objections in the order buyers raise them, visa and payment first.
15. **Final CTA**: seats left, who is already in, what happens if they wait.

## Writing rules

- Lead with the specific: "Meet 30+ roasters and machine makers in one hall"
  beats "an incredible networking opportunity".
- One idea per sentence. Headlines under 12 words. Buttons say what happens
  next: "Reserve my seat, no payment today", never "Submit".
- Every number must be true and sourced from the CMS. Prices, seat counts,
  deadlines and savings are computed in code from `page.urgency`; copy contains
  placeholders or template functions, never a literal "$499" or "Sept 8".
- Say who is speaking. "Our coordinator Sovann calls you" beats "you will be contacted".
- Cut adjectives that a competitor could also claim (premium, exclusive,
  world-class). Keep the ones that carry a fact (trilingual, factory-direct).
- Never invent testimonials, partner names, attendee counts or statistics. If a
  figure is missing, write the copy so it reads well without it and tell the
  user what to supply.
- Khmer is written for Khmer readers, not translated word for word. Rules and
  vocabulary are in `references/khmer-copy.md`.

## Where copy lives in this repo

- `src/components/landing/smart-city-content.ts`: default English and Khmer copy
  for the Smart City template, keyed by section. Template functions take the live
  price, seat and date values.
- `src/components/landing/SmartCityLandingPageView.tsx`: merges CMS page data
  over those defaults. CMS wins where set. Read the `c = {...}` block before
  changing a key so you know whether the CMS can override it.
- `data/db.json`: the bundled fallback page data. Production reads Supabase, so
  a CMS copy change ships as a JSON content pack the admin imports from
  Admin, Pages, "Import JSON", not as a code change.
- `LandingPageTranslation` in `src/lib/types.ts` lists which fields the CMS can
  translate to Khmer. Anything outside it is code-only copy.

## Workflow

1. Read the live page data (CMS JSON) and the current copy. List every claim
   with a number or date and check each is still true today.
2. Write the copy section by section in English, following the blueprint.
   Read it aloud once; cut every sentence that does not move the reader toward
   the form.
3. Write Khmer from the English intent, not the English sentences.
4. Put shared facts (price, seats, dates, coordinator) in data, not in strings.
5. Run the QA list in `references/qa-checklist.md`, then build, lint and load
   the page in both languages on mobile width before shipping.
