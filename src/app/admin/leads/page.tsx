import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getLeads, getPages } from '@/lib/storage';
import LeadsCrmClient from '@/components/admin/LeadsCrmClient';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const [leads, pages] = await Promise.all([getLeads(), getPages()]);

  return <LeadsCrmClient initialLeads={leads} pages={pages} />;
}
