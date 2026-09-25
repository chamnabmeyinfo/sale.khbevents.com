import { describe, expect, it } from 'vitest';
import { dailySummaryText, teamPerformance, waitingLeads } from '../staff-performance';
import { assignmentsOn, countAssignment, eligibleStaff, underDailyLimit } from '../round-robin';
import type { Lead, RoundRobinSettings, RoundRobinStaff } from '../types';

// Thursday 1 Oct 2026, 17:00 in Phnom Penh.
const NOW = Date.parse('2026-10-01T10:00:00.000Z');
const DAY = '2026-10-01';
const staff = (id: string, o: Partial<RoundRobinStaff> = {}): RoundRobinStaff => ({
  id, name: id === 'a' ? 'Dara' : id === 'b' ? 'Sokha' : 'Vanna', telegramUsername: id, telegramChatId: `${id}1`, percentage: 33, isActive: true,
  totalLeadsRouted: 0, totalDirectClicks: 0, successfulDeliveries: 0, failedDeliveries: 0, ...o,
});
const lead = (id: string, owner: 'a' | 'b' | 'c', o: Partial<Lead> = {}, claim?: { by: 'a' | 'b' | 'c'; outcome: 'CONTACTED' | 'NO_ANSWER' | 'NOT_INTERESTED'; seconds: number }): Lead => ({
  id, landingPageSlug: 'korea', landingPageTitle: 'Korea <trip>', fullName: `Client ${id}`, email: '', phone: '', eventType: '', status: 'NEW', notes: [],
  createdAt: '2026-10-01T03:00:00.000Z', updatedAt: '',
  routing: {
    staffId: owner, staffName: staff(owner).name, staffTelegram: owner, percentageWeight: 33, status: 'DELIVERED', routedAt: '', routeType: 'FORM_SUBMISSION',
    ...(claim ? { claim: { outcome: claim.outcome, at: '', staffId: claim.by, staffName: staff(claim.by).name, seconds: claim.seconds } } : {}),
  },
  ...o,
});
const leads: Lead[] = [
  lead('1', 'a', { status: 'CONTACTED' }, { by: 'a', outcome: 'CONTACTED', seconds: 120 }),
  lead('2', 'a', { status: 'WON' }, { by: 'a', outcome: 'CONTACTED', seconds: 240 }),
  lead('3', 'b'),
  lead('4', 'c', { status: 'LOST', routing: { ...lead('x', 'c').routing!, handovers: [{ fromStaffId: 'b', fromName: 'Sokha', toStaffId: 'c', toName: 'Vanna', at: '', reason: 'no_response' }], claim: { outcome: 'NOT_INTERESTED', at: '', staffId: 'c', staffName: 'Vanna', seconds: 600 } } }),
  lead('old', 'a', { createdAt: '2026-09-01T03:00:00.000Z' }),
];
const clicks = { a: { [DAY]: 4 }, b: { [DAY]: 2, '2026-09-01': 9 } };
const team = [staff('a'), staff('b'), staff('c')];

describe('team performance', () => {
  it('counts leads, clicks, replies and outcomes per person', () => {
    const p = teamPerformance(leads, clicks, team, { from: DAY, to: DAY });
    const dara = p.rows.find((r) => r.staffId === 'a')!;
    expect(dara).toMatchObject({ formLeads: 2, clicks: 4, tapped: 2, responseRate: 100, avgResponseSeconds: 180, contacted: 2, won: 1, waiting: 0 });
    const sokha = p.rows.find((r) => r.staffId === 'b')!;
    expect(sokha).toMatchObject({ formLeads: 1, clicks: 2, tapped: 0, waiting: 1, passedAway: 1 });
    const vanna = p.rows.find((r) => r.staffId === 'c')!;
    expect(vanna).toMatchObject({ formLeads: 1, receivedFromHandover: 1, notInterested: 1, lost: 1 });
    expect(p.totals).toMatchObject({ formLeads: 4, clicks: 6, tapped: 3, responseRate: 75, won: 1, waiting: 1 });
    expect(p.rows[0].staffId).toBe('a');
    expect(dara.share).toBe(60);
  });

  it('lists leads still waiting', () => {
    expect(waitingLeads(leads, DAY).map((l) => l.id)).toEqual(['3']);
  });

  it('writes a safe daily summary', () => {
    const text = dailySummaryText(leads, clicks, team, DAY);
    expect(text).toContain('<b>4</b> form leads · <b>6</b> Telegram clicks');
    expect(text).toContain('Buttons tapped: <b>3</b> of 4 (75%)');
    expect(text).toContain('<b>Dara</b>: 2 leads · 4 clicks · 2 tapped · avg 3 min');
    expect(text).toContain('Still no reply (1)');
    expect(text).toContain('Korea &lt;trip&gt;');
    expect(text).toContain('Fastest reply: <b>Dara</b>');
    expect(text).not.toMatch(/\n\n\n/);
  });
});

describe('daily limit', () => {
  it('counts per Phnom Penh day and resets the next day', () => {
    const s = staff('a', { dailyLimit: 2 });
    countAssignment(s, NOW);
    countAssignment(s, NOW);
    expect(assignmentsOn(s, DAY)).toBe(2);
    expect(underDailyLimit(s, DAY)).toBe(false);
    expect(underDailyLimit(s, '2026-10-02')).toBe(true);
    countAssignment(s, NOW + 24 * 3600e3);
    expect(s).toMatchObject({ todayDay: '2026-10-02', todayCount: 1 });
  });

  it('prefers people under their limit, but never leaves a lead unassigned', () => {
    const settings: RoundRobinSettings = { enabled: true, algorithm: 'weighted_percentage', staffList: [staff('a', { dailyLimit: 1, todayDay: DAY, todayCount: 1 }), staff('b')] };
    expect(eligibleStaff(settings, 'chatId', { nowMs: NOW }).map((s) => s.id)).toEqual(['b']);
    settings.staffList[1] = staff('b', { dailyLimit: 1, todayDay: DAY, todayCount: 3 });
    expect(eligibleStaff(settings, 'chatId', { nowMs: NOW }).map((s) => s.id)).toEqual(['a', 'b']);
  });
});
