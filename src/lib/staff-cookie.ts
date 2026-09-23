import type { NextResponse } from 'next/server';

/** Cookie that keeps a visitor with the salesperson they were first given. */
export const STAFF_COOKIE = 'khb_rr_staff';

/** Sets (or, when the memory is off, clears) the salesperson cookie on a response. */
export function rememberStaffCookie(res: NextResponse, staffId: string, maxAgeSeconds: number): void {
  if (maxAgeSeconds <= 0) {
    res.cookies.set(STAFF_COOKIE, '', { maxAge: 0, path: '/' });
    return;
  }
  res.cookies.set(STAFF_COOKIE, staffId, {
    maxAge: maxAgeSeconds,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  });
}
