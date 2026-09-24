---
type: guide
tags: [copywriting, khmer, landing-page]
updated: 2026-09-24
source:
  - .claude/skills/landing-page-copy/SKILL.md
  - .claude/skills/landing-page-copy/references/psychology.md
  - .claude/skills/landing-page-copy/references/business-trip-page.md
  - .claude/skills/landing-page-copy/references/khmer-copy.md
  - .claude/skills/landing-page-copy/references/qa-checklist.md
  - .claude/skills/landing-page-copy/references/design.md
---

# Copy Rules

How we write sales copy for KHB Events landing pages, in English and Khmer. This is a short summary. The full rules are in the `landing-page-copy` skill in the repo.

> [!info] Claude uses these rules automatically
> Whenever Claude is asked to write, improve, review or translate landing-page copy (headline, CTA, pricing, FAQ, form, or a new trip page), it loads the `landing-page-copy` skill first. You do not need to ask for it.

## The one job of the page

Get a name and a phone number into the form. Everything on the page serves that.

The buyer is a Cambodian business owner: café and tea brand owners, importers, wholesalers, retail-tech investors. They pay for the seat personally and decide on the phone.

## How the buyer decides

- **They buy an outcome, not a trip.** Suppliers signed, margin recovered. Flights and hotel are proof it is easy, never the headline.
- **Their fear is looking foolish.** Wasting money, coming home with photos and no deals. Answer that fear before the price.
- **They trust people, not badges.** A named coordinator, a phone number, a Telegram chat that answers.
- **They decide on the phone.** The form is a small step. Say so every time: no payment today, a real person calls, you can still say no.
- **Time pressure only works when it is true.** A passed deadline still on the page destroys every other claim.

## Writing rules

- Lead with the specific. "Meet 30+ roasters in one hall" beats "an incredible networking opportunity". (This is a style example from the skill, not a checked fact about any trip.)
- One idea per sentence. No sentence over 25 words in body copy.
- Headlines under 12 words, and they state an outcome.
- Buttons say what happens next: "Reserve my seat, no payment today". Never "Submit".
- Say who is speaking: "Our coordinator calls you" beats "you will be contacted".
- Cut adjectives any competitor could claim (premium, exclusive, world-class). Keep the ones that carry a fact (trilingual, factory-direct).
- One word per idea across the page: always "seat", not seat / pass / ticket in turn.

## Numbers and truth

- **Every number must be true and come from the CMS.** Prices, seats and deadlines are computed from the page data in Admin → Landing Pages CMS. Copy never has a typed "$499" or "Sept 8".
- **Never invent** testimonials, partner names, attendee counts or statistics. If a figure is missing, write copy that reads well without it and ask the owner for the real one.
- **A section with no real content shows nothing.** No placeholder speakers, quotes or booths. The testimonials section stays hidden until the owner supplies real ones.
- **Early bird only when it is really cheaper.** Equal prices mean one plan, one price.
- **Deadlines belong to the owner.** Code and content packs never overwrite them.

## Psychology we use, honestly

Use a principle only when the page has evidence for it. Full list: `.claude/skills/landing-page-copy/references/psychology.md`.

| Principle | How it shows up | Honest when |
|---|---|---|
| Outcome framing | "Come home with suppliers, not just photos." | The outcome is what the trip is built for |
| Anchoring | Standalone value of the package before the price | The standalone prices are realistic |
| Social proof | Seats taken, kinds of businesses in the room | The count is the real number from the admin |
| Scarcity and urgency | Seats left, countdown | Seats and dates come from data |
| Risk reversal | No payment today, full refund if the organiser cancels | The terms are the real terms |
| Low-commitment first step | Name and phone only | The call really comes |
| Loss aversion | "The supplier you want may sign with the importer in that seat" | Used once, near the end |
| Trust transfer | Named expos, the coordinator, a tax invoice | The relationship is real |

## Page order for a business trip

Hero → proof strip → core value → problem → who it is for → what you get → matchmaker → itinerary → seats → testimonials → pricing → three steps and guarantee → register form → FAQ → final call to action.

Copy formulas for each section, with worked examples: `.claude/skills/landing-page-copy/references/business-trip-page.md`.

FAQ order: visa · do I pay today · invoice · room · what if seats sell out · what is not included · refund · language · partner or staff · passport validity. The approved answers are in [[FAQ Answers]].

## Khmer rules

Full rules: `.claude/skills/landing-page-copy/references/khmer-copy.md`.

- Write from the intent of the English, not sentence by sentence. Khmer copy is shorter and plainer.
- Address the reader as **លោកអ្នក** throughout. Never mix with អ្នក in the same section.
- End sentences with **។**. Do not use "—" mid-sentence; start a new sentence.
- Keep proper nouns in Latin script: Cafe Show Vietnam, Smart City Expo, Hanoi, Halong Bay, Telegram, ABA, KHQR, Early Bird.
- **Prices in Latin digits with $:** $550. Dates and counts may use Khmer digits (៨ តុលា ២០២៦), but be consistent within a page.
- Buttons start with a verb: កក់កៅអីឥឡូវ, ជជែកតាម Telegram.
- Trust words that land: មិនបង់ប្រាក់ថ្ងៃនេះ (no payment today), វិក្កយបត្រពន្ធ (tax invoice), សងប្រាក់វិញ ១០០% (100% refund).
- Business words: see [[Glossary]].
- Check every Khmer string on a phone-width screen. Khmer wraps longer.

A Khmer translation of the whole admin was added. A native speaker should review its wording (see [[Open Tasks]]).

## QA before copy ships

Full checklist: `.claude/skills/landing-page-copy/references/qa-checklist.md`. The highlights:

- [ ] Every price on the page equals the early-bird or regular price in the admin.
- [ ] No deadline older than today is shown.
- [ ] Seat counts come from data in every section.
- [ ] Testimonials, partner names and counts are real, or the section is hidden.
- [ ] Headline under 12 words; no button says "Submit".
- [ ] Every English string has a Khmer version, and prices match in both languages.
- [ ] Coordinator name and phone match the page settings.
- [ ] If CMS copy changed, the content pack in `content/pages/` is updated. See [[Content Packs]].
- [ ] Typecheck, lint, tests and build pass, and the page is checked in both languages on a phone. See [[Verify Changes Locally]].

## Design rules

Layout, buttons and motion for landing pages: `.claude/skills/landing-page-copy/references/design.md`. Key points: the reserve button must be visible on the first phone screen; one primary button style for every "reserve" action; the reservation-status card shows only real numbers.

## Where copy lives

| What | Where |
|---|---|
| Default English and Khmer copy for the Smart City page | `src/components/landing/smart-city-content.ts` |
| Page copy that ships to the CMS | `content/pages/<slug>.json` (see [[Content Packs]]) |
| Live numbers (price, seats, deadlines) | Admin → Landing Pages CMS (see [[Landing Pages CMS]]) |
| The skill itself | `.claude/skills/landing-page-copy/SKILL.md` |

## Related

[[Smart City Tea and Cafe Vietnam 2026]] · [[FAQ Answers]] · [[Telegram Reply Templates]] · [[Glossary]] · [[Launch a New Trip Page]]
