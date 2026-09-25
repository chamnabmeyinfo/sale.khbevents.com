/**
 * Server-side conversions: when a lead arrives, the server tells Meta (Conversions API)
 * and TikTok (Events API) directly, as well as the browser pixel.
 *
 * Why: the browser pixel misses many leads (Telegram, Facebook and Instagram in-app
 * browsers, iPhones, ad blockers). The ad platforms then optimise for fewer, wrong
 * people. With the server event the lead is counted; the shared event id makes the
 * platform count it once when both arrive.
 *
 * Personal data leaves only as SHA-256 hashes (phone, e-mail, visitor id), the way both
 * platforms require. Nothing is sent for demo leads, pages without an enabled pixel,
 * or when the access token is not set.
 *
 * Tokens live in Vercel environment variables (never in the database or the repo):
 *   META_CAPI_ACCESS_TOKEN      Events Manager → the pixel → Settings → Conversions API → Generate access token
 *   TIKTOK_EVENTS_ACCESS_TOKEN  TikTok Events Manager → the pixel → Settings → Generate access token
 * Optional test codes (Events Manager "Test events") are set in Admin → Campaigns → Tracking setup.
 */
import crypto from 'crypto';

export const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';

export interface ConversionLead {
  eventId: string;
  eventTimeMs: number;
  pageSlug: string;
  pageTitle?: string;
  pageUrl?: string;
  referrer?: string;
  phone?: string;
  email?: string;
  fullName?: string;
  visitorId?: string;
  ip?: string;
  userAgent?: string;
  country?: string;
  fbclid?: string;
  ttclid?: string;
  /** Cookies set by the pixels in the browser. */
  fbp?: string;
  fbc?: string;
  ttp?: string;
  value?: number;
  currency?: string;
}

export interface ConversionResult {
  at: string;
  platform: 'meta' | 'tiktok';
  page: string;
  ok: boolean;
  status?: number;
  test?: boolean;
  message?: string;
}

export const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

/** Phone digits with the country code, Cambodia by default: "012 345 678" → "85512345678". */
export function normalizePhone(raw: string | undefined, defaultCountry = '855'): string | undefined {
  if (!raw) return undefined;
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = defaultCountry + d.slice(1);
  else if (d.length <= 9) d = defaultCountry + d;
  d = d.replace(/\D/g, '');
  return d.length >= 8 && d.length <= 15 ? d : undefined;
}

export const normalizeEmail = (raw?: string) => {
  const e = (raw || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : undefined;
};

/** First and last name, lower-case letters only (Meta's normalisation). */
export function nameParts(full?: string): { fn?: string; ln?: string } {
  const parts = (full || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const clean = (s?: string) => (s ? s.normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '') || undefined : undefined);
  if (!parts.length) return {};
  return { fn: clean(parts[0]), ln: parts.length > 1 ? clean(parts[parts.length - 1]) : undefined };
}

/** Meta click id cookie value from an fbclid, when the pixel could not set `_fbc` itself. */
export const fbcFromClickId = (fbclid: string | undefined, ms: number) => (fbclid ? `fb.1.${ms}.${fbclid}` : undefined);

export function metaPayload(lead: ConversionLead, testCode?: string) {
  const ph = normalizePhone(lead.phone);
  const em = normalizeEmail(lead.email);
  const { fn, ln } = nameParts(lead.fullName);
  const user_data: Record<string, unknown> = {
    ...(ph ? { ph: [sha256(ph)] } : {}),
    ...(em ? { em: [sha256(em)] } : {}),
    ...(fn ? { fn: [sha256(fn)] } : {}),
    ...(ln ? { ln: [sha256(ln)] } : {}),
    ...(lead.visitorId ? { external_id: [sha256(lead.visitorId)] } : {}),
    ...(lead.country ? { country: [sha256(lead.country.toLowerCase())] } : {}),
    ...(lead.ip ? { client_ip_address: lead.ip } : {}),
    ...(lead.userAgent ? { client_user_agent: lead.userAgent } : {}),
    ...(lead.fbp ? { fbp: lead.fbp } : {}),
    ...((lead.fbc || fbcFromClickId(lead.fbclid, lead.eventTimeMs)) ? { fbc: lead.fbc || fbcFromClickId(lead.fbclid, lead.eventTimeMs) } : {}),
  };
  return {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(lead.eventTimeMs / 1000),
        event_id: lead.eventId,
        action_source: 'website',
        ...(lead.pageUrl ? { event_source_url: lead.pageUrl } : {}),
        user_data,
        custom_data: {
          content_name: lead.pageTitle || lead.pageSlug,
          ...(lead.value ? { value: lead.value, currency: lead.currency || 'USD' } : {}),
        },
      },
    ],
    ...(testCode ? { test_event_code: testCode } : {}),
  };
}

