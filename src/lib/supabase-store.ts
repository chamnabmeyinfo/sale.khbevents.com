import { getSupabase } from './supabase';
import { LandingPage, Lead, LeadStatus, SystemSettings, RoundRobinSettings, RoundRobinLog, StaffClickStats,
  PopupAdsState,
  PopupAdStatsMap
} from './types';

// Map database row (snake_case) to LandingPage (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLandingPage(row: any): LandingPage {
  const extra = (row.form_config && typeof row.form_config === 'object' && '_extra' in row.form_config)
    ? row.form_config._extra
    : {};

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle || '',
    description: row.description || '',
    category: row.category || 'General',
    badge: row.badge || undefined,
    status: row.status || 'published',
    // Builder pages keep their template in the JSON extra; an optional `template`
    // column (default 'b2b-delegation') must not turn them back into the old layout.
    template: extra.template === 'builder' ? 'builder' : (row.template || extra.template || 'b2b-delegation'),
    heroHeadline: row.hero_headline || row.title,
    heroSubheadline: row.hero_subheadline || row.subtitle || '',
    heroCtaText: row.hero_cta_text || 'Get Started',
    heroCtaLink: row.hero_cta_link || '#booking-form',
    heroImage: row.hero_image || undefined,
    videoUrl: row.video_url || undefined,
    eventDate: row.event_date || undefined,
    eventTime: row.event_time || undefined,
    venue: row.venue || undefined,
    venueAddress: row.venue_address || undefined,
    countdownEnabled: Boolean(row.countdown_enabled),
    urgency: row.urgency || extra.urgency || undefined,
    sectionVisibility: row.section_visibility || row.sectionVisibility || extra.sectionVisibility || undefined,
    sectionOrder: row.section_order || row.sectionOrder || extra.sectionOrder || undefined,
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    coreValues: Array.isArray(row.core_values) ? row.core_values : (Array.isArray(extra.coreValues) ? extra.coreValues : []),
    problems: Array.isArray(row.problems) ? row.problems : (Array.isArray(extra.problems) ? extra.problems : []),
    audiences: Array.isArray(row.audiences) ? row.audiences : (Array.isArray(extra.audiences) ? extra.audiences : []),
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : (Array.isArray(extra.itinerary) ? extra.itinerary : []),
    valueStack: row.value_stack || row.valueStack || extra.valueStack || undefined,
    packages: Array.isArray(row.packages) ? row.packages : [],
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    testimonials: Array.isArray(row.testimonials) ? row.testimonials : [],
    faqs: Array.isArray(row.faqs) ? row.faqs : [],
    guarantee: row.guarantee || extra.guarantee || undefined,
    expoBooths: Array.isArray(extra.expoBooths) ? extra.expoBooths : [],
    artists: Array.isArray(extra.artists) ? extra.artists : [],
    speakers: Array.isArray(extra.speakers) ? extra.speakers : [],
    translations: row.translations || extra.translations || undefined,
    builder: extra.builder || undefined,
    tracking: row.tracking || extra.tracking || undefined,
    isolatedSettings: row.isolatedSettings || row.isolated_settings || extra.isolatedSettings || undefined,
    formConfig: {
      headline: row.form_config?.headline || 'Inquire or Register',
      subheadline: row.form_config?.subheadline || 'Fill in your details below and our team will get in touch.',
      submitButtonText: row.form_config?.submitButtonText || 'Submit Inquiry',
      successMessage: row.form_config?.successMessage || 'Thank you! We will reach out shortly.',
      fields: Array.isArray(row.form_config?.fields) ? row.form_config.fields : [],
    },
    metaTitle: row.meta_title || `${row.title} | KHB EVENTS`,
    metaDescription: row.meta_description || row.description || '',
    ogImage: row.og_image || undefined,
    viewsCount: Number(row.views_count) || 0,
    leadsCount: Number(row.leads_count) || 0,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Map LandingPage to database row (snake_case)
