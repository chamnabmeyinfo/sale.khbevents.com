---
type: reference
tags: [sales, telegram, templates, khmer]
updated: 2026-09-24
trip: "[[Smart City Tea and Cafe Vietnam 2026]]"
source:
  - src/components/landing/smart-city-content.ts
  - content/pages/smart-city-tea-cafe.json
  - .claude/skills/landing-page-copy/references/khmer-copy.md
---

# Telegram Reply Templates

Ready-to-paste replies for [[Smart City Tea and Cafe Vietnam 2026]], in English and Khmer. They work on WhatsApp too. Every claim in them comes from the landing page copy. When to use each one is in [[Sales Playbook]].

> [!warning] Before you send
> 1. Check the live **price, deadlines and seats left** in Admin → Landing Pages CMS. The admin is the source of truth.
> 2. Replace every `{placeholder}`. Never send a message with curly brackets in it.
> 3. Do not add discounts, results or promises that are not here or in [[FAQ Answers]].

## Placeholders

| Placeholder | Fill with |
|---|---|
| `{name}` | Customer's name. In Khmer add the title, e.g. លោក or លោកស្រី. |
| `{staff_name}` | Your own name |
| `{price}` | Live seat price with the dollar sign, e.g. $550. Latin digits in Khmer too. |
| `{seats_left}`, `{total_seats}` | Live values from the admin |
| `{dates}` | Trip dates, e.g. 8 to 11 October 2026 |
| `{departure_date}` | Departure date from the admin |
| `{seat}` | The customer's seat number |
| `{payment_details}` | From Admin → Landing Pages CMS → the page → Dedicated Landing Page Settings → Invoicing & KHQR |
| `{page_link}` | `https://sale.khbevents.com/smart-city-tea-cafe` (add `?lang=kh` for Khmer) |

## 1. First reply after a Telegram click-through

The visitor came from the "Chat on Telegram" button. Reply as soon as they write.

**EN**
> Hello {name}, thank you for your message. I am {staff_name} from KHB Events, and I look after the Smart City, Tea & Cafe Business Trip to Vietnam 2026. What is your business? Tell me and I will show you which expo, meetings and factory visit fit you best.

**KH**
> ជម្រាបសួរ {name}។ សូមអរគុណសម្រាប់សារ។ ខ្ញុំឈ្មោះ {staff_name} មកពី KHB Events ទទួលបន្ទុកដំណើរអាជីវកម្ម Smart City, Tea & Cafe ទៅវៀតណាម ២០២៦។ តើលោកអ្នកធ្វើអាជីវកម្មអ្វី? សូមប្រាប់ខ្ញុំ ខ្ញុំនឹងបង្ហាញពិព័រណ៍ កិច្ចប្រជុំ និងការទស្សនារោងចក្រដែលសមនឹងលោកអ្នកបំផុត។

## 2. First contact after a form lead (call not answered)

**EN**
> Hello {name}, this is {staff_name} from KHB Events. Thank you for reserving a seat on the Vietnam business trip. I tried to call you. When is a good time for a short call? You pay nothing today.

**KH**
> ជម្រាបសួរ {name}។ ខ្ញុំ {staff_name} មកពី KHB Events។ សូមអរគុណដែលបានកក់កៅអីសម្រាប់ដំណើរអាជីវកម្មទៅវៀតណាម។ ខ្ញុំបានទូរស័ព្ទទៅលោកអ្នក តែមិនទាន់ទាក់ទងបាន។ តើពេលណាស្រួលសម្រាប់ការហៅខ្លីមួយ? លោកអ្នកមិនបង់ប្រាក់ថ្ងៃនេះទេ។

## 3. Trip summary: itinerary and price

**EN**
> Here is the trip in short: {dates}, 4 days / 3 nights, Hanoi and Halong Bay.
> Day 1: flight Phnom Penh to Hanoi.
> Day 2: Cafe Show Vietnam and matched meetings with suppliers.
> Day 3: Smart City Expo, a coffee and tea factory visit, then Halong Bay.
> Day 4: Halong Bay cruise and flight home to Phnom Penh.
> Seat price: {price} per person, with flights, hotel, expo passes, guide and factory visits all handled. Full itinerary: {page_link}

**KH**
> សង្ខេបដំណើរ៖ {dates} ៤ ថ្ងៃ / ៣ យប់ ហាណូយ និងហាឡុងបេ។
> ថ្ងៃទី ១៖ ហោះហើរពីភ្នំពេញទៅហាណូយ។
> ថ្ងៃទី ២៖ Cafe Show Vietnam និងកិច្ចប្រជុំជាមួយអ្នកផ្គត់ផ្គង់ដែលផ្គូផ្គងជូន។
> ថ្ងៃទី ៣៖ Smart City Expo ទស្សនារោងចក្រកាហ្វេ និងតែ រួចទៅហាឡុងបេ។
> ថ្ងៃទី ៤៖ ជិះកប៉ាល់ហាឡុងបេ និងហោះត្រឡប់មកភ្នំពេញ។
> តម្លៃកៅអី៖ {price} ក្នុងមួយនាក់ រួមទាំងជើងហោះហើរ សណ្ឋាគារ សំបុត្រពិព័រណ៍ មគ្គុទ្ទេសក៍ និងការទស្សនារោងចក្រ។ កាលវិភាគពេញលេញ៖ {page_link}

