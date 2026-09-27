import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAuthenticated } from '@/lib/auth';
import { scheduleLeadResponseCheck } from '@/lib/lead-followup';
import { getRealLeads, getRoundRobinLogsMarked, getRoundRobinSettings, getStaffClickStats, getVisits } from '@/lib/storage';
import type { ContactEntry } from '@/components/admin/VisitorContacts';
import { checkAllAccountsWithin, contactCheckEnabled } from '@/lib/telegram-account';
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

  // Connected Telegram accounts: pick up new chats first, so the list below is current.
  await checkAllAccountsWithin(8000);
  const chatCheck = await contactCheckEnabled().catch(() => false);

  const since = new Date(serverNowMs() - 92 * 24 * 60 * 60 * 1000).toISOString();
  const [leads, clickStats, rr, logs, visits] = await Promise.all([
    getRealLeads(),
    getStaffClickStats(),
    getRoundRobinSettings(),
    getRoundRobinLogsMarked(500),
    getVisits(92, undefined, serverNowMs()).catch(() => []),
  ]);
  // Every click and form lead in the period, with the landing-page visit it came from when the ids match.
  const visitBySession = new Map(visits.map((v) => [v.s, v]));
  const contacts: ContactEntry[] = logs
    .filter((l) => l.timestamp >= since)
    .map((l) => {
      const v = l.visitor?.sessionId ? visitBySession.get(l.visitor.sessionId) : undefined;
      return {
        id: l.id, timestamp: l.timestamp, routeType: l.routeType, pageSlug: l.pageSlug, pageTitle: l.pageTitle,
        staffId: l.staffId, staffName: l.staffName, status: l.status, assignmentReason: l.assignmentReason, demo: l.demo,
        visitorIp: l.visitorIp, userAgent: l.userAgent, visitor: l.visitor, leadId: l.leadId, clientName: l.clientName,
        targetTelegramUrl: l.targetTelegramUrl, deliveryError: l.deliveryError, refCode: l.refCode, contact: l.contact,
        visit: l.visitor?.sessionId ? (v ? { sec: v.sec, sc: v.sc, ret: v.ret, cta: v.cta, tg: v.tg, src: v.src, cmp: v.cmp, ref: v.ref, dev: v.dev, app: v.app, lang: v.lang, t0: v.t0, fs: v.fs, lead: v.lead } : null) : undefined,
      };
    });
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

  return <TeamPerformanceClient leads={slim} clickStats={clickStats} staffList={staff} nowMs={serverNowMs()} contacts={contacts} chatCheck={chatCheck} />;
}
