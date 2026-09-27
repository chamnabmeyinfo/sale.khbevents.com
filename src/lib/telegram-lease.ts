/**
 * One Telegram connection per salesperson account at a time.
 *
 * Telegram invalidates a session it sees used from two connections at once
 * (AUTH_KEY_DUPLICATED), which would log the salesperson out and force a new
 * login that Telegram then throttles. On Vercel several function instances can run
 * at the same moment, so every Telegram call takes this lease first: an in-process
 * queue for requests on the same instance, and a compare-and-swap row in storage
 * for requests on different instances. No lease, no connection: callers get
 * AccountBusyError and try again later.
 */

export interface LeaseStore {
  get(id: string): Promise<string | null>;
  /** Writes `next` only when the row still holds `expected` (null = no row / empty). True when it did. */
  cas(id: string, expected: string | null, next: string): Promise<boolean>;
}

export const LEASE_TTL_MS = 25_000;
/** While the work runs, the row is renewed this often so a long check keeps its lease. */
const RENEW_EVERY_MS = 8_000;
/** No single use of an account may run longer than this (Vercel functions end at 60 s). */
export const MAX_HOLD_MS = 55_000;
const RETRY_STEP_MS = 400;

export class AccountBusyError extends Error {
  retryInMs: number;
  constructor(retryInMs = 3_000) {
    super('Another request is using this Telegram account right now');
    this.name = 'AccountBusyError';
    this.retryInMs = retryInMs;
  }
}

interface LeaseRow {
  owner: string;
  until: string;
}

const EMPTY = '{}';
const leaseId = (staffId: string) => `tg_lease:${staffId}`;

const locks: Map<string, Promise<void>> = ((globalThis as { __khbTgLocks?: Map<string, Promise<void>> }).__khbTgLocks ||= new Map());

let counter = 0;
const nonce = () => `${process.pid || 0}-${Date.now().toString(36)}-${(counter += 1)}`;

function parseRow(raw: string | null): LeaseRow | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<LeaseRow>;
    return v && typeof v.owner === 'string' && typeof v.until === 'string' ? (v as LeaseRow) : null;
  } catch {
    return null;
  }
}

/** Takes the cross-instance lease once, or returns null when someone else holds it. */
async function tryTakeLease(store: LeaseStore, id: string, owner: string, nowMs: number): Promise<boolean> {
  const raw = await store.get(id);
  const row = parseRow(raw);
  const live = row && Date.parse(row.until) > nowMs;
  if (live) return false;
  const next = JSON.stringify({ owner, until: new Date(nowMs + LEASE_TTL_MS).toISOString() } satisfies LeaseRow);
  // Expected: exactly what we read (a stale row, the empty marker, or nothing).
  return store.cas(id, raw && raw !== EMPTY ? raw : raw === EMPTY ? EMPTY : null, next);
}

/**
 * Runs `fn` while holding the account's lease. `waitMs` is how long to wait for a
 * busy lease before giving up with AccountBusyError. The lease is released in
 * `finally`, after `fn` has finished and closed its connection.
 */
export async function withAccountLease<T>(
  staffId: string,
  fn: () => Promise<T>,
  options: { waitMs?: number; store: LeaseStore; nowMs?: () => number; maxHoldMs?: number }
): Promise<T> {
  const waitMs = options.waitMs ?? 0;
  const now = options.nowMs || Date.now;
  const start = now();
  // 1. Same instance: queue behind whoever is using this account.
  const previous = locks.get(staffId) || Promise.resolve();
  let release!: () => void;
  const mine = new Promise<void>((resolve) => { release = resolve; });
  const chain = previous.then(() => mine);
  locks.set(staffId, chain);
  const queue = { state: 'waiting' as 'waiting' | 'got' | 'gaveUp' };
  try {
    await Promise.race([
      previous.then(() => { if (queue.state === 'waiting') queue.state = 'got'; }),
      new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, waitMs))).then(() => { if (queue.state === 'waiting') queue.state = 'gaveUp'; }),
    ]);
    if (queue.state !== 'got') throw new AccountBusyError();

    // 2. Other instances: the storage row.
    const id = leaseId(staffId);
    const owner = nonce();
    let taken = false;
    for (;;) {
      taken = await tryTakeLease(options.store, id, owner, now());
      if (taken) break;
      if (now() - start >= waitMs) throw new AccountBusyError();
      await new Promise((r) => setTimeout(r, RETRY_STEP_MS));
    }
    // Keep the row ours while the work runs (a check with many chats can take a while).
    const renew = setInterval(() => {
      void (async () => {
        const raw = await options.store.get(id).catch(() => null);
        const row = parseRow(raw);
        if (!row || row.owner !== owner || !raw) return;
        const next = JSON.stringify({ owner, until: new Date(now() + LEASE_TTL_MS).toISOString() } satisfies LeaseRow);
        await options.store.cas(id, raw, next).catch(() => false);
      })();
    }, RENEW_EVERY_MS);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const limit = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('The Telegram call took too long and was abandoned')), options.maxHoldMs ?? MAX_HOLD_MS);
      });
      return await Promise.race([fn(), limit]);
    } finally {
      clearInterval(renew);
      if (timer) clearTimeout(timer);
      // Give the row back only if it is still ours.
      const raw = await options.store.get(id).catch(() => null);
      const row = parseRow(raw);
      if (row && row.owner === owner && raw) await options.store.cas(id, raw, EMPTY).catch(() => false);
    }
  } finally {
    release();
    if (locks.get(staffId) === chain) locks.delete(staffId);
  }
}

/** An in-memory store for tests and the local file fallback. */
export function memoryLeaseStore(initial: Record<string, string> = {}): LeaseStore & { rows: Map<string, string> } {
  const rows = new Map(Object.entries(initial));
  return {
    rows,
    get: async (id) => rows.get(id) ?? null,
    cas: async (id, expected, next) => {
      const current = rows.get(id) ?? null;
      const matches = expected === null ? current === null || current === EMPTY || current === '' : current === expected;
      if (!matches) return false;
      rows.set(id, next);
      return true;
    },
  };
}
