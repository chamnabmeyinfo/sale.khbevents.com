import { describe, expect, it } from 'vitest';
import { chatStatsFrom } from '../contact-verify';
import { chatReplyMinutes, waitDecision } from '../telegram-account';
import { dailySummaryText } from '../staff-performance';
import type { Lead, RoundRobinStaff } from '../types';

// Thursday 1 Oct 2026, 17:00 in Phnom Penh (UTC+7).
const NOW = Date.parse('2026-10-01T10:00:00.000Z');
const MIN = 60_000;
const allWeek = [0, 1, 2, 3, 4, 5, 6];

describe('chatStatsFrom waitingSince', () => {
  it('starts the wait at the customer\'s first message after our last one', () => {
    const s = chatStatsFrom([
      { out: false, atMs: NOW - 60 * MIN },
      { out: true, atMs: NOW - 50 * MIN },
      { out: false, atMs: NOW - 30 * MIN },
      { out: false, atMs: NOW - 10 * MIN },
    ]);
    expect(s.lastFrom).toBe('customer');
    expect(s.waitingSince).toBe(new Date(NOW - 30 * MIN).toISOString());
  });
  it('has no wait when we spoke last, and counts from the first message when we never replied', () => {
    expect(chatStatsFrom([{ out: false, atMs: NOW - 5 * MIN }, { out: true, atMs: NOW - MIN }]).waitingSince).toBeUndefined();
    expect(chatStatsFrom([{ out: false, atMs: NOW - 9 * MIN }, { out: false, atMs: NOW - 2 * MIN }]).waitingSince).toBe(new Date(NOW - 9 * MIN).toISOString());
  });
});

describe('chatReplyMinutes', () => {
  it('defaults to 15, 0 is off, unknown values fall back', () => {
    expect(chatReplyMinutes({})).toBe(15);
    expect(chatReplyMinutes({ chatReplyMinutes: 0 })).toBe(0);
    expect(chatReplyMinutes({ chatReplyMinutes: 30 })).toBe(30);
    expect(chatReplyMinutes({ chatReplyMinutes: 7 })).toBe(15);
  });
});

describe('waitDecision', () => {
  const staff = { telegramChatId: '111', workHours: undefined as RoundRobinStaff['workHours'] };
  const base = { minutes: 15, nowMs: NOW, staff, managerChat: '999' };

  it('reminds the salesperson once the wait passes the minutes, not before', () => {
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 10 * MIN })).toBeNull();
    const d = waitDecision({ ...base, lastIncomingAtMs: NOW - 16 * MIN })!;
    expect(d).toMatchObject({ staff: true, manager: false });
    expect(d.forAt).toBe(new Date(NOW - 16 * MIN).toISOString());
  });

  it('counts from the first unanswered message when the numbers are current, never earlier otherwise', () => {
    const lastAt = new Date(NOW - 5 * MIN).toISOString();
    // Current numbers: first unanswered message 20 min ago → due.
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 5 * MIN, stats: { lastAt, waitingSince: new Date(NOW - 20 * MIN).toISOString() } })?.staff).toBe(true);
    // Numbers older than the dialog (another message since): only the last message counts → not yet.
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 5 * MIN, stats: { lastAt: new Date(NOW - 40 * MIN).toISOString(), waitingSince: new Date(NOW - 40 * MIN).toISOString() } })).toBeNull();
  });

  it('copies the manager at twice the time, once; the salesperson only once per wait', () => {
    const forAt = new Date(NOW - 31 * MIN).toISOString();
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 31 * MIN })).toMatchObject({ staff: true, manager: true });
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 31 * MIN, reminder: { forAt, staffAt: 'x' } })).toMatchObject({ staff: false, manager: true });
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 31 * MIN, reminder: { forAt, staffAt: 'x', managerAt: 'y' } })).toBeNull();
    // A new wait (the customer wrote again after our reply) starts a new cycle.
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 16 * MIN, reminder: { forAt, staffAt: 'x', managerAt: 'y' } })?.staff).toBe(true);
  });

  it('is quiet when off, off shift, for very old waits, and never copies the manager into their own chat', () => {
    expect(waitDecision({ ...base, minutes: 0, lastIncomingAtMs: NOW - 60 * MIN })).toBeNull();
    // Shift 08:00–12:00 Phnom Penh: 17:00 is off shift.
    expect(waitDecision({ ...base, staff: { ...staff, workHours: { days: allWeek, from: '08:00', to: '12:00' } }, lastIncomingAtMs: NOW - 60 * MIN })).toBeNull();
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 25 * 3600_000 })).toBeNull();
    expect(waitDecision({ ...base, managerChat: '111', lastIncomingAtMs: NOW - 40 * MIN })).toMatchObject({ staff: true, manager: false });
  });

  it('reminds at the next shift about a message from days ago, but not about a wait already over 24 h of shift time', () => {
    // Shift on Thursdays only, 16:30–20:00; the message came on Tuesday: the clock starts Thursday 16:30.
    const thursdays = { ...staff, workHours: { days: [4], from: '16:30', to: '20:00' } };
    const d = waitDecision({ ...base, staff: thursdays, lastIncomingAtMs: NOW - 2 * 86_400_000 })!;
    expect(Math.round(d.waitedMs / MIN)).toBe(30);
    // No working hours: a message 25 h ago has waited 25 h of shift time → daily summary only.
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 25 * 3600_000 })).toBeNull();
    // Older than 7 days: never.
    expect(waitDecision({ ...base, staff: thursdays, lastIncomingAtMs: NOW - 8 * 86_400_000 })).toBeNull();
  });

  it('starts the clock when the shift opens for a message that came in off shift', () => {
    // Shift 16:30–20:00 Phnom Penh; message at 16:00 (before the shift), now 17:00 → waited 30 min of shift.
    const shift = { ...staff, workHours: { days: allWeek, from: '16:30', to: '20:00' } };
    const d = waitDecision({ ...base, staff: shift, lastIncomingAtMs: NOW - 60 * MIN })!;
    expect(Math.round(d.waitedMs / MIN)).toBe(30);
    expect(d).toMatchObject({ staff: true, manager: true });
  });
});

