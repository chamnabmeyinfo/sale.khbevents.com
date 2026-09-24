import { NextRequest, NextResponse } from 'next/server';
import { parseSmartReasons } from '@/lib/popup-ads';
import { recordTrackingEvent, RecordTrackingPayload } from '@/lib/storage';
import { TrackingEventType } from '@/lib/types';
import { rateLimitByIp } from '@/lib/rate-limit';

const EVENT_TYPES: readonly TrackingEventType[] = [
  'page_view', 'scroll_depth', 'cta_click', 'telegram_click', 'seat_select', 'form_submit', 'lang_toggle',
  'popup_view', 'popup_click', 'popup_close',
];
const POPUP_EVENT_TYPES: readonly TrackingEventType[] = ['popup_view', 'popup_click', 'popup_close'];
const DEVICE_TYPES = ['mobile', 'desktop', 'tablet'] as const;
const LANGS = ['en', 'kh'] as const;

/** A trimmed, length-capped string, or undefined for anything else. */
function str(value: unknown, max = 500): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export async function POST(req: NextRequest) {
  // Every event rewrites the database, so cap how fast one visitor can send them.
  if (!rateLimitByIp('track', req.headers, 60, 60 * 1000).allowed) {
    return NextResponse.json({ success: false }, { status: 429 });
  }

  try {
    // sendBeacon posts text/plain, so parse the raw body rather than trusting the content type.
    let body: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(await req.text());
      if (parsed && typeof parsed === 'object') body = parsed;
    } catch {
      // Ignore malformed beacons.
    }

    const slug = str(body.slug, 200);
    const eventType = oneOf(body.eventType, EVENT_TYPES) ?? 'page_view';
    let eventData = body.eventData && typeof body.eventData === 'object' ? (body.eventData as Record<string, unknown>) : undefined;
    if (POPUP_EVENT_TYPES.includes(eventType)) {
      // Popup beacons carry only a few known strings; anything else is dropped so the
      // event store cannot be filled with arbitrary payloads.
      const adId = str(eventData?.adId, 80);
      if (!adId) return NextResponse.json({ success: false }, { status: 200 });
      eventData = {
        adId,
        adName: str(eventData?.adName, 80),
        template: str(eventData?.template, 20),
        trigger: str(eventData?.trigger, 20),
        action: str(eventData?.action, 20),
        smartReasons: parseSmartReasons(eventData?.smartReasons).join(',') || undefined,
        smartScore: typeof eventData?.smartScore === 'number' && Number.isFinite(eventData.smartScore) ? Math.max(0, Math.min(200, Math.round(eventData.smartScore))) : undefined,
      };
    }
    if (slug) {
      const payload: RecordTrackingPayload = {
        slug,
        eventType,
        sessionId: str(body.sessionId, 100),
        eventData,
        referrer: str(body.referrer, 1000),
        utmSource: str(body.utmSource),
        utmMedium: str(body.utmMedium),
        utmCampaign: str(body.utmCampaign),
        utmContent: str(body.utmContent),
        utmTerm: str(body.utmTerm),
        deviceType: oneOf(body.deviceType, DEVICE_TYPES),
        browser: str(body.browser, 100),
        os: str(body.os, 100),
        lang: oneOf(body.lang, LANGS),
      };
      await recordTrackingEvent(payload);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Tracking error:', err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
