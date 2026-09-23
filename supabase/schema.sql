-- KHB EVENTS - Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Create landing_pages table
CREATE TABLE IF NOT EXISTS landing_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  category TEXT DEFAULT 'General',
  badge TEXT,
  status TEXT DEFAULT 'published',
  hero_headline TEXT,
  hero_subheadline TEXT,
  hero_cta_text TEXT,
  hero_cta_link TEXT,
  hero_image TEXT,
  video_url TEXT,
  event_date TEXT,
  event_time TEXT,
  venue TEXT,
  venue_address TEXT,
  countdown_enabled BOOLEAN DEFAULT false,
  highlights JSONB DEFAULT '[]'::jsonb,
  packages JSONB DEFAULT '[]'::jsonb,
  gallery JSONB DEFAULT '[]'::jsonb,
  testimonials JSONB DEFAULT '[]'::jsonb,
  faqs JSONB DEFAULT '[]'::jsonb,
  form_config JSONB DEFAULT '{}'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  views_count INTEGER DEFAULT 0,
  leads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- (Optional) If you prefer native top-level columns instead of form_config._extra:
-- ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'b2b-delegation';
-- ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS urgency JSONB;
-- ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS section_visibility JSONB;
-- ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS core_values JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS problems JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS audiences JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS value_stack JSONB;
-- ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS guarantee JSONB;

-- 2. Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  landing_page_id TEXT,
  landing_page_slug TEXT DEFAULT 'home',
  landing_page_title TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  event_type TEXT,
  event_date TEXT,
  guest_count TEXT,
  budget_range TEXT,
  package_interest TEXT,
  message TEXT,
  status TEXT DEFAULT 'NEW',
  notes JSONB DEFAULT '[]'::jsonb,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT DEFAULT 'KHB EVENTS',
  brand_tagline TEXT DEFAULT 'Cambodia''s Premier Event Management, Staging & Exhibition Production',
  phone TEXT DEFAULT '+855 12 888 999',
  whatsapp_number TEXT DEFAULT '85512888999',
  telegram_username TEXT DEFAULT 'khbevents',
  email TEXT DEFAULT 'sale@khbevents.com',
  address TEXT DEFAULT 'Diamond Island (Koh Pich), Phnom Penh, Cambodia',
  facebook_url TEXT DEFAULT 'https://facebook.com/khbevents',
  tiktok_url TEXT DEFAULT 'https://tiktok.com/@khbevents',
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  enable_telegram_alerts BOOLEAN DEFAULT false,
  admin_email TEXT DEFAULT 'admin@khbevents.com',
  admin_password_hash TEXT DEFAULT 'a1b7e411516f86b472e391306eb5538e1467472099f4d7b278dfcb74272183e8',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page_slug TEXT NOT NULL,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_page_views_slug ON page_views(page_slug);

-- Enable Row Level Security (RLS)
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- No policies: the anon key (shipped to browsers) gets no table access.
-- The server uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- See migrations/20260923_lock_down_rls.sql for existing databases.

-- Insert default system settings row if it doesn't exist
INSERT INTO system_settings (id) 
VALUES ('default')
ON CONFLICT (id) DO NOTHING;
