import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieJar = new Map<string, string>();
const settings = { adminEmail: 'admin@khbevents.com', adminPasswordHash: '' };

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    getAll: () => [...cookieJar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));
vi.mock('../storage', () => ({ getSettings: async () => settings }));

const auth = await import('../auth');

beforeEach(() => {
  cookieJar.clear();
  settings.adminPasswordHash = auth.hashPassword('correct horse');
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
});

describe('password hashing', () => {
  it('stores salted scrypt hashes that verify', () => {
    const a = auth.hashPassword('secret123');
    const b = auth.hashPassword('secret123');
    expect(a).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(a).not.toBe(b);
    expect(auth.verifyPassword('secret123', a)).toBe(true);
    expect(auth.verifyPassword('wrong', a)).toBe(false);
  });

  it('still accepts legacy unsalted SHA-256 hashes', () => {
    const oldPassword = 'legacy-' + 'example-pass';
    const legacy = crypto.createHash('sha256').update(oldPassword).digest('hex');
    expect(auth.verifyPassword(oldPassword, legacy)).toBe(true);
    expect(auth.verifyPassword('nope', legacy)).toBe(false);
  });

  it('rejects empty or malformed stored hashes', () => {
    expect(auth.verifyPassword('x', '')).toBe(false);
    expect(auth.verifyPassword('x', 'scrypt$only-salt')).toBe(false);
  });
});

describe('admin sessions', () => {
  it('accepts a session it issued', async () => {
    await auth.setAdminSession('admin@khbevents.com');
    expect(await auth.isAuthenticated()).toBe(true);
  });

  it('rejects arbitrary cookie values', async () => {
    cookieJar.set('khb_admin_session', 'a'.repeat(64));
    expect(await auth.isAuthenticated()).toBe(false);
  });

  it('rejects a tampered signature or email', async () => {
    await auth.setAdminSession('admin@khbevents.com');
    const [email, exp, sig] = cookieJar.get('khb_admin_session')!.split('.');
    cookieJar.set('khb_admin_session', `${email}.${exp}.${sig.slice(0, -1)}${sig.endsWith('0') ? '1' : '0'}`);
    expect(await auth.isAuthenticated()).toBe(false);
    cookieJar.set('khb_admin_session', `${Buffer.from('evil@x.com').toString('base64url')}.${exp}.${sig}`);
    expect(await auth.isAuthenticated()).toBe(false);
  });

  it('rejects expired sessions', async () => {
    vi.useFakeTimers();
    await auth.setAdminSession('admin@khbevents.com');
    vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
    expect(await auth.isAuthenticated()).toBe(false);
    vi.useRealTimers();
  });

  it('invalidates sessions when the password changes', async () => {
    await auth.setAdminSession('admin@khbevents.com');
    settings.adminPasswordHash = auth.hashPassword('new password');
    expect(await auth.isAuthenticated()).toBe(false);
  });
});

describe('verifyCredentials', () => {
  it('checks both the email and the password', async () => {
    expect(await auth.verifyCredentials('Admin@KHBevents.com ', 'correct horse')).toBe(true);
    expect(await auth.verifyCredentials('admin@khbevents.com', 'wrong')).toBe(false);
    expect(await auth.verifyCredentials('someone@else.com', 'correct horse')).toBe(false);
  });
});

describe('telegram webhook secret', () => {
  it('only accepts the secret derived from the current bot token', () => {
    const secret = auth.getTelegramWebhookSecret('123:abc');
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(auth.isValidTelegramWebhookSecret('123:abc', secret)).toBe(true);
    expect(auth.isValidTelegramWebhookSecret('123:abc', null)).toBe(false);
    expect(auth.isValidTelegramWebhookSecret('123:abc', 'guess')).toBe(false);
    expect(auth.isValidTelegramWebhookSecret('456:rotated', secret)).toBe(false);
  });
});
