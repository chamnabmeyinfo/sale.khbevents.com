import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSchema, LandingPage, Lead, LeadStatus, SystemSettings } from './types';
import { isSupabaseConfigured } from './supabase';
import {
  supabaseGetPages,
  supabaseGetPageBySlug,
  supabaseGetPageById,
  supabaseSavePage,
  supabaseDeletePage,
  supabaseGetLeads,
  supabaseGetLeadById,
  supabaseCreateLead,
  supabaseUpdateLeadStatus,
  supabaseAddLeadNote,
  supabaseDeleteLead,
  supabaseGetSettings,
  supabaseUpdateSettings,
  supabaseRecordPageView,
} from './supabase-store';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultSettings: SystemSettings = {
  companyName: 'KHB EVENTS',
  brandTagline: 'Cambodia\'s Premier Event Management, Staging & Exhibition Production',
  phone: '+855 12 888 999',
  whatsappNumber: '85512888999',
  telegramUsername: 'khbevents',
  email: 'sale@khbevents.com',
  address: 'Diamond Island (Koh Pich), Phnom Penh, Cambodia',
  facebookUrl: 'https://facebook.com/khbevents',
  tiktokUrl: 'https://tiktok.com/@khbevents',
  enableTelegramAlerts: false,
  adminEmail: 'admin@khbevents.com',
  adminPasswordHash: crypto.createHash('sha256').update('khbevents2026').digest('hex')
};

