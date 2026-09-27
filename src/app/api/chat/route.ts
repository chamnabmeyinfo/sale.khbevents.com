import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIp, getClientIp } from '@/lib/rate-limit';
import { isLiveChatEnabled } from '@/lib/storage';
import { startWebChat } from '@/lib/web-chat';
import { visitorDetailFromRequest } from '@/lib/visitor-detail';
import { STAFF_COOKIE, rememberStaffCookie } from '@/lib/staff-cookie';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A visitor starts a live chat from a landing page. */
export async function POST(req: NextRequest) {
  if (!rateLimitByIp('webchat-start', req.headers, 5, 10 * 60 * 1000).allowed) {
    return NextResponse.json({ success: false, error: 'Too many chats from this address. Please try again in a few minutes.' }, { status: 429 });
  }
  if (!(await isLiveChatEnabled())) return NextResponse.json({ success: false, error: 'Live chat is off' }, { status: 403 });
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const pageSlug = typeof body.pageSlug === 'string' && /^[a-z0-9-]{1,120}$/i.test(body.pageSlug) ? body.pageSlug : 'general';
    const result = await startWebChat({
      pageSlug,
      lang: body.lang === 'kh' ? 'kh' : 'en',
      name: String(body.name || ''),
      phone: typeof body.phone === 'string' ? body.phone : undefined,
      text: String(body.text || ''),
      visitor: visitorDetailFromRequest(req.headers, req.cookies),
      visitorIp: getClientIp(req.headers),
      userAgent: req.headers.get('user-agent') || undefined,
      preferredStaffId: req.cookies.get(STAFF_COOKIE)?.value || undefined,
    });
    const res = NextResponse.json({ success: true, id: result.chat.id, token: result.chat.token, chat: result.view });
    if (result.staff) rememberStaffCookie(res, result.staff.id, result.rememberSeconds);
    return res;
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message || 'Could not start the chat' }, { status: 400 });
  }
}