describe('daily summary Telegram section', () => {
  const team: RoundRobinStaff[] = [{ id: 'a', name: 'Dara', telegramUsername: 'dara', telegramChatId: 'a1', percentage: 100, isActive: true, totalLeadsRouted: 0, totalDirectClicks: 0, successfulDeliveries: 0, failedDeliveries: 0 }];
  const chatLead = (id: string, chat: Partial<NonNullable<NonNullable<Lead['routing']>['chat']>>, createdAt = '2026-10-01T03:00:00.000Z'): Lead => ({
    id, landingPageSlug: 'vietnam', landingPageTitle: 'Vietnam <trip>', fullName: `Customer ${id}`, email: '', phone: '', eventType: 'Telegram chat', status: 'NEW', notes: [],
    customFields: { telegramUserId: `u${id}` }, createdAt, updatedAt: '',
    routing: { staffId: 'a', staffName: 'Dara', staffTelegram: 'dara', percentageWeight: 100, status: 'DELIVERED', routeType: 'DIRECT_CONTACT_CLICK', chat: { fromCustomer: 1, fromUs: 0, updatedAt: '', ...chat } } as Lead['routing'],
  });
  it('lists new chats, answered, first reply and who is waiting now', () => {
    const leads = [
      chatLead('1', { fromUs: 1, firstReplySeconds: 240, lastFrom: 'us' }),
      chatLead('2', { lastFrom: 'customer', lastAt: '2026-10-01T09:30:00.000Z', waitingSince: '2026-10-01T09:20:00.000Z' }),
      chatLead('3', { lastFrom: 'customer', lastAt: '2026-09-29T02:00:00.000Z', waitingSince: '2026-09-29T02:00:00.000Z' }, '2026-09-29T01:00:00.000Z'),
    ];
    const text = dailySummaryText([], {}, team, '2026-10-01', { leads, nowMs: NOW });
    expect(text).toContain('<b>Telegram chats today</b>: 2 new chats · 1 answered · first reply avg <b>4 min</b>');
    expect(text).toContain('<b>Dara</b>: 2 chats · 1 answered');
    expect(text).toContain('Telegram customers waiting for our reply (2)');
    expect(text).toContain('Customer 3 · Vietnam &lt;trip&gt; · Dara · since 09:00');
    expect(text).toContain('Customer 2 · Vietnam &lt;trip&gt; · Dara · since 16:20');
    expect(text).not.toMatch(/\n\n\n/);
  });
});
