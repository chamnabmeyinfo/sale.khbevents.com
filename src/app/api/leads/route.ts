import { NextRequest, NextResponse } from 'next/server';
import { getLeads, createLead, getVisitorMemorySeconds } from '@/lib/storage';
import { STAFF_COOKIE, rememberStaffCookie } from '@/lib/staff-cookie';
import { isAuthenticated } from '@/lib/auth';
import { rateLimitByIp, tooManyRequests, getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageSlug = searchParams.get('pageSlug') || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  const leads = await getLeads({ pageSlug, status, search });
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimitByIp('lead', req.headers, 5, 10 * 60 * 1000);
  if (!limit.allowed) {
    return tooManyRequests(limit, 'You have sent several inquiries already. Please wait a few minutes, or contact us directly by phone or Telegram.');
  }

  try {
    const body = await req.json();

    const fullName = (body.fullName || body.name || '').trim();

    if (!fullName || !body.phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    const userAgent = req.headers.get('user-agent') || '';
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || '';
    const city = req.headers.get('x-vercel-ip-city') ? decodeURIComponent(req.headers.get('x-vercel-ip-city')!) : '';
    const region = req.headers.get('x-vercel-ip-country-region') || '';

    const customFields = { ...(body.customFields || {}) };
    if (country) customFields.visitorCountry = country;
    if (city) customFields.visitorCity = city;
    if (region) customFields.visitorRegion = region;

    const newLead = await createLead({
      landingPageSlug: body.landingPageSlug || 'general',
      landingPageTitle: body.landingPageTitle,
      fullName: fullName,
      email: body.email || '',
      phone: body.phone,
      company: body.company,
      eventType: body.eventType,
      estimatedDate: body.estimatedDate,
      guestCount: body.guestCount,
      budgetRange: body.budgetRange,
      packageInterest: body.packageInterest,
      message: body.message,
      customFields,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      utmContent: body.utmContent,
      referrer: body.referrer,
      ip,
      userAgent,
      preferredStaffId: req.cookies.get(STAFF_COOKIE)?.value || undefined
    });

    const res = NextResponse.json({
      success: true,
      message: 'Inquiry received successfully! Our event consultant will contact you shortly.',
      leadId: newLead.id
    });
    // Keep this visitor with the same salesperson for later clicks and forms.
    if (newLead.routing?.staffId) {
      rememberStaffCookie(res, newLead.routing.staffId, await getVisitorMemorySeconds());
    }
    return res;
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process inquiry. Please contact us directly.' },
      { status: 500 }
    );
  }
}
