import { NextRequest, NextResponse } from 'next/server';
import { getPageBySlug, getSettings, recordDirectContactRoute } from '@/lib/storage';
import { rateLimitByIp, getClientIp } from '@/lib/rate-limit';
import { resolveFallbackTelegramUrl } from '@/lib/round-robin';
import { STAFF_COOKIE, rememberStaffCookie } from '@/lib/staff-cookie';

/**
 * "Chat on Telegram" clicks from the landing pages.
 *
 * GET ?page=<slug>&redirect=true sends the visitor straight to the assigned
 * staff member's Telegram chat. Only the choice of person happens before the
 * redirect; alerts and logs are written after the response.
 *
 * A cookie remembers who the visitor was assigned to for as long as the admin's
 * "Remember visitor" setting says, so clicking again (or sending the form later)
 * lands on the same person without alerting a second one. When nobody can take the click, the visitor goes to the configured
 * contact account, or the bot as a last resort.
 */

export const runtime = 'nodejs';


async function fallbackUrl(slug: string): Promise<string> {
  const [page, settings] = await Promise.all([getPageBySlug(slug), getSettings()]);
  return resolveFallbackTelegramUrl({
    pageSlug: slug,
    contactUsername: page?.isolatedSettings?.telegramUsername || settings.telegramUsername,
  });
}

async function route(req: NextRequest, slug: string, redirectMode: boolean) {
  const visitorIp = getClientIp(req.headers);
  const userAgent = req.headers.get('user-agent') || undefined;
  const preferredStaffId = req.cookies.get(STAFF_COOKIE)?.value || undefined;

  // A returning visitor is sent to the same person without new alerts, so the
  // limit only caps how many *new* assignments one address can trigger.
  const limit = rateLimitByIp('rr-click', req.headers, 10, 10 * 60 * 1000);
  const routeResult = await recordDirectContactRoute({
    pageSlug: slug,
    visitorIp,
    userAgent,
    preferredStaffId,
    allowNewAssignment: limit.allowed
  });

  if (routeResult) {
    const res = redirectMode
      ? NextResponse.redirect(routeResult.targetTelegramUrl)
      : NextResponse.json({
          success: true,
          routed: true,
          repeat: routeResult.repeat,
          targetTelegramUrl: routeResult.targetTelegramUrl,
          staff: {
            id: routeResult.staff.id,
            name: routeResult.staff.name,
            username: routeResult.staff.telegramUsername,
            role: routeResult.staff.title
          },
          logId: routeResult.logId
        });
    rememberStaffCookie(res, routeResult.staff.id, routeResult.rememberSeconds);
    return res;
  }

  const targetTelegramUrl = await fallbackUrl(slug);
  if (redirectMode) {
    return NextResponse.redirect(targetTelegramUrl);
  }
  return NextResponse.json({
    success: true,
    routed: false,
    targetTelegramUrl,
    note: limit.allowed
      ? 'Round robin not active, direct contact routing disabled or no reachable staff; used the contact account'
      : 'Too many new assignments from this address; used the contact account'
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    return await route(req, searchParams.get('page') || 'home', searchParams.get('redirect') === 'true');
  } catch (error) {
    console.error('Round Robin route error:', error);
    return NextResponse.json({ success: false, error: 'Routing failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return await route(req, body.page || 'home', false);
  } catch (error) {
    console.error('Round Robin route error:', error);
    return NextResponse.json({ success: false, error: 'Routing failed' }, { status: 500 });
  }
}
