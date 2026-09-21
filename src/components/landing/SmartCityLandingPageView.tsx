'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// BILINGUAL CONTENT — exactly from old project content.json + app.js STR obj
// ─────────────────────────────────────────────────────────────────────────────
const GENERAL = {
  organizer: 'KHB EVENTS',
  contactPhone: '+855 12 345 678',
  contactTelegramUrl: 'https://t.me/khbevents',
  contactTelegramUsername: 'khbevents',
  totalSeats: 30,
  claimedSeats: 19,
  earlyBirdPrice: 499,
  regularPrice: 550,
  earlyBirdDeadline: '2026-09-08T23:59:59',
  registrationDeadline: '2026-09-20T23:59:59',
};

const CONTENT = {
  en: {
    badge: 'Exclusive B2B Business Delegation 2026',
    heroTitle: 'Smart City, Tea & Cafe Business Trip to Vietnam',
    heroHeadlineHighlight: 'Come Home With Suppliers, Not Just Photos.',
    heroSubtitle: 'Connect with leading manufacturers, explore Smart City Expo & Cafe Show Vietnam, and uncover high-value wholesale partnerships in Hanoi & Halong Bay.',
    heroCtaDiscover: 'See What You Get',
    heroSkipLink: 'or reserve your seat now →',
    heroRiskNote: 'No payment today • Seat held instantly • Reply within 15 mins',
    earlyBirdNotice: 'Early Bird Special: Save $51 before Sept 8, 2026 | Strictly limited to 30 seats',
    heroPriceAnchorNote: 'Early Bird rate — was $550. You save $51.',
    pillDate: 'Oct 8 - 11, 2026 (4D / 3N)',
    pillDest: 'Hanoi & Halong Bay, Vietnam',
    pillExpos: '2 International Trade Expos',
    pillCruise: 'UNESCO Halong Bay Cruise',
    pillSeats: 'Strictly 30 Seats Cohort',
    navWhy: 'Why Join',
    navPackage: '9-in-1 Package',
    navItinerary: 'Itinerary',
    navSeats: '30 Seats',
    navPricing: 'Pricing',
    navFaq: 'FAQ',
    navCta: 'Reserve $499',
    navCtaMobile: 'Reserve Your Seat ($499)',
    coreValueTag: 'Core Value First',
    coreValueTitle: 'What This Trip Really Buys Your Business',
    coreValueSubtitle: 'Before you look at any price, understand the four outcomes you take home — outcomes no online search, broker, or screenshot can ever give you.',
    coreValueBridge: 'Keep these four outcomes in mind — every detail below exists to deliver them.',
    coreValues: [
      { num: '01', icon: 'chart', title: 'Factory-Direct Pricing Power', desc: 'Buy at the source and cut 25% - 35% off what middlemen charge. One negotiated container order can repay the entire trip.' },
      { num: '02', icon: 'shield', title: 'Trust Built Face-to-Face', desc: 'Walk the factory floor, inspect the QC lab, and look your supplier in the eye before a single dollar is wired.' },
      { num: '03', icon: 'trophy', title: 'Exclusive Territory Rights', desc: 'Secure exclusive distribution for Cambodia before another importer signs the same supplier.' },
      { num: '04', icon: 'zap', title: '2026 Trends Before Competitors', desc: 'Two international expos in one trip — see next year\'s products, packaging, and smart-retail tech first.' },
    ],
    proofStripText: 'business owners have already reserved their seats',
    proofStripTags: ['Cafe Chain CEO', 'Tea Importer', 'POS Integrator', 'Beverage Wholesaler', 'F&B Investor', 'Retail Tech Founder'],
    statsStrip: [
      { value: '9-in-1', label: 'All-inclusive package' },
      { value: '2', label: 'International trade expos' },
      { value: '30', label: 'Seats only, per cohort' },
      { value: '4D/3N', label: 'Hanoi & Halong Bay' },
    ],
    problemTag: 'The Real Cost of Sourcing Alone',
    problemTitle: 'Why Importers Who Source Online Pay Up to 35% More',
    problemSubtitle: "Screenshots can't negotiate prices. Photos can't prove quality. Here is what quietly kills margins for most Cambodian importers:",
    problems: [
      { icon: 'trend-down', title: 'Middleman Markups', desc: 'Buying through brokers and resellers adds 25% - 35% to every order before it ever reaches your warehouse.' },
      { icon: 'chat', title: 'Language & Trust Barriers', desc: "Without a shared language, deals die in translation — and you can't verify who is a real factory and who is a middleman." },
      { icon: 'search', title: 'Blind Online Sourcing', desc: 'Ordering from photos and hoping. No factory floor, no QC lab, no face-to-face MOQ negotiation, no relationship.' },
    ],
    solutionBridge: 'This delegation fixes all three in just 4 days: you walk the factory floor, negotiate face-to-face with a trilingual interpreter beside you, and lock factory-direct prices for your business.',
    audienceSecTitle: 'Who Should Join This Delegation?',
    audienceSecSub: 'Curated specifically for business owners, importers, and entrepreneurs looking for high-margin products and direct factory sources.',
    audiences: [
      { icon: 'cpu', title: 'Smart City & Tech Importers', desc: 'Source smart urban technologies, IoT solutions, smart home automation, and security equipment directly from certified manufacturers.' },
      { icon: 'coffee', title: 'Cafe & Tea Brand Owners', desc: 'Discover premium Vietnamese tea, coffee beans, syrups, packaging, commercial espresso machines, and brewing technologies.' },
      { icon: 'truck', title: 'Wholesalers & Distributors', desc: 'Establish exclusive distribution rights, negotiate factory-direct wholesale pricing, and explore OEM/ODM partnerships.' },
      { icon: 'users', title: 'F&B Entrepreneurs & Investors', desc: 'Explore top Vietnamese and international franchise brands, trendsetting beverage concepts, and lucrative retail models.' },
    ],
    valueStackTag: 'Value Stack',
    valueStackTitle: 'One Price. Nine Things Fully Handled.',
    valueStackSubtitle: 'Everything below is included in your seat. Arrange each of these yourself and the same trip would cost you far more — in money and in months of effort.',
    valueStackNote: 'Estimated standalone cost if you arranged it yourself',
    valueStackTotalLabel: 'Total standalone value',
    valueStackTotalValue: '$910+',
    valueStackPayLabel: 'Your Early Bird investment',
    inclusions: [
      { id: 1, title: 'Roundtrip Flight Tickets', desc: 'Phnom Penh - Hanoi roundtrip flights included.' },
      { id: 2, title: 'Hotel Stay (3 Nights / 4 Days)', desc: 'Premium hotel accommodation with twin/double sharing.' },
      { id: 3, title: 'Daily Hotel Breakfast', desc: 'Buffet breakfast provided every morning at the hotel.' },
      { id: 4, title: 'Private Air-Conditioned Coach', desc: 'Comfortable transportation for all expos, tours, and transfers in Vietnam.' },
      { id: 5, title: 'Trilingual Professional Guide', desc: 'Dedicated business guide fluent in Vietnamese, English, and Khmer.' },
      { id: 6, title: 'VIP All-Access Expo Passes', desc: 'Full official registration for Cafe Show Vietnam & Smart City Expo.' },
      { id: 7, title: 'Border & Customs Facilitation', desc: 'Smooth airport immigration and document assistance upon arrival.' },
      { id: 8, title: 'Direct Factory & Wholesale Visits', desc: 'Exclusive on-site visits to coffee/tea processing factories and wholesale hubs.' },
      { id: 9, title: 'Halong Bay Cruise & Hanoi Tour', desc: 'Sightseeing at Halong Bay UNESCO World Heritage Site with onboard lunch.' },
    ],
    valueStackPrices: [220, 150, 25, 80, 60, 120, 40, 150, 65],
    ctaBtn: 'Claim One of the Remaining Seats',
    valueCtaBtn: 'Lock In $499 — Reserve Now',
    matchmakerTag: 'Interactive ROI Matchmaker',
    matchmakerTitle: 'See Your Exact ROI Track',
    matchmakerSub: 'Choose your industry — we will show the suppliers you will meet, the margins you can capture, and the sessions prepared for you.',
    matchSuppliersTitle: "Suppliers You'll Meet",
    matchRoiTitle: 'Margins You Can Capture',
    matchSessionsTitle: 'Sessions Prepared for You',
    matchCtaBtn: 'Lock This Track Into My Pass',
    ctaBarText: (track: string) => `Interested in the <strong>${track}</strong> track?`,
    itineraryTitle: '4-Day Curated Business Itinerary',
    itinerarySubtitle: 'A balanced agenda packed with business matchmaking, expo discovery, and memorable cultural experiences.',
    itinerary: [
      { day: 1, date: 'Oct 8, 2026', title: 'Phnom Penh to Hanoi & Welcome Night', events: [
        { time: '17:45 - 21:35', activity: 'Flight from Phnom Penh to Hanoi (Noi Bai International Airport)' },
        { time: '22:30 - 23:00', activity: 'Private bus transfer & Hotel Check-in in Hanoi' },
        { time: '23:00 - 24:00', activity: 'Optional evening walk & explore Hanoi Night Life' },
      ]},
      { day: 2, date: 'Oct 9, 2026', title: 'Cafe Show Expo & B2B Matchmaking', events: [
        { time: '08:00 - 09:00', activity: 'Buffet breakfast at the hotel' },
        { time: '09:00 - 09:30', activity: 'Transfer to Vietnam Exhibition Center by private coach' },
        { time: '10:00 - 12:00', activity: 'Visit Cafe Show Vietnam Expo (Tea, Coffee, Machinery & Ingredients)' },
        { time: '12:00 - 13:00', activity: 'Lunch break at the exhibition center' },
        { time: '13:00 - 16:00', activity: 'Focused B2B Matchmaking & brand negotiations with suppliers' },
        { time: '16:00 - 17:00', activity: 'Return to hotel and refresh' },
        { time: '18:00 - 22:00', activity: 'Hanoi Old Quarter cultural walk, dining & famous attraction sites' },
      ]},
      { day: 3, date: 'Oct 10, 2026', title: 'Smart City Expo, Factory Visit & Journey to Halong Bay', events: [
        { time: '08:00 - 09:00', activity: 'Breakfast at the hotel' },
        { time: '09:00 - 09:30', activity: 'Coach departure to Vietnam Exhibition Center' },
        { time: '10:00 - 12:00', activity: 'Explore Smart City Expo (IoT, Smart Lighting, Infrastructure & Tech)' },
        { time: '12:00 - 13:00', activity: 'Lunch break at Exhibition Center' },
        { time: '13:00 - 15:30', activity: 'On-site visit to wholesale coffee/tea roasting factory and showroom' },
        { time: '15:30 - 18:30', activity: 'Scenic highway transfer to picturesque Halong Bay' },
        { time: '18:30 - 22:00', activity: 'Hotel check-in & explore Halong Bay Night Market and coastal promenade' },
      ]},
      { day: 4, date: 'Oct 11, 2026', title: 'UNESCO Halong Bay Cruise & Return to Phnom Penh', events: [
        { time: '06:00 - 07:00', activity: 'Breakfast at hotel and express check-out' },
        { time: '07:00 - 07:30', activity: 'Transfer to Halong Bay International Tourist Harbour' },
        { time: '07:30 - 11:30', activity: 'Deluxe Cruise along Halong Bay UNESCO World Heritage Site with fresh seafood lunch' },
        { time: '11:30 - 15:00', activity: 'Private expressway transfer directly to Hanoi Noi Bai Airport' },
        { time: '15:00 - 17:00', activity: 'Check-in and international customs clearance' },
        { time: '17:45 - 19:05', activity: 'Direct flight from Hanoi back to Phnom Penh International Airport' },
      ]},
    ],
    seatTitle: 'Watch the Cabin Fill Up',
    seatSubtitle: 'Every reserved seat below is a real business we will introduce you to on the trip. Pick any open seat to claim it as yours.',
    seatLegendBooked: 'Booked',
    seatLegendAvailable: 'Available (Click)',
    seatLegendSelected: 'Your Selection',
    seatReservedTxt: 'Seats Reserved',
    seatAvailableTxt: 'Seats Available',
    seatBanner: (n: number) => `Currently Selected: <strong>Seat #${n}</strong> (Click any green open seat above to switch)`,
    reservedLabel: 'Reserved',
    availableLabel: 'Available',
    selectedLabel: '✓ Selected',
    clickSeat: 'Click to reserve Seat #',
    bookedSeat: (n: number) => `Seat #${n} (Booked)`,
    testimonialsTag: 'Social Proof',
    testimonialsTitle: 'Delegates From Our Previous Trips',
    testimonialsSubtitle: 'Outcomes reported by business owners who joined KHB business delegations.',
    testimonials: [
      { quote: 'I met five roasters in one day and cut my bean sourcing cost by 30%. One container order paid for this trip twice over.', name: 'Dara S.', role: 'Cafe Chain Owner, Phnom Penh' },
      { quote: 'Seeing the factory floor with my own eyes built trust I could never get online. We signed an exclusive distribution deal for Cambodia.', name: 'Sophea T.', role: 'Beverage Importer' },
      { quote: 'The trilingual guide handled every negotiation. We returned with two signed MOQ agreements and a new POS supplier.', name: 'Vuthy K.', role: 'Retail Tech Investor' },
    ],
    pricingTitle: 'Transparent Investment',
    pricingSubtitle: 'Limited to only 30 participants to ensure personalized business matchmaking and attention.',
    earlyBirdBadge: 'Most Popular & Best Value',
    earlyBirdPlanName: 'Early Bird Admission',
    regularPlanName: 'Standard Admission',
    earlyBirdLabel: 'Early Bird Discount Ends In:',
    earlyBirdSub: 'After the deadline the price returns to $550',
    regDeadline: 'Registration Closes In:',
    regDeadlineSub: 'After this deadline, no further registrations are accepted',
    stepsTitle: 'Reserve in 3 Steps — No Payment Today',
    stepsSubtitle: 'Most delegates finish step 1 in under 60 seconds.',
    steps: [
      { num: 1, title: 'Reserve Your Seat', desc: 'Enter your name and phone below. Your seat is held instantly — no payment required today.' },
      { num: 2, title: 'Confirm on a Call', desc: 'Our coordinator calls within 15 minutes, answers every question, and sends your official invoice via Telegram.' },
      { num: 3, title: 'Pack & Fly', desc: 'On Oct 8 you just bring your passport. Flights, hotel, coach, interpreters and factory visits are all arranged.' },
    ],
    guaranteeTitle: 'Your Reservation Is Risk-Free',
    guaranteeText: 'You pay nothing until you have spoken with our team and decided it is right for your business. If the trip is ever canceled by the organizer, every registered delegate receives a full refund.',
    guaranteePoints: [
      'No payment today — reserve with just your name',
      'Official invoice & itinerary sent via Telegram',
      'Full refund if the organizer cancels the trip',
    ],
    registrationSectionTitle: 'Reserve Your Seat in 2 Easy Ways',
    registrationSectionSubtitle: 'Choose the fastest option that works for you. Our team responds in less than 15 minutes during business hours.',
    option2Title: '30-Second Fast Registration',
    option2Desc: 'Lock in your seat today. Enter your Name and Phone number below; our trip coordinator will contact you immediately to finalize details.',
    formNameLabel: 'Your Full Name *',
    formNamePlaceholder: 'e.g. Johnathan Doe / លោក សុខ សុវណ្ណ',
    formPhoneLabel: 'Phone Number (Telegram / WhatsApp) *',
    formPhonePlaceholder: 'e.g. 012 345 678 / +855 12 345 678',
    formSubmitBtn: 'Submit Registration Now',
    formSubmitting: 'Submitting your reservation...',
    formSuccessTitle: 'Registration Received!',
    formSuccessDesc: 'Thank you! Our KHB EVENTS team has received your details and will call or message you shortly to confirm your booking.',
    formSuccessTelegramPrompt: 'Want a faster confirmation? Click below to chat directly with us on Telegram.',
    option1Highlight: 'Fastest Response • Instant Itinerary PDF',
    faqTag: 'Objection Handling',
    faqTitle: 'Questions Smart Buyers Ask First',
    faqSubtitle: 'Everything you need to decide with confidence.',
    faqs: [
      { q: 'Do I need a visa for Vietnam?', a: 'Cambodian passport holders can enter Vietnam visa-free for up to 30 days. Our team also handles all arrival paperwork and customs facilitation so you walk straight through.' },
      { q: 'Do I have to pay today?', a: 'No. You reserve with just your name and phone number. Our coordinator calls you within 15 minutes, and you pay only after your flights, hotel and factory schedule are confirmed.' },
      { q: 'Can my company get an official invoice?', a: 'Yes. We issue corporate billing and official invoices — just request it on Telegram or mention it during your confirmation call.' },
      { q: 'Is the hotel room private?', a: 'The package includes premium twin/double sharing. If you prefer a private single room, tell your coordinator and we will arrange it with a small supplement.' },
      { q: 'What happens if seats sell out before I decide?', a: 'The 30-seat cabin is first-come, first-served — once a seat is reserved it is locked for that delegate. Latecomers join a waitlist, but there is no guarantee a seat opens up.' },
      { q: 'What is NOT included in the $499?', a: 'Lunches and dinners outside the listed program (except the Halong Bay cruise lunch), Vietnam SIM card, travel insurance, and personal shopping. Everything logistical is covered.' },
      { q: 'Can I get a refund after paying?', a: 'Yes. If you cancel at least 14 days before departure and your seat can be refilled from the waitlist, you receive a full refund. Organizer cancellations are always refunded in full.' },
    ],
    ctaTitle: 'Only 11 Seats Left. 19 Business Owners Are Already In.',
    ctaSub: 'When the 30-seat cabin fills up, registration closes — even if that is before Sept 20. Your competitor may be holding the seat you wanted.',
    finalCtaBtn: 'Claim One of the Remaining Seats',
    trustTitle: 'Organized by KHB EVENTS Cambodia',
    trustDesc: 'KHB EVENTS & Media connects Cambodian entrepreneurs, importers, and investors with verified manufacturers and trade exhibitions across the region — with full logistical support in Khmer, English, and Vietnamese.',
    footerText: '© 2026 KHB EVENTS Cambodia. All rights reserved.',
    passTier: 'VIP EXECUTIVE',
    passBrandSub: 'VIETNAM EXPO DELEGATION 2026',
    passFrom: 'Phnom Penh',
    passTo: 'Hanoi / Halong',
    passRouteDate: 'OCT 8 - 11, 2026',
    passNameLabel: 'DELEGATE NAME',
    passSeatLabel: 'ASSIGNED SEAT',
    passIndustryLabel: 'INDUSTRY FOCUS',
    passRateLabel: 'RATE LOCKED',
    passRateValue: '$499 EARLY BIRD',
    passGuest: 'GUEST DELEGATE',
  },
  kh: {
    badge: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្មកម្រិត B2B ពិសេស ២០២៦',
    heroTitle: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម Smart City, Tea & Cafe នៅប្រទេសវៀតណាម',
    heroHeadlineHighlight: 'ត្រឡប់មកវិញជាមួយដៃគូផ្គត់ផ្គង់ មិនមែនគ្រាន់តែរូបភាព។',
    heroSubtitle: 'ជួបជាមួយរោងចក្រផលិតផ្ទាល់ ទស្សនាពិព័រណ៍ Smart City Expo និង Cafe Show Vietnam ព្រមទាំងស្វែងរកដៃគូអាជីវកម្មបោះដុំនៅទីក្រុង ហាណូយ និង ហាឡុងបេ។',
    heroCtaDiscover: 'មើលអ្វីដែលលោកអ្នកនឹងទទួលបាន',
    heroSkipLink: 'ឬកក់កៅអីរបស់លោកអ្នកឥឡូវនេះ →',
    heroRiskNote: 'មិនត្រូវបង់ប្រាក់ថ្ងៃនេះ • កៅអីត្រូវបានកក់ទុកភ្លាមៗ • ឆ្លើយតបក្នុង ១៥ នាទី',
    earlyBirdNotice: 'តម្លៃពិសេស Early Bird: ចំណេញ $51 មុនថ្ងៃទី 8 កញ្ញា 2026 | កំណត់ត្រឹម 30 នាក់ប៉ុណ្ណោះ',
    heroPriceAnchorNote: 'តម្លៃ Early Bird — ធ្លាប់ $550។ លោកអ្នកចំណេញ $51។',
    pillDate: 'ថ្ងៃទី ៨ - ១១ តុលា ២០២៦ (៤ថ្ងៃ / ៣យប់)',
    pillDest: 'ហាណូយ & ហាឡុងបេ វៀតណាម',
    pillExpos: 'ពិព័រណ៍អន្តរជាតិ ២',
    pillCruise: 'កប៉ាល់ UNESCO ហាឡុងបេ',
    pillSeats: 'កៅអីត្រឹម ៣០ នាក់',
    navWhy: 'ហេតុអ្វីចូលរួម',
    navPackage: 'កញ្ចប់ 9-in-1',
    navItinerary: 'កាលវិភាគ',
    navSeats: 'កៅអី 30',
    navPricing: 'តម្លៃ',
    navFaq: 'សំណួរញឹកញាប់',
    navCta: 'កក់ $499',
    navCtaMobile: 'ចុះឈ្មោះ ($499)',
    coreValueTag: 'តម្លៃស្នូលមកមុន',
    coreValueTitle: 'ដំណើរនេះនឹងនាំមកឱ្យអាជីវកម្មរបស់លោកអ្នកនូវអ្វីខ្លះ',
    coreValueSubtitle: 'មុននឹងមើលតម្លៃណាមួយ សូមយល់ដឹងជាមុនពីលទ្ធផល ៤ យ៉ាងដែលលោកអ្នកនឹងយកទៅផ្ទះ — ដែលការស្វែងរកតាមអ៊ីនធឺណិត ឈ្មោះកណ្តាល ឬរូបភាពមិនអាចផ្តល់បានឡើយ។',
    coreValueBridge: 'ចូរចាំលទ្ធផល ៤ ចំណុចនេះជាប់ — ព័ត៌មានលម្អិតទាំងអស់ខាងក្រោម មានគោលបំណងតែមួយគត់ គឺដើម្បីផ្តល់ជូនលទ្ធផលទាំង ៤ នោះ។',
    coreValues: [
      { num: '01', icon: 'chart', title: 'អំណាចតម្លៃផ្ទាល់រោងចក្រ', desc: 'ទិញនៅប្រភពផ្ទាល់ កាត់បន្ថយ ២៥% - ៣៥% ពីតម្លៃឈ្មោះកណ្តាល។ គ្រាន់តែការចរចាទូកុងតឺន័រមួយ អាចសងថ្លៃដំណើរទាំងមូលវិញ។' },
      { num: '02', icon: 'shield', title: 'ការជឿជាក់ដោយផ្ទាល់មុខ', desc: 'ដើរលើផ្ទៃរោងចក្រ ពិនិត្យមន្ទីរពិសោធន៍គុណភាព និងជួបផ្គត់ផ្គង់ដោយផ្ទាល់មុខ មុននឹងផ្ទេរប្រាក់នីមួយៗ។' },
      { num: '03', icon: 'trophy', title: 'សិទ្ធិចែកចាយផ្តាច់មុខ', desc: 'កក់សិទ្ធិចែកចាយផ្តាច់មុខនៅកម្ពុជា មុនពេលអ្នកនាំចូលផ្សេងទៀតចុះកិច្ចសន្យាជាមួយផ្គត់ផ្គង់ដូចគ្នា។' },
      { num: '04', icon: 'zap', title: 'ស្គាល់និន្នាការឆ្នាំ ២០២៦ មុនគេ', desc: 'ពិព័រណ៍អន្តរជាតិ ២ ក្នុងដំណើរតែមួយ — ទទួលបានផលិតផល ការវេចខ្ចប់ និងបច្ចេកវិទ្យាលក់រាយឆ្លាតវៃថ្មីៗ មុនដៃគូប្រកួត។' },
    ],
    proofStripText: 'ម្ចាស់អាជីវកម្មបានកក់កៅអីរបស់ពួកគេរួចហើយ',
    proofStripTags: ['CEO ខ្សែហាងកាហ្វេ', 'អ្នកនាំចូលតែ', 'អ្នកតំណភ្ជាប់ POS', 'អ្នកបោះដុំភេសជ្ជៈ', 'អ្នកវិនិយោគ F&B', 'សហគ្រិនបច្ចេកវិទ្យា'],
    statsStrip: [
      { value: '9-in-1', label: 'កញ្ចប់ពេញលេញទាំងអស់' },
      { value: '2', label: 'ពិព័រណ៍ពាណិជ្ជកម្មអន្តរជាតិ' },
      { value: '30', label: 'កៅអីត្រឹមតែ មួយជំនាន់' },
      { value: '4D/3N', label: 'ហាណូយ & ហាឡុងបេ' },
    ],
    problemTag: 'ថ្លៃដើមពិតប្រសិនបើស្វែងរកដោយខ្លួនឯង',
    problemTitle: 'ហេតុអ្វីអ្នកនាំចូលដែលទិញតាមអ៊ីនធឺណិតត្រូវបង់ខ្ពស់ដល់ ៣៥%',
    problemSubtitle: 'រូបថតមិនអាចចរចាតម្លៃបានទេ។ រូបភាពមិនអាចបញ្ជាក់គុណភាពបានទេ។',
    problems: [
      { icon: 'trend-down', title: 'ថ្លៃឈ្មោះកណ្តាល', desc: 'ការទិញតាមឈ្មោះកណ្តាលនិងអ្នកលក់បន្ត បន្ថែម ២៥% - ៣៥% លើការបញ្ជាទិញនីមួយៗ មុនដល់ឃ្លាំងរបស់លោកអ្នក។' },
      { icon: 'chat', title: 'ឧបសគ្គីភាសា & ការជឿជាក់', desc: 'ដោយគ្មានភាសាដូចគ្នា កិច្ចសន្យាតូចៗចប់កណ្តាលផ្លូវ — ហើយលោកអ្នកមិនអាចផ្ទៀងផ្ទាត់បានថាណាមួយជារោងចក្រពិត ឬឈ្មោះកណ្តាល។' },
      { icon: 'search', title: 'ទិញតាមអ៊ីនធឺណិតដោយគ្មានការផ្ទៀងផ្ទាត់', desc: 'បញ្ជាទិញដោយទុកចិត្តតែរូបភាព។ គ្មានផ្ទៃរោងចក្រ គ្មានមន្ទីរពិសោធន៍គុណភាព គ្មានការចរចាបរិមាណផ្ទាល់មុខ គ្មានទំនាក់ទំនង។' },
    ],
    solutionBridge: 'ដំណើរទស្សនកិច្ចនេះដោះស្រាយទាំង ៣ ចំណុចក្នុងរយៈពេលតែ ៤ ថ្ងៃ។',
    audienceSecTitle: 'តើដំណើរទស្សនកិច្ចនេះស័ក្តិសមសម្រាប់អ្នកណា?',
    audienceSecSub: 'រៀបចំឡើងយ៉ាងពិសេសសម្រាប់ម្ចាស់អាជីវកម្ម អ្នកនាំចូល និងសហគ្រិនដែលស្វែងរកប្រភពទំនិញពីរោងចក្រផ្ទាល់។',
    audiences: [
      { icon: 'cpu', title: 'អ្នកនាំចូលបច្ចេកវិទ្យា & Smart City', desc: 'ស្វែងរកបច្ចេកវិទ្យាទីក្រុងឆ្លាតវៃ ឧបករណ៍ IoT ប្រព័ន្ធសុវត្ថិភាព និងស្វ័យប្រវត្តិកម្មពីរោងចក្រស្តង់ដារអន្តរជាតិ។' },
      { icon: 'coffee', title: 'ម្ចាស់ប្រេនហាងកាហ្វេ & តែ', desc: 'ស្វែងរកប្រភពគ្រាប់កាហ្វេ តែវៀតណាមល្បីៗ ម៉ាស៊ីនឆុងកាហ្វេទំនើប សម្ភារៈវេចខ្ចប់ និងរូបមន្តភេសជ្ជៈថ្មីៗ។' },
      { icon: 'truck', title: 'អ្នកបោះដុំ & ចែកចាយទូទាំងប្រទេស', desc: 'ទទួលបានសិទ្ធិចែកចាយផ្តាច់មុខ ចរចាតម្លៃបោះដុំផ្ទាល់ពីរោងចក្រ និងសេវាកម្មផលិតក្រោមម៉ាកយីហោផ្ទាល់ខ្លួន (OEM/ODM)។' },
      { icon: 'users', title: 'សហគ្រិន & អ្នកវិនិយោគ F&B', desc: 'ស្វែងយល់ពីប្រេនល្បីៗនៅវៀតណាម និងអន្តរជាតិ ម៉ូដែលអាជីវកម្មជោគជ័យ និងឱកាសទិញសិទ្ធិអាជីវកម្ម (Franchise)។' },
    ],
    valueStackTag: 'ប្រភេទសេវាកម្ម',
    valueStackTitle: 'តម្លៃតែមួយ។ ការដោះស្រាយ ៩ ចំណុចពេញលេញ។',
    valueStackSubtitle: 'អ្វីៗទាំងអស់ខាងក្រោមមានបញ្ចូលក្នុងកៅអីរបស់លោកអ្នក។',
    valueStackNote: 'ថ្លៃដើមប្រហាណ់ប្រសិនបើលោកអ្នករៀបចំដោយខ្លួនឯង',
    valueStackTotalLabel: 'តម្លៃសរុបប្រហាណ់',
    valueStackTotalValue: '$910+',
    valueStackPayLabel: 'ការវិនិយោគ Early Bird របស់លោកអ្នក',
    inclusions: [
      { id: 1, title: 'សំបុត្រយន្តហោះទៅមក', desc: 'សំបុត្រយន្តហោះទៅមក ភ្នំពេញ - ហាណូយ រួមបញ្ចូលរួចជាស្រេច។' },
      { id: 2, title: 'សណ្ឋាគារស្នាក់នៅ (៣យប់ / ៤ថ្ងៃ)', desc: 'ការស្នាក់នៅសណ្ឋាគារស្តង់ដារប្រណិតប្រកបដោយផាសុកភាព។' },
      { id: 3, title: 'អាហារពេលព្រឹកប្រចាំថ្ងៃ', desc: 'អាហារប៊ូហ្វេពេលព្រឹកនៅសណ្ឋាគារជារៀងរាល់ថ្ងៃ។' },
      { id: 4, title: 'រថយន្តក្រុងទេសចរណ៍ពិសេស', desc: 'រថយន្តក្រុងទំនើប ម៉ាស៊ីនត្រជាក់ សម្រាប់គ្រប់ការធ្វើដំណើរនៅវៀតណាម។' },
      { id: 5, title: 'មគ្គុទេសក៍ពាណិជ្ជកម្ម ៣ ភាសា', desc: 'មគ្គុទេសក៍ជំនាញនិយាយភាសា ខ្មែរ-អង់គ្លេស-វៀតណាម ជួយសម្រួលការចរចា។' },
      { id: 6, title: 'សំបុត្រ VIP ចូលពិព័រណ៍ទាំងអស់', desc: 'ការចុះឈ្មោះចូលទស្សនាពិព័រណ៍ Cafe Show និង Smart City Expo ទាំងមូល។' },
      { id: 7, title: 'សេវាសម្រួលបែបបទឆ្លងដែន', desc: 'ការសម្រួលបែបបទអន្តោប្រវេសន៍នៅព្រលានយន្តហោះយ៉ាងរហ័ស។' },
      { id: 8, title: 'ការទស្សនារោងចក្រ & កន្លែងបោះដុំផ្ទាល់', desc: 'ចូលទស្សនាខ្សែសង្វាក់ផលិតកម្មកាហ្វេ/តែ និងឃ្លាំងបោះដុំធំៗនៅវៀតណាម។' },
      { id: 9, title: 'ជិះកប៉ាល់ទេសចរណ៍ Halong Bay', desc: 'ទស្សនាតំបន់បេតិកភណ្ឌពិភពលោក UNESCO Halong Bay ជាមួយអាហារថ្ងៃត្រង់លើកប៉ាល់។' },
    ],
    valueStackPrices: [220, 150, 25, 80, 60, 120, 40, 150, 65],
    ctaBtn: 'ស្វែងរកកៅអីចុងក្រោយ',
    valueCtaBtn: 'ចាក់សោ $499 — កក់ឥឡូវ',
    matchmakerTag: 'ROI Matchmaker អន្តរកម្ម',
    matchmakerTitle: 'មើលផ្លូវវិនិយោគត្រឹមត្រូវរបស់លោកអ្នក',
    matchmakerSub: 'ជ្រើសរើសឧស្សាហកម្មរបស់លោកអ្នក — យើងនឹងបង្ហាញអ្នកផ្គត់ផ្គង់ដែលលោកអ្នកនឹងជួប ប្រាក់ចំណេញដែលអាចទទួលបាន និងវគ្គដែលរៀបចំជូន។',
    matchSuppliersTitle: 'អ្នកផ្គត់ផ្គង់ដែលអ្នកនឹងជួប',
    matchRoiTitle: 'ប្រាក់ចំណេញដែលអាចទទួលបាន',
    matchSessionsTitle: 'វគ្គរៀបចំជូនសម្រាប់លោកអ្នក',
    matchCtaBtn: 'ចាក់សោផ្លូវវិនិយោគនេះទៅក្នុងប័ណ្ណ VIP',
    ctaBarText: (track: string) => `ចាប់អារម្មណ៍វិស័យ <strong>${track}</strong>?`,
    itineraryTitle: 'កាលវិភាគលម្អិតរយៈពេល ៤ ថ្ងៃ ៣ យប់',
    itinerarySubtitle: 'តុល្យភាពដ៏ល្អឥតខ្ចោះរវាងការងារពាណិជ្ជកម្ម ការស្វែងយល់ទីផ្សារ និងការសម្រាកលំហែកាយ។',
    itinerary: [
      { day: 1, date: 'ថ្ងៃទី ៨ តុលា ២០២៦', title: 'ភ្នំពេញ ទៅ ហាណូយ & ការស្វាគមន៍', events: [
        { time: '17:45 - 21:35', activity: 'ជើងហោះហើរពីភ្នំពេញ ទៅកាន់ទីក្រុងហាណូយ (ព្រលានយន្តហោះ Noi Bai)' },
        { time: '22:30 - 23:00', activity: 'រថយន្តទទួល និងធ្វើការ Check-in ចូលសណ្ឋាគារនៅហាណូយ' },
        { time: '23:00 - 24:00', activity: 'ដើរទស្សនាកម្សាន្ត និងស្វែងយល់ជីវិតរាត្រីនៅទីក្រុងហាណូយ (តាមការស្ម័គ្រចិត្ត)' },
      ]},
      { day: 2, date: 'ថ្ងៃទី ៩ តុលា ២០២៦', title: 'ទស្សនាពិព័រណ៍ Cafe Show & ជំនួបពាណិជ្ជកម្ម', events: [
        { time: '08:00 - 09:00', activity: 'ញ៉ាំអាហារពេលព្រឹកប៊ូហ្វេនៅសណ្ឋាគារ' },
        { time: '09:00 - 09:30', activity: 'ធ្វើដំណើរតាមរថយន្តក្រុងទៅកាន់មជ្ឈមណ្ឌលពិព័រណ៍វៀតណាម' },
        { time: '10:00 - 12:00', activity: 'ទស្សនាពិព័រណ៍ Cafe Show Expo (តែ កាហ្វេ ម៉ាស៊ីនឆុង និងវត្ថុធាតុដើម)' },
        { time: '12:00 - 13:00', activity: 'ញ៉ាំអាហារថ្ងៃត្រង់នៅមជ្ឈមណ្ឌលពិព័រណ៍' },
        { time: '13:00 - 16:00', activity: 'ចូលរួមជំនួបពាណិជ្ជកម្ម B2B Matching និងចរចាជាមួយដៃគូផ្គត់ផ្គង់' },
        { time: '16:00 - 17:00', activity: 'ត្រឡប់មកសម្រាកនៅសណ្ឋាគារ' },
        { time: '18:00 - 22:00', activity: 'ដើរទស្សនាតំបន់ទេសចរណ៍ល្បីៗនៅហាណូយ និងញ៉ាំអាហារបែបប្រពៃណី' },
      ]},
      { day: 3, date: 'ថ្ងៃទី ១០ តុលា ២០២៦', title: 'ពិព័រណ៍ Smart City, ទស្សនារោងចក្រ & ដំណើរទៅ Halong Bay', events: [
        { time: '08:00 - 09:00', activity: 'ញ៉ាំអាហារពេលព្រឹកនៅសណ្ឋាគារ' },
        { time: '09:00 - 09:30', activity: 'ចេញដំណើរបន្តទៅកាន់មជ្ឈមណ្ឌលពិព័រណ៍' },
        { time: '10:00 - 12:00', activity: 'ទស្សនាពិព័រណ៍ Smart City Expo (បច្ចេកវិទ្យាទីក្រុងឆ្លាតវៃ IoT និងប្រព័ន្ធសុវត្ថិភាព)' },
        { time: '12:00 - 13:00', activity: 'ញ៉ាំអាហារថ្ងៃត្រង់នៅមជ្ឈមណ្ឌលពិព័រណ៍' },
        { time: '13:00 - 15:30', activity: 'ចុះទស្សនារោងចក្រកែច្នៃកាហ្វេ/តែ និងឃ្លាំងបោះដុំផ្ទាល់' },
        { time: '15:30 - 18:30', activity: 'ធ្វើដំណើរបន្តឆ្ពោះទៅកាន់ឈូងសមុទ្រ Halong Bay តាមផ្លូវល្បឿនលឿន' },
        { time: '18:30 - 22:00', activity: 'Check-in សណ្ឋាគារ និងដើរកម្សាន្តផ្សាររាត្រី Halong Bay' },
      ]},
      { day: 4, date: 'ថ្ងៃទី ១១ តុលា ២០២៦', title: 'ជិះកប៉ាល់កម្សាន្ត Halong Bay & ត្រឡប់មកភ្នំពេញវិញ', events: [
        { time: '06:00 - 07:00', activity: 'ញ៉ាំអាហារពេលព្រឹក និង Check-out ចេញពីសណ្ឋាគារ' },
        { time: '07:00 - 07:30', activity: 'ធ្វើដំណើរទៅកាន់កំពង់ផែទេសចរណ៍អន្តរជាតិ Halong Bay' },
        { time: '07:30 - 11:30', activity: 'ជិះកប៉ាល់ទេសចរណ៍កម្សាន្តតំបន់បេតិកភណ្ឌ UNESCO Halong Bay ព្រមទាំងអាហារថ្ងៃត្រង់គ្រឿងសមុទ្រ' },
        { time: '11:30 - 15:00', activity: 'ធ្វើដំណើរត្រឡប់មកកាន់ព្រលានយន្តហោះ Noi Bai ហាណូយ' },
        { time: '15:00 - 17:00', activity: 'Check-in សំបុត្រយន្តហោះ និងឆ្លងកាត់បែបបទអន្តោប្រវេសន៍' },
        { time: '17:45 - 19:05', activity: 'ជើងហោះហើរត្រឡប់មកដល់ព្រលានយន្តហោះអន្តរជាតិភ្នំពេញដោយសុវត្ថិភាព' },
      ]},
    ],
    seatTitle: 'មើលកៅអីក្នុងហ្វូងដំណើរ',
    seatSubtitle: 'រាល់កៅអីដែលបានកក់ខាងក្រោម គឺជាអាជីវកម្មពិតប្រាកដដែលយើងនឹងណែនាំជូនអ្នកក្នុងដំណើរ។',
    seatLegendBooked: 'បានកក់',
    seatLegendAvailable: 'ទំនេរ',
    seatLegendSelected: 'Your Selection',
    seatReservedTxt: 'កៅអីបានកក់',
    seatAvailableTxt: 'កៅអីនៅសល់',
    seatBanner: (n: number) => `កៅអីដែលបានជ្រើសរើស៖ <strong>Seat #${n}</strong> (ចុចលើកៅអីបៃតងណាមួយដើម្បីប្តូរ)`,
    reservedLabel: 'បានកក់',
    availableLabel: 'ទំនេរ',
    selectedLabel: '✓ បានជ្រើសរើស',
    clickSeat: 'ចុចដើម្បីកក់កៅអីទី #',
    bookedSeat: (n: number) => `កៅអីទី ${n} (បានកក់)`,
    testimonialsTag: 'ភស្តុតាងសង្គម',
    testimonialsTitle: 'អ្នកចូលរួមពីដំណើរមុនៗ',
    testimonialsSubtitle: 'លទ្ធផលដែលបានរាយការណ៍ដោយម្ចាស់អាជីវកម្មដែលចូលរួមដំណើរ KHB។',
    testimonials: [
      { quote: 'ខ្ញុំបានជួបរោងចក្រកិនកាហ្វេ ៥ ក្នុងថ្ងៃតែមួយ ហើយកាត់បន្ថយថ្លៃទិញគ្រាប់កាហ្វេបាន ៣០%។', name: 'Dara S.', role: 'ម្ចាស់ខ្សែហាងកាហ្វេ ភ្នំពេញ' },
      { quote: 'ការដើរមើលផ្ទៃរោងចក្រដោយផ្ទាល់ភ្នែករបស់ខ្ញុំ បង្កើតទំនុកចិត្តដែលខ្ញុំមិនអាចទទួលបានតាមអ៊ីនធឺណិត។ យើងបានចុះកិច្ចសន្យាចែកចាយផ្តាច់មុខនៅកម្ពុជា។', name: 'Sophea T.', role: 'អ្នកនាំចូលភេសជ្ជៈ' },
      { quote: 'មគ្គុទេសក៍ ៣ ភាសាបានចរចាជំនួសខ្ញុំ។ យើងត្រឡប់មកជាមួយកិច្ចព្រមព្រៀង MOQ ២ ហើយមានអ្នកផ្គត់ផ្គង់ POS ថ្មី។', name: 'Vuthy K.', role: 'អ្នកវិនិយោគបច្ចេកវិទ្យាលក់រាយ' },
    ],
    pricingTitle: 'តម្លៃកញ្ចប់សេវាកម្មប្រកបដោយតម្លាភាព',
    pricingSubtitle: 'កំណត់ត្រឹមតែ ៣០ នាក់ប៉ុណ្ណោះ ដើម្បីធានាបាននូវការយកចិត្តទុកដាក់ និងការផ្គូផ្គងអាជីវកម្មល្អបំផុត។',
    earlyBirdBadge: 'ជម្រើសពេញនិយម & ចំណេញបំផុត',
    earlyBirdPlanName: 'ការចូលរួមតម្លៃ Early Bird',
    regularPlanName: 'ការចូលរួមតម្លៃធម្មតា',
    earlyBirdLabel: 'ការបញ្ចុះតម្លៃ Early Bird នឹងផុតកំណត់ក្នុង៖',
    earlyBirdSub: 'បន្ទាប់ពីកំណត់ តម្លៃនឹងត្រឡប់ទៅ $550 វិញ',
    regDeadline: 'ការចុះឈ្មោះនឹងបិទក្នុង៖',
    regDeadlineSub: 'បន្ទាប់ពីកំណត់នេះ គ្មានការចុះឈ្មោះបន្ថែមទៀតទេ',
    stepsTitle: 'កក់ក្នុង ៣ ជំហាន — មិនត្រូវបង់ថ្ងៃនេះ',
    stepsSubtitle: 'អ្នកចូលរួមភាគច្រើនបញ្ចប់ជំហានទី ១ ក្នុងរយៈពេលតែ ៦០ វិនាទី។',
    steps: [
      { num: 1, title: 'កក់កៅអីរបស់លោកអ្នក', desc: 'បំពេញឈ្មោះ និងលេខទូរស័ព្ទខាងក្រោម។ កៅអីត្រូវបានកក់ទុកភ្លាមៗ — មិនត្រូវបង់ប្រាក់ថ្ងៃនេះទេ។' },
      { num: 2, title: 'បញ្ជាក់តាមទូរស័ព្ទ', desc: 'អ្នកសម្របសម្រួលរបស់យើងនឹងទូរស័ព្ទក្នុងរយៈពេល ១៥ នាទី ឆ្លើយគ្រប់សំណួរ និងផ្ញើវិក្កយបត្រផ្លូវការតាម Telegram។' },
      { num: 3, title: 'បោះសម្ព័ន្ធ ហើយហោះហើរ', desc: 'ថ្ងៃទី ៨ តុលា លោកអ្នកគ្រាន់តែយកលិខិតឆ្លងដែន។ ជើងហោះហើរ សណ្ឋាគារ រថយន្ត អ្នកបកប្រែ និងការទស្សនារោងចក្រ ទាំងអស់ត្រូវបានរៀបចំរួចរាល់។' },
    ],
    guaranteeTitle: 'ការកក់របស់លោកអ្នកគ្មានហានិភ័យ',
    guaranteeText: 'លោកអ្នកមិនបង់ប្រាក់អ្វីទេ រហូតទាល់តែបានជួបសុន្ធរយការជាមួយក្រុមយើង ហើយសម្រេចចិត្តថាវាស័ក្តិសមសម្រាប់អាជីវកម្មរបស់លោកអ្នក។',
    guaranteePoints: [
      'មិនបង់ថ្ងៃនេះ — កក់តែដោយឈ្មោះរបស់លោកអ្នក',
      'វិក្កយបត្រផ្លូវការ & កាលវិភាគផ្ញើតាម Telegram',
      'បង្វិលប្រាក់ពេញ ប្រសិនបើអ្នករៀបចំបោះបង់ដំណើរ',
    ],
    registrationSectionTitle: 'ចុះឈ្មោះកក់កន្លែងងាយៗតាម ២ ជម្រើស',
    registrationSectionSubtitle: 'ជ្រើសរើសជម្រើសដែលលោកអ្នកពេញចិត្តបំផុត។ ក្រុមការងារយើងនឹងទាក់ទងត្រឡប់ក្នុងរយៈពេលយ៉ាងយូរ ១៥ នាទី។',
    option2Title: 'បំពេញបែបបទចុះឈ្មោះក្នុង ៣០ វិនាទី',
    option2Desc: 'កក់ទុកកន្លែងរបស់លោកអ្នកឥឡូវនេះ។ គ្រាន់តែបញ្ចូល ឈ្មោះ និង លេខទូរស័ព្ទ ក្រុមការងារយើងនឹងទូរស័ព្ទបញ្ជាក់ព័ត៌មានជូនភ្លាមៗ។',
    formNameLabel: 'ឈ្មោះពេញរបស់លោកអ្នក *',
    formNamePlaceholder: 'ឧ. លោក សុខ សុវណ្ណ / Johnathan Doe',
    formPhoneLabel: 'លេខទូរស័ព្ទ (Telegram / WhatsApp) *',
    formPhonePlaceholder: 'ឧ. 012 345 678 / +855 12 345 678',
    formSubmitBtn: 'ចុះឈ្មោះកក់កន្លែងឥឡូវនេះ',
    formSubmitting: 'កំពុងបញ្ជូនព័ត៌មាន...',
    formSuccessTitle: 'ទទួលបានការចុះឈ្មោះជោគជ័យ!',
    formSuccessDesc: 'សូមអរគុណ! ក្រុមការងារ KHB EVENTS ទទួលបានព័ត៌មានរបស់លោកអ្នករួចហើយ ហើយនឹងទាក់ទងមកលោកអ្នកក្នុងពេលបន្តិចទៀតនេះ។',
    formSuccessTelegramPrompt: 'ចង់បានការបញ្ជាក់កាន់តែលឿន? ចុចខាងក្រោមដើម្បីជជែកផ្ទាល់តាម Telegram។',
    option1Highlight: 'ឆ្លើយតបរហ័ស • ផ្ញើជូនកាលវិភាគ PDF ភ្លាមៗ',
    faqTag: 'ដោះស្រាយការសង្ស័យ',
    faqTitle: 'សំណួរដែលអ្នកទិញឆ្លាតវៃសួរជាមុន',
    faqSubtitle: 'ព័ត៌មានគ្រប់យ៉ាងដែលអ្នកត្រូវការដើម្បីសម្រេចចិត្តដោយទំនុកចិត្ត។',
    faqs: [
      { q: 'តើខ្ញុំត្រូវការទិដ្ឋាការ (VISA) ដើម្បីចូលប្រទេសវៀតណាមទេ?', a: 'ជនជាតិខ្មែរអាចចូលប្រទេសវៀតណាមដោយគ្មានទិដ្ឋាការរហូតដល់ ៣០ ថ្ងៃ។ ក្រុមការងារយើងក៏ជួយដោះស្រាយឯកសារចូលប្រទេស និងបែបបទគយ ដើម្បីឱ្យលោកអ្នកឆ្លងកាត់ប្រកបដោយភាពងាយស្រួល។' },
      { q: 'តើខ្ញុំត្រូវបង់ប្រាក់ថ្ងៃនេះទេ?', a: 'មិនទេ។ លោកអ្នកអាចចុះឈ្មោះដោយគ្រាន់តែ ឈ្មោះ និង លេខទូរស័ព្ទ។ អ្នកសម្របសម្រួលរបស់យើងនឹងទូរស័ព្ទទៅលោកអ្នកក្នុងរយៈពេល ១៥ នាទី ហើយទូទាត់ប្រាក់ត្រឹមតែបន្ទាប់ពីផ្ទៀងផ្ទាត់ ជើងហោះហើរ សណ្ឋាគារ និងកាលវិភាគ។' },
      { q: 'តើក្រុមហ៊ុនខ្ញុំអាចទទួលបានវិក្កយបត្រផ្លូវការទេ?', a: 'បាទ/ចាស។ យើងចេញវិក្កយបត្រសម្រាប់ក្រុមហ៊ុន — គ្រាន់តែស្នើតាម Telegram ឬនិយាយក្នុងពេលចរចា។' },
      { q: 'តើបន្ទប់សណ្ឋាគារជាបន្ទប់ឯកជនទេ?', a: 'កញ្ចប់រួមមានបន្ទប់ Twin/Double Sharing ជាមួយអ្នកចូលរួមម្នាក់ទៀត។ ប្រសិនបើចង់បានបន្ទប់ឯករាជ្យ អ្នកសម្របសម្រួលនឹងជួយរៀបចំក្នុងថ្លៃបន្ថែមមួយចំនួន។' },
      { q: 'តើមានអ្វីខ្លះ មិនរួមបញ្ចូលក្នុង $499?', a: 'អាហារថ្ងៃត្រង់ និងអាហារពេលល្ងាចក្រៅកម្មវិធី (លើកលែងតែអាហារនៅ Halong Bay Cruise) SIM Card វៀតណាម ធានារ៉ាប់រងការធ្វើដំណើរ និងការដើរទិញទំនិញផ្ទាល់ខ្លួន។ ការធ្វើដំណើរគ្រប់ផ្នែកត្រូវបានរួមបញ្ចូល។' },
    ],
    ctaTitle: 'នៅសល់ ១១ កៅអីប៉ុណ្ណោះ។ ម្ចាស់អាជីវកម្ម ១៩ នាក់បានចូលរួមហើយ។',
    ctaSub: 'នៅពេលហ្វូងដំណើរ ៣០ កៅអីពេញ ការចុះឈ្មោះនឹងបិទ — ទោះជាមុន ២០ កញ្ញា ក៏ដោយ។',
    finalCtaBtn: 'ស្វែងរកកៅអីចុងក្រោយ',
    trustTitle: 'រៀបចំដោយ KHB EVENTS Cambodia',
    trustDesc: 'KHB EVENTS & Media ភ្ជាប់សហគ្រិន អ្នកនាំចូល និងអ្នកវិនិយោគកម្ពុជា ជាមួយរោងចក្រ និងពិព័រណ៍ពាណិជ្ជកម្ម ជាមួយការគាំទ្រពេញលេញជាភាសា ខ្មែរ អង់គ្លេស និងវៀតណាម។',
    footerText: '© 2026 KHB EVENTS Cambodia. រក្សាសិទ្ធិទាំងអស់។',
    passTier: 'VIP EXECUTIVE',
    passBrandSub: 'VIETNAM EXPO DELEGATION 2026',
    passFrom: 'Phnom Penh',
    passTo: 'Hanoi / Halong',
    passRouteDate: 'OCT 8 - 11, 2026',
    passNameLabel: 'DELEGATE NAME',
    passSeatLabel: 'ASSIGNED SEAT',
    passIndustryLabel: 'INDUSTRY FOCUS',
    passRateLabel: 'RATE LOCKED',
    passRateValue: '$499 EARLY BIRD',
    passGuest: 'ភ្ញៀវកិត្តិយស',
  },
};