function landingPageToRow(page: LandingPage) {
  const formConfigWithExtra = {
    ...(page.formConfig || {
      headline: 'Inquire or Register',
      subheadline: 'Fill in your details below and our team will get in touch.',
      submitButtonText: 'Submit Inquiry',
      successMessage: 'Thank you! We will reach out shortly.',
      fields: [],
    }),
    _extra: {
      template: page.template || 'b2b-delegation',
      urgency: page.urgency,
      sectionVisibility: page.sectionVisibility,
      sectionOrder: page.sectionOrder,
      coreValues: page.coreValues,
      problems: page.problems,
      audiences: page.audiences,
      itinerary: page.itinerary,
      valueStack: page.valueStack,
      guarantee: page.guarantee,
      expoBooths: page.expoBooths,
      artists: page.artists,
      speakers: page.speakers,
      translations: page.translations,
      tracking: page.tracking,
      isolatedSettings: page.isolatedSettings,
      builder: page.builder,
    }
  };

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    subtitle: page.subtitle,
    description: page.description,
    category: page.category,
    badge: page.badge,
    status: page.status,
    hero_headline: page.heroHeadline,
    hero_subheadline: page.heroSubheadline,
    hero_cta_text: page.heroCtaText,
    hero_cta_link: page.heroCtaLink,
    hero_image: page.heroImage,
    video_url: page.videoUrl,
    event_date: page.eventDate,
    event_time: page.eventTime,
    venue: page.venue,
    venue_address: page.venueAddress,
    countdown_enabled: page.countdownEnabled,
    highlights: page.highlights,
    packages: page.packages,
    gallery: page.gallery,
    testimonials: page.testimonials,
    faqs: page.faqs,
    form_config: formConfigWithExtra,
    meta_title: page.metaTitle,
    meta_description: page.metaDescription,
    og_image: page.ogImage,
    views_count: page.viewsCount,
    leads_count: page.leadsCount,
    created_at: page.createdAt,
    updated_at: page.updatedAt,
  };
}

// Map database row to Lead
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLead(row: any): Lead {
  return {
    id: row.id,
    landingPageId: row.landing_page_id || undefined,
    landingPageSlug: row.landing_page_slug || 'home',
    landingPageTitle: row.landing_page_title || 'General',
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company || undefined,
    eventType: row.event_type || 'General Inquiry',
    estimatedDate: row.event_date || undefined,
    guestCount: row.guest_count || undefined,
    budgetRange: row.budget_range || undefined,
    packageInterest: row.package_interest || undefined,
    message: row.message || undefined,
    customFields: row.custom_fields || undefined,
    tags: Array.isArray(row.tags) ? row.tags : (Array.isArray(row.custom_fields?._tags) ? row.custom_fields._tags : []),
    routing: row.routing || row.custom_fields?._routing || undefined,
    status: row.status || 'NEW',
    notes: Array.isArray(row.notes) ? row.notes : [],
    utmSource: row.utm_source || undefined,
    utmMedium: row.utm_medium || undefined,
    utmCampaign: row.utm_campaign || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Map database row to SystemSettings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSettings(row: any): SystemSettings {
  return {
    companyName: row.company_name || 'KHB EVENTS',
    brandTagline: row.brand_tagline || 'Cambodia\'s Premier Event Management, Staging & Exhibition Production',
    phone: row.phone || '+855 12 888 999',
    whatsappNumber: row.whatsapp_number || '85512888999',
    telegramUsername: row.telegram_username || 'khb_sale_admin_bot',
    email: row.email || 'sale@khbevents.com',
    address: row.address || 'Diamond Island (Koh Pich), Phnom Penh, Cambodia',
    facebookUrl: row.facebook_url || 'https://facebook.com/khbevents',
    tiktokUrl: row.tiktok_url || 'https://tiktok.com/@khbevents',
    telegramBotToken: row.telegram_bot_token || undefined,
    telegramChatId: row.telegram_chat_id || undefined,
    enableTelegramAlerts: Boolean(row.enable_telegram_alerts),
    ownerEmail: row.owner_email || 'chamnabmey.info@gmail.com',
    adminEmail: row.admin_email || 'admin@khbevents.com',
    adminPasswordHash: row.admin_password_hash || 'a1b7e411516f86b472e391306eb5538e1467472099f4d7b278dfcb74272183e8',
  };
}

export async function supabaseGetPages(): Promise<LandingPage[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.error('Supabase getPages error:', error);
    return [];
  }
  return data.map(rowToLandingPage);
}

export async function supabaseGetPageBySlug(slug: string): Promise<LandingPage | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error || !data) return null;
  return rowToLandingPage(data);
}

