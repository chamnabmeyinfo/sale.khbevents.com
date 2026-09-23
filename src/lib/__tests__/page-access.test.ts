import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LandingPage } from '../types';

const cookieJar = new Map<string, string>();
let pages: LandingPage[] = [];
let isAdmin = false;

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
  }),
}));
vi.mock('../storage', () => ({
  getPageBySlug: async (slug: string) => pages.find((p) => p.slug === slug) || null,
}));
vi.mock('../auth', () => ({ isAuthenticated: async () => isAdmin }));

const access = await import('../page-access');

function makePage(overrides: Partial<LandingPage> = {}): LandingPage {
  return { id: 'page-1', slug: 'vip', title: 'VIP Trip', status: 'published', ...overrides } as LandingPage;
}

const protectedSettings = {
  accessProtection: 'password' as const,
  passwordPin: '4321',
  partnerName: 'Partner Co',
  telegramBotToken: 'secret-token',
  webhookSecret: 'hook-secret',
  webhookUrl: 'https://hooks.example.com',
  telegramChatId: '999',
  customRoundRobin: { enabled: true } as never,
};

beforeEach(() => {
  cookieJar.clear();
  pages = [];
  isAdmin = false;
});

describe('toPublicPage', () => {
  it('removes secrets but keeps display fields', () => {
    const pub = access.toPublicPage(makePage({ isolatedSettings: protectedSettings }));
    expect(pub.isolatedSettings).toEqual({ accessProtection: 'password', partnerName: 'Partner Co' });
  });
});

describe('loadPublicPage', () => {
  it('returns null for unknown slugs so fallback content can render', async () => {
    expect(await access.loadPublicPage('missing')).toEqual({ kind: 'ok', page: null });
  });

  it('hides archived pages from everyone and drafts from the public', async () => {
    pages = [makePage({ slug: 'old', status: 'archived' }), makePage({ slug: 'wip', status: 'draft' })];
    expect((await access.loadPublicPage('old')).kind).toBe('not_found');
    expect((await access.loadPublicPage('wip')).kind).toBe('not_found');
    isAdmin = true;
    expect((await access.loadPublicPage('old')).kind).toBe('not_found');
    expect((await access.loadPublicPage('wip')).kind).toBe('ok');
  });

  it('locks passcode pages and reveals only branding', async () => {
    pages = [makePage({ isolatedSettings: protectedSettings })];
    const result = await access.loadPublicPage('vip');
    expect(result).toEqual({
      kind: 'locked',
      stub: { slug: 'vip', title: 'VIP Trip', partnerName: 'Partner Co', partnerLogo: undefined, phone: undefined },
    });
    expect(JSON.stringify(result)).not.toContain('4321');
  });

  it('unlocks with a valid cookie, and re-locks when the PIN changes', async () => {
    const page = makePage({ isolatedSettings: protectedSettings });
    pages = [page];
    cookieJar.set(access.pageUnlockCookieName(page), access.pageUnlockToken(page));
    const result = await access.loadPublicPage('vip');
    expect(result.kind).toBe('ok');
    expect(JSON.stringify(result)).not.toContain('4321');

    pages = [makePage({ isolatedSettings: { ...protectedSettings, passwordPin: '9999' } })];
    expect((await access.loadPublicPage('vip')).kind).toBe('locked');
  });

  it('lets admins through without a passcode', async () => {
    pages = [makePage({ isolatedSettings: protectedSettings })];
    isAdmin = true;
    expect((await access.loadPublicPage('vip')).kind).toBe('ok');
  });
});

describe('isCorrectPagePin', () => {
  it('compares trimmed input against the PIN', () => {
    const page = makePage({ isolatedSettings: protectedSettings });
    expect(access.isCorrectPagePin(page, ' 4321 ')).toBe(true);
    expect(access.isCorrectPagePin(page, '1234')).toBe(false);
  });
});
