import { NextRequest, NextResponse } from 'next/server';
import { recordDirectContactRoute } from '@/lib/storage';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const FALLBACK_BOT_USERNAME = 'khb_sale_admin_bot';

function fallbackUrl(slug: string) {
  // Telegram deep-link payloads only allow [A-Za-z0-9_-], max 64 chars.
  const payload = `khb_${slug}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 64);
  return `https://t.me/${FALLBACK_BOT_USERNAME}?start=${payload}`;
}

async function route(req: NextRequest, slug: string, redirectMode: boolean) {
  const visitorIp = getClientIp(req.headers);
  const userAgent = req.headers.get('user-agent') || undefined;

  // Every routed click alerts staff on Telegram and writes a log entry, so
  // repeat clickers are sent to the bot without re-triggering the alerts.
  const limit = rateLimit(`rr-click:${visitorIp}`, 10, 10 * 60 * 1000);
  const routeResult = limit.allowed
    ? await recordDirectContactRoute({ pageSlug: slug, visitorIp, userAgent })
    : null;

  if (routeResult) {
    if (redirectMode) {
      return NextResponse.redirect(routeResult.targetTelegramUrl);
    }
    return NextResponse.json({
      success: true,
      routed: true,
      targetTelegramUrl: routeResult.targetTelegramUrl,
      staff: {
        id: routeResult.staff.id,
        name: routeResult.staff.name,
        username: routeResult.staff.telegramUsername,
        role: routeResult.staff.title
      },
      logId: routeResult.logId
    });
  }

  const targetTelegramUrl = fallbackUrl(slug);
  if (redirectMode) {
    return NextResponse.redirect(targetTelegramUrl);
  }
  return NextResponse.json({
    success: true,
    routed: false,
    targetTelegramUrl,
    note: 'Round robin not active or direct contact routing disabled, used default Telegram'
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
