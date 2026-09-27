import { describe, expect, it } from 'vitest';
import { awaitingOurReply, chatStatsFrom, telegramDisplayName } from '../contact-verify';
import { telegramReplyStats } from '../staff-performance';
import type { ChatStats, Lead, RoundRobinStaff } from '../types';

const T0 = Date.parse('2026-09-27T09:00:00Z');
const NOW = T0 + 2 * 3600_000;
const DAY = '2026-09-27';

describe('chatStatsFrom', () => {
  it('counts both sides and measures our first reply from the customer\'s first message', () => {
    const s = chatStatsFrom([
      { out: true, atMs: T0 + 600_000 },
      { out: false, atMs: T0 },
      { out: false, atMs: T0 + 60_000 },
      { out: true, atMs: T0 + 240_000 },
    ], 0, new Date(NOW).toISOString());
    expect(s).toMatchObject({ fromCustomer: 2, fromUs: 2, firstReplySeconds: 240, lastFrom: 'us', unread: 0 });
    expect(s.firstCustomerAt).toBe(new Date(T0).toISOString());
    expect(s.firstReplyAt).toBe(new Date(T0 + 240_000).toISOString());
    expect(s.lastAt).toBe(new Date(T0 + 600_000).toISOString());
    expect(awaitingOurReply(s)).toBe(false);
  });

  it('knows when the customer wrote last and nobody answered', () => {
    const s = chatStatsFrom([{ out: false, atMs: T0 }], 1);
    expect(s).toMatchObject({ fromCustomer: 1, fromUs: 0, lastFrom: 'customer', unread: 1 });
    expect(s.firstReplySeconds).toBeUndefined();
    expect(awaitingOurReply(s)).toBe(true);
    expect(awaitingOurReply(undefined)).toBe(false);
  });

  it('ignores our messages sent before the customer ever wrote when timing the reply', () => {
    const s = chatStatsFrom([{ out: true, atMs: T0 - 5000 }, { out: false, atMs: T0 }, { out: true, atMs: T0 + 30_000 }]);
    expect(s.firstReplySeconds).toBe(30);
    expect(s.fromUs).toBe(2);
  });

  it('names a customer from what Telegram gives', () => {
    expect(telegramDisplayName({ userId: '1', name: 'Sok Dara', username: 'sok' })).toBe('Sok Dara');
    expect(telegramDisplayName({ userId: '1', username: 'sok' })).toBe('@sok');
    expect(telegramDisplayName({ userId: '77' })).toBe('Telegram 77');
  });
});

const staff = (id: string, name: string): RoundRobinStaff => ({ id, name, telegramUsername: id, telegramChatId: '1', percentage: 50, isActive: true, totalLeadsRouted: 0, totalDirectClicks: 0, successfulDeliveries: 0, failedDeliveries: 0 });
const chatLead = (id: string, owner: string, chat: ChatStats | undefined, o: Partial<Lead> = {}): Lead => ({
  id, landingPageSlug: 'vn', landingPageTitle: 'Vietnam', fullName: `C ${id}`, email: '', phone: '', eventType: 'Telegram chat', status: 'NEW', notes: [],
  customFields: { telegramUserId: `u${id}` }, createdAt: new Date(T0).toISOString(), updatedAt: '',
  routing: { staffId: owner, staffName: owner, staffTelegram: owner, percentageWeight: 50, status: 'DELIVERED', routedAt: '', routeType: 'DIRECT_CONTACT_CLICK', chat },
  ...o,
});
const stats = (o: Partial<ChatStats>): ChatStats => ({ fromCustomer: 1, fromUs: 0, updatedAt: '', ...o });

describe('telegramReplyStats', () => {
  it('counts chats, replies, first-reply time, waiting and quiet per salesperson', () => {
    const leads = [
      chatLead('1', 'a', stats({ fromUs: 1, firstReplySeconds: 120, lastFrom: 'us', lastAt: new Date(T0 + 1000).toISOString() })),
      chatLead('2', 'a', stats({ lastFrom: 'customer', lastAt: new Date(T0).toISOString() })),
      chatLead('3', 'a', stats({ fromUs: 2, firstReplySeconds: 240, lastFrom: 'us', lastAt: new Date(T0 - 4 * 86_400_000).toISOString() })),
      chatLead('4', 'b', undefined),
      chatLead('5', 'b', stats({ fromUs: 1, firstReplySeconds: 60, lastFrom: 'us' }), { status: 'WON' }),
      chatLead('form', 'a', undefined, { customFields: {}, routing: { staffId: 'a', staffName: 'a', staffTelegram: 'a', percentageWeight: 50, status: 'DELIVERED', routedAt: '', routeType: 'FORM_SUBMISSION' } }),
    ];
    const r = telegramReplyStats(leads, [staff('a', 'a'), staff('b', 'b')], { from: DAY, to: DAY }, NOW);
    const a = r.rows.find((x) => x.staffId === 'a')!;
    expect(a).toMatchObject({ chats: 3, replied: 2, avgFirstReplySeconds: 180, waitingNow: 1, quiet: 1 });
    const b = r.rows.find((x) => x.staffId === 'b')!;
    expect(b).toMatchObject({ chats: 2, replied: 1, won: 1, waitingNow: 0 });
    expect(r.totals).toMatchObject({ chats: 5, replied: 3, waitingNow: 1, quiet: 1, won: 1 });
    expect(r.unknown).toBe(1);
    expect(r.waiting.map((l) => l.id)).toEqual(['2']);
  });

  it('respects the date range', () => {
    const r = telegramReplyStats([chatLead('1', 'a', stats({}))], [staff('a', 'a')], { from: '2026-09-01', to: '2026-09-01' }, NOW);
    expect(r.totals.chats).toBe(0);
  });
});
