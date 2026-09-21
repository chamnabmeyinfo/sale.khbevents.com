import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
  console.error('Please configure them in .env.local first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
  console.log('🔄 Connecting to Supabase at:', supabaseUrl);
  
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('❌ data/db.json not found.');
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(raw);

  // 1. Sync System Settings
  console.log('⚙️ Syncing system settings...');
  const { error: settingsErr } = await supabase.from('system_settings').upsert({
    id: 'default',
    company_name: db.settings.companyName,
    brand_tagline: db.settings.brandTagline,
    phone: db.settings.phone,
    whatsapp_number: db.settings.whatsappNumber,
    telegram_username: db.settings.telegramUsername,
    email: db.settings.email,
    address: db.settings.address,
    facebook_url: db.settings.facebookUrl,
    tiktok_url: db.settings.tiktokUrl,
    telegram_bot_token: db.settings.telegramBotToken,
    telegram_chat_id: db.settings.telegramChatId,
    enable_telegram_alerts: db.settings.enableTelegramAlerts,
    admin_email: db.settings.adminEmail,
    admin_password_hash: db.settings.adminPasswordHash,
  });

  if (settingsErr) {
    console.error('⚠️ Settings sync warning:', settingsErr.message);
  } else {
    console.log('✅ Settings synced successfully.');
  }

  // 2. Sync Landing Pages
  console.log(`📄 Syncing ${db.pages.length} landing pages...`);
  for (const page of db.pages) {
    const { error: pageErr } = await supabase.from('landing_pages').upsert({
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
      form_config: {
        ...(page.formConfig || {}),
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
      },
      meta_title: page.metaTitle,
      meta_description: page.metaDescription,
      og_image: page.ogImage,
      views_count: page.viewsCount || 0,
      leads_count: page.leadsCount || 0,
      created_at: page.createdAt,
      updated_at: page.updatedAt,
    });
    if (pageErr) {
      console.error(`⚠️ Failed to sync page "${page.slug}":`, pageErr.message);
    } else {
      console.log(`  ✅ Synced page: ${page.slug}`);
    }
  }

  // 3. Sync Leads if any
  if (db.leads && db.leads.length > 0) {
    console.log(`📥 Syncing ${db.leads.length} leads...`);
    for (const lead of db.leads) {
      const { error: leadErr } = await supabase.from('leads').upsert({
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
        custom_fields: lead.customFields,
        created_at: lead.createdAt,
        updated_at: lead.updatedAt,
      });
      if (leadErr) {
        console.error(`⚠️ Failed to sync lead "${lead.fullName}":`, leadErr.message);
      }
    }
    console.log('✅ Leads synced.');
  }

  console.log('\n🎉 Complete! Supabase database is fully seeded and ready.');
}

sync().catch(console.error);