// Matchmaker data — exactly from old app.js
const MATCHMAKER_DATA = {
  cafe: {
    en: {
      title: 'Cafe & Tea Brand Owners',
      suppliers: [
        '<strong>40+ Specialty Coffee Roasters:</strong> Direct Robusta & Arabica estates from Da Lat & Buon Ma Thuot.',
        '<strong>Premium Tea Growers:</strong> Green, Oolong & Lotus organic teas with direct farm export.',
        '<strong>Espresso & Roasting Machinery:</strong> High-volume commercial espresso machines & smart grinders.',
        '<strong>Packaging & Syrups:</strong> Custom cups, biodegradable packaging, and artisan drink syrups.',
      ],
      roi: [
        '<strong>25% - 35% Cost Reduction:</strong> Bypass middlemen by securing direct export prices from Vietnamese roasters.',
        '<strong>Exclusive Brand Distribution:</strong> Opportunity to secure exclusive territorial rights for Cambodia.',
        '<strong>Menu Innovation:</strong> Discover 2026 trending beverage recipes & automated brewing tech.',
      ],
      sessions: [
        'VIP Access to Vietnam Cafe Show 2026 expo floor.',
        'Private Day 3 on-site coffee roasting factory inspection.',
        'Pre-arranged B2B supplier matchmaking table with trilingual interpreter.',
      ],
    },
    kh: {
      title: 'ម្ចាស់ហាងកាហ្វេ និង ប្រេនតែ',
      suppliers: [
        '<strong>រោងចក្រកិនកាហ្វេ 40+:</strong> ប្រភពគ្រាប់កាហ្វេ Robusta & Arabica ផ្ទាល់ពី Da Lat & Buon Ma Thuot។',
        '<strong>ចំការតែធម្មជាតិកម្រិតខ្ពស់:</strong> តែបៃតង តែអ៊ូឡុង និងតែផ្កាឈូកធម្មជាតិ នាំចេញផ្ទាល់ពីកសិដ្ឋាន។',
        '<strong>ម៉ាស៊ីនឆុង & កិនកាហ្វេ:</strong> ម៉ាស៊ីនឆុងកាហ្វេខ្នាតធំ និងបច្ចេកវិទ្យាកិនទំនើប។',
        '<strong>ការវេចខ្ចប់ & គ្រឿងផ្សំ:</strong> កែវម៉ាកផ្ទាល់ខ្លួន សម្ភារៈការពារបរិស្ថាន និងស៊ីរ៉ូរសជាតិពិសេស។',
      ],
      roi: [
        '<strong>កាត់បន្ថយថ្លៃដើម 25% - 35%:</strong> កាត់បន្ថយចំណាយដោយទិញផ្ទាល់ពីរោងចក្រនៅវៀតណាម។',
        '<strong>សិទ្ធិចែកចាយផ្តាច់មុខ:</strong> ឱកាសនាំចូល និងធ្វើជាតំណាងចែកចាយផ្តាច់មុខនៅកម្ពុជា។',
        '<strong>រូបមន្តភេសជ្ជៈថ្មីៗ 2026:</strong> រៀនសូត្រពីទម្រង់ភេសជ្ជៈកំពុងពេញនិយម និងបច្ចេកវិទ្យាឆុងស្វ័យប្រវត្តិ។',
      ],
      sessions: [
        'សំបុត្រ VIP ចូលទស្សនាពិព័រណ៍ Cafe Show Vietnam 2026 ពេញលេញ។',
        'ដំណើរទស្សនកិច្ចផ្ទាល់នៅរោងចក្រកែច្នៃកាហ្វេ នៅថ្ងៃទី 3។',
        'ការរៀបចំតុជួបពិភាក្សាធុរកិច្ច (B2B Matching) ជាមួយអ្នកបកប្រែផ្ទាល់។',
      ],
    },
  },
  tech: {
    en: {
      title: 'Smart City & Retail Tech Importers',
      suppliers: [
        '<strong>Smart Store Automation:</strong> Self-checkout kiosks, digital signage & automated cashier systems.',
        '<strong>IoT & Intelligent Lighting:</strong> Commercial sensor networks, architectural LED & smart metering.',
        '<strong>Security & Access Control:</strong> Facial recognition access, ANPR vehicle tracking & CCTV hardware.',
        '<strong>Cloud POS & Fleet Management:</strong> Scalable enterprise management hardware & logistics sensors.',
      ],
      roi: [
        '<strong>Direct OEM/ODM Pricing:</strong> Order factory-direct hardware customized with your Cambodian brand logo.',
        '<strong>Early Tech Adoption:</strong> Bring next-generation smart store concepts to the rapidly growing Cambodian market.',
        '<strong>Full Warranty & Parts Backing:</strong> Direct manufacturer SLA agreements for technical spare parts.',
      ],
      sessions: [
        'All-Access VIP Pass to Hanoi Smart City Expo 2026.',
        'Executive B2B meetings with smart infrastructure suppliers.',
        'Showcase of AI-driven store management & loss prevention hardware.',
      ],
    },
    kh: {
      title: 'អ្នកនាំចូលបច្ចេកវិទ្យា Smart City & ហាងឆ្លាតវៃ',
      suppliers: [
        '<strong>ប្រព័ន្ធស្វ័យប្រវត្តិកម្មហាង:</strong> ទូទូទាត់ប្រាក់ស្វ័យប្រវត្ត (Kiosk) និងប្រព័ន្ធគ្រប់គ្រងការលក់ POS។',
        '<strong>IoT & អំពូលឆ្លាតវៃ:</strong> បណ្តាញឧបករណ៍ចាប់សញ្ញា អំពូល LED ស្ថាបត្យកម្ម និងកុងទ័រឆ្លាតវៃ។',
        '<strong>ប្រព័ន្ធសុវត្ថិភាព & Access:</strong> ប្រព័ន្ធស្កេនមុខសុវត្ថិភាព កាមេរ៉ាចាប់ផ្លាកលេខ និង CCTV កម្រិតខ្ពស់។',
        '<strong>ផ្នែករឹងគ្រប់គ្រងឃ្លាំង:</strong> ឧបករណ៍តាមដានទំនិញ និងឧបករណ៍ឆ្លាតវៃសម្រាប់ភស្តុភារ។',
      ],
      roi: [
        '<strong>តម្លៃផ្ទាល់ពីរោងចក្រ OEM/ODM:</strong> បញ្ជាទិញផ្នែករឹងដោយដាក់ឡូហ្គោប្រេនផ្ទាល់ខ្លួនរបស់លោកអ្នក។',
        '<strong>នាំមុខទីផ្សារបច្ចេកវិទ្យា:</strong> នាំយកបច្ចេកវិទ្យាហាងឆ្លាតវៃជំនាន់ថ្មីមកកាន់ទីផ្សារកម្ពុជាមុនគេ។',
        '<strong>កិច្ចសន្យាធានាគ្រឿងបន្លាស់:</strong> កិច្ចព្រមព្រៀងផ្គត់ផ្គង់គ្រឿងបន្លាស់ និងការគាំទ្របច្ចេកទេសផ្ទាល់ពីរោងចក្រ។',
      ],
      sessions: [
        'សំបុត្រ VIP ចូលទស្សនាពិព័រណ៍ Smart City Expo 2026 នៅហាណូយ។',
        'ជំនួបពិភាក្សា B2B ជាមួយអ្នកផ្គត់ផ្គង់ហេដ្ឋារចនាសម្ព័ន្ធឆ្លាតវៃ។',
        'ទស្សនាការបង្ហាញដំណោះស្រាយ AI សម្រាប់គ្រប់គ្រងហាងលក់រាយ។',
      ],
    },
  },
  distributor: {
    en: {
      title: 'Wholesalers & Bulk Distributors',
      suppliers: [
        '<strong>Factory-Direct Wholesale:</strong> Multi-ton coffee beans, bulk tea bags, and beverage powders.',
        '<strong>Commercial Kitchenware:</strong> Stainless steel counters, ice makers, blenders & refrigeration.',
        '<strong>Private Label OEM Manufacturers:</strong> Fast-turnaround canning, bottling, and custom packaging.',
        '<strong>Vietnamese Heritage Brands:</strong> Well-established consumer food & beverage brands seeking export partners.',
      ],
      roi: [
        '<strong>Maximum Volume Margins:</strong> High-volume container pricing directly at export factory tier.',
        '<strong>Custom Packaging & Private Label:</strong> Print your own brand on certified export-grade products.',
        '<strong>Hassle-Free Cross-Border Logistics:</strong> Dedicated consultation on customs clearance, transport routes & tariffs.',
      ],
      sessions: [
        'Direct round-table talks with Vietnamese Export Association delegates.',
        'Private guided inspection of manufacturing floor and QC laboratory.',
        'Assistance with initial MOQ negotiations and sample shipment orders.',
      ],
    },
    kh: {
      title: 'អ្នកបោះដុំ និង ចែកចាយទំនិញខ្នាតធំ',
      suppliers: [
        '<strong>ការផ្គត់ផ្គង់បោះដុំផ្ទាល់:</strong> គ្រាប់កាហ្វេរាប់តោន កញ្ចប់តែខ្នាតធំ និងម្សៅភេសជ្ជៈគ្រប់ប្រភេទ។',
        '<strong>ឧបករណ៍ផ្ទះបាយពាណិជ្ជកម្ម:</strong> តុអ៊ីណុក ម៉ាស៊ីនផលិតទឹកកក ម៉ាស៊ីនក្រឡុក និងទូត្រជាក់ធំៗ។',
        '<strong>រោងចក្រ OEM ផលិតម៉ាកផ្ទាល់ខ្លួន:</strong> សេវាផលិតច្រកកំប៉ុង ច្រកដប និងវេចខ្ចប់តាមតម្រូវការ។',
        '<strong>ប្រេនល្បីៗនៅវៀតណាម:</strong> ផលិតផលចំណីអាហារ និងភេសជ្ជៈល្បីៗដែលកំពុងស្វែងរកដៃគូនាំចេញ។',
      ],
      roi: [
        '<strong>ប្រាក់ចំណេញខ្ពស់បំផុត:</strong> ទទួលបានតម្លៃបោះដុំកម្រិតទូកុងតឺន័រផ្ទាល់ពីរោងចក្រនាំចេញ។',
        '<strong>ផលិតម៉ាកផ្ទាល់ខ្លួន (Private Label):</strong> បោះពុម្ពម៉ាកយីហោផ្ទាល់ខ្លួនលើផលិតផលស្តង់ដារនាំចេញ។',
        '<strong>ការសម្រួលផ្នែកដឹកជញ្ជូន:</strong> ប្រឹក្សាយោបល់អំពីបែបបទគយ ការដឹកជញ្ជូនឆ្លងដែន និងពន្ធគយ។',
      ],
      sessions: [
        'កិច្ចពិភាក្សាជាមួយតំណាងសមាគមនាំចេញវៀតណាម។',
        'ដំណើរទស្សនកិច្ចត្រួតពិនិត្យខ្សែសង្វាក់ផលិតកម្ម និងបន្ទប់ពិសោធន៍គុណភាព (QC)។',
        'ការជួយសម្របសម្រួលចរចាបរិមាណបញ្ជាទិញអប្បបរមា (MOQ) និងការផ្ញើសំណាកគំរូ។',
      ],
    },
  },
};

