'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LandingPage, SystemSettings } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL CONSTANTS
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

// ─────────────────────────────────────────────────────────────────────────────
// BILINGUAL MOBILE UI CONTENT
// ─────────────────────────────────────────────────────────────────────────────
const STR = {
  en: {
    tabHome: 'Home',
    tabTrip: 'Itinerary',
    tabBook: 'Book',
    tabSeats: 'Seats',
    tabChat: 'Chat',
    homeBook: 'Reserve My Seat',
    totalBook: 'Lock In $499',
    matchLock: 'Lock This Track Into My Pass',
    finalBook: 'Claim Your Seat',
    tripBook: 'Book This Trip',
    seatBook: 'Book Now',
    barBtn: 'Reserve Seat',
    saveNote: 'save $51',
    sheetTitle: 'Reserve Your Seat',
    sheetSub: '30-second booking • no payment today',
    submitTxt: 'Confirm Reservation',
    submittingTxt: 'Holding your seat...',
    secureNote: '🔒 No payment now • Official invoice via Telegram',
    btnTg: 'Chat Instantly on Telegram',
    sTg: 'Confirm With Coordinator',
    seatLabel: 'Your Seat — tap to choose',
    selected: (n: number) => `Selected: <b>Seat #${n}</b>`,
    reservedLabel: 'Booked',
    availableLabel: 'Open',
    selectedLabel: 'Yours',
    resStat: (n: number) => `${n} Reserved`,
    availStat: (n: number) => `${n} Available`,
    earlyLabel: 'Early Bird $499 Ends In',
    earlySub: 'After the deadline price returns to $550',
    regLabel: 'Registration Closes In:',
    regSub: 'No further registrations after this deadline',
    suppliersTitle: "Suppliers You'll Meet",
    roiTitle: "Margins You'll Capture",
    sessionsTitle: 'Sessions Prepared',
    heroBadge: 'Exclusive B2B Delegation 2026',
    heroTitle: 'Smart City, Tea & Cafe Business Trip to Vietnam',
    heroSub: 'Come Home With Suppliers, Not Just Photos.',
    coreTitle: 'What This Trip Really Buys',
    coreValues: [
      { num: '01', title: 'Factory-Direct Power', desc: 'Cut 25%-35% off middleman markups. One container repays the trip.' },
      { num: '02', title: 'Face-to-Face Trust', desc: 'Inspect factory floors & QC labs before wiring a single dollar.' },
      { num: '03', title: 'Exclusive Territory', desc: 'Lock exclusive Cambodia distribution before competitors sign.' },
      { num: '04', title: '2026 Trends Early', desc: 'Two international expos in one trip — see next year\'s trends first.' }
    ],
    proofText: 'business owners have reserved their seats',
    valueTag: 'Everything Included',
    valueTitle: 'One Price. Nine Things Handled.',
    valueNote: 'Standalone value if booked yourself',
    valueTotal: '$910+',
    inclusions: [
      { id: 1, title: 'Roundtrip Flight Tickets', desc: 'Phnom Penh - Hanoi flights included.', val: 220 },
      { id: 2, title: 'Hotel Stay (3N / 4D)', desc: 'Premium twin/double sharing.', val: 150 },
      { id: 3, title: 'Daily Hotel Breakfast', desc: 'Buffet breakfast every morning.', val: 25 },
      { id: 4, title: 'Private AC Coach', desc: 'All transport in Vietnam.', val: 80 },
      { id: 5, title: 'Trilingual Business Guide', desc: 'Vietnamese, English & Khmer.', val: 60 },
      { id: 6, title: 'VIP Expo Passes', desc: 'Cafe Show & Smart City Expo.', val: 120 },
      { id: 7, title: 'Border Facilitation', desc: 'Immigration & customs assistance.', val: 40 },
      { id: 8, title: 'Direct Factory Visits', desc: 'Coffee/tea processing & wholesale hubs.', val: 150 },
      { id: 9, title: 'Halong Bay Cruise', desc: 'UNESCO cruise & seafood lunch.', val: 65 }
    ],
    matchTag: 'ROI Matchmaker',
    matchTitle: 'See Your Exact ROI Track',
    stepsTitle: 'Book in 3 Steps',
    steps: [
      { num: '1', title: 'Reserve Your Seat', desc: '30 seconds, no payment today.' },
      { num: '2', title: '15-Min Call', desc: 'Coordinator answers every question.' },
      { num: '3', title: 'Pack & Fly', desc: 'Oct 8-11: flights & tours handled.' }
    ],
    guaranteeTitle: 'Risk-Free Reservation',
    guaranteeText: 'You pay nothing until you have spoken with our team and confirmed it is right for your business. Full refund if trip is canceled.',
    testiTitle: 'From Previous Delegates',
    testimonials: [
      { name: 'Dara S.', role: 'Cafe Chain CEO', quote: 'I met 5 roasters in one day and cut my bean sourcing cost by 30%.' },
      { name: 'Sophea T.', role: 'Beverage Importer', quote: 'Seeing the factory floor built trust I could never get online. We signed an exclusive deal.' },
      { name: 'Vuthy K.', role: 'Retail Tech Investor', quote: 'The trilingual guide handled negotiations. We returned with two signed agreements.' }
    ],
    faqTitle: 'Questions Buyers Ask',
    faqs: [
      { q: 'Do I need a visa for Vietnam?', a: 'Cambodian passport holders enter Vietnam visa-free for up to 30 days.' },
      { q: 'Do I have to pay today?', a: 'No. You reserve with just name & phone. Pay only after confirmation call.' },
      { q: 'Can my company get an invoice?', a: 'Yes. We issue corporate billing and tax invoices.' },
      { q: 'Is the hotel private?', a: 'Twin sharing is included. Single private room available with small supplement.' }
    ],
    finalTitle: 'Only 11 Seats Left',
    finalSub: 'When the 30-seat cabin fills, registration closes.',
    trustDesc: 'KHB EVENTS & Media connects Cambodian entrepreneurs with verified manufacturers across the region.',
    seatsTitle: 'The 30-Seat Cabin',
    seatsSub: 'Pick any open seat — it syncs to your booking pass.',
    tripTitle: 'The 4-Day Experience',
    tripSub: 'Business matchmaking, expo discovery & UNESCO wonders.',
    gallery: [
      { img: '/photos/photo_2026-09-16_22-01-09 (2).jpg', badge: 'Hanoi Cafe Culture' },
      { img: '/photos/photo_2026-09-16_22-01-09 (7).jpg', badge: 'Halong Bay Cruise' },
      { img: '/photos/photo_2026-09-16_22-01-09 (4).jpg', badge: 'VIP Coach' },
      { img: '/photos/photo_2026-09-16_22-01-09 (6).jpg', badge: 'Sung Sot Cave' },
      { img: '/photos/photo_2026-09-16_22-01-09 (11).jpg', badge: 'Old Quarter' },
      { img: '/photos/photo_2026-09-16_22-01-09 (9).jpg', badge: 'Hoan Kiem Lake' }
    ],
    days: [
      { day: 1, title: 'Phnom Penh to Hanoi', date: 'Oct 8', events: ['17:45 Flight to Hanoi', '22:30 Hotel Check-in', '23:00 Hanoi Night Life'] },
      { day: 2, title: 'Cafe Show & B2B Matching', date: 'Oct 9', events: ['08:00 Breakfast', '10:00 Cafe Show Expo', '13:00 B2B Matching', '18:00 Old Quarter Dinner'] },
      { day: 3, title: 'Smart City Expo & Halong Bay', date: 'Oct 10', events: ['08:00 Breakfast', '10:00 Smart City Expo', '13:00 Factory Inspection', '15:30 Highway to Halong Bay'] },
      { day: 4, title: 'UNESCO Cruise & Return', date: 'Oct 11', events: ['07:30 Halong Bay Cruise + Lunch', '11:30 Transfer to Airport', '17:45 Flight to Phnom Penh'] }
    ],
    passGuest: 'GUEST',
    successTitle: 'Reservation Received!',
    successDesc: 'Our trip coordinator will contact you within 15 minutes to confirm.',
  },
  kh: {
    tabHome: 'ទំព័រដើម',
    tabTrip: 'កាលវិភាគ',
    tabBook: 'កក់កៅអី',
    tabSeats: 'កៅអី',
    tabChat: 'ជជែក',
    homeBook: 'កក់កៅអីរបស់ខ្ញុំ',
    totalBook: 'ចាក់សោ $499',
    matchLock: 'ចាក់សោវិស័យនេះ',
    finalBook: 'ទាមទារកៅអីរបស់លោកអ្នក',
    tripBook: 'កក់ដំណើរនេះ',
    seatBook: 'កក់ឥឡូវនេះ',
    barBtn: 'កក់កៅអី',
    saveNote: 'ចំណេញ $51',
    sheetTitle: 'កក់កៅអីរបស់លោកអ្នក',
    sheetSub: 'កក់ក្នុង ៣០ វិនាទី • មិនបង់ប្រាក់ថ្ងៃនេះ',
    submitTxt: 'បញ្ជាក់ការកក់',
    submittingTxt: 'កំពុងរក្សាទុកកៅអី...',
    secureNote: '🔒 មិនបង់ប្រាក់ឥឡូវ • វិក្កយបត្រផ្ញើតាម Telegram',
    btnTg: 'ជជែកភ្លាមៗតាម Telegram',
    sTg: 'បញ្ជាក់ជាមួយអ្នកសម្របសម្រួល',
    seatLabel: 'កៅអីរបស់លោកអ្នក — ចុចដើម្បីជ្រើសរើស',
    selected: (n: number) => `បានជ្រើសរើស៖ <b>កៅអី #${n}</b>`,
    reservedLabel: 'បានកក់',
    availableLabel: 'ទំនេរ',
    selectedLabel: 'របស់អ្នក',
    resStat: (n: number) => `${n} បានកក់`,
    availStat: (n: number) => `${n} នៅសល់`,
    earlyLabel: 'តម្លៃ Early Bird $499 ផុតកំណត់ក្នុង',
    earlySub: 'បន្ទាប់ពីកំណត់ តម្លៃត្រឡប់ទៅ $550 វិញ',
    regLabel: 'ការចុះឈ្មោះនឹងបិទក្នុង៖',
    regSub: 'គ្មានការចុះឈ្មោះបន្ថែម បន្ទាប់ពីកំណត់នេះ',
    suppliersTitle: 'អ្នកផ្គត់ផ្គង់ដែលនឹងជួប',
    roiTitle: 'ប្រាក់ចំណេញរំពឹងទុក',
    sessionsTitle: 'កម្មវិធីដែលបានរៀបចំ',
    heroBadge: 'ដំណើរទស្សនកិច្ច B2B ពិសេស ២០២៦',
    heroTitle: 'ដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម Smart City, Tea & Cafe នៅវៀតណាម',
    heroSub: 'ត្រឡប់មកវិញជាមួយដៃគូផ្គត់ផ្គង់ មិនមែនត្រឹមតែរូបថត។',
    coreTitle: 'អ្វីដែលដំណើរនេះនាំមកជូនអាជីវកម្ម',
    coreValues: [
      { num: '01', title: 'តម្លៃផ្ទាល់ពីរោងចក្រ', desc: 'កាត់បន្ថយ ២៥%-៣៥% ពីតម្លៃឈ្មួញកណ្តាល។ កុងតឺន័រមួយសងថ្លៃដំណើរវិញ។' },
      { num: '02', title: 'ទំនុកចិត្តដោយជួបផ្ទាល់', desc: 'ពិនិត្យមើលរោងចក្រ និងមន្ទីរពិសោធន៍ QC មុនពេលផ្ទេរប្រាក់។' },
      { num: '03', title: 'សិទ្ធិចែកចាយផ្តាច់មុខ', desc: 'កក់សិទ្ធិចែកចាយផ្តាច់មុខនៅកម្ពុជា មុនពេលដៃគូប្រកួតដណ្តើមបាន។' },
      { num: '04', title: 'និន្នាការថ្មីៗ ២០២៦', desc: 'ពិព័រណ៍អន្តរជាតិ ២ ក្នុងដំណើរតែមួយ — ស្គាល់ផលិតផលថ្មីៗមុនគេ។' }
    ],
    proofText: 'ម្ចាស់អាជីវកម្មបានកក់កៅអីរបស់ពួកគេរួចហើយ',
    valueTag: 'រួមបញ្ចូលទាំងអស់',
    valueTitle: 'តម្លៃតែមួយ។ ៩ ចំណុចពេញលេញ។',
    valueNote: 'តម្លៃប្រៀបធៀប បើរៀបចំដោយខ្លួនឯង',
    valueTotal: '$910+',
    inclusions: [
      { id: 1, title: 'សំបុត្រយន្តហោះទៅមក', desc: 'ភ្នំពេញ - ហាណូយ រួមបញ្ចូលរួចស្រេច។', val: 220 },
      { id: 2, title: 'សណ្ឋាគារប្រណិត (៣យប់ / ៤ថ្ងៃ)', desc: 'បន្ទប់ Twin/Double sharing។', val: 150 },
      { id: 3, title: 'អាហារពេលព្រឹកប៊ូហ្វេ', desc: 'រៀងរាល់ព្រឹកនៅសណ្ឋាគារ។', val: 25 },
      { id: 4, title: 'រថយន្តក្រុង VIP', desc: 'គ្រប់ការធ្វើដំណើរនៅវៀតណាម។', val: 80 },
      { id: 5, title: 'មគ្គុទេសក៍ ៣ ភាសា', desc: 'ខ្មែរ អង់គ្លេស វៀតណាម ជួយសម្រួលការចរចា។', val: 60 },
      { id: 6, title: 'សំបុត្រ VIP ចូលពិព័រណ៍', desc: 'Cafe Show & Smart City Expo។', val: 120 },
      { id: 7, title: 'សម្រួលបែបបទឆ្លងដែន', desc: 'ការសម្រួលបែបបទអន្តោប្រវេសន៍រហ័ស។', val: 40 },
      { id: 8, title: 'ទស្សនារោងចក្រផ្ទាល់', desc: 'កែច្នៃកាហ្វេ/តែ និងឃ្លាំងបោះដុំ។', val: 150 },
      { id: 9, title: 'កប៉ាល់ទេសចរណ៍ Halong Bay', desc: 'ទស្សនាបេតិកភណ្ឌ UNESCO & អាហារថ្ងៃត្រង់។', val: 65 }
    ],
    matchTag: 'ROI Matchmaker',
    matchTitle: 'មើលផ្លូវវិនិយោគរបស់លោកអ្នក',
    stepsTitle: 'កក់ក្នុង ៣ ជំហានងាយៗ',
    steps: [
      { num: '1', title: 'កក់កៅអីរបស់លោកអ្នក', desc: '៣០ វិនាទី មិនបង់ប្រាក់ថ្ងៃនេះ។' },
      { num: '2', title: 'ទូរស័ព្ទបញ្ជាក់ ១៥ នាទី', desc: 'អ្នកសម្របសម្រួលឆ្លើយគ្រប់សំណួរ។' },
      { num: '3', title: 'វេចបង្វេច & ហោះហើរ', desc: '៨-១១ តុលា៖ ជើងហោះហើរ & កម្មវិធីរួចរាល់។' }
    ],
    guaranteeTitle: 'ការកក់គ្មានហានិភ័យ',
    guaranteeText: 'លោកអ្នកមិនបង់ប្រាក់អ្វីទេ រហូតដល់បានជជែកជាមួយក្រុមការងារយើង។ បង្វិលប្រាក់ពេញ ប្រសិនបើអ្នករៀបចំបោះបង់ដំណើរ។',
    testiTitle: 'ពីអ្នកចូលរួមមុនៗ',
    testimonials: [
      { name: 'ដារ៉ា ស.', role: 'CEO ខ្សែហាងកាហ្វេ', quote: 'ខ្ញុំបានជួបរោងកិន ៥ ក្នុងមួយថ្ងៃ និងកាត់បន្ថយថ្លៃគ្រាប់ ៣០%។' },
      { name: 'សុភា ថ.', role: 'អ្នកនាំចូលភេសជ្ជៈ', quote: 'ការដើរមើលផ្ទៃរោងចក្រផ្ទាល់បង្កើតទំនុកចិត្តដែលអនឡាញមិនអាចផ្តល់បាន។' },
      { name: 'វុទ្ធី គ.', role: 'វិនិយោគិនបច្ចេកវិទ្យា', quote: 'មគ្គុទេសក៍ ៣ ភាសាសម្រួលការចរចាបានល្អណាស់។ យើងទទួលបានកិច្ចសន្យា ២ ភ្លាមៗ។' }
    ],
    faqTitle: 'សំណួរដែលគេសួរញឹកញាប់',
    faqs: [
      { q: 'តើខ្ញុំត្រូវការទិដ្ឋាការ (VISA) ទេ?', a: 'ជនជាតិខ្មែរអាចចូលវៀតណាមដោយគ្មានទិដ្ឋាការរហូតដល់ ៣០ ថ្ងៃ។' },
      { q: 'តើខ្ញុំត្រូវបង់ប្រាក់ថ្ងៃនេះទេ?', a: 'មិនទេ។ លោកអ្នកគ្រាន់តែបំពេញឈ្មោះ និងទូរស័ព្ទ។ ទូទាត់ពេលបញ្ជាក់ព័ត៌មានរួចរាល់។' },
      { q: 'តើអាចទទួលបានវិក្កយបត្រក្រុមហ៊ុនទេ?', a: 'បាទ/ចាស។ យើងចេញវិក្កយបត្រផ្លូវការសម្រាប់ក្រុមហ៊ុន។' },
      { q: 'តើសណ្ឋាគារជាបន្ទប់ឯកជនទេ?', a: 'កញ្ចប់រួមមានបន្ទប់ Twin sharing។ បន្ទប់ឯកជនទោលមានការបន្ថែមបន្តិចបន្តួច។' }
    ],
    finalTitle: 'នៅសល់ត្រឹម ១១ កៅអីប៉ុណ្ណោះ',
    finalSub: 'នៅពេលកណ្តុរកៅអី ៣០ ពេញ ការកក់នឹងបិទភ្លាមៗ។',
    trustDesc: 'KHB EVENTS & Media តភ្ជាប់សហគ្រិនកម្ពុជាទៅនឹងរោងចក្រដែលបានផ្ទៀងផ្ទាត់នៅតំបន់នេះ។',
    seatsTitle: 'កណ្តុរកៅអី ៣០',
    seatsSub: 'ជ្រើសរើសកៅអីទំនេរណាមួយ — វានឹងធ្វើសមកាលជាមួយកាតកក់របស់លោកអ្នក។',
    tripTitle: 'បទពិសោធន៍ ៤ ថ្ងៃ ៣ យប់',
    tripSub: 'ជំនួបពាណិជ្ជកម្ម ពិព័រណ៍អន្តរជាតិ និងតំបន់ UNESCO។',
    gallery: [
      { img: '/photos/photo_2026-09-16_22-01-09 (2).jpg', badge: 'វប្បធម៌កាហ្វេហាណូយ' },
      { img: '/photos/photo_2026-09-16_22-01-09 (7).jpg', badge: 'កប៉ាល់ហាឡុងបេ' },
      { img: '/photos/photo_2026-09-16_22-01-09 (4).jpg', badge: 'រថយន្ត VIP' },
      { img: '/photos/photo_2026-09-16_22-01-09 (6).jpg', badge: 'រូងភ្នំ Sung Sot' },
      { img: '/photos/photo_2026-09-16_22-01-09 (11).jpg', badge: 'ផ្លូវបុរាណហាណូយ' },
      { img: '/photos/photo_2026-09-16_22-01-09 (9).jpg', badge: 'បឹង Hoan Kiem' }
    ],
    days: [
      { day: 1, title: 'ភ្នំពេញ ទៅ ហាណូយ', date: '៨ តុលា', events: ['17:45 ហោះហើរទៅហាណូយ', '22:30 Check-in សណ្ឋាគារ', '23:00 ដើរទស្សនារាត្រី'] },
      { day: 2, title: 'Cafe Show & B2B Matching', date: '៩ តុលា', events: ['08:00 អាហារពេលព្រឹក', '10:00 ពិព័រណ៍ Cafe Show', '13:00 B2B Matching', '18:00 ញ៉ាំអាហារផ្លូវចាស់'] },
      { day: 3, title: 'Smart City Expo & Halong Bay', date: '១០ តុលា', events: ['08:00 អាហារពេលព្រឹក', '10:00 Smart City Expo', '13:00 ទស្សនារោងចក្រកាហ្វេ', '15:30 ធ្វើដំណើរទៅ Halong Bay'] },
      { day: 4, title: 'កប៉ាល់ UNESCO & ត្រឡប់មកវិញ', date: '១១ តុលា', events: ['07:30 ជិះកប៉ាល់ Halong Bay + អាហារថ្ងៃត្រង់', '11:30 ទៅព្រលានយន្តហោះ', '17:45 ហោះហើរមកភ្នំពេញ'] }
    ],
    passGuest: 'ភ្ញៀវ',
    successTitle: 'ទទួលបានការចុះឈ្មោះជោគជ័យ!',
    successDesc: 'អ្នកសម្របសម្រួលយើងនឹងទាក់ទងមកលោកអ្នកក្នុងរយៈពេល ១៥ នាទី។',
  }
};

