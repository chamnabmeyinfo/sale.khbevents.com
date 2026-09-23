import crypto from 'crypto';
import { cookies } from 'next/headers';
import { isAuthenticated } from './auth';
import { getPageBySlug } from './storage';
import { LandingPage, IsolatedPageSettings } from './types';

export const PAGE_UNLOCK_MAX_AGE_SECONDS = 60 * 60 * 12;

// Page fields that only the server may see. Anything else on a page is
// rendered by client components and therefore ends up in the public HTML.
const PRIVATE_ISOLATED_KEYS = [
  'passwordPin',
  'accessPassword',
  'telegramBotToken',
  'telegramChatId',
  'webhookUrl',
  'webhookSecret',
  'customRoundRobin',
  'useCustomRoundRobin',
] as const satisfies ReadonlyArray<keyof IsolatedPageSettings>;

export function getPagePin(page: LandingPage): string {
  if (page.isolatedSettings?.accessProtection !== 'password') return '';
  return (page.isolatedSettings.passwordPin || '').trim();
}

export function toPublicPage(page: LandingPage): LandingPage {
  if (!page.isolatedSettings) return page;
  const isolatedSettings = { ...page.isolatedSettings };
  for (const key of PRIVATE_ISOLATED_KEYS) delete isolatedSettings[key];
  return { ...page, isolatedSettings };
}

/** The minimum a locked page reveals: enough to brand the passcode screen. */
export function toLockedPageStub(page: LandingPage) {
  return {
    slug: page.slug,
    title: page.title,
    partnerLogo: page.isolatedSettings?.partnerLogo,
    partnerName: page.isolatedSettings?.partnerName,
    phone: page.isolatedSettings?.phone,
  };
}

export type LockedPageStub = ReturnType<typeof toLockedPageStub>;

export function pageUnlockCookieName(page: LandingPage): string {
  return `khb_page_${page.id.replace(/[^A-Za-z0-9_-]/g, '_')}`;
}

// Bound to the current PIN, so changing the PIN re-locks the page for everyone.
export function pageUnlockToken(page: LandingPage): string {
  const secret = process.env.SESSION_SECRET || 'khb-events-secret-salt-2026';
  return crypto.createHmac('sha256', secret).update(`page-unlock:${page.id}:${getPagePin(page)}`).digest('hex');
}

export function isCorrectPagePin(page: LandingPage, attempt: string): boolean {
  const pin = getPagePin(page);
  if (!pin) return true;
  const a = crypto.createHash('sha256').update(attempt.trim()).digest();
  const b = crypto.createHash('sha256').update(pin).digest();
  return crypto.timingSafeEqual(a, b);
}

export type PublicPageResult =
  | { kind: 'not_found' }
  | { kind: 'locked'; stub: LockedPageStub }
  | { kind: 'ok'; page: LandingPage | null };

/**
 * Loads a landing page for public rendering. Drafts are visible only to
 * admins (for previews), archived pages to nobody, and passcode-protected
 * pages only after the visitor unlocks them via /api/pages/unlock.
 * A missing page returns `{ kind: 'ok', page: null }` so routes with built-in
 * fallback content can still render.
 */
export async function loadPublicPage(slug: string): Promise<PublicPageResult> {
  const page = await getPageBySlug(slug);
  if (!page) return { kind: 'ok', page: null };

  if (page.status === 'archived') return { kind: 'not_found' };

  let isAdmin: boolean | null = null;
  const checkAdmin = async () => (isAdmin ??= await isAuthenticated());

  if (page.status === 'draft' && !(await checkAdmin())) return { kind: 'not_found' };

  if (getPagePin(page)) {
    const cookieStore = await cookies();
    const unlocked = cookieStore.get(pageUnlockCookieName(page))?.value === pageUnlockToken(page);
    if (!unlocked && !(await checkAdmin())) {
      return { kind: 'locked', stub: toLockedPageStub(page) };
    }
  }

  return { kind: 'ok', page: toPublicPage(page) };
}
