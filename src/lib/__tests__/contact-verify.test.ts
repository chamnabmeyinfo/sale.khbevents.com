import { describe, expect, it } from 'vitest';
import { botStartPayload, langFromAcceptLanguage, matchContactsToLogs, newRefCode, prefilledMessage, refCodeFromStartPayload, refCodeIn, startsWithGreeting, withRefCode, type RecentContact } from '../contact-verify';
import type { RoundRobinLog } from '../types';

const T0 = Date.parse('2026-09-27T09:00:00Z');
const iso = (ms: number) => new Date(ms).toISOString();
const log = (id: string, staffId: string, atMs: number, o: Partial<RoundRobinLog> = {}): Pick<RoundRobinLog, 'id' | 'timestamp' | 'staffId' | 'refCode' | 'contact' | 'routeType' | 'demo'> => ({
  id, staffId, timestamp: iso(atMs), routeType: 'DIRECT_CONTACT_CLICK', ...o,
});
const chat = (staffId: string, atMs: number, userId: string, text: string): RecentContact => ({ staffId, at: iso(atMs), userId, text, name: `User ${userId}` });

describe('reference codes', () => {
  it('makes readable codes and finds them in messages', () => {
    const code = newRefCode();
    expect(code).toMatch(/^#K[A-HJ-NP-Z2-9]{4}$/);
    expect(refCodeIn(`Hello! I want to know more "Vietnam" ${code}`)).toBe(code);
    expect(refCodeIn('hello #k7x2m thanks')).toBe('#K7X2M');
    expect(refCodeIn('KHMER trip please')).toBeUndefined();
    expect(refCodeIn('')).toBeUndefined();
    expect(newRefCode(() => 0)).toBe('#KAAAA');
  });

  it('writes the first message in the visitor language and appends to a page message', () => {
    expect(prefilledMessage('en')).toBe('Hello 👋');
    expect(prefilledMessage('kh')).toBe('សួស្តី 👋');
    expect(prefilledMessage('en', 'KH')).toBe('សួស្តី 👋');
    expect(prefilledMessage('en', 'VN')).toBe('Hello 👋');
    expect(refCodeIn(prefilledMessage('kh'))).toBeUndefined();
    expect(withRefCode('Hello, seat 3 please', '#KAB23')).toBe('Hello, seat 3 please #KAB23');
    expect(withRefCode('already #KAB23 here', '#KZZZZ')).toBe('already #KAB23 here');
    expect(langFromAcceptLanguage('km-KH,km;q=0.9')).toBe('kh');
    expect(langFromAcceptLanguage('en-US')).toBe('en');
    expect(langFromAcceptLanguage(undefined)).toBe('en');
  });
});

describe('bot start payload', () => {
  it('carries the click code in the bot link and reads it back', () => {
    expect(botStartPayload('#K7X2M')).toBe('k_7X2M');
    expect(refCodeFromStartPayload('k_7X2M')).toBe('#K7X2M');
    expect(refCodeFromStartPayload('k_7x2m')).toBe('#K7X2M');
    expect(refCodeFromStartPayload('khb_smart-city')).toBeUndefined();
    expect(refCodeFromStartPayload('k_7X2M1')).toBeUndefined();
    expect(refCodeFromStartPayload('')).toBeUndefined();
  });
});

describe('matchContactsToLogs', () => {
  it('matches by code first, whatever the timing', () => {
    const logs = [log('a', 's1', T0, { refCode: '#KAB23' }), log('b', 's1', T0 + 60_000, { refCode: '#KCD34' })];
    const m = matchContactsToLogs(logs, [chat('s1', T0 + 3 * 3600_000, 'u1', 'hi #KAB23')], iso(T0));
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ logId: 'a', confirmation: { match: 'ref', userId: 'u1', name: 'User u1', text: 'hi #KAB23' } });
  });

  it('otherwise takes the latest click to the same salesperson within 30 minutes', () => {
    const logs = [log('old', 's1', T0 - 3600_000), log('a', 's1', T0), log('b', 's1', T0 + 5 * 60_000), log('other', 's2', T0 + 6 * 60_000)];
    const m = matchContactsToLogs(logs, [chat('s1', T0 + 8 * 60_000, 'u1', 'Hello, is the trip still open?')]);
    expect(m.map((x) => [x.logId, x.confirmation.match])).toEqual([['b', 'time']]);
  });

  it('uses each click and each chat once, and skips clicks already matched, demo clicks and form leads', () => {
    const logs = [
      log('done', 's1', T0, { contact: { at: '', userId: 'x', match: 'ref', checkedAt: '' } }),
      log('demo', 's1', T0 + 1000, { demo: true }),
      log('form', 's1', T0 + 2000, { routeType: 'FORM_SUBMISSION' }),
      log('a', 's1', T0 + 3000),
    ];
    const m = matchContactsToLogs(logs, [chat('s1', T0 + 60_000, 'u1', 'hello'), chat('s1', T0 + 90_000, 'u2', 'hello too')]);
    expect(m.map((x) => x.logId)).toEqual(['a']);
    expect(m[0].contact.userId).toBe('u1');
  });

  it('ignores chats that began long after, or before, the click', () => {
    const logs = [log('a', 's1', T0)];
    expect(matchContactsToLogs(logs, [chat('s1', T0 + 45 * 60_000, 'u1', 'late')])).toEqual([]);
    expect(matchContactsToLogs(logs, [chat('s1', T0 - 5 * 60_000, 'u1', 'early')])).toEqual([]);
  });

  it('skips chats already matched', () => {
    const logs = [log('a', 's1', T0)];
    expect(matchContactsToLogs(logs, [{ ...chat('s1', T0 + 60_000, 'u1', 'hi'), logId: 'z' }])).toEqual([]);
  });

  it('lets a known person take a click only with the greeting the click typed', () => {
    const logs = [log('a', 's1', T0)];
    const known = (text: string): RecentContact => ({ ...chat('s1', T0 + 60_000, 'u9', text), known: true });
    // An existing customer chatting on, just after someone clicked: not that visitor.
    expect(matchContactsToLogs(logs, [known('Any news about my booking?')])).toEqual([]);
    expect(matchContactsToLogs(logs, [known('សួស្តី 👋\nតម្លៃប៉ុន្មាន?')]).map((x) => x.logId)).toEqual(['a']);
    expect(matchContactsToLogs(logs, [known('Hello 👋')]).map((x) => x.logId)).toEqual(['a']);
  });

  it('never gives a click to a chat the salesperson started', () => {
    // A form lead the salesperson messaged on Telegram answers just after someone else clicked.
    expect(matchContactsToLogs([log('a', 's1', T0)], [{ ...chat('s1', T0 + 60_000, 'u5', 'Yes, I sent the form'), openedByUs: true }])).toEqual([]);
  });

  it('gives the click to a new person with the greeting first, then other new people, then known people', () => {
    // Two new people after one click: the one who sent the greeting takes it, even when they wrote second.
    const one = matchContactsToLogs([log('a', 's1', T0)], [chat('s1', T0 + 60_000, 'u1', 'How much is the trip?'), chat('s1', T0 + 120_000, 'u2', 'សួស្តី 👋')]);
    expect(one.map((x) => [x.logId, x.contact.userId])).toEqual([['a', 'u2']]);
    // Two clicks: the new person goes first and takes the latest; the known person with the greeting gets the other.
    const two = matchContactsToLogs(
      [log('a', 's1', T0), log('b', 's1', T0 + 30_000)],
      [{ ...chat('s1', T0 + 60_000, 'u9', 'Hello 👋'), known: true }, chat('s1', T0 + 70_000, 'u1', 'hi')]
    );
    expect(two.map((x) => [x.logId, x.contact.userId]).sort()).toEqual([['a', 'u9'], ['b', 'u1']]);
  });
});

describe('startsWithGreeting', () => {
  it('recognises the greeting the click types, in either language', () => {
    expect(startsWithGreeting('សួស្តី 👋')).toBe(true);
    expect(startsWithGreeting('  Hello 👋 KHB')).toBe(true);
    expect(startsWithGreeting('hello👋')).toBe(true);
    expect(startsWithGreeting(prefilledMessage('en'))).toBe(true);
    expect(startsWithGreeting(prefilledMessage('kh'))).toBe(true);
    expect(startsWithGreeting('Hello, is the trip still open?')).toBe(false);
    expect(startsWithGreeting('Price? Hello 👋')).toBe(false);
    expect(startsWithGreeting('')).toBe(false);
  });
});
