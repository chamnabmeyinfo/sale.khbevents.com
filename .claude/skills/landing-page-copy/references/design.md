# Conversion design for seat-sales pages

Copy decides whether a visitor believes; design decides whether they notice,
keep reading and act. These are the layout rules the Smart City page follows.
Apply them to any KHB landing page; the CSS lives in `src/styles/smart-city.css`
under "CONVERSION REDESIGN".

## The first screen
- One sticky strip above the header carries the live urgency line and the
  countdown. Never a second button there: the header already has one.
- Desktop hero is two columns. Left: badge, headline (outcome), trip name,
  one paragraph, primary button, ghost secondary button ("See what is
  included"), risk line, proof row. Right: the reservation-status card.
- On a phone the primary button must sit inside the first screen (under
  about 700px from the top on a 390 by 844 viewport). Shrink badge, headline
  and paragraph before you move the button.
- Photos sit behind a dark gradient so white text always reads.

## The reservation-status card
Real numbers only, from `PageFacts`: a seat progress bar (taken of total),
seats left, the live countdown with the phase label, the price, one gold
button, "No payment today". It shows scarcity, urgency, price and the next
step in one glance, and it repeats nothing the header says.

## Rhythm down the page
- Section order follows how the buyer decides: outcome, proof, problem, fit,
  what you get, who you meet, the days, photos, scarcity, price, three steps,
  the form, objections last. The order is data (`sectionOrder` in the pack).
- Alternate light and dark sections so the eye rests. Dark for seats and the
  final call, light for reading.
- Every section header is the same pattern: small tag pill, title under
  twelve words, one-sentence subtitle. Consistency lowers reading effort.
- A section with no real content shows nothing. No placeholder speakers,
  performers, booths or quotes. Empty is more honest than invented.

## Buttons
- One primary style (gold gradient, pill, dark text) for every "reserve"
  action, with the same wording. Secondary actions are ghost buttons.
- Buttons say what happens next. Never "Submit".
- Mobile keeps a sticky bottom bar with Telegram and Reserve; the floating
  Telegram button hides on phones so it never covers content.

## Trust where the decision happens
- Beside the form: the delegate pass preview (ownership) and the coordinator
  card (a named person, phone, Telegram, reply time).
- Seats left pill on the form, the "no payment today" line under the button,
  the tax-invoice line, and the Telegram alternative.

## Motion
- Sections fade and rise as they scroll into view, 0.55s, staggered cards.
  Only after JS adds `.js-reveal`, so a page without JS shows everything.
  Sections already on screen are marked visible before the class is added, so
  nothing flashes. `prefers-reduced-motion` turns it off.
- The seat progress bar animates its width once. The countdown ticks. Nothing
  else moves on its own except the hero photo cross-fade.

## Performance
- Hero slides get their image only when they are about to show.
- Keep the page under about 16 sections; each one must earn its scroll.

## QA
- Screenshot the first screen on 1366 and 390 wide. The primary button, price
  and seats left must be visible on both.
- Run the button audit: no button with a transparent background.
- Check both languages: Khmer wraps longer, so titles may need shorter forms.
