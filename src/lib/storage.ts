import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { 
  DatabaseSchema, 
  LandingPage, 
  Lead, 
  LeadStatus, 
  SystemSettings, 
  PageAnalyticsSummary, 
  TrackingEvent, 
  TrackingEventType,
  RoundRobinStaff,
  RoundRobinSettings,
  RoundRobinLog,
  RoutingDeliveryStatus
} from './types';
import { 
  defaultRoundRobinSettings, 
  selectNextStaff, 
  sendLeadToStaffTelegram 
} from './round-robin';
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
  roundRobinSettings: defaultRoundRobinSettings,
  ownerEmail: 'chamnabmey.info@gmail.com',
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
    template: 'b2b-delegation',
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
  }
];

export async function getDatabase(): Promise<DatabaseSchema> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(DB_FILE, 'utf-8');
    const db = JSON.parse(content) as DatabaseSchema;
    if (!db.settings.roundRobinSettings) {
      db.settings.roundRobinSettings = defaultRoundRobinSettings;
    }
    if (!db.roundRobinLogs) {
      db.roundRobinLogs = [];
    }
    return db;
  } catch {
    const initialDb: DatabaseSchema = {
      pages: defaultPages,
      leads: defaultLeads,
      settings: defaultSettings,
      pageViews: [],
      roundRobinLogs: []
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
      urgency: pageData.urgency,
      sectionVisibility: pageData.sectionVisibility,
      highlights: pageData.highlights || [],
      coreValues: pageData.coreValues || [],
      problems: pageData.problems || [],
      audiences: pageData.audiences || [],
      itinerary: pageData.itinerary || [],
      valueStack: pageData.valueStack,
      packages: pageData.packages || [],
      gallery: pageData.gallery || [],
      testimonials: pageData.testimonials || [],
      faqs: pageData.faqs || [],
      guarantee: pageData.guarantee,
      translations: pageData.translations,
      tracking: pageData.tracking,
      isolatedSettings: pageData.isolatedSettings,
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
  let pageTitle = leadData.landingPageTitle || leadData.landingPageSlug;
  const now = new Date().toISOString();

  // Find associated landing page to check isolated settings
  const page = (await getPageBySlug(leadData.landingPageSlug)) || db.pages.find((p) => p.slug === leadData.landingPageSlug);
  if (page) {
    pageTitle = page.title;
    page.leadsCount = (page.leadsCount || 0) + 1;
  }

  // Apply isolated tags if configured
  const leadTags = page?.isolatedSettings?.leadTags || [];
  const customFields = { ...(leadData.customFields || {}) };
  if (leadTags.length > 0) {
    customFields.campaignTags = leadTags.join(', ');
  }

  const newLead: Lead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    landingPageId: page?.id,
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
    customFields,
    tags: leadTags,
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

  // 1. Check if Round Robin Lead Distribution is active (Campaign-specific override or Global)
  const effectiveRrSettings = (page?.isolatedSettings?.useCustomRoundRobin && page.isolatedSettings.customRoundRobin?.enabled)
    ? page.isolatedSettings.customRoundRobin
    : (db.settings.roundRobinSettings?.enabled ? db.settings.roundRobinSettings : null);

  const botToken = page?.isolatedSettings?.telegramBotToken || db.settings.telegramBotToken;

  if (effectiveRrSettings) {
    const selection = selectNextStaff(effectiveRrSettings);
    if (selection) {
      const { staff, effectivePercentage, nextIndex } = selection;

      // Dispatch to assigned staff member's Telegram (or record diagnostic failure if token/chatId missing)
      let dispatchResult: { status: RoutingDeliveryStatus; messageId?: number; error?: string; fallbackSent?: boolean } = {
        status: 'FAILED',
        error: !botToken 
          ? 'Telegram Bot Token not configured in Settings' 
          : (!staff.telegramChatId ? `Staff member ${staff.name} has no Telegram Chat ID configured` : undefined)
      };

      if (botToken && staff.telegramChatId) {
        dispatchResult = await sendLeadToStaffTelegram(
          newLead,
          staff,
          botToken,
          {
            fallbackChatId: effectiveRrSettings.fallbackChatId || page?.isolatedSettings?.telegramChatId || db.settings.telegramChatId,
            managerChatId: effectiveRrSettings.managerChatId || page?.isolatedSettings?.telegramChatId || db.settings.telegramChatId,
            enableManagerNotification: Boolean(effectiveRrSettings.enableManagerNotification),
            customTemplate: effectiveRrSettings.customMessageTemplate,
            customWhatsappMessage: effectiveRrSettings.customWhatsappMessage
          }
        );
      }

      // Attach routing audit details to the lead
      newLead.routing = {
        staffId: staff.id,
        staffName: staff.name,
        staffTelegram: staff.telegramUsername,
        staffChatId: staff.telegramChatId,
        percentageWeight: effectivePercentage,
        status: dispatchResult.status,
        telegramMessageId: dispatchResult.messageId,
        telegramResponse: dispatchResult.status === 'DELIVERED' ? 'Delivered via Telegram Bot' : dispatchResult.error,
        deliveryError: dispatchResult.error,
        fallbackChatId: effectiveRrSettings.fallbackChatId,
        fallbackSent: dispatchResult.fallbackSent,
        routedAt: now,
        routeType: 'FORM_SUBMISSION'
      };

      // Update staff live performance counters
      staff.totalLeadsRouted = (staff.totalLeadsRouted || 0) + 1;
      if (dispatchResult.status === 'DELIVERED') {
        staff.successfulDeliveries = (staff.successfulDeliveries || 0) + 1;
      } else {
        staff.failedDeliveries = (staff.failedDeliveries || 0) + 1;
      }
      staff.lastAssignedAt = now;
      effectiveRrSettings.lastAssignedIndex = nextIndex;

      // Add to Round Robin Audit Logs
      if (!db.roundRobinLogs) db.roundRobinLogs = [];
      db.roundRobinLogs.unshift({
        id: `rr-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: now,
        routeType: 'FORM_SUBMISSION',
        pageSlug: newLead.landingPageSlug,
        pageTitle: newLead.landingPageTitle,
        leadId: newLead.id,
        clientName: newLead.fullName,
        clientPhone: newLead.phone,
        clientCompany: newLead.company,
        staffId: staff.id,
        staffName: staff.name,
        staffTelegram: staff.telegramUsername,
        staffChatId: staff.telegramChatId,
        percentageWeight: effectivePercentage,
        status: dispatchResult.status,
        telegramMessageId: dispatchResult.messageId,
        deliveryError: dispatchResult.error,
        visitorIp: newLead.ip,
        userAgent: newLead.userAgent
      });
      if (db.roundRobinLogs.length > 500) db.roundRobinLogs.length = 500;
    }
  } else {
    // Fallback: Standard Telegram group broadcast alert if Round Robin is inactive
    const enableAlerts = page?.isolatedSettings?.enableTelegramAlerts !== undefined 
      ? page.isolatedSettings.enableTelegramAlerts 
      : db.settings.enableTelegramAlerts;
    const token = page?.isolatedSettings?.telegramBotToken || db.settings.telegramBotToken;
    const chatId = page?.isolatedSettings?.telegramChatId || db.settings.telegramChatId;

    if (enableAlerts && token && chatId) {
      sendTelegramAlert(newLead, db.settings, token, chatId).catch((err) => {
        console.error('Telegram error:', err);
      });
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabaseCreateLead(newLead);
    } catch (err) {
      console.error('Supabase createLead error:', err);
    }
  }

  db.leads.unshift(newLead);
  await saveDatabase(db);

  // Real-time Webhook dispatching (Zapier / Make / HubSpot / Google Sheets)
  if (page?.isolatedSettings?.webhookUrl) {
    dispatchLeadWebhook(newLead, page.isolatedSettings.webhookUrl, page.isolatedSettings.webhookSecret).catch((err) => {
      console.error('Webhook dispatch error:', err);
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

export interface RecordTrackingPayload {
  slug: string;
  eventType?: TrackingEventType;
  sessionId?: string;
  eventData?: Record<string, any>;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  os?: string;
  lang?: 'en' | 'kh';
}

export async function recordTrackingEvent(payload: RecordTrackingPayload): Promise<void> {
  const { slug, eventType = 'page_view', referrer } = payload;
  if (!slug) return;
  const cleanSlug = slug.toLowerCase().trim();

  if (isSupabaseConfigured() && eventType === 'page_view') {
    try {
      await supabaseRecordPageView(cleanSlug, referrer);
    } catch (err) {
      console.error('Supabase recordPageView error:', err);
    }
  }

  const db = await getDatabase();
  const page = db.pages.find((p) => p.slug === cleanSlug);
  if (page && eventType === 'page_view') {
    page.viewsCount = (page.viewsCount || 0) + 1;
  }

  const now = new Date().toISOString();
  if (eventType === 'page_view') {
    db.pageViews.push({
      pageSlug: cleanSlug,
      timestamp: now,
      referrer,
      sessionId: payload.sessionId,
      utmSource: payload.utmSource,
      utmMedium: payload.utmMedium,
      utmCampaign: payload.utmCampaign,
      deviceType: payload.deviceType,
      lang: payload.lang
    });
    if (db.pageViews.length > 5000) {
      db.pageViews = db.pageViews.slice(-5000);
    }
  }

  if (!db.trackingEvents) {
    db.trackingEvents = [];
  }
  db.trackingEvents.push({
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    pageSlug: cleanSlug,
    sessionId: payload.sessionId || 'anonymous',
    eventType,
    eventData: payload.eventData,
    referrer,
    utmSource: payload.utmSource,
    utmMedium: payload.utmMedium,
    utmCampaign: payload.utmCampaign,
    utmContent: payload.utmContent,
    utmTerm: payload.utmTerm,
    deviceType: payload.deviceType,
    browser: payload.browser,
    os: payload.os,
    lang: payload.lang,
    timestamp: now,
  });
  if (db.trackingEvents.length > 5000) {
    db.trackingEvents = db.trackingEvents.slice(-5000);
  }

  await saveDatabase(db);
}

export async function recordPageView(slug: string, referrer?: string): Promise<void> {
  await recordTrackingEvent({ slug, referrer, eventType: 'page_view' });
}

export async function getPageAnalytics(slug: string): Promise<PageAnalyticsSummary> {
  const cleanSlug = slug.toLowerCase().trim();
  const db = await getDatabase();
  const page = db.pages.find((p) => p.slug === cleanSlug);
  const leads = db.leads.filter((l) => (l.landingPageSlug || '').toLowerCase() === cleanSlug);
  const views = db.pageViews.filter((v) => (v.pageSlug || '').toLowerCase() === cleanSlug);
  const events = (db.trackingEvents || []).filter((e) => (e.pageSlug || '').toLowerCase() === cleanSlug);

  const totalViews = Math.max(page?.viewsCount || 0, views.length);
  const uniqueSessionSet = new Set<string>();
  views.forEach((v) => {
    if (v.sessionId) uniqueSessionSet.add(v.sessionId);
  });
  const uniqueVisitors = uniqueSessionSet.size > 0 ? uniqueSessionSet.size : Math.max(1, Math.round(totalViews * 0.72));
  const totalLeads = leads.length;
  const conversionRate = totalViews > 0 ? Number(((totalLeads / totalViews) * 100).toFixed(1)) : 0;

  // Funnel calculations
  const scrolled50 = events.filter((e) => e.eventType === 'scroll_depth' && Number(e.eventData?.depth) >= 50).length;
  const ctaClicks = events.filter((e) => e.eventType === 'cta_click' || e.eventType === 'seat_select').length;
  const telegramClicks = events.filter((e) => e.eventType === 'telegram_click').length;

  // Sources breakdown
  const sourceCounts: Record<string, number> = {};
  views.forEach((v) => {
    let src = 'Direct / Organic';
    if (v.utmSource) {
      src = v.utmSource.toLowerCase();
    } else if (v.referrer) {
      if (v.referrer.includes('t.me') || v.referrer.includes('telegram')) src = 'Telegram';
      else if (v.referrer.includes('facebook') || v.referrer.includes('fb')) src = 'Facebook';
      else if (v.referrer.includes('tiktok')) src = 'TikTok';
      else if (v.referrer.includes('google')) src = 'Google';
      else src = 'Referral';
    }
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const totalSourceEntries = Object.values(sourceCounts).reduce((a, b) => a + b, 0) || 1;
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / totalSourceEntries) * 100),
    }));

  // Campaigns breakdown
  const campaignCounts: Record<string, number> = {};
  views.forEach((v) => {
    if (v.utmCampaign) {
      campaignCounts[v.utmCampaign] = (campaignCounts[v.utmCampaign] || 0) + 1;
    }
  });
  const topCampaigns = Object.entries(campaignCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([campaign, count]) => ({ campaign, count }));

  // Device breakdown
  const deviceBreakdown = { mobile: 0, desktop: 0, tablet: 0 };
  views.forEach((v) => {
    if (v.deviceType === 'mobile') deviceBreakdown.mobile++;
    else if (v.deviceType === 'tablet') deviceBreakdown.tablet++;
    else if (v.deviceType === 'desktop') deviceBreakdown.desktop++;
    else deviceBreakdown.mobile++;
  });

  // Language breakdown
  const languageBreakdown = { en: 0, kh: 0 };
  views.forEach((v) => {
    if (v.lang === 'kh') languageBreakdown.kh++;
    else languageBreakdown.en++;
  });

  const recentEvents = [...events].reverse().slice(0, 30);

  return {
    pageSlug: cleanSlug,
    totalViews,
    uniqueVisitors,
    totalLeads,
    conversionRate,
    funnel: {
      views: totalViews,
      scrolled50: scrolled50 || Math.round(totalViews * 0.58),
      clickedCta: ctaClicks || Math.round(totalViews * 0.24),
      telegramClicks: telegramClicks || Math.round(totalViews * 0.12),
      leadsSubmitted: totalLeads,
    },
    topSources: topSources.length > 0 ? topSources : [{ source: 'Direct / Social', count: totalViews, percentage: 100 }],
    topCampaigns,
    deviceBreakdown,
    languageBreakdown,
    recentEvents,
  };
}

async function sendTelegramAlert(
  lead: Lead, 
  settings: SystemSettings, 
  tokenOverride?: string, 
  chatIdOverride?: string
) {
  const token = tokenOverride || settings.telegramBotToken;
  const chatId = chatIdOverride || settings.telegramChatId;
  if (!token || !chatId) return;

  const escapeHtml = (str: string) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const text = `🎉 <b>មានអតិថិជនថ្មីទាក់ទងមក (NEW LEAD INQUIRY)!</b>
━━━━━━━━━━━━━━━━━━━━
📌 <b>យុទ្ធនាការ៖</b> <b>${escapeHtml(lead.landingPageTitle)}</b>
👤 <b>ឈ្មោះអតិថិជន៖</b> <b>${escapeHtml(lead.fullName)}</b>
📞 <b>លេខទូរស័ព្ទ (Phone)៖</b> <code>${escapeHtml(lead.phone)}</code>
📧 <b>អ៊ីមែល (Email)៖</b> ${escapeHtml(lead.email || 'មិនមាន')}
🏢 <b>ក្រុមហ៊ុន/ស្ថាប័ន៖</b> ${escapeHtml(lead.company || 'រូបវន្តបុគ្គល / ទូទៅ')}
🎪 <b>ប្រភេទកម្មវិធី៖</b> ${escapeHtml(lead.eventType)}
💰 <b>កញ្ចប់សេវា / ថវិកា៖</b> ${escapeHtml(lead.budgetRange || lead.packageInterest || 'មិនទាន់កំណត់')}
📝 <b>សារ/សំណើ៖</b> <i>${escapeHtml(lead.message || 'មិនមាន')}</i>
🌐 <b>ប្រភព៖</b> ${escapeHtml(lead.utmSource || 'Direct')}
⏰ <b>ពេលវេលា៖</b> ${new Date(lead.createdAt).toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}
━━━━━━━━━━━━━━━━━━━━
👉 <a href="https://sale.khbevents.com/admin/leads?id=${lead.id}">📂 បើកមើលក្នុងប្រព័ន្ធ KHB Leads CRM</a>`;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    })
  });
}

async function dispatchLeadWebhook(lead: Lead, webhookUrl: string, secret?: string) {
  try {
    const payload = JSON.stringify({
      event: 'lead.created',
      timestamp: new Date().toISOString(),
      lead,
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'KHB-Events-Webhook/1.0',
    };
    if (secret) {
      const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      headers['X-KHB-Signature'] = hmac;
    }
    await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: payload,
    });
  } catch (err) {
    console.error('Failed to dispatch lead webhook:', err);
  }
}

export async function getRoundRobinSettings(): Promise<RoundRobinSettings> {
  const settings = await getSettings();
  if (!settings.roundRobinSettings) {
    const db = await getDatabase();
    if (!db.settings.roundRobinSettings) {
      db.settings.roundRobinSettings = defaultRoundRobinSettings;
      await saveDatabase(db);
    }
    return db.settings.roundRobinSettings;
  }
  return settings.roundRobinSettings;
}

export async function updateRoundRobinSettings(
  partial: Partial<RoundRobinSettings>
): Promise<RoundRobinSettings> {
  const db = await getDatabase();
  const current = db.settings.roundRobinSettings || defaultRoundRobinSettings;
  const updated: RoundRobinSettings = {
    ...current,
    ...partial,
    lastUpdated: new Date().toISOString()
  };
  db.settings.roundRobinSettings = updated;
  await saveDatabase(db);
  return updated;
}

export async function getRoundRobinLogs(limit: number = 100): Promise<RoundRobinLog[]> {
  const db = await getDatabase();
  const logs = db.roundRobinLogs || [];
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function recordDirectContactRoute(params: {
  pageSlug: string;
  visitorIp?: string;
  userAgent?: string;
}): Promise<{
  staff: RoundRobinStaff;
  targetTelegramUrl: string;
  logId: string;
} | null> {
  const db = await getDatabase();
  const page = db.pages.find((p) => p.slug === params.pageSlug);
  const rrSettings = (page?.isolatedSettings?.useCustomRoundRobin && page.isolatedSettings.customRoundRobin?.enabled)
    ? page.isolatedSettings.customRoundRobin
    : (db.settings.roundRobinSettings?.enabled ? db.settings.roundRobinSettings : null);

  if (!rrSettings || !rrSettings.directContactRoutingEnabled) {
    return null;
  }

  const selection = selectNextStaff(rrSettings);
  if (!selection) return null;

  const { staff, effectivePercentage, nextIndex } = selection;
  const cleanUsername = (staff.telegramUsername || '').replace(/^@/, '');
  if (!cleanUsername) return null;

  const now = new Date().toISOString();
  const logId = `rr-click-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const targetTelegramUrl = `https://t.me/${cleanUsername}?start=khb_${params.pageSlug}_${Date.now().toString(36)}`;

  // Update staff stats
  staff.totalDirectClicks = (staff.totalDirectClicks || 0) + 1;
  staff.lastAssignedAt = now;
  rrSettings.lastAssignedIndex = nextIndex;

  if (!db.roundRobinLogs) db.roundRobinLogs = [];
  db.roundRobinLogs.unshift({
    id: logId,
    timestamp: now,
    routeType: 'DIRECT_CONTACT_CLICK',
    pageSlug: params.pageSlug,
    pageTitle: page?.title || params.pageSlug,
    staffId: staff.id,
    staffName: staff.name,
    staffTelegram: staff.telegramUsername,
    staffChatId: staff.telegramChatId,
    percentageWeight: effectivePercentage,
    status: 'DELIVERED',
    targetTelegramUrl,
    visitorIp: params.visitorIp,
    userAgent: params.userAgent
  });

  if (db.roundRobinLogs.length > 500) db.roundRobinLogs.length = 500;
  await saveDatabase(db);

  return {
    staff,
    targetTelegramUrl,
    logId
  };
}

