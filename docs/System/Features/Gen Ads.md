---
type: feature
tags: [system, feature, marketing, ai, campaigns]
updated: 2026-09-28
admin_path: /admin/pages/<id>/ads
admin_menu: Landing Pages CMS → the page's card → Gen Ads
source:
  - src/lib/ad-brief.ts
  - src/lib/ad-package.ts
  - src/lib/gen-ads.ts
  - src/app/api/pages/[id]/ad-concepts/route.ts
  - src/app/admin/pages/[id]/ads/page.tsx
  - src/components/admin/GenAdsClient.tsx
  - src/components/admin/PagesManagerClient.tsx
---

# Gen Ads

One button on every landing page card (**Landing Pages CMS → Gen Ads**) turns that page into an ads package for social media: what the page sells, three ad concepts with poster text and captions, a phone video script, Google and LinkedIn text, objection posts, the first Telegram reply, targeting notes and a posting plan. It exists to make ads faster; a person still reads and copies every line, and nothing is posted by itself.

## How it works

1. **The brief.** The portal reads everything the page says, in English and Khmer (hero, benefits, included and not included, how to join, the form's sector question, FAQ, terms, closing call to action, photo captions, description) and its live facts from the CMS (price, early-bird price and date, registration deadline, seats). Phone numbers, Telegram handles, e-mail, payment details and leads are never part of it.
2. **One AI call.** The brief goes to the primary AI ([[AI Keys]]: Claude or Gemini) with the Copy Rules and the platform rules, and comes back as one package. The first time a page's Gen Ads screen opens with a key set, the call runs by itself; after that the saved package opens for free and **Generate again** is an explicit click (with a confirmation when the package is under ten minutes old). At most 6 runs per ten minutes.
3. **Code owns every number.** The offer line (price, early-bird date and later price, seats left, closing date), the four background-photo prompts per concept, the Canva text pack, the carousel cards, the Google price and date headlines and the posting plan are computed from the CMS every time the screen opens, never stored. A package opened in two weeks shows today's numbers, and a banner says when the page text changed since the package was written.
4. **The number check.** Every AI line is checked against the numbers on the page (Latin and Khmer digits; digits glued to letters such as "B2B" do not count) plus the numbers the owner typed in *Extra facts*. Poster headlines, supporting lines, story overlays, Facebook headline and description, Google assets and video on-screen text that state a number not on the page are emptied at generation and counted as "removed"; long captions are kept but marked with an amber chip naming the number, and *Copy all* and *Copy whole brief* mark or leave them out. Also flagged: a typed live number (the AI wrote the price or a date the code adds; it would go stale), a concept written for an offer the page no longer backs (early-bird over, deadline passed), placeholders other than `{name}` and `{staff_name}`, a price in the sales reply, adjectives any competitor could claim, and lines over a platform's limit (TikTok counted with its hashtags). Limits: the check reads digits, not meaning, so "15 seats" passes on a page whose deadline is the 15th, and a number written in words is not caught. A person reads before posting.
5. **One run at a time.** A run in flight is recorded for six minutes; a reload or a second tab waits for it instead of paying again. If the database write fails, the answer is still shown once with a warning.
6. **Storage.** One `gen_ads:<slug>` row in `system_settings` per page, with the previous package kept once for **Restore previous version**.

## What the screen shows

| Tab | Content |
|---|---|
| Overview | The AI's reading of the page (who buys, the outcome, the fear, proof points with the block they come from, facts missing from the page), the facts the ads may use (EN and KH), targeting suggestions (interests, job titles, exclusions; location, age and languages are fixed text), two A/B tests between concepts |
| Poster | Concept A / B / C (different angles): big idea, headline, supporting line, offer line from the CMS, button, reassurance, story overlay, in EN and KH; **Copy Canva pack**; photo scene, sharpest subject, colour; four photo prompts per size and one design-assistant prompt; carousel cards from the included list; tracked links and QR codes |
| Captions | Facebook / Instagram (primary text, headline, description, per concept, with character counters and the tracked link), Telegram posts (copied with the offer line and link), TikTok ad text with hashtags, LinkedIn post, Google Ads headlines and descriptions (English) with the CMS fact headlines first |
| Video | A 15-second phone video: what to film, on-screen text EN and KH, spoken line; the last frame is the CMS offer line |
| Sales | The salesperson's first Telegram reply and 24-hour follow-up (EN and KH, with `{name}` and `{staff_name}`; a person sends them), objection posts built from the page's FAQ |
| Plan | When to post what, from the page's real dates in Phnom Penh time; past rows are hidden |

**Copy whole brief** copies the package as one text document for a designer or an agency. **Ad Poster Kit** opens [[Campaigns and AI Analyst]] → Ad posters on the same page.

## Tracked links

**Create tracked links** makes one campaign per channel for the page (`ads-<page>-facebook`, `-tiktok`, `-telegram`, `-linkedin`, `-google`), each with three ad versions, `utm_content = concept-a / b / c`. Existing ones are reused and completed, never duplicated, so **Campaigns → Performance** shows which concept brings visitors and leads. Spend is still typed by hand in Campaigns & links. Khmer captions use the link with `?lang=kh`.

## Rules kept

- The AI never talks to customers: the Telegram reply is a template a salesperson sends.
- Nothing is posted or scheduled automatically; the portal makes no images (image tools write Khmer badly; Khmer is typeset in Canva).
- No invented facts: numbers are checked; testimonials, partners and counts the page lacks appear only in the "not on the page yet" list.
- Khmer AI text should be read by a native speaker before posting (standing task in [[Open Tasks]]).

## Not built, on purpose

Per-concept LinkedIn and Google text (English, one set per page is enough), a 30-day daily calendar, a second AI "repair" call, auto-posting, image generation, a batch button for all pages.

## Related

[[Campaigns and AI Analyst]] (Ad Poster Kit, campaigns and the report), [[AI Keys]], [[Copy Rules]], [[Telegram Reply Templates]], [[Landing Pages CMS]].
