import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getPages, getPageStats, getRealLeads } from '@/lib/storage';
import DashboardOverviewClient from '@/components/admin/DashboardOverviewClient';
import DataHealthBanner from '@/components/admin/DataHealthBanner';
import { dataHealth } from '@/lib/backups';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect('/admin/login');
  }

  // Demo and test leads never count on the dashboard.
  const [pages, leads, stats, health] = await Promise.all([getPages(), getRealLeads(), getPageStats(), dataHealth().catch(() => null)]);

  return (
    <>
      <DataHealthBanner health={health} />
      <DashboardOverviewClient pages={pages} leads={leads} stats={stats} />
    </>
  );
}