export async function supabaseGetPageById(id: string): Promise<LandingPage | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('landing_pages')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return rowToLandingPage(data);
}

export async function supabaseSavePage(page: LandingPage): Promise<LandingPage> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client not initialized');
  const row = landingPageToRow(page);
  const { error } = await supabase
    .from('landing_pages')
    .upsert(row);
  if (error) {
    console.error('Supabase savePage error:', error);
    throw error;
  }
  return page;
}

export async function supabaseDeletePage(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from('landing_pages')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Supabase deletePage error details:', error);
    return false;
  }
  return true;
}

export async function supabaseGetLeads(filter?: {
  pageSlug?: string;
  status?: string;
  search?: string;
}): Promise<Lead[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

  if (filter?.pageSlug && filter.pageSlug !== 'ALL') {
    query = query.eq('landing_page_slug', filter.pageSlug);
  }
  if (filter?.status && filter.status !== 'ALL') {
    query = query.eq('status', filter.status);
  }
  if (filter?.search) {
    const q = `%${filter.search}%`;
    query = query.or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q},company.ilike.${q},message.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Supabase getLeads error:', error);
    return [];
  }
  return data.map(rowToLead);
}

export async function supabaseGetLeadById(id: string): Promise<Lead | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return rowToLead(data);
}

export async function supabaseCreateLead(lead: Lead): Promise<Lead> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('leads')
    .insert({
      id: lead.id,
      landing_page_id: lead.landingPageId,
      landing_page_slug: lead.landingPageSlug,
      landing_page_title: lead.landingPageTitle,
      full_name: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      event_type: lead.eventType,
      event_date: lead.estimatedDate,
      guest_count: lead.guestCount,
      budget_range: lead.budgetRange,
      package_interest: lead.packageInterest,
      message: lead.message,
      status: lead.status,
      notes: lead.notes,
      utm_source: lead.utmSource,
      utm_medium: lead.utmMedium,
      utm_campaign: lead.utmCampaign,
      custom_fields: {
        ...(lead.customFields || {}),
        _tags: lead.tags || [],
        _routing: lead.routing || null
      },
      created_at: lead.createdAt,
      updated_at: lead.updatedAt,
    });
  if (error) {
    console.error('Supabase createLead error:', error);
    throw error;
  }
  return lead;
}

export async function supabaseUpdateLeadStatus(
  id: string,
  status: LeadStatus,
  noteText?: string
): Promise<Lead | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const existing = await supabaseGetLeadById(id);
  if (!existing) return null;

  const notes = [...existing.notes];
  if (noteText) {
    notes.unshift({
      id: `note-${Date.now()}`,
      text: noteText,
      author: 'Admin',
      createdAt: new Date().toISOString(),
    });
  }

  const { error } = await supabase
    .from('leads')
    .update({
      status,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return null;
  return { ...existing, status, notes, updatedAt: new Date().toISOString() };
}

export async function supabaseAddLeadNote(
  id: string,
  text: string,
  author: string = 'Admin'
): Promise<Lead | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const existing = await supabaseGetLeadById(id);
  if (!existing) return null;

  const notes = [
    {
      id: `note-${Date.now()}`,
      text,
      author,
      createdAt: new Date().toISOString(),
    },
    ...existing.notes,
  ];

  const { error } = await supabase
    .from('leads')
    .update({
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return null;
  return { ...existing, notes, updatedAt: new Date().toISOString() };
}

/** Form leads created since a moment, newest first (for the response check). */
export async function supabaseGetLeadsSince(sinceIso: string): Promise<Lead[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error || !data) return null;
  return data.map(rowToLead);
}

/** Saves a lead's status, notes and routing detail (kept in custom_fields._routing). */
export async function supabaseUpdateLeadRouting(lead: Lead): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data: row } = await supabase.from('leads').select('custom_fields').eq('id', lead.id).maybeSingle();
  const custom = (row?.custom_fields && typeof row.custom_fields === 'object' ? row.custom_fields : {}) as Record<string, unknown>;
  const { error } = await supabase
    .from('leads')
    .update({
      status: lead.status,
      notes: lead.notes,
      custom_fields: { ...custom, _routing: lead.routing || null },
      updated_at: lead.updatedAt,
    })
    .eq('id', lead.id);
  if (error) console.error('Supabase updateLeadRouting error:', error);
  return !error;
}

