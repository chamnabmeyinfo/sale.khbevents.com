import fs from 'fs/promises';
import { unstable_cache, revalidateTag } from 'next/cache';
import path from 'path';
import crypto from 'crypto';
import {
  DatabaseSchema,
  LandingPage,
  Lead,
  LeadStatus,
  SystemSettings,
  PageAnalyticsSummary,
  TrackingEventType,
  RoundRobinStaff,
  RoundRobinSettings,
  RoundRobinLog,
  RoutingDeliveryStatus,
  AssignmentReason,
  PopupAd,
  PopupAdsState,
  PopupAdStatsMap,
  StaffClickStats
} from './types';
import {
  defaultRoundRobinSettings,
  selectNextStaff,
  cleanTelegramUsername,
  readTelegramResponse,
  rememberedStaff,
  sameCustomer,
  phoneKey,
  visitorMemoryMs,
  sendLeadToStaffTelegram,
  escapeHtml,
  staffOnShift,
  countAssignment,
  isPlaceholderStaff
} from './round-robin';
import { isSupabaseConfigured } from './supabase';
import { runAfterResponse } from './after-response';
import { defaultPopupAdsState, inAppBrowserName, nextOpening, normalizePopupAdsState, parseSmartReasons, selectPublicPopupAds, type SmartReason } from './popup-ads';
import { applyPopupEvent, phnomPenhDay, type PopupEventDetail } from './popup-analytics';
import { normalizeBuilderDoc } from './builder';
import { dayKeys, parseVisitRow, upsertVisit, visitRowId, VISIT_RETENTION_DAYS, type VisitRecord } from './visits';
import { normalizeMediaMeta, type MediaMeta } from './media-library';
import { computePageStats, type PageStats } from './page-stats';
import { findDemoLeads, isDemoLead, type ClearDemoRequest, type ClearDemoResult, type DemoScan } from './demo-data';
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
  supabaseGetRoundRobinSettings,
  supabaseUpdateRoundRobinSettings,
  supabaseGetRoundRobinLogs,
  supabaseSaveRoundRobinLog,
  supabaseGetDeletedPages,
  supabaseSaveDeletedPages,
  supabaseGetMarker,
  supabaseGetMarkerRange,
  supabaseDeleteMarkerRange,
  supabaseSetMarker,
  supabaseGetStaffClickStats,
  supabaseSaveStaffClickStats,
  supabaseGetPopupAds,
  supabaseSavePopupAds,
  supabaseGetMediaMeta,
  supabaseSaveMediaMeta,
  supabaseGetPopupAdStats,
  supabaseSavePopupAdStats,
  supabaseReplaceRoundRobinLogs,
  supabaseClearPageViews
} from './supabase-store';
import bundledDbJson from '../../data/db.json';

// ── Read caching ────────────────────────────────────────────────────────────
// Public pages are rendered per request, and each render made 3–4 Supabase
// round trips. These wrappers keep the results in Next's data cache for a
// minute; admin writes call invalidateCache() so their changes show at once.
const CACHE_SECONDS = 60;
/** The company logo lives in its own settings row: the settings table has no column for it. */
const LOGO_MARKER = 'brand_logo';
const cachedSupabaseSettings = unstable_cache(async () => {
  const settings = await supabaseGetSettings();
  if (!settings) return settings;
  const logoUrl = await supabaseGetMarker(LOGO_MARKER).catch(() => null);
  return logoUrl ? { ...settings, logoUrl } : settings;
}, ['supabase-settings'], {
  tags: ['settings'], revalidate: CACHE_SECONDS,
});
const cachedSupabasePages = unstable_cache(() => supabaseGetPages(), ['supabase-pages'], {
  tags: ['pages'], revalidate: CACHE_SECONDS,
});
const cachedSupabasePageBySlug = unstable_cache((slug: string) => supabaseGetPageBySlug(slug), ['supabase-page-by-slug'], {
  tags: ['pages'], revalidate: CACHE_SECONDS,
});
const cachedSupabaseDeletedPages = unstable_cache(() => supabaseGetDeletedPages(), ['supabase-deleted-pages'], {
  tags: ['pages'], revalidate: CACHE_SECONDS,
});
const cachedSupabasePopupAds = unstable_cache(() => supabaseGetPopupAds(), ['supabase-popup-ads'], {
  tags: ['popup-ads'], revalidate: CACHE_SECONDS,
});

function invalidateCache(tag: 'settings' | 'pages' | 'popup-ads') {
  try {
    revalidateTag(tag, { expire: 0 });
  } catch {
    // Not inside a request scope (e.g. scripts/tests): the entry simply expires.
  }
}

const bundledDb = bundledDbJson as unknown as DatabaseSchema;

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'db.json');
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// In-memory copy of the database. It lives on globalThis because Next.js bundles
// route handlers and pages separately, each with its own copy of this module;
// a module-level variable would let API writes go unseen by page renders.
const dbCache = globalThis as typeof globalThis & { __khbMemoryDb?: DatabaseSchema | null };

const defaultSettings: SystemSettings = {
  companyName: 'KHB EVENTS',
  brandTagline: 'Cambodia\'s Premier Event Management, Staging & Exhibition Production',
  phone: '+855 12 888 999',
  whatsappNumber: '85512888999',
  telegramUsername: 'khb_sale_admin_bot',
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
  if (dbCache.__khbMemoryDb) {
    return dbCache.__khbMemoryDb;
  }
  let content = '';
  try {
    try {
      content = await fs.readFile(DB_FILE, 'utf-8');
    } catch {
      if (IS_SERVERLESS) {
        try {
          content = await fs.readFile(BUNDLED_DB_FILE, 'utf-8');
          await fs.mkdir(DATA_DIR, { recursive: true });
          await fs.writeFile(DB_FILE, content, 'utf-8').catch(() => {});
        } catch {}
      }
    }
    if (!content) {
      throw new Error('Database file empty or not found');
    }
    const db = JSON.parse(content) as DatabaseSchema;
    if (bundledDb?.pages) {
      const deleted = new Set(db.deletedPages || []);
      for (const bp of bundledDb.pages) {
        if (isDeletedPage(bp, deleted)) continue;
        if (!db.pages.some((p) => p.slug === bp.slug || p.id === bp.id)) {
          db.pages.push(bp);
        }
      }
    }
    if (!db.settings.roundRobinSettings) {
      db.settings.roundRobinSettings = structuredClone(defaultRoundRobinSettings);
    }
    if (!db.roundRobinLogs) {
      db.roundRobinLogs = [];
    }
    if (!db.popupAds) db.popupAds = structuredClone(defaultPopupAdsState);
    if (!db.popupAdStats) db.popupAdStats = {};
    dbCache.__khbMemoryDb = db;
    return db;
  } catch (err) {
    if (content) {
      // The file exists but is unreadable. Keep a copy before anything is
      // written over it, so leads saved since the last deploy can be recovered.
      const backup = `${DB_FILE}.corrupt-${Date.now()}`;
      await fs.writeFile(backup, content, 'utf-8').catch(() => {});
      console.error(`Database file could not be parsed; saved a copy to ${backup}:`, err);
    }
    const initialDb: DatabaseSchema = {
      pages: (bundledDb?.pages && bundledDb.pages.length > 0) ? bundledDb.pages : defaultPages,
      leads: bundledDb?.leads || defaultLeads,
      settings: bundledDb?.settings || defaultSettings,
      pageViews: bundledDb?.pageViews || [],
      roundRobinLogs: bundledDb?.roundRobinLogs || []
    };
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
    } catch {
      // Ignore write errors in read-only serverless environments
    }
    dbCache.__khbMemoryDb = initialDb;
    return initialDb;
  }
}

