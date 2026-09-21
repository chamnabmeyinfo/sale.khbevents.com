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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

async function verify() {
  console.log('Testing Public Anon Access (Visitor perspective):');
  const publicClient = createClient(supabaseUrl, anonKey);
  const { data: publicPages, error: err1 } = await publicClient.from('landing_pages').select('slug, title, category, status');
  console.log('Public Pages Result:', err1 || publicPages);

  console.log('\nTesting Admin Service Role Access (CRM / Admin perspective):');
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: adminLeads, error: err2 } = await adminClient.from('leads').select('full_name, company, status, phone');
  console.log('Admin Leads Result:', err2 || adminLeads);

  const { data: adminSettings, error: err3 } = await adminClient.from('system_settings').select('company_name, phone, email, address');
  console.log('Admin Settings Result:', err3 || adminSettings);
}

verify().catch(console.error);
