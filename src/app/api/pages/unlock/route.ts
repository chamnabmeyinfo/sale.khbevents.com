import { NextRequest, NextResponse } from 'next/server';
import { getPageBySlug } from '@/lib/storage';
import {
  PAGE_UNLOCK_MAX_AGE_SECONDS,
  getPagePin,
  isCorrectPagePin,
  pageUnlockCookieName,
  pageUnlockToken,
} from '@/lib/page-access';
import { rateLimit, rateLimitByIp, tooManyRequests } from '@/lib/rate-limit';

const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = typeof body.slug === 'string' ? body.slug.toLowerCase().trim() : '';
  const pin = typeof body.pin === 'string' ? body.pin : '';
  if (!slug || !pin) {
    return NextResponse.json({ success: false, error: 'Passcode is required' }, { status: 400 });
  }

  // Passcodes are short, so guessing is capped per visitor and per page.
  const byIp = rateLimitByIp('unlock:ip', req.headers, 10, WINDOW_MS);
  const byPage = rateLimit(`unlock:page:${slug}`, 100, WINDOW_MS);
  if (!byIp.allowed) return tooManyRequests(byIp, 'Too many attempts. Please wait 15 minutes and try again.');
  if (!byPage.allowed) return tooManyRequests(byPage, 'Too many attempts. Please wait 15 minutes and try again.');

  const page = await getPageBySlug(slug);
  if (!page || !getPagePin(page)) {
    return NextResponse.json({ success: false, error: 'Page not found' }, { status: 404 });
  }
  if (!isCorrectPagePin(page, pin)) {
    return NextResponse.json({ success: false, error: 'Invalid invitation passcode' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(pageUnlockCookieName(page), pageUnlockToken(page), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PAGE_UNLOCK_MAX_AGE_SECONDS,
    path: '/',
  });
  return res;
}
