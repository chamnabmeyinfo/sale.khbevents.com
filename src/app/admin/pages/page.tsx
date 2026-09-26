import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getPages, getPageStats } from '@/lib/storage';
import PagesManagerClient from '@/components/admin/PagesManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminPagesListPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  // Real leads and recorded visits, not the old per-page counters.
  const [pages, stats] = await Promise.all([getPages(), getPageStats()]);

  return <PagesManagerClient initialPages={pages} stats={stats} />;
}
