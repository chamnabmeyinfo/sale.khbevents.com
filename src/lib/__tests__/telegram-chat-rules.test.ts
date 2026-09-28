import { describe, expect, it } from 'vitest';
import { classifyTelegramError, dialogUnchanged, POLL_FAST_MS, POLL_NORMAL_MS, POLL_SLOW_MS, pollDelayMs, sendGuard, shouldMarkRead } from '../telegram-chat-rules';

const NOW = Date.parse('2026-09-27T09:00:00Z');

describe('classifyTelegramError', () => {
  it('reads a flood wait and how long Telegram asked for', () => {
    expect(classifyTelegramError({ errorMessage: 'FLOOD_WAIT_37' })).toEqual({ kind: 'flood', seconds: 37, code: 'FLOOD_WAIT_37' });
    const gramjs = Object.assign(new Error('A wait of 12 seconds is required (caused by messages.GetHistory)'), { seconds: 12 });
    expect(classifyTelegramError(gramjs)).toMatchObject({ kind: 'flood', seconds: 12 });
  });

  it('knows when the session is dead and a person must connect again', () => {
    for (const code of ['AUTH_KEY_UNREGISTERED', 'AUTH_KEY_DUPLICATED', 'SESSION_REVOKED', 'SESSION_EXPIRED', 'USER_DEACTIVATED_BAN']) {
      expect(classifyTelegramError(new Error(code))).toEqual({ kind: 'terminal', code });
    }
    expect(classifyTelegramError({ errorMessage: 'RPCError 401: AUTH_KEY_UNREGISTERED (caused by updates.GetState)' }).kind).toBe('terminal');
  });

  it('does not treat the two-step password prompt or ordinary errors as a dead session', () => {
    expect(classifyTelegramError(new Error('SESSION_PASSWORD_NEEDED')).kind).toBe('other');
    expect(classifyTelegramError(new Error('PEER_ID_INVALID'))).toEqual({ kind: 'other', code: 'PEER_ID_INVALID' });
    expect(classifyTelegramError(new Error('fetch failed')).kind).toBe('other');
    expect(classifyTelegramError(undefined).kind).toBe('other');
  });
});

describe('shouldMarkRead', () => {
  const base = { autoSeen: true, viewing: true, unreadCount: 2, topMessageId: 10, markedMaxId: 7 };

  it('marks only with the option on, a person looking, something unread and a top message not marked yet', () => {
    expect(shouldMarkRead(base)).toBe(true);
    expect(shouldMarkRead({ ...base, autoSeen: false })).toBe(false);
    expect(shouldMarkRead({ ...base, viewing: false })).toBe(false);
    expect(shouldMarkRead({ ...base, unreadCount: 0 })).toBe(false);
    expect(shouldMarkRead({ ...base, markedMaxId: 10 })).toBe(false);
    expect(shouldMarkRead({ ...base, markedMaxId: 11 })).toBe(false);
    expect(shouldMarkRead({ ...base, markedMaxId: undefined })).toBe(true);
  });
});

describe('dialogUnchanged', () => {
  const probe = { topMessageId: 10, unreadCount: 1, readInboxMaxId: 9, readOutboxMaxId: 10 };

  it('is unchanged only when the browser saw the same top message and unread count', () => {
    expect(dialogUnchanged(probe, 10, 1)).toBe(true);
    expect(dialogUnchanged(probe, 10, undefined)).toBe(true);
    expect(dialogUnchanged(probe, 9, 1)).toBe(false);
    expect(dialogUnchanged(probe, 10, 0)).toBe(false);
    expect(dialogUnchanged(probe, undefined, undefined)).toBe(false);
  });
});

describe('sendGuard', () => {
  it('keeps a human pace: 1.5 s between replies, 20 a minute', () => {
    expect(sendGuard(undefined, NOW)).toEqual({ ok: true, retryInMs: 0 });
    expect(sendGuard([new Date(NOW - 500).toISOString()], NOW)).toEqual({ ok: false, retryInMs: 1000 });
    expect(sendGuard([new Date(NOW - 1500).toISOString()], NOW).ok).toBe(true);
    const twenty = Array.from({ length: 20 }, (_, i) => new Date(NOW - 59_000 + i * 2_000).toISOString());
    expect(sendGuard(twenty, NOW)).toEqual({ ok: false, retryInMs: 1000 });
    const old = twenty.map((t) => new Date(Date.parse(t) - 60_000).toISOString());
    expect(sendGuard(old, NOW).ok).toBe(true);
    expect(sendGuard(['not a date'], NOW).ok).toBe(true);
  });
});

describe('pollDelayMs', () => {
  it('looks often around a live conversation and rarely at an old one', () => {
    expect(pollDelayMs({ nowMs: NOW, lastMessageAtMs: NOW - 60_000 })).toBe(POLL_FAST_MS);
    expect(pollDelayMs({ nowMs: NOW, lastMessageAtMs: NOW - 30 * 60_000 })).toBe(POLL_NORMAL_MS);
    expect(pollDelayMs({ nowMs: NOW, lastMessageAtMs: NOW - 3 * 3600_000 })).toBe(POLL_SLOW_MS);
    expect(pollDelayMs({ nowMs: NOW })).toBe(POLL_SLOW_MS);
  });

  it('looks often while the salesperson is typing, whatever the chat\'s age', () => {
    expect(pollDelayMs({ nowMs: NOW, lastMessageAtMs: NOW - 3 * 3600_000, typedAtMs: NOW - 10_000 })).toBe(POLL_FAST_MS);
    expect(pollDelayMs({ nowMs: NOW, typedAtMs: NOW - 5 * 60_000 })).toBe(POLL_SLOW_MS);
  });
});

import { loginErrorHelp } from '../telegram-account';
describe('loginErrorHelp', () => {
  it('turns Telegram login refusals into plain advice', () => {
    expect(loginErrorHelp('PHONE_NUMBER_INVALID')).toMatch(/country code/);
    expect(loginErrorHelp('RPCError 400: API_ID_INVALID (caused by auth.SendCode)')).toMatch(/api_id/);
    expect(loginErrorHelp('A wait of 7200 seconds is required (caused by auth.SendCode)')).toMatch(/2 h/);
    expect(loginErrorHelp('PHONE_NUMBER_FLOOD')).toMatch(/24 hours/);
    expect(loginErrorHelp('something else')).toBe('something else');
  });
});