// Writes are chained so two requests never write the file at the same time.
const writeQueue = globalThis as typeof globalThis & { __khbDbWrite?: Promise<void> };

export async function saveDatabase(data: DatabaseSchema): Promise<void> {
  dbCache.__khbMemoryDb = data;
  const write = async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      // Write a temp file and rename it over the real one: the rename is atomic,
      // so a crash mid-write can never leave a truncated db.json behind.
      const json = JSON.stringify(data, null, 2);
      const tmp = `${DB_FILE}.${process.pid}.tmp`;
      try {
        await fs.writeFile(tmp, json, 'utf-8');
        await fs.rename(tmp, DB_FILE);
      } catch {
        // Some hosts allow writing db.json but not creating files beside it;
        // fall back to a direct write rather than losing the save.
        await fs.rm(tmp, { force: true }).catch(() => {});
        await fs.writeFile(DB_FILE, json, 'utf-8');
      }
    } catch (err) {
      // In read-only serverless environments (like Vercel), local disk writes are ignored
      // because Supabase PostgreSQL provides cloud persistence.
      console.warn('Local DB write bypassed in serverless mode:', (err as Error).message);
    }
  };
  const next = (writeQueue.__khbDbWrite ?? Promise.resolve()).then(write);
  writeQueue.__khbDbWrite = next;
  await next;
}

function isDeletedPage(page: Pick<LandingPage, 'id' | 'slug'>, deleted: Set<string>): boolean {
  return deleted.has(`id:${page.id}`) || deleted.has(`slug:${page.slug}`);
}

async function getDeletedPageKeys(): Promise<Set<string>> {
  const db = await getDatabase();
  const keys = new Set(db.deletedPages || []);
  if (isSupabaseConfigured()) {
    try {
      for (const key of (await cachedSupabaseDeletedPages()) || []) keys.add(key);
    } catch (err) {
      console.error('Supabase getDeletedPages error:', err);
    }
  }
  return keys;
}

async function updateDeletedPageKeys(add: string[], remove: string[]): Promise<void> {
  const keys = await getDeletedPageKeys();
  const changed = add.some((k) => !keys.has(k)) || remove.some((k) => keys.has(k));
  if (!changed) return;
  for (const k of add) keys.add(k);
  for (const k of remove) keys.delete(k);
  const list = [...keys];
  const db = await getDatabase();
  db.deletedPages = list;
  await saveDatabase(db);
  if (isSupabaseConfigured()) {
    await supabaseSaveDeletedPages(list).catch(() => false);
  }
}

/**
 * Drops pages the admin has deleted (they may still be in the bundled db.json).
 * Tombstones are only fetched when there is something to filter, so the common
 * path of serving a page straight from Supabase costs no extra query.
 */
async function withoutDeleted(pages: LandingPage[]): Promise<LandingPage[]> {
  if (pages.length === 0) return pages;
  const deleted = await getDeletedPageKeys();
  return pages.filter((p) => !isDeletedPage(p, deleted));
}

export async function getPages(): Promise<LandingPage[]> {
  const db = await getDatabase();
  const allLocalPages = db.pages || [];

  // Supabase is the source of truth. Bundled pages are NEVER written into it here: that
  // used to overwrite the owner's live pages with the repo's sample copies whenever a
  // read failed for a moment (the failure looked like "no pages").
  if (isSupabaseConfigured()) {
    try {
      const remotePages = await cachedSupabasePages();
      if (remotePages.length > 0) return remotePages;
    } catch (err) {
      console.error('Supabase getPages error (showing the bundled copy, nothing written):', err);
    }
  }
  return withoutDeleted(allLocalPages);
}

export async function getPageBySlug(slug: string): Promise<LandingPage | null> {
  const cleanSlug = slug.toLowerCase().trim();
  const db = await getDatabase();
  const localMatch = db.pages.find((p) => p.slug === cleanSlug);
  const [localPage = null] = await withoutDeleted(localMatch ? [localMatch] : []);

  if (isSupabaseConfigured()) {
    try {
      const page = await cachedSupabasePageBySlug(cleanSlug);
      if (page) return page;
    } catch (err) {
      // Read-only fallback for visitors; never saved back to Supabase.
      console.error('Supabase getPageBySlug error (showing the bundled copy, nothing written):', err);
    }
  }

  return localPage;
}

/**
 * One page for editing. With Supabase, a failed read is thrown (the editor shows an
 * error) instead of handing the editor the bundled sample copy, which a Save would
 * then have written over the live page.
 */
export async function getPageById(id: string): Promise<LandingPage | null> {
  const db = await getDatabase();
  const localMatch = db.pages.find((p) => p.id === id);
  const [localPage = null] = await withoutDeleted(localMatch ? [localMatch] : []);

  if (isSupabaseConfigured()) {
    const page = await supabaseGetPageById(id);
    if (page) return page;
  }

  return localPage;
}

// Paths owned by the app itself; a page with one of these slugs could never be reached.
const RESERVED_SLUGS = new Set(['admin', 'api', 'auth', 'login', 'images', 'photos', '_next', 'favicon.ico']);

/** Thrown when a page cannot be saved under the requested slug (API maps it to 409). */
export class PageSlugError extends Error {}

/** Thrown when the page changed after the editor loaded it (API maps it to 409). */
export class PageConflictError extends Error {
  constructor(public currentUpdatedAt: string) {
    super('This page was changed somewhere else after you opened it.');
  }
}

/** Earlier versions of a page, newest first (kept on every save; see savePage). */
export interface PageVersion { savedAt: string; page: LandingPage }
const PAGE_HISTORY_LIMIT = 15;
const historyId = (pageId: string) => `page_history:${pageId}`;

