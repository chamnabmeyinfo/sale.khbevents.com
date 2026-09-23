import { describe, expect, it } from 'vitest';
import { getClientIp, rateLimit, resetRateLimit } from '../rate-limit';

describe('rateLimit', () => {
  it('allows up to the limit then blocks until the window resets', () => {
    const key = `test:${Math.random()}`;
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000, now).allowed).toBe(true);
    const blocked = rateLimit(key, 3, 60_000, now + 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(59);
    expect(rateLimit(key, 3, 60_000, now + 60_000).allowed).toBe(true);
  });

  it('can be reset', () => {
    const key = `test:${Math.random()}`;
    rateLimit(key, 1, 60_000);
    expect(rateLimit(key, 1, 60_000).allowed).toBe(false);
    resetRateLimit(key);
    expect(rateLimit(key, 1, 60_000).allowed).toBe(true);
  });
});

describe('getClientIp', () => {
  it('prefers proxy-set headers', () => {
    expect(getClientIp(new Headers({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' }))).toBe('1.1.1.1');
    expect(getClientIp(new Headers({ 'x-real-ip': '2.2.2.2' }))).toBe('2.2.2.2');
  });

  it('uses the right-most X-Forwarded-For entry so clients cannot spoof it', () => {
    expect(getClientIp(new Headers({ 'x-forwarded-for': '6.6.6.6, 3.3.3.3' }))).toBe('3.3.3.3');
  });

  it('falls back to unknown', () => {
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});