export function tiktokPayload(lead: ConversionLead, pixelCode: string, testCode?: string) {
  const ph = normalizePhone(lead.phone);
  const em = normalizeEmail(lead.email);
  return {
    event_source: 'web',
    event_source_id: pixelCode,
    ...(testCode ? { test_event_code: testCode } : {}),
    data: [
      {
        event: 'SubmitForm',
        event_time: Math.floor(lead.eventTimeMs / 1000),
        event_id: lead.eventId,
        user: {
          // TikTok hashes the phone in E.164 form, with the plus sign.
          ...(ph ? { phone: sha256(`+${ph}`) } : {}),
          ...(em ? { email: sha256(em) } : {}),
          ...(lead.visitorId ? { external_id: sha256(lead.visitorId) } : {}),
          ...(lead.ttclid ? { ttclid: lead.ttclid } : {}),
          ...(lead.ttp ? { ttp: lead.ttp } : {}),
          ...(lead.ip ? { ip: lead.ip } : {}),
          ...(lead.userAgent ? { user_agent: lead.userAgent } : {}),
        },
        page: { ...(lead.pageUrl ? { url: lead.pageUrl } : {}), ...(lead.referrer ? { referrer: lead.referrer } : {}) },
        properties: {
          content_name: lead.pageTitle || lead.pageSlug,
          ...(lead.value ? { value: lead.value, currency: lead.currency || 'USD' } : {}),
        },
      },
    ],
  };
}

const short = (s: string) => s.replace(/\s+/g, ' ').slice(0, 240);

export async function sendMetaLead(pixelId: string, lead: ConversionLead, opts: { token: string; testCode?: string }): Promise<ConversionResult> {
  const base: ConversionResult = { at: new Date().toISOString(), platform: 'meta', page: lead.pageSlug, ok: false, test: Boolean(opts.testCode) || undefined };
  try {
    // The token goes in the body, never in the address, so it cannot end up in a log line.
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...metaPayload(lead, opts.testCode), access_token: opts.token }),
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    let msg: string | undefined;
    try {
      const json = JSON.parse(text);
      msg = json?.error?.message || (typeof json?.events_received === 'number' ? `received ${json.events_received}` : undefined);
    } catch {
      msg = text;
    }
    return { ...base, ok: res.ok, status: res.status, message: msg ? short(msg) : undefined };
  } catch (err) {
    return { ...base, message: short(err instanceof Error ? err.message : String(err)) };
  }
}

export async function sendTikTokLead(pixelCode: string, lead: ConversionLead, opts: { token: string; testCode?: string }): Promise<ConversionResult> {
  const base: ConversionResult = { at: new Date().toISOString(), platform: 'tiktok', page: lead.pageSlug, ok: false, test: Boolean(opts.testCode) || undefined };
  try {
    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': opts.token },
      body: JSON.stringify(tiktokPayload(lead, pixelCode, opts.testCode)),
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    let ok = res.ok;
    let msg: string | undefined;
    try {
      const json = JSON.parse(text);
      // TikTok answers 200 with a non-zero code when the event is rejected.
      if (typeof json?.code === 'number' && json.code !== 0) ok = false;
      msg = json?.message;
    } catch {
      msg = text;
    }
    return { ...base, ok, status: res.status, message: msg ? short(msg) : undefined };
  } catch (err) {
    return { ...base, message: short(err instanceof Error ? err.message : String(err)) };
  }
}

/** Whether the tokens are set (never their values). */
export function conversionTokens(): { meta: boolean; tiktok: boolean } {
  return { meta: Boolean(process.env.META_CAPI_ACCESS_TOKEN), tiktok: Boolean(process.env.TIKTOK_EVENTS_ACCESS_TOKEN) };
}

export interface ConversionSettings {
  metaTestCode?: string;
  tiktokTestCode?: string;
}

export function parseConversionSettings(raw: unknown): ConversionSettings {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const code = (v: unknown) => (typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v.trim()) ? v.trim() : undefined);
  return { metaTestCode: code(o.metaTestCode), tiktokTestCode: code(o.tiktokTestCode) };
}
