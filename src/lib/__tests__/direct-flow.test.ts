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
  const at = (ms: number) => new Date(ms).toISOString();

  it('reminds the salesperson once the wait passes the minutes, not before', () => {
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 10 * MIN })).toBeNull();
    const d = waitDecision({ ...base, lastIncomingAtMs: NOW - 16 * MIN })!;
    expect(d).toMatchObject({ staff: true, manager: false, forAt: at(NOW - 16 * MIN), waitedMs: 16 * MIN });
    expect(d.again).toBeUndefined();
  });

  it('counts from the first unanswered message when the numbers are current, never earlier otherwise', () => {
    const lastAt = at(NOW - 5 * MIN);
    // Current numbers: first unanswered message 20 min ago → due.
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 5 * MIN, stats: { lastAt, waitingSince: at(NOW - 20 * MIN) } })?.staff).toBe(true);
    // Numbers older than the dialog (another message since): only the last message counts → not yet.
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 5 * MIN, stats: { lastAt: at(NOW - 40 * MIN), waitingSince: at(NOW - 40 * MIN) } })).toBeNull();
  });

  it('tells the manager only after the salesperson had the minutes to answer their reminder, once per wait', () => {
    const w = NOW - 31 * MIN;
    // Twice the time has passed but nobody was reminded yet: the salesperson first, never both at once.
    expect(waitDecision({ ...base, lastIncomingAtMs: w })).toMatchObject({ staff: true, manager: false });
    // Reminded 10 minutes ago: nothing yet. 15 minutes ago: the manager.
    expect(waitDecision({ ...base, lastIncomingAtMs: w, reminder: { forAt: at(w), staffAt: at(NOW - 10 * MIN) } })).toBeNull();
    expect(waitDecision({ ...base, lastIncomingAtMs: w, reminder: { forAt: at(w), staffAt: at(NOW - 15 * MIN) } })).toMatchObject({ staff: false, manager: true });
    expect(waitDecision({ ...base, lastIncomingAtMs: w, reminder: { forAt: at(w), staffAt: at(NOW - 15 * MIN), managerAt: at(NOW - MIN) } })).toBeNull();
    // Reminders sent before this wait began were for an earlier one.
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 16 * MIN, reminder: { forAt: at(w - 60 * MIN), staffAt: at(w - 40 * MIN), managerAt: at(w - 20 * MIN) } })).toMatchObject({ staff: true, manager: false });
  });

  it('reminds the salesperson again when the customer writes after the reminder; the manager still once', () => {
    const since = NOW - 90 * MIN;
    const stats = (lastMs: number) => ({ lastAt: at(lastMs), waitingSince: at(since) });
    const reminder = { forAt: at(since), staffAt: at(NOW - 70 * MIN), managerAt: at(NOW - 55 * MIN) };
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 16 * MIN, stats: stats(NOW - 16 * MIN), reminder })).toMatchObject({ staff: true, manager: false, again: true, forAt: at(since), waitedMs: 90 * MIN });
    // Their new message is only 10 minutes old: not yet. Nothing new since the reminder: nothing.
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 10 * MIN, stats: stats(NOW - 10 * MIN), reminder })).toBeNull();
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 75 * MIN, stats: stats(NOW - 75 * MIN), reminder })).toBeNull();
  });

  it('never copies the manager into the salesperson\'s own chat; without a salesperson chat, the manager at twice the time', () => {
    expect(waitDecision({ ...base, managerChat: '111', lastIncomingAtMs: NOW - 40 * MIN, reminder: { forAt: at(NOW - 40 * MIN), staffAt: at(NOW - 20 * MIN) } })).toBeNull();
    const noChat = { ...staff, telegramChatId: '' };
    expect(waitDecision({ ...base, staff: noChat, lastIncomingAtMs: NOW - 20 * MIN })).toBeNull();
    expect(waitDecision({ ...base, staff: noChat, lastIncomingAtMs: NOW - 31 * MIN })).toMatchObject({ staff: false, manager: true });
  });

  it('is quiet when off, off shift, or for a message over 7 days old', () => {
    expect(waitDecision({ ...base, minutes: 0, lastIncomingAtMs: NOW - 60 * MIN })).toBeNull();
    // Shift 08:00–12:00 Phnom Penh: 17:00 is off shift.
    expect(waitDecision({ ...base, staff: { ...staff, workHours: { days: allWeek, from: '08:00', to: '12:00' } }, lastIncomingAtMs: NOW - 60 * MIN })).toBeNull();
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 8 * 86_400_000 })).toBeNull();
    // Six days unanswered and never reminded (no check ran, or reminders were off): reminded now.
    expect(waitDecision({ ...base, lastIncomingAtMs: NOW - 6 * 86_400_000 })).toMatchObject({ staff: true });
  });

  it('starts the clock when the shift opens for a message that came in off shift', () => {
    // Shift 16:30–20:00 Phnom Penh; message at 16:00 (before the shift), now 17:00: 30 min of shift passed.
    const shift = { ...staff, workHours: { days: allWeek, from: '16:30', to: '20:00' } };
    expect(waitDecision({ ...base, staff: shift, lastIncomingAtMs: NOW - 60 * MIN })).toMatchObject({ staff: true, manager: false, waitedMs: 60 * MIN });
    expect(waitDecision({ ...base, staff: shift, nowMs: NOW - 20 * MIN, lastIncomingAtMs: NOW - 60 * MIN })).toBeNull();
    // Thursdays only: a message from Tuesday is reminded about on Thursday, 15 minutes after the shift opens.
    const thursdays = { ...staff, workHours: { days: [4], from: '16:30', to: '20:00' } };
    expect(waitDecision({ ...base, staff: thursdays, lastIncomingAtMs: NOW - 2 * 86_400_000 })?.staff).toBe(true);
    expect(waitDecision({ ...base, staff: thursdays, nowMs: NOW - 20 * MIN, lastIncomingAtMs: NOW - 2 * 86_400_000 })).toBeNull();
  });

  it('moves a reminder that would fall after closing time to the next shift', () => {
    const weekdays = { ...staff, workHours: { days: [1, 2, 3, 4, 5], from: '08:00', to: '17:00' } };
    const pp = (local: string) => Date.parse(`${local}+07:00`);
    const friday = pp('2026-10-02T16:50:00');
    const d = (nowLocal: string, reminder?: { forAt: string; staffAt?: string }) => waitDecision({ ...base, staff: weekdays, nowMs: pp(nowLocal), lastIncomingAtMs: friday, reminder });
    expect(d('2026-10-02T16:59:00')).toBeNull();
    expect(d('2026-10-02T17:05:00')).toBeNull();
    // Monday: the clock restarted when the shift opened at 08:00.
    expect(d('2026-10-05T08:10:00')).toBeNull();
    expect(d('2026-10-05T08:15:00')).toMatchObject({ staff: true, manager: false });
    const reminded = { forAt: at(friday), staffAt: at(pp('2026-10-05T08:15:00')) };
    expect(d('2026-10-05T08:29:00', reminded)).toBeNull();
    expect(d('2026-10-05T08:30:00', reminded)).toMatchObject({ staff: false, manager: true });
    // Monday 16:50 → Tuesday: the salesperson at 08:15, the manager later, not both at the shift start.
    expect(waitDecision({ ...base, staff: weekdays, nowMs: pp('2026-10-06T08:15:00'), lastIncomingAtMs: pp('2026-10-05T16:50:00') })).toMatchObject({ staff: true, manager: false });
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
    expect(text).toContain('Customer 3 · Vietnam &lt;trip&gt; · Dara · since 29 Sep 09:00');
    expect(text).toContain('Customer 2 · Vietnam &lt;trip&gt; · Dara · since 16:20');
    expect(text).not.toMatch(/\n\n\n/);
    expect(text).not.toContain('not tracked');
  });

  it('names the salespeople whose chats are not tracked, even on a day without chats', () => {
    const text = dailySummaryText([], {}, team, '2026-10-01', { leads: [], nowMs: NOW, untracked: ['Sokha (not connected)', 'Dara (paused by Telegram)'] });
    expect(text).toContain('⚠️ <b>Telegram chats not tracked now</b>: Sokha (not connected), Dara (paused by Telegram)');
  });
});
