import { NextRequest, NextResponse } from 'next/server';
import { getLeads, createLead, getVisitorMemorySeconds } from '@/lib/storage';
import { STAFF_COOKIE, rememberStaffCookie } from '@/lib/staff-cookie';
import { isAuthenticated } from '@/lib/auth';
import { rateLimitByIp, tooManyRequests, getClientIp } from '@/lib/rate-limit';
import { runAfterResponse } from '@/lib/after-response';
import { sendLeadConversions } from '@/lib/conversions-server';
import { isDemoLead } from '@/lib/demo-data';

const tidy = (v: unknown, n: number, re = /^[A-Za-z0-9._~-]+$/) => (typeof v === 'string' && v.length <= n && re.test(v) ? v : undefined);

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

    // Ties the lead to its visit (campaign report) and to the ad click (conversions).
    const tracking = body.tracking && typeof body.tracking === 'object' ? (body.tracking as Record<string, unknown>) : {};
    const eventId = tidy(tracking.eventId, 80);
    const visitSession = tidy(tracking.sessionId, 100);
    const visitorId = tidy(tracking.visitorId, 60);
    const firstCampaign = typeof tracking.firstCampaign === 'string' ? tracking.firstCampaign.trim().slice(0, 100).toLowerCase() : undefined;
    if (visitSession) customFields.visitSession = visitSession;
    if (visitorId) customFields.visitorId = visitorId;
    if (firstCampaign) customFields.firstCampaign = firstCampaign;

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

    // Server-side conversions for Meta and TikTok, after the answer is sent.
    if (eventId && !isDemoLead(newLead)) {
      const pageUrl = typeof tracking.pageUrl === 'string' && /^https?:\/\//.test(tracking.pageUrl) ? tracking.pageUrl.slice(0, 1000) : undefined;
      runAfterResponse(() => sendLeadConversions({
        eventId,
        eventTimeMs: Date.now(),
        pageSlug: newLead.landingPageSlug,
        pageUrl,
        referrer: typeof body.referrer === 'string' ? body.referrer.slice(0, 1000) : undefined,
        phone: newLead.phone,
        email: newLead.email,
        fullName: newLead.fullName,
        visitorId,
        ip: ip && ip !== 'unknown' ? ip : undefined,
        userAgent: userAgent || undefined,
        country: country || undefined,
        fbclid: tidy(tracking.fbclid, 500),
        ttclid: tidy(tracking.ttclid, 500),
        fbp: tidy(req.cookies.get('_fbp')?.value, 200),
        fbc: tidy(req.cookies.get('_fbc')?.value, 600),
        ttp: tidy(req.cookies.get('_ttp')?.value, 200),
      }));
    }

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
