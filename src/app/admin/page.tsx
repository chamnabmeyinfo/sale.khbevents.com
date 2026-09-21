import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getPages, getLeads } from '@/lib/storage';
import DashboardOverviewClient from '@/components/admin/DashboardOverviewClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect('/admin/login');
  }

  const [pages, leads] = await Promise.all([getPages(), getLeads()]);

  return <DashboardOverviewClient pages={pages} leads={leads} />;
}

