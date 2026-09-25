/**
 * One record per visit (session) to a landing page: where it came from, what device,
 * how long and how far the visitor read, what they clicked, whether they sent the form.
 * The campaign report and the AI analyst are built from these records.
 *
 * Stored durably in Supabase as one JSON row per page per day (`visits:<day>:<slug>`
 * in system_settings), so no database migration is needed; kept for 120 days.
 * No personal data: the ids are random, the IP address is never stored.
 * Pure helpers here; reading and writing are in storage.ts.
 */
import { inAppBrowserName, visitSources } from './popup-ads';
import { phnomPenhDay } from './popup-analytics';

export interface VisitRecord {
  /** Session id (per visit). */
  s: string;
  /** Visitor id (per browser), when known. */
  v?: string;
  /** Page slug. */
  p: string;
  /** First and last activity, epoch ms. */
  t0: number;
  t1: number;
  /** Channel: facebook, tiktok, telegram, instagram, google, youtube, messenger, referral, direct… */
  src: string;
  med?: string;
  cmp?: string;
  cnt?: string;
  /** First campaign that found this visitor (up to 30 days earlier), when different. */
  fcmp?: string;
  /** Host of the outside site that sent the visitor. */
  ref?: string;
  dev?: 'mobile' | 'tablet' | 'desktop';
  /** App whose built-in browser opened the page (Facebook, Telegram…). */
  app?: string;
  lang?: 'en' | 'kh';
  /** Visitor came before. */
  ret?: boolean;
  /** Seconds active, deepest scroll %. */
  sec?: number;
  sc?: number;
  /** Clicks on the main button and on Telegram. */
  cta?: number;
  tg?: number;
  /** Started filling the form / sent it. */
  fs?: boolean;
  lead?: boolean;
  /** Deepest section index reached and the number of sections. */
  sx?: number;
  sn?: number;
  /** Builder section ids seen. */
  seen?: string[];
}

export const VISIT_RETENTION_DAYS = 120;
export const MAX_VISITS_PER_ROW = 4000;

export const visitRowId = (day: string, slug: string) => `visits:${day}:${slug}`;

const clip = (v: unknown, n: number): string | undefined => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : undefined);
const int = (v: unknown, max: number): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(max, Math.round(v)) : undefined);

/** Channel name for a visit, the same names as the popup source rules use. */
export function visitChannel(input: { utmSource?: string; userAgent?: string; referrer?: string; ownHost?: string }): string {
  const sources = visitSources({ utmSource: input.utmSource, userAgent: input.userAgent, referrer: input.referrer, ownHost: input.ownHost });
  // utm_source wins, then the app, then the referring site.
  if (sources.length) {
    const first = sources[0];
    return first === 'messenger' ? 'facebook' : first;
  }
  if (input.referrer) {
    try {
      const host = new URL(input.referrer).hostname.toLowerCase();
      if (host && host !== (input.ownHost || '').toLowerCase()) return 'referral';
    } catch {}
  }
  return 'direct';
}

function refHost(referrer?: string, ownHost?: string): string | undefined {
  if (!referrer) return undefined;
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    return host && host !== (ownHost || '').toLowerCase().replace(/^www\./, '') ? host.slice(0, 80) : undefined;
  } catch {
    return undefined;
  }
}

export interface VisitInput {
  slug: string;
  sessionId?: string;
  visitorId?: string;
  returning?: boolean;
  eventType: string;
  eventData?: Record<string, unknown>;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string;
  lang?: 'en' | 'kh';
  ownHost?: string;
  nowMs: number;
}

/**
 * The visit record a page_view or session_summary beacon describes, or null for other
 * events and anonymous beacons. Campaign fields come from the first event of the visit.
 */
