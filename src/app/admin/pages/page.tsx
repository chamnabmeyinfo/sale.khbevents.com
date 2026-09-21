import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getPages } from '@/lib/storage';
import PagesManagerClient from '@/components/admin/PagesManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminPagesListPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const pages = await getPages();

  return <PagesManagerClient initialPages={pages} />;
}
