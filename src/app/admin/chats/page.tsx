import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import { scheduleLeadResponseCheck } from '@/lib/lead-followup';
import LiveChatInboxClient from '@/components/admin/LiveChatInboxClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Telegram inbox | KHB Portal',
};

export default async function LiveChatInboxPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');
  scheduleLeadResponseCheck();
  const { id } = await searchParams;
  return <LiveChatInboxClient initialId={typeof id === 'string' && /^lead-[a-z0-9-]+$/i.test(id) ? id : undefined} />;
}
