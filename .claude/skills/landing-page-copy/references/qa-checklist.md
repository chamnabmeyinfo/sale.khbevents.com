# QA before shipping copy

## Truth
- [ ] Every price on the page equals `urgency.earlyBirdPrice` or `regularPrice`.
- [ ] Savings shown = regular minus early bird.
- [ ] No deadline older than today is displayed. Passed early bird hides the
      early-bird plan and notice. Passed registration deadline shows a departure
      countdown or "final seats", never zeros.
- [ ] Seat counts (left, claimed, total) come from data in every section:
      hero, proof strip, roster, register pill, final CTA.
- [ ] Testimonials, partner names and counts are real or the section is hidden.
- [ ] No decorative element implies a specific person or business that does not
      exist: no invented initials, seat-holder job titles or avatar names.
- [ ] Early bird only appears when the early-bird price is really lower than
      the regular price. Equal prices mean one plan, one price.
- [ ] Coordinator name and phone match `isolatedSettings`.

## Clarity
- [ ] Headline under 12 words, states an outcome.
- [ ] Every button says the next step; none say Submit.
- [ ] One term per concept across the page (seat, coordinator, delegation).
- [ ] No sentence over 25 words in body copy.

## Bilingual
- [ ] Every string rendered in English has a Khmer counterpart.
- [ ] Khmer read on a 375px wide screen: no overflow, no orphaned digits.
- [ ] Prices identical in both languages.

## Technical
- [ ] `npm run build`, `npx tsc --noEmit`, `npx eslint` clean.
- [ ] All buttons visible (backgrounds render) in both themes and languages.
- [ ] Form submits and the success message names who calls and when.
- [ ] If the CMS copy changed, the content pack JSON is in `content/pages/`
      and imports cleanly through Admin, Pages, Import JSON.
