import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import UserGuideClient from '@/components/admin/UserGuideClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Operator User Guide & Blueprint | KHB Events Admin',
  description: 'Step-by-step system user guide and operational blueprint for KHB EVENTS operators and sales teams.'
};

export default async function AdminUserGuidePage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  return <UserGuideClient />;
}
