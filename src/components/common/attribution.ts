/**
 * Where a visitor came from, kept for the whole visit and remembered for 30 days.
 *
 * Before this, every event read utm_* from the current address only, so a visitor who
 * landed from a Facebook ad and later sent the form from a clean address was counted as
 * "direct". Now:
 * - the visit's attribution (utm_*, click ids, the outside referrer) is saved when the
 *   visitor lands and used by every later event of the visit (sessionStorage);
 * - the first campaign that brought the visitor is kept for 30 days (localStorage), so a
 *   lead who comes back days later directly still credits the ad that found them;
 * - a random visitor id (no personal data) tells new and returning visitors apart.
 * Every storage call is guarded: private windows and in-app browsers may block storage.
 */

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
  ttclid?: string;
  gclid?: string;
  /** Outside site that sent the visitor (not our own pages). */
  referrer?: string;
}

const VISIT_KEY = 'khb_attr';
const FIRST_KEY = 'khb_ft';
const VISITOR_KEY = 'khb_vid';
const LAST_SESSION_KEY = 'khb_vlast';
const FIRST_TOUCH_DAYS = 30;

const clip = (v: string | null | undefined, n = 200) => (v ? v.slice(0, n) : undefined);

function fromUrl(): Attribution {
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      utmSource: clip(p.get('utm_source')),
      utmMedium: clip(p.get('utm_medium')),
      utmCampaign: clip(p.get('utm_campaign')),
      utmContent: clip(p.get('utm_content')),
      utmTerm: clip(p.get('utm_term')),
      fbclid: clip(p.get('fbclid'), 500),
      ttclid: clip(p.get('ttclid'), 500),
      gclid: clip(p.get('gclid'), 500),
    };
  } catch {
    return {};
  }
}

const hasCampaign = (a: Attribution) => Boolean(a.utmSource || a.utmCampaign || a.fbclid || a.ttclid || a.gclid);

function outsideReferrer(): string | undefined {
  try {
    const ref = document.referrer;
    if (!ref) return undefined;
    return new URL(ref).host === window.location.host ? undefined : ref.slice(0, 500);
  } catch {
    return undefined;
  }
}

function read<T>(storage: Storage | undefined, key: string): T | null {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: Storage | undefined, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {}
}

const local = () => (typeof window === 'undefined' ? undefined : window.localStorage);
const session = () => (typeof window === 'undefined' ? undefined : window.sessionStorage);

/** The visit's attribution: the address if it carries a campaign, else what the visit landed with. */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  const url = fromUrl();
  const stored = read<Attribution>(session(), VISIT_KEY);
  if (hasCampaign(url)) {
    const visit = { ...url, referrer: outsideReferrer() || stored?.referrer };
    write(session(), VISIT_KEY, visit);
    rememberFirstTouch(visit);
    return visit;
  }
  if (stored) return stored;
  const visit: Attribution = { referrer: outsideReferrer() };
  write(session(), VISIT_KEY, visit);
  return visit;
}

function rememberFirstTouch(a: Attribution) {
  const current = read<Attribution & { at: number }>(local(), FIRST_KEY);
  if (current && Date.now() - current.at < FIRST_TOUCH_DAYS * 86_400_000) return;
  write(local(), FIRST_KEY, { ...a, at: Date.now() });
}

/** The first campaign that brought this visitor in the last 30 days, if any. */
export function getFirstTouch(): Attribution | null {
  const ft = read<Attribution & { at: number }>(local(), FIRST_KEY);
  if (!ft || Date.now() - ft.at > FIRST_TOUCH_DAYS * 86_400_000) return null;
  const { at: _at, ...rest } = ft;
  void _at;
  return rest;
}

/** A random id for this browser (no personal data), and whether it visited before. */
export function getVisitor(sessionId: string): { visitorId: string; returning: boolean } {
  if (typeof window === 'undefined') return { visitorId: 'server', returning: false };
  let id = read<string>(local(), VISITOR_KEY);
  const isNew = !id;
  if (!id) {
    id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    write(local(), VISITOR_KEY, id);
  }
  const last = read<string>(local(), LAST_SESSION_KEY);
  const returning = !isNew && Boolean(last) && last !== sessionId;
  if (last !== sessionId) write(local(), LAST_SESSION_KEY, sessionId);
  // Keep the answer stable for the whole visit.
  const key = `khb_ret_${sessionId}`;
  const known = read<boolean>(session(), key);
  if (known !== null) return { visitorId: id, returning: known };
  write(session(), key, returning);
  return { visitorId: id, returning };
}

/** Values the lead form sends so a lead can be tied to its visit and its ad. */
export function leadAttribution(sessionId: string): Attribution & { firstTouch?: Attribution; visitorId: string; sessionId: string } {
  const a = getAttribution();
  const ft = getFirstTouch();
  return { ...a, firstTouch: ft && hasCampaign(ft) ? ft : undefined, visitorId: getVisitor(sessionId).visitorId, sessionId };
}

/** A unique id for one conversion, shared by the browser pixel and the server, so the ad platforms count it once. */
export function newEventId(prefix = 'lead'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
