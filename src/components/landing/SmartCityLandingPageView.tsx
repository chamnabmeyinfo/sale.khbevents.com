'use client';

import { companyFor } from '@/lib/company';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LandingPage, PopupAd, SystemSettings } from '@/lib/types';
import LandingPageTracking, { trackLandingEvent } from '@/components/common/LandingPageTracking';
import PopupAdsHost from '@/components/common/PopupAds';
import { popupStorageKeys } from '@/lib/popup-ads';
import FlagIcon from '@/components/common/FlagIcon';
import { safeRedirectUrl } from '@/lib/safe-url';
import { readUtmParams } from '@/lib/utm';
import { currentSeatPrice } from '@/lib/seat-price';

import { CONTENT, GENERAL, type PageFacts, type SalePhase } from './smart-city-content';

/** Days, hours, minutes and seconds left in `diffMs`, zero-padded for display. */
function countdownParts(diffMs: number) {
  const diff = Math.max(0, diffMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    d: pad(Math.floor(diff / 86400000)),
    h: pad(Math.floor((diff % 86400000) / 3600000)),
    m: pad(Math.floor((diff % 3600000) / 60000)),
    s: pad(Math.floor((diff % 60000) / 1000)),
  };
}

/** Which stage of the sale a moment falls in, from the page deadlines. */
function salePhaseAt(now: number, earlyBird: string, registration: string, departure: string, hasDiscount: boolean): SalePhase {
  // An early-bird window only exists when the early-bird price is actually lower.
  if (hasDiscount && new Date(earlyBird).getTime() > now) return 'early';
  if (new Date(registration).getTime() > now) return 'standard';
  // The departure day itself still counts as selling: seats are confirmed by phone up to the flight.
  if (new Date(departure).getTime() + 24 * 60 * 60 * 1000 > now) return 'final';
  return 'departed';
}

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

// Hero slides — same order as old HTML
const HERO_SLIDES = [
  '/images/events/photo_2026-09-16_22-01-09 (2).jpg',
  '/images/events/photo_2026-09-16_22-01-09 (7).jpg',
  '/images/events/photo_2026-09-16_22-01-09 (4).jpg',
  '/images/events/photo_2026-09-16_22-01-09 (6).jpg',
  '/images/events/photo_2026-09-16_22-01-09 (11).jpg',
  '/images/events/photo_2026-09-16_22-01-09 (9).jpg',
];