const MATCH_DATA = {
  cafe: {
    en: {
      suppliers: ['40+ Direct Coffee Roasters (Da Lat & Buon Ma Thuot)', 'Organic Green, Oolong & Lotus Tea Estates', 'Commercial Espresso Machines & Roasting Tools', 'Biodegradable Cups & Artisan Syrups'],
      roi: ['25% - 35% cost reduction direct from origin', 'Exclusive distribution rights for Cambodia', '2026 trending beverage recipes & smart tech'],
      sessions: ['VIP Cafe Show Vietnam all-access', 'Private coffee roasting factory inspection', 'Pre-arranged 1-on-1 supplier matching with interpreter']
    },
    kh: {
      suppliers: ['រោងចក្រកិនកាហ្វេ 40+ (Da Lat & Buon Ma Thuot)', 'ចំការតែធម្មជាតិកម្រិតខ្ពស់ អ៊ូឡុង & ផ្កាឈូក', 'ម៉ាស៊ីនឆុងកាហ្វេខ្នាតធំ និងឧបករណ៍ទំនើប', 'កែវការពារបរិស្ថាន និងស៊ីរ៉ូពិសេស'],
      roi: ['កាត់បន្ថយថ្លៃដើម ២៥% - ៣៥% ផ្ទាល់ពីរោងចក្រ', 'ឱកាសទទួលបានសិទ្ធិចែកចាយផ្តាច់មុខនៅកម្ពុជា', 'រូបមន្តភេសជ្ជៈថ្មីៗ ២០២៦ និងបច្ចេកវិទ្យាឆុង'],
      sessions: ['សំបុត្រ VIP ចូលពិព័រណ៍ Cafe Show ពេញលេញ', 'ទស្សនកិច្ចរោងចក្រកែច្នៃកាហ្វេផ្ទាល់ នៅថ្ងៃទី ៣', 'ជំនួបផ្គូផ្គង B2B ជាមួយអ្នកបកប្រែផ្ទាល់']
    }
  },
  tech: {
    en: {
      suppliers: ['Self-checkout kiosks, digital signage & POS', 'IoT & Intelligent architectural LED lighting', 'Facial recognition, ANPR vehicle tracking & CCTV', 'Cloud enterprise hardware & logistics sensors'],
      roi: ['Factory-direct OEM/ODM with your brand logo', 'First to introduce smart store tech to Cambodia', 'Manufacturer SLA and spare parts backing'],
      sessions: ['VIP Pass to Hanoi Smart City Expo 2026', 'Executive talks with infrastructure suppliers', 'AI retail & automated store showcase']
    },
    kh: {
      suppliers: ['ទូទូទាត់ប្រាក់ស្វ័យប្រវត្ត Kiosk & POS', 'ប្រព័ន្ធ IoT និងអំពូលឆ្លាតវៃ', 'ប្រព័ន្ធស្កេនមុខសុវត្ថិភាព និងកាមេរ៉ាឆ្លាតវៃ', 'ផ្នែករឹងគ្រប់គ្រងឃ្លាំង និងភស្តុភារ'],
      roi: ['តម្លៃផ្ទាល់ពីរោងចក្រ OEM/ODM ដាក់ម៉ាកខ្លួនឯង', 'នាំយកបច្ចេកវិទ្យាហាងឆ្លាតវៃមកកម្ពុជាមុនគេ', 'កិច្ចសន្យាធានា និងគ្រឿងបន្លាស់ពីរោងចក្រ'],
      sessions: ['សំបុត្រ VIP ពិព័រណ៍ Smart City Expo ហាណូយ', 'ជំនួបធុរកិច្ច B2B ហេដ្ឋារចនាសម្ព័ន្ធឆ្លាតវៃ', 'ទស្សនាការបង្ហាញដំណោះស្រាយ AI លក់រាយ']
    }
  },
  distributor: {
    en: {
      suppliers: ['Multi-ton bulk coffee beans & beverage powders', 'Commercial stainless steel kitchenware & ice makers', 'Private-label fast turnaround canning & bottling', 'Established Vietnamese brands seeking exporters'],
      roi: ['Container-level pricing at export tier', 'Custom packaging and private label printing', 'Guidance on cross-border logistics & customs'],
      sessions: ['Roundtable with Vietnam Export Association', 'Guided factory floor & QC lab inspection', 'MOQ negotiations and sample shipments']
    },
    kh: {
      suppliers: ['ការផ្គត់ផ្គង់បោះដុំគ្រាប់កាហ្វេ & ម្សៅភេសជ្ជៈរាប់តោន', 'ឧបករណ៍ផ្ទះបាយពាណិជ្ជកម្ម និងទូត្រជាក់ធំៗ', 'រោងចក្រ OEM ច្រកកំប៉ុង និងដបតាមតម្រូវការ', 'ប្រេនល្បីៗនៅវៀតណាមស្វែងរកដៃគូនាំចេញ'],
      roi: ['តម្លៃបោះដុំកម្រិតទូកុងតឺន័រផ្ទាល់ពីរោងចក្រ', 'បោះពុម្ពម៉ាកយីហោផ្ទាល់ខ្លួន (Private Label)', 'ការប្រឹក្សាបែបបទគយ និងការដឹកជញ្ជូនឆ្លងដែន'],
      sessions: ['កិច្ចពិភាក្សាជាមួយសមាគមនាំចេញវៀតណាម', 'ទស្សនកិច្ចខ្សែសង្វាក់ផលិតកម្ម និងបន្ទប់ QC', 'ការជួយចរចាបរិមាណ MOQ និងផ្ញើសំណាកគំរូ']
    }
  }
};