## 4. "Do I need to pay today?"

**EN**
> No. Nothing to pay today. Your seat is held with your name and phone. We talk first, and you pay only after your flights, hotel and factory schedule are confirmed. We send the official tax invoice and the full itinerary here on Telegram.

**KH**
> ទេ។ មិនបង់ប្រាក់ថ្ងៃនេះទេ។ កៅអីលោកអ្នករក្សាទុកដោយឈ្មោះ និងលេខទូរស័ព្ទ។ យើងនិយាយគ្នាសិន ហើយលោកអ្នកបង់តែក្រោយពេលជើងហោះហើរ សណ្ឋាគារ និងកាលវិភាគរោងចក្របានបញ្ជាក់។ យើងផ្ញើវិក្កយបត្រពន្ធផ្លូវការ និងកាលវិភាគពេញលេញតាម Telegram នេះ។

## 5. What is included and not included

**EN**
> The seat price includes: round-trip flights Phnom Penh – Hanoi, hotel for 3 nights (twin or double sharing), breakfast every day, a private air-conditioned coach, a trilingual guide (Khmer, English, Vietnamese), passes to Cafe Show Vietnam and Smart City Expo, border and customs help, factory and wholesale visits, and the Halong Bay cruise with lunch.
> Not included: other lunches and dinners, a Vietnam SIM card, travel insurance and personal shopping. A single room is possible for a small supplement.

**KH**
> តម្លៃកៅអីរួមបញ្ចូល៖ ជើងហោះហើរទៅមក ភ្នំពេញ ហាណូយ សណ្ឋាគារ ៣ យប់ (បន្ទប់ Twin ឬ Double រួមគ្នា) អាហារពេលព្រឹករាល់ថ្ងៃ ឡានក្រុងឯកជនម៉ាស៊ីនត្រជាក់ មគ្គុទ្ទេសក៍ ៣ ភាសា (ខ្មែរ អង់គ្លេស វៀតណាម) សំបុត្រ Cafe Show Vietnam និង Smart City Expo ជំនួយច្រកព្រំដែន និងគយ ទស្សនារោងចក្រ និងទីផ្សារបោះដុំ និងកប៉ាល់ហាឡុងបេជាមួយអាហារថ្ងៃត្រង់។
> មិនរួមបញ្ចូល៖ អាហារថ្ងៃត្រង់ និងពេលល្ងាចផ្សេងទៀត SIM វៀតណាម ធានារ៉ាប់រងដំណើរ និងការទិញឥវ៉ាន់ផ្ទាល់ខ្លួន។ បើចង់បានបន្ទប់តែម្នាក់ អាចរៀបចំបានដោយបង់ថ្លៃបន្ថែមតិចតួច។

The supplement amount is not in the repo. Ask the manager before you quote a number.

## 6. Follow-up after 24 hours

**EN**
> Hello {name}, {staff_name} from KHB Events again. Did you have time to look at the itinerary? {seats_left} of {total_seats} seats are left, and seats are first come, first served. If you have a question, send it here and I will answer.

**KH**
> ជម្រាបសួរ {name}។ ខ្ញុំ {staff_name} ពី KHB Events។ តើលោកអ្នកមានពេលមើលកាលវិភាគហើយឬនៅ? នៅសល់ {seats_left} ក្នុង {total_seats} កៅអី ហើយកៅអីគឺអ្នកមកមុនបានមុន។ បើលោកអ្នកមានសំណួរ សូមផ្ញើមកទីនេះ ខ្ញុំនឹងឆ្លើយ។

Only send the seat numbers if they are the true live numbers.

## 7. "It is too expensive"

Use only these value points. They are on the page. **No discounts** unless the owner approves one.

**EN**
> I understand. Booked one by one, the same flights, hotel, coach, guide, expo passes, factory visits and cruise add up to $910 or more. Your seat is {price} with everything handled. Buying at the source can cut 25 to 35% off what brokers charge, and one negotiated container order can pay for the whole trip. Nothing to pay today; you decide after our call.

**KH**
> ខ្ញុំយល់។ បើកក់ម្តងមួយៗដោយខ្លួនឯង ជើងហោះហើរ សណ្ឋាគារ ឡានក្រុង មគ្គុទ្ទេសក៍ សំបុត្រពិព័រណ៍ ការទស្សនារោងចក្រ និងកប៉ាល់ អស់ $910 ឬច្រើនជាងនេះ។ កៅអីលោកអ្នក {price} រៀបចំជូនទាំងអស់។ ទិញពីប្រភពផ្ទាល់ អាចកាត់បន្ថយ ២៥ ដល់ ៣៥% ពីតម្លៃឈ្មួញកណ្តាល ហើយការចរចាកុងតឺន័រតែមួយ អាចសងថ្លៃដំណើរទាំងមូល។ មិនបង់ប្រាក់ថ្ងៃនេះទេ។ លោកអ្នកសម្រេចចិត្តក្រោយការហៅ។

