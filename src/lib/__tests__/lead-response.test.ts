import { describe, expect, it } from 'vitest';
import {
  claimKeyboard,
  claimedKeyboard,
  formatWait,
  handoverCandidate,
  leadIsOverdue,
  MAX_HANDOVERS,
  parseClaimData,
  statusAfterClaim,
} from '../lead-response';
import type { Lead, RoundRobinSettings, RoundRobinStaff } from '../types';

const NOW = Date.parse('2026-10-01T03:00:00.000Z');
const MIN = 60 * 1000;

const staff = (id: string, o: Partial<RoundRobinStaff> = {}): RoundRobinStaff => ({
  id, name: id.toUpperCase(), telegramUsername: id, telegramChatId: `${id}-chat`, percentage: 25, isActive: true,
  totalLeadsRouted: 0, totalDirectClicks: 0, successfulDeliveries: 0, failedDeliveries: 0, ...o,
});
const settings = (o: Partial<RoundRobinSettings> = {}): RoundRobinSettings => ({
  enabled: true, algorithm: 'weighted_percentage', responseMinutes: 15,
  staffList: [staff('a', { lastAssignedAt: '2026-10-01T02:00:00Z' }), staff('b', { lastAssignedAt: '2026-10-01T01:00:00Z' }), staff('c', { lastAssignedAt: '2026-09-30T01:00:00Z' })],
  ...o,
});
const lead = (o: Partial<Lead> = {}, minutesAgo = 20): Lead => ({
  id: 'lead-1790308196905-cp0c', landingPageSlug: 'korea', landingPageTitle: 'Korea', fullName: 'Client', email: '', phone: '012345678',
  eventType: 'Trip', status: 'NEW', notes: [], createdAt: new Date(NOW - minutesAgo * MIN).toISOString(), updatedAt: '',
  routing: {
    staffId: 'a', staffName: 'A', staffTelegram: 'a', staffChatId: 'a-chat', percentageWeight: 25, status: 'DELIVERED',
    routedAt: new Date(NOW - minutesAgo * MIN).toISOString(), routeType: 'FORM_SUBMISSION',
  },
  ...o,
});

describe('lead card buttons', () => {
  it('fit Telegram limits and read back', () => {
    const kb = claimKeyboard('lead-1790308196905-cp0c');
    const data = kb.inline_keyboard.flat().map((b) => b.callback_data!);
    expect(data).toEqual(['rr:c:lead-1790308196905-cp0c', 'rr:n:lead-1790308196905-cp0c', 'rr:x:lead-1790308196905-cp0c']);
    for (const d of data) expect(Buffer.byteLength(d)).toBeLessThanOrEqual(64);
    expect(parseClaimData(data[0])).toEqual({ outcome: 'CONTACTED', leadId: 'lead-1790308196905-cp0c' });
    expect(parseClaimData('rr:n:lead-1')).toEqual({ outcome: 'NO_ANSWER', leadId: 'lead-1' });
    expect(parseClaimData('rr:done')).toBeNull();
    expect(parseClaimData('rr:c:../../x')).toBeNull();
    expect(parseClaimData(42)).toBeNull();
  });

  it('keeps Contacted and Not interested after No answer', () => {
    const claim = { outcome: 'NO_ANSWER' as const, at: '', staffId: 'a', staffName: 'A', seconds: 250 };
    const kb = claimedKeyboard(claim, 'lead-1');
    expect(kb.inline_keyboard[0][0].text).toContain('4 min');
    expect(kb.inline_keyboard[1].map((b) => b.callback_data)).toEqual(['rr:c:lead-1', 'rr:x:lead-1']);
    expect(claimedKeyboard({ ...claim, outcome: 'CONTACTED' }, 'lead-1').inline_keyboard).toHaveLength(1);
  });

  it('moves the CRM status sensibly', () => {
    expect(statusAfterClaim('CONTACTED', 'NEW')).toBe('CONTACTED');
    expect(statusAfterClaim('CONTACTED', 'NEGOTIATING')).toBe('NEGOTIATING');
    expect(statusAfterClaim('NOT_INTERESTED', 'NEW')).toBe('LOST');
    expect(statusAfterClaim('NO_ANSWER', 'NEW')).toBe('NEW');
  });

  it('formats waiting times', () => {
    expect(formatWait(42)).toBe('42 s');
    expect(formatWait(250)).toBe('4 min');
    expect(formatWait(3 * 3600 + 5 * 60)).toBe('3 h 5 min');
  });
});

