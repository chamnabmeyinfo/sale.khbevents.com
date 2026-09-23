// ─────────────────────────────────────────────────────────────────────────────
// SMART CITY TEMPLATE COPY (English + Khmer)
//
// Rules (see .claude/skills/landing-page-copy):
//  - Copy never contains a literal price, seat count or deadline. Anything that
//    depends on live data is a function of `PageFacts`, so a stale number can
//    never be shipped.
//  - CMS page data overrides most of these defaults; check the `c = {...}`
//    merge in SmartCityLandingPageView.tsx before assuming a key is shown.
//  - `kh` must have exactly the shape of `en` (enforced by the type), so every
//    English string has a Khmer counterpart.
// ─────────────────────────────────────────────────────────────────────────────

export const GENERAL = {
  organizer: 'KHB EVENTS',
  contactPhone: '+855 12 345 678',
  contactTelegramUrl: 'https://t.me/khb_sale_admin_bot',
  contactTelegramUsername: 'khb_sale_admin_bot',
  coordinatorName: 'our coordinator',
  totalSeats: 30,
  claimedSeats: 19,
  earlyBirdPrice: 550,
  regularPrice: 550,
  earlyBirdDeadline: '2026-09-08T23:59:59',
  registrationDeadline: '2026-09-20T23:59:59',
  departureDate: '2026-10-08',
};

/** Where the sale is today. Drives which price, countdown and urgency copy show. */
export type SalePhase = 'early' | 'standard' | 'final' | 'departed';

/** Live values every dynamic string is built from. */
export interface PageFacts {
  phase: SalePhase;
  earlyBirdPrice: number;
  regularPrice: number;
  /** The price a buyer pays if they reserve right now. */
  currentPrice: number;
  savings: number;
  totalSeats: number;
  claimedSeats: number;
  seatsLeft: number;
  /** Already formatted for display, e.g. "Sep 8, 2026". */
  earlyBirdDeadline: string;
  registrationDeadline: string;
  departureDate: string;
  coordinatorName: string;
}