const GALLERY_ITEMS = [
  { src: '/images/events/photo_2026-09-16_22-01-09 (2).jpg', alt: 'Vietnam Cafe Show & Tea Expo', badge: 'Hanoi Cafe Culture' },
  { src: '/images/events/photo_2026-09-16_22-01-09 (4).jpg', alt: 'Private VIP Coach Interior', badge: 'Private VIP Coach' },
  { src: '/images/events/photo_2026-09-16_22-01-09 (7).jpg', alt: 'UNESCO Halong Bay Cruise', badge: 'Halong Bay Cruise' },
  { src: '/images/events/photo_2026-09-16_22-01-09 (6).jpg', alt: 'Sung Sot Cave Halong Bay', badge: 'Sung Sot Cave' },
  { src: '/images/events/photo_2026-09-16_22-01-09 (11).jpg', alt: 'Hanoi Old Quarter', badge: 'Hanoi Old Quarter' },
  { src: '/images/events/photo_2026-09-16_22-01-09 (9).jpg', alt: 'Hoan Kiem Lake Hanoi', badge: 'Hoan Kiem Lake' },
  { src: '/images/events/photo_2026-09-16_22-01-09 (3).jpg', alt: 'VIP Limousine Coach', badge: 'VIP Limousine Coach' },
  { src: '/images/events/photo_2026-09-16_22-01-09 (8).jpg', alt: 'One Pillar Pagoda Hanoi', badge: 'One Pillar Pagoda' },
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
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>,
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
const SMART_CITY_DEFAULT_ORDER = [
  'hero',
  'coreValues',
  'highlights',
  'problems',
  'audiences',
  'valueStack',
  'matchmaker',
  'speakers',
  'artists',
  'itinerary',
  'gallery',
  'urgency',
  'testimonials',
  'expoBooths',
  'packages',
  'guarantee',
  'form',
  'faqs',
];

export default function SmartCityLandingPageView({ page, settings, initialLang, popupAds, popupPreviewId }: { page?: LandingPage; settings?: SystemSettings; initialLang?: 'en' | 'kh'; popupAds?: PopupAd[]; popupPreviewId?: string; } = {}) {
  const [lang, setLang] = useState<'en' | 'kh'>(initialLang || 'en');
  const [heroSlide, setHeroSlide] = useState(0);
  // Slides get their image only once they are about to show, so the page does not download six photos up front.
  const [preloadedSlides, setPreloadedSlides] = useState(2);
  const [activeItinTab, setActiveItinTab] = useState(0);
  const [activeMatchProfile, setActiveMatchProfile] = useState<'cafe' | 'tech' | 'distributor'>('cafe');
  const [selectedSeat, setSelectedSeat] = useState(20);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regProfile, setRegProfile] = useState('Cafe & Tea Business');
  const [regSeat, setRegSeat] = useState(20);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successSeat, setSuccessSeat] = useState(20);
  // Dynamic overrides from Page editor data
  const effTotalSeats = page?.urgency?.totalSeats ?? GENERAL.totalSeats;
  const effClaimedSeats = page?.urgency?.claimedSeats ?? GENERAL.claimedSeats;
  const effEarlyBirdPrice = page?.urgency?.earlyBirdPrice ? (Number(page.urgency.earlyBirdPrice) || GENERAL.earlyBirdPrice) : GENERAL.earlyBirdPrice;
  const effRegularPrice = page?.urgency?.regularPrice ? (Number(page.urgency.regularPrice) || GENERAL.regularPrice) : GENERAL.regularPrice;
  const effEarlyBirdDeadline = page?.urgency?.earlyBirdDeadline || GENERAL.earlyBirdDeadline;
  const effRegistrationDeadline = page?.urgency?.registrationDeadline || GENERAL.registrationDeadline;
  const effDepartureDate = page?.eventDate || GENERAL.departureDate;
  const hasDiscount = effEarlyBirdPrice < effRegularPrice;
  const [phase, setPhase] = useState<SalePhase>(() => salePhaseAt(Date.now(), effEarlyBirdDeadline, effRegistrationDeadline, effDepartureDate, hasDiscount));
  const isEarlyBird = phase === 'early';
  const currentPrice = currentSeatPrice(page?.packages, isEarlyBird, effEarlyBirdPrice, effRegularPrice);
  const countdownTargetFor = (p: SalePhase) => ({
    early: new Date(effEarlyBirdDeadline).getTime(),
    standard: new Date(effRegistrationDeadline).getTime(),
    final: new Date(effDepartureDate).getTime(),
    departed: 0,
  })[p];
  // Starts with the real remaining time (no "00d 00h" flash); the seconds differ between server
  // and client by design, so the spans that render them carry suppressHydrationWarning.
  const [countdown, setCountdown] = useState(() => countdownParts(countdownTargetFor(phase) - Date.now()));
  const effPhone = page?.isolatedSettings?.phone || settings?.phone || GENERAL.contactPhone;
  const pageLogo = companyFor(settings, page).logo;
  const effTgUsername = page?.isolatedSettings?.telegramUsername || settings?.telegramUsername || GENERAL.contactTelegramUsername;
  const effTgUrl = `/api/round-robin?page=${encodeURIComponent(page?.slug || 'smart-city-tea-cafe')}&redirect=true`;

  // Seats booked from this browser are added on top of the CMS count.
  const [localBookings, setLocalBookings] = useState(0);
  const localClaimed = Math.min(effClaimedSeats + localBookings, effTotalSeats);

  const effectiveSectionOrder = React.useMemo(() => {
    if (Array.isArray(page?.sectionOrder)) {
      return page.sectionOrder;
    }
    return SMART_CITY_DEFAULT_ORDER;
  }, [page?.sectionOrder]);

  // Section visibility helper
  const isVisible = (key: string) => {
    // If sectionOrder is explicitly configured as an array, the section must be present in it
    if (Array.isArray(page?.sectionOrder) && !effectiveSectionOrder.includes(key)) {
      return false;
    }
    if (!page?.sectionVisibility) return true;
    return (page.sectionVisibility as Record<string, boolean | undefined>)[key] !== false;
  };

  const isHighlightsVisible = isVisible('highlights');
  const isMatchmakerVisible = isVisible('matchmaker');

  // Check if at least one core section is enabled
  const isAnySectionVisible = effectiveSectionOrder.some((key) => {
    if (key === 'highlights') return isHighlightsVisible;
    if (key === 'matchmaker') return isMatchmakerVisible;
    return isVisible(key);
  });

  // Date formatter for display
  const formatDeadlineText = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  // Hero slides: prefer page.heroImage and page.gallery if configured
  const heroSlides = (page?.gallery && page.gallery.length > 0)
    ? (page.heroImage && !page.gallery.includes(page.heroImage) ? [page.heroImage, ...page.gallery] : page.gallery)
    : (page?.heroImage ? [page.heroImage, ...HERO_SLIDES.filter(s => s !== page.heroImage)] : HERO_SLIDES);

  // Gallery items: prefer page.gallery
  const galleryItems = (page?.gallery && page.gallery.length > 0)
    ? page.gallery.map((img, idx) => ({
        src: img,
        alt: `${page.title || 'Delegation'} Photo ${idx + 1}`,
        badge: idx === 0 ? 'Featured' : `Photo ${idx + 1}`
      }))
    : GALLERY_ITEMS;

  // Effective Booths, Speakers, Artists (fallback to rich defaults if not configured)
  // Older Supabase rows stored extra page fields under formConfig._extra.
  const formExtraBooths = (page?.formConfig as { _extra?: { expoBooths?: LandingPage['expoBooths'] } } | undefined)?._extra?.expoBooths;
  const effectiveBooths: NonNullable<LandingPage['expoBooths']> = (page?.expoBooths && page.expoBooths.length > 0)
    ? page.expoBooths
    : (Array.isArray(formExtraBooths) && formExtraBooths.length > 0)
    ? formExtraBooths
    : [];

  const effectiveSpeakers: NonNullable<LandingPage['speakers']> = (page?.speakers && page.speakers.length > 0) ? page.speakers : [];

  const effectiveArtists: NonNullable<LandingPage['artists']> = (page?.artists && page.artists.length > 0) ? page.artists : [];

  // These sections have no defaults: they show only when the CMS holds real entries.
  const showSpeakers = isVisible('speakers') && effectiveSpeakers.length > 0;
  const showArtists = isVisible('artists') && effectiveArtists.length > 0;
  const showBooths = isVisible('expoBooths') && effectiveBooths.length > 0;

  // Merge dynamic page data into active language content
  const baseContent = CONTENT[lang];
  const isKh = lang === 'kh';
  const khTrans = page?.translations?.kh;

  // Every number a visitor sees is derived here, once, so copy can never carry a stale price or date.
  const facts: PageFacts = {
    phase,
    earlyBirdPrice: effEarlyBirdPrice,
    regularPrice: effRegularPrice,
    currentPrice,
    savings: Math.max(0, effRegularPrice - effEarlyBirdPrice),
    totalSeats: effTotalSeats,
    claimedSeats: localClaimed,
    seatsLeft: Math.max(0, effTotalSeats - localClaimed),
    earlyBirdDeadline: formatDeadlineText(effEarlyBirdDeadline),
    registrationDeadline: formatDeadlineText(effRegistrationDeadline),
    departureDate: formatDeadlineText(effDepartureDate),
    coordinatorName: page?.isolatedSettings?.coordinatorName || (isKh ? 'អ្នកសម្របសម្រួលយើង' : GENERAL.coordinatorName),
  };
  const formattedDeadline = facts.earlyBirdDeadline;

  // CMS urgency text is written for the early-bird window and goes stale the day it closes,
  // so it is only trusted while early bird is actually open.
  const cmsNotice = isKh ? khTrans?.urgencyNotice : page?.urgency?.noticeText;

  const c = {
    ...baseContent,
    badge: isKh ? (khTrans?.badge || baseContent.badge) : (page?.badge || baseContent.badge),
    heroTitle: isKh ? (khTrans?.heroHeadline || khTrans?.title || baseContent.heroTitle) : (page?.heroHeadline || page?.title || baseContent.heroTitle),
    heroHeadlineHighlight: isKh ? (khTrans?.subtitle || baseContent.heroHeadlineHighlight) : (page?.heroSubheadline && !page?.subtitle ? '' : (page?.subtitle || baseContent.heroHeadlineHighlight)),
    heroSubtitle: isKh ? (khTrans?.heroSubheadline || khTrans?.description || baseContent.heroSubtitle) : (page?.heroSubheadline || page?.description || baseContent.heroSubtitle),
    heroCtaDiscover: isKh ? (khTrans?.heroCtaText || baseContent.heroCtaDiscover) : (page?.heroCtaText || baseContent.heroCtaDiscover),
    heroRiskNote: isKh ? (khTrans?.urgencyRiskNote || page?.urgency?.riskNote || baseContent.heroRiskNote) : (page?.urgency?.riskNote || baseContent.heroRiskNote),
    earlyBirdNotice: phase === 'early' && cmsNotice ? cmsNotice : baseContent.earlyBirdNotice(facts),
    heroPriceAnchorNote: baseContent.heroPriceAnchorNote(facts),
    pillDate: baseContent.pillDate(facts.departureDate, page?.eventTime || baseContent.pillDuration),
    pillDest: isKh ? (khTrans?.venue || baseContent.pillDest) : (page?.venue || baseContent.pillDest),
    pillSeats: baseContent.pillSeats(facts),
    heroProof: baseContent.heroProof(facts),
    urgencyShort: baseContent.urgencyShort(facts),
    statusSeats: baseContent.statusSeats(facts),
    statusLeft: baseContent.statusLeft(facts),
    statusDeparts: baseContent.statusDeparts(facts),
    navCta: baseContent.navCta(facts),
    navCtaMobile: baseContent.navCtaMobile(facts),
    coreValues: isKh
      ? (khTrans?.coreValues && khTrans.coreValues.length > 0 ? khTrans.coreValues : baseContent.coreValues)
      : (page?.coreValues && page.coreValues.length > 0 ? page.coreValues : baseContent.coreValues),
    problems: isKh
      ? (khTrans?.problems && khTrans.problems.length > 0 ? khTrans.problems : baseContent.problems)
      : (page?.problems && page.problems.length > 0 ? page.problems : baseContent.problems),
    audiences: isKh
      ? (khTrans?.audiences && khTrans.audiences.length > 0 ? khTrans.audiences : baseContent.audiences)
      : (page?.audiences && page.audiences.length > 0 ? page.audiences : baseContent.audiences),
    itinerary: isKh
      ? (khTrans?.itinerary && khTrans.itinerary.length > 0 ? khTrans.itinerary : baseContent.itinerary)
      : (page?.itinerary && page.itinerary.length > 0 ? page.itinerary : baseContent.itinerary),
    testimonials: (page?.testimonials && page.testimonials.length > 0) ? page.testimonials : baseContent.testimonials,
    faqs: isKh
      ? (khTrans?.faqs && khTrans.faqs.length > 0 ? khTrans.faqs.map(f => ({ q: f.question, a: f.answer })) : baseContent.faqs(facts))
      : (page?.faqs && page.faqs.length > 0 ? page.faqs.map(f => ({ q: f.question, a: f.answer })) : baseContent.faqs(facts)),
    guaranteeTitle: isKh ? (khTrans?.guarantee?.title || baseContent.guaranteeTitle) : (page?.guarantee?.title || baseContent.guaranteeTitle),
    guaranteeText: isKh ? (khTrans?.guarantee?.subtitle || baseContent.guaranteeText) : (page?.guarantee?.subtitle || baseContent.guaranteeText),
    guaranteePoints: isKh
      ? (khTrans?.guarantee?.points && khTrans.guarantee.points.length > 0 ? khTrans.guarantee.points : baseContent.guaranteePoints)
      : ((page?.guarantee?.points && page.guarantee.points.length > 0) ? page.guarantee.points : baseContent.guaranteePoints),
    valueStackTag: isKh ? (khTrans?.valueStack?.tag || baseContent.valueStackTag) : (page?.valueStack?.tag || baseContent.valueStackTag),
    valueStackTitle: isKh ? (khTrans?.valueStack?.title || baseContent.valueStackTitle) : (page?.valueStack?.title || baseContent.valueStackTitle),
    valueStackSubtitle: isKh ? (khTrans?.valueStack?.subtitle || baseContent.valueStackSubtitle) : (page?.valueStack?.subtitle || baseContent.valueStackSubtitle),
    valueStackTotalLabel: isKh ? (khTrans?.valueStack?.totalLabel || baseContent.valueStackTotalLabel) : (page?.valueStack?.totalLabel || baseContent.valueStackTotalLabel),
    valueStackTotalValue: page?.valueStack?.totalValue || baseContent.valueStackTotalValue,
    valueStackPayLabel: isKh ? (khTrans?.valueStack?.payLabel || baseContent.valueStackPayLabel) : (page?.valueStack?.payLabel || baseContent.valueStackPayLabel),
    valueCtaBtn: baseContent.valueCtaBtn(facts),
    passRateValue: baseContent.passRateValue(facts),
    passRouteDate: baseContent.passRouteDate(facts),
    seatTitle: baseContent.seatTitle(facts),
    pricingValidUntil: baseContent.pricingValidUntil(facts),
    pricingAfter: baseContent.pricingAfter(facts),
    pricingCtaEarly: baseContent.pricingCtaEarly(facts),
    pricingCtaStandard: baseContent.pricingCtaStandard(facts),
    countdownTitle: baseContent.countdownTitle(facts),
    countdownSub: baseContent.countdownSub(facts),
    steps: baseContent.steps(facts),
    registrationSectionTitle: isKh ? baseContent.registrationSectionTitle : (page?.formConfig?.headline || baseContent.registrationSectionTitle),
    registrationSectionSubtitle: isKh ? baseContent.registrationSectionSubtitle(facts) : (page?.formConfig?.subheadline || baseContent.registrationSectionSubtitle(facts)),
    formSubmitBtn: isKh ? baseContent.formSubmitBtn : (page?.formConfig?.submitButtonText || baseContent.formSubmitBtn),
    formSuccessDesc: isKh ? baseContent.formSuccessDesc(facts) : (page?.formConfig?.successMessage || baseContent.formSuccessDesc(facts)),
    telegramDirectBtn: baseContent.telegramDirectBtn(facts),
    ctaTitle: baseContent.ctaTitle(facts),
    ctaSub: baseContent.ctaSub(facts),
    finalCtaBtn: baseContent.finalCtaBtn(facts),
  };
  const tgUrl = effTgUrl;

  // Inclusions for Value Stack
  const inclusionsSource = isKh
    ? (khTrans?.valueStack?.inclusions && khTrans.valueStack.inclusions.length > 0 ? khTrans.valueStack.inclusions : c.inclusions)
    : (page?.valueStack?.inclusions && page.valueStack.inclusions.length > 0 ? page.valueStack.inclusions : c.inclusions);

  const inclusionsList = inclusionsSource.map((item, idx) => ({
    id: idx + 1,
    title: item.title,
    desc: item.desc,
    price: 'standalonePrice' in item && item.standalonePrice ? `$${item.standalonePrice}` : (CONTENT.en.valueStackPrices[idx] ? `$${CONTENT.en.valueStackPrices[idx]}` : '')
  }));

  // ── Hero slider
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide(s => (s + 1) % (heroSlides.length || 1));
      setPreloadedSlides(n => Math.min(heroSlides.length, n + 1));
    }, 5500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // ── Countdown
  useEffect(() => {
    const targets: Record<SalePhase, number> = {
      early: new Date(effEarlyBirdDeadline).getTime(),
      standard: new Date(effRegistrationDeadline).getTime(),
      final: new Date(effDepartureDate).getTime(),
      departed: 0,
    };
    function tick() {
      const now = Date.now();
      const current = salePhaseAt(now, effEarlyBirdDeadline, effRegistrationDeadline, effDepartureDate, hasDiscount);
      setPhase(current);
      setCountdown(countdownParts(targets[current] - now));
    }
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [effEarlyBirdDeadline, effRegistrationDeadline, effDepartureDate, hasDiscount]);

  // ── Reveal-on-scroll. Sections already on screen are marked first, so nothing flashes,
  //    and the `js-reveal` class is only added once JS runs, so without JS everything stays visible.
  useEffect(() => {
    const root = document.querySelector('.smart-city-landing');
    if (!root || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sections = Array.from(root.querySelectorAll('section'));
    sections.forEach(sec => { if (sec.getBoundingClientRect().top < window.innerHeight) sec.classList.add('in-view'); });
    root.classList.add('js-reveal');
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); io.unobserve(entry.target); }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    sections.forEach(sec => { if (!sec.classList.contains('in-view')) io.observe(sec); });
    return () => { io.disconnect(); root.classList.remove('js-reveal'); };
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
    trackLandingEvent(page, 'seat_select', { seat: n }, lang);
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
          packageInterest: `${isEarlyBird ? 'Early Bird' : 'Standard'} $${currentPrice}`,
          landingPageSlug: page?.slug || 'smart-city-tea-cafe',
          landingPageTitle: page?.title || 'Smart City, Tea & Cafe Business Trip to Vietnam 2026',
          source: 'landing_page',
          customFields: { seat: String(regSeat), profile: regProfile },
          ...readUtmParams(),
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessSeat(regSeat);
        setSubmitted(true);
        try { localStorage.setItem(popupStorageKeys.leadSent, '1'); } catch {}
        setLocalBookings(prev => prev + 1);
        trackLandingEvent(page, 'form_submit', {
          seat: regSeat,
          profile: regProfile,
          value: currentPrice,
        }, lang);

        const redirectTarget = safeRedirectUrl(page?.isolatedSettings?.redirectUrl);
        if (page?.isolatedSettings?.postSubmitAction === 'redirect' && redirectTarget) {
          setTimeout(() => {
            window.location.href = redirectTarget;
          }, 1500);
        }
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
  const availableSeats = Array.from({ length: effTotalSeats }, (_, i) => i + 1).filter(n => n > localClaimed);

  // Telegram msg for concierge
  const tgMsg = encodeURIComponent(`Hello KHB Events, I want to reserve Seat #${regSeat} for the Vietnam Delegation 2026. My name is ${regName.trim() || 'Guest'}.`);
  // tgUrl already carries a query string, so the prefilled message is an extra parameter.
  const tgConciergeUrl = `${tgUrl}&text=${tgMsg}`;




  const renderSection = (sectionKey: string): React.ReactNode => {
    switch (sectionKey) {
      case 'hero':
        // HERO
        if (!isVisible('hero')) return null;
        return (
        <section className="hero-section" id="overview">
          <div className="hero-slider">
            {heroSlides.map((src, i) => (
              <div key={i} className={`hero-slide${heroSlide === i ? ' active' : ''}`} style={i < preloadedSlides ? { backgroundImage: `url('${src}')` } : undefined} />
            ))}
          </div>
          <div className="hero-overlay" />
          <div className="hero-slider-dots">
            {heroSlides.map((_, i) => (
              <span key={i} className={`hero-dot${heroSlide === i ? ' active' : ''}`} onClick={() => { setHeroSlide(i); setPreloadedSlides(n => Math.max(n, i + 1)); }} />
            ))}
          </div>
          <div className="container hero-content">
            <div className="hero-grid">
              <div className="hero-copy">
                <div className="hero-badge">
                  <span className="badge-dot" />
                  <span>{c.badge}</span>
                </div>
                <h1 className="hero-title">{c.heroTitle}</h1>
                {c.heroHeadlineHighlight && <p className="hero-headline-sub">{c.heroHeadlineHighlight}</p>}
                <p className="hero-subtitle">{c.heroSubtitle}</p>

                <div className="hero-cta-group">
                  <a
                    href={page?.heroCtaLink || '#register'}
                    className="btn-primary-hero"
                    onClick={() => trackLandingEvent(page, 'cta_click', { placement: 'hero' }, lang)}
                  >
                    {ICONS.plus}
                    <span>{c.heroCtaDiscover}</span>
                  </a>
                  <a
                    href={(page?.heroCtaLink || '#register') === '#register' ? '#core-value' : '#register'}
                    className="btn-secondary-hero"
                  >
                    {c.heroSecondaryCta}
                  </a>
                </div>
                <div className="hero-risk-note">
                  {ICONS.check}
                  <span>{c.heroRiskNote}</span>
                </div>
                {localClaimed > 0 && (
                  <div className="hero-proof-row">
                    <div className="avatar-stack" aria-hidden="true">
                      {c.proofStripIcons.map((icon, i) => (
                        <div key={i} className="avatar-chip" style={{ zIndex: 5 - i }}>{icon}</div>
                      ))}
                    </div>
                    <span>{c.heroProof}</span>
                  </div>
                )}
              </div>

              {/* Live reservation status: real seat count, real countdown, one price, one action. */}
              <aside className="hero-status-card" aria-label={c.statusTitle}>
                <div className="status-head">
                  <span className="status-title">{c.statusTitle}</span>
                  <span className="status-live"><span className="pulse-dot" aria-hidden="true" />{c.statusLeft}</span>
                </div>
                <div
                  className="seat-progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={effTotalSeats}
                  aria-valuenow={localClaimed}
                  aria-label={c.statusSeats}
                >
                  <div className="seat-progress-fill" style={{ width: `${Math.min(100, Math.round((localClaimed / Math.max(1, effTotalSeats)) * 100))}%` }} />
                </div>
                <div className="status-seats">{c.statusSeats}</div>
                <div className="status-meta">
                  <div>
                    <span className="status-meta-label">{phase === 'final' ? c.statusDeparts : c.countdownTitle}</span>
                    <span className="status-meta-value" suppressHydrationWarning>{countdown.d}d {countdown.h}h {countdown.m}m</span>
                  </div>
                  <div>
                    <span className="status-meta-label">{c.statusPriceLabel}</span>
                    <span className="status-meta-value status-price">${currentPrice}</span>
                  </div>
                </div>
                <a
                  href="#register"
                  className="btn-status-cta"
                  onClick={() => trackLandingEvent(page, 'cta_click', { placement: 'hero_status' }, lang)}
                >
                  {c.statusCta}
                </a>
                <div className="status-note">{c.statusNote}</div>
              </aside>
            </div>

            <div className="hero-pills-grid">
              <div className="hero-pill"><span className="hero-pill-icon">📅</span><span>{c.pillDate}</span></div>
              <div className="hero-pill"><span className="hero-pill-icon">📍</span><span>{c.pillDest}</span></div>
              <div className="hero-pill"><span className="hero-pill-icon">🏢</span><span>{c.pillExpos}</span></div>
              <div className="hero-pill"><span className="hero-pill-icon">🚢</span><span>{c.pillCruise}</span></div>
            </div>
          </div>
        </section>
        );

      case 'coreValues':
        // COREVALUES
        if (!isVisible('coreValues')) return null;
        return (
        <section className="section-padding core-value-section" id="core-value">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{c.coreValueTag}</span>
              <h2 className="section-title">{c.coreValueTitle}</h2>
              <p className="section-subtitle">{c.coreValueSubtitle}</p>
            </div>
            <div className="core-grid">
              {c.coreValues.map((v, i) => (
                <div className="core-card" key={v.num || i}>
                  <div className="core-card-num">{v.num || `0${i + 1}`}</div>
                  <div className="core-icon-box">{ICONS[v.icon || 'chart'] || ICONS.chart}</div>
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
        );

      case 'highlights':
        // HIGHLIGHTS & PROOF STRIP
        if (!isHighlightsVisible) return null;
        return (
          <React.Fragment>
      {isVisible('urgency') && (
        <section className="proof-strip-section">
          <div className="container proof-strip-inner">
            <div className="avatar-stack">
              {c.proofStripIcons.map((icon, i) => (
                <div key={i} className="avatar-chip" style={{ zIndex: 5 - i }} aria-hidden="true">{icon}</div>
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
      )}

      {/* ═══════════════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════════════ */}
      {isHighlightsVisible && (
        page?.highlights && page.highlights.length > 0 ? (
          <section className="stats-section">
            <div className="container stats-grid" style={{ gridTemplateColumns: `repeat(${Math.min(page.highlights.length, 4)}, 1fr)` }}>
              {page.highlights.map((h, i) => (
                <div key={h.id || i} className="stats-card">
                  <div className="stats-value" style={{ fontSize: '1.25rem' }}>{h.title}</div>
                  <div className="stats-label">{h.description}</div>
                </div>
              ))}
            </div>
          </section>
        ) : (
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
        )
      )}

          </React.Fragment>
        );

      case 'problems':
        // PROBLEMS
        if (!isVisible('problems')) return null;
        return (
        <section className="section-padding problem-section" id="problem">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{c.problemTag}</span>
              <h2 className="section-title">{c.problemTitle}</h2>
              <p className="section-subtitle">{c.problemSubtitle}</p>
            </div>
            <div className="problem-grid">
              {c.problems.map((p, i) => (
                <div key={('id' in p && p.id) || i} className="problem-card">
                  <div className="problem-icon-box">{ICONS[p.icon || 'trend-down'] || ICONS['trend-down']}</div>
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
        );

      case 'audiences':
        // AUDIENCES
        if (!isVisible('audiences')) return null;
        return (
        <section className="section-padding audience-section" id="audience">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{c.audienceTag}</span>
              <h2 className="section-title">{c.audienceSecTitle}</h2>
              <p className="section-subtitle">{c.audienceSecSub}</p>
            </div>
            <div className="audience-grid">
              {c.audiences.map((a, i) => (
                <div key={('id' in a && a.id) || i} className="audience-card">
                  <div className="audience-card-icon">{ICONS[a.icon || 'users'] || ICONS.users}</div>
                  <div className="audience-card-title">{a.title}</div>
                  <div className="audience-card-desc">{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        );

      case 'valueStack':
        // VALUESTACK
        if (!isVisible('valueStack')) return null;
        return (
        <section className="section-padding value-section" id="value">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{c.valueStackTag}</span>
              <h2 className="section-title">{c.valueStackTitle}</h2>
              <p className="section-subtitle">{c.valueStackSubtitle}</p>
            </div>
            <div className="value-grid">
              <div className="value-list">
                {inclusionsList.map((item) => (
                  <div key={item.id} className="value-item">
                    <div className="value-badge-num">{item.id}</div>
                    <div className="value-item-details">
                      <h4 className="value-item-title">{item.title}</h4>
                      <p className="value-item-desc">{item.desc}</p>
                    </div>
                    {item.price && <div className="value-item-value">{item.price}</div>}
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
                    <span>{currentPrice}</span>
                  </div>
                </div>
                <a href="#register" className="btn-value-cta">{c.valueCtaBtn}</a>
                <div className="value-cta-sub">{c.heroRiskNote}</div>
              </aside>
            </div>
          </div>
        </section>
        );

      case 'matchmaker':
        // MATCHMAKER
        if (!isMatchmakerVisible) return null;
        return (
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
        );

      case 'speakers':
        // SPEAKERS
        if (!showSpeakers) return null;
        return (
        <section className="section-padding speakers-section" id="speakers" style={{ background: '#0B132B' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{lang === 'kh' ? 'វាគ្មិនកិត្តិយស និងអ្នកជំនាញ' : 'Industry Leaders & Speakers'}</span>
              <h2 className="section-title">{lang === 'kh' ? 'ជួបផ្ទាល់ជាមួយអ្នកជំនាញ និងថ្នាក់ដឹកនាំកំពូល' : 'Keynote Speakers & Industry Mentors'}</h2>
              <p className="section-subtitle">
                {lang === 'kh'
                  ? 'ទទួលបានការចែករំលែកបទពិសោធន៍ផ្ទាល់ អំពីយុទ្ធសាស្ត្រនាំចេញ-នាំចូល និងបច្ចេកវិទ្យាអាជីវកម្ម'
                  : 'Gain direct strategic insights on bilateral supply chains, import-export compliance, and smart retail tech.'}
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              marginTop: '40px'
            }}>
              {effectiveSpeakers.map((spk, sIdx) => (
                <div key={spk.id || sIdx} style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s, border-color 0.2s'
                }}>
                  {spk.avatar ? (
                    <img
                      src={spk.avatar}
                      alt={spk.name}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #D97706',
                        marginBottom: '18px'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'rgba(217, 119, 6, 0.2)',
                      color: '#F59E0B',
                      fontSize: '32px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid #D97706',
                      marginBottom: '18px'
                    }}>
                      {spk.name ? spk.name.slice(0, 2).toUpperCase() : 'SP'}
                    </div>
                  )}
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px 0' }}>{spk.name}</h3>
                  <div style={{ fontSize: '13px', color: '#F59E0B', fontWeight: 600, marginBottom: '4px' }}>{spk.title}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '14px' }}>{spk.organization}</div>
                  {spk.topic && (
                    <div style={{
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: 'rgba(255, 255, 255, 0.85)',
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      width: '100%',
                      marginTop: 'auto'
                    }}>
                      <strong style={{ color: '#F59E0B', display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        {spk.track || 'Session Topic'}
                      </strong>
                      &ldquo;{spk.topic}&rdquo;
                    </div>
                  )}
                  {spk.sessionTime && (
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🕒</span> {spk.sessionTime}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        );

      case 'artists':
        // ARTISTS
        if (!showArtists) return null;
        return (
        <section className="section-padding artists-section" id="artists" style={{ background: '#070D1E' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{lang === 'kh' ? 'កម្មវិធីសិល្បៈ និងកម្សាន្ត' : 'Cultural Entertainment'}</span>
              <h2 className="section-title">{lang === 'kh' ? 'សិល្បករ និងការសម្តែងក្នុងពិធីជួបជុំ' : 'Featured Performers & Cultural Gala'}</h2>
              <p className="section-subtitle">
                {lang === 'kh'
                  ? 'រីករាយជាមួយការសម្តែងតន្ត្រីប្រពៃណី និងសហសម័យ ក្នុងអំឡុងពេលពិធីលៀងសាយភាយ និងដំណើរកម្សាន្ត'
                  : 'Experience authentic cultural music, live gala acoustics, and networking entertainment.'}
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginTop: '40px'
            }}>
              {effectiveArtists.map((art, aIdx) => (
                <div key={art.id || aIdx} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {art.image && (
                    <div style={{ width: '100%', height: '200px', overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={art.image}
                        alt={art.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {art.genre && (
                        <span style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(0, 0, 0, 0.75)',
                          color: '#F59E0B',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backdropFilter: 'blur(4px)'
                        }}>
                          {art.genre}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{art.name}</h3>
                    </div>
                    <div style={{ fontSize: '13px', color: '#10B981', fontWeight: 600, marginBottom: '12px' }}>{art.role}</div>
                    {art.bio && (
                      <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, marginBottom: '16px', flex: 1 }}>
                        {art.bio}
                      </p>
                    )}
                    {(art.stageName || art.stageTime) && (
                      <div style={{
                        marginTop: 'auto',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        {art.stageName && <span>📍 {art.stageName}</span>}
                        {art.stageTime && <span>🕒 {art.stageTime}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        );

      case 'itinerary':
        // ITINERARY
        if (!isVisible('itinerary')) return null;
        return (
        <section className="section-padding" id="itinerary">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{c.itineraryTag}</span>
              <h2 className="section-title">{c.itineraryTitle}</h2>
              <p className="section-subtitle">{c.itinerarySubtitle}</p>
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
        );

      case 'gallery':
        // GALLERY
        if (!isVisible('gallery')) return null;
        return (
        <section className="section-padding gallery-section" id="gallery" style={{ overflow: 'hidden' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{lang === 'kh' ? 'កម្រងរូបភាពទស្សនកិច្ច' : 'Photo Gallery & Highlights'}</span>
              <h2 className="section-title">{lang === 'kh' ? 'សកម្មភាពជាក់ស្តែងនៃដំណើរទស្សនកិច្ចពាណិជ្ជកម្ម' : 'Live Delegation Highlights & Impressions'}</h2>
              <p className="section-subtitle">
                {lang === 'kh'
                  ? 'ទិដ្ឋភាពនៃការចូលរួមពិព័រណ៍អន្តរជាតិ ការចុះពិនិត្យរោងចក្រផ្ទាល់ និងដំណើរកម្សាន្ត Halong Bay'
                  : 'Glimpses of international trade expos, private factory inspections, and UNESCO Halong Bay executive cruise.'}
              </p>
            </div>
            <div className="photo-gallery-banner" style={{ margin: '0 auto', maxWidth: '100%' }}>
              <div className="gallery-track">
                {[...galleryItems, ...galleryItems].map((item, i) => (
                  <div key={i} className="gallery-item">
                    <img src={item.src} alt={item.alt} width={400} height={240} loading="lazy" decoding="async" />
                    <div className="gallery-badge">{item.badge}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        );

      case 'urgency':
        // URGENCY
        if (!isVisible('urgency')) return null;
        return (
        <section className="section-padding seat-board-section" id="seats">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{c.seatTag}</span>
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
                    <span>{Math.max(0, effTotalSeats - localClaimed)} {c.seatAvailableTxt}</span>
                  </div>
                </div>
                <div className="seat-legend">
                  <span className="legend-item"><span className="legend-box reserved" /> <span>{c.seatLegendBooked}</span></span>
                  <span className="legend-item"><span className="legend-box available" /> <span>{c.seatLegendAvailable}</span></span>
                  <span className="legend-item"><span className="legend-box selected" /> <span>{c.seatLegendSelected}</span></span>
                </div>
              </div>
              <div className="seats-grid-cabin">
                {Array.from({ length: effTotalSeats }, (_, i) => i + 1).map(n => {
                  const isReserved = n <= localClaimed;
                  const isSelected = !isReserved && n === selectedSeat;
                  const cls = `cabin-seat ${isReserved ? 'reserved' : isSelected ? 'available selected' : 'available'}`;
                  const lbl = isReserved
                    ? c.reservedLabel
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
        );

      case 'testimonials':
        // TESTIMONIALS
        if (!isVisible('testimonials') || c.testimonials.length === 0) return null;
        return (
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
                  <div key={('id' in t && typeof t.id === 'string' && t.id) || i} className="testimonial-card">
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
        );

      case 'expoBooths':
        // EXPOBOOTHS
        if (!showBooths) return null;
        return (
        <section className="section-padding booths-section" id="expo-booths" style={{ background: '#0B132B' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{lang === 'kh' ? 'ស្តង់ពិព័រណ៍ពាណិជ្ជកម្ម' : 'Exhibitor Packages'}</span>
              <h2 className="section-title">{lang === 'kh' ? 'ឱកាសតាំងបង្ហាញផលិតផល និងសេវាកម្ម' : 'Exhibition Booths & Commercial Stalls'}</h2>
              <p className="section-subtitle">
                {lang === 'kh'
                  ? 'ពង្រីកទីផ្សារទៅកាន់ប្រទេសវៀតណាម និងតំបន់អាស៊ី តាមរយៈស្តង់ពិព័រណ៍ស្តង់ដារអន្តរជាតិ'
                  : 'Showcase your brand directly to thousands of regional buyers, distributors, and franchise operators.'}
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginTop: '40px'
            }}>
              {effectiveBooths.map((booth, bIdx) => (
                <div key={booth.id || bIdx} style={{
                  background: booth.popular ? 'linear-gradient(180deg, rgba(217, 119, 6, 0.15) 0%, rgba(255, 255, 255, 0.04) 100%)' : 'rgba(255, 255, 255, 0.04)',
                  border: booth.popular ? '2px solid #D97706' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  {booth.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-13px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 14px',
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)'
                    }}>
                      {lang === 'kh' ? 'ពេញនិយមបំផុត' : 'Most Popular'}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{booth.name}</h3>
                    {booth.size && (
                      <span style={{ fontSize: '12px', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '6px', color: '#FCD34D' }}>
                        {booth.size}
                      </span>
                    )}
                  </div>
                  {booth.availableCount !== undefined && (
                    <div style={{ fontSize: '12px', color: '#10B981', marginBottom: '16px' }}>
                      🔥 {booth.availableCount} {lang === 'kh' ? 'ស្តង់នៅសល់' : 'booths available'}
                    </div>
                  )}
                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF' }}>{booth.price}</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginLeft: '6px' }}>/ full expo duration</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {booth.features?.map((inc: string, iIdx: number) => (
                      <li key={iIdx} style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.5 }}>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                  <a 
                    href={isVisible('form') ? '#register' : tgUrl} 
                    target={isVisible('form') ? undefined : '_blank'} 
                    rel={isVisible('form') ? undefined : 'noreferrer'}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      background: booth.popular ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255, 255, 255, 0.1)',
                      color: booth.popular ? '#000000' : '#FFFFFF',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      marginTop: 'auto'
                    }}
                  >
                    {lang === 'kh' ? 'កក់ស្តង់នេះ' : `Book ${booth.name}`}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
        );

      case 'packages':
        // PACKAGES
        if (!isVisible('packages')) return null;
        return (
        <section className="section-padding pricing-section" id="pricing">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{c.pricingTag}</span>
              <h2 className="section-title">{c.pricingTitle}</h2>
              <p className="section-subtitle">{c.pricingSubtitle}</p>
            </div>
            <div className="pricing-cards-grid">
              {page?.packages && page.packages.length > 0 ? (
                page.packages.map((pkg, pIdx) => {
                  const isFeatured = pkg.popular ?? (pIdx === 0);
                  return (
                    <div key={pkg.id || pIdx} className={`pricing-card${isFeatured ? ' featured' : ''}`}>
                      {isFeatured && <div className="pricing-card-badge">{pkg.popular ? c.featuredBadge : c.earlyBirdBadge}</div>}
                      <div className="pricing-plan-name">{pkg.name}</div>
                      <div className="pricing-price-wrap">
                        <span className="price-amount">{pkg.price.startsWith('$') ? pkg.price : `$${pkg.price}`}</span>
                        {pkg.period && <span className="price-unit">/{pkg.period.replace(/^\/?\s*/, ' ')}</span>}
                      </div>
                      {pkg.description && (
                        <div className="pricing-deadline-tag">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span>{pkg.description}</span>
                        </div>
                      )}
                      <ul className="pricing-features-list">
                        {pkg.features.map((feat, fIdx) => (
                          <li key={fIdx} className="pricing-feature-item"><i>✓</i> {feat}</li>
                        ))}
                      </ul>
                      <a href="#register" className={isFeatured ? "btn-pricing-cta" : "pricing-alt-link"}>
                        {pkg.ctaText || c.ctaBtn}
                      </a>
                      {isFeatured && <div className="pricing-secure-note">{c.pricingSecureNote}</div>}
                    </div>
                  );
                })
              ) : (
                <>
                  {isEarlyBird && (
                    <div className="pricing-card featured">
                      <div className="pricing-card-badge">{c.earlyBirdBadge}</div>
                      <div className="pricing-plan-name">{c.earlyBirdPlanName}</div>
                      <div className="pricing-price-wrap">
                        <span className="price-currency">$</span>
                        <span className="price-amount">{effEarlyBirdPrice}</span>
                        <span className="price-unit">{c.perPerson}</span>
                      </div>
                      <div className="pricing-deadline-tag">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>{c.pricingValidUntil}</span>
                      </div>
                      <ul className="pricing-features-list">
                        {c.pricingFeatures.map((feat, i) => <li key={i} className="pricing-feature-item"><i>✓</i> {feat}</li>)}
                      </ul>
                      <a href="#register" className="btn-pricing-cta">{c.pricingCtaEarly}</a>
                      <div className="pricing-secure-note">{c.pricingSecureNote}</div>
                    </div>
                  )}
                  <div className={`pricing-card${isEarlyBird ? '' : ' featured'}`}>
                    {!isEarlyBird && <div className="pricing-card-badge">{c.featuredBadge}</div>}
                    <div className="pricing-plan-name">{c.regularPlanName}</div>
                    <div className="pricing-price-wrap">
                      <span className="price-currency">$</span>
                      <span className="price-amount">{effRegularPrice}</span>
                      <span className="price-unit">{c.perPerson}</span>
                    </div>
                    {isEarlyBird && (
                      <div className="pricing-deadline-tag">
                        <span>{c.pricingAfter}</span>
                      </div>
                    )}
                    <ul className="pricing-features-list">
                      {c.pricingFeatures.map((feat, i) => <li key={i} className="pricing-feature-item"><i>✓</i> {feat}</li>)}
                    </ul>
                    <a href="#register" className={isEarlyBird ? 'pricing-alt-link' : 'btn-pricing-cta'}>{isEarlyBird ? c.pricingCtaStandard : c.valueCtaBtn}</a>
                    {!isEarlyBird && <div className="pricing-secure-note">{c.pricingSecureNote}</div>}
                  </div>
                </>
              )}
            </div>

            {/* Countdown card */}
            <div className="pricing-countdown-card">
              <div className="countdown-icon-box">⏱️</div>
              <div className="countdown-text-group">
                <div className="countdown-text-title">{c.countdownTitle}</div>
                <div className="countdown-text-sub">{c.countdownSub}</div>
              </div>
              <div className="countdown-timer-units">
                <div className="time-unit-box"><div className="time-value" suppressHydrationWarning>{countdown.d}</div><div className="time-label">{c.countdownUnits.d}</div></div>
                <span className="time-colon">:</span>
                <div className="time-unit-box"><div className="time-value" suppressHydrationWarning>{countdown.h}</div><div className="time-label">{c.countdownUnits.h}</div></div>
                <span className="time-colon">:</span>
                <div className="time-unit-box"><div className="time-value" suppressHydrationWarning>{countdown.m}</div><div className="time-label">{c.countdownUnits.m}</div></div>
                <span className="time-colon">:</span>
                <div className="time-unit-box"><div className="time-value" suppressHydrationWarning>{countdown.s}</div><div className="time-label">{c.countdownUnits.s}</div></div>
              </div>
            </div>
          </div>
        </section>
        );

      case 'guarantee':
        // GUARANTEE
        if (!isVisible('guarantee')) return null;
        return (
        <section className="section-padding steps-section" id="steps">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{c.stepsTag}</span>
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
        );

      case 'form':
        // FORM
        if (!isVisible('form')) return null;
        return (
        <section className="section-padding registration-section" id="register">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">{c.regTag}</span>
              <h2 className="section-title">{c.registrationSectionTitle}</h2>
              <p className="section-subtitle">{c.registrationSectionSubtitle}</p>
            </div>
            <div className="boarding-pass-experience-grid">
              {/* Live VIP Pass */}
              <div className="pass-preview-column">
                <div className="pass-card-label">{c.passPreviewLabel}</div>
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
                {page?.isolatedSettings?.coordinatorName && (
                  <div className="coordinator-card">
                    <div className="coordinator-avatar" aria-hidden="true">
                      {page.isolatedSettings.coordinatorName.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <div className="coordinator-info">
                      <div className="coordinator-label">{c.coordinatorLabel}</div>
                      <div className="coordinator-name">{page.isolatedSettings.coordinatorName}</div>
                      {page.isolatedSettings.coordinatorRole && <div className="coordinator-role">{page.isolatedSettings.coordinatorRole}</div>}
                      <div className="coordinator-note">{c.coordinatorNote}</div>
                    </div>
                    <div className="coordinator-actions">
                      <a href={`tel:${effPhone.replace(/\s/g, '')}`} className="coordinator-btn">📞 {c.coordinatorCall}</a>
                      <a
                        href={tgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="coordinator-btn coordinator-btn-tg"
                        onClick={() => trackLandingEvent(page, 'telegram_click', { placement: 'coordinator_card' }, lang)}
                      >
                        {TG_ICON(16)}<span>{c.coordinatorChat}</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Form */}
              <div className="pass-form-column">
                <div className="reg-form-card">
                  <div className="reg-form-head">
                    <div className="option-badge badge-form">{c.instantBadge}</div>
                    {!page?.isolatedSettings?.isSoldOut && (
                      <span className="seats-left-pill" aria-live="polite">
                        <span className="pulse-dot" aria-hidden="true" />
                        {c.seatsLeftNote(Math.max(0, effTotalSeats - localClaimed), effTotalSeats)}
                      </span>
                    )}
                  </div>
                  <h3 className="reg-form-title">{c.option2Title}</h3>
                  <p className="reg-form-desc">{c.option2Desc}</p>

                  {page?.isolatedSettings?.isSoldOut ? (
                    <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3 my-4">
                      <div className="text-3xl">🔒</div>
                      <h4 className="text-base font-bold text-amber-400">Registration Currently Closed</h4>
                      <p className="text-xs text-gray-300">
                        {page.isolatedSettings.soldOutMessage || 'All delegate seats for this cohort have been fully booked. Please contact our coordinator for waitlist inquiries.'}
                      </p>
                    </div>
                  ) : !submitted ? (
                    <form className="fast-reg-form" onSubmit={handleSubmit}>
                      <div className="form-group">
                        <label className="form-label">{c.formNameLabel}</label>
                        <div className="input-with-icon">
                          <span className="input-icon" aria-hidden="true">{ICONS.user}</span>
                          <input type="text" className="form-input" placeholder={c.formNamePlaceholder}
                            value={regName} onChange={e => setRegName(e.target.value)} required />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{c.formPhoneLabel}</label>
                        <div className="input-with-icon">
                          <span className="input-icon" aria-hidden="true">{ICONS.phone}</span>
                          <input type="tel" className="form-input" placeholder={c.formPhonePlaceholder}
                            value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
                        </div>
                      </div>
                      <div className="form-row-two">
                        <div className="form-group">
                          <label className="form-label">{c.businessFocusLabel}</label>
                          <select className="form-input form-select" value={regProfile} onChange={e => setRegProfile(e.target.value)}>
                            {c.profileOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">{c.seatLabel}</label>
                          <select className="form-input form-select" value={regSeat}
                            onChange={e => { const v = Number(e.target.value); setRegSeat(v); setSelectedSeat(v); }}>
                            {availableSeats.map(n => (
                              <option key={n} value={n}>{c.seatWord} #{n} ({c.availableLabel})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="btn-submit-form" disabled={submitting}>
                        {ICONS.arrow}
                        <span>{submitting ? c.formSubmitting : (isKh ? c.formSubmitBtn : (page?.isolatedSettings?.customCtaText || c.formSubmitBtn))}</span>
                      </button>
                      <div className="form-secure-note">
                        {ICONS.lock}
                        <span>{c.secureNote}</span>
                      </div>
                    </form>
                  ) : (
                    <div className="form-success-state" style={{ display: 'block' }}>
                      <div className="success-icon-circle">✓</div>
                      <h4 className="success-title">{c.formSuccessTitle}</h4>
                      <p className="success-desc"><span>{page?.isolatedSettings?.customThankYouMessage || c.formSuccessDesc}</span></p>
                      <div className="success-pass-badge">Seat #{successSeat} Held</div>
                      <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>{c.formSuccessTelegramPrompt}</p>
                      <a href={tgUrl} target="_blank" rel="noreferrer" className="btn-secondary-telegram">
                        {TG_ICON(18)}<span>{c.telegramDirectBtn}</span>
                      </a>
                    </div>
                  )}

                  {/* Telegram alt */}
                  {!submitted && (
                    <div className="direct-telegram-box">
                      <div className="tg-divider"><span>{c.orChat}</span></div>
                      <a href={tgConciergeUrl} target="_blank" rel="noreferrer" className="btn-telegram-direct">
                        {TG_ICON(20)}<span>{c.telegramDirectBtn}</span>
                      </a>
                      <div className="tg-highlight">{c.option1Highlight}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        );

      case 'faqs':
        // FAQS
        if (!isVisible('faqs')) return null;
        return (
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
        );
      default:
        return null;
    }
  };

  return (
      <div className={`smart-city-landing${lang === 'kh' ? ' lang-kh' : ''}`}>
        {/* ── Tracking Engine (Internal Analytics & External Pixels) ── */}
        <LandingPageTracking page={page} lang={lang} />
        <PopupAdsHost ads={popupAds} previewId={popupPreviewId} pageSlug={page?.slug || 'smart-city-tea-cafe'} lang={lang} />

      {/* ═══════════════════════════════════════════════
          STICKY URGENCY BAR
      ═══════════════════════════════════════════════ */}
      {isVisible('urgency') && (
        <div className="urgency-bar">
          <div className="container urgency-inner">
            <span className="urgency-fire">🔥</span>
            <span className="urgency-msg urgency-msg-full">{c.earlyBirdNotice}</span>
            <span className="urgency-msg urgency-msg-short">{c.urgencyShort}</span>
            <span className="urgency-countdown" aria-hidden="true">
              <b suppressHydrationWarning>{countdown.d}</b>d&nbsp;<b suppressHydrationWarning>{countdown.h}</b>h&nbsp;<b suppressHydrationWarning>{countdown.m}</b>m&nbsp;<b suppressHydrationWarning>{countdown.s}</b>s
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════ */}
      <header className="site-header">
        <div className="container navbar">
          <a href="#" className="brand-logo">
            <img src={pageLogo} alt="KHB EVENTS" className="logo-img" width={163} height={40} />
          </a>
          <ul className="nav-links">
            {isVisible('problems') && <li><a href="#problem" className="nav-link">{c.navWhy}</a></li>}
            {isVisible('valueStack') && <li><a href="#value" className="nav-link">{c.navPackage}</a></li>}
            {isVisible('itinerary') && <li><a href="#itinerary" className="nav-link">{c.navItinerary}</a></li>}
            {isVisible('urgency') && <li><a href="#seats" className="nav-link">{c.navSeats}</a></li>}
            {isVisible('packages') && <li><a href="#pricing" className="nav-link">{c.navPricing}</a></li>}
            {isVisible('faqs') && <li><a href="#faq" className="nav-link">{c.navFaq}</a></li>}
          </ul>
          <div className="nav-actions">
            <div className="lang-switcher">
              <button 
                type="button"
                className={`lang-btn${lang === 'en' ? ' active' : ''}`} 
                onClick={() => switchLang('en')} 
                title="English"
              >
                <span className="lang-flag" aria-hidden="true">
                  <FlagIcon country="en" width={18} height={12} />
                </span>
                <span>EN</span>
              </button>
              <button 
                type="button"
                className={`lang-btn${lang === 'kh' ? ' active' : ''}`} 
                onClick={() => switchLang('kh')} 
                title="ភាសាខ្មែរ"
              >
                <span className="lang-flag" aria-hidden="true">
                  <FlagIcon country="kh" width={18} height={12} />
                </span>
                <span>ខ្មែរ</span>
              </button>
            </div>
            {(isVisible('form') || isVisible('packages')) && (
              <a href="#register" className="btn-nav-cta">{c.navCta}</a>
            )}
            <button className="mobile-nav-toggle" onClick={() => setDrawerOpen(true)} aria-label="Toggle navigation">☰</button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer-backdrop${drawerOpen ? ' active' : ''}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`mobile-nav-drawer${drawerOpen ? ' active' : ''}`} aria-label="Mobile Navigation">
        <div className="mobile-drawer-header">
          <div className="brand-logo">
            <img src={pageLogo} alt="KHB EVENTS" className="logo-img" width={163} height={40} />
          </div>
          <div className="lang-switcher" style={{ margin: '0 8px' }}>
            <button 
              type="button"
              className={`lang-btn${lang === 'en' ? ' active' : ''}`} 
              onClick={() => { switchLang('en'); setDrawerOpen(false); }} 
              title="English"
            >
              <span className="lang-flag" aria-hidden="true">
                <FlagIcon country="en" width={18} height={12} />
              </span>
              <span>EN</span>
            </button>
            <button 
              type="button"
              className={`lang-btn${lang === 'kh' ? ' active' : ''}`} 
              onClick={() => { switchLang('kh'); setDrawerOpen(false); }} 
              title="ភាសាខ្មែរ"
            >
              <span className="lang-flag" aria-hidden="true">
                <FlagIcon country="kh" width={18} height={12} />
              </span>
              <span>ខ្មែរ</span>
            </button>
          </div>
          <button className="btn-close-drawer" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">✕</button>
        </div>
        <ul className="mobile-drawer-links">
          {isVisible('problems') && <li><a href="#problem" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navWhy}</a></li>}
          {isVisible('valueStack') && <li><a href="#value" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navPackage}</a></li>}
          {showSpeakers && <li><a href="#speakers" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{lang === 'kh' ? 'វាគ្មិនកិត្តិយស' : 'Speakers'}</a></li>}
          {showArtists && <li><a href="#artists" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{lang === 'kh' ? 'សិល្បករ' : 'Artists'}</a></li>}
          {isVisible('itinerary') && <li><a href="#itinerary" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navItinerary}</a></li>}
          {isVisible('gallery') && <li><a href="#gallery" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{lang === 'kh' ? 'កម្រងរូបភាព' : 'Gallery'}</a></li>}
          {isVisible('urgency') && <li><a href="#seats" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navSeats}</a></li>}
          {showBooths && <li><a href="#expo-booths" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{lang === 'kh' ? 'ស្តង់ពិព័រណ៍' : 'Booths'}</a></li>}
          {isVisible('packages') && <li><a href="#pricing" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navPricing}</a></li>}
          {isVisible('faqs') && <li><a href="#faq" className="mobile-drawer-link" onClick={() => setDrawerOpen(false)}>{c.navFaq}</a></li>}
          {(isVisible('form') || isVisible('packages')) && <li><a href="#register" className="mobile-drawer-link highlight" onClick={() => setDrawerOpen(false)}>{c.navCtaMobile}</a></li>}
        </ul>
        <div className="mobile-drawer-footer">
          <a href={tgUrl} target="_blank" rel="noreferrer" className="btn-drawer-tg">
            {TG_ICON(18)}<span>Telegram VIP Concierge</span>
          </a>
        </div>
      </aside>


      {/* ── Dynamic Page Flow Dispatcher ── */}
      {effectiveSectionOrder.map((sectionKey: string) => {
        const content = renderSection(sectionKey);
        if (!content) return null;
        return <React.Fragment key={sectionKey}>{content}</React.Fragment>;
      })}

      {/* ═══════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════ */}
      {(isVisible('urgency') || isVisible('form') || isVisible('packages')) && (
        <section className="final-cta-section" id="final-cta">
          <div className="container final-cta-inner">
            <div className="final-cta-badge">🔥 {c.heroPriceAnchorNote}</div>
            <h2 className="final-cta-title">{c.ctaTitle}</h2>
            <p className="final-cta-sub">{c.ctaSub}</p>
            <a href="#register" className="btn-final-cta">{c.finalCtaBtn}</a>
            <div className="final-cta-risk">{c.heroRiskNote}</div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          ORGANIZER TRUST
      ═══════════════════════════════════════════════ */}
      {(isVisible('guarantee') || isVisible('form') || isVisible('coreValues') || isVisible('hero')) && (
        <section className="section-padding trust-section">
          <div className="container">
            <div className="trust-card">
              <div className="trust-info">
                <h3>{c.trustTitle}</h3>
                <p>{c.trustDesc}</p>
              </div>
              <div className="trust-contacts">
                <a href={`tel:${effPhone.replace(/\s/g, '')}`} className="trust-contact-pill">
                  <span>📞 {c.hotlineLabel}: {effPhone}</span>
                </a>
                <a href={tgUrl} target="_blank" rel="noreferrer" className="trust-contact-pill">
                  <span>✈️ {c.telegramLabel}: @{effTgUsername}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty State Banner when all sections are toggled off */}
      {!isAnySectionVisible && (
        <section className="section-padding" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div style={{ padding: '40px 24px', background: 'var(--surface-subtle)', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚙️</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                {lang === 'kh' ? 'ផ្នែកទាំងអស់ត្រូវបានបិទបណ្តោះអាសន្ន' : 'All Sections Currently Hidden'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                {lang === 'kh'
                  ? 'អ្នកគ្រប់គ្រងបានបិទការបង្ហាញផ្នែកទាំងអស់តាមរយៈ CMS Section Display Toggles។ សូមចូលទៅផ្ទាំងគ្រប់គ្រង Admin ដើម្បីបើកផ្នែកដែលចង់បង្ហាញឡើងវិញ។'
                  : 'All sections for this campaign have been toggled off in the CMS Section Display Toggles. Enable desired sections in the Admin portal to display content.'}
              </p>
              <Link
                href="/admin/pages"
                className="btn-nav-cta"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
              >
                <span>{lang === 'kh' ? 'ចូលទៅ Admin CMS' : 'Open Admin CMS'}</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="site-footer">
        <div className="container footer-content">
          <div>{c.footerText}</div>
          <ul className="footer-links">
            {isVisible('valueStack') && <li><a href="#value">{c.footerLinks.package}</a></li>}
            {isVisible('itinerary') && <li><a href="#itinerary">{c.footerLinks.itinerary}</a></li>}
            {isVisible('urgency') && <li><a href="#seats">{c.footerLinks.seats}</a></li>}
            {isVisible('packages') && <li><a href="#pricing">{c.footerLinks.pricing}</a></li>}
            {isVisible('faqs') && <li><a href="#faq">{c.footerLinks.faq}</a></li>}
          </ul>
        </div>
      </footer>

      {/* Floating Telegram Button */}
      <a 
        href={tgUrl} 
        target="_blank" 
        rel="noreferrer" 
        className="floating-telegram-btn" 
        title="Quick Inquiry on Telegram" 
        aria-label="Chat with KHB EVENTS on Telegram"
        onClick={() => trackLandingEvent(page, 'telegram_click', { placement: 'floating_button' }, lang)}
      >
        {TG_ICON(30)}
      </a>

      {/* Mobile Sticky Bar */}
      {isAnySectionVisible && (
        <div className="mobile-sticky-bar">
          <div className="mobile-sticky-inner">
            <a 
              href={tgUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn-mobile-tg"
              onClick={() => trackLandingEvent(page, 'telegram_click', { placement: 'mobile_sticky_bar' }, lang)}
            >
              {TG_ICON(18)}<span>Telegram</span>
            </a>
            {(isVisible('form') || isVisible('packages')) ? (
              <a href="#register" className="btn-mobile-reg">
                <span>{c.navCta}</span>
              </a>
            ) : (
              <a href={tgUrl} target="_blank" rel="noreferrer" className="btn-mobile-reg">
                <span>{lang === 'kh' ? 'ជជែក Telegram' : 'Chat on Telegram'}</span>
              </a>
            )}
          </div>
        </div>
      )}
      </div>
  );
}

