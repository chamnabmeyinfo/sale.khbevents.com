import { NextRequest, NextResponse } from 'next/server';
import { recordDirectContactRoute, getRoundRobinSettings } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('page') || 'home';
    const redirectMode = searchParams.get('redirect') === 'true';

    const forwarded = req.headers.get('x-forwarded-for');
    const visitorIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || undefined;

    const routeResult = await recordDirectContactRoute({
      pageSlug: slug,
      visitorIp,
      userAgent
    });

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

    // Fallback to default Telegram channel / support
    const settings = await getRoundRobinSettings();
    const defaultUsername = 'khb_sale_admin_bot';
    const fallbackUrl = `https://t.me/${defaultUsername}?start=khb_${slug}`;

    if (redirectMode) {
      return NextResponse.redirect(fallbackUrl);
    }

    return NextResponse.json({
      success: true,
      routed: false,
      targetTelegramUrl: fallbackUrl,
      note: 'Round robin not active or direct contact routing disabled, used default Telegram'
    });
  } catch (error: any) {
    console.error('Round Robin route error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Routing failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = body.page || 'home';

    const forwarded = req.headers.get('x-forwarded-for');
    const visitorIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || undefined;

    const routeResult = await recordDirectContactRoute({
      pageSlug: slug,
      visitorIp,
      userAgent
    });

    if (routeResult) {
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

    return NextResponse.json({
      success: true,
      routed: false,
      targetTelegramUrl: `https://t.me/khb_sale_admin_bot?start=khb_${slug}`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Routing failed' },
      { status: 500 }
    );
  }
}