export async function supabaseDeleteLead(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) {
    console.error('Supabase deleteLead error details:', error);
    return false;
  }
  return true;
}

export async function supabaseGetSettings(): Promise<SystemSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 'default')
    .single();
  if (error || !data) return null;
  return rowToSettings(data);
}

export async function supabaseUpdateSettings(
  partial: Partial<SystemSettings>
): Promise<SystemSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (partial.companyName !== undefined) updateData.company_name = partial.companyName;
  if (partial.brandTagline !== undefined) updateData.brand_tagline = partial.brandTagline;
  if (partial.phone !== undefined) updateData.phone = partial.phone;
  if (partial.whatsappNumber !== undefined) updateData.whatsapp_number = partial.whatsappNumber;
  if (partial.telegramUsername !== undefined) updateData.telegram_username = partial.telegramUsername;
  if (partial.email !== undefined) updateData.email = partial.email;
  if (partial.address !== undefined) updateData.address = partial.address;
  if (partial.facebookUrl !== undefined) updateData.facebook_url = partial.facebookUrl;
  if (partial.tiktokUrl !== undefined) updateData.tiktok_url = partial.tiktokUrl;
  if (partial.telegramBotToken !== undefined) updateData.telegram_bot_token = partial.telegramBotToken;
  if (partial.telegramChatId !== undefined) updateData.telegram_chat_id = partial.telegramChatId;
  if (partial.enableTelegramAlerts !== undefined) updateData.enable_telegram_alerts = partial.enableTelegramAlerts;
  if (partial.adminEmail !== undefined) updateData.admin_email = partial.adminEmail;
  if (partial.adminPasswordHash !== undefined) updateData.admin_password_hash = partial.adminPasswordHash;

  const { error } = await supabase
    .from('system_settings')
    .update(updateData)
    .eq('id', 'default');

  if (error) {
    console.error('Supabase updateSettings error:', error);
    return null;
  }
  return await supabaseGetSettings();
}

export async function supabaseRecordPageView(slug: string, referrer?: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from('page_views').insert({
    page_slug: slug,
    referrer: referrer || null,
  });
}

export async function supabaseGetRoundRobinSettings(): Promise<RoundRobinSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('system_settings')
    .select('brand_tagline')
    .eq('id', 'round_robin')
    .single();
  if (error || !data || !data.brand_tagline) return null;
  try {
    return JSON.parse(data.brand_tagline) as RoundRobinSettings;
  } catch {
    return null;
  }
}

export async function supabaseUpdateRoundRobinSettings(
  settings: RoundRobinSettings
): Promise<RoundRobinSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      id: 'round_robin',
      brand_tagline: JSON.stringify(settings),
      updated_at: new Date().toISOString()
    });
  if (error) {
    console.error('Supabase updateRoundRobinSettings error:', error);
    return null;
  }
  return settings;
}

// Deleted-page tombstones, stored as a JSON row in system_settings like the round robin data.
export async function supabaseGetDeletedPages(): Promise<string[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('system_settings')
    .select('brand_tagline')
    .eq('id', 'deleted_pages')
    .maybeSingle();
  if (error) return null;
  if (!data?.brand_tagline) return [];
  try {
    const list = JSON.parse(data.brand_tagline);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function supabaseSaveDeletedPages(list: string[]): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      id: 'deleted_pages',
      brand_tagline: JSON.stringify(list),
      updated_at: new Date().toISOString()
    });
  if (error) console.error('Supabase saveDeletedPages error:', error);
  return !error;
}

