import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getSettings } from '@/lib/storage';
import { maskSecret } from '@/lib/secrets';
import SettingsClient from '@/components/admin/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');

  const stored = await getSettings();
  const settings = { ...stored, adminPasswordHash: '', telegramBotToken: maskSecret(stored.telegramBotToken) };

  return <SettingsClient initialSettings={settings} />;
}
