import { getSupabase } from './supabase';
import { LandingPage, Lead, LeadStatus, SystemSettings, RoundRobinSettings, RoundRobinLog } from './types';

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
    template: row.template || extra.template || 'b2b-delegation',
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
    translations: row.translations || extra.translations || undefined,
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
      coreValues: page.coreValues,
      problems: page.problems,
      audiences: page.audiences,
      itinerary: page.itinerary,
      valueStack: page.valueStack,
      guarantee: page.guarantee,
      translations: page.translations,
      tracking: page.tracking,
      isolatedSettings: page.isolatedSettings,
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