const HERO_SLIDES = [
  '/photos/photo_2026-09-16_22-01-09 (2).jpg',
  '/photos/photo_2026-09-16_22-01-09 (7).jpg',
  '/photos/photo_2026-09-16_22-01-09 (4).jpg',
  '/photos/photo_2026-09-16_22-01-09 (6).jpg',
];

export default function SmartCityAppView({ page, settings, initialLang }: { page?: LandingPage; settings?: SystemSettings; initialLang?: 'en' | 'kh' } = {}) {
  const [lang, setLang] = useState<'en' | 'kh'>(initialLang || 'en');
  const [activeTab, setActiveTab] = useState<'home' | 'trip' | 'seats'>('home');
  const [heroSlide, setHeroSlide] = useState(0);
  const [activeProfile, setActiveProfile] = useState<'cafe' | 'tech' | 'distributor'>('cafe');
  const [activeDay, setActiveDay] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState(20);

  // Dynamic overrides
  const effTotalSeats = page?.urgency?.totalSeats ?? GENERAL.totalSeats;
  const effClaimedSeats = page?.urgency?.claimedSeats ?? GENERAL.claimedSeats;
  const effEarlyBirdPrice = page?.urgency?.earlyBirdPrice ? (Number(page.urgency.earlyBirdPrice) || GENERAL.earlyBirdPrice) : GENERAL.earlyBirdPrice;
  const effRegularPrice = page?.urgency?.regularPrice ? (Number(page.urgency.regularPrice) || GENERAL.regularPrice) : GENERAL.regularPrice;
  const effEarlyBirdDeadline = page?.urgency?.earlyBirdDeadline || GENERAL.earlyBirdDeadline;
  const effRegistrationDeadline = page?.urgency?.registrationDeadline || GENERAL.registrationDeadline;
  const effTgUsername = settings?.telegramUsername || GENERAL.contactTelegramUsername;
  const effPhone = settings?.phone || GENERAL.contactPhone;
  const effTgUrl = settings?.telegramUsername 
    ? `https://t.me/${settings.telegramUsername.replace('@', '')}` 
    : GENERAL.contactTelegramUrl;

  const [claimedSeats, setClaimedSeats] = useState(effClaimedSeats);

  useEffect(() => {
    if (page?.urgency?.claimedSeats !== undefined) {
      setClaimedSeats(page.urgency.claimedSeats);
    }
  }, [page?.urgency?.claimedSeats]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'kh' || urlLang === 'en') {
        setLang(urlLang);
      } else if (initialLang) {
        setLang(initialLang);
      } else {
        const saved = localStorage.getItem('khb_lang');
        if (saved === 'kh' || saved === 'en') setLang(saved);
      }
    } catch {}
  }, []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [countdown, setCountdown] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regProfile, setRegProfile] = useState('Cafe & Tea Business');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [a2hsDismissed, setA2hsDismissed] = useState(false);

  const heroSlides = (page?.gallery && page.gallery.length > 0)
    ? (page.heroImage && !page.gallery.includes(page.heroImage) ? [page.heroImage, ...page.gallery] : page.gallery)
    : (page?.heroImage ? [page.heroImage, ...HERO_SLIDES.filter(s => s !== page.heroImage)] : HERO_SLIDES);

  const s = STR[lang];
  const match = MATCH_DATA[activeProfile][lang];

  // Hero slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % (heroSlides.length || 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Countdown timer
  useEffect(() => {
    const target = new Date(effEarlyBirdDeadline).getTime();
    function tick() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      setCountdown({
        d: String(d).padStart(2, '0'),
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(sec).padStart(2, '0'),
      });
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [effEarlyBirdDeadline]);

  const openBooking = (seatNum?: number) => {
    if (seatNum && seatNum > claimedSeats) {
      setSelectedSeat(seatNum);
    }
    setSubmitted(false);
    setSheetOpen(true);
  };

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
          landingPageSlug: page?.slug || 'smart-city-tea-cafe',
          landingPageTitle: page?.title || 'Smart City, Tea & Cafe Delegation (Mobile App)',
          source: 'mobile_app',
          message: `Seat #${selectedSeat} | Profile: ${regProfile}`,
          packageInterest: `Early Bird $${effEarlyBirdPrice}`,
          customFields: { seat: String(selectedSeat), profile: regProfile }
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setClaimedSeats(prev => Math.min(prev + 1, effTotalSeats));
      } else {
        alert(data.error || 'Submission failed. Please try again.');
      }
    } catch {
      alert('Network error. Please chat directly on Telegram.');
    } finally {
      setSubmitting(false);
    }
  };

  const passName = regName.trim() ? regName.toUpperCase() : (lang === 'kh' ? 'ភ្ញៀវប្រតិភូ' : 'GUEST DELEGATE');
  const availableSeats = Array.from({ length: effTotalSeats }, (_, i) => i + 1).filter(n => n > claimedSeats);

  return (
    <div className={`app-shell-root${lang === 'kh' ? ' lang-kh' : ''}`}>
      {/* Fake Mobile Device Container */}
      <div className="mobile-frame">

        {/* ═══════════════════════════════════════════
            TOP APP BAR
        ═══════════════════════════════════════════ */}
        <header className="app-bar">
          <div className="bar-brand">
            <span className="brand-badge">KHB</span>
            <span className="brand-name">KHB Events</span>
          </div>
          <div className="bar-actions">
            <Link href="/smart-city-tea-cafe" className="bar-btn-chip" title="Switch to Full Web Landing Page">
              🌐 Web View
            </Link>
            <div className="app-lang-switch">
              <button className={`l-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
              <button className={`l-btn${lang === 'kh' ? ' active' : ''}`} onClick={() => setLang('kh')}>ខ្មែរ</button>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════
            MAIN SCROLLABLE CONTAINER
        ═══════════════════════════════════════════ */}
        <main className="app-main">

          {/* ────────── TAB: HOME ────────── */}
          {activeTab === 'home' && (
            <section className="app-page active" id="page-home">
              {/* Mini Hero */}
              <div className="app-hero">
                <div className="app-hero-slider">
                  {heroSlides.map((src, idx) => (
                    <div
                      key={idx}
                      className={`app-hero-slide${heroSlide === idx ? ' active' : ''}`}
                      style={{ backgroundImage: `url('${src}')` }}
                    />
                  ))}
                </div>
                <div className="app-hero-overlay" />
                <div className="app-hero-body">
                  <span className="app-hero-badge">
                    <i className="dot" />
                    <span>{lang === 'kh' ? (page?.translations?.kh?.badge || s.heroBadge) : (page?.badge || s.heroBadge)}</span>
                  </span>
                  <h1>{lang === 'kh' ? (page?.translations?.kh?.heroHeadline || page?.translations?.kh?.title || s.heroTitle) : (page?.heroHeadline || page?.title || s.heroTitle)}</h1>
                  <p className="app-hero-sub">{lang === 'kh' ? (page?.translations?.kh?.heroSubheadline || page?.translations?.kh?.description || s.heroSub) : (page?.heroSubheadline || page?.description || s.heroSub)}</p>
                  <div className="app-price-chip">
                    <s>${effRegularPrice}</s>
                    <b>${effEarlyBirdPrice}</b>
                    <span className="chip-save">save ${Math.max(0, effRegularPrice - effEarlyBirdPrice)}</span>
                  </div>
                  <button className="app-cta pressable" onClick={() => openBooking()}>
                    <span>{s.homeBook}</span>
                  </button>
                  <button className="app-link pressable" onClick={() => setActiveTab('trip')}>
                    {lang === 'kh' ? 'មើលកាលវិភាគពេញលេញ →' : 'See the full itinerary →'}
                  </button>
                </div>
              </div>

              {/* Core Value Horizontal Snap Cards */}
              <div className="app-section">
                <div className="app-section-head">
                  <h2>{s.coreTitle}</h2>
                </div>
                <div className="h-scroll">
                  {s.coreValues.map((v, i) => (
                    <div key={i} className="core-card-v pressable">
                      <span className="core-num-badge">{v.num}</span>
                      <h4>{v.title}</h4>
                      <p>{v.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proof strip */}
              <div className="app-proof">
                <div className="app-avatar-stack">
                  {['DS', 'ST', 'VK', 'MR', 'KL'].map((init, i) => (
                    <span key={i} className="avatar-chip">{init}</span>
                  ))}
                </div>
                <p><b>{claimedSeats}</b> <span>{s.proofText}</span></p>
              </div>

              {/* Value stack */}
              <div className="app-section">
                <div className="app-section-head">
                  <span className="app-tag">{s.valueTag}</span>
                  <h2>{s.valueTitle}</h2>
                </div>
                <div className="v-list">
                  {s.inclusions.map(item => (
                    <div key={item.id} className="v-item">
                      <div className="v-num">{item.id}</div>
                      <div className="v-body">
                        <b>{item.title}</b>
                        <p>{item.desc}</p>
                      </div>
                      <div className="v-val">${item.val}</div>
                    </div>
                  ))}
                </div>
                <div className="app-total-card">
                  <div className="total-row">
                    <span>{s.valueNote}</span>
                    <s>{s.valueTotal}</s>
                  </div>
                  <div className="total-row main">
                    <span>{lang === 'kh' ? 'តម្លៃ Early Bird របស់អ្នក' : 'Your early bird price'}</span>
                    <b>${GENERAL.earlyBirdPrice}</b>
                  </div>
                  <button className="app-cta pressable" onClick={() => openBooking()}>
                    <span>{s.totalBook}</span>
                  </button>
                  <p className="secure-note">{s.secureNote}</p>
                </div>
              </div>

              {/* ROI Matchmaker */}
              <div className="app-section dark">
                <div className="app-section-head">
                  <span className="app-tag gold">{s.matchTag}</span>
                  <h2>{s.matchTitle}</h2>
                </div>
                <div className="seg">
                  <button className={`seg-btn${activeProfile === 'cafe' ? ' active' : ''}`} onClick={() => setActiveProfile('cafe')}>☕ Cafe</button>
                  <button className={`seg-btn${activeProfile === 'tech' ? ' active' : ''}`} onClick={() => setActiveProfile('tech')}>🏙 Tech</button>
                  <button className={`seg-btn${activeProfile === 'distributor' ? ' active' : ''}`} onClick={() => setActiveProfile('distributor')}>🏭 Wholesale</button>
                </div>
                <div className="match-panel">
                  <div className="mp-group">
                    <h5>🏭 {s.suppliersTitle}</h5>
                    <ul>
                      {match.suppliers.map((item, i) => (
                        <li key={i}>✓ {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mp-group">
                    <h5>📈 {s.roiTitle}</h5>
                    <ul>
                      {match.roi.map((item, i) => (
                        <li key={i}>⚡ {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mp-group">
                    <h5>🤝 {s.sessionsTitle}</h5>
                    <ul>
                      {match.sessions.map((item, i) => (
                        <li key={i}>🎯 {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button className="app-cta outline pressable" onClick={() => openBooking()}>
                  <span>{s.matchLock}</span>
                </button>
              </div>

              {/* Steps */}
              <div className="app-section">
                <div className="app-section-head">
                  <h2>{s.stepsTitle}</h2>
                </div>
                <div className="steps-mini">
                  {s.steps.map(step => (
                    <div key={step.num} className="step-chip">
                      <span className="s-num">{step.num}</span>
                      <div>
                        <b>{step.title}</b>
                        <p>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantee */}
              <div className="app-guarantee">
                <div className="g-icon">🛡️</div>
                <div>
                  <h3>{s.guaranteeTitle}</h3>
                  <p>{s.guaranteeText}</p>
                </div>
              </div>

              {/* Testimonials */}
              <div className="app-section">
                <div className="app-section-head">
                  <h2>{s.testiTitle}</h2>
                </div>
                <div className="h-scroll">
                  {s.testimonials.map((t, idx) => (
                    <div key={idx} className="testi-card">
                      <div className="stars">★★★★★</div>
                      <p>&ldquo;{t.quote}&rdquo;</p>
                      <div className="testi-meta">
                        <b>{t.name}</b>
                        <small>{t.role}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div className="app-section">
                <div className="app-section-head">
                  <h2>{s.faqTitle}</h2>
                </div>
                <div className="faq-list">
                  {s.faqs.map((f, i) => (
                    <div key={i} className={`faq-item${faqOpen === i ? ' open' : ''}`}>
                      <button className="faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                        <span>{f.q}</span>
                        <span>{faqOpen === i ? '−' : '+'}</span>
                      </button>
                      {faqOpen === i && <div className="faq-a">{f.a}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Final CTA */}
              <div className="app-final">
                <div className="final-fire">🔥</div>
                <h2>{s.finalTitle}</h2>
                <p>{s.finalSub}</p>
                <button className="app-cta pressable" onClick={() => openBooking()}>
                  <span>{s.finalBook}</span>
                </button>
              </div>

              {/* Trust */}
              <div className="app-trust">
                <img src="/images/khb-logo.png" className="trust-logo" alt="KHB EVENTS" width={140} height={35} />
                <p>{s.trustDesc}</p>
                <div className="trust-links">
                  <a href={`tel:${GENERAL.contactPhone.replace(/\s/g, '')}`} className="trust-pill pressable">📞 Hotline</a>
                  <a href={GENERAL.contactTelegramUrl} target="_blank" rel="noreferrer" className="trust-pill pressable">✈️ Telegram</a>
                </div>
              </div>
            </section>
          )}

          {/* ────────── TAB: TRIP (Itinerary) ────────── */}
          {activeTab === 'trip' && (
            <section className="app-page active" id="page-trip">
              <div className="app-page-head">
                <h1>{s.tripTitle}</h1>
                <p>{s.tripSub}</p>
              </div>

              {/* Gallery Grid */}
              <div className="gallery-grid">
                {s.gallery.map((g, i) => (
                  <div key={i} className="gallery-card">
                    <img src={g.img} alt={g.badge} loading="lazy" />
                    <span className="g-badge">{g.badge}</span>
                  </div>
                ))}
              </div>

              {/* Day segments */}
              <div className="seg seg-days">
                {s.days.map((d, i) => (
                  <button key={d.day} className={`seg-btn${activeDay === i ? ' active' : ''}`} onClick={() => setActiveDay(i)}>
                    Day {d.day}
                  </button>
                ))}
              </div>

              {/* Day details */}
              <div className="day-card">
                <div className="day-head">
                  <span className="day-badge">{s.days[activeDay].date}</span>
                  <h3>{s.days[activeDay].title}</h3>
                </div>
                <ul className="day-events">
                  {s.days[activeDay].events.map((ev, ei) => (
                    <li key={ei} className="day-act">
                      <span className="dot" />
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="app-cta pressable" onClick={() => openBooking()} style={{ margin: '20px 16px 28px' }}>
                <span>{s.tripBook}</span>
              </button>
            </section>
          )}

          {/* ────────── TAB: SEATS ────────── */}
          {activeTab === 'seats' && (
            <section className="app-page active" id="page-seats">
              <div className="app-page-head">
                <h1>{s.seatsTitle}</h1>
                <p>{s.seatsSub}</p>
              </div>

              {/* Urgency countdown */}
              <div className="urgency-card">
                <div className="u-head">
                  <span className="u-fire">🔥</span>
                  <div>
                    <b>{s.earlyLabel}</b>
                    <small>{s.earlySub}</small>
                  </div>
                </div>
                <div className="u-timer">
                  <div className="u-box"><b>{countdown.d}</b><span>Days</span></div>
                  <div className="u-box"><b>{countdown.h}</b><span>Hrs</span></div>
                  <div className="u-box"><b>{countdown.m}</b><span>Min</span></div>
                  <div className="u-box"><b>{countdown.s}</b><span>Sec</span></div>
                </div>
              </div>

              {/* Seat Cabin */}
              <div className="seat-card">
                <div className="seat-stats">
                  <span className="ss reserved"><i /><span>{s.resStat(claimedSeats)}</span></span>
                  <span className="ss available"><i /><span>{s.availStat(Math.max(0, effTotalSeats - claimedSeats))}</span></span>
                </div>
                <div className="seat-grid">
                  {Array.from({ length: effTotalSeats }, (_, i) => i + 1).map(n => {
                    const isReserved = n <= claimedSeats;
                    const isSelected = !isReserved && n === selectedSeat;
                    const cls = `s-box ${isReserved ? 'reserved' : isSelected ? 'selected' : 'available'}`;
                    return (
                      <button
                        key={n}
                        className={cls}
                        onClick={() => !isReserved && setSelectedSeat(n)}
                        disabled={isReserved}
                      >
                        <b>#{n}</b>
                        <small>{isReserved ? s.reservedLabel : isSelected ? s.selectedLabel : s.availableLabel}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected bar */}
              <div className="selected-bar">
                <span dangerouslySetInnerHTML={{ __html: s.selected(selectedSeat) }} />
                <button className="app-cta small pressable" onClick={() => openBooking(selectedSeat)}>
                  {s.seatBook}
                </button>
              </div>
            </section>
          )}

        </main>

        {/* ═══════════════════════════════════════════
            STICKY BOOKING BAR
        ═══════════════════════════════════════════ */}
        <div className="book-bar">
          <div className="bar-price">
            <s>${effRegularPrice}</s>
            <b>${effEarlyBirdPrice}</b>
            <small>save ${Math.max(0, effRegularPrice - effEarlyBirdPrice)}</small>
          </div>
          <button className="bar-btn pressable" onClick={() => openBooking()}>
            <span>{s.barBtn}</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════
            BOTTOM TAB BAR
        ═══════════════════════════════════════════ */}
        <nav className="tab-bar">
          <button className={`tab-item${activeTab === 'home' ? ' active' : ''}`} onClick={() => setActiveTab('home')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>
            <span>{s.tabHome}</span>
          </button>
          <button className={`tab-item${activeTab === 'trip' ? ' active' : ''}`} onClick={() => setActiveTab('trip')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 20l-5.5-2.5V4L9 6.5 15 4l5.5 2.5V20L15 17.5 9 20z"/><path d="M9 6.5V20M15 4v13.5"/></svg>
            <span>{s.tabTrip}</span>
          </button>
          <button className="tab-item tab-book" onClick={() => openBooking()} aria-label="Book now">
            <span className="book-fab">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M2.5 19.5L21 12 2.5 4.5l2.5 6-2.5 9z" transform="rotate(45 12 12)"/></svg>
            </span>
            <span>{s.tabBook}</span>
          </button>
          <button className={`tab-item${activeTab === 'seats' ? ' active' : ''}`} onClick={() => setActiveTab('seats')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>
            <span>{s.tabSeats}</span>
          </button>
          <a className="tab-item" href={effTgUrl} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .27z"/></svg>
            <span>{s.tabChat}</span>
          </a>
        </nav>

        {/* ═══════════════════════════════════════════
            BOOKING BOTTOM SHEET
        ═══════════════════════════════════════════ */}
        <div className={`sheet-backdrop${sheetOpen ? ' active' : ''}`} onClick={() => setSheetOpen(false)} />
        <div className={`bottom-sheet${sheetOpen ? ' active' : ''}`} role="dialog" aria-label="Booking sheet">
          <div className="sheet-handle" />
          <div className="sheet-head">
            <div>
              <b className="sheet-title">{s.sheetTitle}</b>
              <small className="sheet-sub">{s.sheetSub}</small>
            </div>
            <button className="sheet-close pressable" onClick={() => setSheetOpen(false)} aria-label="Close">✕</button>
          </div>

          {/* Live Mini VIP Pass */}
          <div className="mini-pass">
            <div className="mp-route">
              <b>PNH</b>
              <i>✈</i>
              <b>HAN</b>
              <span>OCT 8-11</span>
            </div>
            <div className="mp-grid">
              <div>
                <small>Name</small>
                <b>{passName}</b>
              </div>
              <div>
                <small>Seat</small>
                <b className="gold">#{selectedSeat}</b>
              </div>
              <div>
                <small>Rate</small>
                <b className="gold">${effEarlyBirdPrice}</b>
              </div>
            </div>
          </div>

          {!submitted ? (
            <form className="sheet-form" onSubmit={handleSubmit}>
              <label className="f-label">{lang === 'kh' ? 'ឈ្មោះពេញរបស់អ្នក *' : 'Your Full Name *'}</label>
              <input
                type="text"
                className="f-input"
                placeholder={lang === 'kh' ? 'ឧ. សុខ សុវណ្ណ' : 'e.g. Sok Sovann'}
                value={regName}
                onChange={e => setRegName(e.target.value)}
                required
              />

              <label className="f-label">{lang === 'kh' ? 'លេខទូរស័ព្ទ (Telegram/WhatsApp) *' : 'Phone (Telegram / WhatsApp) *'}</label>
              <input
                type="tel"
                className="f-input"
                placeholder="012 345 678"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                required
              />

              <label className="f-label">{lang === 'kh' ? 'វិស័យអាជីវកម្ម' : 'Business Focus'}</label>
              <select className="f-input" value={regProfile} onChange={e => setRegProfile(e.target.value)}>
                <option value="Cafe & Tea Business">Cafe &amp; Tea Brand</option>
                <option value="Smart City & Retail Tech">Smart City / Tech</option>
                <option value="Wholesale & Distribution">Wholesaler / Importer</option>
                <option value="F&B Entrepreneur">F&amp;B Investor</option>
              </select>

              <label className="f-label">{s.seatLabel}</label>
              <div className="seat-chips">
                {availableSeats.map(n => (
                  <button
                    type="button"
                    key={n}
                    className={`seat-chip${selectedSeat === n ? ' active' : ''}`}
                    onClick={() => setSelectedSeat(n)}
                  >
                    #{n}
                  </button>
                ))}
              </div>

              <button type="submit" className="app-cta full pressable" disabled={submitting}>
                <span>{submitting ? s.submittingTxt : s.submitTxt}</span>
              </button>
              <p className="secure-note">{s.secureNote}</p>
            </form>
          ) : (
            <div className="sheet-success" style={{ display: 'block' }}>
              <div className="s-icon">✓</div>
              <b>{s.successTitle}</b>
              <p>{s.successDesc}</p>
              <div className="s-seat">Seat #{selectedSeat} Held</div>
              <a href={GENERAL.contactTelegramUrl} target="_blank" rel="noreferrer" className="btn-tg pressable">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .27z"/></svg>
                <span>{s.sTg}</span>
              </a>
            </div>
          )}

          {!submitted && (
            <div className="sheet-alt">
              <div className="tg-or"><span>or</span></div>
              <a href={GENERAL.contactTelegramUrl} target="_blank" rel="noreferrer" className="btn-tg pressable">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .27z"/></svg>
                <span>{s.btnTg}</span>
              </a>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            A2HS HINT
        ═══════════════════════════════════════════ */}
        {!a2hsDismissed && (
          <div className="a2hs-hint show">
            <span>📲 {lang === 'kh' ? 'បន្ថែមទៅ Home Screen សម្រាប់ការកក់ងាយស្រួល' : 'Add to Home Screen for one-tap booking'}</span>
            <button id="a2hs-close" onClick={() => setA2hsDismissed(true)} aria-label="Dismiss">✕</button>
          </div>
        )}

      </div>
    </div>
  );
}