const defaultPages: LandingPage[] = [
  {
    id: 'page-smart-city',
    slug: 'smart-city-tea-cafe',
    title: 'Vietnam B2B Business Delegation: Smart City, Tea & Cafe',
    subtitle: 'Exclusive High-Level B2B Networking & Trade Delegation to Ho Chi Minh City & Da Lat',
    description: 'Join Cambodia\'s elite business delegation to explore smart city technologies, tea plantations, specialty cafe investments, and top-tier trade connections.',
    category: 'Trade Delegation',
    badge: 'Exclusive 30 VIP Seats Only',
    status: 'published',
    heroHeadline: 'Vietnam Smart City, Tea & Cafe B2B Business Delegation 2026',
    heroSubheadline: 'Connect with 100+ vetted enterprise partners, unlock high-margin import/export distribution agreements, and experience private factory tours across Vietnam.',
    heroCtaText: 'Secure Your VIP Seat',
    heroCtaLink: '#booking-form',
    heroImage: '/images/events/photo_2026-09-16_22-01-09.jpg',
    eventDate: '2026-10-15',
    eventTime: '5 Days / 4 Nights',
    venue: 'Ho Chi Minh City & Da Lat, Vietnam',
    venueAddress: 'Sheraton Saigon Hotel & Lam Dong High-Tech Agricultural Park',
    countdownEnabled: true,
    highlights: [
      {
        id: 'h1',
        title: 'Pre-Arranged 1-on-1 B2B Meetings',
        description: 'Guaranteed private match-making sessions with leading Vietnamese manufacturers, tech pioneers, and franchise owners.',
        icon: 'Handshake'
      },
      {
        id: 'h2',
        title: 'High-Tech Tea & Coffee Farm Expeditions',
        description: 'Exclusive access to organic plantations, automated roasteries, and wholesale packaging facilities.',
        icon: 'Coffee'
      },
      {
        id: 'h3',
        title: '5-Star Luxury Hospitality & Logistics',
        description: 'All-inclusive 5-star hotel accommodations, VIP coach transfers, bilingual business interpreters, and gala dinners.',
        icon: 'Sparkles'
      },
      {
        id: 'h4',
        title: 'Bilingual Business Facilitation',
        description: 'Dedicated Khmer-Vietnamese-English commercial translators to facilitate negotiations and on-the-spot contract drafts.',
        icon: 'Languages'
      }
    ],
    packages: [
      {
        id: 'pkg-standard',
        name: 'Executive Delegate Pass',
        price: '$1,450',
        period: 'per delegate',
        description: 'Ideal for solo business owners and procurement directors.',
        popular: false,
        features: [
          'Full 5D4N business delegation itinerary',
          'Shared 5-star luxury twin room',
          'Access to all B2B symposiums & networking dinners',
          'Bilingual business guide & translator support',
          'Smart City Tech Expo pass',
          'Airport and venue private transfers'
        ],
        ctaText: 'Select Executive Pass'
      },
      {
        id: 'pkg-vip',
        name: 'VIP Chairman Suite Pass',
        price: '$2,200',
        period: 'per delegate',
        description: 'Most popular choice for founders, CEOs, and government-connected dignitaries.',
        popular: true,
        features: [
          'Private 5-Star Executive Deluxe Suite',
          'Front-row VIP seating at all keynotes & signings',
          'Guaranteed 3 pre-arranged private B2B 1-on-1 meetings',
          'Priority private limousine transfers',
          'Exclusive VIP dinner with Chamber of Commerce leadership',
          'Personal dedicated Khmer-Vietnamese business translator',
          'Full digital photo & video recap package'
        ],
        ctaText: 'Reserve VIP Suite Pass'
      },
      {
        id: 'pkg-corp',
        name: 'Corporate Delegation (3 Seats)',
        price: '$4,800',
        period: 'group of 3',
        description: 'Cost-efficient package for enterprise leadership teams.',
        popular: false,
        features: [
          '3 Full Executive Delegate Passes',
          'Company profile spotlight in official program handbook',
          'Private corporate meeting table during matching sessions',
          'Custom industry visit tailored to your sector',
          'Group airport pick-up & chauffeur service'
        ],
        ctaText: 'Book Corporate Group'
      }
    ],
    gallery: [
      '/images/events/photo_2026-09-16_22-01-09 (2).jpg',
      '/images/events/photo_2026-09-16_22-01-09 (3).jpg',
      '/images/events/photo_2026-09-16_22-01-09 (4).jpg',
      '/images/events/photo_2026-09-16_22-01-09 (5).jpg'
    ],
    testimonials: [
      {
        id: 't1',
        name: 'Oknha Bunthan Seng',
        role: 'Managing Director',
        company: 'Apex Trading Corp',
        quote: 'KHB Events executed our trip with exceptional precision. The match-making session alone resulted in 2 immediate distributorship contracts for us in Cambodia.',
        rating: 5
      }
    ],
    faqs: [
      {
        id: 'f1',
        question: 'What is included in the delegate pass fee?',
        answer: 'The delegate fee includes 5-star hotel accommodations, internal executive transport in Vietnam, curated B2B matchmaking sessions, high-tech farm entries, all meals, and translation assistance.'
      },
      {
        id: 'f2',
        question: 'Do I need a visa to travel to Vietnam?',
        answer: 'Cambodian passport holders enjoy visa-free entry to Vietnam for up to 30 days.'
      }
    ],
    formConfig: {
      headline: 'Reserve Your Delegate Spot',
      subheadline: 'Limited to 30 delegates. Our business coordination team will contact you within 2 hours.',
      submitButtonText: 'Submit Registration & Request Invoice',
      successMessage: 'Thank you! Your seat reservation request has been received. A KHB Senior Event Director will contact you directly.',
      fields: [
        { id: 'fullName', label: 'Full Name', type: 'text', placeholder: 'e.g. Oknha Sokha Meng', required: true },
        { id: 'phone', label: 'Phone / Telegram / WhatsApp', type: 'tel', placeholder: 'e.g. 012 345 678', required: true },
        { id: 'email', label: 'Work Email', type: 'email', placeholder: 'sokha@company.com.kh', required: true }
      ]
    },
    metaTitle: 'Vietnam B2B Business Delegation 2026 | KHB EVENTS',
    metaDescription: 'Join KHB EVENTS for an exclusive business delegation to Vietnam. 1-on-1 business matching, smart city tech, high-end tea & cafe investments.',
    viewsCount: 342,
    leadsCount: 18,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'page-corporate-gala',
    slug: 'corporate-gala-production',
    title: 'Corporate Gala Dinners, Annual Awards & Product Launches',
    subtitle: 'Transform your brand milestones into breathtaking, unforgettable productions',
    description: 'Full-service corporate event management, from cinematic LED staging and 3D projection mapping to VIP celebrity guest management and protocol choreography.',
    category: 'Corporate Events',
    badge: 'KHB Enterprise Production',
    status: 'published',
    heroHeadline: 'World-Class Corporate Gala Dinners & High-Impact Brand Launches',
    heroSubheadline: 'From Koh Pich Grand Ballroom to luxury 5-star hotel ballrooms across Phnom Penh, we engineer immersive experiences that elevate your brand prestige.',
    heroCtaText: 'Request VIP Proposal & Deck',
    heroCtaLink: '#booking-form',
    heroImage: '/images/events/photo_2026-09-16_22-01-09 (6).jpg',
    venue: 'Premier Ballrooms & Event Centers across Cambodia',
    countdownEnabled: false,
    highlights: [
      {
        id: 'cg-1',
        title: 'Cinematic LED & Audio-Visual Engineering',
        description: 'Curved 4K LED walls, precision line-array sound systems, moving-head concert lighting, and atmospheric special effects.',
        icon: 'MonitorPlay'
      },
      {
        id: 'cg-2',
        title: 'VIP Protocol & Dignitary Management',
        description: 'Flawless red carpet coordination, high-level diplomatic seating protocol, and seamless stage presentation flow.',
        icon: 'ShieldCheck'
      }
    ],
    packages: [
      {
        id: 'corp-silver',
        name: 'Prestige Corporate Package',
        price: 'From $4,500',
        description: 'For corporate gatherings of 100 - 300 guests.',
        popular: false,
        features: [
          'High-resolution P2.6 / P3.9 LED screen (up to 24 sqm)',
          'Line-array audio system with digital mixing console',
          'Full stage intelligent moving lights & ambient wash',
          'Themed red carpet backdrop & 3D photo zone',
          'Professional stage manager & technical crew'
        ],
        ctaText: 'Inquire Prestige Package'
      },
      {
        id: 'corp-gold',
        name: 'Grand Signature Gala',
        price: 'From $9,500',
        description: 'Designed for major annual dinners of 300 - 1,000+ guests.',
        popular: true,
        features: [
          'Panoramic curved main LED stage (up to 60+ sqm)',
          'Concert-grade audio system + delay towers',
          'Immersive beam lighting show & synchronized haze/sparklers',
          'Full event run-down script & stage choreography',
          '4-Camera live broadcast feed with crane & drone'
        ],
        ctaText: 'Inquire Signature Gala'
      }
    ],
    gallery: [
      '/images/events/photo_2026-09-16_22-01-09 (7).jpg',
      '/images/events/photo_2026-09-16_22-01-09 (8).jpg'
    ],
    testimonials: [
      {
        id: 'tc-1',
        name: 'Chhaya Rath',
        role: 'Brand & Communications Director',
        company: 'Leading Commercial Bank',
        quote: 'KHB Events took complete ownership of our annual dinner at Koh Pich. The stage visuals and sound were stadium quality!',
        rating: 5
      }
    ],
    faqs: [
      {
        id: 'fc-1',
        question: 'How early should we book KHB for an annual dinner?',
        answer: 'We recommend booking 4 to 8 weeks in advance, though our agile production crew can accommodate fast-track timelines.'
      }
    ],
    formConfig: {
      headline: 'Get an Instant Proposal & 3D Stage Concept',
      subheadline: 'Tell us about your event vision and our production team will prepare a tailored deck within 24 hours.',
      submitButtonText: 'Request Tailored Proposal',
      successMessage: 'Thank you! Your event inquiry has been logged. Our Senior Event Producer will follow up shortly.',
      fields: []
    },
    metaTitle: 'Corporate Gala Dinners & Event Production | KHB EVENTS Cambodia',
    metaDescription: 'Cambodia\'s premier corporate event management and production partner. LED staging, sound, lighting, decor & VIP coordination.',
    viewsCount: 520,
    leadsCount: 31,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const defaultLeads: Lead[] = [
  {
    id: 'lead-101',
    landingPageSlug: 'smart-city-tea-cafe',
    landingPageTitle: 'Vietnam B2B Business Delegation: Smart City, Tea & Cafe',
    fullName: 'Oknha Bunthan Seng',
    email: 'bunthan@apextrading.kh',
    phone: '+855 12 908 765',
    company: 'Apex Trading Corp Cambodia',
    eventType: 'Trade Delegation',
    packageInterest: 'VIP Chairman Suite Pass ($2,200)',
    message: 'Interested in meeting with green tea exporters and automated roasting equipment suppliers.',
    status: 'WON',
    notes: [
      { id: 'n1', text: 'Spoke with Oknha on Telegram. Invoice sent and deposit received.', author: 'Admin', createdAt: '2026-09-18T09:00:00Z' }
    ],
    utmSource: 'facebook',
    utmCampaign: 'vietnam_delegation_sep',
    createdAt: '2026-09-17T14:20:00Z',
    updatedAt: '2026-09-18T09:00:00Z'
  },
  {
    id: 'lead-102',
    landingPageSlug: 'corporate-gala-production',
    landingPageTitle: 'Corporate Gala Dinners, Annual Awards & Product Launches',
    fullName: 'Visal Kem',
    email: 'visal.k@telecom-plus.com.kh',
    phone: '+855 98 555 333',
    company: 'Telecom Plus Cambodia',
    eventType: 'Annual Corporate Dinner / Gala',
    guestCount: '600 - 1,500 guests',
    budgetRange: '$12,000 - $25,000',
    packageInterest: 'Grand Signature Gala',
    message: 'Planning our 15th anniversary gala for December at Koh Pich. Need full staging.',
    status: 'PROPOSAL_SENT',
    notes: [
      { id: 'n2', text: 'Sent proposal deck and 3D visual mockups.', author: 'Admin', createdAt: '2026-09-19T11:30:00Z' }
    ],
    utmSource: 'telegram',
    utmCampaign: 'corporate_q4',
    createdAt: '2026-09-19T10:15:00Z',
    updatedAt: '2026-09-19T11:30:00Z'
  },
  {
    id: 'lead-103',
    landingPageSlug: 'corporate-gala-production',
    landingPageTitle: 'Corporate Gala Dinners, Annual Awards & Product Launches',
    fullName: 'Sophea Pich',
    email: 'sophea@luxurybrand.kh',
    phone: '+855 10 442 889',
    company: 'Mondial Luxury Imports',
    eventType: 'Product Launch / Brand Reveal',
    guestCount: '150 - 300 guests',
    budgetRange: '$6,000 - $12,000',
    packageInterest: 'Prestige Corporate Package',
    message: 'New flagship boutique opening gala in November.',
    status: 'NEW',
    notes: [],
    utmSource: 'google',
    utmCampaign: 'brand_launch_cambodia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function getDatabase(): Promise<DatabaseSchema> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(content) as DatabaseSchema;
  } catch {
    const initialDb: DatabaseSchema = {
      pages: defaultPages,
      leads: defaultLeads,
      settings: defaultSettings,
      pageViews: []
    };
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    } catch {
      // Ignore write errors in read-only serverless environments
    }
    return initialDb;
  }
}

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // In read-only serverless environments (like Vercel), local disk writes are ignored
    // because Supabase PostgreSQL provides cloud persistence.
    console.warn('Local DB write bypassed in serverless mode:', (err as Error).message);
  }
}