const SEAT_TAG_POOL = [
  'PP Coffee Chain CEO', 'F&B Brand Owner', 'Beverage Importer',
  'Smart Kiosk Director', 'Tea Wholesale Buyer', 'Retail Tech Investor',
  'Cafe Franchisee', 'Espresso Tech Founder', 'Smart City Contractor',
  'Logistics Wholesaler', 'Tea Leaf Distributor', 'Roastery Operator',
  'Store POS Integrator', 'Hotel F&B Director', 'Packaging Importer',
  'Automated Retail Tech', 'Food Chain Investor', 'Specialty Coffee Founder',
  'Franchise Investor',
];

// Hero slides — same order as old HTML
const HERO_SLIDES = [
  '/photos/photo_2026-09-16_22-01-09 (2).jpg',
  '/photos/photo_2026-09-16_22-01-09 (7).jpg',
  '/photos/photo_2026-09-16_22-01-09 (4).jpg',
  '/photos/photo_2026-09-16_22-01-09 (6).jpg',
  '/photos/photo_2026-09-16_22-01-09 (11).jpg',
  '/photos/photo_2026-09-16_22-01-09 (9).jpg',
];

const GALLERY_ITEMS = [
  { src: '/photos/photo_2026-09-16_22-01-09 (2).jpg', alt: 'Vietnam Cafe Show & Tea Expo', badge: 'Hanoi Cafe Culture' },
  { src: '/photos/photo_2026-09-16_22-01-09 (4).jpg', alt: 'Private VIP Coach Interior', badge: 'Private VIP Coach' },
  { src: '/photos/photo_2026-09-16_22-01-09 (7).jpg', alt: 'UNESCO Halong Bay Cruise', badge: 'Halong Bay Cruise' },
  { src: '/photos/photo_2026-09-16_22-01-09 (6).jpg', alt: 'Sung Sot Cave Halong Bay', badge: 'Sung Sot Cave' },
  { src: '/photos/photo_2026-09-16_22-01-09 (11).jpg', alt: 'Hanoi Old Quarter', badge: 'Hanoi Old Quarter' },
  { src: '/photos/photo_2026-09-16_22-01-09 (9).jpg', alt: 'Hoan Kiem Lake Hanoi', badge: 'Hoan Kiem Lake' },
  { src: '/photos/photo_2026-09-16_22-01-09 (3).jpg', alt: 'VIP Limousine Coach', badge: 'VIP Limousine Coach' },
  { src: '/photos/photo_2026-09-16_22-01-09 (8).jpg', alt: 'One Pillar Pagoda Hanoi', badge: 'One Pillar Pagoda' },
];

