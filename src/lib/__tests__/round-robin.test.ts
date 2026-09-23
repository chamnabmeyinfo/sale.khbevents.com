import { describe, expect, it } from 'vitest';
import {
  eligibleStaff,
  isPlaceholderStaff,
  resolveFallbackTelegramUrl,
  roundRobinHealth,
  selectNextStaff,
} from '../round-robin';
import type { RoundRobinSettings, RoundRobinStaff } from '../types';

const person = (id: string, overrides: Partial<RoundRobinStaff> = {}): RoundRobinStaff => ({
  id,
  name: id,
  telegramUsername: `${id}_tg`,
  telegramChatId: '1',
  percentage: 50,
  isActive: true,
  totalLeadsRouted: 0,
  totalDirectClicks: 0,
  successfulDeliveries: 0,
  failedDeliveries: 0,
  ...overrides,
});

const settings = (staffList: RoundRobinStaff[], overrides: Partial<RoundRobinSettings> = {}): RoundRobinSettings => ({
  enabled: true,
  algorithm: 'weighted_percentage',
  staffList,
  directContactRoutingEnabled: true,
  lastAssignedIndex: 0,
  ...overrides,
});

describe('eligibleStaff', () => {
  it('skips inactive members and, for clicks, members without a username', () => {
    const list = [person('a', { isActive: false }), person('b', { telegramUsername: '' }), person('c', { telegramUsername: '@c_tg' })];
    expect(eligibleStaff(settings(list), 'username').map((s) => s.id)).toEqual(['c']);
  });

  it('for form leads prefers members with a Chat ID but falls back to everyone active', () => {
    expect(eligibleStaff(settings([person('a', { telegramChatId: '' }), person('b')]), 'chatId').map((s) => s.id)).toEqual(['b']);
    expect(eligibleStaff(settings([person('a', { telegramChatId: '' }), person('b', { telegramChatId: '' })]), 'chatId')).toHaveLength(2);
  });

  it('returns nobody for clicks when no active member has a username', () => {
    expect(eligibleStaff(settings([person('a', { telegramUsername: '' })]), 'username')).toEqual([]);
    expect(selectNextStaff(settings([person('a', { telegramUsername: '' })]), { need: 'username' })).toBeNull();
  });
});

describe('selectNextStaff weighted_percentage', () => {
  it('lands exactly on the configured shares and never starves anyone', () => {
    const list = [person('a', { percentage: 60 }), person('b', { percentage: 30 }), person('c', { percentage: 10 })];
    const s = settings(list);
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    let longestRun = 0;
    let run = 0;
    let last = '';
    for (let i = 0; i < 100; i++) {
      const sel = selectNextStaff(s)!;
      sel.staff.totalDirectClicks += 1;
      sel.staff.lastAssignedAt = new Date(i).toISOString();
      s.lastAssignedIndex = sel.nextIndex;
      counts[sel.staff.id] += 1;
      run = sel.staff.id === last ? run + 1 : 1;
      last = sel.staff.id;
      longestRun = Math.max(longestRun, run);
    }
    expect(counts).toEqual({ a: 60, b: 30, c: 10 });
    expect(longestRun).toBeLessThanOrEqual(2);
  });

  it('gives the next assignment to whoever is furthest behind', () => {
    const list = [person('a', { percentage: 50, totalLeadsRouted: 5 }), person('b', { percentage: 50, totalLeadsRouted: 1 })];
    expect(selectNextStaff(settings(list))!.staff.id).toBe('b');
  });

  it('a single eligible member always wins with 100%', () => {
    const sel = selectNextStaff(settings([person('a'), person('b', { isActive: false })]))!;
    expect(sel.staff.id).toBe('a');
    expect(sel.effectivePercentage).toBe(100);
  });

  it('strict round robin rotates in order', () => {
    const s = settings([person('a'), person('b'), person('c')], { algorithm: 'strict_round_robin' });
    const order = [];
    for (let i = 0; i < 4; i++) {
      const sel = selectNextStaff(s)!;
      order.push(sel.staff.id);
      s.lastAssignedIndex = sel.nextIndex;
    }
    expect(order).toEqual(['a', 'b', 'c', 'a']);
  });
});

describe('resolveFallbackTelegramUrl', () => {
  it('prefers the human contact account over the bot', () => {
    expect(resolveFallbackTelegramUrl({ pageSlug: 'x', contactUsername: '@sales_person' })).toBe('https://t.me/sales_person');
  });

  it('uses a bot deep link when the contact is the bot or missing', () => {
    expect(resolveFallbackTelegramUrl({ pageSlug: 'smart-city-tea-cafe', contactUsername: 'khb_sale_admin_bot' })).toBe(
      'https://t.me/khb_sale_admin_bot?start=khb_smart-city-tea-cafe',
    );
    expect(resolveFallbackTelegramUrl({ pageSlug: 'a.b/c' })).toBe('https://t.me/khb_sale_admin_bot?start=khb_a-b-c');
  });
});

describe('roundRobinHealth', () => {
  it('flags the shipped sample accounts as errors', () => {
    const items = roundRobinHealth(settings([person('a', { name: 'Sokha Chen', telegramUsername: 'sokhachen_khb' })]), { telegramConfigured: true });
    expect(isPlaceholderStaff(person('a', { telegramUsername: '@SokhaChen_KHB' }))).toBe(true);
    expect(items.some((i) => i.level === 'error' && i.title.includes('sample account'))).toBe(true);
  });

  it('reports missing usernames, chat ids and token', () => {
    const items = roundRobinHealth(settings([person('a', { telegramUsername: '' }), person('b', { telegramChatId: '' })]), { telegramConfigured: false });
    expect(items.map((i) => i.title)).toEqual(expect.arrayContaining([
      expect.stringContaining('without a Telegram username'),
      'Bot token missing',
    ]));
    const withToken = roundRobinHealth(settings([person('b', { telegramChatId: '' })]), { telegramConfigured: true });
    expect(withToken.some((i) => i.title.includes('without a Chat ID'))).toBe(true);
  });

  it('is green for a reachable team with a manager copy', () => {
    const items = roundRobinHealth(settings([person('a')], { managerChatId: '9' }), { telegramConfigured: true, contactUsername: 'someone' });
    expect(items).toEqual([expect.objectContaining({ level: 'ok' })]);
  });
});