export function visitFromEvent(e: VisitInput): VisitRecord | null {
  if (e.eventType !== 'page_view' && e.eventType !== 'session_summary') return null;
  const s = clip(e.sessionId, 100);
  if (!s || s === 'anonymous' || s === 'server') return null;
  const app = e.userAgent ? inAppBrowserName(e.userAgent) : null;
  const rec: VisitRecord = {
    s,
    v: clip(e.visitorId, 60),
    p: e.slug,
    t0: e.nowMs,
    t1: e.nowMs,
    src: visitChannel({ utmSource: e.utmSource, userAgent: e.userAgent, referrer: e.referrer, ownHost: e.ownHost }),
    med: clip(e.utmMedium, 60)?.toLowerCase(),
    cmp: clip(e.utmCampaign, 100)?.toLowerCase(),
    cnt: clip(e.utmContent, 100),
    ref: refHost(e.referrer, e.ownHost),
    dev: e.deviceType,
    app: app || undefined,
    lang: e.lang,
    ret: e.returning === true || undefined,
  };
  if (e.eventType === 'session_summary') {
    const d = e.eventData || {};
    rec.sec = int(d.activeSeconds, 7200);
    rec.sc = int(d.maxScroll, 100);
    rec.cta = int(d.cta, 99);
    rec.tg = int(d.telegram, 99);
    rec.fs = d.formStarted === true || undefined;
    rec.lead = d.lead === true || undefined;
    rec.sx = typeof d.maxSection === 'number' && d.maxSection >= 0 ? int(d.maxSection, 60) : undefined;
    rec.sn = int(d.sectionCount, 60);
    rec.seen = Array.isArray(d.seen) ? d.seen.filter((x): x is string => typeof x === 'string' && /^[A-Za-z0-9_-]{1,60}$/.test(x)).slice(0, 40) : undefined;
    const fc = clip(d.firstCampaign, 100)?.toLowerCase();
    if (fc && fc !== rec.cmp) rec.fcmp = fc;
  }
  return rec;
}

/** Folds a newer beacon of the same visit into the stored record: keeps the landing facts, takes the deepest engagement. */
export function mergeVisit(old: VisitRecord, next: VisitRecord): VisitRecord {
  const max = (a?: number, b?: number) => (a === undefined ? b : b === undefined ? a : Math.max(a, b));
  const seen = Array.from(new Set([...(old.seen || []), ...(next.seen || [])])).slice(0, 40);
  return {
    ...old,
    v: old.v || next.v,
    t1: Math.max(old.t1, next.t1),
    // Campaign facts: the landing ones, unless the first beacon had none.
    src: old.src === 'direct' && next.src !== 'direct' ? next.src : old.src,
    med: old.med || next.med,
    cmp: old.cmp || next.cmp,
    cnt: old.cnt || next.cnt,
    fcmp: old.fcmp || next.fcmp,
    ref: old.ref || next.ref,
    dev: old.dev || next.dev,
    app: old.app || next.app,
    lang: next.lang || old.lang,
    ret: old.ret || next.ret,
    sec: max(old.sec, next.sec),
    sc: max(old.sc, next.sc),
    cta: max(old.cta, next.cta),
    tg: max(old.tg, next.tg),
    fs: old.fs || next.fs || undefined,
    lead: old.lead || next.lead || undefined,
    sx: max(old.sx, next.sx),
    sn: max(old.sn, next.sn),
    seen: seen.length ? seen : undefined,
  };
}

/** Adds or updates a visit in a day's list; the list is capped (oldest dropped). */
export function upsertVisit(list: VisitRecord[], rec: VisitRecord): VisitRecord[] {
  const i = list.findIndex((x) => x.s === rec.s);
  if (i >= 0) {
    const next = list.slice();
    next[i] = mergeVisit(list[i], rec);
    return next;
  }
  const out = [...list, rec];
  return out.length > MAX_VISITS_PER_ROW ? out.slice(out.length - MAX_VISITS_PER_ROW) : out;
}

/** Day keys (Phnom Penh time) from `days` ago up to today. */
export function dayKeys(days: number, nowMs: number): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(phnomPenhDay(nowMs - i * 86_400_000));
  return out;
}

export function parseVisitRow(raw: string | null | undefined): VisitRecord[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : Array.isArray(data?.s) ? data.s : [];
    return list.filter((x: unknown): x is VisitRecord => !!x && typeof x === 'object' && typeof (x as VisitRecord).s === 'string' && typeof (x as VisitRecord).p === 'string');
  } catch {
    return [];
  }
}