export async function getPages(): Promise<LandingPage[]> {
  if (isSupabaseConfigured()) {
    try {
      const pages = await supabaseGetPages();
      if (pages && pages.length > 0) return pages;
    } catch (err) {
      console.error('Supabase getPages error:', err);
    }
  }
  const db = await getDatabase();
  return db.pages;
}

export async function getPageBySlug(slug: string): Promise<LandingPage | null> {
  const cleanSlug = slug.toLowerCase().trim();
  if (isSupabaseConfigured()) {
    try {
      const page = await supabaseGetPageBySlug(cleanSlug);
      if (page) return page;
    } catch (err) {
      console.error('Supabase getPageBySlug error:', err);
    }
  }
  const db = await getDatabase();
  return db.pages.find((p) => p.slug === cleanSlug) || null;
}

export async function getPageById(id: string): Promise<LandingPage | null> {
  if (isSupabaseConfigured()) {
    try {
      const page = await supabaseGetPageById(id);
      if (page) return page;
    } catch (err) {
      console.error('Supabase getPageById error:', err);
    }
  }
  const db = await getDatabase();
  return db.pages.find((p) => p.id === id) || null;
}

export async function savePage(pageData: Partial<LandingPage> & { title: string; slug: string }): Promise<LandingPage> {
  const slug = pageData.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
  const now = new Date().toISOString();

  let targetPage: LandingPage;
  const db = await getDatabase();
  let existingIndex = -1;
  if (pageData.id) {
    existingIndex = db.pages.findIndex((p) => p.id === pageData.id);
  } else {
    existingIndex = db.pages.findIndex((p) => p.slug === slug);
  }

  if (existingIndex >= 0) {
    targetPage = {
      ...db.pages[existingIndex],
      ...pageData,
      slug,
      updatedAt: now
    };
    db.pages[existingIndex] = targetPage;
  } else {
    targetPage = {
      id: pageData.id || `page-${Date.now()}`,
      slug,
      title: pageData.title,
      subtitle: pageData.subtitle || '',
      description: pageData.description || '',
      category: pageData.category || 'General',
      badge: pageData.badge || '',
      status: pageData.status || 'published',
      heroHeadline: pageData.heroHeadline || pageData.title,
      heroSubheadline: pageData.heroSubheadline || pageData.subtitle || '',
      heroCtaText: pageData.heroCtaText || 'Get Started',
      heroCtaLink: pageData.heroCtaLink || '#booking-form',
      heroImage: pageData.heroImage || '/images/events/photo_2026-09-16_22-01-09.jpg',
      eventDate: pageData.eventDate,
      eventTime: pageData.eventTime,
      venue: pageData.venue,
      venueAddress: pageData.venueAddress,
      countdownEnabled: pageData.countdownEnabled ?? false,
      highlights: pageData.highlights || [],
      packages: pageData.packages || [],
      gallery: pageData.gallery || [],
      testimonials: pageData.testimonials || [],
      faqs: pageData.faqs || [],
      formConfig: pageData.formConfig || {
        headline: 'Inquire or Register',
        subheadline: 'Fill in your details below and our team will get in touch.',
        submitButtonText: 'Submit Inquiry',
        successMessage: 'Thank you! We will reach out shortly.',
        fields: []
      },
      metaTitle: pageData.metaTitle || `${pageData.title} | KHB EVENTS`,
      metaDescription: pageData.metaDescription || pageData.description || '',
      viewsCount: 0,
      leadsCount: 0,
      createdAt: now,
      updatedAt: now
    };
    db.pages.unshift(targetPage);
  }

  await saveDatabase(db);

  if (isSupabaseConfigured()) {
    try {
      await supabaseSavePage(targetPage);
    } catch (err) {
      console.error('Supabase savePage error:', err);
    }
  }

  return targetPage;
}

