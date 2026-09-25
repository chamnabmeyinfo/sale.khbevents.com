import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { scheduleLeadResponseCheck } from '@/lib/lead-followup';
import { getSettings, getRoundRobinSettings, getRoundRobinLogs, getPages } from '@/lib/storage';
import { maskSecret } from '@/lib/secrets';
import RoundRobinManagerClient from '@/components/admin/RoundRobinManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminRoundRobinPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');
  scheduleLeadResponseCheck();

  const stored = await getSettings();
  const systemSettings = { ...stored, adminPasswordHash: '', telegramBotToken: maskSecret(stored.telegramBotToken) };
  const roundRobinSettings = await getRoundRobinSettings();
  const logs = await getRoundRobinLogs(150);
  const pages = (await getPages()).map((p) => ({ slug: p.slug, title: p.title }));

  return (
    <RoundRobinManagerClient
      initialSettings={roundRobinSettings}
      initialLogs={logs}
      systemSettings={systemSettings}
      pages={pages}
    />
  );
}