export async function getPageHistory(pageId: string): Promise<PageVersion[]> {
  try {
    const raw = await getMarker(historyId(pageId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((v) => v && v.page && typeof v.savedAt === 'string') : [];
  } catch {
    return [];
  }
}

async function rememberPageVersion(page: LandingPage): Promise<void> {
  const list = await getPageHistory(page.id);
  // Consecutive saves of an identical page add nothing.
  if (list[0] && JSON.stringify(list[0].page) === JSON.stringify(page)) return;
  const next = [{ savedAt: page.updatedAt || new Date().toISOString(), page }, ...list].slice(0, PAGE_HISTORY_LIMIT);
  await setMarker(historyId(page.id), JSON.stringify(next));
}

/** The page as it was before the last content pack (content/pages/<slug>.json) was applied. */
export async function getPackBackup(slug: string): Promise<LandingPage | null> {
  try {
    const raw = await getMarker(`content_pack_backup:${slug}`);
    return raw ? (JSON.parse(raw) as LandingPage) : null;
  } catch {
    return null;
  }
}

const sameTime = (a?: string, b?: string) => Boolean(a && b && Date.parse(a) === Date.parse(b));

/**
 * Saves a page. Protection against lost work:
 *  - the page is merged over the latest stored copy (Supabase), never over a stale local one;
 *  - with `expectedUpdatedAt` (the version the editor opened), a page saved elsewhere since
 *    is not overwritten: PageConflictError;
 *  - the version being replaced is kept in the page history (last 15), for Restore;
 *  - a failed database write is an error, not a silent "saved".
 */
export async function savePage(pageData: Partial<LandingPage> & { title: string; slug: string }, opts: { expectedUpdatedAt?: string } = {}): Promise<LandingPage> {
  // Builder documents come straight from the editor: clean them before they are stored.
  if (pageData.builder !== undefined) pageData = { ...pageData, builder: normalizeBuilderDoc(pageData.builder) };
  const slug = pageData.slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
  const now = new Date().toISOString();

  if (!slug.replace(/[-_]/g, '')) throw new PageSlugError('Please enter a page URL slug.');
  if (RESERVED_SLUGS.has(slug)) throw new PageSlugError(`"/${slug}" is reserved by the system. Please choose another URL slug.`);

  let targetPage: LandingPage;
  const db = await getDatabase();
  let existingIndex = pageData.id ? db.pages.findIndex((p) => p.id === pageData.id) : -1;

  // Merge into the latest stored copy. The local copy can be stale (on Vercel it starts as
  // the bundled sample), so with Supabase the stored page always wins as the base.
  // A failed read throws: nothing is saved rather than saving over an unknown state.
  if (pageData.id && isSupabaseConfigured()) {
    const remote = await supabaseGetPageById(pageData.id);
    if (remote) {
      if (existingIndex >= 0) db.pages[existingIndex] = remote;
      else {
        db.pages.unshift(remote);
        existingIndex = 0;
      }
    }
  }
  const previous = existingIndex >= 0 ? db.pages[existingIndex] : null;
  if (previous && opts.expectedUpdatedAt && previous.updatedAt && !sameTime(previous.updatedAt, opts.expectedUpdatedAt)) {
    throw new PageConflictError(previous.updatedAt);
  }

  // Slugs must be unique: saving over another page's slug used to overwrite that page.
  const ownId = existingIndex >= 0 ? db.pages[existingIndex].id : pageData.id;
  const localClash = db.pages.find((p) => p.slug === slug && p.id !== ownId);
  const remoteClash = !localClash && isSupabaseConfigured()
    ? await supabaseGetPageBySlug(slug)
    : null;
  const clash = localClash || (remoteClash && remoteClash.id !== ownId ? remoteClash : null);
  if (clash) {
    throw new PageSlugError(`The URL "/${slug}" is already used by "${clash.title}". Please choose another slug.`);
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
      sectionOrder: pageData.sectionOrder,
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
      expoBooths: pageData.expoBooths || [],
      artists: pageData.artists || [],
      speakers: pageData.speakers || [],
      translations: pageData.translations,
      tracking: pageData.tracking,
      isolatedSettings: pageData.isolatedSettings,
      // Kept on creation: without them a new page lost its chosen template until its next save.
      template: pageData.template,
      builder: pageData.builder,
      ogImage: pageData.ogImage,
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

  if (previous) await rememberPageVersion(previous).catch((err) => console.error('Page history error:', err));
  if (isSupabaseConfigured()) {
    // Throws on failure: the editor must say "not saved", never pretend it worked.
    await supabaseSavePage(targetPage);
  }
  await saveDatabase(db);
  // Re-creating a page with a previously deleted id or slug brings it back.
  await updateDeletedPageKeys([], [`id:${targetPage.id}`, `slug:${targetPage.slug}`]);
  invalidateCache('pages');

  return targetPage;
}

export async function deletePage(id: string): Promise<boolean> {
  const existing = await getPageById(id);
  let supabaseDeleted = false;
  if (isSupabaseConfigured()) {
    try {
      supabaseDeleted = await supabaseDeletePage(id);
    } catch (err) {
      console.error('Supabase deletePage error:', err);
    }
  }
  const db = await getDatabase();
  const initialLen = db.pages.length;
  db.pages = db.pages.filter((p) => p.id !== id);
  const localDeleted = db.pages.length !== initialLen;
  if (localDeleted) {
    await saveDatabase(db);
  }
  const deleted = supabaseDeleted || localDeleted;
  if (deleted) {
    // Remember the deletion so the page is not re-seeded from the bundled db.json
    // or re-synced to Supabase on the next restart.
    await updateDeletedPageKeys([`id:${id}`, ...(existing ? [`slug:${existing.slug}`] : [])], []);
    invalidateCache('pages');
  }
  return deleted;
}

/**
 * Retries Supabase inserts that failed when the lead was submitted. Returns the
 * leads that are still only stored locally.
 */
async function syncPendingLeads(): Promise<Lead[]> {
  const db = await getDatabase();
  const pending = db.unsyncedLeadIds || [];
  if (pending.length === 0) return [];
  const stillPending: string[] = [];
  for (const id of pending) {
    const lead = db.leads.find((l) => l.id === id);
    if (!lead) continue;
    try {
      await supabaseCreateLead(lead);
    } catch {
      stillPending.push(id);
    }
  }
  db.unsyncedLeadIds = stillPending;
  await saveDatabase(db);
  return db.leads.filter((l) => stillPending.includes(l.id));
}

function applyLeadFilter(leads: Lead[], filter?: { pageSlug?: string; status?: string; search?: string }): Lead[] {
  let result = leads;
  if (filter?.pageSlug && filter.pageSlug !== 'ALL') {
    result = result.filter((l) => l.landingPageSlug === filter.pageSlug);
  }
  if (filter?.status && filter.status !== 'ALL') {
    result = result.filter((l) => l.status === filter.status);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (l) =>
        l.fullName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q)) ||
        (l.message && l.message.toLowerCase().includes(q))
    );
  }
  return [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getLeads(filter?: {
  pageSlug?: string;
  status?: string;
  search?: string;
}): Promise<Lead[]> {
  if (isSupabaseConfigured()) {
    try {
      const leads = await supabaseGetLeads(filter);
      // An empty answer is real (a fresh start); only a failed query falls back to the local file.
      if (leads) {
        const pending = applyLeadFilter(await syncPendingLeads(), filter);
        const remoteIds = new Set(leads.map((l) => l.id));
        return applyLeadFilter([...pending.filter((l) => !remoteIds.has(l.id)), ...leads]);
      }
    } catch (err) {
      console.error('Supabase getLeads error:', err);
    }
  }
  const db = await getDatabase();
  return applyLeadFilter(db.leads, filter);
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

/**
 * The most recent earlier lead from the same customer (phone or email) inside the
 * memory window, so a returning customer stays with their salesperson.
 */
async function findPreviousLeadOfCustomer(lead: Pick<Lead, 'phone' | 'email' | 'id'>, windowMs: number): Promise<Lead | null> {
  if (!phoneKey(lead.phone) && !lead.email?.trim()) return null;
  const since = Date.now() - windowMs;
  // Phone formats differ between visits ("+855 12 777 666" vs "012777666"), so a
  // text search cannot find them: compare normalized numbers over the recent leads.
  let recent: Lead[] = [];
  try {
    recent = await getRealLeads();
  } catch (err) {
    console.error('Returning-customer lookup error:', err);
  }
  return (
    recent
      .filter((l) => l.id !== lead.id && l.routing?.staffId && new Date(l.createdAt).getTime() >= since && sameCustomer(lead, l))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
  );
}

/** Cookie lifetime for the "same salesperson" memory, in seconds (0 = memory off). */
export async function getVisitorMemorySeconds(): Promise<number> {
  const rr = await getRoundRobinSettings();
  return Math.floor(visitorMemoryMs(rr) / 1000);
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
  /** Staff id from the visitor's cookie (set when they clicked a Telegram button or sent a form before). */
  preferredStaffId?: string;
  /** Simulation Studio: tagged demo, never counted in statistics or fairness. */
  demo?: boolean;
}): Promise<Lead> {
  const demo = leadData.demo === true;
  const db = await getDatabase();
  let pageTitle = leadData.landingPageTitle || leadData.landingPageSlug;
  const now = new Date().toISOString();

  // Find associated landing page to check isolated settings
  const page = (await getPageBySlug(leadData.landingPageSlug)) || db.pages.find((p) => p.slug === leadData.landingPageSlug);
  if (page) {
    pageTitle = page.title;
    if (!demo) page.leadsCount = (page.leadsCount || 0) + 1;
  }

  // Apply isolated tags if configured
  const leadTags = [...(page?.isolatedSettings?.leadTags || []), ...(demo ? ['demo'] : [])];
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

  // 1. Check if Round Robin Lead Distribution is active (Campaign-specific override or Global).
  // Global routing and bot settings are read through the same getters the admin
  // pages write to, so Supabase deployments route with the current staff list.
  const useCustomRr = Boolean(page?.isolatedSettings?.useCustomRoundRobin && page.isolatedSettings.customRoundRobin?.enabled);
  const globalRr = useCustomRr ? null : await getRoundRobinSettings();
  const effectiveRrSettings = useCustomRr
    ? page!.isolatedSettings!.customRoundRobin!
    : (globalRr?.enabled ? globalRr : null);
  const systemSettings = await getSettings();

  const botToken = page?.isolatedSettings?.telegramBotToken || systemSettings.telegramBotToken;

  if (effectiveRrSettings) {
    const need = botToken ? 'chatId' as const : undefined;
    let assignmentReason: AssignmentReason = 'rotation';

    // 1. Same customer as an earlier lead (phone or email) → same salesperson, even from another device.
    let remembered: RoundRobinStaff | null = null;
    if (visitorMemoryMs(effectiveRrSettings) > 0) {
      const previous = await findPreviousLeadOfCustomer(newLead, visitorMemoryMs(effectiveRrSettings));
      remembered = rememberedStaff(effectiveRrSettings, previous?.routing?.staffId, need);
      if (remembered) assignmentReason = 'returning_customer';
    }
    // 2. Same browser as an earlier click or form → same salesperson.
    if (!remembered) {
      remembered = rememberedStaff(effectiveRrSettings, leadData.preferredStaffId, need);
      if (remembered) assignmentReason = 'returning_visitor';
    }
    // 3. Otherwise the rotation. With a bot token, prefer people who can actually receive the alert.
    const selection = remembered
      ? { staff: remembered, effectivePercentage: remembered.percentage || 0, nextIndex: effectiveRrSettings.lastAssignedIndex || 0 }
      : selectNextStaff(effectiveRrSettings, { need, ctx: { pageSlug: newLead.landingPageSlug, nowMs: Date.now() } });
    if (selection) {
      const { staff, effectivePercentage, nextIndex } = selection;
      // Advance the rotation before awaiting Telegram, so a second lead arriving
      // meanwhile goes to the next person instead of the same one.
      effectiveRrSettings.lastAssignedIndex = nextIndex;

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
            fallbackChatId: effectiveRrSettings.fallbackChatId || page?.isolatedSettings?.telegramChatId || systemSettings.telegramChatId,
            managerChatId: effectiveRrSettings.managerChatId || page?.isolatedSettings?.telegramChatId || systemSettings.telegramChatId,
            enableManagerNotification: Boolean(effectiveRrSettings.enableManagerNotification),
            customTemplate: effectiveRrSettings.customMessageTemplate,
            customWhatsappMessage: effectiveRrSettings.customWhatsappMessage,
            defer: runAfterResponse,
            noteLine: demo
              ? '🧪 <b>DEMO / សាកល្បង:</b> test from Simulation Studio, not a real customer. Not counted in any statistics.'
              : assignmentReason === 'returning_customer'
              ? '🔁 <b>អតិថិជនចាស់របស់អ្នក / Returning customer:</b> this person contacted us before and was assigned to you.'
              : assignmentReason === 'returning_visitor'
                ? '🔁 <b>Returning visitor:</b> this person clicked through to you earlier and now sent the form.'
                : staff.workHours && !staffOnShift(staff, Date.now())
                  ? `🌙 <b>ក្រៅម៉ោងធ្វើការ / Outside your hours:</b> nobody was working when this came in. Please contact them when your shift starts${nextOpening(staff.workHours, Date.now()) ? ` (${nextOpening(staff.workHours, Date.now())})` : ''}.`
                  : undefined
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
        assignedAt: now,
        routeType: 'FORM_SUBMISSION',
        assignmentReason
      };

      // Update staff live performance counters (a demo lead counts for nothing).
      if (!demo) {
        staff.totalLeadsRouted = (staff.totalLeadsRouted || 0) + 1;
        countAssignment(staff, Date.now());
        if (dispatchResult.status === 'DELIVERED') {
          staff.successfulDeliveries = (staff.successfulDeliveries || 0) + 1;
        } else {
          staff.failedDeliveries = (staff.failedDeliveries || 0) + 1;
        }
        staff.lastAssignedAt = now;
      }
      if (!useCustomRr) {
        await updateRoundRobinSettings({
          staffList: effectiveRrSettings.staffList,
          lastAssignedIndex: effectiveRrSettings.lastAssignedIndex,
        });
      }

      // Add to Round Robin Audit Logs
      if (!db.roundRobinLogs) db.roundRobinLogs = [];
      const auditLog: RoundRobinLog = {
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
        userAgent: newLead.userAgent,
        assignmentReason,
        ...(demo ? { demo: true } : {})
      };
      db.roundRobinLogs.unshift(auditLog);
      if (db.roundRobinLogs.length > 500) db.roundRobinLogs.length = 500;

      if (isSupabaseConfigured()) {
        try {
          await supabaseSaveRoundRobinLog(auditLog);
        } catch {}
      }
    }
  } else {
    // Fallback: Standard Telegram group broadcast alert if Round Robin is inactive
    const enableAlerts = page?.isolatedSettings?.enableTelegramAlerts !== undefined 
      ? page.isolatedSettings.enableTelegramAlerts 
      : systemSettings.enableTelegramAlerts;
    const token = page?.isolatedSettings?.telegramBotToken || systemSettings.telegramBotToken;
    const chatId = page?.isolatedSettings?.telegramChatId || systemSettings.telegramChatId;

    if (enableAlerts && token && chatId) {
      runAfterResponse(() => sendTelegramAlert(newLead, systemSettings, token, chatId));
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabaseCreateLead(newLead);
    } catch (err) {
      // Keep the lead locally and mark it, so the CRM still shows it and the
      // upload is retried (see syncPendingLeads) instead of silently losing it.
      console.error('Supabase createLead error:', err);
      db.unsyncedLeadIds = [...(db.unsyncedLeadIds || []), newLead.id];
    }
  }

  db.leads.unshift(newLead);
  await saveDatabase(db);

  // Real-time Webhook dispatching (Zapier / Make / HubSpot / Google Sheets)
  if (page?.isolatedSettings?.webhookUrl) {
    const { webhookUrl, webhookSecret } = page.isolatedSettings;
    runAfterResponse(() => dispatchLeadWebhook(newLead, webhookUrl, webhookSecret));
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
  let supabaseDeleted = false;
  if (isSupabaseConfigured()) {
    try {
      supabaseDeleted = await supabaseDeleteLead(id);
    } catch (err) {
      console.error('Supabase deleteLead error:', err);
    }
  }
  const db = await getDatabase();
  const initialLen = db.leads.length;
  db.leads = db.leads.filter((l) => l.id !== id);
  const localDeleted = db.leads.length !== initialLen;
  if (localDeleted) {
    await saveDatabase(db);
  }
  return supabaseDeleted || localDeleted;
}

export async function getSettings(): Promise<SystemSettings> {
  if (isSupabaseConfigured()) {
    try {
      const settings = await cachedSupabaseSettings();
      if (settings) return settings;
    } catch (err) {
      console.error('Supabase getSettings error:', err);
    }
  }
  const db = await getDatabase();
  return db.settings;
}

/**
 * Settings safe to hand to public pages and client components. Everything
 * rendered by a 'use client' component is serialized into the HTML, so bot
 * tokens, chat IDs, password hashes and staff routing data must never reach it.
 */
export async function getPublicSettings(): Promise<SystemSettings> {
  const settings = await getSettings();
  return {
    ...settings,
    telegramBotToken: undefined,
    telegramChatId: undefined,
    roundRobinSettings: undefined,
    ownerEmail: undefined,
    adminEmail: '',
    adminPasswordHash: '',
  };
}

export async function updateSettings(
  partial: Partial<SystemSettings>
): Promise<SystemSettings> {
  let updated: SystemSettings | null = null;
  if (isSupabaseConfigured()) {
    try {
      updated = await supabaseUpdateSettings(partial);
      if (partial.logoUrl !== undefined) await supabaseSetMarker(LOGO_MARKER, partial.logoUrl || '');
      if (updated) {
        const logoUrl = partial.logoUrl !== undefined ? partial.logoUrl : await supabaseGetMarker(LOGO_MARKER).catch(() => null);
        updated = { ...updated, logoUrl: logoUrl || undefined };
      }
    } catch (err) {
      console.error('Supabase updateSettings error:', err);
    }
  }
  const db = await getDatabase();
  db.settings = { ...db.settings, ...partial };
  await saveDatabase(db);
  invalidateCache('settings');
  return updated || db.settings;
}

// ─── Popup ads ─────────────────────────────────────────────────────────────

/**
 * Popup ads and their global settings. Public pages read through the 60 s cache;
 * the admin passes fresh=true so it always edits the latest saved state.
 */
export async function getPopupAds(fresh = false): Promise<PopupAdsState> {
  if (isSupabaseConfigured()) {
    try {
      const remote = fresh ? await supabaseGetPopupAds() : await cachedSupabasePopupAds();
      // undefined = no row yet → an empty state is the truth, not a failure.
      if (remote) return remote;
      if (remote === undefined) return structuredClone(defaultPopupAdsState);
    } catch (err) {
      console.error('Supabase getPopupAds error:', err);
    }
  }
  const db = await getDatabase();
  return db.popupAds || structuredClone(defaultPopupAdsState);
}

/** Cleans and stores the whole popup state (admin save). */
export async function savePopupAds(input: unknown): Promise<PopupAdsState> {
  const current = await getPopupAds(true);
  const state = normalizePopupAdsState(input, new Date().toISOString(), current);
  const db = await getDatabase();
  db.popupAds = state;
  await saveDatabase(db);
  if (isSupabaseConfigured()) {
    try {
      await supabaseSavePopupAds(state);
    } catch (err) {
      console.error('Supabase savePopupAds error:', err);
    }
  }
  invalidateCache('popup-ads');
  return state;
}

/** Display names of uploaded photos (admin photo library). Always read fresh: admin only. */
export async function getMediaMeta(): Promise<MediaMeta> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await supabaseGetMediaMeta();
      if (remote === undefined) return {};
      if (remote !== null) return normalizeMediaMeta(remote);
    } catch (err) {
      console.error('Supabase getMediaMeta error:', err);
    }
  }
  const db = await getDatabase();
  return normalizeMediaMeta(db.mediaLibrary);
}