// Popup ads (admin → Ads & Popups) and their counters, stored as JSON rows in system_settings.
async function readJsonRow<T>(id: string): Promise<T | null | undefined> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('system_settings')
    .select('brand_tagline')
    .eq('id', id)
    .maybeSingle();
  if (error) return null;
  // undefined = row missing (valid empty state); null = client missing or error.
  if (!data?.brand_tagline) return undefined;
  try {
    return JSON.parse(data.brand_tagline) as T;
  } catch {
    return undefined;
  }
}

async function writeJsonRow(id: string, value: unknown): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from('system_settings')
    .upsert({ id, brand_tagline: JSON.stringify(value), updated_at: new Date().toISOString() });
  if (error) console.error(`Supabase write ${id} error:`, error);
  return !error;
}

/** Popup ads state, or undefined when no row exists yet, or null when Supabase is unavailable. */
export async function supabaseGetPopupAds(): Promise<PopupAdsState | null | undefined> {
  const value = await readJsonRow<PopupAdsState>('popup_ads');
  if (value === null || value === undefined) return value;
  return value && typeof value === 'object' && Array.isArray(value.ads) ? value : undefined;
}

export async function supabaseSavePopupAds(state: PopupAdsState): Promise<boolean> {
  return writeJsonRow('popup_ads', state);
}

export async function supabaseGetPopupAdStats(): Promise<PopupAdStatsMap | null | undefined> {
  const value = await readJsonRow<PopupAdStatsMap>('popup_ad_stats');
  if (value === null || value === undefined) return value;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

export async function supabaseSavePopupAdStats(stats: PopupAdStatsMap): Promise<boolean> {
  return writeJsonRow('popup_ad_stats', stats);
}

/** Photo library display names, or undefined when no row exists yet, or null when Supabase is unavailable. */
export async function supabaseGetMediaMeta(): Promise<unknown> {
  return readJsonRow<unknown>('media_library');
}

export async function supabaseSaveMediaMeta(meta: unknown): Promise<boolean> {
  return writeJsonRow('media_library', meta);
}

// Small key/value markers, stored as rows in system_settings like the data above.
export async function supabaseGetMarker(id: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('system_settings')
    .select('brand_tagline')
    .eq('id', id)
    .maybeSingle();
  if (error) return null;
  return data?.brand_tagline || null;
}

export async function supabaseSetMarker(id: string, value: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from('system_settings')
    .upsert({ id, brand_tagline: value, updated_at: new Date().toISOString() });
  if (error) console.error(`Supabase setMarker(${id}) error:`, error);
  return !error;
}

export async function supabaseGetRoundRobinLogs(limit: number = 100): Promise<RoundRobinLog[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('system_settings')
    .select('brand_tagline')
    .eq('id', 'round_robin_logs')
    .single();
  if (error || !data || !data.brand_tagline) return null;
  try {
    const logs = JSON.parse(data.brand_tagline) as RoundRobinLog[];
    return Array.isArray(logs) ? logs.slice(0, limit) : [];
  } catch {
    return null;
  }
}

export async function supabaseSaveRoundRobinLog(log: RoundRobinLog): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const existing = await supabaseGetRoundRobinLogs(200);
    const updated = [log, ...(existing || [])].slice(0, 200);
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        id: 'round_robin_logs',
        brand_tagline: JSON.stringify(updated),
        updated_at: new Date().toISOString()
      });
    return !error;
  } catch {
    return false;
  }
}

/** Telegram clicks per salesperson per day (row staff_click_stats). */
export async function supabaseGetStaffClickStats(): Promise<StaffClickStats | null | undefined> {
  const value = await readJsonRow<StaffClickStats>('staff_click_stats');
  if (value === null || value === undefined) return value;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

export async function supabaseSaveStaffClickStats(stats: StaffClickStats): Promise<boolean> {
  return writeJsonRow('staff_click_stats', stats);
}

/** Replaces the stored routing log (used when clearing demo data). */
export async function supabaseReplaceRoundRobinLogs(logs: RoundRobinLog[]): Promise<boolean> {
  return writeJsonRow('round_robin_logs', logs.slice(0, 200));
}

/** Deletes every row of the page_views table (used when resetting statistics). */
export async function supabaseClearPageViews(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('page_views').delete().gte('id', 0);
  if (error) console.error('Supabase clearPageViews error:', error);
  return !error;
}
