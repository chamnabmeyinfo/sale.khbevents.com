import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { scheduleLeadResponseCheck } from '@/lib/lead-followup';
import { getLeads, getPages } from '@/lib/storage';
import LeadsCrmClient from '@/components/admin/LeadsCrmClient';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');
  scheduleLeadResponseCheck();

  const [leads, pages, sp] = await Promise.all([getLeads(), getPages(), searchParams]);
  // Read deep-link params on the server so the first render is already filtered.
  const initialStatus = typeof sp.status === 'string' ? sp.status : undefined;
  const initialLeadId = typeof sp.id === 'string' ? sp.id : undefined;

  return <LeadsCrmClient initialLeads={leads} pages={pages} initialStatus={initialStatus} initialLeadId={initialLeadId} />;
}
