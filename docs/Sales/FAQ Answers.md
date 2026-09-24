---
type: reference
tags: [sales, faq, khmer]
updated: 2026-09-24
trip: "[[Smart City Tea and Cafe Vietnam 2026]]"
source:
  - content/pages/smart-city-tea-cafe.json (faqs, translations.kh.faqs)
  - src/components/landing/smart-city-content.ts (faqs)
  - src/components/landing/SmartCityLandingPageView.tsx
---

# FAQ Answers

The approved answers to the questions customers ask about [[Smart City Tea and Cafe Vietnam 2026]]. They are the same words as the FAQ on the landing page, with the Khmer spelling fixes listed at the end. Copy them into Telegram or WhatsApp as they are.

> [!important] Check live facts before you send
> Price, seat count and dates come from Admin → Landing Pages CMS. The admin is the source of truth. Placeholders in `{curly brackets}` must be filled with the live value.

## Where the page FAQ comes from

- The page shows the FAQ saved in the CMS (Admin → Landing Pages CMS → the page → FAQs). The content pack `content/pages/smart-city-tea-cafe.json` fills it.
- The CMS FAQ is plain text. It does **not** update itself when the price or seat count changes.
- Only if the CMS FAQ is empty does the page fall back to the code FAQ in `src/components/landing/smart-city-content.ts`. That version fills in the live price, seat count and coordinator name by itself.
- The Khmer FAQ comes from the Khmer translation in the CMS, with the same fallback.

The text below follows the content pack. Where the code version differs, it says so.

## 1. Visa

**EN — Do I need a visa for Vietnam?**
Cambodian passport holders enter Vietnam visa-free for up to 30 days. Our team handles the arrival paperwork and customs facilitation so you walk straight through.

**KH — តើខ្ញុំត្រូវការវីសាទៅវៀតណាមទេ?**
អ្នកកាន់លិខិតឆ្លងដែនកម្ពុជា ចូលវៀតណាមដោយគ្មានវីសារហូតដល់ ៣០ ថ្ងៃ។ ក្រុមការងារយើងរៀបចំឯកសារចូលប្រទេស និងគយជូន។

## 2. Paying today

**EN — Do I have to pay today?**
No. You reserve with your name and phone number. {coordinator} calls you within 15 minutes, and you pay only after your flights, hotel and factory schedule are confirmed.

**KH — តើខ្ញុំត្រូវបង់ប្រាក់ថ្ងៃនេះទេ?**
ទេ។ លោកអ្នកកក់ដោយឈ្មោះ និងលេខទូរស័ព្ទ។ {coordinator} ទូរស័ព្ទមកក្នុង ១៥ នាទី ហើយលោកអ្នកបង់តែក្រោយជើងហោះហើរ សណ្ឋាគារ និងកាលវិភាគរោងចក្របានបញ្ជាក់។

`{coordinator}` = the coordinator name set in Admin → Landing Pages CMS → the page → Dedicated Landing Page Settings. The content pack has a name typed into this answer; if the coordinator changes, the FAQ text must change too.

## 3. Official invoice

**EN — Can my company get an official invoice?**
Yes. We issue corporate billing and official tax invoices. Ask on Telegram or during your confirmation call.

**KH — តើក្រុមហ៊ុនខ្ញុំអាចទទួលវិក្កយបត្រផ្លូវការទេ?**
បាន។ យើងចេញវិក្កយបត្រពន្ធផ្លូវការសម្រាប់ក្រុមហ៊ុន។ សូមស្នើតាម Telegram ឬក្នុងការហៅបញ្ជាក់។

## 4. Hotel room

**EN — Is the hotel room private?**
The price includes twin or double sharing. If you prefer a single room, tell your coordinator and we arrange it for a small supplement.

**KH — តើបន្ទប់សណ្ឋាគារជាបន្ទប់ឯកជនទេ?**
តម្លៃរួមបញ្ចូលបន្ទប់ Twin ឬ Double រួមគ្នា។ បើចង់បានបន្ទប់តែម្នាក់ សូមប្រាប់អ្នកសម្របសម្រួល យើងរៀបចំជូនក្នុងថ្លៃបន្ថែមតិចតួច។

The supplement amount is not in the repo. Ask the manager before quoting it.

## 5. Seats selling out

**EN — What if the seats sell out before I decide?**
The {total_seats} seats are first come, first served. A reserved seat is held for that delegate. Latecomers join a waitlist, and a seat may not open.

