import { NextRequest, NextResponse } from 'next/server';
import { recordTrackingEvent } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const { 
      slug, 
      eventType, 
      sessionId, 
      eventData, 
      referrer, 
      utmSource, 
      utmMedium, 
      utmCampaign, 
      utmContent, 
      utmTerm, 
      deviceType, 
      browser, 
      os, 
      lang 
    } = body;

    if (slug) {
      await recordTrackingEvent({
        slug,
        eventType: eventType || 'page_view',
        sessionId,
        eventData,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        deviceType,
        browser,
        os,
        lang,
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 200 });
  }
}