// SVG icons map
const ICONS: Record<string, React.ReactNode> = {
  chart: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  shield: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v6c0 5.55 3.84 10.74 8 12z"/><path d="M9 12l2 2 4-4"/></svg>,
  trophy: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M17 5h3a2 2 0 0 1 0 4h-3M7 5H4a2 2 0 0 0 0 4h3"/></svg>,
  zap: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 13 10 13 2"/></svg>,
  'trend-down': <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  chat: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  search: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  cpu: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="6" height="6"/><path d="M9 1H5a4 4 0 0 0-4 4v4M15 1h4a4 4 0 0 1 4 4v4M9 23H5a4 4 0 0 1-4-4v-4M15 23h4a4 4 0 0 0 4-4v-4"/></svg>,
  coffee: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  truck: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  users: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  telegram: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .27z"/></svg>,
  lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  arrow: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  check: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>,
  down: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>,
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>,
};

const TG_ICON = (size = 30) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .27z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SmartCityLandingPageView() {
  const [lang, setLang] = useState<'en' | 'kh'>('en');
  const [heroSlide, setHeroSlide] = useState(0);
  const [activeItinTab, setActiveItinTab] = useState(0);
  const [activeMatchProfile, setActiveMatchProfile] = useState<'cafe' | 'tech' | 'distributor'>('cafe');
  const [selectedSeat, setSelectedSeat] = useState(20);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [countdown, setCountdown] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const [isEarlyBird, setIsEarlyBird] = useState(true);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regProfile, setRegProfile] = useState('Cafe & Tea Business');
  const [regSeat, setRegSeat] = useState(20);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successSeat, setSuccessSeat] = useState(20);
  const [localClaimed, setLocalClaimed] = useState(GENERAL.claimedSeats);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});

  // ── Restore saved language & capture UTMs on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('khb_lang');
      if (savedLang === 'kh' || savedLang === 'en') {
        setLang(savedLang);
      }
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'ttclid'].forEach(k => {
        const v = params.get(k);
        if (v) utm[k] = v;
      });
      setUtmParams(utm);
    } catch { /* silent */ }
  }, []);

  const c = CONTENT[lang];
  const tgUrl = GENERAL.contactTelegramUrl;

  // ── Hero slider
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide(s => (s + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // ── Countdown
  useEffect(() => {
    const earlyDeadline = new Date(GENERAL.earlyBirdDeadline).getTime();
    const regDeadline = new Date(GENERAL.registrationDeadline).getTime();
    function tick() {
      const now = Date.now();
      const early = earlyDeadline > now;
      setIsEarlyBird(early);
      const target = early ? earlyDeadline : regDeadline;
      const diff = Math.max(0, target - now);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({
        d: String(d).padStart(2, '0'),
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      });
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Language toggle with persistence
  const switchLang = (l: 'en' | 'kh') => {
    setLang(l);
    try { localStorage.setItem('khb_lang', l); } catch {}
  };

  // ── Seat select
  const handleSeatClick = (n: number) => {
    if (n <= localClaimed) return;
    setSelectedSeat(n);
    setRegSeat(n);
    setTimeout(() => {
      document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ── Matchmaker profile pick → scroll to form
  const chooseProfile = (key: 'cafe' | 'tech' | 'distributor') => {
    setActiveMatchProfile(key);
    const profileMap: Record<string, string> = {
      cafe: 'Cafe & Tea Business',
      tech: 'Smart City & Retail Tech',
      distributor: 'Wholesale & Distribution',
    };
    setRegProfile(profileMap[key] || 'Cafe & Tea Business');
    setTimeout(() => {
      document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ── Form submit with UTM attribution
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regName.trim(),
          phone: regPhone.trim(),
          message: `Seat #${regSeat} | Profile: ${regProfile}`,
          packageInterest: isEarlyBird ? `Early Bird $${GENERAL.earlyBirdPrice}` : `Standard $${GENERAL.regularPrice}`,
          landingPageSlug: 'smart-city-tea-cafe',
          landingPageTitle: 'Smart City, Tea & Cafe Business Trip to Vietnam 2026',
          source: 'landing_page',
          customFields: { seat: String(regSeat), profile: regProfile },
          utmSource: utmParams.utm_source,
          utmMedium: utmParams.utm_medium,
          utmCampaign: utmParams.utm_campaign,
          utmContent: utmParams.utm_content,
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessSeat(regSeat);
        setSubmitted(true);
        setLocalClaimed(prev => Math.min(prev + 1, 30));
      } else {
        alert(result.error || 'Submission failed. Please try again.');
      }
    } catch {
      alert('Network error. Please try again or chat with us on Telegram.');
    } finally {
      setSubmitting(false);
    }
  };

  // Pass name display
  const passName = regName.trim() ? regName.toUpperCase() : (lang === 'kh' ? c.passGuest : 'GUEST DELEGATE');

  // Available seats for dropdown
  const availableSeats = Array.from({ length: 30 }, (_, i) => i + 1).filter(n => n > localClaimed);

  // Telegram msg for concierge
  const tgMsg = encodeURIComponent(`Hello KHB Events, I want to reserve Seat #${regSeat} for the Vietnam Delegation 2026. My name is ${regName.trim() || 'Guest'}.`);
  const tgConciergeUrl = `${tgUrl}?text=${tgMsg}`;

  return (
    <div className={`smart-city-landing${lang === 'kh' ? ' lang-kh' : ''}`}>

      {/* ═══════════════════════════════════════════════
          STICKY URGENCY BAR
      ═══════════════════════════════════════════════ */}
      <div className="urgency-bar">
        <div className="container urgency-inner">
          <span className="urgency-fire">🔥</span>
          <span className="urgency-msg">{c.earlyBirdNotice}</span>
          <span className="urgency-countdown" aria-hidden="true">
            <b>{countdown.d}</b>d&nbsp;<b>{countdown.h}</b>h&nbsp;<b>{countdown.m}</b>m&nbsp;<b>{countdown.s}</b>s
          </span>
          <a href="#register" className="urgency-cta">Claim $499 →</a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════ */}
      <header className="site-header">
        <div className="container navbar">
          <a href="#" className="brand-logo">
            <img src="/images/khb-logo.png" alt="KHB EVENTS" className="logo-img" width={163} height={40} />
          </a>
          <ul className="nav-links">
            <li><a href="#problem" className="nav-link">{c.navWhy}</a></li>
            <li><a href="#value" className="nav-link">{c.navPackage}</a></li>
            <li><a href="#itinerary" className="nav-link">{c.navItinerary}</a></li>
            <li><a href="#seats" className="nav-link">{c.navSeats}</a></li>
            <li><a href="#pricing" className="nav-link">{c.navPricing}</a></li>
            <li><a href="#faq" className="nav-link">{c.navFaq}</a></li>
          </ul>
          <div className="nav-actions">
            <a href="/smart-city-tea-cafe/app" className="btn-app-chip" title="Switch to Mobile App View" style={{ fontSize: '0.8rem', padding: '6px 12px', border: '1px solid var(--border-subtle)', borderRadius: '999px', textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
              📱 App View
            </a>
            <div className="lang-switcher">
              <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => switchLang('en')} title="English">EN</button>
              <button className={`lang-btn${lang === 'kh' ? ' active' : ''}`} onClick={() => switchLang('kh')} title="ភាសាខ្មែរ">ខ្មែរ</button>
            </div>
            <a href="#register" className="btn-nav-cta">{c.navCta}</a>
            <button className="mobile-nav-toggle" onClick={() => setDrawerOpen(true)} aria-label="Toggle navigation">☰</button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer-backdrop${drawerOpen ? ' active' : ''}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`mobile-nav-drawer${drawerOpen ? ' active' : ''}`} aria-label="Mobile Navigation">
        <div className="mobile-drawer-header">
          <div className="brand-logo">
            <img src="/images/khb-logo.png" alt="KHB EVENTS" className="logo-img" width={163} height={40} />
          </div>
          <button className="btn-close-drawer" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">✕</button>
        </div>
        <ul className="mobile-drawer-links">
          <li><a href="#problem" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navWhy}</a></li>
          <li><a href="#value" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navPackage}</a></li>
          <li><a href="#itinerary" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navItinerary}</a></li>
          <li><a href="#seats" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navSeats}</a></li>
          <li><a href="#pricing" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navPricing}</a></li>
          <li><a href="#faq" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navFaq}</a></li>
          <li><a href="/smart-city-tea-cafe/app" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>📱 Mobile Native App</a></li>
          <li><a href="/smart-city-tea-cafe/optin" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>⚡ Fast 30s Opt-in</a></li>
          <li><a href="#register" className="mobile-drawer-link highlight" onClick={() => setDrawerOpen(false)}>{c.navCtaMobile}</a></li>
        </ul>
        <div className="mobile-drawer-footer">
          <a href={tgUrl} target="_blank" rel="noreferrer" className="btn-drawer-tg">
            {TG_ICON(18)}<span>Telegram VIP Concierge</span>
          </a>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════ */}
      <section className="hero-section" id="overview">
        <div className="hero-slider">
          {HERO_SLIDES.map((src, i) => (
            <div key={i} className={`hero-slide${heroSlide === i ? ' active' : ''}`} style={{ backgroundImage: `url('${src}')` }} />
          ))}
        </div>
        <div className="hero-overlay" />
        <div className="hero-slider-dots">
          {HERO_SLIDES.map((_, i) => (
            <span key={i} className={`hero-dot${heroSlide === i ? ' active' : ''}`} onClick={() => setHeroSlide(i)} />
          ))}
        </div>
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            <span>{c.badge}</span>
          </div>
          <h1 className="hero-title">{c.heroTitle}</h1>
          <p className="hero-headline-sub">{c.heroHeadlineHighlight}</p>
          <p className="hero-subtitle">{c.heroSubtitle}</p>

          <div className="hero-cta-group">
            <a href="#core-value" className="btn-primary-hero">
              {ICONS.plus}
              <span>{c.heroCtaDiscover}</span>
            </a>
          </div>
          <a href="#register" className="hero-skip-link">{c.heroSkipLink}</a>
          <div className="hero-risk-note">
            {ICONS.check}
            <span>{c.heroRiskNote}</span>
          </div>

          <div className="hero-pills-grid">
            <div className="hero-pill"><span className="hero-pill-icon">📅</span><span>{c.pillDate}</span></div>
            <div className="hero-pill"><span className="hero-pill-icon">📍</span><span>{c.pillDest}</span></div>
            <div className="hero-pill"><span className="hero-pill-icon">🏢</span><span>{c.pillExpos}</span></div>
            <div className="hero-pill"><span className="hero-pill-icon">🚢</span><span>{c.pillCruise}</span></div>
            <div className="hero-pill highlight-pill"><span className="hero-pill-icon">👥</span><span>{c.pillSeats}</span></div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CORE VALUE
      ═══════════════════════════════════════════════ */}
      <section className="section-padding core-value-section" id="core-value">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{c.coreValueTag}</span>
            <h2 className="section-title">{c.coreValueTitle}</h2>
            <p className="section-subtitle">{c.coreValueSubtitle}</p>
          </div>
          <div className="core-grid">
            {c.coreValues.map(v => (
              <div className="core-card" key={v.num}>
                <div className="core-card-num">{v.num}</div>
                <div className="core-icon-box">{ICONS[v.icon]}</div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
          <div className="core-bridge">
            {ICONS.down}
            <span>{c.coreValueBridge}</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SOCIAL PROOF STRIP
      ═══════════════════════════════════════════════ */}
      <section className="proof-strip-section">
        <div className="container proof-strip-inner">
          <div className="avatar-stack">
            {['DS', 'ST', 'VK', 'MR', 'KL'].map((init, i) => (
              <div key={i} className="avatar-chip" style={{ zIndex: 5 - i }}>{init}</div>
            ))}
          </div>
          <div className="proof-copy">
            <strong>{localClaimed}</strong>
            <span>{c.proofStripText}</span>
          </div>
          <div className="proof-tags">
            {c.proofStripTags.map((tag, i) => (
              <span key={i} className="proof-tag">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════════════ */}
      <section className="stats-section">
        <div className="container stats-grid">
          {c.statsStrip.map((s, i) => (
            <div key={i} className="stats-card">
              <div className="stats-value">{s.value}</div>
              <div className="stats-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PROBLEM → SOLUTION
      ═══════════════════════════════════════════════ */}
      <section className="section-padding problem-section" id="problem">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{c.problemTag}</span>
            <h2 className="section-title">{c.problemTitle}</h2>
            <p className="section-subtitle">{c.problemSubtitle}</p>
          </div>
          <div className="problem-grid">
            {c.problems.map((p, i) => (
              <div key={i} className="problem-card">
                <div className="problem-icon-box">{ICONS[p.icon]}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="solution-bridge">
            <div className="bridge-icon">🤝</div>
            <p>{c.solutionBridge}</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          WHO SHOULD JOIN
      ═══════════════════════════════════════════════ */}
      <section className="section-padding audience-section" id="audience">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Target Participants</span>
            <h2 className="section-title">{c.audienceSecTitle}</h2>
            <p className="section-subtitle">{c.audienceSecSub}</p>
          </div>
          <div className="audience-grid">
            {c.audiences.map((a, i) => (
              <div key={i} className="audience-card">
                <div className="audience-card-icon">{ICONS[a.icon]}</div>
                <div className="audience-card-title">{a.title}</div>
                <div className="audience-card-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          VALUE STACK
      ═══════════════════════════════════════════════ */}
      <section className="section-padding value-section" id="value">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{c.valueStackTag}</span>
            <h2 className="section-title">{c.valueStackTitle}</h2>
            <p className="section-subtitle">{c.valueStackSubtitle}</p>
          </div>
          <div className="value-grid">
            <div className="value-list">
              {c.inclusions.map((item, idx) => (
                <div key={item.id} className="value-item">
                  <div className="value-badge-num">{item.id}</div>
                  <div className="value-item-details">
                    <h4 className="value-item-title">{item.title}</h4>
                    <p className="value-item-desc">{item.desc}</p>
                  </div>
                  <div className="value-item-value">${CONTENT.en.valueStackPrices[idx]}</div>
                </div>
              ))}
            </div>
            <aside className="value-total-card">
              <div className="value-total-note">{c.valueStackNote}</div>
              <div className="value-total-row">
                <span className="value-total-label">{c.valueStackTotalLabel}</span>
                <span className="value-total-amount">{c.valueStackTotalValue}</span>
              </div>
              <div className="value-divider" />
              <div className="value-total-row pay">
                <span className="value-total-label">{c.valueStackPayLabel}</span>
                <div className="value-total-price">
                  <span className="price-currency-sm">$</span>
                  <span>{GENERAL.earlyBirdPrice}</span>
                </div>
              </div>
              <a href="#register" className="btn-value-cta">{c.valueCtaBtn}</a>
              <div className="value-cta-sub">{c.heroRiskNote}</div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ROI MATCHMAKER
      ═══════════════════════════════════════════════ */}
      <section className="section-padding matchmaker-section" id="matchmaker">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{c.matchmakerTag}</span>
            <h2 className="section-title">{c.matchmakerTitle}</h2>
            <p className="section-subtitle">{c.matchmakerSub}</p>
          </div>
          <div className="matchmaker-tabs">
            <button className={`match-tab-btn${activeMatchProfile === 'cafe' ? ' active' : ''}`} onClick={() => setActiveMatchProfile('cafe')}>
              <span className="tab-icon">☕</span>
              <span className="tab-title">Cafe &amp; Tea Brand Owners</span>
            </button>
            <button className={`match-tab-btn${activeMatchProfile === 'tech' ? ' active' : ''}`} onClick={() => setActiveMatchProfile('tech')}>
              <span className="tab-icon">🏙️</span>
              <span className="tab-title">Smart City &amp; Retail Tech</span>
            </button>
            <button className={`match-tab-btn${activeMatchProfile === 'distributor' ? ' active' : ''}`} onClick={() => setActiveMatchProfile('distributor')}>
              <span className="tab-icon">🏭</span>
              <span className="tab-title">Wholesalers &amp; Distributors</span>
            </button>
          </div>
          <div className="matchmaker-display-card">
            {(() => {
              const profile = MATCHMAKER_DATA[activeMatchProfile][lang];
              return (
                <>
                  <div className="matchmaker-grid">
                    <div className="match-col">
                      <div className="match-col-header">
                        <div className="match-col-icon">🏭</div>
                        <div className="match-col-title">{c.matchSuppliersTitle}</div>
                      </div>
                      <ul className="match-item-list">
                        {profile.suppliers.map((item, i) => (
                          <li key={i}><span>✓</span><div dangerouslySetInnerHTML={{ __html: item }} /></li>
                        ))}
                      </ul>
                    </div>
                    <div className="match-col">
                      <div className="match-col-header">
                        <div className="match-col-icon">📈</div>
                        <div className="match-col-title">{c.matchRoiTitle}</div>
                      </div>
                      <ul className="match-item-list">
                        {profile.roi.map((item, i) => (
                          <li key={i}><span>⚡</span><div dangerouslySetInnerHTML={{ __html: item }} /></li>
                        ))}
                      </ul>
                    </div>
                    <div className="match-col">
                      <div className="match-col-header">
                        <div className="match-col-icon">🤝</div>
                        <div className="match-col-title">{c.matchSessionsTitle}</div>
                      </div>
                      <ul className="match-item-list">
                        {profile.sessions.map((item, i) => (
                          <li key={i}><span>🎯</span><div>{item}</div></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="matchmaker-cta-bar">
                    <div className="matchmaker-cta-text" dangerouslySetInnerHTML={{ __html: c.ctaBarText(profile.title) }} />
                    <button className="btn-select-profile" onClick={() => chooseProfile(activeMatchProfile)}>
                      <span>{c.matchCtaBtn}</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ITINERARY + GALLERY
      ═══════════════════════════════════════════════ */}
      <section className="section-padding" id="itinerary">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Agenda &amp; Visual Experience</span>
            <h2 className="section-title">{c.itineraryTitle}</h2>
            <p className="section-subtitle">{c.itinerarySubtitle}</p>
          </div>

          {/* Gallery banner */}
          <div className="photo-gallery-banner">
            <div className="gallery-track">
              {[...GALLERY_ITEMS, ...GALLERY_ITEMS].map((item, i) => (
                <div key={i} className="gallery-item">
                  <img src={item.src} alt={item.alt} width={400} height={240} loading="lazy" decoding="async" />
                  <div className="gallery-badge">{item.badge}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Itinerary tabs */}
          <div className="itinerary-tabs-nav">
            {c.itinerary.map((day, idx) => (
              <button key={idx} className={`itinerary-tab-btn${activeItinTab === idx ? ' active' : ''}`} onClick={() => setActiveItinTab(idx)}>
                <span className="tab-day-badge">Day {day.day}</span>
                <span>{day.date}</span>
              </button>
            ))}
          </div>
          <div className="itinerary-cards-container">
            {c.itinerary.map((day, idx) => (
              <div key={idx} className={`itinerary-day-card${activeItinTab === idx ? ' active' : ''}`}>
                <div className="day-card-header">
                  <div className="day-title-wrap">
                    <span className="day-date-tag">{day.date}</span>
                    <h3>{day.title}</h3>
                  </div>
                </div>
                <div className="timeline-events-list">
                  {day.events.map((ev, ei) => (
                    <div key={ei} className="timeline-event-item">
                      <span className="event-time-badge">{ev.time}</span>
                      <div className="event-activity-text">{ev.activity}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          30-SEAT CABIN BOARD
      ═══════════════════════════════════════════════ */}
      <section className="section-padding seat-board-section" id="seats">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Executive Seat Allocation</span>
            <h2 className="section-title">{c.seatTitle}</h2>
            <p className="section-subtitle">{c.seatSubtitle}</p>
          </div>
          <div className="seat-board-card">
            <div className="seat-board-header">
              <div className="seat-board-stats">
                <div className="stat-pill reserved-stat">
                  <span className="stat-dot reserved-dot" />
                  <span>{localClaimed} {c.seatReservedTxt}</span>
                </div>
                <div className="stat-pill available-stat">
                  <span className="stat-dot available-dot" />
                  <span>{30 - localClaimed} {c.seatAvailableTxt}</span>
                </div>
              </div>
              <div className="seat-legend">
                <span className="legend-item"><span className="legend-box reserved" /> <span>{c.seatLegendBooked}</span></span>
                <span className="legend-item"><span className="legend-box available" /> <span>{c.seatLegendAvailable}</span></span>
                <span className="legend-item"><span className="legend-box selected" /> <span>{c.seatLegendSelected}</span></span>
              </div>
            </div>
            <div className="seats-grid-cabin">
              {Array.from({ length: 30 }, (_, i) => i + 1).map(n => {
                const isReserved = n <= localClaimed;
                const isSelected = !isReserved && n === selectedSeat;
                const cls = `cabin-seat ${isReserved ? 'reserved' : isSelected ? 'available selected' : 'available'}`;
                const lbl = isReserved
                  ? (n <= GENERAL.claimedSeats ? SEAT_TAG_POOL[(n - 1) % SEAT_TAG_POOL.length] : c.reservedLabel)
                  : isSelected ? c.selectedLabel : c.availableLabel;
                return (
                  <div key={n} className={cls} onClick={() => handleSeatClick(n)}
                    title={isReserved ? c.bookedSeat(n) : `${c.clickSeat}${n}`}>
                    <div className="seat-num">#{String(n).padStart(2, '0')}</div>
                    <div className="seat-tag">{lbl}</div>
                  </div>
                );
              })}
            </div>
            <div className="seat-selection-prompt" dangerouslySetInnerHTML={{ __html: c.seatBanner(selectedSeat) }} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <section className="section-padding testimonials-section" id="testimonials">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">{c.testimonialsTag}</span>
            <h2 className="section-title">{c.testimonialsTitle}</h2>
            <p className="section-subtitle">{c.testimonialsSubtitle}</p>
          </div>
          <div className="testimonials-grid">
            {c.testimonials.map((t, i) => {
              const initials = t.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('');
              return (
                <div key={i} className="testimonial-card">
                  <div className="testimonial-stars">★★★★★</div>
                  <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{initials}</div>
                    <div>
                      <div className="testimonial-name">{t.name}</div>
                      <div className="testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════ */}
      <section className="section-padding pricing-section" id="pricing">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Investment</span>
            <h2 className="section-title">{c.pricingTitle}</h2>
            <p className="section-subtitle">{c.pricingSubtitle}</p>
          </div>
          <div className="pricing-cards-grid">
            {/* Early Bird */}
            <div className="pricing-card featured">
              <div className="pricing-card-badge">{c.earlyBirdBadge}</div>
              <div className="pricing-plan-name">{c.earlyBirdPlanName}</div>
              <div className="pricing-price-wrap">
                <span className="price-currency">$</span>
                <span className="price-amount">{GENERAL.earlyBirdPrice}</span>
                <span className="price-unit">/ person</span>
              </div>
              <div className="pricing-deadline-tag">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Valid until Sept 8, 2026 — then ${GENERAL.regularPrice}</span>
              </div>
              <ul className="pricing-features-list">
                <li className="pricing-feature-item"><i>✓</i> Roundtrip Flight (Phnom Penh - Hanoi)</li>
                <li className="pricing-feature-item"><i>✓</i> 3 Nights Hotel Stay (Twin Sharing)</li>
                <li className="pricing-feature-item"><i>✓</i> All 2 International Expos VIP Passes</li>
                <li className="pricing-feature-item"><i>✓</i> Direct Factory &amp; Wholesale Visits</li>
                <li className="pricing-feature-item"><i>✓</i> UNESCO Halong Bay Cruise + Lunch</li>
                <li className="pricing-feature-item"><i>✓</i> Trilingual Guide (Khmer/Eng/Viet)</li>
              </ul>
              <a href="#register" className="btn-pricing-cta">Lock In ${GENERAL.earlyBirdPrice} Early Bird Rate</a>
              <div className="pricing-secure-note">No payment today • Pay after confirmation call</div>
            </div>
            {/* Regular */}
            <div className="pricing-card">
              <div className="pricing-plan-name">{c.regularPlanName}</div>
              <div className="pricing-price-wrap">
                <span className="price-currency">$</span>
                <span className="price-amount">{GENERAL.regularPrice}</span>
                <span className="price-unit">/ person</span>
              </div>
              <div className="pricing-deadline-tag">
                <span>After Sept 8, 2026 (Subject to seat limits)</span>
              </div>
              <ul className="pricing-features-list">
                <li className="pricing-feature-item"><i>✓</i> Roundtrip Flight (Phnom Penh - Hanoi)</li>
                <li className="pricing-feature-item"><i>✓</i> 3 Nights Hotel Stay (Twin Sharing)</li>
                <li className="pricing-feature-item"><i>✓</i> All 2 International Expos VIP Passes</li>
                <li className="pricing-feature-item"><i>✓</i> Direct Factory &amp; Wholesale Visits</li>
                <li className="pricing-feature-item"><i>✓</i> UNESCO Halong Bay Cruise + Lunch</li>
                <li className="pricing-feature-item"><i>✓</i> Trilingual Guide (Khmer/Eng/Viet)</li>
              </ul>
              <a href="#register" className="pricing-alt-link">Register Standard Seat →</a>
            </div>
          </div>

          {/* Countdown card */}
          <div className="pricing-countdown-card">
            <div className="countdown-icon-box">⏱️</div>
            <div className="countdown-text-group">
              <div className="countdown-text-title">{isEarlyBird ? c.earlyBirdLabel : c.regDeadline}</div>
              <div className="countdown-text-sub">{isEarlyBird ? c.earlyBirdSub : c.regDeadlineSub}</div>
            </div>
            <div className="countdown-timer-units">
              <div className="time-unit-box"><div className="time-value">{countdown.d}</div><div className="time-label">Days</div></div>
              <span className="time-colon">:</span>
              <div className="time-unit-box"><div className="time-value">{countdown.h}</div><div className="time-label">Hours</div></div>
              <span className="time-colon">:</span>
              <div className="time-unit-box"><div className="time-value">{countdown.m}</div><div className="time-label">Mins</div></div>
              <span className="time-colon">:</span>
              <div className="time-unit-box"><div className="time-value">{countdown.s}</div><div className="time-label">Secs</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          STEPS + GUARANTEE
      ═══════════════════════════════════════════════ */}
      <section className="section-padding steps-section" id="steps">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Zero-Risk Reservation</span>
            <h2 className="section-title">{c.stepsTitle}</h2>
            <p className="section-subtitle">{c.stepsSubtitle}</p>
          </div>
          <div className="steps-grid">
            {c.steps.map(s => (
              <div key={s.num} className="step-card">
                <div className="step-num-badge">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="guarantee-card">
            <div className="guarantee-icon">🛡️</div>
            <div className="guarantee-body">
              <h3>{c.guaranteeTitle}</h3>
              <p>{c.guaranteeText}</p>
              <ul className="guarantee-points">
                {c.guaranteePoints.map((pt, i) => <li key={i}>{pt}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          REGISTRATION — Live VIP Pass + Form
      ═══════════════════════════════════════════════ */}
      <section className="section-padding registration-section" id="register">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Priority Reservation</span>
            <h2 className="section-title">{c.registrationSectionTitle}</h2>
            <p className="section-subtitle">{c.registrationSectionSubtitle}</p>
          </div>
          <div className="boarding-pass-experience-grid">
            {/* Live VIP Pass */}
            <div className="pass-preview-column">
              <div className="pass-card-label">Live Pass Preview</div>
              <div className="boarding-pass-card">
                <div className="pass-header">
                  <div className="pass-brand">
                    <span className="pass-logo-badge">KHB</span>
                    <div>
                      <div className="pass-brand-title">KHB BUSINESS DELEGATION</div>
                      <div className="pass-brand-sub">{c.passBrandSub}</div>
                    </div>
                  </div>
                  <div className="pass-tier-badge">{c.passTier}</div>
                </div>
                <div className="pass-route-row">
                  <div className="route-point">
                    <div className="city-code">PNH</div>
                    <div className="city-name">{c.passFrom}</div>
                  </div>
                  <div className="route-flight-graphic">
                    <span className="plane-icon">✈</span>
                    <span className="flight-line" />
                    <span className="flight-tag">{c.passRouteDate}</span>
                  </div>
                  <div className="route-point">
                    <div className="city-code">HAN</div>
                    <div className="city-name">{c.passTo}</div>
                  </div>
                </div>
                <div className="pass-details-grid">
                  <div className="pass-data-item">
                    <div className="data-label">{c.passNameLabel}</div>
                    <div className="data-val">{passName}</div>
                  </div>
                  <div className="pass-data-item">
                    <div className="data-label">{c.passSeatLabel}</div>
                    <div className="data-val highlight-val">SEAT #{regSeat}</div>
                  </div>
                  <div className="pass-data-item">
                    <div className="data-label">{c.passIndustryLabel}</div>
                    <div className="data-val">{regProfile}</div>
                  </div>
                  <div className="pass-data-item">
                    <div className="data-label">{c.passRateLabel}</div>
                    <div className="data-val gold-val">{c.passRateValue}</div>
                  </div>
                </div>
                <div className="pass-footer-barcode">
                  <div className="barcode-lines" />
                  <div className="pass-security-seal"><span>✓ KHB VERIFIED</span></div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="pass-form-column">
              <div className="reg-form-card">
                <div className="option-badge badge-form">Instant Reservation</div>
                <h3 className="reg-form-title">{c.option2Title}</h3>
                <p className="reg-form-desc">{c.option2Desc}</p>

                {!submitted ? (
                  <form className="fast-reg-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label className="form-label">{c.formNameLabel}</label>
                      <div className="input-with-icon">
                        <span className="input-icon">👤</span>
                        <input type="text" className="form-input" placeholder={c.formNamePlaceholder}
                          value={regName} onChange={e => setRegName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{c.formPhoneLabel}</label>
                      <div className="input-with-icon">
                        <span className="input-icon">📞</span>
                        <input type="tel" className="form-input" placeholder={c.formPhonePlaceholder}
                          value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
                      </div>
                    </div>
                    <div className="form-row-two">
                      <div className="form-group">
                        <label className="form-label">Business Focus</label>
                        <select className="form-input form-select" value={regProfile} onChange={e => setRegProfile(e.target.value)}>
                          <option value="Cafe & Tea Business">Cafe &amp; Tea Brand</option>
                          <option value="Smart City & Retail Tech">Smart City / Tech</option>
                          <option value="Wholesale & Distribution">Wholesaler / Importer</option>
                          <option value="F&B Entrepreneur">F&amp;B Investor</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Assigned Seat</label>
                        <select className="form-input form-select" value={regSeat}
                          onChange={e => { const v = Number(e.target.value); setRegSeat(v); setSelectedSeat(v); }}>
                          {availableSeats.map(n => (
                            <option key={n} value={n}>Seat #{n} ({c.availableLabel})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn-submit-form" disabled={submitting}>
                      {ICONS.arrow}
                      <span>{submitting ? c.formSubmitting : c.formSubmitBtn}</span>
                    </button>
                    <div className="form-secure-note">
                      {ICONS.lock}
                      <span>No instant payment required • Official invoice sent via Telegram</span>
                    </div>
                  </form>
                ) : (
                  <div className="form-success-state" style={{ display: 'block' }}>
                    <div className="success-icon-circle">✓</div>
                    <h4 className="success-title">{c.formSuccessTitle}</h4>
                    <p className="success-desc"><span>{c.formSuccessDesc}</span></p>
                    <div className="success-pass-badge">Seat #{successSeat} Held</div>
                    <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>{c.formSuccessTelegramPrompt}</p>
                    <a href={tgUrl} target="_blank" rel="noreferrer" className="btn-secondary-telegram">
                      {TG_ICON(18)}<span>Confirm VIP Pass with Trip Coordinator</span>
                    </a>
                  </div>
                )}

                {/* Telegram alt */}
                {!submitted && (
                  <div className="direct-telegram-box">
                    <div className="tg-divider"><span>OR CHAT DIRECTLY</span></div>
                    <a href={tgConciergeUrl} target="_blank" rel="noreferrer" className="btn-telegram-direct">
                      {TG_ICON(20)}<span>Telegram VIP Concierge Direct Chat</span>
                    </a>
                    <div className="tg-highlight">{c.option1Highlight}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════ */}
      <section className="section-padding faq-section" id="faq">
        <div className="container faq-container">
          <div className="section-header">
            <span className="section-tag">{c.faqTag}</span>
            <h2 className="section-title">{c.faqTitle}</h2>
            <p className="section-subtitle">{c.faqSubtitle}</p>
          </div>
          <div className="faq-list">
            {c.faqs.map((item, idx) => (
              <div key={idx} className={`faq-item${openFaq === idx ? ' open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  <span>{item.q}</span>
                  <span className="faq-chevron">▾</span>
                </button>
                <div className="faq-answer">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════ */}
      <section className="final-cta-section" id="final-cta">
        <div className="container final-cta-inner">
          <div className="final-cta-badge">🔥 {c.heroPriceAnchorNote}</div>
          <h2 className="final-cta-title">{c.ctaTitle}</h2>
          <p className="final-cta-sub">{c.ctaSub}</p>
          <a href="#register" className="btn-final-cta">{c.finalCtaBtn}</a>
          <div className="final-cta-risk">{c.heroRiskNote}</div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          ORGANIZER TRUST
      ═══════════════════════════════════════════════ */}
      <section className="section-padding trust-section">
        <div className="container">
          <div className="trust-card">
            <div className="trust-info">
              <h3>{c.trustTitle}</h3>
              <p>{c.trustDesc}</p>
            </div>
            <div className="trust-contacts">
              <a href={`tel:${GENERAL.contactPhone.replace(/\s/g, '')}`} className="trust-contact-pill">
                <span>📞 Hotline: {GENERAL.contactPhone}</span>
              </a>
              <a href={tgUrl} target="_blank" rel="noreferrer" className="trust-contact-pill">
                <span>✈️ Telegram: @{GENERAL.contactTelegramUsername}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="site-footer">
        <div className="container footer-content">
          <div>{c.footerText}</div>
          <ul className="footer-links">
            <li><a href="#value">9-in-1 Package</a></li>
            <li><a href="#itinerary">Itinerary</a></li>
            <li><a href="#seats">Seat Chart</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="/smart-city-tea-cafe/app">Mobile App Shell</a></li>
            <li><a href="/smart-city-tea-cafe/optin">Fast Opt-in</a></li>
            <li><a href="/admin">Organizer CMS</a></li>
          </ul>
        </div>
      </footer>

      {/* Floating Telegram Button */}
      <a href={tgUrl} target="_blank" rel="noreferrer" className="floating-telegram-btn" title="Quick Inquiry on Telegram" aria-label="Chat with KHB EVENTS on Telegram">
        {TG_ICON(30)}
      </a>

      {/* Mobile Sticky Bar */}
      <div className="mobile-sticky-bar">
        <div className="mobile-sticky-inner">
          <a href={tgUrl} target="_blank" rel="noreferrer" className="btn-mobile-tg">
            {TG_ICON(18)}<span>Telegram</span>
          </a>
          <a href="#register" className="btn-mobile-reg">
            <span>VIP Pass (${GENERAL.earlyBirdPrice})</span>
          </a>
        </div>
      </div>
    </div>
  );
}
