import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import { scheduleLeadResponseCheck } from '@/lib/lead-followup';
import { getRealLeads, getRoundRobinSettings, getStaffClickStats } from '@/lib/storage';
import { serverNowMs } from '@/lib/popup-ads';
import TeamPerformanceClient, { type PerfLead } from '@/components/admin/TeamPerformanceClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Team performance | KHB Portal',
};

export default async function TeamPerformancePage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/admin/login');
  scheduleLeadResponseCheck();

  const since = new Date(serverNowMs() - 92 * 24 * 60 * 60 * 1000).toISOString();
  const [leads, clickStats, rr] = await Promise.all([getRealLeads(), getStaffClickStats(), getRoundRobinSettings()]);
  // Only what the page needs; the customer's name only for leads still waiting for a reply.
  const slim: PerfLead[] = leads
    .filter((l) => l.createdAt >= since && l.routing?.routeType === 'FORM_SUBMISSION')
    .map((l) => ({
      id: l.id,
      createdAt: l.createdAt,
      status: l.status,
      landingPageTitle: l.landingPageTitle,
      fullName: l.status === 'NEW' && !l.routing?.claim ? l.fullName : '',
      routing: l.routing,
    }));
  const staff = rr.staffList.map((s) => ({ ...s, telegramChatId: '', phone: undefined, email: undefined }));

  return <TeamPerformanceClient leads={slim} clickStats={clickStats} staffList={staff} nowMs={serverNowMs()} />;
}