export async function deletePage(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseDeletePage(id);
    } catch (err) {
      console.error('Supabase deletePage error:', err);
    }
  }
  const db = await getDatabase();
  const initialLen = db.pages.length;
  db.pages = db.pages.filter((p) => p.id !== id);
  if (db.pages.length !== initialLen) {
    await saveDatabase(db);
    return true;
  }
  return false;
}

export async function getLeads(filter?: {
  pageSlug?: string;
  status?: string;
  search?: string;
}): Promise<Lead[]> {
  if (isSupabaseConfigured()) {
    try {
      const leads = await supabaseGetLeads(filter);
      if (leads && leads.length > 0) return leads;
    } catch (err) {
      console.error('Supabase getLeads error:', err);
    }
  }
  const db = await getDatabase();
  let leads = [...db.leads];

  if (filter?.pageSlug && filter.pageSlug !== 'ALL') {
    leads = leads.filter((l) => l.landingPageSlug === filter.pageSlug);
  }

  if (filter?.status && filter.status !== 'ALL') {
    leads = leads.filter((l) => l.status === filter.status);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.fullName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q)) ||
        (l.message && l.message.toLowerCase().includes(q))
    );
  }

  return leads.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getLeadById(id: string): Promise<Lead | null> {
  if (isSupabaseConfigured()) {
    try {
      const lead = await supabaseGetLeadById(id);
      if (lead) return lead;
    } catch (err) {
      console.error('Supabase getLeadById error:', err);
    }
  }
  const db = await getDatabase();
  return db.leads.find((l) => l.id === id) || null;
}

