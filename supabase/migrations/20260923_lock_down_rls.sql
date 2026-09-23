-- Lock down table access for the public (anon) key.
--
-- The previous policies used `FOR ALL USING (true)` without `TO service_role`,
-- which granted EVERY role — including the public anon key that ships in the
-- browser bundle — full read/write access to leads, pages and system_settings
-- (bot token, password hash, staff chat IDs).
--
-- The app reads and writes tables only from the server with
-- SUPABASE_SERVICE_ROLE_KEY, and the service role bypasses RLS. The browser
-- uses Supabase only for sign-in, so anon needs no table access at all.
--
-- BEFORE running this: make sure SUPABASE_SERVICE_ROLE_KEY is set on the
-- server, otherwise the app (falling back to the anon key) loses DB access.

DROP POLICY IF EXISTS "Service role full access on landing_pages" ON landing_pages;
DROP POLICY IF EXISTS "Service role full access on leads" ON leads;
DROP POLICY IF EXISTS "Service role full access on system_settings" ON system_settings;
DROP POLICY IF EXISTS "Service role full access on page_views" ON page_views;
DROP POLICY IF EXISTS "Public can view company settings" ON system_settings;
DROP POLICY IF EXISTS "Public can view published landing pages" ON landing_pages;
DROP POLICY IF EXISTS "Public can insert leads" ON leads;
DROP POLICY IF EXISTS "Public can insert page views" ON page_views;

-- RLS stays enabled with no policies: anon/authenticated roles are denied,
-- the service role (server) keeps full access.
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