export async function saveMediaMeta(input: MediaMeta): Promise<MediaMeta> {
  const meta = normalizeMediaMeta(input);
  const db = await getDatabase();
  db.mediaLibrary = meta;
  await saveDatabase(db);
  if (isSupabaseConfigured()) {
    const ok = await supabaseSaveMediaMeta(meta);
    if (!ok) throw new Error('Could not save the photo name. Try again.');
  }
  return meta;
}

/**
 * The popups a public page may show right now, highest priority first. A
 * preview id (admin "Preview" link) is included whatever its state.
 */
export async function getActivePopupAds(slug: string, previewId?: string): Promise<PopupAd[]> {
  const state = await getPopupAds(Boolean(previewId));
  return selectPublicPopupAds(state, slug.toLowerCase().trim(), Date.now(), { previewId });
}

export async function getPopupAdStats(): Promise<PopupAdStatsMap> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await supabaseGetPopupAdStats();
      if (remote) return remote;
      if (remote === undefined) return {};
    } catch (err) {
      console.error('Supabase getPopupAdStats error:', err);
    }
  }
  const db = await getDatabase();
  return db.popupAdStats || {};
}

/**
 * Counts one popup event. Runs after the tracking response; the Supabase row is
 * read-modify-write, so counts are approximate under heavy concurrency.
 */