describe('passing an unanswered lead on', () => {
  it('only when the limit is on, the lead is new, untouched and recent', () => {
    expect(leadIsOverdue(lead(), settings(), NOW)).toBe(true);
    expect(leadIsOverdue(lead({}, 10), settings(), NOW)).toBe(false);
    expect(leadIsOverdue(lead(), settings({ responseMinutes: 0 }), NOW)).toBe(false);
    expect(leadIsOverdue(lead({ status: 'CONTACTED' }), settings(), NOW)).toBe(false);
    const claimed = lead();
    claimed.routing!.claim = { outcome: 'NO_ANSWER', at: '', staffId: 'a', staffName: 'A', seconds: 60 };
    expect(leadIsOverdue(claimed, settings(), NOW)).toBe(false);
    expect(leadIsOverdue(lead({}, 25 * 60), settings(), NOW)).toBe(false);
  });

  it('restarts the clock after a hand-over', () => {
    const l = lead();
    l.routing!.assignedAt = new Date(NOW - 5 * MIN).toISOString();
    expect(leadIsOverdue(l, settings(), NOW)).toBe(false);
  });

  it('picks the colleague who waited longest, never someone who had it', () => {
    expect(handoverCandidate(settings(), lead())!.id).toBe('c');
    const l = lead();
    l.routing!.handovers = [{ fromStaffId: 'x', fromName: 'X', toStaffId: 'c', toName: 'C', at: '', reason: 'no_response' }];
    expect(handoverCandidate(settings(), l)!.id).toBe('b');
    expect(handoverCandidate(settings(), lead(), (s) => s.id !== 'c')!.id).toBe('b');
  });

  it('skips people who are off or cannot get alerts', () => {
    const s = settings({ staffList: [staff('a'), staff('b', { isActive: false }), staff('c', { telegramChatId: '' })] });
    expect(handoverCandidate(s, lead())).toBeNull();
  });

  it('stops after the maximum and waits for the manager alert', () => {
    const l = lead();
    l.routing!.handovers = Array.from({ length: MAX_HANDOVERS }, (_, i) => ({ fromStaffId: `f${i}`, fromName: 'F', toStaffId: `t${i}`, toName: 'T', at: '', reason: 'no_response' as const }));
    expect(handoverCandidate(settings(), l)).toBeNull();
    expect(leadIsOverdue(l, settings(), NOW)).toBe(true);
    l.routing!.managerAlerted = true;
    expect(leadIsOverdue(l, settings(), NOW)).toBe(false);
  });
});

import { eligibleStaff, selectNextStaff, shiftStartMs, staffOnShift, staffServesPage } from '../round-robin';

describe('working hours and page teams', () => {
  // NOW is Thursday 1 Oct 2026, 10:00 in Phnom Penh.
  const day = { days: [1, 2, 3, 4, 5], from: '08:00', to: '18:00' };
  const night = { days: [1, 2, 3, 4, 5], from: '18:00', to: '23:00' };
  const team = () => settings({
    staffList: [
      staff('a', { workHours: day, pages: ['korea'] }),
      staff('b', { workHours: night, pages: ['korea'] }),
      staff('c', { pages: ['vietnam'] }),
    ],
  });

  it('knows who is working and which pages they serve', () => {
    expect(staffOnShift({ workHours: day }, NOW)).toBe(true);
    expect(staffOnShift({ workHours: night }, NOW)).toBe(false);
    expect(staffOnShift({}, NOW)).toBe(true);
    expect(staffServesPage({ pages: ['korea'] }, 'Korea')).toBe(true);
    expect(staffServesPage({ pages: ['korea'] }, 'vietnam')).toBe(false);
    expect(staffServesPage({}, 'vietnam')).toBe(true);
  });

  it('prefers the page team, then who is working now', () => {
    expect(eligibleStaff(team(), 'chatId', { pageSlug: 'korea', nowMs: NOW }).map((s) => s.id)).toEqual(['a']);
    expect(eligibleStaff(team(), 'chatId', { pageSlug: 'vietnam', nowMs: NOW }).map((s) => s.id)).toEqual(['c']);
    // Evening: only b works on the Korea team.
    const evening = NOW + 9 * 60 * MIN;
    expect(eligibleStaff(team(), 'chatId', { pageSlug: 'korea', nowMs: evening }).map((s) => s.id)).toEqual(['b']);
    // A page with no team: everyone, then who works now (c has no hours, a works).
    expect(eligibleStaff(team(), 'chatId', { pageSlug: 'home', nowMs: NOW }).map((s) => s.id)).toEqual(['a', 'c']);
  });

  it('never leaves a lead without someone', () => {
    const lateNight = NOW + 15 * 60 * MIN; // 01:00 Friday: nobody on the Korea team works.
    expect(eligibleStaff(team(), 'chatId', { pageSlug: 'korea', nowMs: lateNight }).map((s) => s.id)).toEqual(['a', 'b']);
    expect(selectNextStaff(team(), { need: 'chatId', ctx: { pageSlug: 'korea', nowMs: lateNight } })).not.toBeNull();
  });

  it('starts the response clock when the shift opens', () => {
    const lateNight = NOW + 15 * 60 * MIN;
    expect(shiftStartMs({ workHours: day }, NOW)).toBe(NOW);
    expect(new Date(shiftStartMs({ workHours: day }, lateNight) + 7 * 3600e3).toISOString()).toBe('2026-10-02T08:00:00.000Z');
    const l = lead({}, 0);
    l.routing!.assignedAt = new Date(lateNight).toISOString();
    const start = shiftStartMs({ workHours: day }, lateNight);
    expect(leadIsOverdue(l, settings(), lateNight + 60 * MIN, start)).toBe(false);
    expect(leadIsOverdue(l, settings(), start + 16 * MIN, start)).toBe(true);
  });
});
