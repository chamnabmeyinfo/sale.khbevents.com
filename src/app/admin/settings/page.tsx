import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getSettings } from '@/lib/storage';
import SettingsClient from '@/components/admin/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const settings = { ...(await getSettings()), adminPasswordHash: '' };

  return <SettingsClient initialSettings={settings} />;
}
