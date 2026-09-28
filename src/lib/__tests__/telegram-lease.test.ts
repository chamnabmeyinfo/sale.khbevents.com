import { describe, expect, it } from 'vitest';
import { AccountBusyError, LEASE_TTL_MS, memoryLeaseStore, withAccountLease } from '../telegram-lease';

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('withAccountLease', () => {
  it('runs the work, then gives the row back', async () => {
    const store = memoryLeaseStore();
    expect(await withAccountLease('s1', async () => 'done', { store })).toBe('done');
    expect(store.rows.get('tg_lease:s1')).toBe('{}');
    expect(await withAccountLease('s1', async () => 'again', { store })).toBe('again');
  });

  it('refuses a second caller while the first holds the account, and lets them in after', async () => {
    const store = memoryLeaseStore();
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    const first = withAccountLease('s2', async () => { await held; return 1; }, { store });
    await tick(10);
    await expect(withAccountLease('s2', async () => 2, { store, waitMs: 0 })).rejects.toBeInstanceOf(AccountBusyError);
    release();
    expect(await first).toBe(1);
    expect(await withAccountLease('s2', async () => 3, { store })).toBe(3);
  });

  it('waits its turn when asked to', async () => {
    const store = memoryLeaseStore();
    const order: number[] = [];
    const a = withAccountLease('s3', async () => { await tick(60); order.push(1); }, { store });
    await tick(5);
    const b = withAccountLease('s3', async () => { order.push(2); }, { store, waitMs: 3000 });
    await Promise.all([a, b]);
    expect(order).toEqual([1, 2]);
  });

  it('keeps different accounts apart', async () => {
    const store = memoryLeaseStore();
    let release!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    const a = withAccountLease('s4a', async () => { await held; }, { store });
    await tick(5);
    expect(await withAccountLease('s4b', async () => 'free', { store, waitMs: 0 })).toBe('free');
    release();
    await a;
  });

  it('releases the lease when the work throws', async () => {
    const store = memoryLeaseStore();
    await expect(withAccountLease('s5', async () => { throw new Error('boom'); }, { store })).rejects.toThrow('boom');
    expect(await withAccountLease('s5', async () => 'ok', { store })).toBe('ok');
  });

  it('respects a lease another server holds, and takes it over once it has expired', async () => {
    const now = Date.parse('2026-09-27T09:00:00Z');
    const store = memoryLeaseStore({ 'tg_lease:s6': JSON.stringify({ owner: 'other-server', until: new Date(now + 1000).toISOString() }) });
    await expect(withAccountLease('s6', async () => 1, { store, nowMs: () => now })).rejects.toBeInstanceOf(AccountBusyError);
    expect(await withAccountLease('s6', async () => 2, { store, nowMs: () => now + LEASE_TTL_MS })).toBe(2);
  });

  it('fails closed when the store cannot be written', async () => {
    const store = { get: async () => null, cas: async () => false };
    await expect(withAccountLease('s7', async () => 1, { store })).rejects.toBeInstanceOf(AccountBusyError);
  });
});

describe('withAccountLease limits', () => {
  it('abandons work that runs past the hold limit and frees the account', async () => {
    const store = memoryLeaseStore();
    const never = new Promise<void>(() => undefined);
    await expect(withAccountLease('s8', () => never, { store, maxHoldMs: 50 })).rejects.toThrow('took too long');
    expect(await withAccountLease('s8', async () => 'free', { store, waitMs: 0 })).toBe('free');
  }, 10_000);

  it('tells timed-out work to close its connection before the account is free again', async () => {
    const store = memoryLeaseStore();
    const events: string[] = [];
    const work = (signal: AbortSignal) => new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => { events.push('disconnect'); setTimeout(() => { events.push('closed'); resolve(); }, 20); });
    });
    await expect(withAccountLease('s9', work, { store, maxHoldMs: 30 })).rejects.toThrow('took too long');
    expect(events).toEqual(['disconnect', 'closed']);
    expect(await withAccountLease('s9', async () => 'next', { store, waitMs: 0 })).toBe('next');
  });
});