const en = {
  // ── Hero
  badge: 'B2B business trip · Hanoi & Halong Bay',
  heroTitle: 'Come home with suppliers, not just photos.',
  heroHeadlineHighlight: 'Smart City, Tea & Cafe Business Trip to Vietnam 2026',
  heroSubtitle: 'A 4-day B2B trip for Cambodian café, tea and retail-tech owners: two international expos, a factory visit and matched supplier meetings in Hanoi, with a trilingual guide beside you at every negotiation.',
  heroCtaDiscover: 'Reserve my seat, no payment today',
  heroSkipLink: 'or see what is included first ↓',
  heroRiskNote: 'No payment today · Seat held instantly · Coordinator replies within 15 minutes',
  earlyBirdNotice: (f: PageFacts): string => {
    const seats = `${f.seatsLeft} of ${f.totalSeats} seats left`;
    switch (f.phase) {
      case 'early': return f.savings > 0
        ? `Early Bird: save $${f.savings} until ${f.earlyBirdDeadline} · ${seats}`
        : `Early Bird price until ${f.earlyBirdDeadline} · ${seats}`;
      case 'standard': return `Registration closes ${f.registrationDeadline} · ${seats}`;
      case 'final': return `Final seats: the coach leaves ${f.departureDate} · ${seats}`;
      default: return 'This delegation has departed. Message us about the next trip.';
    }
  },
  heroPriceAnchorNote: (f: PageFacts) => f.phase === 'early' && f.savings > 0
    ? `Early Bird $${f.earlyBirdPrice}, regular price $${f.regularPrice}. You save $${f.savings}.`
    : `$${f.currentPrice} per seat with flights, hotel, expo passes and guide all handled.`,
  pillDate: (dateText: string, duration: string) => `${dateText} · ${duration}`,
  pillDuration: '4 days / 3 nights',
  pillDest: 'Hanoi & Halong Bay, Vietnam',
  pillExpos: '2 international expos in one trip',
  pillCruise: 'Halong Bay cruise included',
  pillSeats: (f: PageFacts) => `${f.totalSeats} seats · ${f.seatsLeft} left`,

  // ── Navigation
  navWhy: 'Why go',
  navPackage: 'What you get',
  navItinerary: 'Itinerary',
  navSeats: 'Seats',
  navPricing: 'Price',
  navFaq: 'FAQ',
  navCta: (f: PageFacts) => `Reserve · $${f.currentPrice}`,
  navCtaMobile: (f: PageFacts) => `Reserve my seat · $${f.currentPrice}, no payment today`,

  // ── Core value
  coreValueTag: 'What you take home',
  coreValueTitle: 'Four outcomes this trip buys your business',
  coreValueSubtitle: 'Before you look at the price, look at what comes back with you. None of these can be bought from a screenshot or through a broker.',
  coreValueBridge: 'Everything below exists to deliver these four outcomes.',
  coreValues: [
    { num: '01', icon: 'chart', title: 'Factory-direct pricing', desc: 'Buy at the source and cut 25 to 35% off what brokers charge. One negotiated container order can pay for the whole trip.' },
    { num: '02', icon: 'shield', title: 'Trust built face to face', desc: 'Walk the factory floor, see the QC lab and look your supplier in the eye before a single dollar is wired.' },
    { num: '03', icon: 'trophy', title: 'Exclusive rights for Cambodia', desc: 'Sign distribution for Cambodia before another importer signs the same supplier.' },
    { num: '04', icon: 'zap', title: 'Next year\'s products, this year', desc: 'Two international expos in one trip. See 2026 products, packaging and smart-retail tech before your competitors do.' },
  ],

  // ── Proof and stats
  proofStripText: 'business owners have already reserved their seats',
  proofStripIcons: ['☕', '🏙️', '🚚', '📈', '🏪'],
  proofStripTags: ['Cafe chain owner', 'Tea importer', 'POS integrator', 'Beverage wholesaler', 'F&B investor', 'Retail-tech founder'],
  statsStrip: [
    { value: '9-in-1', label: 'Flights, hotel, passes, guide: all handled' },
    { value: '2', label: 'International expos in one trip' },
    { value: '30', label: 'Seats per delegation' },
    { value: '4D/3N', label: 'Hanoi & Halong Bay' },
  ],

  // ── Problem
  problemTag: 'The cost of sourcing alone',
  problemTitle: 'Why importers who source online pay up to 35% more',
  problemSubtitle: 'Screenshots cannot negotiate. Photos cannot prove quality. This is what quietly eats the margin of most Cambodian importers:',
  problems: [
    { icon: 'trend-down', title: 'Middleman markups', desc: 'Brokers and resellers add 25 to 35% to every order before it reaches your warehouse.' },
    { icon: 'chat', title: 'Language and trust barriers', desc: 'Without a shared language deals die in translation, and you cannot tell a real factory from a trader with a catalogue.' },
    { icon: 'search', title: 'Blind online sourcing', desc: 'Ordering from photos and hoping. No factory floor, no QC lab, no face-to-face MOQ negotiation, no relationship.' },
  ],
  solutionBridge: 'This trip fixes all three in four days: you walk the factory floor, negotiate face to face with a trilingual guide beside you, and lock factory-direct prices before you fly home.',

  // ── Audience
  audienceTag: 'Who this is for',
  audienceSecTitle: 'Who should be on this coach',
  audienceSecSub: 'Built for owners and decision-makers who can sign a supplier deal on the spot. If you only want to sightsee, a tour company will serve you better.',
  audiences: [
    { icon: 'cpu', title: 'Smart city and tech importers', desc: 'Source IoT, smart-home, smart-lighting and security equipment directly from certified manufacturers.' },
    { icon: 'coffee', title: 'Cafe and tea brand owners', desc: 'Vietnamese tea and coffee beans, syrups, packaging, commercial espresso machines and brewing equipment at factory prices.' },
    { icon: 'truck', title: 'Wholesalers and distributors', desc: 'Exclusive distribution rights, factory-direct wholesale pricing and OEM/ODM partnerships.' },
    { icon: 'users', title: 'F&B entrepreneurs and investors', desc: 'Vietnamese and international franchise brands, new beverage concepts and retail models worth bringing to Cambodia.' },
  ],

  // ── Value stack
  valueStackTag: 'What you get',
  valueStackTitle: 'One price. Nine things handled.',
  valueStackSubtitle: 'Everything below is in your seat price. Book each piece yourself and the same trip costs more money and weeks of your time.',
  valueStackNote: 'What it would cost you to arrange alone',
  valueStackTotalLabel: 'Total if arranged alone',
  valueStackTotalValue: '$910+',
  valueStackPayLabel: 'Your seat price',
  inclusions: [
    { id: 1, title: 'Round-trip flights', desc: 'Phnom Penh to Hanoi and back.' },
    { id: 2, title: 'Hotel, 3 nights', desc: 'Twin or double sharing in Hanoi and Halong Bay.' },
    { id: 3, title: 'Breakfast every day', desc: 'Hotel buffet each morning.' },
    { id: 4, title: 'Private air-conditioned coach', desc: 'Every expo, factory, tour and transfer in Vietnam.' },
    { id: 5, title: 'Trilingual business guide', desc: 'Khmer, English and Vietnamese, beside you in every meeting.' },
    { id: 6, title: 'Expo passes', desc: 'Registration for Cafe Show Vietnam and Smart City Expo.' },
    { id: 7, title: 'Border and customs help', desc: 'Arrival paperwork and immigration handled for you.' },
    { id: 8, title: 'Factory and wholesale visits', desc: 'Coffee and tea processing plants and wholesale hubs.' },
    { id: 9, title: 'Halong Bay cruise and Hanoi tour', desc: 'UNESCO bay cruise with seafood lunch on board.' },
  ],
  valueStackPrices: [220, 150, 25, 80, 60, 120, 40, 150, 65],
  ctaBtn: 'Claim one of the remaining seats',
  valueCtaBtn: (f: PageFacts) => `Reserve my seat at $${f.currentPrice}`,

  // ── Matchmaker
  matchmakerTag: 'Pick your industry',
  matchmakerTitle: 'See exactly who you will meet',
  matchmakerSub: 'Choose your business. We show the suppliers waiting for you, the margins others captured and the sessions prepared for your track.',
  matchSuppliersTitle: 'Suppliers you will meet',
  matchRoiTitle: 'Margins you can capture',
  matchSessionsTitle: 'Sessions prepared for you',
  matchCtaBtn: 'Reserve this track',
  ctaBarText: (track: string) => `Interested in the <strong>${track}</strong> track?`,

  // ── Itinerary
  itineraryTag: 'Day by day',
  itineraryTitle: 'Four days, planned to the hour',
  itinerarySubtitle: 'Business first: two expo days, a factory visit and matched meetings. Then Hanoi\'s Old Quarter and a Halong Bay cruise before you fly home.',
  itinerary: [
    { day: 1, date: 'Oct 8, 2026', title: 'Phnom Penh to Hanoi, welcome night', events: [
      { time: '17:45 - 21:35', activity: 'Flight Phnom Penh to Hanoi (Noi Bai International Airport)' },
      { time: '22:30 - 23:00', activity: 'Private coach to the hotel and check-in' },
      { time: '23:00 - 24:00', activity: 'Optional evening walk in Hanoi' },
    ]},
    { day: 2, date: 'Oct 9, 2026', title: 'Cafe Show Vietnam and supplier meetings', events: [
      { time: '08:00 - 09:00', activity: 'Breakfast at the hotel' },
      { time: '09:00 - 09:30', activity: 'Coach to the Vietnam Exhibition Center' },
      { time: '10:00 - 12:00', activity: 'Cafe Show Vietnam: tea, coffee, machinery and ingredients' },
      { time: '12:00 - 13:00', activity: 'Lunch at the exhibition center' },
      { time: '13:00 - 16:00', activity: 'Matched B2B meetings and price negotiations with suppliers' },
      { time: '16:00 - 17:00', activity: 'Back to the hotel' },
      { time: '18:00 - 22:00', activity: 'Hanoi Old Quarter walk, dinner and landmarks' },
    ]},
    { day: 3, date: 'Oct 10, 2026', title: 'Smart City Expo, factory visit, on to Halong Bay', events: [
      { time: '08:00 - 09:00', activity: 'Breakfast at the hotel' },
      { time: '09:00 - 09:30', activity: 'Coach to the Vietnam Exhibition Center' },
      { time: '10:00 - 12:00', activity: 'Smart City Expo: IoT, smart lighting, infrastructure and tech' },
      { time: '12:00 - 13:00', activity: 'Lunch at the exhibition center' },
      { time: '13:00 - 15:30', activity: 'Visit to a wholesale coffee and tea roasting factory and showroom' },
      { time: '15:30 - 18:30', activity: 'Highway transfer to Halong Bay' },
      { time: '18:30 - 22:00', activity: 'Hotel check-in, Halong night market and promenade' },
    ]},
    { day: 4, date: 'Oct 11, 2026', title: 'Halong Bay cruise and flight home', events: [
      { time: '06:00 - 07:00', activity: 'Breakfast and express check-out' },
      { time: '07:00 - 07:30', activity: 'Transfer to Halong Bay International Harbour' },
      { time: '07:30 - 11:30', activity: 'Cruise on the UNESCO bay with a seafood lunch' },
      { time: '11:30 - 15:00', activity: 'Expressway transfer to Hanoi Noi Bai Airport' },
      { time: '15:00 - 17:00', activity: 'Check-in and immigration' },
      { time: '18:00 - 20:30', activity: 'Flight back to Phnom Penh' },
    ]},
  ],

  // ── Seat roster
  seatTag: 'Live seat roster',
  seatTitle: (f: PageFacts) => `${f.totalSeats} seats. ${f.claimedSeats} taken.`,
  seatSubtitle: 'Taken seats are held for owners who reserved before you. Tap an open seat to make it yours.',
  seatLegendBooked: 'Taken',
  seatLegendAvailable: 'Open (tap to pick)',
  seatLegendSelected: 'Yours',
  seatReservedTxt: 'Taken',
  seatAvailableTxt: 'Open',
  seatBanner: (n: number) => `Your seat: <strong>#${n}</strong>. Tap another open seat to change it.`,
  reservedLabel: 'Taken',
  availableLabel: 'Open',
  selectedLabel: '✓ Yours',
  clickSeat: 'Pick seat #',
  bookedSeat: (n: number) => `Seat #${n} (taken)`,

  // ── Testimonials
  testimonialsTag: 'From past delegations',
  testimonialsTitle: 'What owners brought home last time',
  testimonialsSubtitle: 'Results reported by business owners who travelled with KHB Events.',
  // Empty on purpose: never ship invented quotes. The section renders only when the CMS holds real ones.
  testimonials: [] as { quote: string; name: string; role: string }[],

  // ── Pricing
  pricingTag: 'Price',
  pricingTitle: 'One clear price',
  pricingSubtitle: 'Thirty seats keep the meetings personal. The price includes everything on the list above.',
  earlyBirdBadge: 'Best value',
  featuredBadge: 'Most chosen',
  earlyBirdPlanName: 'Early Bird seat',
  regularPlanName: 'Standard seat',
  perPerson: '/ person',
  pricingValidUntil: (f: PageFacts) => `Until ${f.earlyBirdDeadline}, then $${f.regularPrice}`,
  pricingAfter: (f: PageFacts) => `After ${f.earlyBirdDeadline}, while seats remain`,
  pricingCtaEarly: (f: PageFacts) => `Reserve at $${f.earlyBirdPrice}, pay after the call`,
  pricingCtaStandard: (f: PageFacts) => `Reserve a standard seat ($${f.regularPrice}) →`,
  pricingSecureNote: 'No payment today · Pay after your confirmation call',
  pricingFeatures: [
    'Round-trip flights Phnom Penh to Hanoi',
    'Hotel, 3 nights, twin sharing',
    'Passes to both international expos',
    'Factory and wholesale visits',
    'Halong Bay cruise with lunch',
    'Trilingual guide (Khmer / English / Vietnamese)',
  ],
  countdownTitle: (f: PageFacts): string => {
    switch (f.phase) {
      case 'early': return 'Early Bird price ends in';
      case 'standard': return 'Registration closes in';
      case 'final': return 'The coach leaves in';
      default: return 'This delegation has departed';
    }
  },
  countdownSub: (f: PageFacts): string => {
    switch (f.phase) {
      case 'early': return `Then the price is $${f.regularPrice}`;
      case 'standard': return 'After this, open seats go to the waitlist';
      case 'final': return 'Remaining seats are confirmed by phone, first come first served';
      default: return 'Message us on Telegram to hear about the next trip';
    }
  },
  countdownUnits: { d: 'Days', h: 'Hours', m: 'Min', s: 'Sec' },

  // ── Steps and guarantee
  stepsTag: 'How it works',
  stepsTitle: 'Reserve in 3 steps. No payment today.',
  stepsSubtitle: 'Step one takes under a minute.',
  steps: (f: PageFacts) => [
    { num: 1, title: 'Reserve your seat', desc: 'Enter your name and phone below. Your seat is held at once. Nothing to pay today.' },
    { num: 2, title: `Talk to ${f.coordinatorName}`, desc: `${f.coordinatorName} calls within 15 minutes, answers every question and sends your invoice and itinerary on Telegram.` },
    { num: 3, title: 'Pack your passport', desc: `On ${f.departureDate} you bring your passport. Flights, hotel, coach, expo passes and factory visits are already arranged.` },
  ],
  guaranteeTitle: 'Your reservation is risk-free',
  guaranteeText: 'You pay nothing until you have spoken with our team and decided this trip is right for your business. If KHB Events cancels the delegation, every delegate is refunded in full.',
  guaranteePoints: [
    'No payment today: reserve with your name and phone only',
    'Official tax invoice and full itinerary sent on Telegram',
    'Full refund if the organiser cancels the trip',
  ],

  // ── Register form
  registrationSectionTitle: 'Reserve your seat',
  registrationSectionSubtitle: (f: PageFacts) => `${f.seatsLeft} of ${f.totalSeats} seats left. ${f.coordinatorName} calls you within 15 minutes. Nothing to pay today.`,
  option2Title: '60-second reservation',
  option2Desc: 'Your name and phone number, that is all. We call you back and you decide on the call.',
  formNameLabel: 'Your full name *',
  formNamePlaceholder: 'e.g. Sok Sovann',
  formPhoneLabel: 'Phone (Telegram or WhatsApp) *',
  formPhonePlaceholder: 'e.g. 012 345 678',
  formSubmitBtn: 'Reserve my seat, no payment today',
  formSubmitting: 'Holding your seat...',
  formSuccessTitle: 'Your seat is held',
  formSuccessDesc: (f: PageFacts) => `Thank you. ${f.coordinatorName} from KHB Events will call or message you within 15 minutes to confirm the details.`,
  formSuccessTelegramPrompt: 'Want it faster? Open Telegram and we confirm in the chat.',
  option1Highlight: 'Fastest reply · Itinerary PDF sent at once',
  regTag: 'Priority reservation',
  passPreviewLabel: 'Your delegate pass preview',
  instantBadge: 'Seat held instantly',
  businessFocusLabel: 'Your business',
  seatLabel: 'Your seat',
  seatWord: 'Seat',
  seatsLeftNote: (left: number, total: number) => `${left} of ${total} seats left`,
  secureNote: 'No payment today · Tax invoice sent on Telegram',
  orChat: 'Prefer to talk first?',
  telegramDirectBtn: (f: PageFacts) => `Message ${f.coordinatorName} on Telegram`,
  profileOptions: [
    { value: 'Cafe & Tea Business', label: 'Cafe or tea brand' },
    { value: 'Smart City & Retail Tech', label: 'Smart city / tech' },
    { value: 'Wholesale & Distribution', label: 'Wholesaler / importer' },
    { value: 'F&B Entrepreneur', label: 'F&B investor' },
  ],

  // ── FAQ
  faqTag: 'Before you decide',
  faqTitle: 'Questions owners ask before reserving',
  faqSubtitle: 'If yours is not here, ask on Telegram and get an answer in minutes.',
  faqs: (f: PageFacts) => [
    { q: 'Do I need a visa for Vietnam?', a: 'Cambodian passport holders enter Vietnam visa-free for up to 30 days. Our team handles the arrival paperwork and customs facilitation so you walk straight through.' },
    { q: 'Do I have to pay today?', a: `No. You reserve with your name and phone number. ${f.coordinatorName} calls you within 15 minutes, and you pay only after your flights, hotel and factory schedule are confirmed.` },
    { q: 'Can my company get an official invoice?', a: 'Yes. We issue corporate billing and official tax invoices. Ask on Telegram or during your confirmation call.' },
    { q: 'Is the hotel room private?', a: 'The price includes twin or double sharing. If you prefer a single room, tell your coordinator and we arrange it for a small supplement.' },
    { q: 'What if the seats sell out before I decide?', a: `The ${f.totalSeats} seats are first come, first served. A reserved seat is held for that delegate. Latecomers join a waitlist, and a seat may not open.` },
    { q: `What is not included in the $${f.currentPrice}?`, a: 'Lunches and dinners outside the listed programme (the Halong Bay cruise lunch is included), a Vietnam SIM card, travel insurance and personal shopping. All logistics are covered.' },
    { q: 'Can I get a refund after paying?', a: 'Yes. Cancel at least 14 days before departure and, if your seat is refilled from the waitlist, you receive a full refund. Organiser cancellations are always refunded in full.' },
    { q: 'Do I need to speak English or Vietnamese?', a: 'No. A guide fluent in Khmer, English and Vietnamese sits beside you in every meeting and negotiation.' },
    { q: 'Can I bring a partner or a staff member?', a: 'Yes. Each person takes one seat at the same price. Tell your coordinator so you are seated and roomed together.' },
    { q: 'Is my passport valid enough?', a: 'Vietnam asks for at least six months of validity from your entry date. Check the expiry date before you reserve.' },
  ],

  // ── Final CTA and trust
  ctaTitle: (f: PageFacts) => f.seatsLeft > 0
    ? `${f.seatsLeft} seats left. ${f.claimedSeats} business owners are already in.`
    : `All ${f.totalSeats} seats are taken. Join the waitlist.`,
  ctaSub: (f: PageFacts): string => {
    switch (f.phase) {
      case 'early':
      case 'standard':
        return `When the last seat is taken, registration closes, even before ${f.registrationDeadline}. The supplier you want may sign with the importer sitting in that seat.`;
      case 'final':
        return `The coach leaves ${f.departureDate}. Seats still open are confirmed by phone, first come first served.`;
      default:
        return 'Leave your number and you hear first about the next delegation.';
    }
  },
  finalCtaBtn: (f: PageFacts): string => f.seatsLeft > 0 ? 'Reserve my seat, no payment today' : 'Join the waitlist',
  trustTitle: 'Organised by KHB Events, Cambodia',
  trustDesc: 'KHB Events & Media takes Cambodian owners, importers and investors to verified factories and trade expos across the region, with full support in Khmer, English and Vietnamese from the first call to the flight home.',
  hotlineLabel: 'Hotline',
  telegramLabel: 'Telegram',
  footerText: '© 2026 KHB EVENTS Cambodia. All rights reserved.',
  footerLinks: { package: 'What you get', itinerary: 'Itinerary', seats: 'Seats', pricing: 'Price', faq: 'FAQ' },

  // ── Delegate pass preview
  passTier: 'DELEGATE',
  passBrandSub: 'VIETNAM B2B DELEGATION 2026',
  passFrom: 'Phnom Penh',
  passTo: 'Hanoi / Halong Bay',
  passRouteDate: (f: PageFacts) => `DEPARTS ${f.departureDate.toUpperCase()}`,
  passNameLabel: 'DELEGATE',
  passSeatLabel: 'SEAT',
  passIndustryLabel: 'BUSINESS',
  passRateLabel: 'PRICE HELD',
  passRateValue: (f: PageFacts) => f.phase === 'early' ? `$${f.earlyBirdPrice} EARLY BIRD` : `$${f.currentPrice} STANDARD`,
  passGuest: 'GUEST DELEGATE',
};