export async function recordPopupAdEvent(adId: string, detail: PopupEventDetail, reasons: SmartReason[] = []): Promise<void> {
  const kind = detail.kind;
  const now = new Date(detail.nowMs).toISOString();
  const bump = (stats: PopupAdStatsMap) => {
    const s = stats[adId] || { views: 0, clicks: 0, closes: 0 };
    if (kind === 'view') { s.views += 1; s.lastViewAt = now; }
    if (kind === 'click') { s.clicks += 1; s.lastClickAt = now; }
    if (kind === 'close') s.closes += 1;
    if ((kind === 'view' || kind === 'click') && reasons.length) {
      s.smart = s.smart || {};
      for (const r of reasons) {
        const c = s.smart[r] || { views: 0, clicks: 0 };
        if (kind === 'view') c.views += 1;
        else c.clicks += 1;
        s.smart[r] = c;
      }
    }
    applyPopupEvent(s, detail);
    stats[adId] = s;
    return stats;
  };
  const db = await getDatabase();
  db.popupAdStats = bump(db.popupAdStats || {});
  await saveDatabase(db);
  if (isSupabaseConfigured()) {
    try {
      const remote = await supabaseGetPopupAdStats();
      await supabaseSavePopupAdStats(bump(remote || {}));
    } catch (err) {
      console.error('Supabase recordPopupAdEvent error:', err);
    }
  }
}

const WEBHOOK_MARKER_ID = 'telegram_webhook_secured';

function tokenFingerprint(botToken: string): string {
  return crypto.createHash('sha256').update(botToken).digest('hex').slice(0, 16);
}

/**
 * Whether the bot's webhook was registered with a secret token (via
 * POST /api/telegram/setup-webhook) for this bot token. Until it is, the
 * webhook keeps accepting unsigned calls so the live bot doesn't go silent
 * after an upgrade.
 */
export async function isTelegramWebhookSecured(botToken: string): Promise<boolean> {
  const fingerprint = tokenFingerprint(botToken);
  const db = await getDatabase();
  if (db.telegramWebhookSecuredFor === fingerprint) return true;
  if (isSupabaseConfigured()) {
    return (await supabaseGetMarker(WEBHOOK_MARKER_ID).catch(() => null)) === fingerprint;
  }
  return false;
}