## 8. Payment details after the call

**EN**
> Thank you for the call, {name}. To confirm your seat at {price}, here are the payment details: {payment_details}. Message me here when it is done. I will send your official tax invoice and the full itinerary here on Telegram.

**KH**
> សូមអរគុណសម្រាប់ការហៅ {name}។ ដើម្បីបញ្ជាក់កៅអីលោកអ្នកក្នុងតម្លៃ {price} នេះជាព័ត៌មានបង់ប្រាក់៖ {payment_details}។ សូមផ្ញើសារមកខ្ញុំនៅទីនេះពេលបង់រួច។ ខ្ញុំនឹងផ្ញើវិក្កយបត្រពន្ធផ្លូវការ និងកាលវិភាគពេញលេញតាម Telegram នេះ។

## 9. Seat confirmed

**EN**
> Your seat is confirmed, {name}: seat #{seat} on the Vietnam business trip, leaving Phnom Penh on {departure_date}. Your tax invoice and itinerary are in this chat. Please check your passport is valid for at least six months from your entry date into Vietnam. On departure day you only bring your passport. Flights, hotel, coach, expo passes and factory visits are already arranged.

**KH**
> កៅអីលោកអ្នកបានបញ្ជាក់ហើយ {name}។ កៅអីលេខ {seat} សម្រាប់ដំណើរអាជីវកម្មទៅវៀតណាម ចេញពីភ្នំពេញថ្ងៃ {departure_date}។ វិក្កយបត្រពន្ធ និងកាលវិភាគ មាននៅក្នុងការជជែកនេះ។ សូមពិនិត្យថាលិខិតឆ្លងដែនមានសុពលភាពយ៉ាងតិច ៦ ខែ ពីថ្ងៃចូលវៀតណាម។ ថ្ងៃចេញដំណើរ លោកអ្នកគ្រាន់តែយកលិខិតឆ្លងដែនមក។ ជើងហោះហើរ សណ្ឋាគារ ឡានក្រុង សំបុត្រពិព័រណ៍ និងការទស្សនារោងចក្រ រៀបចំរួចរាល់។

After sending: set the lead to WON in Admin → Leads & CRM Pipeline, and update "Claimed Seats" in Admin → Landing Pages CMS (or ask the manager to).

## 10. Visa and passport

**EN**
> No visa needed. Cambodian passport holders enter Vietnam visa-free for up to 30 days, and our team handles the arrival paperwork and customs. Your passport must be valid for at least six months from your entry date. Please check the expiry date.

**KH**
> មិនត្រូវការវីសាទេ។ អ្នកកាន់លិខិតឆ្លងដែនកម្ពុជា ចូលវៀតណាមដោយគ្មានវីសារហូតដល់ ៣០ ថ្ងៃ ហើយក្រុមការងារយើងរៀបចំឯកសារចូលប្រទេស និងគយជូន។ លិខិតឆ្លងដែនត្រូវមានសុពលភាពយ៉ាងតិច ៦ ខែ ពីថ្ងៃចូលប្រទេស។ សូមពិនិត្យថ្ងៃផុតកំណត់។

## 11. Bringing a partner or staff member

**EN**
> Yes, you can bring a partner or a staff member. Each person takes one seat at the same price ({price}). Send me their full name and phone, and we will seat and room you together.

**KH**
> បាន។ លោកអ្នកអាចនាំដៃគូ ឬបុគ្គលិកមកជាមួយ។ ម្នាក់យកកៅអីមួយក្នុងតម្លៃដូចគ្នា ({price})។ សូមផ្ញើឈ្មោះពេញ និងលេខទូរស័ព្ទរបស់គាត់មកខ្ញុំ យើងនឹងរៀបចំកៅអី និងបន្ទប់ជិតគ្នា។

## 12. Seats full: waitlist

**EN**
> Thank you, {name}. All {total_seats} seats are taken right now. Seats are first come, first served. I can put you on the waitlist, but a seat may not open. Shall I add you?

**KH**
> សូមអរគុណ {name}។ កៅអីទាំង {total_seats} ត្រូវបានយកអស់ហើយ។ កៅអីគឺអ្នកមកមុនបានមុន។ ខ្ញុំអាចដាក់ឈ្មោះលោកអ្នកក្នុងបញ្ជីរង់ចាំ ប៉ុន្តែកៅអីអាចមិនទំនេរឡើងវិញ។ តើចង់ឱ្យខ្ញុំដាក់ឈ្មោះទេ?

## How these were written

- English follows the page copy in `src/components/landing/smart-city-content.ts`.
- Khmer follows the rules in [[Copy Rules]]: លោកអ្នក throughout, proper nouns in Latin script, prices in Latin digits with $, sentences end with ។.
- The Khmer here is new text. A native speaker should review it (see [[Open Tasks]]).
- Answers to other questions: [[FAQ Answers]]. Words and their Khmer: [[Glossary]].

## To confirm

- [ ] Single-room supplement amount (templates 5 and FAQ 4).
- [ ] Is a seat "confirmed" after the call or after payment? Template 9 assumes after payment.
- [ ] Native-speaker review of all Khmer templates.