export type SmartCityCopy = typeof en;

const kh: SmartCityCopy = {
  // ── Hero
  badge: 'ដំណើរអាជីវកម្ម B2B · ហាណូយ & ហាឡុងបេ',
  heroTitle: 'ត្រឡប់មកវិញជាមួយអ្នកផ្គត់ផ្គង់ មិនមែនគ្រាន់តែរូបថត។',
  heroHeadlineHighlight: 'ដំណើរអាជីវកម្ម Smart City, Tea & Cafe ទៅវៀតណាម ២០២៦',
  heroSubtitle: 'ដំណើរ B2B រយៃពេល ៤ ថ្ងៃ សម្រាប់ម្ចាស់ហាងកាហ្វេ តែ និងបច្ចេកវិទ្យាលក់រាយនៅកម្ពុជា។ ពិព័រណ៍អន្តរជាតិ ២ ទស្សនារោងចក្រ និងជួបអ្នកផ្គត់ផ្គង់ដែលផ្គូផ្គងជូន ដោយមានមគ្គុទ្ទេសក៍ ៣ ភាសានៅក្បែរលោកអ្នករាល់ការចរចា។',
  heroCtaDiscover: 'កក់កៅអីខ្ញុំ មិនបង់ប្រាក់ថ្ងៃនេះ',
  heroSkipLink: 'ឬមើលអ្វីដែលរួមបញ្ចូលជាមុន ↓',
  heroRiskNote: 'មិនបង់ប្រាក់ថ្ងៃនេះ · កៅអីរក្សាទុកភ្លាម · អ្នកសម្របសម្រួលឆ្លើយក្នុង ១៥ នាទី',
  earlyBirdNotice: (f) => {
    const seats = `នៅសល់ ${f.seatsLeft} ក្នុង ${f.totalSeats} កៅអី`;
    switch (f.phase) {
      case 'early': return f.savings > 0
        ? `Early Bird: ចំណេញ $${f.savings} រហូតដល់ ${f.earlyBirdDeadline} · ${seats}`
        : `តម្លៃ Early Bird រហូតដល់ ${f.earlyBirdDeadline} · ${seats}`;
      case 'standard': return `បិទការចុះឈ្មោះ ${f.registrationDeadline} · ${seats}`;
      case 'final': return `កៅអីចុងក្រោយ៖ ចេញដំណើរ ${f.departureDate} · ${seats}`;
      default: return 'ដំណើរនេះបានចេញរួចហើយ។ សូមផ្ញើសារមកយើងអំពីដំណើរបន្ទាប់។';
    }
  },
  heroPriceAnchorNote: (f) => f.phase === 'early' && f.savings > 0
    ? `Early Bird $${f.earlyBirdPrice} តម្លៃធម្មតា $${f.regularPrice}។ លោកអ្នកចំណេញ $${f.savings}។`
    : `$${f.currentPrice} ក្នុងមួយកៅអី រួមទាំងជើងហោះហើរ សណ្ឋាគារ សំបុត្រពិព័រណ៍ និងមគ្គុទ្ទេសក៍។`,
  pillDate: (dateText, duration) => `${dateText} · ${duration}`,
  pillDuration: '៤ ថ្ងៃ / ៣ យប់',
  pillDest: 'ហាណូយ & ហាឡុងបេ វៀតណាម',
  pillExpos: 'ពិព័រណ៍អន្តរជាតិ ២ ក្នុងដំណើរតែមួយ',
  pillCruise: 'រួមបញ្ចូលកប៉ាល់ហាឡុងបេ',
  pillSeats: (f) => `${f.totalSeats} កៅអី · នៅសល់ ${f.seatsLeft}`,

  // ── Navigation
  navWhy: 'ហេតុអ្វីទៅ',
  navPackage: 'អ្វីដែលទទួលបាន',
  navItinerary: 'កាលវិភាគ',
  navSeats: 'កៅអី',
  navPricing: 'តម្លៃ',
  navFaq: 'សំណួរ',
  navCta: (f) => `កក់ · $${f.currentPrice}`,
  navCtaMobile: (f) => `កក់កៅអីខ្ញុំ · $${f.currentPrice} មិនបង់ប្រាក់ថ្ងៃនេះ`,

  // ── Core value
  coreValueTag: 'អ្វីដែលលោកអ្នកយកទៅផ្ទះ',
  coreValueTitle: 'លទ្ធផល ៤ ដែលដំណើរនេះនាំមកឱ្យអាជីវកម្មលោកអ្នក',
  coreValueSubtitle: 'មុននឹងមើលតម្លៃ សូមមើលអ្វីដែលត្រឡប់មកជាមួយលោកអ្នក។ ទាំងនេះមិនអាចទិញបានពីរូបថត ឬតាមឈ្មួញកណ្តាលឡើយ។',
  coreValueBridge: 'អ្វីៗខាងក្រោមទាំងអស់ មានដើម្បីផ្តល់លទ្ធផល ៤ នេះ។',
  coreValues: [
    { num: '01', icon: 'chart', title: 'តម្លៃផ្ទាល់ពីរោងចក្រ', desc: 'ទិញពីប្រភពផ្ទាល់ កាត់បន្ថយ ២៥ ដល់ ៣៥% ពីតម្លៃឈ្មួញកណ្តាល។ ការចរចាកុងតឺន័រតែមួយ អាចសងថ្លៃដំណើរទាំងមូល។' },
    { num: '02', icon: 'shield', title: 'ទំនុកចិត្តពីការជួបផ្ទាល់', desc: 'ដើរមើលរោងចក្រ មើលបន្ទប់ត្រួតពិនិត្យគុណភាព និងជួបអ្នកផ្គត់ផ្គង់ផ្ទាល់ មុនផ្ទេរប្រាក់មួយដុល្លារ។' },
    { num: '03', icon: 'trophy', title: 'សិទ្ធិផ្តាច់មុខសម្រាប់កម្ពុជា', desc: 'ចុះកិច្ចសន្យាចែកចាយសម្រាប់កម្ពុជា មុនអ្នកនាំចូលផ្សេងចុះជាមួយអ្នកផ្គត់ផ្គង់ដូចគ្នា។' },
    { num: '04', icon: 'zap', title: 'ផលិតផលឆ្នាំក្រោយ ឃើញឆ្នាំនេះ', desc: 'ពិព័រណ៍អន្តរជាតិ ២ ក្នុងដំណើរតែមួយ។ ឃើញផលិតផល ការវេចខ្ចប់ និងបច្ចេកវិទ្យាលក់រាយ ២០២៦ មុនគូប្រកួត។' },
  ],

  // ── Proof and stats
  proofStripText: 'ម្ចាស់អាជីវកម្មបានកក់កៅអីរួចហើយ',
  proofStripIcons: ['☕', '🏙️', '🚚', '📈', '🏪'],
  proofStripTags: ['ម្ចាស់ខ្សែសង្វាក់កាហ្វេ', 'អ្នកនាំចូលតែ', 'អ្នកដំឡើង POS', 'អ្នកលក់ដុំភេសជ្ជៃ', 'អ្នកវិនិយោគ F&B', 'ស្ថាបនិកបច្ចេកវិទ្យាលក់រាយ'],
  statsStrip: [
    { value: '9-in-1', label: 'ជើងហោះហើរ សណ្ឋាគារ សំបុត្រ មគ្គុទ្ទេសក៍៖ រៀបចំជូនទាំងអស់' },
    { value: '2', label: 'ពិព័រណ៍អន្តរជាតិក្នុងដំណើរតែមួយ' },
    { value: '30', label: 'កៅអីក្នុងមួយដំណើរ' },
    { value: '4D/3N', label: 'ហាណូយ & ហាឡុងបេ' },
  ],

  // ── Problem
  problemTag: 'តម្លៃនៃការស្វែងរកតែម្នាក់ឯង',
  problemTitle: 'ហេតុអ្វីអ្នកនាំចូលដែលទិញតាមអនឡាញ បង់ថ្លៃជាងរហូតដល់ ៣៥%',
  problemSubtitle: 'រូបថតមិនអាចចរចាតម្លៃបានទេ។ រូបភាពមិនអាចបញ្ជាក់គុណភាពបានទេ។ នេះជាអ្វីដែលស៊ីប្រាក់ចំណេញអ្នកនាំចូលកម្ពុជាភាគច្រើន៖',
  problems: [
    { icon: 'trend-down', title: 'ថ្លៃឈ្មួញកណ្តាល', desc: 'ឈ្មួញកណ្តាល និងអ្នកលក់បន្ត បន្ថែម ២៥ ដល់ ៣៥% លើរាល់ការបញ្ជាទិញ មុនទំនិញមកដល់ឃ្លាំងលោកអ្នក។' },
    { icon: 'chat', title: 'ភាសា និងទំនុកចិត្ត', desc: 'គ្មានភាសារួម កិច្ចព្រមព្រៀងបាត់បង់ក្នុងការបកប្រែ ហើយលោកអ្នកមិនអាចដឹងថាណាជារោងចក្រពិត ណាជាឈ្មួញកាន់កាតាឡុក។' },
    { icon: 'search', title: 'ទិញអនឡាញដោយមិនឃើញ', desc: 'បញ្ជាទិញតាមរូបថត រួចរង់ចាំសំណាង។ គ្មានរោងចក្រ គ្មានបន្ទប់ QC គ្មានការចរចា MOQ ផ្ទាល់ គ្មានទំនាក់ទំនង។' },
  ],
  solutionBridge: 'ដំណើរនេះដោះស្រាយបញ្ហាទាំង ៣ ក្នុង ៤ ថ្ងៃ៖ លោកអ្នកដើរមើលរោងចក្រ ចរចាផ្ទាល់ដោយមានមគ្គុទ្ទេសក៍ ៣ ភាសានៅក្បែរ និងចាប់តម្លៃផ្ទាល់ពីរោងចក្រ មុនហោះត្រឡប់មកផ្ទះ។',

  // ── Audience
  audienceTag: 'សម្រាប់អ្នកណា',
  audienceSecTitle: 'អ្នកណាគួរនៅលើឡានក្រុងនេះ',
  audienceSecSub: 'រៀបចំសម្រាប់ម្ចាស់អាជីវកម្ម និងអ្នកសម្រេចចិត្ត ដែលអាចចុះកិច្ចសន្យាជាមួយអ្នកផ្គត់ផ្គង់នៅនឹងកន្លែង។ បើលោកអ្នកគ្រាន់តែចង់ដើរលេង ក្រុមហ៊ុនទេសចរណ៍សមជាង។',
  audiences: [
    { icon: 'cpu', title: 'អ្នកនាំចូល Smart City និងបច្ចេកវិទ្យា', desc: 'IoT ផ្ទះឆ្លាត ភ្លើងឆ្លាត និងឧបករណ៍សុវត្ថិភាព ផ្ទាល់ពីរោងចក្រដែលមានវិញ្ញាបនបត្រ។' },
    { icon: 'coffee', title: 'ម្ចាស់ម៉ាកកាហ្វេ និងតែ', desc: 'តែ និងកាហ្វេវៀតណាម ស៊ីរ៉ូ ការវេចខ្ចប់ ម៉ាស៊ីនកាហ្វេពាណិជ្ជកម្ម និងឧបករណ៍ឆុង ក្នុងតម្លៃរោងចក្រ។' },
    { icon: 'truck', title: 'អ្នកលក់ដុំ និងអ្នកចែកចាយ', desc: 'សិទ្ធិចែកចាយផ្តាច់មុខ តម្លៃបោះដុំផ្ទាល់ពីរោងចក្រ និងភាពជាដៃគូ OEM/ODM។' },
    { icon: 'users', title: 'សហគ្រិន និងអ្នកវិនិយោគ F&B', desc: 'ម៉ាកហ្វ្រេនឆាយវៀតណាម និងអន្តរជាតិ គំនិតភេសជ្ជៃថ្មី និងម៉ូដែលលក់រាយដែលគួរនាំមកកម្ពុជា។' },
  ],

  // ── Value stack
  valueStackTag: 'អ្វីដែលលោកអ្នកទទួលបាន',
  valueStackTitle: 'តម្លៃតែមួយ។ រៀបចំជូន ៩ យ៉ាង។',
  valueStackSubtitle: 'អ្វីៗខាងក្រោមរួមក្នុងតម្លៃកៅអីរបស់លោកអ្នក។ បើកក់ដោយខ្លួនឯងម្តងមួយៗ ដំណើរដូចគ្នាអស់ប្រាក់ច្រើនជាង និងពេលវេលារាប់សប្តាហ៍។',
  valueStackNote: 'តម្លៃបើលោកអ្នករៀបចំដោយខ្លួនឯង',
  valueStackTotalLabel: 'សរុប បើរៀបចំដោយខ្លួនឯង',
  valueStackTotalValue: '$910+',
  valueStackPayLabel: 'តម្លៃកៅអីរបស់លោកអ្នក',
  inclusions: [
    { id: 1, title: 'ជើងហោះហើរទៅមក', desc: 'ភ្នំពេញ ទៅ ហាណូយ និងត្រឡប់មកវិញ។' },
    { id: 2, title: 'សណ្ឋាគារ ៣ យប់', desc: 'បន្ទប់ Twin ឬ Double នៅហាណូយ និងហាឡុងបេ។' },
    { id: 3, title: 'អាហារពេលព្រឹករាល់ថ្ងៃ', desc: 'ប៉ូហ្វេនៅសណ្ឋាគាររាល់ព្រឹក។' },
    { id: 4, title: 'ឡានក្រុងឯកជនម៉ាស៊ីនត្រជាក់', desc: 'រាល់ពិព័រណ៍ រោងចក្រ ទស្សនា និងការដឹកជញ្ជូននៅវៀតណាម។' },
    { id: 5, title: 'មគ្គុទ្ទេសក៍អាជីវកម្ម ៣ ភាសា', desc: 'ខ្មែរ អង់គ្លេស វៀតណាម នៅក្បែរលោកអ្នករាល់កិច្ចប្រជុំ។' },
    { id: 6, title: 'សំបុត្រពិព័រណ៍', desc: 'ចុះឈ្មោះ Cafe Show Vietnam និង Smart City Expo។' },
    { id: 7, title: 'ជំនួយច្រកព្រំដែន និងគយ', desc: 'ឯកសារចូលប្រទេស និងអន្តោប្រវេសន៍ រៀបចំជូន។' },
    { id: 8, title: 'ទស្សនារោងចក្រ និងទីផ្សារបោះដុំ', desc: 'រោងចក្រកែច្នៃកាហ្វេ តែ និងមជ្ឈមណ្ឌលលក់ដុំ។' },
    { id: 9, title: 'កប៉ាល់ហាឡុងបេ និងទស្សនាហាណូយ', desc: 'ជិះកប៉ាល់ឈូងសមុទ្រ UNESCO ជាមួយអាហារថ្ងៃត្រង់លើកប៉ាល់។' },
  ],
  valueStackPrices: [220, 150, 25, 80, 60, 120, 40, 150, 65],
  ctaBtn: 'យកកៅអីមួយក្នុងចំណោមដែលនៅសល់',
  valueCtaBtn: (f) => `កក់កៅអីខ្ញុំក្នុងតម្លៃ $${f.currentPrice}`,

  // ── Matchmaker
  matchmakerTag: 'ជ្រើសវិស័យលោកអ្នក',
  matchmakerTitle: 'មើលឱ្យច្បាស់ថាលោកអ្នកនឹងជួបអ្នកណា',
  matchmakerSub: 'ជ្រើសអាជីវកម្មលោកអ្នក។ យើងបង្ហាញអ្នកផ្គត់ផ្គង់ដែលរង់ចាំ ប្រាក់ចំណេញដែលអ្នកផ្សេងបានទទួល និងវគ្គដែលរៀបចំសម្រាប់លោកអ្នក។',
  matchSuppliersTitle: 'អ្នកផ្គត់ផ្គង់ដែលលោកអ្នកនឹងជួប',
  matchRoiTitle: 'ប្រាក់ចំណេញដែលអាចទទួលបាន',
  matchSessionsTitle: 'វគ្គដែលរៀបចំសម្រាប់លោកអ្នក',
  matchCtaBtn: 'កក់ផ្លូវនេះ',
  ctaBarText: (track) => `ចាប់អារម្មណ៍ផ្លូវ <strong>${track}</strong> មែនទេ?`,

  // ── Itinerary
  itineraryTag: 'ថ្ងៃម្តងមួយៗ',
  itineraryTitle: 'បួនថ្ងៃ រៀបចំរហូតដល់ម៉ោង',
  itinerarySubtitle: 'អាជីវកម្មមុន៖ ពិព័រណ៍ ២ ថ្ងៃ ទស្សនារោងចក្រ និងកិច្ចប្រជុំផ្គូផ្គង។ បន្ទាប់មក ទីក្រុងចាស់ហាណូយ និងកប៉ាល់ហាឡុងបេ មុនហោះត្រឡប់មកផ្ទះ។',
  itinerary: [
    { day: 1, date: '៨ តុលា ២០២៦', title: 'ភ្នំពេញ ទៅ ហាណូយ យប់ស្វាគមន៍', events: [
      { time: '17:45 - 21:35', activity: 'ហោះហើរពីភ្នំពេញទៅហាណូយ (អាកាសយានដ្ឋាន Noi Bai)' },
      { time: '22:30 - 23:00', activity: 'ឡានក្រុងឯកជនទៅសណ្ឋាគារ និង Check-in' },
      { time: '23:00 - 24:00', activity: 'ដើរលេងពេលយប់នៅហាណូយ (ស្ម័គ្រចិត្ត)' },
    ]},
    { day: 2, date: '៩ តុលា ២០២៦', title: 'Cafe Show Vietnam និងជួបអ្នកផ្គត់ផ្គង់', events: [
      { time: '08:00 - 09:00', activity: 'អាហារពេលព្រឹកនៅសណ្ឋាគារ' },
      { time: '09:00 - 09:30', activity: 'ឡានក្រុងទៅ Vietnam Exhibition Center' },
      { time: '10:00 - 12:00', activity: 'Cafe Show Vietnam៖ តែ កាហ្វេ ម៉ាស៊ីន និងគ្រឿងផ្សំ' },
      { time: '12:00 - 13:00', activity: 'អាហារថ្ងៃត្រង់នៅមជ្ឈមណ្ឌលពិព័រណ៍' },
      { time: '13:00 - 16:00', activity: 'កិច្ចប្រជុំ B2B ដែលផ្គូផ្គង និងចរចាតម្លៃជាមួយអ្នកផ្គត់ផ្គង់' },
      { time: '16:00 - 17:00', activity: 'ត្រឡប់ទៅសណ្ឋាគារ' },
      { time: '18:00 - 22:00', activity: 'ដើរទីក្រុងចាស់ហាណូយ អាហារពេលល្ងាច និងទីតាំងល្បី' },
    ]},
    { day: 3, date: '១០ តុលា ២០២៦', title: 'Smart City Expo ទស្សនារោងចក្រ ទៅហាឡុងបេ', events: [
      { time: '08:00 - 09:00', activity: 'អាហារពេលព្រឹកនៅសណ្ឋាគារ' },
      { time: '09:00 - 09:30', activity: 'ឡានក្រុងទៅ Vietnam Exhibition Center' },
      { time: '10:00 - 12:00', activity: 'Smart City Expo៖ IoT ភ្លើងឆ្លាត ហេដ្ឋារចនាសម្ព័ន្ធ និងបច្ចេកវិទ្យា' },
      { time: '12:00 - 13:00', activity: 'អាហារថ្ងៃត្រង់នៅមជ្ឈមណ្ឌលពិព័រណ៍' },
      { time: '13:00 - 15:30', activity: 'ទស្សនារោងចក្រលីងកាហ្វេ តែ បោះដុំ និងបន្ទប់តាំងបង្ហាញ' },
      { time: '15:30 - 18:30', activity: 'ធ្វើដំណើរតាមផ្លូវហាយវេទៅហាឡុងបេ' },
      { time: '18:30 - 22:00', activity: 'Check-in សណ្ឋាគារ ផ្សារយប់ និងឆ្នេរហាឡុង' },
    ]},
    { day: 4, date: '១១ តុលា ២០២៦', title: 'កប៉ាល់ហាឡុងបេ និងហោះត្រឡប់មកផ្ទះ', events: [
      { time: '06:00 - 07:00', activity: 'អាហារពេលព្រឹក និង Check-out រហ័ស' },
      { time: '07:00 - 07:30', activity: 'ទៅកំពង់ផែទេសចរណ៍អន្តរជាតិហាឡុងបេ' },
      { time: '07:30 - 11:30', activity: 'ជិះកប៉ាល់ឈូងសមុទ្រ UNESCO ជាមួយអាហារថ្ងៃត្រង់សមុទ្រ' },
      { time: '11:30 - 15:00', activity: 'ផ្លូវល្បឿនលឿនទៅអាកាសយានដ្ឋាន Noi Bai ហាណូយ' },
      { time: '15:00 - 17:00', activity: 'Check-in និងអន្តោប្រវេសន៍' },
      { time: '18:00 - 20:30', activity: 'ហោះហើរត្រឡប់មកភ្នំពេញ' },
    ]},
  ],

  // ── Seat roster
  seatTag: 'បញ្ជីកៅអីផ្ទាល់',
  seatTitle: (f) => `${f.totalSeats} កៅអី។ បានយក ${f.claimedSeats}។`,
  seatSubtitle: 'កៅអីដែលបានយក រក្សាទុកសម្រាប់ម្ចាស់អាជីវកម្មដែលកក់មុនលោកអ្នក។ ចុចកៅអីទំនេរដើម្បីយកជារបស់លោកអ្នក។',
  seatLegendBooked: 'បានយក',
  seatLegendAvailable: 'ទំនេរ (ចុចជ្រើស)',
  seatLegendSelected: 'របស់លោកអ្នក',
  seatReservedTxt: 'បានយក',
  seatAvailableTxt: 'ទំនេរ',
  seatBanner: (n) => `កៅអីលោកអ្នក៖ <strong>#${n}</strong>។ ចុចកៅអីទំនេរផ្សេងដើម្បីប្តូរ។`,
  reservedLabel: 'បានយក',
  availableLabel: 'ទំនេរ',
  selectedLabel: '✓ របស់លោកអ្នក',
  clickSeat: 'ជ្រើសកៅអី #',
  bookedSeat: (n) => `កៅអី #${n} (បានយក)`,

  // ── Testimonials
  testimonialsTag: 'ពីដំណើរមុនៗ',
  testimonialsTitle: 'អ្វីដែលម្ចាស់អាជីវកម្មយកមកផ្ទះលើកមុន',
  testimonialsSubtitle: 'លទ្ធផលដែលរាយការណ៍ដោយម្ចាស់អាជីវកម្មដែលបានធ្វើដំណើរជាមួយ KHB Events។',
  testimonials: [],

  // ── Pricing
  pricingTag: 'តម្លៃ',
  pricingTitle: 'តម្លៃច្បាស់តែមួយ',
  pricingSubtitle: 'កៅអី ៣០ រក្សាកិច្ចប្រជុំឱ្យជិតស្និទ្ធ។ តម្លៃរួមបញ្ចូលអ្វីៗទាំងអស់ក្នុងបញ្ជីខាងលើ។',
  earlyBirdBadge: 'តម្លៃល្អបំផុត',
  featuredBadge: 'ជ្រើសរើសច្រើនបំផុត',
  earlyBirdPlanName: 'កៅអី Early Bird',
  regularPlanName: 'កៅអីធម្មតា',
  perPerson: '/ នាក់',
  pricingValidUntil: (f) => `រហូតដល់ ${f.earlyBirdDeadline} បន្ទាប់មក $${f.regularPrice}`,
  pricingAfter: (f) => `ក្រោយ ${f.earlyBirdDeadline} ដរាបណានៅមានកៅអី`,
  pricingCtaEarly: (f) => `កក់ក្នុងតម្លៃ $${f.earlyBirdPrice} បង់ក្រោយការហៅទូរស័ព្ទ`,
  pricingCtaStandard: (f) => `កក់កៅអីធម្មតា ($${f.regularPrice}) →`,
  pricingSecureNote: 'មិនបង់ប្រាក់ថ្ងៃនេះ · បង់ក្រោយការហៅបញ្ជាក់',
  pricingFeatures: [
    'ជើងហោះហើរទៅមក ភ្នំពេញ ហាណូយ',
    'សណ្ឋាគារ ៣ យប់ បន្ទប់ Twin',
    'សំបុត្រពិព័រណ៍អន្តរជាតិទាំង ២',
    'ទស្សនារោងចក្រ និងទីផ្សារបោះដុំ',
    'កប៉ាល់ហាឡុងបេ ជាមួយអាហារថ្ងៃត្រង់',
    'មគ្គុទ្ទេសក៍ ៣ ភាសា (ខ្មែរ / អង់គ្លេស / វៀតណាម)',
  ],
  countdownTitle: (f) => {
    switch (f.phase) {
      case 'early': return 'តម្លៃ Early Bird បញ្ចប់ក្នុង';
      case 'standard': return 'បិទការចុះឈ្មោះក្នុង';
      case 'final': return 'ឡានក្រុងចេញដំណើរក្នុង';
      default: return 'ដំណើរនេះបានចេញរួចហើយ';
    }
  },
  countdownSub: (f) => {
    switch (f.phase) {
      case 'early': return `បន្ទាប់មក តម្លៃ $${f.regularPrice}`;
      case 'standard': return 'ក្រោយពេលនេះ កៅអីទំនេរទៅបញ្ជីរង់ចាំ';
      case 'final': return 'កៅអីនៅសល់បញ្ជាក់តាមទូរស័ព្ទ អ្នកមកមុនបានមុន';
      default: return 'ផ្ញើសារតាម Telegram ដើម្បីដឹងអំពីដំណើរបន្ទាប់';
    }
  },
  countdownUnits: { d: 'ថ្ងៃ', h: 'ម៉ោង', m: 'នាទី', s: 'វិនាទី' },

  // ── Steps and guarantee
  stepsTag: 'ដំណើរការ',
  stepsTitle: 'កក់ក្នុង ៣ ជំហាន។ មិនបង់ប្រាក់ថ្ងៃនេះ។',
  stepsSubtitle: 'ជំហានទី ១ ចំណាយពេលមិនដល់មួយនាទី។',
  steps: (f) => [
    { num: 1, title: 'កក់កៅអីលោកអ្នក', desc: 'បំពេញឈ្មោះ និងលេខទូរស័ព្ទខាងក្រោម។ កៅអីរក្សាទុកភ្លាម។ មិនបង់ប្រាក់ថ្ងៃនេះ។' },
    { num: 2, title: `និយាយជាមួយ ${f.coordinatorName}`, desc: `${f.coordinatorName} ទូរស័ព្ទមកក្នុង ១៥ នាទី ឆ្លើយរាល់សំណួរ និងផ្ញើវិក្កយបត្រ និងកាលវិភាគតាម Telegram។` },
    { num: 3, title: 'រៀបចំលិខិតឆ្លងដែន', desc: `ថ្ងៃ ${f.departureDate} លោកអ្នកគ្រាន់តៃយកលិខិតឆ្លងដែនមក។ ជើងហោះហើរ សណ្ឋាគារ ឡានក្រុង សំបុត្រពិព័រណ៍ និងរោងចក្រ រៀបចំរួចរាល់។` },
  ],
  guaranteeTitle: 'ការកក់របស់លោកអ្នកគ្មានហានិភ័យ',
  guaranteeText: 'លោកអ្នកមិនបង់អ្វីទាំងអស់ រហូតដល់បាននិយាយជាមួយក្រុមការងារ និងសម្រេចថាដំណើរនេះសមនឹងអាជីវកម្មលោកអ្នក។ បើ KHB Events លុបចោលដំណើរ ប្រតិភូទាំងអស់ទទួលប្រាក់វិញពេញ។',
  guaranteePoints: [
    'មិនបង់ប្រាក់ថ្ងៃនេះ៖ កក់ដោយឈ្មោះ និងលេខទូរស័ព្ទប៉ុណ្ណោះ',
    'វិក្កយបត្រពន្ធផ្លូវការ និងកាលវិភាគពេញលេញ ផ្ញើតាម Telegram',
    'សងប្រាក់វិញពេញ បើអ្នករៃបចំលុបចោលដំណើរ',
  ],

  // ── Register form
  registrationSectionTitle: 'កក់កៅអីរបស់លោកអ្នក',
  registrationSectionSubtitle: (f) => `នៅសល់ ${f.seatsLeft} ក្នុង ${f.totalSeats} កៅអី។ ${f.coordinatorName} ទូរស័ព្ទមកក្នុង ១៥ នាទី។ មិនបង់ប្រាក់ថ្ងៃនេះ។`,
  option2Title: 'កក់ក្នុង ៦០ វិនាទី',
  option2Desc: 'ឈ្មោះ និងលេខទូរស័ព្ទប៉ុណ្ណោះ។ យើងទូរស័ព្ទមកវិញ ហើយលោកអ្នកសម្រេចចិត្តក្នុងការហៅ។',
  formNameLabel: 'ឈ្មោះពេញ *',
  formNamePlaceholder: 'ឧ. សុខ សុវណ្ណ',
  formPhoneLabel: 'លេខទូរស័ព្ទ (Telegram ឬ WhatsApp) *',
  formPhonePlaceholder: 'ឧ. 012 345 678',
  formSubmitBtn: 'កក់កៅអីខ្ញុំ មិនបង់ប្រាក់ថ្ងៃនេះ',
  formSubmitting: 'កំពុងរក្សាកៅអីលោកអ្នក...',
  formSuccessTitle: 'កៅអីលោកអ្នកបានរក្សាទុក',
  formSuccessDesc: (f) => `សូមអរគុណ។ ${f.coordinatorName} ពី KHB Events នឹងទូរស័ព្ទ ឬផ្ញើសារមកក្នុង ១៥ នាទី ដើម្បីបញ្ជាក់ព័ត៍មាន។`,
  formSuccessTelegramPrompt: 'ចង់លឿនជាង? បើក Telegram យើងបញ្ជាក់ក្នុងការជជែក។',
  option1Highlight: 'ឆ្លើយលឿនបំផុត · ផ្ញើកាលវិភាគ PDF ភ្លាម',
  regTag: 'កក់ជាអាទិភាព',
  passPreviewLabel: 'ប័ណ្ណប្រតិភូរបស់លោកអ្នក',
  instantBadge: 'កៅអីរក្សាទុកភ្លាម',
  businessFocusLabel: 'អាជីវកម្មលោកអ្នក',
  seatLabel: 'កៅអីលោកអ្នក',
  seatWord: 'កៅអី',
  seatsLeftNote: (left, total) => `នៅសល់ ${left} ក្នុង ${total} កៅអី`,
  secureNote: 'មិនបង់ប្រាក់ថ្ងៃនេះ · វិក្កយបត្រពន្ធផ្ញើតាម Telegram',
  orChat: 'ចង់និយាយមុនមែនទេ?',
  telegramDirectBtn: (f) => `ផ្ញើសារទៅ ${f.coordinatorName} តាម Telegram`,
  profileOptions: [
    { value: 'Cafe & Tea Business', label: 'ម៉ាកកាហ្វេ ឬតែ' },
    { value: 'Smart City & Retail Tech', label: 'Smart City / បច្ចេកវិទ្យា' },
    { value: 'Wholesale & Distribution', label: 'អ្នកលក់ដុំ / អ្នកនាំចូល' },
    { value: 'F&B Entrepreneur', label: 'អ្នកវិនិយោគ F&B' },
  ],

  // ── FAQ
  faqTag: 'មុនសម្រេចចិត្ត',
  faqTitle: 'សំណួរដែលម្ចាស់អាជីវកម្មសួរមុនកក់',
  faqSubtitle: 'បើសំណួរលោកអ្នកមិននៅទីនេះ សួរតាម Telegram ហើយបានចម្លើយក្នុងប៉ុន្មាននាទី។',
  faqs: (f) => [
    { q: 'តើខ្ញុំត្រូវការវីសាទៅវៀតណាមទេ?', a: 'អ្នកកាន់លិខិតឆ្លងដែនកម្ពុជា ចូលវៀតណាមដោយគ្មានវីសារហូតដល់ ៣០ ថ្ងៃ។ ក្រុមការងារយើងរៃបចំឯកសារចូលប្រទេស និងគយជូន។' },
    { q: 'តើខ្ញុំត្រូវបង់ប្រាក់ថ្ងៃនេះទេ?', a: `ទេ។ លោកអ្នកកក់ដោយឈ្មោះ និងលេខទូរស័ព្ទ។ ${f.coordinatorName} ទូរស័ព្ទមកក្នុង ១៥ នាទី ហើយលោកអ្នកបង់តៃក្រោយជើងហោះហើរ សណ្ឋាគារ និងកាលវិភាគរោងចក្របានបញ្ជាក់។` },
    { q: 'តើក្រុមហ៊ុនខ្ញុំអាចទទួលវិក្កយបត្រផ្លូវការទេ?', a: 'បាន។ យើងចេញវិក្កយបត្រពន្ធផ្លូវការសម្រាប់ក្រុមហ៊ុន។ សូមស្នើតាម Telegram ឬក្នុងការហៅបញ្ជាក់។' },
    { q: 'តើបន្ទប់សណ្ឋាគារជាបន្ទប់ឯកជនទេ?', a: 'តម្លៃរួមបញ្ចូលបន្ទប់ Twin ឬ Double រួមគ្នា។ បើចង់បានបន្ទប់តៃម្នាក់ សូមប្រាប់អ្នកសម្របសម្រួល យើងរៃបចំជូនក្នុងថ្លៃបន្ថែមតិចតួច។' },
    { q: 'បើកៅអីអស់មុនខ្ញុំសម្រេចចិត្ត?', a: `កៅអី ${f.totalSeats} អ្នកមកមុនបានមុន។ កៅអីដែលបានកក់ រក្សាទុកសម្រាប់ប្រតិភូនោះ។ អ្នកមកក្រោយចូលបញ្ជីរង់ចាំ ហើយកៅអីអាចមិនទំនេរឡើងវិញ។` },
    { q: `តើអ្វីមិនរួមបញ្ចូលក្នុង $${f.currentPrice}?`, a: 'អាហារថ្ងៃត្រង់ និងពេលល្ងាចក្រៅកម្មវិធី (អាហារលើកប៉ាល់ហាឡុងបេរួមបញ្ចូល) SIM វៀតណាម ធានារ៉ាប់រងដំណើរ និងការទិញឥវ៉ាន់ផ្ទាល់ខ្លួន។ ការរៃបចំដំណើរទាំងអស់រួមបញ្ចូល។' },
    { q: 'តើអាចដកប្រាក់វិញក្រោយបង់ទេ?', a: 'បាន។ លុបចោលយ៉ាងតិច ១៤ ថ្ងៃមុនចេញដំណើរ ហើយបើកៅអីលោកអ្នកមានអ្នកជំនួសពីបញ្ជីរង់ចាំ លោកអ្នកទទួលប្រាក់វិញពេញ។ ការលុបចោលដោយអ្នករៃបចំ សងវិញពេញជានិច្ច។' },
    { q: 'តើខ្ញុំត្រូវចេះអង់គ្លេស ឬវៀតណាមទេ?', a: 'ទេ។ មគ្គុទ្ទេសក៍ចេះខ្មែរ អង់គ្លេស និងវៀតណាម អង្គុយក្បែរលោកអ្នករាល់កិច្ចប្រជុំ និងការចរចា។' },
    { q: 'តើអាចនាំដៃគូ ឬបុគ្គលិកមកជាមួយទេ?', a: 'បាន។ ម្នាក់យកកៅអីមួយក្នុងតម្លៃដូចគ្នា។ សូមប្រាប់អ្នកសម្របសម្រួល ដើម្បីរៃបចំកៅអី និងបន្ទប់ជិតគ្នា។' },
    { q: 'តើលិខិតឆ្លងដែនខ្ញុំនៅមានសុពលភាពគ្រប់គ្រាន់ទេ?', a: 'វៀតណាមតម្រូវសុពលភាពយ៉ាងតិច ៦ ខៃពីថ្ងៃចូលប្រទេស។ សូមពិនិត្យថ្ងៃផុតកំណត់មុនកក់។' },
  ],

  // ── Final CTA and trust
  ctaTitle: (f) => f.seatsLeft > 0
    ? `នៅសល់ ${f.seatsLeft} កៅអី។ ម្ចាស់អាជីវកម្ម ${f.claimedSeats} នាក់បានចូលរួមហើយ។`
    : `កៅអី ${f.totalSeats} បានយកអស់ហើយ។ ចូលបញ្ជីរង់ចាំ។`,
  ctaSub: (f) => {
    switch (f.phase) {
      case 'early':
      case 'standard':
        return `ពេលកៅអីចុងក្រោយបានយក ការចុះឈ្មោះបិទ ទោះមុន ${f.registrationDeadline} ក៍ដោយ។ អ្នកផ្គត់ផ្គង់ដែលលោកអ្នកចង់បាន អាចចុះកិច្ចសន្យាជាមួយអ្នកនាំចូលដែលអង្គុយកៅអីនោះ។`;
      case 'final':
        return `ឡានក្រុងចេញដំណើរ ${f.departureDate}។ កៅអីនៅទំនេរបញ្ជាក់តាមទូរស័ព្ទ អ្នកមកមុនបានមុន។`;
      default:
        return 'ទុកលេខទូរស័ព្ទលោកអ្នក ហើយលោកអ្នកដឹងមុនគេអំពីដំណើរបន្ទាប់។';
    }
  },
  finalCtaBtn: (f) => f.seatsLeft > 0 ? 'កក់កៅអីខ្ញុំ មិនបង់ប្រាក់ថ្ងៃនេះ' : 'ចូលបញ្ជីរង់ចាំ',
  trustTitle: 'រៃបចំដោយ KHB Events កម្ពុជា',
  trustDesc: 'KHB Events & Media នាំម្ចាស់អាជីវកម្ម អ្នកនាំចូល និងអ្នកវិនិយោគកម្ពុជា ទៅរោងចក្រដែលបានផ្ទៀងផ្ទាត់ និងពិព័រណ៍ពាណិជ្ជកម្មក្នុងតំបន់ ជាមួយការគាំទ្រពេញលេញជាភាសាខ្មែរ អង់គ្លេស និងវៀតណាម ពីការហៅដំបូងរហូតដល់ជើងហោះហើរត្រឡប់មកផ្ទះ។',
  hotlineLabel: 'ទូរស័ព្ទ',
  telegramLabel: 'Telegram',
  footerText: '© 2026 KHB EVENTS Cambodia. រក្សាសិទ្ធិទាំងអស់។',
  footerLinks: { package: 'អ្វីដែលទទួលបាន', itinerary: 'កាលវិភាគ', seats: 'កៅអី', pricing: 'តម្លៃ', faq: 'សំណួរ' },

  // ── Delegate pass preview
  passTier: 'DELEGATE',
  passBrandSub: 'VIETNAM B2B DELEGATION 2026',
  passFrom: 'Phnom Penh',
  passTo: 'Hanoi / Halong Bay',
  passRouteDate: (f) => `DEPARTS ${f.departureDate.toUpperCase()}`,
  passNameLabel: 'DELEGATE',
  passSeatLabel: 'SEAT',
  passIndustryLabel: 'BUSINESS',
  passRateLabel: 'PRICE HELD',
  passRateValue: (f) => f.phase === 'early' ? `$${f.earlyBirdPrice} EARLY BIRD` : `$${f.currentPrice} STANDARD`,
  passGuest: 'ភ្ញៀវប្រតិភូ',
};

export const CONTENT: Record<'en' | 'kh', SmartCityCopy> = { en, kh };