export async function setTelegramWebhookSecured(botToken: string | null): Promise<void> {
  const value = botToken ? tokenFingerprint(botToken) : '';
  const db = await getDatabase();
  db.telegramWebhookSecuredFor = value || undefined;
  await saveDatabase(db);
  if (isSupabaseConfigured()) {
    await supabaseSetMarker(WEBHOOK_MARKER_ID, value).catch(() => false);
  }
}

export interface RecordTrackingPayload {
  slug: string;
  eventType?: TrackingEventType;
  sessionId?: string;
  eventData?: Record<string, unknown>;
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

  if (eventType === 'popup_view' || eventType === 'popup_click' || eventType === 'popup_close' || eventType === 'popup_lead') {
    const data = payload.eventData || {};
    const adId = typeof data.adId === 'string' ? data.adId : '';
    if (adId) {
      const kind = eventType === 'popup_view' ? 'view' : eventType === 'popup_click' ? 'click' : eventType === 'popup_close' ? 'close' : 'lead';
      const reasons = parseSmartReasons(data.smartReasons);
      const detail: PopupEventDetail = {
        kind,
        nowMs: Date.now(),
        page: cleanSlug,
        device: payload.deviceType,
        lang: payload.lang,
        source: typeof data.source === 'string' ? data.source : undefined,
        app: (payload.browser && inAppBrowserName(payload.browser)) || 'Browser',
        secondsOpen: typeof data.secondsOpen === 'number' ? data.secondsOpen : undefined,
        secondsOnPage: typeof data.secondsOnPage === 'number' ? data.secondsOnPage : undefined,
        clicked: data.clicked === true,
      };
      runAfterResponse(() => recordPopupAdEvent(adId, detail, reasons));
    }
  }
}

export async function recordPageView(slug: string, referrer?: string): Promise<void> {
  await recordTrackingEvent({ slug, referrer, eventType: 'page_view' });
}

export async function getPageAnalytics(slug: string): Promise<PageAnalyticsSummary> {
  const cleanSlug = slug.toLowerCase().trim();
  const db = await getDatabase();
  // Page and leads from the live store (the local file only holds this server's own recent events).
  const page = (await getPageBySlug(cleanSlug)) || db.pages.find((p) => p.slug === cleanSlug);
  const leads = await getRealLeads({ pageSlug: cleanSlug });
  const views = db.pageViews.filter((v) => (v.pageSlug || '').toLowerCase() === cleanSlug);
  const events = (db.trackingEvents || []).filter((e) => (e.pageSlug || '').toLowerCase() === cleanSlug);

  const totalViews = Math.max(page?.viewsCount || 0, views.length);
  const uniqueSessionSet = new Set<string>();
  views.forEach((v) => {
    if (v.sessionId) uniqueSessionSet.add(v.sessionId);
  });
  // Real counts only; older views without a session id count as one visitor each.
  const uniqueVisitors = uniqueSessionSet.size > 0 ? uniqueSessionSet.size : views.length;
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
      scrolled50,
      clickedCta: ctaClicks,
      telegramClicks,
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
  if (isSupabaseConfigured()) {
    try {
      const remote = await supabaseGetRoundRobinSettings();
      if (remote && Array.isArray(remote.staffList) && remote.staffList.length > 0) {
        return remote;
      }
    } catch (err) {
      console.error('Supabase getRoundRobinSettings error:', err);
    }
  }

  const db = await getDatabase();
  if (!db.settings.roundRobinSettings) {
    db.settings.roundRobinSettings = structuredClone(defaultRoundRobinSettings);
    await saveDatabase(db);
  }
  return db.settings.roundRobinSettings;
}

export async function updateRoundRobinSettings(
  partial: Partial<RoundRobinSettings>
): Promise<RoundRobinSettings> {
  const current = await getRoundRobinSettings();
  const updated: RoundRobinSettings = {
    ...current,
    ...partial,
    lastUpdated: new Date().toISOString()
  };

  const db = await getDatabase();
  db.settings.roundRobinSettings = updated;
  await saveDatabase(db);

  if (isSupabaseConfigured()) {
    try {
      await supabaseUpdateRoundRobinSettings(updated);
    } catch (err) {
      console.error('Supabase updateRoundRobinSettings error:', err);
    }
  }

  return updated;
}