export async function createLead(leadData: {
  landingPageSlug: string;
  landingPageTitle?: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  eventType?: string;
  estimatedDate?: string;
  guestCount?: string;
  budgetRange?: string;
  packageInterest?: string;
  message?: string;
  customFields?: Record<string, string>;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referrer?: string;
  ip?: string;
  userAgent?: string;
}): Promise<Lead> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  let pageTitle = leadData.landingPageTitle || leadData.landingPageSlug;
  const targetPage = db.pages.find((p) => p.slug === leadData.landingPageSlug);
  if (targetPage) {
    pageTitle = targetPage.title;
    targetPage.leadsCount = (targetPage.leadsCount || 0) + 1;
  }

  const newLead: Lead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    landingPageId: targetPage?.id,
    landingPageSlug: leadData.landingPageSlug,
    landingPageTitle: pageTitle,
    fullName: leadData.fullName.trim(),
    email: leadData.email.trim(),
    phone: leadData.phone.trim(),
    company: leadData.company?.trim(),
    eventType: leadData.eventType || 'General Inquiry',
    estimatedDate: leadData.estimatedDate,
    guestCount: leadData.guestCount,
    budgetRange: leadData.budgetRange,
    packageInterest: leadData.packageInterest,
    message: leadData.message?.trim(),
    customFields: leadData.customFields,
    status: 'NEW',
    notes: [],
    utmSource: leadData.utmSource,
    utmMedium: leadData.utmMedium,
    utmCampaign: leadData.utmCampaign,
    utmContent: leadData.utmContent,
    referrer: leadData.referrer,
    ip: leadData.ip,
    userAgent: leadData.userAgent,
    createdAt: now,
    updatedAt: now
  };

  if (isSupabaseConfigured()) {
    try {
      await supabaseCreateLead(newLead);
    } catch (err) {
      console.error('Supabase createLead error:', err);
    }
  }

  db.leads.unshift(newLead);
  await saveDatabase(db);

  if (db.settings.enableTelegramAlerts && db.settings.telegramBotToken && db.settings.telegramChatId) {
    sendTelegramAlert(newLead, db.settings).catch((err) => {
      console.error('Telegram error:', err);
    });
  }

  return newLead;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  noteText?: string
): Promise<Lead | null> {
  if (isSupabaseConfigured()) {
    try {
      const updated = await supabaseUpdateLeadStatus(id, status, noteText);
      if (updated) return updated;
    } catch (err) {
      console.error('Supabase updateLeadStatus error:', err);
    }
  }
  const db = await getDatabase();
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return null;

  lead.status = status;
  lead.updatedAt = new Date().toISOString();

  if (noteText) {
    lead.notes.unshift({
      id: `note-${Date.now()}`,
      text: noteText,
      author: 'Admin',
      createdAt: new Date().toISOString()
    });
  }

  await saveDatabase(db);
  return lead;
}