**KH — បើកៅអីអស់មុនខ្ញុំសម្រេចចិត្ត?**
កៅអី {total_seats} អ្នកមកមុនបានមុន។ កៅអីដែលបានកក់ រក្សាទុកសម្រាប់ប្រតិភូនោះ។ អ្នកមកក្រោយចូលបញ្ជីរង់ចាំ ហើយកៅអីអាចមិនទំនេរឡើងវិញ។

The content pack has "30" typed in. The code version uses the live total.

## 6. Not included

**EN — What is not included in the price?**
Lunches and dinners outside the listed programme (the Halong Bay cruise lunch is included), a Vietnam SIM card, travel insurance and personal shopping. All logistics are covered.

**KH — តើអ្វីមិនរួមបញ្ចូលក្នុងតម្លៃ?**
អាហារថ្ងៃត្រង់ និងពេលល្ងាចក្រៅកម្មវិធី (អាហារលើកប៉ាល់ហាឡុងបេរួមបញ្ចូល) SIM វៀតណាម ធានារ៉ាប់រងដំណើរ និងការទិញឥវ៉ាន់ផ្ទាល់ខ្លួន។ ការរៀបចំដំណើរទាំងអស់រួមបញ្ចូល។

The code version asks "What is not included in the ${price}?" with the live price.

## 7. Refund

**EN — Can I get a refund after paying?**
Yes. Cancel at least 14 days before departure and, if your seat is refilled from the waitlist, you receive a full refund. Organiser cancellations are always refunded in full.

**KH — តើអាចដកប្រាក់វិញក្រោយបង់ទេ?**
បាន។ លុបចោលយ៉ាងតិច ១៤ ថ្ងៃមុនចេញដំណើរ ហើយបើកៅអីលោកអ្នកមានអ្នកជំនួសពីបញ្ជីរង់ចាំ លោកអ្នកទទួលប្រាក់វិញពេញ។ ការលុបចោលដោយអ្នករៀបចំ សងវិញពេញជានិច្ច។

## 8. Language

**EN — Do I need to speak English or Vietnamese?**
No. A guide fluent in Khmer, English and Vietnamese sits beside you in every meeting and negotiation.

**KH — តើខ្ញុំត្រូវចេះអង់គ្លេស ឬវៀតណាមទេ?**
ទេ។ មគ្គុទ្ទេសក៍ចេះខ្មែរ អង់គ្លេស និងវៀតណាម អង្គុយក្បែរលោកអ្នករាល់កិច្ចប្រជុំ និងការចរចា។

## 9. Partner or staff

**EN — Can I bring a partner or a staff member?**
Yes. Each person takes one seat at the same price. Tell your coordinator so you are seated and roomed together.

**KH — តើអាចនាំដៃគូ ឬបុគ្គលិកមកជាមួយទេ?**
បាន។ ម្នាក់យកកៅអីមួយក្នុងតម្លៃដូចគ្នា។ សូមប្រាប់អ្នកសម្របសម្រួល ដើម្បីរៀបចំកៅអី និងបន្ទប់ជិតគ្នា។

## 10. Passport

**EN — Is my passport valid enough?**
Vietnam asks for at least six months of validity from your entry date. Check the expiry date before you reserve.

**KH — តើលិខិតឆ្លងដែនខ្ញុំនៅមានសុពលភាពគ្រប់គ្រាន់ទេ?**
វៀតណាមតម្រូវសុពលភាពយ៉ាងតិច ៦ ខែពីថ្ងៃចូលប្រទេស។ សូមពិនិត្យថ្ងៃផុតកំណត់មុនកក់។

## Questions not on this list

- Do not guess. Tell the customer you will check, then ask the manager.
- Price, deadline or seats left: check Admin → Landing Pages CMS.
- Add the new question and the approved answer here, and tell Claude so the page FAQ can be updated through the content pack. See [[Content Packs]] and [[Copy Rules]].

## Khmer spelling fixed in this note

The Khmer answers above follow the repo, with one change: four spelling errors are fixed here. In the repo the vowel ៃ was typed where ៀ or ែ belongs. The repo text (content pack and `src/components/landing/smart-city-content.ts`) still has the errors, so the live page may show them.

| In the repo | In this note | Answers |
|---|---|---|
| រៃបចំ | រៀបចំ (arrange) | 1, 4, 6, 7, 9 |
| តៃ (in បង់តៃ, បន្ទប់តៃម្នាក់) | តែ (only) | 2, 4 |
| ខៃ | ខែ (month) | 10 |

- [ ] Fix the same words in the content pack and the code copy together, not by hand in the admin.
- [ ] A native speaker should still review all the Khmer (see [[Open Tasks]]).

## Related

[[Sales Playbook]] · [[Telegram Reply Templates]] · [[Smart City Tea and Cafe Vietnam 2026]] · [[Glossary]]