export async function getRoundRobinLogs(limit: number = 100): Promise<RoundRobinLog[]> {
  if (isSupabaseConfigured()) {
    try {
      const remoteLogs = await supabaseGetRoundRobinLogs(limit);
      // An empty log is real (cleared); only a failed read falls back to the local file.
      if (remoteLogs) return remoteLogs;
    } catch (err) {
      console.error('Supabase getRoundRobinLogs error:', err);
    }
  }

  const db = await getDatabase();
  const logs = db.roundRobinLogs || [];
  return logs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export interface DirectContactRoute {
  staff: RoundRobinStaff;
  targetTelegramUrl: string;
  logId: string;
  /** Same visitor again: sent to the same person, nobody re-alerted, nothing re-counted. */
  repeat: boolean;
  /** How long the visitor's browser should remember this person (0 = memory off). */
  rememberSeconds: number;
}

/**
 * Routes a "Chat on Telegram" click. Only the choice of staff happens before the
 * caller redirects; counters, the audit log and the Telegram alerts are written
 * after the response so the visitor reaches the chat immediately.
 */
export async function recordDirectContactRoute(params: {
  pageSlug: string;
  visitorIp?: string;
  userAgent?: string;
  /** Staff id from the visitor's cookie: keep them with the person they already met. */
  preferredStaffId?: string;
  /** False when the caller only wants a repeat match (rate limited): no new assignment is made. */
  allowNewAssignment?: boolean;
  /** Simulation Studio: a real assignment for testing, but not counted anywhere. */
  demo?: boolean;
}): Promise<DirectContactRoute | null> {
  const db = await getDatabase();
  const page = db.pages.find((p) => p.slug === params.pageSlug);
  const useCustomRr = Boolean(page?.isolatedSettings?.useCustomRoundRobin && page.isolatedSettings.customRoundRobin?.enabled);
  const globalRr = useCustomRr ? null : await getRoundRobinSettings();
  const rrSettings = useCustomRr
    ? page!.isolatedSettings!.customRoundRobin!
    : (globalRr?.enabled ? globalRr : null);

  if (!rrSettings || rrSettings.directContactRoutingEnabled === false) {
    return null;
  }

  const rememberSeconds = Math.floor(visitorMemoryMs(rrSettings) / 1000);
  const sticky = rememberedStaff(rrSettings, params.preferredStaffId, 'username');
  if (sticky) {
    return {
      staff: sticky,
      targetTelegramUrl: `https://t.me/${cleanTelegramUsername(sticky.telegramUsername)}`,
      logId: '',
      repeat: true,
      rememberSeconds
    };
  }
  if (params.allowNewAssignment === false) return null;

  const selection = selectNextStaff(rrSettings, { need: 'username', ctx: { pageSlug: params.pageSlug, nowMs: Date.now() } });
  if (!selection) return null;

  const { staff, effectivePercentage, nextIndex } = selection;
  const cleanUsername = cleanTelegramUsername(staff.telegramUsername);
  const now = new Date().toISOString();
  const logId = `rr-click-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const targetTelegramUrl = `https://t.me/${cleanUsername}`;

  // Rotation state is updated in memory now, so a second click arriving before the
  // deferred work runs already sees this assignment.
  if (!params.demo) {
    staff.totalDirectClicks = (staff.totalDirectClicks || 0) + 1;
    countAssignment(staff, Date.now());
    staff.lastAssignedAt = now;
  }
  rrSettings.lastAssignedIndex = nextIndex;

  const pageTitle = page?.title || params.pageSlug;

  runAfterResponse(async () => {
    const systemSettings = await getSettings();
    const botToken = systemSettings.telegramBotToken;
    const stamp = new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' });
    const send = (chatId: string, text: string) =>
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
      }).then(readTelegramResponse);

    const tasks: Promise<unknown>[] = [];

    if (!useCustomRr) {
      tasks.push(updateRoundRobinSettings({ staffList: rrSettings.staffList, lastAssignedIndex: nextIndex }));
    }
    if (!params.demo) tasks.push(recordStaffClick(staff.id, Date.now()));

    let alertNote: string | undefined;
    if (botToken && staff.telegramChatId) {
      const staffAlertText = `⚡ <b>មានអតិថិជនថ្មីទាក់ទងមកអ្នកតាម TELEGRAM! (ROUND ROBIN ROUTING)</b>
━━━━━━━━━━━━━━━━━━━━
📌 <b>យុទ្ធនាការ/ទំព័រ៖</b> <b>${escapeHtml(pageTitle)}</b>
👤 <b>បុគ្គលិកទទួលបន្ទុក៖</b> <b>${escapeHtml(staff.name)}</b> (@${cleanUsername})
📊 <b>ចំណែកភាគរយ (Weight)៖</b> ${effectivePercentage}%
⏰ <b>ពេលវេលា៖</b> ${stamp}
━━━━━━━━━━━━━━━━━━━━
<i>អតិថិជនទើបតែចុចប៊ូតុង Telegram នៅលើគេហទំព័រ ហើយត្រូវបានចាត់ចែងដោយស្វ័យប្រវត្តិតាមប្រព័ន្ធ Round Robin មកកាន់ Telegram របស់អ្នក (@${cleanUsername})។ សូមរៀបចំឆ្លើយតប!</i>`;
      tasks.push(
        send(staff.telegramChatId, params.demo ? `🧪 <b>DEMO / សាកល្បង:</b> test click from Simulation Studio, not a real customer.\n\n${staffAlertText}` : staffAlertText).then((data) => {
          if (!data.ok) alertNote = `Staff alert failed: ${data.description || 'Telegram error'}`;
        })
      );
    } else {
      alertNote = botToken ? 'Staff not alerted: no Chat ID' : 'Staff not alerted: no bot token';
    }

    const managerChatId = rrSettings.managerChatId || systemSettings.telegramChatId;
    if (botToken && rrSettings.enableManagerNotification && managerChatId && String(managerChatId) !== String(staff.telegramChatId)) {
      const managerAlert = `🔔 <b>Round Robin: អតិថិជនចុច Telegram (CC សម្រាប់ Manager)</b>
━━━━━━━━━━━━━━━━━━━━
📌 <b>ទំព័រ៖</b> ${escapeHtml(pageTitle)}
👤 <b>បុគ្គលិកទទួលបន្ទុក៖</b> <b>${escapeHtml(staff.name)}</b> (@${cleanUsername})
📊 <b>ភាគរយ៖</b> ${effectivePercentage}%
⏰ <b>ពេលវេលា៖</b> ${stamp}`;
      tasks.push(send(managerChatId, managerAlert));
    }

    await Promise.allSettled(tasks);

    const logEntry: RoundRobinLog = {
      id: logId,
      timestamp: now,
      routeType: 'DIRECT_CONTACT_CLICK',
      pageSlug: params.pageSlug,
      pageTitle,
      staffId: staff.id,
      staffName: staff.name,
      staffTelegram: staff.telegramUsername,
      staffChatId: staff.telegramChatId,
      percentageWeight: effectivePercentage,
      status: 'DELIVERED',
      deliveryError: alertNote,
      targetTelegramUrl,
      visitorIp: params.visitorIp,
      userAgent: params.userAgent,
      assignmentReason: 'rotation',
      ...(params.demo ? { demo: true } : {})
    };

    if (!db.roundRobinLogs) db.roundRobinLogs = [];
    db.roundRobinLogs.unshift(logEntry);
    if (db.roundRobinLogs.length > 500) db.roundRobinLogs.length = 500;
    await saveDatabase(db);

    if (isSupabaseConfigured()) {
      await supabaseSaveRoundRobinLog(logEntry);
    }
  });

  return { staff, targetTelegramUrl, logId, repeat: false, rememberSeconds };
}


// ─── Salesperson click history (for Team performance) ─────────────────────

/** Telegram clicks per salesperson per day, last 120 days. */
export async function getStaffClickStats(): Promise<StaffClickStats> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await supabaseGetStaffClickStats();
      if (remote) return remote;
      if (remote === undefined) return {};
    } catch (err) {
      console.error('Supabase getStaffClickStats error:', err);
    }
  }
  const db = await getDatabase();
  return db.staffClickStats || {};
}

/** Counts one Telegram click for a salesperson (runs after the redirect). */
export async function recordStaffClick(staffId: string, nowMs: number): Promise<void> {
  const day = phnomPenhDay(nowMs);
  const oldest = phnomPenhDay(nowMs - 119 * 24 * 60 * 60 * 1000);
  const bump = (stats: StaffClickStats) => {
    const row = stats[staffId] || {};
    row[day] = (row[day] || 0) + 1;
    for (const k of Object.keys(row)) if (k < oldest) delete row[k];
    stats[staffId] = row;
    return stats;
  };
  const db = await getDatabase();
  db.staffClickStats = bump(db.staffClickStats || {});
  await saveDatabase(db);
  if (isSupabaseConfigured()) {
    try {
      const remote = await supabaseGetStaffClickStats();
      await supabaseSaveStaffClickStats(bump(remote || {}));
    } catch (err) {
      console.error('Supabase recordStaffClick error:', err);
    }
  }
}

/** A small named flag (Supabase marker, or the local file). */
export async function getMarker(id: string): Promise<string | null> {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseGetMarker(id);
    } catch {
      return null;
    }
  }
  const db = await getDatabase();
  return db.markers?.[id] ?? null;
}

export async function setMarker(id: string, value: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabaseSetMarker(id, value).catch(() => false);
    return;
  }
  const db = await getDatabase();
  db.markers = { ...(db.markers || {}), [id]: value };
  await saveDatabase(db);
}

// ─── Visits (campaign analytics) ───────────────────────────────────────────

/** Saves one visit beacon into its day's row (merged with earlier beacons of the same visit). */
export async function recordVisit(rec: VisitRecord): Promise<void> {
  const id = visitRowId(phnomPenhDay(rec.t0), rec.p);
  if (isSupabaseConfigured()) {
    const list = parseVisitRow(await supabaseGetMarker(id).catch(() => null));
    await supabaseSetMarker(id, JSON.stringify(upsertVisit(list, rec))).catch(() => false);
    await pruneVisits(rec.t0);
    return;
  }
  const db = await getDatabase();
  const log = db.visitLog || {};
  log[id] = upsertVisit(parseVisitRow(JSON.stringify(log[id] || [])), rec);
  db.visitLog = log;
  await saveDatabase(db);
}