export async function addLeadNote(
  id: string,
  text: string,
  author: string = 'Admin'
): Promise<Lead | null> {
  if (isSupabaseConfigured()) {
    try {
      const updated = await supabaseAddLeadNote(id, text, author);
      if (updated) return updated;
    } catch (err) {
      console.error('Supabase addLeadNote error:', err);
    }
  }
  const db = await getDatabase();
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return null;

  lead.notes.unshift({
    id: `note-${Date.now()}`,
    text,
    author,
    createdAt: new Date().toISOString()
  });
  lead.updatedAt = new Date().toISOString();

  await saveDatabase(db);
  return lead;
}

export async function deleteLead(id: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseDeleteLead(id);
    } catch (err) {
      console.error('Supabase deleteLead error:', err);
    }
  }
  const db = await getDatabase();
  const initialLen = db.leads.length;
  db.leads = db.leads.filter((l) => l.id !== id);
  if (db.leads.length !== initialLen) {
    await saveDatabase(db);
    return true;
  }
  return false;
}

export async function getSettings(): Promise<SystemSettings> {
  if (isSupabaseConfigured()) {
    try {
      const settings = await supabaseGetSettings();
      if (settings) return settings;
    } catch (err) {
      console.error('Supabase getSettings error:', err);
    }
  }
  const db = await getDatabase();
  return db.settings;
}

