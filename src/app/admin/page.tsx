import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getPages, getPageStats, getRealLeads } from '@/lib/storage';
import DashboardOverviewClient from '@/components/admin/DashboardOverviewClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect('/admin/login');
  }

  // Demo and test leads never count on the dashboard.
  const [pages, leads, stats] = await Promise.all([getPages(), getRealLeads(), getPageStats()]);

  return <DashboardOverviewClient pages={pages} leads={leads} stats={stats} />;
}