/** Visits of the last `days` days (Phnom Penh time), optionally for one page. */
export async function getVisits(days: number, pageSlug?: string, nowMs: number = Date.now()): Promise<VisitRecord[]> {
  const keys = dayKeys(days, nowMs);
  // Rows from the first day up to (not including) the day after the last: safe whatever
  // the database's text ordering does with the ':' separators.
  const from = `visits:${keys[0]}`;
  const before = `visits:${phnomPenhDay(nowMs + 86_400_000)}`;
  let rows: Array<{ id: string; value: string }> = [];
  if (isSupabaseConfigured()) {
    rows = (await supabaseGetMarkerRange(from, before).catch(() => null)) || [];
  } else {
    const db = await getDatabase();
    rows = Object.entries(db.visitLog || {})
      .filter(([id]) => id >= from && id < before)
      .map(([id, list]) => ({ id, value: JSON.stringify(list) }));
  }
  const out: VisitRecord[] = [];
  for (const row of rows) {
    if (pageSlug && !row.id.endsWith(`:${pageSlug}`)) continue;
    out.push(...parseVisitRow(row.value));
  }
  return out;
}

/** Once a day, removes visit rows older than the retention period. */
async function pruneVisits(nowMs: number): Promise<void> {
  const today = phnomPenhDay(nowMs);
  if ((await getMarker('visits_pruned').catch(() => null)) === today) return;
  await setMarker('visits_pruned', today);
  const cutoff = phnomPenhDay(nowMs - VISIT_RETENTION_DAYS * 86_400_000);
  if (isSupabaseConfigured()) await supabaseDeleteMarkerRange('visits:0000', `visits:${cutoff}`).catch(() => false);
}

// ─── Clear demo data (Admin → Settings & Security) ────────────────────────

/** What would be removed: demo leads with their reasons, sample staff, log and stats sizes. */
export async function scanDemoData(): Promise<DemoScan> {
  const [leads, rr, logs, popupStats, pages] = await Promise.all([getLeads(), getRoundRobinSettings(), getRoundRobinLogs(500), getPopupAdStats(), getPages()]);
  const sampleIds = new Set((bundledDb.leads || []).map((l) => l.id));
  const demo = findDemoLeads(leads, sampleIds);
  const demoIds = new Set(demo.map((d) => d.id));
  return {
    leads: demo,
    sampleStaff: rr.staffList.filter(isPlaceholderStaff).map((s) => ({ id: s.id, name: s.name, username: s.telegramUsername })),
    routingLog: { total: logs.length, linkedToDemoLeads: logs.filter((l) => l.demo || (l.leadId && demoIds.has(l.leadId))).length },
    stats: {
      pageViews: pages.reduce((sum, p) => sum + (p.viewsCount || 0), 0),
      popupsWithStats: Object.values(popupStats).filter((s) => s.views || s.clicks || s.closes).length,
      staffWithCounts: rr.staffList.filter((s) => s.totalLeadsRouted || s.totalDirectClicks || s.successfulDeliveries || s.failedDeliveries).length,
    },
  };
}

/**
 * Deletes the chosen demo data. Lead ids are checked again against the demo
 * rules, so a real lead can never be deleted through this path.
 */
export async function clearDemoData(req: ClearDemoRequest): Promise<ClearDemoResult> {
  const scan = await scanDemoData();
  const allowed = new Set(scan.leads.map((l) => l.id));
  const ids = req.leadIds.filter((id) => allowed.has(id));
  const result: ClearDemoResult = { leadsDeleted: 0, staffRemoved: 0, logEntriesRemoved: 0, statsReset: false };

  for (const id of ids) {
    if (await deleteLead(id)) result.leadsDeleted += 1;
  }
  const deleted = new Set(ids);

  if (req.routingLog !== 'none') {
    const logs = await getRoundRobinLogs(500);
    // 'demo': entries of the deleted leads, and entries tagged demo (Simulation Studio clicks).
    const isDemoEntry = (l: RoundRobinLog) => Boolean(l.demo) || Boolean(l.leadId && deleted.has(l.leadId));
    const keep = req.routingLog === 'all' ? [] : logs.filter((l) => !isDemoEntry(l));
    result.logEntriesRemoved = logs.length - keep.length;
    const db = await getDatabase();
    db.roundRobinLogs = req.routingLog === 'all' ? [] : (db.roundRobinLogs || []).filter((l) => !isDemoEntry(l));
    await saveDatabase(db);
    if (isSupabaseConfigured()) await supabaseReplaceRoundRobinLogs(keep);
  }

  let rr = await getRoundRobinSettings();
  if (req.removeSampleStaff) {
    const before = rr.staffList.length;
    const staffList = rr.staffList.filter((s) => !isPlaceholderStaff(s));
    result.staffRemoved = before - staffList.length;
    if (result.staffRemoved) rr = await updateRoundRobinSettings({ staffList, lastAssignedIndex: 0 });
  }

  if (req.resetStats) {
    const staffList = rr.staffList.map((s) => ({ ...s, totalLeadsRouted: 0, totalDirectClicks: 0, successfulDeliveries: 0, failedDeliveries: 0, todayCount: 0, todayDay: undefined }));
    await updateRoundRobinSettings({ staffList });
    const db = await getDatabase();
    db.pageViews = [];
    db.trackingEvents = [];
    db.popupAdStats = {};
    db.staffClickStats = {};
    await saveDatabase(db);
    if (isSupabaseConfigured()) {
      await supabaseSavePopupAdStats({}).catch(() => false);
      await supabaseSaveStaffClickStats({}).catch(() => false);
      await supabaseClearPageViews().catch(() => false);
    }
    // Page counters: views to zero, leads to the number of leads that remain.
    const remaining = await getRealLeads();
    for (const page of await getPages()) {
      const leadsCount = remaining.filter((l) => l.landingPageSlug === page.slug).length;
      if ((page.viewsCount || 0) !== 0 || (page.leadsCount || 0) !== leadsCount) {
        // Only the counters: the rest comes from the stored page, never from this (possibly stale) copy.
        await savePage({ id: page.id, title: page.title, slug: page.slug, viewsCount: 0, leadsCount });
      }
    }
    result.statsReset = true;
  }
  return result;
}

/** Ids of the sample leads that ship with the site (data/db.json). */
export function sampleLeadIds(): Set<string> {
  return new Set((bundledDb.leads || []).map((l) => l.id));
}

/** Adds isDemo to each lead (Simulation Studio, demo tag or shipped sample), for badges and filters. */
export function markDemoLeads(leads: Lead[]): Lead[] {
  const samples = sampleLeadIds();
  return leads.map((l) => ({ ...l, isDemo: isDemoLead(l, samples) }));
}

/** Real customers only: every statistic, summary and report uses this. */
export async function getRealLeads(filter?: { pageSlug?: string; status?: string; search?: string }): Promise<Lead[]> {
  const samples = sampleLeadIds();
  return (await getLeads(filter)).filter((l) => !isDemoLead(l, samples));
}

/** Real leads and recorded visits per page (see page-stats.ts), for the page list and the dashboard. */
export async function getPageStats(days = 30, nowMs: number = Date.now()): Promise<PageStats> {
  const [leads, visits] = await Promise.all([getRealLeads(), getVisits(days, undefined, nowMs)]);
  return computePageStats(leads, visits, nowMs, days);
}

/** The routing log with demo entries marked (tagged demo, or belonging to a demo lead). */
export async function getRoundRobinLogsMarked(limit: number = 100): Promise<RoundRobinLog[]> {
  const [logs, leads] = await Promise.all([getRoundRobinLogs(limit), getLeads()]);
  const demoIds = new Set(markDemoLeads(leads).filter((l) => l.isDemo).map((l) => l.id));
  return logs.map((l) => (l.demo || (l.leadId && demoIds.has(l.leadId)) ? { ...l, demo: true } : l));
}
