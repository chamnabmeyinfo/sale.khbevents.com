import { NextRequest, NextResponse } from 'next/server';
import { getLeads, createLead } from '@/lib/storage';
import { isAuthenticated } from '@/lib/auth';

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
  try {
    const body = await req.json();

    const fullName = (body.fullName || body.name || '').trim();

    if (!fullName || !body.phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

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
      customFields: body.customFields,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      utmContent: body.utmContent,
      referrer: body.referrer,
      ip,
      userAgent
    });

    return NextResponse.json({
      success: true,
      message: 'Inquiry received successfully! Our event consultant will contact you shortly.',
      leadId: newLead.id
    });
  } catch (error) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process inquiry. Please contact us directly.' },
      { status: 500 }
    );
  }
}