export async function updateSettings(
  partial: Partial<SystemSettings>
): Promise<SystemSettings> {
  if (isSupabaseConfigured()) {
    try {
      const updated = await supabaseUpdateSettings(partial);
      if (updated) return updated;
    } catch (err) {
      console.error('Supabase updateSettings error:', err);
    }
  }
  const db = await getDatabase();
  db.settings = { ...db.settings, ...partial };
  await saveDatabase(db);
  return db.settings;
}

export async function recordPageView(slug: string, referrer?: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseRecordPageView(slug, referrer);
    } catch (err) {
      console.error('Supabase recordPageView error:', err);
    }
  }
  const db = await getDatabase();
  const page = db.pages.find((p) => p.slug === slug);
  if (page) {
    page.viewsCount = (page.viewsCount || 0) + 1;
  }
  db.pageViews.push({
    pageSlug: slug,
    timestamp: new Date().toISOString(),
    referrer
  });
  if (db.pageViews.length > 5000) {
    db.pageViews = db.pageViews.slice(-5000);
  }
  await saveDatabase(db);
}

async function sendTelegramAlert(lead: Lead, settings: SystemSettings) {
  const token = settings.telegramBotToken;
  const chatId = settings.telegramChatId;
  if (!token || !chatId) return;

  const text = `🎉 *NEW KHB LEAD INQUIRY!*
*Campaign:* ${lead.landingPageTitle}
*Client:* ${lead.fullName}
*Phone:* ${lead.phone}
*Email:* ${lead.email}
*Company:* ${lead.company || 'N/A'}
*Event Type:* ${lead.eventType}
*Budget:* ${lead.budgetRange || 'N/A'}
*Package Interest:* ${lead.packageInterest || 'N/A'}
*Message:* ${lead.message || 'N/A'}
*UTM Source:* ${lead.utmSource || 'Direct'}
*Time:* ${new Date(lead.createdAt).toLocaleString()}`;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  });
}
